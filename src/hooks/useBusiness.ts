import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getBusinessMilestones,
  getMyPlacement,
  updateBusinessMilestone,
  type BusinessMilestone,
  type Placement,
  type TaskStatus,
} from "../api/client";

type BusinessState = {
  placement: Placement | null;
  milestones: BusinessMilestone[];
  loading: boolean;
  noPlacement: boolean;
  error: string | null;
};

type MilestoneUpdate = {
  status?: TaskStatus;
  evidence_notes?: string | null;
  next_action?: string | null;
  target_date?: string | null;
};

// Loads the learner's business start-up milestones and persists edits.
export function useBusiness() {
  const [state, setState] = useState<BusinessState>({
    placement: null,
    milestones: [],
    loading: true,
    noPlacement: false,
    error: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const placement = await getMyPlacement();
        const milestones = await getBusinessMilestones(placement.id);
        if (!active) return;
        setState({
          placement,
          milestones,
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
          error:
            err instanceof Error ? err.message : "Failed to load milestones.",
        }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist an update and replace the milestone in place with the server row.
  const update = useCallback(
    async (milestoneId: string, updates: MilestoneUpdate) => {
      try {
        const saved = await updateBusinessMilestone(milestoneId, updates);
        setState((s) => ({
          ...s,
          milestones: s.milestones.map((m) => (m.id === milestoneId ? saved : m)),
          error: null,
        }));
      } catch {
        setState((s) => ({
          ...s,
          error: "Couldn't save that change — please try again.",
        }));
      }
    },
    [],
  );

  return { ...state, update };
}
