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

export function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/v1/auth/profile");
}

// --- Web push ---

export function pushSubscribe(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ ok: boolean }> {
  return apiFetch("/v1/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });
}

export function pushUnsubscribe(endpoint: string): Promise<{ ok: boolean }> {
  return apiFetch("/v1/push/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ endpoint }),
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

// --- Units & task progress ---

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "not_applicable";
export type UnitStatus = "not_started" | "in_progress" | "complete";

export interface UnitTask {
  id: string;
  unit_id: string;
  task_order: number;
  description: string;
  is_mandatory: boolean;
  requires_evidence: boolean;
  requires_supervisor_sign: boolean;
}

export interface Unit {
  id: string;
  unit_number: number;
  title: string;
  aim: string;
  is_mandatory: boolean;
  suggested_hours_min: number | null;
  suggested_hours_max: number | null;
  route_applicability: string;
  tasks: UnitTask[];
}

export interface TaskProgress {
  unit_task_id: string;
  placement_id: string;
  status: TaskStatus;
  completed_at: string | null;
}

export interface UnitProgress {
  unit_id: string;
  status: UnitStatus;
}

export interface PlacementProgress {
  placement_id: string;
  units: UnitProgress[];
  tasks: TaskProgress[];
}

export function getUnits(): Promise<Unit[]> {
  return apiFetch<Unit[]>("/v1/units");
}

export function getPlacementProgress(
  placementId: string,
): Promise<PlacementProgress> {
  return apiFetch<PlacementProgress>(`/v1/progress/placement/${placementId}`);
}

// Update one task's status; resolves with the saved task progress row.
export function updateTaskStatus(
  taskId: string,
  placementId: string,
  status: TaskStatus,
): Promise<TaskProgress> {
  return apiFetch<TaskProgress>(`/v1/progress/task/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ placement_id: placementId, status }),
  });
}

// --- Evidence ---

export interface EvidenceUploadUrl {
  bucket: string;
  path: string;
  token: string;
  signed_url: string;
}

export interface EvidenceItem {
  id: string;
  placement_id: string;
  unit_task_id: string | null;
  kpi_entry_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  uploaded_by: string;
  supervisor_approved: boolean | null;
  supervisor_approved_at: string | null;
  created_at: string | null;
  download_url: string | null;
}

export function getEvidenceUploadUrl(
  placementId: string,
  filename: string,
  contentType: string,
): Promise<EvidenceUploadUrl> {
  return apiFetch<EvidenceUploadUrl>("/v1/evidence/upload-url", {
    method: "POST",
    body: JSON.stringify({
      placement_id: placementId,
      filename,
      content_type: contentType,
    }),
  });
}

export function createEvidence(body: {
  placement_id: string;
  path: string;
  title: string;
  file_type: string;
  file_size_bytes?: number;
  unit_task_id?: string | null;
  description?: string | null;
}): Promise<EvidenceItem> {
  return apiFetch<EvidenceItem>("/v1/evidence", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getEvidence(placementId: string): Promise<EvidenceItem[]> {
  return apiFetch<EvidenceItem[]>(`/v1/evidence/placement/${placementId}`);
}

// --- Business milestones ---

export interface BusinessMilestone {
  id: string;
  placement_id: string;
  milestone_key: string;
  title: string;
  status: TaskStatus;
  target_date: string | null;
  completed_at: string | null;
  evidence_notes: string | null;
  blocking_issue: string | null;
  next_action: string | null;
}

export function getBusinessMilestones(
  placementId: string,
): Promise<BusinessMilestone[]> {
  return apiFetch<BusinessMilestone[]>(`/v1/business/placement/${placementId}`);
}

export function updateBusinessMilestone(
  milestoneId: string,
  updates: {
    status?: TaskStatus;
    evidence_notes?: string | null;
    target_date?: string | null;
    next_action?: string | null;
  },
): Promise<BusinessMilestone> {
  return apiFetch<BusinessMilestone>(`/v1/business/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// --- Coach chat ---

export interface CoachChatMessage {
  id: string;
  placement_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string | null;
}

export function getCoachMessages(
  placementId: string,
): Promise<CoachChatMessage[]> {
  return apiFetch<CoachChatMessage[]>(
    `/v1/coach/placement/${placementId}/messages`,
  );
}

export function sendCoachChat(
  placementId: string,
  message: string,
): Promise<{
  user_message: CoachChatMessage;
  assistant_message: CoachChatMessage;
}> {
  return apiFetch(`/v1/coach/placement/${placementId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// --- Completion ---

export type CompletionDecision = "pending" | "pass" | "refer";

export interface CompletionReview {
  placement_id: string;
  learner_final_reflection: string | null;
  tutor_decision: CompletionDecision;
  tutor_feedback: string | null;
  tutor_id: string | null;
  decided_at: string | null;
  certificate_triggered: boolean;
  certificate_triggered_at: string | null;
  placement_status: PlacementStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface CompletionRosterItem {
  placement_id: string;
  learner_name: string;
  facility_name: string;
  placement_status: PlacementStatus;
  current_week_number: number;
  planned_weeks: number;
  decision: CompletionDecision;
  reflection_submitted: boolean;
  certificate_triggered: boolean;
}

export function getCompletionReview(
  placementId: string,
): Promise<CompletionReview> {
  return apiFetch<CompletionReview>(`/v1/completion/placement/${placementId}`);
}

// The learner's own review for their latest placement (any status, so it still
// resolves after a Pass has completed the placement). Throws ApiError(404) when
// the learner has no placement at all.
export function getMyCompletion(): Promise<CompletionReview> {
  return apiFetch<CompletionReview>("/v1/completion/mine");
}

// Learner submits (or updates) their final reflection.
export function submitCompletion(
  placementId: string,
  finalReflection: string,
): Promise<CompletionReview> {
  return apiFetch<CompletionReview>(
    `/v1/completion/placement/${placementId}/submit`,
    { method: "POST", body: JSON.stringify({ final_reflection: finalReflection }) },
  );
}

// Tutor/admin records a Pass or Refer decision.
export function decideCompletion(
  placementId: string,
  decision: "pass" | "refer",
  feedback: string | null,
): Promise<CompletionReview> {
  return apiFetch<CompletionReview>(
    `/v1/completion/placement/${placementId}/decide`,
    { method: "POST", body: JSON.stringify({ decision, feedback }) },
  );
}

// Tutor/admin: every learner's completion state, for the picker.
export function getCompletionRoster(): Promise<CompletionRosterItem[]> {
  return apiFetch<{ items: CompletionRosterItem[] }>(
    "/v1/completion/roster",
  ).then((r) => r.items);
}
