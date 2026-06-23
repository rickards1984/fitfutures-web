import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";

const CARDS = [
  { to: "/units", title: "Units & Tasks", desc: "6 programme units and evidence checklists" },
  { to: "/business", title: "Start Your Business", desc: "Business start-up milestones" },
  { to: "/completion", title: "Completion", desc: "Final reflection & Pass / Refer status" },
];

export default function Dashboard() {
  return (
    <>
      <PageHeader title="FitFutures" subtitle="UKFI placement programme" />

      {/* AI coach banner — placeholder until Phase 4 wires the live message */}
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

      {/* Off-nav destinations reached from the dashboard */}
      <div className="mt-4 space-y-3 px-4">
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
