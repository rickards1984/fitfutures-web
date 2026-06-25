import type { RAGStatus } from "../../api/client";

// RAG pill: ~10% opacity background + full-strength text (brief §3).
const STYLES: Record<RAGStatus, { label: string; className: string }> = {
  green: { label: "On track", className: "bg-brand-success/10 text-brand-success" },
  amber: { label: "Behind", className: "bg-brand-warning/10 text-brand-warning" },
  red: { label: "At risk", className: "bg-brand-danger/10 text-brand-danger" },
  no_entry: { label: "No entry", className: "bg-brand-muted/10 text-brand-muted" },
};

export default function RAGPill({
  status,
  label,
}: {
  status: RAGStatus;
  label?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${s.className}`}
    >
      {label ?? s.label}
    </span>
  );
}
