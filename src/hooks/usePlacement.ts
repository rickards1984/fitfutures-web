import { useEffect, useState } from "react";
import {
  ApiError,
  getKpiTotals,
  getMyPlacement,
  type KpiTotals,
  type Placement,
} from "../api/client";

type PlacementState = {
  placement: Placement | null;
  totals: KpiTotals | null;
  loading: boolean;
  // True when the learner simply has no active placement yet (API 404) —
  // distinct from an unexpected error.
  noPlacement: boolean;
  error: string | null;
};

// Loads the learner's active placement and its cumulative KPI totals for the
// Dashboard. Totals are fetched once the placement id is known.
export function usePlacement(): PlacementState {
  const [state, setState] = useState<PlacementState>({
    placement: null,
    totals: null,
    loading: true,
    noPlacement: false,
    error: null,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const placement = await getMyPlacement();
        const totals = await getKpiTotals(placement.id);
        if (!active) return;
        setState({
          placement,
          totals,
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
            loading: false,
            noPlacement: true,
            error: null,
          });
          return;
        }
        setState({
          placement: null,
          totals: null,
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
