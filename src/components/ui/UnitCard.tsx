import { Link } from "react-router-dom";
import Badge from "./Badge";
import type { Unit, UnitStatus } from "../../api/client";
import { UNIT_STATUS_META } from "../../utils/units";

export default function UnitCard({
  unit,
  status,
  completed,
}: {
  unit: Unit;
  status: UnitStatus;
  completed: number;
}) {
  const meta = UNIT_STATUS_META[status];
  const total = unit.tasks.length;
  return (
    <Link
      to={`/units/${unit.unit_number}`}
      className="block rounded-xl border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-border-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-brand-muted">Unit {unit.unit_number}</p>
          <h2 className="mt-0.5 text-sm font-medium text-brand-text">
            {unit.title}
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            {completed} / {total} {total === 1 ? "task" : "tasks"} complete
          </p>
        </div>
        <Badge label={meta.label} tone={meta.tone} />
      </div>
    </Link>
  );
}
