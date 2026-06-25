// 3px progress bar per the design system (brief §3). Neutral fill — RAG colour
// is reserved for status pills; the accent is reserved for the AI coach.
type Props = {
  value: number;
  max: number;
};

export default function ProgressBar({ value, max }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-[3px] w-full overflow-hidden rounded-full bg-brand-border"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full bg-brand-text" style={{ width: `${pct}%` }} />
    </div>
  );
}
