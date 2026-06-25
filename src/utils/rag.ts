import type { KpiEntry, Placement, RAGStatus } from "../api/client";

// RAG thresholds — must match the API's kpi_calc.py.
export function calcRAG(actual: number, target: number): "green" | "amber" | "red" {
  if (target === 0) return "green";
  const pct = actual / target;
  if (pct >= 0.85) return "green";
  if (pct >= 0.5) return "amber";
  return "red";
}

// Metrics that count toward the overall weekly RAG (conversions excluded).
const RAG_FIELDS = [
  "placement_hours",
  "study_hours",
  "member_conversations",
  "ex_member_contacts",
  "retention_saves",
  "campaign_touches",
  "tasters_booked",
  "consultations",
] as const;

export function weekOverallRAG(entry: KpiEntry, p: Placement): RAGStatus {
  const rags = RAG_FIELDS.map((f) =>
    calcRAG(
      entry[`actual_${f}` as keyof KpiEntry] as number,
      p[`wk_target_${f}` as keyof Placement] as number,
    ),
  );
  if (rags.includes("red")) return "red";
  if (rags.includes("amber")) return "amber";
  return "green";
}
