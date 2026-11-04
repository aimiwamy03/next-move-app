import { useEffect, useRef } from "react";

import type { TaskCard, TaskStatus } from "@/contracts/api";

import {
  CheckIcon,
  ClockIcon,
  LeafIcon,
  RefreshIcon,
  SparkleIcon,
  SunIcon,
  XIcon,
} from "./icons";

type TaskSidebarProps = {
  isOpen: boolean;
  isMorningLoading: boolean;
  isResetting: boolean;
  onClose: () => void;
  onMorningCheckIn: () => void;
  onResetDemo: () => void;
  recommendedTasks: TaskCard[];
  showDemoControls: boolean;
  tasks: TaskCard[];
};

const statusLabels: Record<TaskStatus, string> = {
  blocked: "Waiting",
  completed: "Done",
  in_progress: "In progress",
  not_applicable: "Not needed",
  not_started: "Ready",
  waiting: "Waiting",
};

function TaskRow({ task }: { task: TaskCard }) {
  const isComplete = task.status === "completed";
  const statusLabel =
    !isComplete && !task.eligible ? "Waiting" : statusLabels[task.status];

  return (
    <li className={`task-row task-row--${task.status}`}>
      <span className="task-row__marker" aria-hidden="true">
        {isComplete ? <CheckIcon /> : <span />}
      </span>
      <span className="task-row__copy">
        <span className="task-row__title">{task.title}</span>
        <span className="task-row__meta">
          {task.estimatedMinutes ? (
            <>
              <ClockIcon /> {task.estimatedMinutes} min
              <span aria-hidden="true"> · </span>
            </>
          ) : null}
          {statusLabel}
        </span>
      </span>
    </li>
  );
}

export function TaskSidebar({
  isOpen,
  isMorningLoading,
  isResetting,
  onClose,
  onMorningCheckIn,
  onResetDemo,
  recommendedTasks,
  showDemoControls,
  tasks,
}: TaskSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const visibleTasks = tasks.filter((task) => task.status !== "not_applicable");
  const total = visibleTasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const nextTask = recommendedTasks[0];
  const taskGroups = visibleTasks.reduce<Array<{ phase: string; tasks: TaskCard[] }>>(
    (groups, task) => {
      const phase = task.phase ?? "Your plan";
      const current = groups.at(-1);
      if (current?.phase === phase) current.tasks.push(task);
      else groups.push({ phase, tasks: [task] });
      return groups;
    },
    [],
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        aria-hidden={!isOpen}
        aria-label="Close your plan"
        className={`sidebar-backdrop ${isOpen ? "is-visible" : ""}`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside
        aria-hidden={!isOpen}
        aria-label="Your reentry plan"
        aria-modal="true"
        className={`task-sidebar ${isOpen ? "is-open" : ""}`}
        id="reentry-plan-panel"
        inert={!isOpen}
        role="dialog"
      >
        <div className="task-sidebar__topline">
          <span />
          <button
            aria-label="Close your plan"
            className="icon-button task-sidebar__close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <XIcon />
          </button>
        </div>

        <div className="contact-details-heading">
          <div className="contact-avatar" aria-hidden="true"><LeafIcon /></div>
          <h2>Boundless</h2>
          <p>Reentry companion</p>
        </div>

        {showDemoControls ? (
          <div className="contact-action-grid">
            <button
              data-testid="morning-trigger"
              disabled={isMorningLoading}
              onClick={onMorningCheckIn}
              type="button"
            >
              <span>{isMorningLoading ? <span className="button-spinner" /> : <SunIcon />}</span>
              Check In
            </button>
            <button
              data-testid="demo-reset"
              disabled={isResetting}
              onClick={onResetDemo}
              type="button"
            >
              <span><RefreshIcon /></span>
              {isResetting ? "Resetting" : "Reset"}
            </button>
          </div>
        ) : null}

        <div className="settings-section-title">YOUR PLAN</div>

        <section className="progress-card" aria-label={`${progress}% complete`}>
          <div className="progress-card__numbers">
            <strong>{progress}%</strong>
            <span>
              {completed} of {total} complete
            </span>
          </div>
          <div
            aria-hidden="true"
            className="progress-track"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        {nextTask ? (
          <section className="next-up-panel" data-testid="next-task-card">
            <div className="next-up-panel__label">
              <SparkleIcon /> Suggested next
            </div>
            <h3>{nextTask.title}</h3>
            {nextTask.reason ? <p>{nextTask.reason}</p> : null}
            {nextTask.estimatedMinutes ? (
              <span className="duration-chip">
                <ClockIcon /> About {nextTask.estimatedMinutes} min
              </span>
            ) : null}
          </section>
        ) : (
          <section className="next-up-panel next-up-panel--complete">
            <div className="next-up-panel__label">
              <CheckIcon /> You’re caught up
            </div>
            <p>There are no new steps waiting right now.</p>
          </section>
        )}

        <section className="task-list-section">
          <div className="section-heading">
            <h3>All steps</h3>
            <span>{total}</span>
          </div>
          {visibleTasks.length ? (
            <div className="task-groups">
              {taskGroups.map((group) => (
                <section className="task-group" key={group.phase}>
                  <h4>{group.phase}</h4>
                  <ul className="task-list">
                    {group.tasks.map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p className="empty-copy">Your plan will appear here.</p>
          )}
        </section>

        <p className="task-sidebar__note">
          This plan is a guide, not a deadline. You choose the pace.
        </p>
      </aside>
    </>
  );
}
