import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import {
  getAdminLearnerSummary,
  type AdminLearnerSummary,
  type UnitStatus,
} from "../api/client";
import { routeLabel } from "../utils/format";

const UNIT_STATUS_META: Record<UnitStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <h2 className="text-sm font-medium text-brand-text">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function AdminLearnerDetailPage() {
  const { learnerId = "" } = useParams();
  const [summary, setSummary] = useState<AdminLearnerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminLearnerSummary(learnerId)
      .then((s) => active && setSummary(s))
      .catch(
        (err) =>
          active &&
          setError(err instanceof Error ? err.message : "Failed to load."),
      );
    return () => {
      active = false;
    };
  }, [learnerId]);

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link to="/admin" className="text-xs text-brand-muted hover:text-brand-text">
          ← Admin
        </Link>
      </div>
      <PageHeader
        title={summary?.learner_name ?? "Learner"}
        subtitle={summary ? summary.facility_name : "Placement detail"}
      />

      <div className="space-y-3 px-4">
        {error && <p className="text-sm text-brand-danger">{error}</p>}
        {!summary && !error && (
          <p className="text-sm text-brand-muted">Loading…</p>
        )}

        {summary && (
          <>
            <Card title="Placement">
              <div className="space-y-1 text-sm text-brand-text">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Route</span>
                  <span>{routeLabel(summary.route)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Week</span>
                  <span>
                    {summary.current_week_number} of {summary.planned_weeks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Weeks logged</span>
                  <span>{summary.weeks_logged}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Units complete</span>
                  <span>
                    {summary.units_complete} of {summary.units_total}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="KPI progress vs targets">
              {summary.weeks_logged === 0 ? (
                <p className="text-sm text-brand-muted">
                  No KPI weeks logged yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.kpi_lines.map((line) => (
                    <div key={line.key}>
                      <div className="flex justify-between text-xs">
                        <span className="text-brand-text">{line.label}</span>
                        <span className="tabular-nums text-brand-muted">
                          {line.actual} / {line.target}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar value={line.actual} max={line.target} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Unit progress">
              <div className="space-y-2">
                {summary.units.map((u) => {
                  const meta = UNIT_STATUS_META[u.status];
                  return (
                    <div
                      key={u.unit_number}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="min-w-0 truncate text-sm text-brand-text">
                        Unit {u.unit_number}: {u.title}
                      </span>
                      <Badge label={meta.label} tone={meta.tone} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
