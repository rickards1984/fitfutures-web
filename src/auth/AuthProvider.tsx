import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { upsertProfile, type Profile } from "../api/client";

type AuthState = {
  session: Session | null;
  user: User | null;
  // The signed-in user's profile row (carries their role). Null until loaded.
  profile: Profile | null;
  // True for tutor/admin — used to gate the Admin section.
  isStaff: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// Best-effort name for the profile row: signup metadata first, then the local
// part of the email as a sensible fallback the learner can edit later.
function deriveFullName(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta = meta.full_name ?? meta.name;
  if (typeof fromMeta === "string" && fromMeta.trim()) return fromMeta.trim();
  const email = user.email ?? "";
  return email.split("@")[0] || "Learner";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Guard so the profile bootstrap fires once per signed-in user, not on every
  // token refresh.
  const bootstrappedFor = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      const user = nextSession?.user;
      if (user && bootstrappedFor.current !== user.id) {
        bootstrappedFor.current = user.id;
        // Idempotent server-side: returns the row (creating it on first login),
        // which carries the role we gate the Admin section on.
        upsertProfile(deriveFullName(user))
          .then(setProfile)
          .catch((err) => {
            console.error("Profile bootstrap failed", err);
          });
      }
      if (!user) {
        bootstrappedFor.current = null;
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    profile,
    isStaff: profile?.role === "tutor" || profile?.role === "admin",
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
