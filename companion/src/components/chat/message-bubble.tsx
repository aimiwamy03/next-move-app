import type {
  ChatMessage,
  MemoryProposal,
  PracticeAction,
  TaskCard,
} from "@/contracts/api";

import { LeafIcon } from "../icons";
import { ActionCards } from "./action-cards";

type MessageBubbleProps = {
  completedTaskIds: Set<string>;
  completingTaskId: string | null;
  decidingMemoryId: string | null;
  message: ChatMessage;
  onCompleteTask: (task: TaskCard) => void;
  onDecideMemory: (memory: MemoryProposal, accepted: boolean) => void;
  onOpenPractice: (practice: PracticeAction) => void;
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}

function MessageText({ text }: { text: string }) {
  return text
    .split(/(https?:\/\/[^\s]+|\(\d{3}\)\s*\d{3}-\s*\d{4})/g)
    .map((part, index) => {
      if (/^https?:\/\/[^\s]+$/.test(part)) {
        return (
          <a href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
            {part}
          </a>
        );
      }
      if (/^\(\d{3}\)\s*\d{3}-\s*\d{4}$/.test(part)) {
        return <a href={`tel:${part.replace(/\D/g, "")}`} key={`${part}-${index}`}>{part}</a>;
      }
      return part;
    });
}

export function MessageBubble({
  completedTaskIds,
  completingTaskId,
  decidingMemoryId,
  message,
  onCompleteTask,
  onDecideMemory,
  onOpenPractice,
}: MessageBubbleProps) {
  const isParticipant = message.role === "participant";

  return (
    <article className={`message-row ${isParticipant ? "message-row--participant" : ""}`}>
      {!isParticipant ? (
        <div className="message-avatar" aria-hidden="true">
          <LeafIcon />
        </div>
      ) : null}
      <div className="message-column">
        <div className="message-meta">
          <span>{isParticipant ? "You" : "Boundless"}</span>
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        </div>
        <div className={`message-bubble message-bubble--${message.role}`}>
          <p><MessageText text={message.text} /></p>
        </div>
        {!isParticipant ? (
          <ActionCards
            actions={message.actions}
            completedTaskIds={completedTaskIds}
            completingTaskId={completingTaskId}
            decidingMemoryId={decidingMemoryId}
            onCompleteTask={onCompleteTask}
            onDecideMemory={onDecideMemory}
            onOpenPractice={onOpenPractice}
          />
        ) : null}
      </div>
    </article>
  );
}

export function TypingIndicator() {
  return (
    <div aria-label="Boundless is typing" className="message-row typing-row" role="status">
      <div className="message-avatar" aria-hidden="true">
        <LeafIcon />
      </div>
      <div className="message-column">
        <div className="message-meta">
          <span>Boundless</span>
        </div>
        <div className="typing-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
