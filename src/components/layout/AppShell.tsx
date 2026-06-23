import type { ReactNode } from "react";
import BottomNav from "./BottomNav";

// Mobile-first shell: centred max-w-md column, content scrolls above a fixed
// bottom nav. Dark-only per the design system.
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-brand-bg">
      <main className="mx-auto max-w-md pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
