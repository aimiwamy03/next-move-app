"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ApiError,
  BootstrapResponse,
  ChatMessage,
  ChatResponse,
  MemoryDecisionResponse,
  MemoryProposal,
  MemoryStatus,
  OutboundMessage,
  PracticeAction,
  TaskCard,
  TaskCompletionResponse,
} from "@/contracts/api";
import { onboardingMessage } from "@/modules/conversation/onboarding";

import { ChatComposer } from "./chat/chat-composer";
import { MessageBubble, TypingIndicator } from "./chat/message-bubble";
import {
  ChevronLeftIcon,
  InfoIcon,
  LeafIcon,
  RefreshIcon,
  XIcon,
} from "./icons";
import { IosStatusBar } from "./ios-status-bar";
import {
  MASKED_PIN_MESSAGE,
  PIN_PROMPT_MESSAGE,
  PinGate,
} from "./pin-gate";
import { TaskSidebar } from "./task-sidebar";

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== "object" || !("error" in value)) return false;
  const error = value.error;
  return Boolean(
    error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string",
  );
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as T | ApiError | null;
  if (!response.ok) {
    const message = isApiError(payload)
      ? payload.error.message
      : "Something went wrong. Please try again.";
    throw new ApiRequestError(message, response.status);
  }

  if (payload === null) {
    throw new ApiRequestError("The server returned an empty response.", response.status);
  }
  return payload as T;
}

type Screen = "loading" | "pin" | "conversation" | "unavailable";

type FailedSend = {
  clientMessageId: string;
  messageId: string;
  text: string;
};

function dedupeMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

function applyMemoryStatuses(
  messages: ChatMessage[],
  statuses: Array<{ id: string; status: MemoryStatus }>,
): ChatMessage[] {
  const statusById = new Map(statuses.map((item) => [item.id, item.status]));
  return messages.map((message) => ({
    ...message,
    actions: message.actions.map((action) =>
      action.type === "confirm_memory" && statusById.has(action.memory.id)
        ? {
            ...action,
            memory: {
              ...action.memory,
              status: statusById.get(action.memory.id) ?? action.memory.status,
            },
          }
        : action,
    ),
  }));
}

function LoadingScreen() {
  return (
    <main className="loading-screen" aria-label="Loading your conversation">
      <div className="loading-mark"><LeafIcon /></div>
      <div className="loading-wordmark">Boundless</div>
      <div className="loading-line"><span /></div>
      <p>Getting your space ready…</p>
    </main>
  );
}

function UnavailableScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="unavailable-screen">
      <section>
        <div className="brand-mark"><LeafIcon /></div>
        <span className="eyebrow">We couldn’t connect</span>
        <h1>Your conversation is still safe.</h1>
        <p>{message}</p>
        <button className="primary-button" onClick={onRetry} type="button">
          <RefreshIcon /> Try again
        </button>
      </section>
    </main>
  );
}

export function ConversationApp() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<TaskCard[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<TaskCard[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [failedSend, setFailedSend] = useState<FailedSend | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMorningLoading, setIsMorningLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [decidingMemoryId, setDecidingMemoryId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startupError, setStartupError] = useState<string>("The local demo service is unavailable.");
  const privateStateGenerationRef = useRef(0);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const clearPrivateState = useCallback(() => {
    privateStateGenerationRef.current += 1;
    setBootstrap(null);
    setMessages([]);
    setTasks([]);
    setRecommendedTasks([]);
    setDraft("");
    setFailedSend(null);
    setCompletingTaskId(null);
    setDecidingMemoryId(null);
    setIsSending(false);
    setIsMorningLoading(false);
    setIsResetting(false);
    setSidebarOpen(false);
    setError(null);
    setScreen("pin");
  }, []);

  const handleProtectedRequestError = useCallback(
    (caught: unknown, fallbackMessage: string): boolean => {
      if (caught instanceof ApiRequestError && caught.status === 401) {
        clearPrivateState();
        setError("Your session ended. Enter your PIN to continue.");
        return true;
      }

      setError(caught instanceof Error ? caught.message : fallbackMessage);
      return false;
    },
    [clearPrivateState],
  );

  const applyBootstrap = useCallback((data: BootstrapResponse) => {
    setBootstrap(data);
    setMessages(
      applyMemoryStatuses(dedupeMessages(data.messages), data.memoryStatuses),
    );
    setTasks(data.tasks);
    setRecommendedTasks(data.recommendedTasks);
    setScreen("conversation");
    setError(null);
  }, []);

  const loadBootstrap = useCallback(async (showLoading = true) => {
    const privateStateGeneration = privateStateGenerationRef.current;
    if (showLoading) setScreen("loading");
    try {
      const data = await requestJson<BootstrapResponse>("/api/bootstrap", { cache: "no-store" });
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      applyBootstrap(data);
    } catch (caught) {
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      if (caught instanceof ApiRequestError && [401, 403].includes(caught.status)) {
        clearPrivateState();
        return;
      }
      setStartupError(caught instanceof Error ? caught.message : "The local demo service is unavailable.");
      setScreen("unavailable");
    }
  }, [applyBootstrap, clearPrivateState]);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (screen !== "conversation") return;
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, screen]);

  const completedTaskIds = useMemo(
    () => new Set(tasks.filter((task) => task.status === "completed").map((task) => task.id)),
    [tasks],
  );

  const signIn = async (pin: string) => {
    if (isSigningOut) return;
    setIsSigningIn(true);
    setError(null);
    try {
      await requestJson<unknown>("/api/auth/pin", {
        body: JSON.stringify({ pin }),
        method: "POST",
      });
      await loadBootstrap();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That PIN didn’t work. Please try again.");
      setScreen("pin");
    } finally {
      setIsSigningIn(false);
    }
  };

  const runSend = async ({ clientMessageId, messageId, text }: FailedSend, addOptimistic: boolean) => {
    const privateStateGeneration = privateStateGenerationRef.current;
    if (addOptimistic) {
      const optimisticMessage: ChatMessage = {
        actions: [],
        citations: [],
        createdAt: new Date().toISOString(),
        fallbackUsed: false,
        id: messageId,
        role: "participant",
        text,
      };
      setMessages((current) => [...current, optimisticMessage]);
    }

    setDraft("");
    setError(null);
    setFailedSend(null);
    setIsSending(true);

    try {
      const response = await requestJson<ChatResponse>("/api/chat/messages", {
        body: JSON.stringify({ clientMessageId, text }),
        method: "POST",
      });
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      setMessages((current) => dedupeMessages([...current, response.message]));
    } catch (caught) {
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      if (!handleProtectedRequestError(caught, "Your message could not be sent.")) {
        setFailedSend({ clientMessageId, messageId, text });
      }
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || isSending) return;
    const clientMessageId = crypto.randomUUID();
    void runSend(
      { clientMessageId, messageId: `pending-${clientMessageId}`, text },
      true,
    );
  };

  const triggerMorning = async () => {
    if (isMorningLoading) return;
    const privateStateGeneration = privateStateGenerationRef.current;
    setIsMorningLoading(true);
    setError(null);
    try {
      const response = await requestJson<OutboundMessage>("/api/demo/morning", { method: "POST" });
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      setMessages((current) => dedupeMessages([...current, response.message]));
    } catch (caught) {
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      handleProtectedRequestError(
        caught,
        "The morning check-in could not be created.",
      );
    } finally {
      setIsMorningLoading(false);
    }
  };

  const completeTask = async (task: TaskCard) => {
    if (completingTaskId) return;
    const privateStateGeneration = privateStateGenerationRef.current;
    setCompletingTaskId(task.id);
    setError(null);
    try {
      const response = await requestJson<TaskCompletionResponse>(
        `/api/tasks/${encodeURIComponent(task.id)}/complete`,
        { method: "POST" },
      );
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      setTasks((current) => {
        const next = current.map((item) =>
          item.id === response.completedTask.id ? response.completedTask : item,
        );
        for (const unlocked of response.newlyUnlocked) {
          const index = next.findIndex((item) => item.id === unlocked.id);
          if (index >= 0) next[index] = unlocked;
          else next.push(unlocked);
        }
        return next;
      });
      setRecommendedTasks(response.newlyUnlocked);
      const newlyUnlocked = response.newlyUnlocked[0];
      if (newlyUnlocked) {
        setMessages((current) => [
          ...current,
          {
            id: `task-unlocked-${crypto.randomUUID()}`,
            role: "assistant",
            text: "That step is saved. It opens up a useful next step whenever you’re ready.",
            createdAt: new Date().toISOString(),
            actions: [{ type: "next_task", task: newlyUnlocked }],
            citations: [],
            fallbackUsed: false,
          },
        ]);
      }
    } catch (caught) {
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      handleProtectedRequestError(caught, "That step could not be updated.");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const decideMemory = async (memory: MemoryProposal, accepted: boolean) => {
    if (decidingMemoryId) return;
    const privateStateGeneration = privateStateGenerationRef.current;
    setDecidingMemoryId(memory.id);
    setError(null);
    try {
      const response = await requestJson<MemoryDecisionResponse>(
        `/api/memories/${encodeURIComponent(memory.id)}/decision`,
        {
          body: JSON.stringify({ accepted }),
          method: "POST",
        },
      );
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      setMessages((current) =>
        current.map((message) => ({
          ...message,
          actions: message.actions.map((action) =>
            action.type === "confirm_memory" &&
            action.memory.id === response.memory.id
              ? {
                  ...action,
                  memory: {
                    ...action.memory,
                    status: response.memory.status,
                  },
                }
              : action,
          ),
        })),
      );
    } catch (caught) {
      if (privateStateGeneration !== privateStateGenerationRef.current) return;
      handleProtectedRequestError(
        caught,
        "That memory choice could not be saved.",
      );
    } finally {
      setDecidingMemoryId(null);
    }
  };

  const resetDemo = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setError(null);
    try {
      await requestJson<unknown>("/api/demo/reset", {
        body: JSON.stringify({ confirm: "RESET_DEMO" }),
        method: "POST",
      });
      clearPrivateState();
    } catch (caught) {
      handleProtectedRequestError(caught, "The demo could not be reset.");
    } finally {
      setIsResetting(false);
    }
  };

  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    // Hide participant data immediately; the server request invalidates the
    // HttpOnly cookie-backed session when the local service is reachable.
    clearPrivateState();
    try {
      await requestJson<unknown>("/api/auth/logout", { method: "POST" });
    } catch {
      setError(
        "This screen is locked, but server sign-out could not be confirmed. Close this tab before leaving the device.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const openPractice = (practice: PracticeAction) => {
    if (!practice.url) return;
    const popup = window.open(practice.url, "_blank");
    if (popup) popup.opener = null;
    else setError(`Open a new tab to begin. ${practice.fallbackText}`);
  };

  if (screen === "loading") return <LoadingScreen />;
  if (screen === "unavailable") {
    return <UnavailableScreen message={startupError} onRetry={() => void loadBootstrap()} />;
  }
  if (screen === "pin") {
    return (
      <PinGate
        error={error}
        isSubmitting={isSigningIn || isSigningOut}
        onSubmit={(pin) => void signIn(pin)}
      />
    );
  }
  if (!bootstrap) return <LoadingScreen />;

  const firstName = bootstrap.participant.preferredName;

  return (
    <main className="app-shell">
      <section className="conversation-panel" aria-label="Conversation with Boundless">
        <header className="conversation-header">
          <IosStatusBar />
          <div className="conversation-toolbar">
            <button
              aria-label="Quick exit and lock this conversation"
              className="messages-back-button"
              data-testid="quick-exit"
              disabled={isSigningOut}
              onClick={() => void signOut()}
              type="button"
            >
              <ChevronLeftIcon />
              <span>{isSigningOut ? "Closing…" : "Messages"}</span>
            </button>

            <button
              aria-controls="reentry-plan-panel"
              aria-label="Open Boundless details"
              aria-expanded={sidebarOpen}
              className="conversation-header__identity"
              data-testid="conversation-contact"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <div className="contact-avatar" aria-hidden="true"><LeafIcon /></div>
              <div className="conversation-header__name-row">
                <h1>Boundless</h1>
                <span aria-hidden="true">›</span>
              </div>
              <span className="sr-only">
                For {firstName}, {bootstrap.participant.maskedPhone}. Local AI.
              </span>
            </button>

            <button
              aria-controls="reentry-plan-panel"
              aria-label="Conversation details"
              aria-expanded={sidebarOpen}
              className="messages-info-button"
              data-testid="conversation-details"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <InfoIcon />
            </button>
          </div>
        </header>

        {error ? (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            {failedSend ? (
              <button
                disabled={isSending}
                onClick={() => void runSend(failedSend, false)}
                type="button"
              >
                Retry
              </button>
            ) : null}
            <button aria-label="Dismiss message" onClick={() => setError(null)} type="button">
              <XIcon />
            </button>
          </div>
        ) : null}

        <div className="message-thread" aria-live="polite" aria-relevant="additions">
          <div className="thread-intro">
            <span>Today</span>
          </div>

          <div className="message-row" data-testid="pin-prompt-message">
            <div className="message-avatar" aria-hidden="true"><LeafIcon /></div>
            <div className="message-column">
              <div className="message-meta"><span>Boundless</span></div>
              <div className="message-bubble message-bubble--assistant">
                <p>{PIN_PROMPT_MESSAGE}</p>
              </div>
            </div>
          </div>

          <div
            className="message-row message-row--participant"
            data-testid="pin-entry-message"
          >
            <div className="message-column">
              <div className="message-meta"><span>You</span></div>
              <div
                aria-label="PIN hidden"
                className="message-bubble message-bubble--participant"
              >
                <p>{MASKED_PIN_MESSAGE}</p>
              </div>
            </div>
          </div>

          <div className="message-row" data-testid="onboarding-message">
            <div className="message-avatar" aria-hidden="true"><LeafIcon /></div>
            <div className="message-column">
              <div className="message-meta"><span>Boundless</span></div>
              <div className="message-bubble message-bubble--assistant">
                <p>{onboardingMessage(firstName)}</p>
              </div>
            </div>
          </div>

          {messages.map((message) => (
            <MessageBubble
              completedTaskIds={completedTaskIds}
              completingTaskId={completingTaskId}
              decidingMemoryId={decidingMemoryId}
              key={message.id}
              message={message}
              onCompleteTask={(task) => void completeTask(task)}
              onDecideMemory={(memory, accepted) =>
                void decideMemory(memory, accepted)
              }
              onOpenPractice={openPractice}
            />
          ))}
          {isSending ? <TypingIndicator /> : null}
          <div ref={threadEndRef} />
        </div>

        <ChatComposer
          disabled={isSending}
          onChange={setDraft}
          onSubmit={sendMessage}
          value={draft}
        />

      </section>

      <TaskSidebar
        isOpen={sidebarOpen}
        isMorningLoading={isMorningLoading}
        isResetting={isResetting}
        onClose={() => setSidebarOpen(false)}
        onMorningCheckIn={() => void triggerMorning()}
        onResetDemo={() => void resetDemo()}
        recommendedTasks={recommendedTasks}
        showDemoControls={bootstrap.features.demoMode}
        tasks={tasks}
      />
    </main>
  );
}
