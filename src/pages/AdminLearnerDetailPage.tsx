import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import {
  assessUnit,
  getAdminLearnerSummary,
  getAdminPlacementChecklist,
  getAdminPlacementEvidence,
  reviewEvidence,
  type AdminChecklistResponse,
  type AdminChecklistTask,
  type AdminChecklistUnit,
  type AdminEvidenceItem,
  type AdminEvidenceResponse,
  type AdminLearnerSummary,
  type TaskStatus,
  type UnitAssessmentOutcome,
  type UnitStatus,
} from "../api/client";
import { routeLabel, formatTimestamp } from "../utils/format";

const UNIT_STATUS_META: Record<UnitStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
};

const TASK_STATUS_META: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  not_started: { label: "Not started", tone: "muted" },
  in_progress: { label: "In progress", tone: "warning" },
  complete: { label: "Complete", tone: "success" },
  not_applicable: { label: "N/A", tone: "muted" },
};

type Tab = "overview" | "evidence" | "units";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "evidence", label: "Files" },
  { key: "units", label: "Units" },
];

const ASSESSMENT_META: Record<
  UnitAssessmentOutcome,
  { label: string; tone: BadgeTone }
> = {
  achieved: { label: "Achieved", tone: "success" },
  not_achieved: { label: "Not yet achieved", tone: "warning" },
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

function evidenceBadge(item: AdminEvidenceItem) {
  if (item.supervisor_approved === true)
    return <Badge label="Approved" tone="success" />;
  if (item.supervisor_approved === false)
    return <Badge label="Changes requested" tone="danger" />;
  return <Badge label="Pending review" tone="muted" />;
}

// One evidence item with inline approve / request-changes controls. `onReview`
// resolves once the server has recorded the decision; the parent then refetches.
function EvidenceReviewCard({
  item,
  onReview,
}: {
  item: AdminEvidenceItem;
  onReview: (approved: boolean, feedback: string | null) => Promise<void>;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(item.review_feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(approved: boolean, note: string | null) {
    setBusy(true);
    setError(null);
    try {
      await onReview(approved, note);
      setShowFeedback(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-brand-text" title={item.title}>
            {item.title}
          </p>
          {item.task_description && (
            <p className="mt-0.5 truncate text-xs text-brand-muted">
              {item.task_description}
            </p>
          )}
          <p className="mt-0.5 text-xs text-brand-muted">
            {item.uploaded_by_name} · {formatTimestamp(item.created_at)}
          </p>
        </div>
        {evidenceBadge(item)}
      </div>

      {item.download_url && (
        <a
          href={item.download_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-brand-accent hover:underline"
        >
          Open file →
        </a>
      )}

      {item.supervisor_approved === false && item.review_feedback && (
        <p className="mt-2 rounded-lg border border-brand-danger/40 bg-brand-danger/5 p-2 text-xs text-brand-text">
          <span className="text-brand-danger">Feedback sent:</span>{" "}
          {item.review_feedback}
        </p>
      )}
      {item.supervisor_approved !== null && item.reviewed_by_name && (
        <p className="mt-1 text-xs text-brand-muted">
          Reviewed by {item.reviewed_by_name}
        </p>
      )}

      {showFeedback ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What needs changing? (optional)"
            className="w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => run(false, feedback.trim() || null)}
              className="flex-1 rounded-xl bg-brand-danger py-2 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowFeedback(false)}
              className="rounded-xl border border-brand-border px-4 py-2 text-sm text-brand-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy || item.supervisor_approved === true}
            onClick={() => run(true, null)}
            className="flex-1 rounded-xl bg-brand-accent py-2 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
          >
            {item.supervisor_approved === true ? "Approved" : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowFeedback(true)}
            className="flex-1 rounded-xl border border-brand-border py-2 text-sm text-brand-text transition-colors hover:border-brand-border-md"
          >
            Request changes
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-brand-danger">{error}</p>}
    </div>
  );
}

function EvidenceTab({ placementId }: { placementId: string }) {
  const [data, setData] = useState<AdminEvidenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminPlacementEvidence(placementId);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evidence.");
    }
  }, [placementId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="text-sm text-brand-danger">{error}</p>;
  if (!data) return <p className="text-sm text-brand-muted">Loading…</p>;
  if (data.groups.length === 0)
    return (
      <p className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-muted">
        No evidence uploaded yet.
      </p>
    );

  return (
    <div className="space-y-5">
      {data.groups.map((group) => (
        <section key={group.title} className="space-y-2">
          <h3 className="text-sm font-medium text-brand-text">{group.title}</h3>
          {group.items.map((item) => (
            <EvidenceReviewCard
              key={item.id}
              item={item}
              onReview={async (approved, feedback) => {
                await reviewEvidence(item.id, approved, feedback);
                await load();
              }}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function ChecklistTaskRow({ task }: { task: AdminChecklistTask }) {
  const meta = TASK_STATUS_META[task.status];
  return (
    <div className="flex items-start justify-between gap-3 border-t border-brand-border py-2 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm text-brand-text">{task.description}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-brand-muted">
          {task.is_mandatory && <span>Mandatory</span>}
          {task.requires_evidence && (
            <span>
              Evidence: {task.evidence_count}
              {task.evidence_count === 0 ? " (none)" : ""}
            </span>
          )}
          {task.requires_supervisor_sign && (
            <span
              className={
                task.supervisor_signed
                  ? "text-brand-success"
                  : "text-brand-warning"
              }
            >
              {task.supervisor_signed ? "Signed off" : "Awaiting sign-off"}
            </span>
          )}
        </div>
      </div>
      <Badge label={meta.label} tone={meta.tone} />
    </div>
  );
}

// One unit's assessment card: the aim it has to meet, what the learner has
// confirmed and uploaded, its tasks, and the achieved / not-achieved decision.
function UnitReviewCard({
  placementId,
  unit,
  onAssessed,
}: {
  placementId: string;
  unit: AdminChecklistUnit;
  onAssessed: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(unit.assessment.feedback ?? "");
  const [pending, setPending] = useState<UnitAssessmentOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notified, setNotified] = useState<string | null>(null);

  const statusMeta = UNIT_STATUS_META[unit.status];
  const outcome = unit.assessment.outcome;
  const totalItems = unit.evidence_items.length;
  const awaitingDecision =
    unit.evidence_review_requested_at !== null && outcome === null;

  async function save(next: UnitAssessmentOutcome) {
    const note = feedback.trim() || null;
    // The API rejects a referral with no feedback; ask for it here rather than
    // bouncing the assessor off a 400.
    if (next === "not_achieved" && !note) {
      setPending("not_achieved");
      setError("Add feedback explaining what the learner needs to fix.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await assessUnit(placementId, unit.unit_id, next, note);
      setNotified(res.notification_status);
      setPending(null);
      await onAssessed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the assessment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-brand-text">
            Unit {unit.unit_number}: {unit.title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-brand-muted">
            {unit.aim}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {outcome ? (
            <Badge
              label={ASSESSMENT_META[outcome].label}
              tone={ASSESSMENT_META[outcome].tone}
            />
          ) : (
            <Badge label={statusMeta.label} tone={statusMeta.tone} />
          )}
          {!unit.is_mandatory && (
            <span className="text-[11px] text-brand-muted">Optional</span>
          )}
        </div>
      </div>

      {awaitingDecision && (
        <p className="mt-3 rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-2 text-xs text-brand-accent">
          Sent for review {formatTimestamp(unit.evidence_review_requested_at)}
        </p>
      )}

      {outcome && (
        <div
          className={`mt-3 rounded-lg border p-3 ${
            outcome === "achieved"
              ? "border-brand-success/40 bg-brand-success/5"
              : "border-brand-warning/40 bg-brand-warning/5"
          }`}
        >
          <p className="text-xs text-brand-muted">
            {ASSESSMENT_META[outcome].label}
            {unit.assessment.assessed_by_name
              ? ` by ${unit.assessment.assessed_by_name}`
              : ""}{" "}
            · {formatTimestamp(unit.assessment.assessed_at)}
          </p>
          {unit.assessment.feedback && (
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-brand-text">
              {unit.assessment.feedback}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-muted">
        <span
          className={
            totalItems > 0 && unit.evidence_confirmed_count === totalItems
              ? "text-brand-success"
              : undefined
          }
        >
          Checklist {unit.evidence_confirmed_count}/{totalItems} confirmed
        </span>
        <span>
          {unit.evidence_file_count}{" "}
          {unit.evidence_file_count === 1 ? "file" : "files"}
        </span>
        {unit.evidence_files_pending_review > 0 && (
          <span className="text-brand-warning">
            {unit.evidence_files_pending_review} awaiting file review
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-xs text-brand-accent hover:underline"
      >
        {expanded ? "Hide detail" : "Show checklist & tasks"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {totalItems > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-muted">
                Evidence checklist — learner confirmations
              </p>
              <ul className="mt-2 space-y-1.5">
                {unit.evidence_items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span
                      aria-hidden
                      className={`mt-0.5 shrink-0 ${
                        item.confirmed ? "text-brand-success" : "text-brand-muted"
                      }`}
                    >
                      {item.confirmed ? "✓" : "○"}
                    </span>
                    <span
                      className={
                        item.confirmed ? "text-brand-text" : "text-brand-muted"
                      }
                    >
                      {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unit.tasks.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-muted">
                Tasks
              </p>
              <div className="mt-2">
                {unit.tasks.map((t) => (
                  <ChecklistTaskRow key={t.task_order} task={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-brand-border pt-3">
        <label className="block">
          <span className="text-xs text-brand-muted">
            Feedback to the learner
            {pending === "not_achieved" ? " (required)" : " (optional)"}
          </span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="What did the evidence show, and what (if anything) is missing?"
            className="mt-2 w-full resize-none rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent"
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => save("achieved")}
            className="flex-1 rounded-xl bg-brand-success py-2 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
          >
            {busy ? "Saving…" : "Achieved"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => save("not_achieved")}
            className="flex-1 rounded-xl border border-brand-warning py-2 text-sm font-medium text-brand-warning transition-opacity disabled:opacity-50"
          >
            Not yet achieved
          </button>
        </div>
        <p className="mt-2 text-xs text-brand-muted">
          The learner is emailed the outcome and your feedback. A referral
          reopens the unit so they can resubmit.
        </p>
        {notified === "failed" && (
          <p className="mt-1 text-xs text-brand-warning">
            Saved, but the learner notification email failed to send.
          </p>
        )}
        {notified === "skipped" && (
          <p className="mt-1 text-xs text-brand-warning">
            Saved, but no notification email was sent (email not configured).
          </p>
        )}
        {error && <p className="mt-2 text-xs text-brand-danger">{error}</p>}
      </div>
    </div>
  );
}

function UnitsTab({ placementId }: { placementId: string }) {
  const [data, setData] = useState<AdminChecklistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getAdminPlacementChecklist(placementId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load units.");
    }
  }, [placementId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="text-sm text-brand-danger">{error}</p>;
  if (!data) return <p className="text-sm text-brand-muted">Loading…</p>;

  const awaiting = data.units.filter(
    (u) => u.evidence_review_requested_at && !u.assessment.outcome,
  ).length;

  return (
    <div className="space-y-3">
      {awaiting > 0 && (
        <p className="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-3 text-sm text-brand-accent">
          {awaiting} {awaiting === 1 ? "unit is" : "units are"} waiting for your
          decision.
        </p>
      )}
      {data.units.map((unit) => (
        <UnitReviewCard
          key={unit.unit_id}
          placementId={placementId}
          unit={unit}
          onAssessed={load}
        />
      ))}
    </div>
  );
}

function OverviewTab({ summary }: { summary: AdminLearnerSummary }) {
  return (
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
          <p className="text-sm text-brand-muted">No KPI weeks logged yet.</p>
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
  );
}

export default function AdminLearnerDetailPage() {
  const { learnerId = "" } = useParams();
  const [summary, setSummary] = useState<AdminLearnerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

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
            <div className="flex gap-2 rounded-xl border border-brand-border bg-brand-surface p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                    tab === t.key
                      ? "bg-brand-bg text-brand-text"
                      : "text-brand-muted hover:text-brand-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "overview" && <OverviewTab summary={summary} />}
            {tab === "evidence" && (
              <EvidenceTab placementId={summary.placement_id} />
            )}
            {tab === "units" && <UnitsTab placementId={summary.placement_id} />}
          </>
        )}
      </div>
    </>
  );
}
