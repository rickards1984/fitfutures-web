import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import CoachMessage from "../components/coach/CoachMessage";
import { usePlacement } from "../hooks/usePlacement";
import {
  submitKpiWeek,
  type KpiEntry,
  type KpiWeekSubmit,
  type Placement,
} from "../api/client";

// The 9 KPI metrics, in spreadsheet order. `step` lets hours accept halves.
const FIELDS = [
  { key: "placement_hours", label: "Placement hours", step: 0.5 },
  { key: "study_hours", label: "Study hours", step: 0.5 },
  { key: "member_conversations", label: "Member conversations", step: 1 },
  { key: "ex_member_contacts", label: "Ex-member contacts", step: 1 },
  { key: "retention_saves", label: "Retention saves", step: 1 },
  { key: "campaign_touches", label: "Campaign touches", step: 1 },
  { key: "tasters_booked", label: "Tasters booked", step: 1 },
  { key: "consultations", label: "Consultations", step: 1 },
  { key: "conversions", label: "Conversions", step: 1 },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

function emptyValues(): Record<FieldKey, string> {
  return Object.fromEntries(FIELDS.map((f) => [f.key, ""])) as Record<
    FieldKey,
    string
  >;
}

function Form({
  placement,
  existing,
}: {
  placement: Placement;
  existing?: KpiEntry;
}) {
  const navigate = useNavigate();
  const [weekNumber, setWeekNumber] = useState(placement.current_week_number);
  const [values, setValues] = useState<Record<FieldKey, string>>(emptyValues);
  const [reflection, setReflection] = useState("");
  const [keyIssue, setKeyIssue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KpiEntry | null>(null);

  // Prefill from the existing entry for the chosen week, if any.
  useEffect(() => {
    if (!existing) {
      setValues(emptyValues());
      setReflection("");
      setKeyIssue("");
      return;
    }
    setValues(
      Object.fromEntries(
        FIELDS.map((f) => [
          f.key,
          String(existing[`actual_${f.key}` as keyof KpiEntry] ?? ""),
        ]),
      ) as Record<FieldKey, string>,
    );
    setReflection(existing.reflection ?? "");
    setKeyIssue(existing.key_issue ?? "");
  }, [existing]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: KpiWeekSubmit = {
        actual_placement_hours: Number(values.placement_hours) || 0,
        actual_study_hours: Number(values.study_hours) || 0,
        actual_member_conversations: Number(values.member_conversations) || 0,
        actual_ex_member_contacts: Number(values.ex_member_contacts) || 0,
        actual_retention_saves: Number(values.retention_saves) || 0,
        actual_campaign_touches: Number(values.campaign_touches) || 0,
        actual_tasters_booked: Number(values.tasters_booked) || 0,
        actual_consultations: Number(values.consultations) || 0,
        actual_conversions: Number(values.conversions) || 0,
        reflection: reflection.trim() || null,
        key_issue: keyIssue.trim() || null,
      };
      const entry = await submitKpiWeek(placement.id, weekNumber, body);
      setResult(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit week.");
    } finally {
      setBusy(false);
    }
  }

  // Success view: animate the coach message in, then offer return to Dashboard.
  if (result) {
    return (
      <div className="space-y-4 px-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-sm text-brand-text">
            Week {result.week_number} saved.
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            Your coach has reviewed the numbers.
          </p>
        </div>

        {result.ai_coach_message ? (
          <CoachMessage message={result.ai_coach_message} animate />
        ) : (
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 text-sm text-brand-muted">
            The coach message couldn't be generated this time — your week was
            still saved.
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const inputClass =
    "w-28 rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent tabular-nums";

  return (
    <form onSubmit={onSubmit} className="space-y-3 px-4">
      <div className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3">
        <label htmlFor="week" className="text-sm text-brand-text">
          Week number
        </label>
        <input
          id="week"
          type="number"
          min={1}
          max={52}
          value={weekNumber}
          onChange={(e) => setWeekNumber(Number(e.target.value) || 1)}
          className={inputClass}
        />
      </div>

      {FIELDS.map((f) => {
        const target = placement[`wk_target_${f.key}` as keyof Placement] as number;
        return (
          <div
            key={f.key}
            className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-surface p-3"
          >
            <div>
              <p className="text-sm text-brand-text">{f.label}</p>
              <p className="mt-0.5 text-xs text-brand-muted">
                Weekly target: {target}
              </p>
            </div>
            <input
              type="number"
              min={0}
              step={f.step}
              inputMode="decimal"
              placeholder="0"
              value={values[f.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.key]: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        );
      })}

      <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
        <label className="text-sm text-brand-text" htmlFor="reflection">
          Reflection
        </label>
        <textarea
          id="reflection"
          rows={3}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What went well, what didn't?"
          className="mt-2 w-full resize-none rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent"
        />
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-3">
        <label className="text-sm text-brand-text" htmlFor="key_issue">
          Key issue
        </label>
        <textarea
          id="key_issue"
          rows={2}
          value={keyIssue}
          onChange={(e) => setKeyIssue(e.target.value)}
          placeholder="The single biggest blocker this week"
          className="mt-2 w-full resize-none rounded-xl border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-accent"
        />
      </div>

      {error && <p className="text-xs text-brand-danger">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
      >
        {busy ? "Submitting & asking your coach…" : "Submit week"}
      </button>
    </form>
  );
}

export default function KPIEntry() {
  const { placement, weeks, loading, noPlacement, error } = usePlacement();

  const existing = useMemo(
    () =>
      placement
        ? weeks.find((w) => w.week_number === placement.current_week_number)
        : undefined,
    [placement, weeks],
  );

  return (
    <>
      <PageHeader title="Weekly KPIs" subtitle="Log this week's actuals" />

      {loading && <p className="px-4 text-sm text-brand-muted">Loading…</p>}
      {error && <p className="px-4 text-sm text-brand-danger">{error}</p>}
      {noPlacement && (
        <p className="px-4 text-sm text-brand-muted">
          You need an active placement before logging KPIs.
        </p>
      )}
      {placement && <Form placement={placement} existing={existing} />}
    </>
  );
}
