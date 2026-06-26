import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  createEvidence,
  getEvidence,
  getEvidenceUploadUrl,
  getMyPlacement,
  getUnits,
  type EvidenceItem,
  type Placement,
  type Unit,
} from "../api/client";
import { uploadToSignedUrl } from "../lib/storage";

type EvidenceState = {
  placement: Placement | null;
  units: Unit[];
  items: EvidenceItem[];
  loading: boolean;
  noPlacement: boolean;
  error: string | null;
};

// Loads the learner's placement, units (for grouping evidence by unit), and
// evidence items. `upload` runs the full flow: presign → upload → record.
export function useEvidence() {
  const [state, setState] = useState<EvidenceState>({
    placement: null,
    units: [],
    items: [],
    loading: true,
    noPlacement: false,
    error: null,
  });

  const load = useCallback(async () => {
    try {
      const placement = await getMyPlacement();
      const [units, items] = await Promise.all([
        getUnits(),
        getEvidence(placement.id),
      ]);
      setState({
        placement,
        units,
        items,
        loading: false,
        noPlacement: false,
        error: null,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState((s) => ({ ...s, loading: false, noPlacement: true }));
        return;
      }
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load evidence.",
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (file: File, title: string, unitTaskId: string | null) => {
      const placement = state.placement;
      if (!placement) throw new Error("No active placement.");

      const presigned = await getEvidenceUploadUrl(
        placement.id,
        file.name,
        file.type || "application/octet-stream",
      );
      await uploadToSignedUrl(
        presigned.bucket,
        presigned.path,
        presigned.token,
        file,
      );
      await createEvidence({
        placement_id: placement.id,
        path: presigned.path,
        title: title.trim() || file.name,
        file_type: file.type || "application/octet-stream",
        file_size_bytes: file.size,
        unit_task_id: unitTaskId,
      });
      await load();
    },
    [state.placement, load],
  );

  return { ...state, upload, refresh: load };
}
