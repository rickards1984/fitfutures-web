import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";

type Mode = "password" | "magic";

// Where the magic link returns the user. Supabase appends the auth code/hash.
const REDIRECT_TO = `${window.location.origin}/auth/callback`;

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: REDIRECT_TO },
        });
        if (error) throw error;
        setNotice(`Check ${email} for a sign-in link.`);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: REDIRECT_TO,
            data: { full_name: fullName.trim() || undefined },
          },
        });
        if (error) throw error;
        setNotice("Account created. Check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // On success AuthProvider picks up the session and the router swaps in
        // the app shell — nothing else to do here.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted outline-none focus:border-brand-accent";

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-brand-accent" aria-hidden>
              ✦
            </span>
            <span className="text-lg font-medium tracking-wide text-brand-text">
              FitFutures
            </span>
          </div>
          <p className="text-sm text-brand-muted">UKFI placement programme</p>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          {/* Method toggle */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-brand-border bg-brand-bg p-1">
            {(["password", "magic"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={[
                  "rounded-lg py-1.5 text-xs font-medium transition-colors",
                  mode === m
                    ? "bg-brand-surface text-brand-accent"
                    : "text-brand-muted",
                ].join(" ")}
              >
                {m === "password" ? "Password" : "Magic link"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "password" && isSignUp && (
              <input
                type="text"
                autoComplete="name"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            )}

            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />

            {mode === "password" && (
              <input
                type="password"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            )}

            {error && <p className="text-xs text-brand-danger">{error}</p>}
            {notice && <p className="text-xs text-brand-success">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-accent py-2.5 text-sm font-medium text-brand-bg transition-opacity disabled:opacity-50"
            >
              {busy
                ? "Please wait…"
                : mode === "magic"
                  ? "Send magic link"
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
            </button>
          </form>

          {mode === "password" && (
            <button
              type="button"
              onClick={() => {
                setIsSignUp((v) => !v);
                setError(null);
                setNotice(null);
              }}
              className="mt-4 w-full text-center text-xs text-brand-muted hover:text-brand-text"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
