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

export type LearnerRoute = "route_a" | "route_b";
export type PlacementStatus = "active" | "referred" | "complete" | "withdrawn";

export type RAGStatus = "green" | "amber" | "red" | "no_entry";

export interface Placement {
  id: string;
  learner_id: string;
  tutor_id: string | null;
  supervisor_id: string | null;
  facility_name: string;
  route: LearnerRoute;
  status: PlacementStatus;
  start_date: string;
  expected_end_date: string | null;
  actual_end_date: string | null;
  planned_weeks: number;
  current_week_number: number;
  // Fixed weekly targets (shown beneath each KPI input).
  wk_target_placement_hours: number;
  wk_target_study_hours: number;
  wk_target_member_conversations: number;
  wk_target_ex_member_contacts: number;
  wk_target_retention_saves: number;
  wk_target_campaign_touches: number;
  wk_target_tasters_booked: number;
  wk_target_consultations: number;
  wk_target_conversions: number;
  notes: string | null;
}

export interface KpiEntry {
  id: string;
  placement_id: string;
  week_number: number;
  week_commencing: string;
  actual_placement_hours: number;
  actual_study_hours: number;
  actual_member_conversations: number;
  actual_ex_member_contacts: number;
  actual_retention_saves: number;
  actual_campaign_touches: number;
  actual_tasters_booked: number;
  actual_consultations: number;
  actual_conversions: number;
  reflection: string | null;
  key_issue: string | null;
  overall_status: RAGStatus;
  ai_coach_message: string | null;
  ai_coach_generated_at: string | null;
}

export interface KpiWeekSubmit {
  actual_placement_hours: number;
  actual_study_hours: number;
  actual_member_conversations: number;
  actual_ex_member_contacts: number;
  actual_retention_saves: number;
  actual_campaign_touches: number;
  actual_tasters_booked: number;
  actual_consultations: number;
  actual_conversions: number;
  reflection: string | null;
  key_issue: string | null;
}

export interface KpiTotalLine {
  key: string;
  label: string;
  actual: number;
  target: number;
}

export interface KpiTotals {
  placement_id: string;
  weeks_logged: number;
  lines: KpiTotalLine[];
}

// The learner's active placement. Throws ApiError(404) when none exists yet.
export function getMyPlacement(): Promise<Placement> {
  return apiFetch<Placement>("/v1/placements/mine");
}

export function getKpiTotals(placementId: string): Promise<KpiTotals> {
  return apiFetch<KpiTotals>(`/v1/kpi/placement/${placementId}/totals`);
}

export function getKpiWeeks(placementId: string): Promise<KpiEntry[]> {
  return apiFetch<KpiEntry[]>(`/v1/kpi/placement/${placementId}/weeks`);
}

// Submit a week's actuals. Resolves with the saved entry, including the AI
// coach message generated on submission.
export function submitKpiWeek(
  placementId: string,
  weekNumber: number,
  body: KpiWeekSubmit,
): Promise<KpiEntry> {
  return apiFetch<KpiEntry>(
    `/v1/kpi/placement/${placementId}/week/${weekNumber}`,
    { method: "POST", body: JSON.stringify(body) },
  );
}
