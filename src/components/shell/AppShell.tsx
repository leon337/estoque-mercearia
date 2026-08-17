import type { ReactNode } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileTopBar } from "./MobileTopBar";
import type { Role } from "./navigation";

export function AppShell({ children, role }: { children: ReactNode; role: Role }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)] md:flex">
      <DesktopSidebar role={role} />
      <div className="min-w-0 flex-1">
        <MobileTopBar role={role} />
        <div className="pb-24 md:pb-0">{children}</div>
      </div>
      <MobileBottomNav role={role} />
    </div>
  );
}
