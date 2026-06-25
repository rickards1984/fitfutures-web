import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

// Landing route for magic-link / email-confirmation redirects. The Supabase
// client (detectSessionInUrl) exchanges the code in the URL for a session as it
// initialises; we just wait for that session to appear, then send the learner
// into the app. Any provider error arrives as `error_description` in the URL.
export default function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const desc = params.get("error_description") ?? hashParams.get("error_description");
    if (desc) {
      setError(desc);
      return;
    }
    if (!loading && session) {
      // Replace so the callback URL (with its code) is not in history.
      navigate("/", { replace: true });
    }
  }, [loading, session, navigate]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-brand-danger">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="rounded-xl border border-brand-border bg-brand-surface px-4 py-2 text-sm text-brand-text"
          >
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <span className="text-brand-accent" aria-hidden>
            ✦
          </span>
          <p className="text-sm text-brand-muted">Signing you in…</p>
        </>
      )}
    </div>
  );
}
