import { useEffect, useState } from "react";
import PageHeader from "../components/layout/PageHeader";
import Toggle from "../components/ui/Toggle";
import { useAuth } from "../auth/AuthProvider";
import { getProfile, pushSubscribe, pushUnsubscribe } from "../api/client";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../utils/push";

function ReminderToggle() {
  const supported = isPushSupported();
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(
    supported && Notification.permission === "denied",
  );

  useEffect(() => {
    let active = true;
    getProfile()
      .then((p) => active && setOptIn(p.push_opt_in))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  async function onChange(next: boolean) {
    setError(null);
    setBusy(true);
    try {
      if (next) {
        const sub = await subscribeToPush();
        await pushSubscribe(sub);
        setOptIn(true);
      } else {
        const endpoint = await unsubscribeFromPush();
        await pushUnsubscribe(endpoint ?? "");
        setOptIn(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update reminders.");
    } finally {
      if (supported) setPermissionDenied(Notification.permission === "denied");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-brand-text">
            Weekly reminders
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Get a web-push nudge when you haven't logged your KPIs for the week.
          </p>
        </div>
        <Toggle
          checked={optIn}
          disabled={!supported || loading || busy || permissionDenied}
          onChange={onChange}
          label="Weekly reminder notifications"
        />
      </div>

      {!supported && (
        <p className="mt-3 text-xs text-brand-muted">
          Push notifications aren't supported in this browser.
        </p>
      )}
      {permissionDenied && (
        <p className="mt-3 text-xs text-brand-warning">
          Notifications are blocked — enable them for this site in your browser
          settings, then try again.
        </p>
      )}
      {error && <p className="mt-3 text-xs text-brand-danger">{error}</p>}
    </div>
  );
}

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

        <ReminderToggle />

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
