import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import RAGPill from "../components/ui/RAGPill";
import {
  getAdminLearners,
  getAdminPlacements,
  type AdminLearner,
  type AdminPlacement,
} from "../api/client";

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="px-1">
      <h2 className="text-sm font-medium text-brand-text">{title}</h2>
      <p className="mt-0.5 text-xs text-brand-muted">{hint}</p>
    </div>
  );
}

function AwaitingCard({
  learner,
  onEnrol,
}: {
  learner: AdminLearner;
  onEnrol: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brand-text">
          {learner.full_name}
        </p>
        <p className="truncate text-xs text-brand-muted">{learner.email}</p>
      </div>
      <button
        type="button"
        onClick={onEnrol}
        className="shrink-0 rounded-xl bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg"
      >
        Enrol
      </button>
    </div>
  );
}

function RosterCard({
  placement,
  onOpen,
}: {
  placement: AdminPlacement;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-brand-border bg-brand-surface p-4 text-left transition-colors hover:border-brand-border-md"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-brand-text">
          {placement.learner_name}
        </p>
        <RAGPill status={placement.latest_rag} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-brand-muted">
        <span className="truncate">{placement.facility_name}</span>
        <span className="shrink-0">
          Week {placement.current_week_number} of {placement.planned_weeks}
        </span>
      </div>
    </button>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [learners, setLearners] = useState<AdminLearner[] | null>(null);
  const [placements, setPlacements] = useState<AdminPlacement[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminLearners(), getAdminPlacements()])
      .then(([ls, ps]) => {
        if (!active) return;
        setLearners(ls);
        setPlacements(ps);
      })
      .catch(
        (err) =>
          active &&
          setError(err instanceof Error ? err.message : "Failed to load."),
      );
    return () => {
      active = false;
    };
  }, []);

  const awaiting = (learners ?? []).filter((l) => !l.has_active_placement);
  const loading = learners === null || placements === null;

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link
          to="/profile"
          className="text-xs text-brand-muted hover:text-brand-text"
        >
          ← Profile
        </Link>
      </div>
      <PageHeader
        title="Admin"
        subtitle="Enrol learners and track everyone's placement"
      />

      <div className="space-y-6 px-4">
        {error && (
          <p className="rounded-xl border border-brand-danger/40 bg-brand-danger/5 p-4 text-sm text-brand-danger">
            {error}
          </p>
        )}
        {loading && !error && (
          <p className="text-sm text-brand-muted">Loading…</p>
        )}

        {!loading && (
          <>
            <section className="space-y-3">
              <SectionHeading
                title="Awaiting enrolment"
                hint="Learners who don't have a placement yet"
              />
              {awaiting.length === 0 ? (
                <p className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-muted">
                  Everyone is enrolled — nothing waiting here.
                </p>
              ) : (
                <div className="space-y-2">
                  {awaiting.map((l) => (
                    <AwaitingCard
                      key={l.id}
                      learner={l}
                      onEnrol={() => navigate(`/admin/enrol/${l.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <SectionHeading
                title="Active roster"
                hint="Everyone currently on a placement"
              />
              {(placements ?? []).length === 0 ? (
                <p className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-muted">
                  No active placements yet. Enrol a learner above to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {(placements ?? []).map((p) => (
                    <RosterCard
                      key={p.placement_id}
                      placement={p}
                      onOpen={() => navigate(`/admin/learner/${p.learner_id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
