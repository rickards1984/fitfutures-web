import PageHeader from "../layout/PageHeader";

// Phase 1 scaffold: every screen renders a dark placeholder so the shell +
// navigation are verifiable end-to-end. Real screens land in Phases 3–7.
type Props = {
  title: string;
  phase: string;
  children?: React.ReactNode;
};

export default function Placeholder({ title, phase, children }: Props) {
  return (
    <>
      <PageHeader title={title} />
      <div className="px-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <span className="inline-block rounded-md bg-brand-accent/10 px-2 py-0.5 text-xs font-medium text-brand-accent">
            {phase}
          </span>
          <p className="mt-3 text-sm text-brand-muted">
            {children ?? "This screen is scaffolded. Functionality arrives in a later phase."}
          </p>
        </div>
      </div>
    </>
  );
}
