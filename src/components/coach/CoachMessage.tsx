import { useEffect, useState } from "react";

// The AI coach card. With `animate`, it fades + slides in (used when a fresh
// message returns from a KPI submission).
export default function CoachMessage({
  message,
  animate = false,
}: {
  message: string;
  animate?: boolean;
}) {
  const [shown, setShown] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  return (
    <div
      className={`rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-4 transition-all duration-500 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-brand-accent" aria-hidden>
          ✦
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-brand-accent">
          AI Coach
        </span>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm text-brand-text">{message}</p>
    </div>
  );
}
