import type { LearnerRoute } from "../api/client";

export function routeLabel(route: LearnerRoute): string {
  return route === "route_a"
    ? "Route A — PT Qualification Builder"
    : "Route B — Already PT Qualified Specialist";
}

// e.g. "12 May 2026". Dates from the API are ISO date strings.
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// The next Monday (or today if today is Monday) as a yyyy-mm-dd string —
// the sensible default placement start date for a new enrolment.
export function nextMonday(from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const daysUntilMonday = (8 - d.getDay()) % 7; // Sun=0 -> 1, Mon=1 -> 0, ...
  d.setDate(d.getDate() + daysUntilMonday);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// e.g. "12 May 2026". For full ISO timestamps (created_at etc.).
export function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
