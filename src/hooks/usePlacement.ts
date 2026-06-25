import { useEffect, useState } from "react";
import {
  ApiError,
  getKpiTotals,
  getKpiWeeks,
  getMyPlacement,
  type KpiEntry,
  type KpiTotals,
  type Placement,
} from "../api/client";

type PlacementState = {
  placement: Placement | null;
  totals: KpiTotals | null;
  weeks: KpiEntry[];
  loading: boolean;
  // True when the learner simply has no active placement yet (API 404) —
  // distinct from an unexpected error.
  noPlacement: boolean;
  error: string | null;
};

// Loads the learner's active placement plus its KPI totals and submitted weeks
// for the Dashboard. Totals + weeks are fetched once the placement id is known.
export function usePlacement(): PlacementState {
  const [state, setState] = useState<PlacementState>({
    placement: null,
    totals: null,
    weeks: [],
    loading: true,
    noPlacement: false,
    error: null,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const placement = await getMyPlacement();
        const [totals, weeks] = await Promise.all([
          getKpiTotals(placement.id),
          getKpiWeeks(placement.id),
        ]);
        if (!active) return;
        setState({
          placement,
          totals,
          weeks,
          loading: false,
          noPlacement: false,
          error: null,
        });
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({
            placement: null,
            totals: null,
            weeks: [],
            loading: false,
            noPlacement: true,
            error: null,
          });
          return;
        }
        setState({
          placement: null,
          totals: null,
          weeks: [],
          loading: false,
          noPlacement: false,
          error: err instanceof Error ? err.message : "Failed to load placement.",
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
