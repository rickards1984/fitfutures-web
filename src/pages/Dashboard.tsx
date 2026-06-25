import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import { usePlacement } from "../hooks/usePlacement";
import type { KpiTotals, Placement } from "../api/client";
import { formatDate, routeLabel } from "../utils/format";

const CARDS = [
  { to: "/units", title: "Units & Tasks", desc: "6 programme units and evidence checklists" },
  { to: "/business", title: "Start Your Business", desc: "Business start-up milestones" },
  { to: "/completion", title: "Completion", desc: "Final reflection & Pass / Refer status" },
];

// AI coach banner stays a placeholder until Phase 4 wires the live message.
function CoachBanner() {
  return (
    <div className="px-4">
      <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-brand-accent" aria-hidden>
            ✦
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-brand-accent">
            AI Coach
          </span>
        </div>
        <p className="mt-2 text-sm text-brand-muted">
          Your weekly accountability coach will appear here once you log your first KPI week.
        </p>
      </div>
    </div>
  );
}

function PlacementSummary({ placement }: { placement: Placement }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-brand-text">
          {placement.facility_name}
        </h2>
        <span className="text-xs text-brand-muted">
          Week {placement.current_week_number} of {placement.planned_weeks}
        </span>
      </div>
      <p className="mt-1 text-xs text-brand-muted">{routeLabel(placement.route)}</p>

      <div className="mt-3">
        <ProgressBar
          value={placement.current_week_number}
          max={placement.planned_weeks}
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-brand-muted">
        <span>Start {formatDate(placement.start_date)}</span>
        <span>Expected end {formatDate(placement.expected_end_date)}</span>
      </div>
    </div>
  );
}

function TotalsCard({ totals }: { totals: KpiTotals }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-brand-text">Placement totals</h2>
        <span className="text-xs text-brand-muted">
          {totals.weeks_logged} {totals.weeks_logged === 1 ? "week" : "weeks"} logged
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {totals.lines.map((line) => (
          <div key={line.key}>
            <div className="flex justify-between text-xs">
              <span className="text-brand-text">{line.label}</span>
              <span className="text-brand-muted tabular-nums">
                {line.actual} / {line.target}
              </span>
            </div>
            <div className="mt-1.5">
              <ProgressBar value={line.actual} max={line.target} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { placement, totals, loading, noPlacement, error } = usePlacement();

  return (
    <>
      <PageHeader title="FitFutures" subtitle="UKFI placement programme" />

      <CoachBanner />

      <div className="mt-4 space-y-3 px-4">
        {loading && (
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-muted">
            Loading your placement…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-brand-danger/40 bg-brand-danger/5 p-4 text-sm text-brand-danger">
            {error}
          </div>
        )}

        {noPlacement && (
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <h2 className="text-sm font-medium text-brand-text">No active placement yet</h2>
            <p className="mt-1 text-xs text-brand-muted">
              Once your tutor enrols you on a placement, your route, week and KPI
              totals will appear here.
            </p>
          </div>
        )}

        {placement && <PlacementSummary placement={placement} />}
        {totals && <TotalsCard totals={totals} />}
      </div>

      {/* Off-nav destinations reached from the dashboard */}
      <div className="mt-3 space-y-3 px-4">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block rounded-xl border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-border-md"
          >
            <h2 className="text-sm font-medium text-brand-text">{card.title}</h2>
            <p className="mt-0.5 text-xs text-brand-muted">{card.desc}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
