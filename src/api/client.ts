import { supabase } from "../lib/supabaseClient";

// Thin fetch wrapper around the FitFutures API. Always attaches the current
// Supabase access token so the backend can verify identity (see API auth.py).
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // non-JSON error body — keep the status text
    }
    throw new ApiError(res.status, detail);
  }
  return res.json() as Promise<T>;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "learner" | "tutor" | "supervisor" | "admin";
  phone: string | null;
  whatsapp_opt_in: boolean;
  push_opt_in: boolean;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Bootstrap the profile row on first login. Idempotent on the server: a
// returning user just gets their existing row back.
export function upsertProfile(fullName: string): Promise<Profile> {
  return apiFetch<Profile>("/v1/auth/profile", {
    method: "POST",
    body: JSON.stringify({ full_name: fullName }),
  });
}
