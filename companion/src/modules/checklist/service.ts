import type { TaskCard, TaskStatus } from "@/contracts/api";
import { getDatabase, withImmediateTransaction } from "@/infrastructure/db/client";

type TaskRow = {
  id: string;
  title: string;
  description: string;
  phase: string;
  phase_order: number;
  status: TaskStatus;
  estimated_minutes: number | null;
  base_priority: number;
  incomplete_prerequisites: number;
  dependent_count: number;
};

export class TaskNotFoundError extends Error {}
export class TaskNotEligibleError extends Error {}

function taskRows(userId: string): TaskRow[] {
  return getDatabase().prepare(`
    SELECT
      t.id,
      t.title,
      t.description,
      t.phase,
      t.phase_order,
      ut.status,
      t.estimated_minutes,
      t.base_priority,
      COALESCE(SUM(
        CASE
          WHEN dependency.task_id IS NOT NULL
            AND COALESCE(prerequisite_progress.status, 'missing')
              NOT IN ('completed', 'not_applicable')
          THEN 1 ELSE 0
        END
      ), 0) AS incomplete_prerequisites,
      (
        SELECT COUNT(*) FROM task_dependencies downstream
        WHERE downstream.prerequisite_task_id = t.id
      ) AS dependent_count
    FROM task_templates t
    JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = ?
    LEFT JOIN task_dependencies dependency ON dependency.task_id = t.id
    LEFT JOIN user_tasks prerequisite_progress
      ON prerequisite_progress.task_id = dependency.prerequisite_task_id
      AND prerequisite_progress.user_id = ut.user_id
    GROUP BY
      t.id, t.title, t.description, t.phase, t.phase_order, ut.status,
      t.estimated_minutes, t.base_priority
    ORDER BY t.phase_order ASC, t.base_priority DESC, t.id ASC
  `).all(userId) as unknown as TaskRow[];
}

function toCard(row: TaskRow): TaskCard {
  const finished = row.status === "completed" || row.status === "not_applicable";
  const eligible = !finished && row.incomplete_prerequisites === 0;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    phase: row.phase,
    status: row.status,
    eligible,
    ...(row.estimated_minutes
      ? { estimatedMinutes: row.estimated_minutes }
      : {}),
    ...(!finished && !eligible
      ? { reason: "Complete the required earlier step first." }
      : {}),
  };
}

export function listTaskCards(userId: string): TaskCard[] {
  return taskRows(userId).map(toCard);
}

/** Exact prerequisite edges for model context and explainable checklist UI. */
export function listTaskPrerequisites(): Record<string, string[]> {
  const rows = getDatabase().prepare(`
    SELECT task_id, prerequisite_task_id
    FROM task_dependencies
    ORDER BY task_id, prerequisite_task_id
  `).all() as unknown as Array<{
    task_id: string;
    prerequisite_task_id: string;
  }>;
  const result: Record<string, string[]> = {};
  for (const row of rows) {
    (result[row.task_id] ??= []).push(row.prerequisite_task_id);
  }
  return result;
}

export function recommendNextTasks(userId: string, limit = 2): TaskCard[] {
  return taskRows(userId)
    .filter(
      (row) =>
        row.status !== "completed" &&
        row.status !== "not_applicable" &&
        row.incomplete_prerequisites === 0,
    )
    .sort((left, right) => {
      const inProgressDelta =
        Number(right.status === "in_progress") -
        Number(left.status === "in_progress");
      if (inProgressDelta) return inProgressDelta;
      if (left.phase_order !== right.phase_order) {
        return left.phase_order - right.phase_order;
      }
      if (right.base_priority !== left.base_priority) {
        return right.base_priority - left.base_priority;
      }
      if (right.dependent_count !== left.dependent_count) {
        return right.dependent_count - left.dependent_count;
      }
      return left.id.localeCompare(right.id);
    })
    .slice(0, limit)
    .map(toCard);
}

export function completeTask(
  userId: string,
  taskId: string,
): { completedTask: TaskCard; newlyUnlocked: TaskCard[] } {
  return withImmediateTransaction((db) => {
    const before = listTaskCards(userId);
    const target = before.find((task) => task.id === taskId);
    if (!target) throw new TaskNotFoundError("Task not found");
    if (target.status === "completed") {
      return {
        completedTask: target,
        newlyUnlocked: recommendNextTasks(userId, 1),
      };
    }
    if (!target.eligible) {
      throw new TaskNotEligibleError("This task still has an incomplete prerequisite");
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE user_tasks
      SET status = 'completed', completed_at = ?
      WHERE user_id = ? AND task_id = ?
    `).run(now, userId, taskId);

    const after = listTaskCards(userId);
    const completedTask = after.find((task) => task.id === taskId);
    if (!completedTask) throw new TaskNotFoundError("Task disappeared after update");

    const eligibleBefore = new Set(
      before.filter((task) => task.eligible).map((task) => task.id),
    );
    const newlyUnlocked = after.filter(
      (task) => task.eligible && !eligibleBefore.has(task.id),
    );

    return { completedTask, newlyUnlocked };
  });
}
