import { useEffect, useRef, useState } from "react";

import {
  ArrowUpIcon,
  AudioWaveformIcon,
  ChevronLeftIcon,
  LeafIcon,
  PlusIcon,
} from "./icons";
import { IosStatusBar } from "./ios-status-bar";

type PinGateProps = {
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (pin: string) => void;
};

export const PIN_PROMPT_MESSAGE =
  "Welcome back. Can you input your 4-digit PIN? It keeps your plan private.";

export const MASKED_PIN_MESSAGE = "••••";

export function PinGate({ error, isSubmitting, onSubmit }: PinGateProps) {
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isComplete = /^\d{4}$/.test(pin);

  return (
    <main className="pin-page">
      <div className="pin-ambient pin-ambient--one" />
      <div className="pin-ambient pin-ambient--two" />
      <section aria-labelledby="pin-title" className="pin-phone">
        <header className="pin-header">
          <IosStatusBar />
          <div className="pin-toolbar">
            <span className="messages-back-button pin-back" aria-hidden="true">
              <ChevronLeftIcon />
              <span>Messages</span>
            </span>
            <div className="pin-header__contact">
              <div className="contact-avatar" aria-hidden="true">
                <LeafIcon />
              </div>
              <h1 id="pin-title">Boundless</h1>
            </div>
            <span className="pin-header-spacer" />
          </div>
        </header>

        <div className="pin-thread">
          <div className="pin-date">Today</div>
          <div className="message-row">
            <div className="message-avatar" aria-hidden="true">
              <LeafIcon />
            </div>
            <div className="message-column">
              <div className="message-meta"><span>Boundless</span></div>
              <div className="message-bubble message-bubble--assistant pin-welcome">
                <p>{PIN_PROMPT_MESSAGE}</p>
              </div>
            </div>
          </div>
        </div>

        <form
          className="pin-composer-shell"
          onSubmit={(event) => {
            event.preventDefault();
            if (isComplete && !isSubmitting) onSubmit(pin);
          }}
        >
          <div className="messages-composer-row">
            <span className="messages-add-button" aria-hidden="true">
              <PlusIcon />
            </span>
            <div
              className={`pin-composer ${pin ? "has-value" : ""} ${error ? "has-error" : ""}`}
            >
              <label className="sr-only" htmlFor="demo-pin">Four-digit PIN</label>
              <input
                aria-describedby={error ? "pin-error" : undefined}
                aria-invalid={Boolean(error)}
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                data-testid="pin-input"
                disabled={isSubmitting}
                id="demo-pin"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="iMessage"
                ref={inputRef}
                type="password"
                value={pin}
              />
              {pin ? (
                <button
                  aria-label="Submit PIN"
                  className="send-button"
                  data-testid="pin-submit"
                  disabled={!isComplete || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? <span className="button-spinner" /> : <ArrowUpIcon />}
                </button>
              ) : (
                <span className="composer-idle-icon" aria-hidden="true">
                  <AudioWaveformIcon />
                </span>
              )}
            </div>
          </div>
          {error ? <p className="field-error" id="pin-error" role="alert">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
