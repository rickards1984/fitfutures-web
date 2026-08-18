import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  confirmEvidenceItem,
  getMyPlacement,
  getPlacementProgress,
  getUnits,
  requestUnitReview,
  updateTaskStatus,
  type Placement,
  type TaskStatus,
  type Unit,
  type UnitAssessmentOutcome,
} from "../api/client";
import type { TaskStatusMap } from "../utils/units";

/** item id -> the learner has confirmed that evidence is uploaded. */
export type EvidenceConfirmedMap = Record<string, boolean>;
/** unit id -> when the unit was sent for review, if it has been. */
export type ReviewRequestedMap = Record<string, string | null>;
/** unit id -> the assessor's decision on the unit, once one exists. */
export type UnitAssessment = {
  outcome: UnitAssessmentOutcome;
  feedback: string | null;
  assessedAt: string | null;
};
export type UnitAssessmentMap = Record<string, UnitAssessment>;

type UnitsState = {
  placement: Placement | null;
  units: Unit[];
  taskStatus: TaskStatusMap;
  evidenceConfirmed: EvidenceConfirmedMap;
  reviewRequested: ReviewRequestedMap;
  unitAssessment: UnitAssessmentMap;
  loading: boolean;
  noPlacement: boolean;
  error: string | null;
};

// Loads the 6 units and the learner's task + evidence-checklist progress for
// their active placement. `setTaskStatus` and `setEvidenceConfirmed` update
// optimistically and persist, rolling back on failure. `submitUnitForReview`
// emails the coordinator and tutor once every checklist item is confirmed.
export function useUnits() {
  const [state, setState] = useState<UnitsState>({
    placement: null,
    units: [],
    taskStatus: {},
    evidenceConfirmed: {},
    reviewRequested: {},
    unitAssessment: {},
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
        const evidenceConfirmed: EvidenceConfirmedMap = {};
        for (const c of progress.evidence_confirmations) {
          evidenceConfirmed[c.unit_evidence_item_id] = c.confirmed;
        }
        const reviewRequested: ReviewRequestedMap = {};
        const unitAssessment: UnitAssessmentMap = {};
        for (const u of progress.units) {
          reviewRequested[u.unit_id] = u.evidence_review_requested_at;
          if (u.assessment_outcome) {
            unitAssessment[u.unit_id] = {
              outcome: u.assessment_outcome,
              feedback: u.assessment_feedback,
              assessedAt: u.assessed_at,
            };
          }
        }
        setState({
          placement,
          units,
          taskStatus,
          evidenceConfirmed,
          reviewRequested,
          unitAssessment,
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

  const setEvidenceConfirmed = useCallback(
    async (itemId: string, unitId: string, confirmed: boolean) => {
      const placement = state.placement;
      if (!placement) return;
      const previous = state.evidenceConfirmed[itemId] ?? false;
      // Optimistic. Un-ticking clears any pending review request, mirroring
      // what the API does server-side.
      setState((s) => ({
        ...s,
        evidenceConfirmed: { ...s.evidenceConfirmed, [itemId]: confirmed },
        reviewRequested: confirmed
          ? s.reviewRequested
          : { ...s.reviewRequested, [unitId]: null },
        error: null,
      }));
      try {
        await confirmEvidenceItem(itemId, placement.id, confirmed);
      } catch {
        setState((s) => ({
          ...s,
          evidenceConfirmed: { ...s.evidenceConfirmed, [itemId]: previous },
          error: "Couldn't save that change — please try again.",
        }));
      }
    },
    [state.placement, state.evidenceConfirmed],
  );

  const submitUnitForReview = useCallback(
    async (unitId: string): Promise<string> => {
      const placement = state.placement;
      if (!placement) throw new Error("No active placement.");
      const result = await requestUnitReview(unitId, placement.id);
      setState((s) => ({
        ...s,
        reviewRequested: {
          ...s.reviewRequested,
          [unitId]: result.evidence_review_requested_at,
        },
      }));
      return result.notification_status;
    },
    [state.placement],
  );

  return { ...state, setTaskStatus, setEvidenceConfirmed, submitUnitForReview };
}
