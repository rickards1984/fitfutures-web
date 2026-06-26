import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import Badge from "../components/ui/Badge";
import { useUnits } from "../hooks/useUnits";
import type { Unit, UnitTask } from "../api/client";
import {
  TASK_STATUS_META,
  UNIT_STATUS_META,
  deriveUnitStatus,
  nextTaskStatus,
  taskStatusFor,
  type TaskStatusMap,
} from "../utils/units";

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

export default function UnitDetail() {
  const { unitId } = useParams();
  const { units, taskStatus, loading, noPlacement, error, setTaskStatus } =
    useUnits();

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
        </>
      )}
    </>
  );
}
