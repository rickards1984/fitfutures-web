import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getMyPlacement,
  getPlacementProgress,
  getUnits,
  updateTaskStatus,
  type Placement,
  type TaskStatus,
  type Unit,
} from "../api/client";
import type { TaskStatusMap } from "../utils/units";

type UnitsState = {
  placement: Placement | null;
  units: Unit[];
  taskStatus: TaskStatusMap;
  loading: boolean;
  noPlacement: boolean;
  error: string | null;
};

// Loads the 6 units and the learner's task progress for their active placement.
// `setTaskStatus` updates one task optimistically and persists it, rolling back
// on failure.
export function useUnits() {
  const [state, setState] = useState<UnitsState>({
    placement: null,
    units: [],
    taskStatus: {},
    loading: true,
    noPlacement: false,
    error: null,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const placement = await getMyPlacement();
        const [units, progress] = await Promise.all([
          getUnits(),
          getPlacementProgress(placement.id),
        ]);
        if (!active) return;
        const taskStatus: TaskStatusMap = {};
        for (const t of progress.tasks) taskStatus[t.unit_task_id] = t.status;
        setState({
          placement,
          units,
          taskStatus,
          loading: false,
          noPlacement: false,
          error: null,
        });
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setState((s) => ({ ...s, loading: false, noPlacement: true }));
          return;
        }
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load units.",
        }));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      const placement = state.placement;
      if (!placement) return;
      const previous = state.taskStatus[taskId] ?? "not_started";
      // Optimistic update.
      setState((s) => ({
        ...s,
        taskStatus: { ...s.taskStatus, [taskId]: status },
      }));
      try {
        await updateTaskStatus(taskId, placement.id, status);
      } catch {
        // Roll back on failure.
        setState((s) => ({
          ...s,
          taskStatus: { ...s.taskStatus, [taskId]: previous },
          error: "Couldn't save that change — please try again.",
        }));
      }
    },
    [state.placement, state.taskStatus],
  );

  return { ...state, setTaskStatus };
}
