import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import { useUnits, type EvidenceConfirmedMap } from "../hooks/useUnits";
import type { Unit, UnitTask } from "../api/client";
import {
  TASK_STATUS_META,
  UNIT_STATUS_META,
  deriveUnitStatus,
  nextTaskStatus,
  taskStatusFor,
  type TaskStatusMap,
} from "../utils/units";
import { formatDate } from "../utils/format";

function suggestedHours(unit: Unit): string | null {
  const { suggested_hours_min: min, suggested_hours_max: max } = unit;
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}–${max} hours`;
  return `${min ?? max} hours`;
}

function TaskRow({
  task,
  map,
  onToggle,
}: {
  task: UnitTask;
  map: TaskStatusMap;
  onToggle: (task: UnitTask) => void;
}) {
  const status = taskStatusFor(map, task.id);
  const meta = TASK_STATUS_META[status];
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-brand-text">{task.description}</p>
        <button
          type="button"
          onClick={() => onToggle(task)}
          aria-label={`Toggle status (currently ${meta.label})`}
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
            meta.tone === "success"
              ? "bg-brand-success/10 text-brand-success"
              : meta.tone === "warning"
                ? "bg-brand-warning/10 text-brand-warning"
                : "bg-brand-muted/10 text-brand-muted"
          }`}
        >
          {meta.label}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-brand-muted">
        {!task.is_mandatory && <span>Optional</span>}
        {task.requires_evidence && <span>Evidence required</span>}
        {task.requires_supervisor_sign && (
          <label className="ml-auto flex items-center gap-1.5 text-brand-muted">
            <input
              type="checkbox"
              disabled
              className="h-3.5 w-3.5 rounded border-brand-border-md bg-brand-bg accent-brand-accent"
            />
            Supervisor sign-off
          </label>
        )}
      </div>
    </div>
  );
}

// The unit's "Evidence checklist" from the UKFI portfolio document, as a table
// the learner ticks off. A tick is the learner declaring that the evidence is
// uploaded — it is not a sign-off. Once every row is ticked, they can send the
// unit to their placement coordinator and tutor for review.
function EvidenceChecklist({
  unit,
  confirmed,
  requestedAt,
  onConfirm,
  onSubmit,
}: {
  unit: Unit;
  confirmed: EvidenceConfirmedMap;
  requestedAt: string | null;
  onConfirm: (itemId: string, next: boolean) => void;
  onSubmit: () => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notified, setNotified] = useState<string | null>(null);

  if (unit.evidence_items.length === 0) return null;

  const total = unit.evidence_items.length;
  const done = unit.evidence_items.filter((i) => confirmed[i.id]).length;
  const allDone = done === total;

  async function submit() {
    setBusy(true);
    setSubmitError(null);
    try {
      setNotified(await onSubmit());
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Couldn't send this unit for review — please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Evidence you need to upload" />
      <div className="px-4">
        <p className="pb-3 text-sm text-brand-muted">
          Upload each item on the Evidence tab, then tick it here to confirm.
        </p>

        <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
          <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
            <span className="text-xs uppercase tracking-wide text-brand-muted">
              Evidence required
            </span>
            <span className="text-xs tabular-nums text-brand-muted">
              {done} / {total} confirmed
            </span>
          </div>

          <ul className="divide-y divide-brand-border">
            {unit.evidence_items.map((item) => {
              const isConfirmed = confirmed[item.id] ?? false;
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 p-3">
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) => onConfirm(item.id, e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-border-md bg-brand-bg accent-brand-accent"
                    />
                    <span
                      className={`text-sm ${
                        isConfirmed ? "text-brand-muted" : "text-brand-text"
                      }`}
                    >
                      {item.description}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 space-y-3">
          <Link
            to="/evidence"
            className="block rounded-xl border border-brand-border bg-brand-surface p-3 text-center text-sm text-brand-accent transition-colors hover:border-brand-border-md"
          >
            Go to Evidence
          </Link>

          {requestedAt ? (
            <div className="rounded-xl border border-brand-success/30 bg-brand-success/5 p-4">
              <p className="text-sm text-brand-success">
                Sent for review on {formatDate(requestedAt)}.
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Your placement coordinator and tutor have been notified. Untick
                an item if you need to change something.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={submit}
                disabled={!allDone || busy}
                className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-40"
              >
                {busy ? "Sending…" : "Send to coordinator & tutor for review"}
              </button>
              {!allDone && (
                <p className="text-center text-xs text-brand-muted">
                  Tick all {total} items to send this unit for review.
                </p>
              )}
            </>
          )}

          {notified === "skipped" && (
            <p className="text-xs text-brand-warning">
              Request recorded, but the notification email is not configured —
              tell your coordinator directly.
            </p>
          )}
          {notified === "failed" && (
            <p className="text-xs text-brand-warning">
              Request recorded, but the notification email failed to send —
              tell your coordinator directly.
            </p>
          )}
          {submitError && (
            <p className="text-xs text-brand-danger">{submitError}</p>
          )}
        </div>
      </div>
    </>
  );
}

export default function UnitDetail() {
  const { unitId } = useParams();
  const {
    units,
    taskStatus,
    evidenceConfirmed,
    reviewRequested,
    loading,
    noPlacement,
    error,
    setTaskStatus,
    setEvidenceConfirmed,
    submitUnitForReview,
  } = useUnits();

  const unit = units.find((u) => String(u.unit_number) === unitId);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link
          to="/units"
          className="text-xs text-brand-muted hover:text-brand-text"
        >
          ← Units
        </Link>
      </div>

      {loading && <p className="px-4 text-sm text-brand-muted">Loading…</p>}
      {error && <p className="px-4 text-sm text-brand-danger">{error}</p>}
      {noPlacement && (
        <p className="px-4 text-sm text-brand-muted">
          You need an active placement to track unit progress.
        </p>
      )}
      {!loading && !unit && !noPlacement && (
        <p className="px-4 text-sm text-brand-muted">Unit not found.</p>
      )}

      {unit && (
        <>
          <div className="px-4 pt-1">
            <p className="text-xs text-brand-muted">Unit {unit.unit_number}</p>
            <div className="mt-0.5 flex items-start justify-between gap-3">
              <h1 className="text-xl font-medium text-brand-text">
                {unit.title}
              </h1>
              {(() => {
                const meta = UNIT_STATUS_META[deriveUnitStatus(unit, taskStatus)];
                return <Badge label={meta.label} tone={meta.tone} />;
              })()}
            </div>
          </div>

          <div className="mt-3 px-4">
            <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
              <p className="text-xs uppercase tracking-wide text-brand-muted">
                Aim
              </p>
              <p className="mt-1 text-sm text-brand-text">{unit.aim}</p>
              {suggestedHours(unit) && (
                <p className="mt-3 text-xs text-brand-muted">
                  Suggested: {suggestedHours(unit)}
                </p>
              )}
            </div>
          </div>

          <PageHeader title="Tasks" />
          <div className="space-y-3 px-4">
            {unit.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                map={taskStatus}
                onToggle={(t) =>
                  setTaskStatus(t.id, nextTaskStatus(taskStatusFor(taskStatus, t.id)))
                }
              />
            ))}
          </div>

          <EvidenceChecklist
            key={unit.id}
            unit={unit}
            confirmed={evidenceConfirmed}
            requestedAt={reviewRequested[unit.id] ?? null}
            onConfirm={(itemId, next) =>
              setEvidenceConfirmed(itemId, unit.id, next)
            }
            onSubmit={() => submitUnitForReview(unit.id)}
          />
        </>
      )}
    </>
  );
}
