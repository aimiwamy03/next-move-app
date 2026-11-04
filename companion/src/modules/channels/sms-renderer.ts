import type { ChatUiAction, Citation } from "@/contracts/api";
import type {
  ChannelRenderer,
  SmsRenderedMessage,
  TurnResult,
} from "@/contracts/channels";

/** Three concatenated GSM segments; providers may segment further by encoding. */
export const DEFAULT_SMS_MESSAGE_CHARACTERS = 480;

export type SmsRendererOptions = {
  maxCharacters?: number;
  includeSources?: boolean;
};

function toPlainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, "$1: $2")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1: $2")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function durationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function renderAction(action: ChatUiAction, existingText = ""): string {
  switch (action.type) {
    case "crisis":
      return [
        "Immediate crisis support:",
        `Emergency or immediate danger: call ${action.emergencyPhone}`,
        `${toPlainText(action.crisisLineName)}: call ${action.crisisPhone} or text ${action.crisisText}`,
        `Chat: ${action.chatUrl}`,
      ].join("\n");

    case "practice":
      return [
        existingText.includes(toPlainText(action.title))
          ? ""
          : `Mindful practice: ${toPlainText(action.title)} (${durationLabel(action.durationSeconds)})`,
        existingText.includes(toPlainText(action.fallbackText))
          ? ""
          : toPlainText(action.fallbackText),
        action.url ? `Optional app: ${action.url}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "resources":
      if (action.resources.length === 0) {
        return "No reviewed resources were found.";
      }
      return [
        "Resources:",
        ...action.resources.map((resource, index) =>
          [
            `${index + 1}. ${toPlainText(resource.title)}`,
            toPlainText(resource.summary),
            ...(resource.steps ?? []).slice(0, 4).map(
              (step, stepIndex) => `${stepIndex + 1}) ${toPlainText(step)}`,
            ),
            resource.notes?.[0]
              ? `Good to know: ${toPlainText(resource.notes[0])}`
              : "",
            resource.phone ? `Call: ${resource.phone}` : "",
            resource.address ? `Address: ${toPlainText(resource.address)}` : "",
            resource.url ? `Official link: ${resource.url}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      ].join("\n");

    case "confirm_task_completion":
      return [
        `Mark “${toPlainText(action.task.title)}” complete?`,
        "Reply with:",
        "1. YES — mark it complete",
        "2. NO — leave it open",
      ].join("\n");

    case "next_task":
      return [
        `Next step: ${toPlainText(action.task.title)}`,
        toPlainText(action.task.description),
        "Reply DONE when you finish it.",
      ]
        .filter(Boolean)
        .join("\n");

    case "confirm_memory":
      return [
        `Remember this for future conversations: “${toPlainText(action.memory.value)}”?`,
        "Reply with:",
        "1. YES — save it",
        "2. NO — do not save it",
      ].join("\n");

    case "handoff":
      return [
        `Human follow-up: ${toPlainText(action.reason)}`,
        action.demoOnly
          ? "Demo note: this prototype does not notify a staff member."
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    default: {
      const neverAction: never = action;
      return neverAction;
    }
  }
}

function renderSources(citations: Citation[], existingText: string): string {
  const seen = new Set<string>();
  const sources = citations.filter((citation) => {
    if (!citation.sourceUri || existingText.includes(citation.sourceUri)) {
      return false;
    }
    if (seen.has(citation.sourceUri)) return false;
    seen.add(citation.sourceUri);
    return true;
  });
  if (sources.length === 0) return "";

  return [
    "Sources:",
    ...sources.map(
      (citation, index) =>
        `${index + 1}. ${toPlainText(citation.title)}: ${citation.sourceUri}`,
    ),
  ].join("\n");
}

function splitLongBlock(block: string, maxCharacters: number): string[] {
  if (block.length <= maxCharacters) return [block];

  const pieces: string[] = [];
  let current = "";
  const tokens = block.split(/(\s+)/).filter(Boolean);

  for (const token of tokens) {
    if (!current) {
      current = token.trimStart();
      continue;
    }
    if (current.length + token.length <= maxCharacters) {
      current += token;
      continue;
    }

    pieces.push(current.trim());
    // Do not corrupt a URL or other unbroken token merely to meet a soft limit.
    current = token.trimStart();
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

function packBlocks(blocks: string[], maxCharacters: number): string[] {
  const messages: string[] = [];
  let current = "";

  for (const block of blocks.flatMap((item) =>
    splitLongBlock(item, maxCharacters),
  )) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (current && candidate.length > maxCharacters) {
      messages.push(current);
      current = block;
    } else {
      current = candidate;
    }
  }
  if (current) messages.push(current);
  return messages;
}

export function renderSmsTurn(
  result: TurnResult,
  options: SmsRendererOptions = {},
): SmsRenderedMessage[] {
  const maxCharacters =
    options.maxCharacters ?? DEFAULT_SMS_MESSAGE_CHARACTERS;
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters < 80) {
    throw new RangeError("maxCharacters must be a safe integer of at least 80");
  }

  const baseText = toPlainText(result.text);
  const blocks = [
    baseText,
    ...result.actions.map((action) => renderAction(action, baseText)),
  ].filter(Boolean);
  if (options.includeSources !== false) {
    const sources = renderSources(result.citations, blocks.join("\n"));
    if (sources) blocks.push(sources);
  }

  const texts = packBlocks(blocks, maxCharacters);
  return texts.map((text, index) => ({
    channel: "sms",
    text,
    part: index + 1,
    totalParts: texts.length,
  }));
}

export class SmsChannelRenderer
  implements ChannelRenderer<"sms", SmsRenderedMessage>
{
  readonly channel = "sms" as const;

  constructor(private readonly options: SmsRendererOptions = {}) {}

  render(result: TurnResult): SmsRenderedMessage[] {
    return renderSmsTurn(result, this.options);
  }
}

export const smsChannelRenderer = new SmsChannelRenderer();
