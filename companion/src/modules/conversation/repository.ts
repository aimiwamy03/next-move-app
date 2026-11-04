import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import type {
  ChatMessage,
  ChatUiAction,
  Citation,
} from "@/contracts/api";
import type { ConversationChannel } from "@/contracts/channels";
import { getDatabase, withImmediateTransaction } from "@/infrastructure/db/client";

type MessageMetadata = {
  actions: ChatUiAction[];
  citations: Citation[];
  fallbackUsed: boolean;
  requestId?: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  client_message_id: string | null;
  in_reply_to_message_id: string | null;
  role: "participant" | "assistant";
  channel: ConversationChannel;
  text: string;
  metadata_json: string;
  created_at: string;
};

export class ConversationConflictError extends Error {}
export class ConversationNotFoundError extends Error {}

function parseMetadata(value: string): MessageMetadata {
  try {
    const parsed = JSON.parse(value) as Partial<MessageMetadata>;
    return {
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      citations: Array.isArray(parsed.citations) ? parsed.citations : [],
      fallbackUsed: parsed.fallbackUsed === true,
      ...(typeof parsed.requestId === "string"
        ? { requestId: parsed.requestId }
        : {}),
    };
  } catch {
    return { actions: [], citations: [], fallbackUsed: false };
  }
}

export function rowToChatMessage(row: MessageRow): ChatMessage {
  const metadata = parseMetadata(row.metadata_json);
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at,
    actions: metadata.actions,
    citations: metadata.citations,
    fallbackUsed: metadata.fallbackUsed,
  };
}

export function listMessages(userId: string, limit = 100): ChatMessage[] {
  const rows = getDatabase().prepare(`
    SELECT m.*
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE c.user_id = ?
    ORDER BY m.created_at DESC, m.rowid DESC
    LIMIT ?
  `).all(userId, limit) as unknown as MessageRow[];
  return rows.reverse().map(rowToChatMessage);
}

export type AcceptedInbound = {
  conversationId: string;
  inboundId: string;
  channel: ConversationChannel;
  previousReply?: { message: ChatMessage; requestId: string };
};

function conversationIdForUser(db: DatabaseSync, userId: string): string {
  const row = db.prepare(
    "SELECT id FROM conversations WHERE user_id = ?",
  ).get(userId) as { id: string } | undefined;
  if (!row) throw new ConversationNotFoundError("Conversation not found");
  return row.id;
}

function replyForInbound(
  db: DatabaseSync,
  conversationId: string,
  inboundId: string,
): { message: ChatMessage; requestId: string } | undefined {
  const row = db.prepare(`
    SELECT * FROM messages
    WHERE conversation_id = ? AND in_reply_to_message_id = ?
  `).get(conversationId, inboundId) as MessageRow | undefined;
  if (!row) return undefined;
  const metadata = parseMetadata(row.metadata_json);
  return {
    message: rowToChatMessage(row),
    requestId: metadata.requestId ?? randomUUID(),
  };
}

export function acceptInboundMessage(
  userId: string,
  clientMessageId: string,
  text: string,
  channel: ConversationChannel = "web",
): AcceptedInbound {
  return withImmediateTransaction((db) => {
    const conversationId = conversationIdForUser(db, userId);
    const prior = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ? AND client_message_id = ?
    `).get(conversationId, clientMessageId) as MessageRow | undefined;

    if (prior) {
      if (prior.text !== text) {
        throw new ConversationConflictError(
          "clientMessageId was already used for different text",
        );
      }
      return {
        conversationId,
        inboundId: prior.id,
        channel: prior.channel,
        previousReply: replyForInbound(db, conversationId, prior.id),
      };
    }

    const inboundId = randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO messages
        (id, conversation_id, client_message_id, in_reply_to_message_id,
         role, kind, text, metadata_json, created_at, channel)
      VALUES (?, ?, ?, NULL, 'participant', 'inbound', ?, '{}', ?, ?)
    `).run(inboundId, conversationId, clientMessageId, text, now, channel);
    db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
      now,
      conversationId,
    );

    return { conversationId, inboundId, channel };
  });
}

export type AssistantDraft = {
  text: string;
  actions: ChatUiAction[];
  citations: Citation[];
  fallbackUsed: boolean;
};

export function commitAssistantReply(
  accepted: AcceptedInbound,
  draft: AssistantDraft,
  requestId: string,
): { message: ChatMessage; requestId: string } {
  return withImmediateTransaction((db) => {
    const existing = replyForInbound(
      db,
      accepted.conversationId,
      accepted.inboundId,
    );
    if (existing) return existing;

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const metadata: MessageMetadata = {
      actions: draft.actions,
      citations: draft.citations,
      fallbackUsed: draft.fallbackUsed,
      requestId,
    };
    db.prepare(`
      INSERT INTO messages
        (id, conversation_id, client_message_id, in_reply_to_message_id,
         role, kind, text, metadata_json, created_at, channel)
      VALUES (?, ?, NULL, ?, 'assistant', 'reply', ?, ?, ?, ?)
    `).run(
      id,
      accepted.conversationId,
      accepted.inboundId,
      draft.text,
      JSON.stringify(metadata),
      createdAt,
      accepted.channel,
    );
    db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
      createdAt,
      accepted.conversationId,
    );

    return {
      message: {
        id,
        role: "assistant",
        text: draft.text,
        createdAt,
        actions: draft.actions,
        citations: draft.citations,
        fallbackUsed: draft.fallbackUsed,
      },
      requestId,
    };
  });
}
