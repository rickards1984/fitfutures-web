import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader";
import { usePlacement } from "../hooks/usePlacement";
import type { Placement } from "../api/client";

// The 9 KPI metrics with both target columns. `weeklyKey` reads the learner's
// own weekly target off their placement; `key` matches the totals endpoint's
// line key. `fallbackWeekly`/`fallbackTotal` are the programme defaults from
// the placements table, shown before a learner is enrolled.
const KPI_ROWS = [
  { key: "placement_hours", label: "Placement hours", fallbackWeekly: 6, fallbackTotal: 102 },
  { key: "study_hours", label: "Study hours", fallbackWeekly: 3, fallbackTotal: 51 },
  { key: "member_conversations", label: "Member conversations", fallbackWeekly: 10, fallbackTotal: 170 },
  { key: "ex_member_contacts", label: "Ex-member contacts", fallbackWeekly: 10, fallbackTotal: 170 },
  { key: "retention_saves", label: "Retention saves", fallbackWeekly: 2, fallbackTotal: 34 },
  { key: "campaign_touches", label: "Campaign touches", fallbackWeekly: 5, fallbackTotal: 85 },
  { key: "tasters_booked", label: "Tasters booked", fallbackWeekly: 1, fallbackTotal: 17 },
  { key: "consultations", label: "Consultations", fallbackWeekly: 1, fallbackTotal: 17 },
  { key: "conversions", label: "Conversions", fallbackWeekly: 0, fallbackTotal: 0 },
] as const;

const RHYTHM = [
  {
    to: "/kpi",
    title: "Log your numbers",
    body: "Every week, record your hours, conversations, contacts, campaigns, tasters and consultations. One entry per week — it takes two minutes and it is the backbone of the whole programme.",
  },
  {
    to: "/coach",
    title: "Your coach responds",
    body: "As soon as you submit, your AI coach reads the week against your targets and comes back with what went well, what slipped and what to do next. Ask it follow-up questions any time.",
  },
  {
    to: "/units",
    title: "Work your units",
    body: "Tick off the tasks in each of the 6 units as you do them in the gym, and upload the evidence while it is fresh. Do not leave it all until the end.",
  },
  {
    to: "/business",
    title: "Build your business",
    body: "Work through the start-up milestones alongside the units, so that when the placement ends you have a working business rather than just a folder of evidence.",
  },
];

// The five evidence principles, verbatim from the UKFI Learner Evidence
// Portfolio ("4. Evidence rules").
const EVIDENCE_RULES = [
  {
    name: "Authentic",
    meaning: "It must be your work or a truthful record of your own involvement.",
  },
  {
    name: "Sufficient",
    meaning:
      "It must show enough detail for UKFI and the supervisor to see what you actually did.",
  },
  {
    name: "Current",
    meaning:
      "It should relate to your current FitFutures placement wherever possible.",
  },
  {
    name: "Relevant",
    meaning: "It must link clearly to the unit and task requirements.",
  },
  {
    name: "Safe and lawful",
    meaning:
      "It must follow health and safety, GDPR, facility policy, confidentiality and competence boundaries.",
  },
];

const PASS_STEPS = [
  {
    title: "Complete your units",
    body: "All mandatory units finished, every task ticked, and every item on the unit's evidence checklist uploaded and confirmed. Once a unit's checklist is fully ticked, send it to your placement coordinator and tutor for review.",
  },
  {
    title: "Hit your numbers",
    body: "Your cumulative KPI totals need to land on target. Weekly logging is what gets you there — a red week is a prompt, not a verdict.",
  },
  {
    title: "Write your final reflection",
    body: "A closing reflection on what you did, what you learned and where you are taking it next.",
  },
  {
    title: "Tutor decision: Pass or Refer",
    body: "Your tutor reviews the portfolio and the numbers, then records a Pass or a Refer. A Refer is not a fail — it lists exactly what to put right and resubmit.",
  },
  {
    title: "Certificate",
    body: "On a Pass, your CPD certificate is requested and confirmed on your Completion page.",
  },
];

// Deliberately blunt — these are the boundaries, not suggestions.
const STANDARDS = [
  "Gather evidence as you go. Portfolios left until the last week become archaeological digs, and it shows.",
  "Use your facility's own forms wherever they exist — cleaning sheets, equipment checks, induction checklists, sales trackers. Use the UKFI proformas only where your facility has nothing suitable.",
  "Get your supervisor to sign evidence at the time. Chasing a signature three months later rarely ends well.",
  "Anonymise member, client and ex-member information unless you have written permission and your facility allows it.",
  "Never work outside your qualification, competence, insurance or facility approval. Not once, not to be helpful, not because someone asked.",
  "Everything you submit must be your own truthful record. Fabricated evidence ends the programme.",
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      {children}
    </div>
  );
}

function SectionIntro({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-3 text-sm text-brand-muted">{children}</p>;
}

function Intro() {
  return (
    <div className="px-4">
      <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-4">
        <p className="text-sm text-brand-text">
          Welcome to FitFutures. This is a placement programme, which means you
          prove what you can do on the gym floor rather than what you can
          remember in an exam.
        </p>
        <p className="mt-3 text-sm text-brand-muted">
          The next few sections cover how a week works, the numbers you are
          aiming at, the rules your evidence has to meet, and exactly what
          standing at the end looks like. Read it once now, come back to it
          whenever you need to.
        </p>
      </div>
    </div>
  );
}

function WeeklyRhythm() {
  return (
    <>
      <PageHeader title="Your weekly rhythm" />
      <SectionIntro>
        Four things, in this order, every week of your placement.
      </SectionIntro>
      <div className="space-y-3 px-4">
        {RHYTHM.map((step, i) => (
          <Link
            key={step.to}
            to={step.to}
            className="block rounded-xl border border-brand-border bg-brand-surface p-4 transition-colors hover:border-brand-border-md"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-xs font-medium text-brand-accent">
                {i + 1}
              </span>
              <div>
                <h2 className="text-sm font-medium text-brand-text">
                  {step.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                  {step.body}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function KpiTargets() {
  const { placement, totals, loading, noPlacement } = usePlacement();

  // Prefer the learner's own targets; fall back to the programme defaults when
  // they are not enrolled yet (or the placement call failed).
  const totalByKey = new Map(totals?.lines.map((l) => [l.key, l.target]) ?? []);
  const rows = KPI_ROWS.map((row) => ({
    label: row.label,
    weekly:
      (placement?.[`wk_target_${row.key}` as keyof Placement] as
        | number
        | undefined) ?? row.fallbackWeekly,
    total: totalByKey.get(row.key) ?? row.fallbackTotal,
  }));

  return (
    <>
      <PageHeader title="Your KPI targets" />
      <SectionIntro>
        {loading
          ? "Loading your targets…"
          : placement
            ? `The targets set for your placement — ${placement.planned_weeks} weeks at ${placement.facility_name}.`
            : "The standard programme targets. Once your tutor enrols you, your own targets appear here."}
      </SectionIntro>
      <div className="px-4">
        <Card>
          <div className="flex items-baseline justify-between pb-2 text-xs uppercase tracking-wide text-brand-muted">
            <span>Metric</span>
            <span className="flex gap-4">
              <span className="w-14 text-right">Weekly</span>
              <span className="w-14 text-right">Total</span>
            </span>
          </div>
          <div className="divide-y divide-brand-border">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <span className="text-sm text-brand-text">{row.label}</span>
                <span className="flex shrink-0 gap-4 text-sm tabular-nums">
                  <span className="w-14 text-right text-brand-muted">
                    {row.weekly}
                  </span>
                  <span className="w-14 text-right text-brand-text">
                    {row.total}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-2 text-xs text-brand-muted">
          Conversions are tracked but not scored — they follow from the rest.
          Everything else feeds your weekly red/amber/green.
        </p>
        {!loading && !noPlacement && (
          <Link
            to="/"
            className="mt-3 block rounded-xl border border-brand-border bg-brand-surface p-3 text-center text-sm text-brand-accent transition-colors hover:border-brand-border-md"
          >
            See how you are tracking
          </Link>
        )}
      </div>
    </>
  );
}

function EvidenceRules() {
  return (
    <>
      <PageHeader title="The five evidence rules" />
      <SectionIntro>
        Every piece of evidence you upload has to pass all five. If it fails
        one, it will come back to you.
      </SectionIntro>
      <div className="px-4">
        <Card>
          <div className="divide-y divide-brand-border">
            {EVIDENCE_RULES.map((rule) => (
              <div key={rule.name} className="py-3 first:pt-0 last:pb-0">
                <h3 className="text-sm font-medium text-brand-accent">
                  {rule.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                  {rule.meaning}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function HowYouPass() {
  return (
    <>
      <PageHeader title="How you pass" />
      <SectionIntro>
        Five stages. There are no shortcuts through any of them.
      </SectionIntro>
      <div className="space-y-3 px-4">
        {PASS_STEPS.map((step, i) => (
          <Card key={step.title}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-success/10 text-xs font-medium text-brand-success">
                {i + 1}
              </span>
              <div>
                <h2 className="text-sm font-medium text-brand-text">
                  {step.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-brand-muted">
                  {step.body}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-3 px-4">
        <Link
          to="/completion"
          className="block rounded-xl border border-brand-border bg-brand-surface p-3 text-center text-sm text-brand-accent transition-colors hover:border-brand-border-md"
        >
          Go to Completion
        </Link>
      </div>
    </>
  );
}

function Standards() {
  return (
    <>
      <PageHeader title="The standards" />
      <SectionIntro>
        These are not negotiable, and no one will soften them for you later.
      </SectionIntro>
      <div className="px-4">
        <Card>
          <ul className="divide-y divide-brand-border">
            {STANDARDS.map((item) => (
              <li key={item} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-warning"
                  aria-hidden
                />
                <span className="text-sm leading-relaxed text-brand-text">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-3 px-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <h3 className="text-xs uppercase tracking-wide text-brand-muted">
            Programme status
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-brand-muted">
            FitFutures is an endorsed continuing professional development (CPD)
            and placement evidence programme. It is not a regulated
            qualification and must not be described as one. Completion confirms
            that you have completed the programme requirements and evidence
            portfolio, subject to UKFI review and sign-off.
          </p>
        </div>
      </div>
    </>
  );
}

export default function ProgrammeGuidePage() {
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-1">
        <Link to="/" className="text-xs text-brand-muted hover:text-brand-text">
          ← Dashboard
        </Link>
      </div>

      <PageHeader
        title="Programme Guide"
        subtitle="How FitFutures works, and what it takes to pass"
      />

      <Intro />
      <WeeklyRhythm />
      <KpiTargets />
      <EvidenceRules />
      <HowYouPass />
      <Standards />
    </>
  );
}
