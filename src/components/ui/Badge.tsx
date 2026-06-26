// Generic status badge: ~10% opacity background + full-strength text, matching
// the RAG pill treatment (brief §3).
export type BadgeTone = "muted" | "success" | "warning" | "danger" | "accent";

const TONES: Record<BadgeTone, string> = {
  muted: "bg-brand-muted/10 text-brand-muted",
  success: "bg-brand-success/10 text-brand-success",
  warning: "bg-brand-warning/10 text-brand-warning",
  danger: "bg-brand-danger/10 text-brand-danger",
  accent: "bg-brand-accent/10 text-brand-accent",
};

export default function Badge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}
