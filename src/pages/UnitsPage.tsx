import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import UnitCard from "../components/ui/UnitCard";
import { useUnits } from "../hooks/useUnits";
import { completedCount, deriveUnitStatus } from "../utils/units";

export default function UnitsPage() {
  const { units, taskStatus, loading, noPlacement, error } = useUnits();

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link to="/" className="text-xs text-brand-muted hover:text-brand-text">
          ← Dashboard
        </Link>
      </div>
      <PageHeader title="Units & Tasks" subtitle="6 programme units" />

      <div className="space-y-3 px-4">
        {loading && <p className="text-sm text-brand-muted">Loading units…</p>}
        {error && <p className="text-sm text-brand-danger">{error}</p>}
        {noPlacement && (
          <p className="text-sm text-brand-muted">
            You need an active placement to track unit progress.
          </p>
        )}

        {!loading &&
          units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              status={deriveUnitStatus(unit, taskStatus)}
              completed={completedCount(unit, taskStatus)}
            />
          ))}
      </div>
    </>
  );
}
