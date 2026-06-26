import type { TaskStatus, Unit, UnitStatus } from "../api/client";

// Map of unit_task_id -> current status; missing means "not_started".
export type TaskStatusMap = Record<string, TaskStatus>;

export function taskStatusFor(map: TaskStatusMap, taskId: string): TaskStatus {
  return map[taskId] ?? "not_started";
}

// Derive a unit's status from its tasks — must match the API's units.py.
export function deriveUnitStatus(unit: Unit, map: TaskStatusMap): UnitStatus {
  const statuses = unit.tasks.map((t) => taskStatusFor(map, t.id));
  const applicable = statuses.filter((s) => s !== "not_applicable");
  if (applicable.length > 0 && applicable.every((s) => s === "complete")) {
    return "complete";
  }
  if (statuses.some((s) => s === "in_progress" || s === "complete")) {
    return "in_progress";
  }
  return "not_started";
}

export function completedCount(unit: Unit, map: TaskStatusMap): number {
  return unit.tasks.filter((t) => taskStatusFor(map, t.id) === "complete").length;
}

// Toggle cycle for the task checklist: not_started → in_progress → complete → …
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  switch (status) {
    case "not_started":
      return "in_progress";
    case "in_progress":
      return "complete";
    default:
      return "not_started";
  }
}

export const UNIT_STATUS_META: Record<
  UnitStatus,
  { label: string; tone: "muted" | "warning" | "success" }
> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; tone: "muted" | "warning" | "success" }
> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
  not_applicable: { label: "N/A", tone: "muted" },
};
