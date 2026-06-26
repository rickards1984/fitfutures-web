import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { useBusiness } from "../hooks/useBusiness";
import type { BusinessMilestone } from "../api/client";
import { TASK_STATUS_META, nextTaskStatus } from "../utils/units";

function MilestoneCard({
  milestone,
  onStatus,
  onSaveNotes,
}: {
  milestone: BusinessMilestone;
  onStatus: (next: BusinessMilestone["status"]) => void;
  onSaveNotes: (notes: string | null, nextAction: string | null) => void;
}) {
  const [notes, setNotes] = useState(milestone.evidence_notes ?? "");
  const [nextAction, setNextAction] = useState(milestone.next_action ?? "");
  const meta = TASK_STATUS_META[milestone.status];

  const toneClass =
    meta.tone === "success"
      ? "bg-brand-success/10 text-brand-success"
      : meta.tone === "warning"
        ? "bg-brand-warning/10 text-brand-warning"
        : "bg-brand-muted/10 text-brand-muted";

  const fieldClass =
    "mt-2 w-full resize-none rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent";

  function persist(nextNotes: string, nextNext: string) {
    onSaveNotes(nextNotes.trim() || null, nextNext.trim() || null);
  }

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-brand-text">{milestone.title}</h2>
        <button
          type="button"
          onClick={() => onStatus(nextTaskStatus(milestone.status))}
          aria-label={`Toggle status (currently ${meta.label})`}
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${toneClass}`}
        >
          {meta.label}
        </button>
      </div>

      <label className="mt-3 block">
        <span className="text-xs text-brand-muted">Notes</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => persist(notes, nextAction)}
          placeholder="Progress, evidence, context…"
          className={fieldClass}
        />
      </label>

      <label className="mt-2 block">
        <span className="text-xs text-brand-muted">Next action</span>
        <input
          type="text"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          onBlur={() => persist(notes, nextAction)}
          placeholder="The single next step"
          className={fieldClass}
        />
      </label>
    </div>
  );
}

export default function BusinessPage() {
  const { placement, milestones, loading, noPlacement, error, update } =
    useBusiness();

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link to="/" className="text-xs text-brand-muted hover:text-brand-text">
          ← Dashboard
        </Link>
      </div>
      <PageHeader
        title="Start Your Business"
        subtitle="Your business start-up milestones"
      />

      <div className="space-y-3 px-4">
        {loading && <p className="text-sm text-brand-muted">Loading…</p>}
        {error && <p className="text-sm text-brand-danger">{error}</p>}
        {noPlacement && (
          <p className="text-sm text-brand-muted">
            You need an active placement to track business milestones.
          </p>
        )}

        {placement &&
          milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              onStatus={(next) => update(m.id, { status: next })}
              onSaveNotes={(notes, nextAction) =>
                update(m.id, { evidence_notes: notes, next_action: nextAction })
              }
            />
          ))}
      </div>
    </>
  );
}
