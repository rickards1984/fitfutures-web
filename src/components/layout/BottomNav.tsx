import { NavLink } from "react-router-dom";

type Tab = { to: string; label: string; icon: string };

// MVP bottom nav: 5 tabs. Units / Business / Completion are reached from
// Dashboard cards to keep the nav uncluttered (per brief §8).
const TABS: Tab[] = [
  { to: "/", label: "Home", icon: "⌂" },
  { to: "/kpi", label: "KPIs", icon: "▤" },
  { to: "/coach", label: "Coach", icon: "✦" },
  { to: "/evidence", label: "Evidence", icon: "❐" },
  { to: "/profile", label: "Profile", icon: "◉" },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t border-brand-border bg-brand-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
                  isActive ? "text-brand-accent" : "text-brand-muted",
                ].join(" ")
              }
            >
              <span className="text-lg leading-none" aria-hidden>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
