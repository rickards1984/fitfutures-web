import PageHeader from "../components/layout/PageHeader";
import { useAuth } from "../auth/AuthProvider";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <>
      <PageHeader title="Profile" subtitle="UKFI placement programme" />

      <div className="space-y-3 px-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <p className="text-xs uppercase tracking-wide text-brand-muted">
            Signed in as
          </p>
          <p className="mt-1 text-sm text-brand-text">{user?.email}</p>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <span className="inline-block rounded-md bg-brand-accent/10 px-2 py-0.5 text-xs font-medium text-brand-accent">
            Phase 7
          </span>
          <p className="mt-3 text-sm text-brand-muted">
            WhatsApp and web-push reminder opt-in toggles arrive here in Phase 7.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full rounded-xl border border-brand-border bg-brand-surface py-2.5 text-sm font-medium text-brand-danger transition-colors hover:border-brand-border-md"
        >
          Sign out
        </button>
      </div>
    </>
  );
}
