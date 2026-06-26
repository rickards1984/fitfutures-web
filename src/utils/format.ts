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
