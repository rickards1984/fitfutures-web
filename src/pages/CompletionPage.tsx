import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import Badge, { type BadgeTone } from "../components/ui/Badge";
import {
  ApiError,
  decideCompletion,
  getCompletionReview,
  getCompletionRoster,
  getMyCompletion,
  getProfile,
  submitCompletion,
  type CompletionDecision,
  type CompletionReview,
  type CompletionRosterItem,
  type Profile,
} from "../api/client";
import { formatTimestamp } from "../utils/format";

const DECISION_META: Record<
  CompletionDecision,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: "Awaiting decision", tone: "muted" },
  pass: { label: "Pass", tone: "success" },
  refer: { label: "Refer", tone: "warning" },
};

const PRIMARY_BTN =
  "w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50";
const FIELD =
  "mt-2 w-full resize-none rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent";

function DecisionBadge({ decision }: { decision: CompletionDecision }) {
  const meta = DECISION_META[decision];
  return <Badge label={meta.label} tone={meta.tone} />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      {children}
    </div>
  );
}

// Read-only view of the tutor's decision, shown to a learner once decided.
function DecisionOutcome({ review }: { review: CompletionReview }) {
  const passed = review.tutor_decision === "pass";
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-brand-text">Tutor decision</h2>
        <DecisionBadge decision={review.tutor_decision} />
      </div>
      <p className="mt-2 text-xs text-brand-muted">
        Decided {formatTimestamp(review.decided_at)}
      </p>
      {review.tutor_feedback && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-brand-text">
          {review.tutor_feedback}
        </p>
      )}
      {passed && review.certificate_triggered && (
        <p className="mt-3 text-xs text-brand-success">
          🎓 Your Focus Awards CPD certificate has been requested.
        </p>
      )}
    </Card>
  );
}

// --- Learner ---

function LearnerView() {
  const [review, setReview] = useState<CompletionReview | null>(null);
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await getMyCompletion();
        if (!active) return;
        setReview(r);
        setReflection(r.learner_final_reflection ?? "");
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("You need an active placement before you can complete it.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit() {
    if (!review || !reflection.trim()) return;
    setSaving(true);
    setError(null);
    setSavedNote(false);
    try {
      const updated = await submitCompletion(
        review.placement_id,
        reflection.trim(),
      );
      setReview(updated);
      setSavedNote(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-brand-muted">Loading…</p>;
  if (error && !review)
    return <p className="text-sm text-brand-danger">{error}</p>;
  if (!review) return null;

  const decided = review.tutor_decision !== "pending";
  // Only a Pass is terminal. A Refer sends the learner back to revise and
  // resubmit, so the reflection stays editable until they pass.
  const locked = review.tutor_decision === "pass";
  const referred = review.tutor_decision === "refer";

  return (
    <div className="space-y-3">
      {decided && <DecisionOutcome review={review} />}

      <Card>
        <h2 className="text-sm font-medium text-brand-text">Final reflection</h2>
        <p className="mt-1 text-xs text-brand-muted">
          {referred
            ? "Your tutor has referred your placement — revise your reflection and resubmit."
            : "Sum up your placement — what you achieved, what you learned, and where you go next. Your tutor reads this before deciding."}
        </p>
        <textarea
          rows={8}
          value={reflection}
          onChange={(e) => {
            setReflection(e.target.value);
            setSavedNote(false);
          }}
          disabled={locked}
          placeholder="Write your final reflection…"
          className={`${FIELD} disabled:opacity-60`}
        />
        {!locked && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || !reflection.trim()}
            className={`mt-3 ${PRIMARY_BTN}`}
          >
            {saving
              ? "Submitting…"
              : review.learner_final_reflection
                ? "Update reflection"
                : "Submit reflection"}
          </button>
        )}
        {savedNote && (
          <p className="mt-2 text-xs text-brand-success">
            Saved — your tutor will review it shortly.
          </p>
        )}
        {error && review && (
          <p className="mt-2 text-xs text-brand-danger">{error}</p>
        )}
        {locked && (
          <p className="mt-2 text-xs text-brand-muted">
            You've passed — your placement is complete and the reflection is
            locked.
          </p>
        )}
      </Card>
    </div>
  );
}

// --- Tutor / admin ---

function RosterRow({
  item,
  selected,
  onSelect,
}: {
  item: CompletionRosterItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-brand-accent bg-brand-accent/5"
          : "border-brand-border bg-brand-surface hover:border-brand-border-md"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-brand-text">
          {item.learner_name}
        </span>
        <DecisionBadge decision={item.decision} />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-brand-muted">
        <span>{item.facility_name}</span>
        <span>
          Week {item.current_week_number} / {item.planned_weeks}
        </span>
      </div>
      {!item.reflection_submitted && item.decision === "pending" && (
        <p className="mt-1 text-xs text-brand-muted">
          No final reflection submitted yet.
        </p>
      )}
    </button>
  );
}

function DecisionPanel({
  placementId,
  onDecided,
}: {
  placementId: string;
  onDecided: (review: CompletionReview) => void;
}) {
  const [review, setReview] = useState<CompletionReview | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<null | "pass" | "refer">(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const r = await getCompletionReview(placementId);
        if (!active) return;
        setReview(r);
        setFeedback(r.tutor_feedback ?? "");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load review.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [placementId]);

  async function decide(decision: "pass" | "refer") {
    setSaving(decision);
    setError(null);
    try {
      const updated = await decideCompletion(
        placementId,
        decision,
        feedback.trim() || null,
      );
      setReview(updated);
      onDecided(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record decision.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p className="text-sm text-brand-muted">Loading review…</p>;
  if (!review) return <p className="text-sm text-brand-danger">{error}</p>;

  const passed = review.tutor_decision === "pass";
  const decided = review.tutor_decision !== "pending";

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-brand-text">
            Learner's final reflection
          </h2>
          <DecisionBadge decision={review.tutor_decision} />
        </div>
        {review.learner_final_reflection ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-brand-text">
            {review.learner_final_reflection}
          </p>
        ) : (
          <p className="mt-3 text-sm text-brand-muted">
            The learner has not submitted a final reflection yet. You can still
            record a decision.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-brand-text">Decision</h2>
        {passed ? (
          <p className="mt-2 text-sm text-brand-success">
            🎓 Passed on {formatTimestamp(review.decided_at)}. Placement complete
            and a Focus Awards CPD certificate has been requested.
          </p>
        ) : (
          <>
            <label className="mt-2 block">
              <span className="text-xs text-brand-muted">Feedback</span>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Feedback for the learner…"
                className={FIELD}
              />
            </label>
            {decided && (
              <p className="mt-2 text-xs text-brand-muted">
                Currently marked <strong>Refer</strong>. You can update the
                feedback, refer again, or record a Pass.
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => decide("refer")}
                disabled={saving !== null}
                className="rounded-xl border border-brand-warning/50 py-2.5 text-sm font-medium text-brand-warning transition-opacity disabled:opacity-50"
              >
                {saving === "refer" ? "Saving…" : "Refer"}
              </button>
              <button
                type="button"
                onClick={() => decide("pass")}
                disabled={saving !== null}
                className="rounded-xl bg-brand-success py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
              >
                {saving === "pass" ? "Saving…" : "Pass"}
              </button>
            </div>
            <p className="mt-2 text-xs text-brand-muted">
              A Pass completes the placement and triggers the certificate — it
              can't be undone here.
            </p>
          </>
        )}
        {error && <p className="mt-2 text-xs text-brand-danger">{error}</p>}
      </Card>
    </div>
  );
}

function StaffView() {
  const [roster, setRoster] = useState<CompletionRosterItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("placement");

  const load = useCallback(async () => {
    try {
      setRoster(await getCompletionRoster());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load learners.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function select(placementId: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("placement", placementId);
        return next;
      },
      { replace: true },
    );
  }

  if (error) return <p className="text-sm text-brand-danger">{error}</p>;
  if (!roster) return <p className="text-sm text-brand-muted">Loading…</p>;

  if (selectedId) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params);
            next.delete("placement");
            setParams(next, { replace: true });
          }}
          className="text-xs text-brand-muted hover:text-brand-text"
        >
          ← All learners
        </button>
        <DecisionPanel
          placementId={selectedId}
          onDecided={() => {
            // Refresh the roster badges after a decision.
            load();
          }}
        />
      </div>
    );
  }

  if (roster.length === 0)
    return (
      <p className="text-sm text-brand-muted">No placements to review yet.</p>
    );

  return (
    <div className="space-y-2">
      {roster.map((item) => (
        <RosterRow
          key={item.placement_id}
          item={item}
          selected={false}
          onSelect={() => select(item.placement_id)}
        />
      ))}
    </div>
  );
}

export default function CompletionPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((p) => active && setProfile(p))
      .catch(
        (err) =>
          active &&
          setError(err instanceof Error ? err.message : "Failed to load."),
      );
    return () => {
      active = false;
    };
  }, []);

  const isStaff =
    profile?.role === "tutor" || profile?.role === "admin";

  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link to="/" className="text-xs text-brand-muted hover:text-brand-text">
          ← Dashboard
        </Link>
      </div>
      <PageHeader
        title="Completion"
        subtitle={
          isStaff
            ? "Review learners and record Pass / Refer decisions"
            : "Your final reflection & Pass / Refer status"
        }
      />
      <div className="px-4">
        {error && <p className="text-sm text-brand-danger">{error}</p>}
        {!profile && !error && (
          <p className="text-sm text-brand-muted">Loading…</p>
        )}
        {profile && (isStaff ? <StaffView /> : <LearnerView />)}
      </div>
    </>
  );
}
