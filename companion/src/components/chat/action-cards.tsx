import type {
  ChatUiAction,
  MemoryProposal,
  PracticeAction,
  ResourceCard,
  TaskCard,
} from "@/contracts/api";

import {
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  LeafIcon,
  LocationIcon,
  MessageIcon,
  PhoneIcon,
} from "../icons";

type ActionCardsProps = {
  actions: ChatUiAction[];
  completedTaskIds: Set<string>;
  completingTaskId: string | null;
  decidingMemoryId: string | null;
  onCompleteTask: (task: TaskCard) => void;
  onDecideMemory: (memory: MemoryProposal, accepted: boolean) => void;
  onOpenPractice: (practice: PracticeAction) => void;
};

function PracticeCard({
  action,
  onOpen,
}: {
  action: PracticeAction;
  onOpen: () => void;
}) {
  // Text-only reviewed practices already appear in the iMessage bubble. A
  // separate card is useful only when a future integrated practice has a URL.
  if (!action.url) return null;
  const minutes = Math.max(1, Math.ceil(action.durationSeconds / 60));

  return (
    <section className="action-card practice-card" data-testid="practice-card">
      <div className="action-card__icon action-card__icon--sage">
        <LeafIcon />
      </div>
      <div className="action-card__body">
        <span className="action-card__eyebrow">A moment to reset</span>
        <h3>{action.title}</h3>
        <p>{action.fallbackText}</p>
        {action.url ? (
          <button className="action-button action-button--sage" onClick={onOpen} type="button">
            Open {minutes}-minute practice
            <ChevronRightIcon />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function ResourceItem({ resource }: { resource: ResourceCard }) {
  const visibleSteps = resource.steps?.slice(0, 4) ?? [];
  return (
    <article className="resource-item">
      <div className="resource-item__category">{resource.category}</div>
      <h3>{resource.title}</h3>
      <p>{resource.summary}</p>
      {visibleSteps.length ? (
        <ol className="resource-item__steps">
          {visibleSteps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      ) : null}
      {resource.notes?.[0] ? (
        <p className="resource-item__note">Good to know: {resource.notes[0]}</p>
      ) : null}
      {resource.address ? (
        <div className="resource-item__detail">
          <LocationIcon /> <span>{resource.address}</span>
        </div>
      ) : null}
      <div className="resource-item__actions">
        {resource.phone ? (
          <a className="text-link" href={`tel:${resource.phone.replace(/[^+\d]/g, "")}`}>
            <PhoneIcon /> Call {resource.phone}
          </a>
        ) : null}
        {resource.url ? (
          <a className="text-link" href={resource.url} rel="noreferrer" target="_blank">
            <ExternalLinkIcon /> Open official site
          </a>
        ) : null}
      </div>
    </article>
  );
}

function ResourceGroup({ resources }: { resources: ResourceCard[] }) {
  return (
    <section className="action-card resource-card" data-testid="resource-card">
      <div className="action-card__header">
        <div className="action-card__icon action-card__icon--blue">
          <LocationIcon />
        </div>
        <div>
          <span className="action-card__eyebrow">
            Official, reviewed guide
          </span>
          <h3>{resources.length === 1 ? "Key actions" : "Best matches"}</h3>
        </div>
      </div>
      <div className="resource-list">
        {resources.map((resource) => (
          <ResourceItem key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function CompletionCard({
  complete,
  isCompleting,
  onComplete,
  task,
}: {
  complete: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  task: TaskCard;
}) {
  return (
    <section className="action-card completion-card" data-testid="task-completion-card">
      <div className={`action-card__icon ${complete ? "action-card__icon--complete" : ""}`}>
        <CheckIcon />
      </div>
      <div className="action-card__body">
        <span className="action-card__eyebrow">
          {complete ? "Step completed" : "Update your plan"}
        </span>
        <h3>{task.title}</h3>
        {task.description ? <p>{task.description}</p> : null}
        <button
          className="action-button"
          disabled={complete || isCompleting}
          onClick={onComplete}
          type="button"
        >
          {isCompleting ? (
            <>
              <span className="button-spinner" /> Saving…
            </>
          ) : complete ? (
            <>
              <CheckIcon /> Marked complete
            </>
          ) : (
            <>
              Mark complete <ChevronRightIcon />
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function MemoryCard({
  deciding,
  memory,
  onDecide,
}: {
  deciding: boolean;
  memory: MemoryProposal;
  onDecide: (accepted: boolean) => void;
}) {
  const finalized = memory.status === "accepted" || memory.status === "rejected";
  return (
    <section className="action-card memory-card" data-testid="memory-consent-card">
      <div className="action-card__icon action-card__icon--blue">
        <MessageIcon />
      </div>
      <div className="action-card__body">
        <span className="action-card__eyebrow">Only with your permission</span>
        <h3>Remember this?</h3>
        <p>{memory.value}</p>
        {finalized ? (
          <span className="duration-chip" data-testid="memory-status">
            {memory.status === "accepted" ? "Saved" : "Not saved"}
          </span>
        ) : (
          <div className="memory-actions">
            <button
              className="action-button"
              data-testid="memory-accept"
              disabled={deciding}
              onClick={() => onDecide(true)}
              type="button"
            >
              {deciding ? "Saving…" : "Remember this"}
            </button>
            <button
              className="action-button action-button--secondary"
              data-testid="memory-reject"
              disabled={deciding}
              onClick={() => onDecide(false)}
              type="button"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function ActionCards({
  actions,
  completedTaskIds,
  completingTaskId,
  decidingMemoryId,
  onCompleteTask,
  onDecideMemory,
  onOpenPractice,
}: ActionCardsProps) {
  // Crisis metadata is retained for channel renderers, but the web demo must
  // not invent an interactive card that native iMessage/SMS cannot deliver.
  const visibleActions = actions.filter(
    (action) =>
      action.type !== "crisis" &&
      action.type !== "next_task" &&
      action.type !== "confirm_task_completion" &&
      action.type !== "handoff" &&
      (action.type !== "practice" || Boolean(action.url)),
  );
  if (!visibleActions.length) return null;

  return (
    <div className="action-card-stack">
      {visibleActions.map((action, index) => {
        if (action.type === "practice") {
          return (
            <PracticeCard
              action={action}
              key={`${action.type}-${action.practiceId}-${index}`}
              onOpen={() => onOpenPractice(action)}
            />
          );
        }

        if (action.type === "resources") {
          return (
            <ResourceGroup
              key={`${action.type}-${action.resources.map((item) => item.id).join("-")}-${index}`}
              resources={action.resources}
            />
          );
        }

        if (action.type === "confirm_task_completion") {
          return (
            <CompletionCard
              complete={completedTaskIds.has(action.task.id)}
              isCompleting={completingTaskId === action.task.id}
              key={`${action.type}-${action.task.id}-${index}`}
              onComplete={() => onCompleteTask(action.task)}
              task={action.task}
            />
          );
        }

        if (action.type === "next_task") return null;

        if (action.type === "confirm_memory") {
          return (
            <MemoryCard
              deciding={decidingMemoryId === action.memory.id}
              key={`${action.type}-${action.memory.id}-${index}`}
              memory={action.memory}
              onDecide={(accepted) => onDecideMemory(action.memory, accepted)}
            />
          );
        }

        if (action.type === "crisis") return null;
        if (action.type === "handoff") return null;

        return null;
      })}
    </div>
  );
}
