import { randomUUID } from "node:crypto";

import type {
  ChatResponse,
  ChatUiAction,
  Citation,
  OutboundMessage,
  PracticeAction,
  ResourceCard,
} from "@/contracts/api";
import type { IncomingTurn, TurnResult } from "@/contracts/channels";
import { withImmediateTransaction } from "@/infrastructure/db/client";
import {
  listTaskCards,
  listTaskPrerequisites,
  recommendNextTasks,
} from "@/modules/checklist/service";
import {
  configuredConversationModel,
  type AssistantResponse,
  type ConversationAssistantInput,
  type ConversationMessage,
  type ConversationModel,
  type GroundedResource,
  type ModelFailureReason,
} from "@/modules/model";
import {
  listAcceptedMemories,
  MemoryValidationError,
  proposeMemory,
} from "@/modules/memory";
import {
  formatPracticeForText,
  getPracticeById,
  getPracticeCatalog,
  NEXT_MOVE_APP_URL,
  selectPractice,
} from "@/modules/practices";
import { listRetrievalRecords } from "@/modules/retrieval/repository";
import { searchResources } from "@/modules/resources/service";
import {
  crisisDraft,
  unavailableCrisisText,
} from "@/modules/safety/crisis-support";

import {
  acceptInboundMessage,
  commitAssistantReply,
  listMessages,
  type AssistantDraft,
  rowToChatMessage,
} from "./repository";
import { onboardingMessage } from "./onboarding";

type StoredMessageRow = {
  id: string;
  conversation_id: string;
  client_message_id: string | null;
  in_reply_to_message_id: string | null;
  role: "participant" | "assistant";
  channel: "web" | "sms";
  text: string;
  metadata_json: string;
  created_at: string;
};

type ConversationState = {
  recentMessages: ConversationMessage[];
  tasks: ConversationAssistantInput["tasks"];
  activeTaskId: string | null;
  eligibleTaskIds: string[];
  acceptedMemories: ConversationAssistantInput["acceptedMemories"];
  activeResourceId: string | null;
};

type ResourceContext = {
  resources: GroundedResource[];
  citations: Citation[];
};

function conversationState(
  userId: string,
  input: IncomingTurn,
): ConversationState {
  const messages = listMessages(userId, 16);
  const last = messages.at(-1);
  const priorMessages =
    last?.role === "participant" && last.text === input.text
      ? messages.slice(0, -1)
      : messages;
  const tasks = listTaskCards(userId);
  const unfinishedTaskIds = new Set(
    tasks
      .filter(
        (task) =>
          task.status !== "completed" && task.status !== "not_applicable",
      )
      .map((task) => task.id),
  );
  const activeTaskId = [...priorMessages]
    .reverse()
    .filter((message) => message.role === "assistant")
    .flatMap((message) =>
      message.actions.flatMap((action) =>
        action.type === "next_task" ||
        action.type === "confirm_task_completion"
          ? [action.task.id]
          : [],
      ),
    )
    .find((taskId) => unfinishedTaskIds.has(taskId)) ?? null;
  const prerequisites = listTaskPrerequisites();
  const allowedApprovalStatuses =
    process.env.DEMO_MODE === "true"
      ? (["approved", "demo_only"] as const)
      : (["approved"] as const);
  const resourceIds = new Set(
    listRetrievalRecords({
      namespace: "community_resources",
      language: "en",
      allowedApprovalStatuses: [...allowedApprovalStatuses],
    }).map((resource) => resource.sourceId),
  );
  const activeResourceId = [...priorMessages]
    .reverse()
    .filter((message) => message.role === "assistant")
    .flatMap((message) => [
      ...message.actions.flatMap((action) =>
        action.type === "resources"
          ? action.resources.map((resource) => resource.id)
          : [],
      ),
      ...message.citations.map((citation) => citation.resourceId),
    ])
    .find((resourceId) => resourceIds.has(resourceId)) ?? null;

  return {
    recentMessages:
      priorMessages.length > 0
        ? priorMessages.map((message) => ({
            role: message.role,
            text: message.text,
          }))
        : [{ role: "assistant", text: onboardingMessage() }],
    tasks: tasks.map((task) => ({
      ...task,
      prerequisiteIds: prerequisites[task.id] ?? [],
    })),
    activeTaskId,
    eligibleTaskIds: recommendNextTasks(userId, tasks.length).map(
      (task) => task.id,
    ),
    acceptedMemories: listAcceptedMemories(userId).map((memory) => ({
      category: memory.category,
      value: memory.value,
    })),
    activeResourceId,
  };
}

function combineResourceResults(
  results: Array<Awaited<ReturnType<typeof searchResources>>>,
): ResourceContext {
  const resources = new Map<string, ResourceCard>();
  const citations = new Map<string, Citation>();
  for (const result of results) {
    for (const resource of result.resources) resources.set(resource.id, resource);
    for (const citation of result.citations) {
      if (!citations.has(citation.resourceId)) {
        citations.set(citation.resourceId, citation);
      }
    }
  }

  return {
    resources: [...resources.values()].map((resource) => ({
      ...resource,
      sourceUrl:
        citations.get(resource.id)?.sourceUri ?? resource.url ?? "",
    })),
    citations: [...citations.values()],
  };
}

/**
 * Keep whole records for the MVP. Semantic retrieval selects up to two likely
 * records. A previous active record carries forward only when the new query
 * retrieves it again, preventing stale resource context from hijacking a
 * clear checklist or topic change.
 */
async function retrieveResourceContext(
  query: string,
): Promise<ResourceContext> {
  const semantic = await searchResources(query, 2);
  return combineResourceResults([semantic]);
}

function mindfulnessCandidates(
  userText: string,
): ConversationAssistantInput["practices"] {
  const practices = [...getPracticeCatalog().practices];
  const preferred = selectPractice({ userText }).practice;
  const preferredTags = new Set(preferred.tags);
  const related = practices.filter(
    (practice) =>
      practice.id !== preferred.id &&
      practice.tags.some((tag) => preferredTags.has(tag)),
  );
  const candidates = [
    preferred,
    ...related,
    ...practices.filter(
      (practice) =>
        practice.id !== preferred.id &&
        !related.some((candidate) => candidate.id === practice.id),
    ),
  ].slice(0, 3);

  return candidates.map((practice) => ({
    id: practice.id,
    title: practice.title,
    tags: [...practice.tags],
  }));
}

function modelUnavailableDraft(): AssistantDraft {
  return {
    text: `I’m having trouble connecting right now. Please try again soon. ${unavailableCrisisText()}`,
    actions: [],
    citations: [],
    fallbackUsed: true,
  };
}

function assistantFailureDraft(reason: ModelFailureReason): AssistantDraft {
  return {
    text:
      reason === "invalid_response"
        ? "I’m having trouble putting that answer together. Please try once more."
        : "I’m having trouble connecting right now. Please try again soon.",
    actions: [],
    citations: [],
    fallbackUsed: true,
  };
}

const BOUNDLESS_SUPPORT_URL = "https://boundlessfreedom.org/get-support";

function boundlessSupportDraft(missingContext = false): AssistantDraft {
  return {
    text: `I don’t have enough verified information. Submit request on Boundless Freedom Project: ${BOUNDLESS_SUPPORT_URL}`,
    actions: [
      {
        type: "handoff",
        reason: missingContext
          ? "The reviewed information did not answer this question."
          : "You asked to connect with a person.",
        demoOnly: true,
      },
    ],
    citations: [
      {
        resourceId: "boundless-freedom-support",
        title: "Submit a Boundless Freedom Project support request",
        sourceUri: BOUNDLESS_SUPPORT_URL,
        reviewedAt: "2026-10-25",
      },
    ],
    fallbackUsed: missingContext,
  };
}

function practiceAction(practiceId: string): {
  action: PracticeAction;
  fullText: string;
} | null {
  const practice = getPracticeById(practiceId);
  if (!practice) return null;
  const delivery = formatPracticeForText({
    practice,
    matchedTags: [],
    fallbackUsed: false,
  });
  return {
    action: {
      type: "practice",
      practiceId: delivery.practiceId,
      title: delivery.title,
      durationSeconds: delivery.durationSeconds,
      fallbackText: delivery.instructionText,
    },
    fullText: delivery.instructionText,
  };
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function withLeadingEmoji(text: string, emoji: "📌" | "✅"): string {
  const trimmed = text.trim();
  if (["📌", "✅", "🌿"].some((candidate) => trimmed.includes(candidate))) {
    return trimmed;
  }
  return wordCount(trimmed) < 30 ? `${emoji} ${trimmed}` : trimmed;
}

function participantText(response: AssistantResponse): string {
  return response.followUpQuestion
    ? `${response.text.trim()} ${response.followUpQuestion.trim()}`
    : response.text.trim();
}

function mindfulnessMessage(introduction: string, instruction: string): string {
  const practiceBody = `${instruction}\n\nOpen: ${NEXT_MOVE_APP_URL}`;
  const practice = wordCount(`🌿 ${practiceBody}`) <= 30
    ? `🌿 ${practiceBody}`
    : practiceBody;
  const firstSentence =
    (introduction.match(/[^.!?]+[.!?]+/)?.[0] ?? introduction).trim();
  return wordCount(`${firstSentence} ${practice}`) <= 30
    ? `${firstSentence}\n\n${practice}`
    : practice;
}

function citationsForResponse(
  response: AssistantResponse,
  context: ResourceContext,
): Citation[] | null {
  const allowed = new Map(
    context.citations.map((citation) => [citation.resourceId, citation]),
  );
  const requested = [...new Set(response.sourceResourceIds)];
  if (requested.some((resourceId) => !allowed.has(resourceId))) return null;
  return requested.flatMap((resourceId) => {
    const citation = allowed.get(resourceId);
    if (!citation) return [];
    const resource = context.resources.find(
      (candidate) => candidate.id === resourceId,
    );
    if (!resource?.url || resource.url === citation.sourceUri) {
      return [citation];
    }
    return [
      citation,
      {
        resourceId,
        title: `${resource.title} — official action page`,
        sourceUri: resource.url,
        reviewedAt: citation.reviewedAt,
      },
    ];
  });
}

function draftFromAssistant(
  userId: string,
  response: AssistantResponse,
  resourceContext: ResourceContext,
): AssistantDraft {
  if (response.safety) return crisisDraft(response.safety);
  if (response.handoffRequested) return boundlessSupportDraft();

  const citations = citationsForResponse(response, resourceContext);
  if (!citations) {
    return boundlessSupportDraft(true);
  }

  if (response.practiceId) {
    const practice = practiceAction(response.practiceId);
    if (!practice) return assistantFailureDraft("invalid_response");
    return {
      text: mindfulnessMessage(response.text, practice.fullText),
      actions: [practice.action],
      citations: [],
      fallbackUsed: false,
    };
  }

  if (response.memoryProposal) {
    try {
      const proposal = proposeMemory(userId, response.memoryProposal);
      if (proposal.memory.status === "accepted") {
        return {
          text: "I already have that saved. You can ask what I remember at any time.",
          actions: [],
          citations,
          fallbackUsed: false,
        };
      }
      return {
        text: participantText(response),
        actions: [
          {
            type: "confirm_memory",
            memory: {
              id: proposal.memory.id,
              category: proposal.memory.category,
              value: proposal.memory.value,
              status: proposal.memory.status,
            },
          },
        ],
        citations,
        fallbackUsed: false,
      };
    } catch (error) {
      if (error instanceof MemoryValidationError) {
        return {
          text: "I can’t save sensitive details. I can remember a general preference, goal, language, safe contact method, or access need after you confirm.",
          actions: [],
          citations: [],
          fallbackUsed: false,
        };
      }
      throw error;
    }
  }

  // A factual resource answer stands on its own. The model may personalize its
  // wording with checklist context, but it cannot add a second checklist card
  // unless the participant asked for checklist guidance in a separate turn.
  if (citations.length > 0) {
    return {
      text: withLeadingEmoji(participantText(response), "📌"),
      actions: [],
      citations,
      fallbackUsed: false,
    };
  }

  if (response.completionTaskId) {
    const task = listTaskCards(userId).find(
      (candidate) => candidate.id === response.completionTaskId,
    );
    if (!task) {
      return {
        text: "I want to update the right item. Which checklist step did you finish?",
        actions: [],
        citations,
        fallbackUsed: true,
      };
    }
    if (task.status === "completed") {
      return {
        text: `“${task.title}” is already marked complete.`,
        actions: [],
        citations,
        fallbackUsed: false,
      };
    }
    if (!task.eligible) {
      return {
        text: `“${task.title}” still depends on an earlier checklist step.`,
        actions: [],
        citations,
        fallbackUsed: false,
      };
    }
    return {
      text: withLeadingEmoji(participantText(response), "✅"),
      actions: [{ type: "confirm_task_completion", task }],
      citations,
      fallbackUsed: false,
    };
  }

  if (response.recommendedTaskId) {
    const task = recommendNextTasks(userId, listTaskCards(userId).length).find(
      (candidate) => candidate.id === response.recommendedTaskId,
    );
    if (!task) {
      return {
        text: "That step is not available yet. I can help choose from the steps that are ready now.",
        actions: [],
        citations,
        fallbackUsed: true,
      };
    }
    return {
      text: withLeadingEmoji(participantText(response), "📌"),
      actions: [{ type: "next_task", task }],
      citations,
      fallbackUsed: false,
    };
  }

  return {
    text: participantText(response),
    actions: [],
    citations,
    fallbackUsed: false,
  };
}

export async function processChat(
  userId: string,
  input: { clientMessageId: string; text: string },
): Promise<ChatResponse> {
  const accepted = acceptInboundMessage(
    userId,
    input.clientMessageId,
    input.text,
    "web",
  );
  if (accepted.previousReply) {
    return {
      message: accepted.previousReply.message,
      meta: {
        requestId: accepted.previousReply.requestId,
        fallbackUsed: accepted.previousReply.message.fallbackUsed,
      },
    };
  }

  const requestId = randomUUID();
  const result = await processConversationTurn({
    idempotencyKey: input.clientMessageId,
    channel: "web",
    participantId: userId,
    text: input.text,
    receivedAt: new Date().toISOString(),
  });
  const committed = commitAssistantReply(accepted, result, requestId);
  return {
    message: committed.message,
    meta: {
      requestId: committed.requestId,
      fallbackUsed: committed.message.fallbackUsed,
    },
  };
}

/**
 * Channel-neutral conversation core. A dedicated safety gate runs before the
 * persona-driven assistant sees checklist, memory, retrieval, and practices.
 */
export async function processConversationTurn(
  input: IncomingTurn,
  dependencies: { model?: ConversationModel } = {},
): Promise<TurnResult> {
  const model = dependencies.model ?? configuredConversationModel();
  const state = conversationState(input.participantId, input);
  const safety = await model.assessSafety({
    latestUserMessage: input.text,
    recentMessages: state.recentMessages.slice(-6),
  });
  if (!safety.ok) {
    console.warn(
      `Safety classifier failed (${safety.reason}) using ${safety.model}.`,
    );
    return modelUnavailableDraft();
  }
  if (safety.decision.safetyConcern && safety.decision.assessment) {
    return crisisDraft(safety.decision.assessment);
  }

  const resources = await retrieveResourceContext(input.text);
  const activeResourceId = resources.resources.some(
    (resource) => resource.id === state.activeResourceId,
  )
    ? state.activeResourceId
    : null;
  const practices = mindfulnessCandidates(input.text);
  const result = await model.respond({
    channel: input.channel,
    latestUserMessage: input.text,
    recentMessages: state.recentMessages.slice(-4),
    tasks: state.tasks,
    activeTaskId: state.activeTaskId,
    eligibleTaskIds: state.eligibleTaskIds,
    acceptedMemories: state.acceptedMemories,
    activeResourceId,
    retrievedResources: resources.resources,
    practices,
  });
  if (!result.ok) {
    console.warn(
      `Conversation assistant failed (${result.reason}) using ${result.model}.`,
    );
    return assistantFailureDraft(result.reason);
  }
  return draftFromAssistant(input.participantId, result.response, resources);
}

function localDate(timeZone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createMorningCheckIn(
  userId: string,
  timeZone: string,
  now = new Date(),
): OutboundMessage {
  const date = localDate(timeZone, now);
  return withImmediateTransaction((db) => {
    const existing = db.prepare(`
      SELECT m.*
      FROM outbound_messages o
      JOIN messages m ON m.id = o.message_id
      WHERE o.user_id = ? AND o.kind = 'morning_check_in' AND o.local_date = ?
    `).get(userId, date) as StoredMessageRow | undefined;
    if (existing) {
      return {
        message: rowToChatMessage(existing),
        kind: "morning_check_in" as const,
        localDate: date,
      };
    }

    const conversation = db.prepare(
      "SELECT id FROM conversations WHERE user_id = ?",
    ).get(userId) as { id: string } | undefined;
    if (!conversation) throw new Error("Conversation not found");

    const actions: ChatUiAction[] = [];
    const text = "☀️ Good morning. How are you feeling? We can take a one-minute pause or choose one small step.";
    const id = randomUUID();
    const createdAt = now.toISOString();
    db.prepare(`
      INSERT INTO messages
        (id, conversation_id, client_message_id, in_reply_to_message_id,
         role, kind, text, metadata_json, created_at, channel)
      VALUES (?, ?, NULL, NULL, 'assistant', 'proactive', ?, ?, ?, 'web')
    `).run(
      id,
      conversation.id,
      text,
      JSON.stringify({ actions, citations: [], fallbackUsed: false }),
      createdAt,
    );
    db.prepare(`
      INSERT INTO outbound_messages
        (id, user_id, message_id, kind, local_date, created_at)
      VALUES (?, ?, ?, 'morning_check_in', ?, ?)
    `).run(randomUUID(), userId, id, date, createdAt);

    return {
      message: {
        id,
        role: "assistant",
        text,
        createdAt,
        actions,
        citations: [],
        fallbackUsed: false,
      },
      kind: "morning_check_in" as const,
      localDate: date,
    };
  });
}
