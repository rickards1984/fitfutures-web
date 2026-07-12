import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import {
  createPlacement,
  getAdminLearners,
  type AdminLearner,
  type LearnerRoute,
} from "../api/client";
import { nextMonday } from "../utils/format";

const FIELD =
  "mt-1 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none focus:border-brand-accent";

const ROUTES: { value: LearnerRoute; label: string }[] = [
  { value: "route_a", label: "Route A — PT Qualification Builder" },
  { value: "route_b", label: "Route B — Already PT Qualified Specialist" },
];

export default function AdminEnrolPage() {
  const { learnerId = "" } = useParams();
  const navigate = useNavigate();

  const [learner, setLearner] = useState<AdminLearner | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [facility, setFacility] = useState("New Body Gym");
  const [route, setRoute] = useState<LearnerRoute>("route_a");
  const [startDate, setStartDate] = useState(nextMonday());
  const [plannedWeeks, setPlannedWeeks] = useState(18);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAdminLearners()
      .then((ls) => {
        if (!active) return;
        const found = ls.find((l) => l.id === learnerId) ?? null;
        setLearner(found);
        if (!found) setLoadError("That learner could not be found.");
        else if (found.has_active_placement)
          setLoadError(`${found.full_name} already has an active placement.`);
      })
      .catch(
        (err) =>
          active &&
          setLoadError(
            err instanceof Error ? err.message : "Failed to load learner.",
          ),
      );
    return () => {
      active = false;
    };
  }, [learnerId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facility.trim() || plannedWeeks < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPlacement({
        learner_id: learnerId,
        facility_name: facility.trim(),
        route,
        start_date: startDate,
        planned_weeks: plannedWeeks,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrolment failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // Confirmation screen after a successful enrolment.
  if (done) {
    return (
      <>
        <PageHeader title="Enrolled" subtitle="Placement created" />
        <div className="space-y-4 px-4">
          <div className="rounded-xl border border-brand-success/40 bg-brand-success/5 p-4">
            <p className="text-sm text-brand-text">
              ✅ <strong>{learner?.full_name ?? "The learner"}</strong> is now
              enrolled at <strong>{facility.trim()}</strong>.
            </p>
            <p className="mt-2 text-xs text-brand-muted">
              Their units, tasks and business milestones have been set up
              automatically. They'll see their placement next time they open the
              app.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg"
          >
            Back to Admin
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link to="/admin" className="text-xs text-brand-muted hover:text-brand-text">
          ← Admin
        </Link>
      </div>
      <PageHeader
        title="Enrol a learner"
        subtitle={learner ? learner.full_name : "Set up a new placement"}
      />

      <div className="px-4">
        {loadError ? (
          <p className="rounded-xl border border-brand-warning/40 bg-brand-warning/5 p-4 text-sm text-brand-warning">
            {loadError}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm text-brand-text">Facility name</span>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                placeholder="e.g. New Body Gym"
                className={FIELD}
              />
            </label>

            <label className="block">
              <span className="text-sm text-brand-text">Route</span>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as LearnerRoute)}
                className={FIELD}
              >
                {ROUTES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-brand-text">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={FIELD}
              />
              <span className="mt-1 block text-xs text-brand-muted">
                Defaults to next Monday.
              </span>
            </label>

            <label className="block">
              <span className="text-sm text-brand-text">Placement length</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={plannedWeeks}
                  onChange={(e) => setPlannedWeeks(Number(e.target.value))}
                  className={`${FIELD} w-24`}
                />
                <span className="text-sm text-brand-muted">weeks</span>
              </div>
            </label>

            {error && <p className="text-sm text-brand-danger">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !facility.trim() || plannedWeeks < 1}
              className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
            >
              {submitting ? "Enrolling…" : "Enrol learner"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
