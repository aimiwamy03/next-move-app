import { useEffect, useRef } from "react";

import { ArrowUpIcon, AudioWaveformIcon, PlusIcon } from "../icons";

type ChatComposerProps = {
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
};

export function ChatComposer({
  disabled,
  onChange,
  onSubmit,
  value,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [value]);

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <div className="composer-shell">
      <div className="messages-composer-row">
        <span className="messages-add-button" aria-hidden="true">
          <PlusIcon />
        </span>
        <div className="composer">
          <label className="sr-only" htmlFor="chat-message">
            Message Boundless
          </label>
          <textarea
            data-testid="chat-composer"
            disabled={disabled}
            id="chat-message"
            maxLength={2_000}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) onSubmit();
              }
            }}
            placeholder="iMessage"
            ref={textareaRef}
            rows={1}
            value={value}
          />
          {value.trim() ? (
            <button
              aria-label="Send message"
              className="send-button"
              data-testid="send-message"
              disabled={!canSend}
              onClick={onSubmit}
              type="button"
            >
              <ArrowUpIcon />
            </button>
          ) : (
            <span className="composer-idle-icon" aria-hidden="true">
              <AudioWaveformIcon />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
