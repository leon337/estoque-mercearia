import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "critical";
const tones: Record<Tone, string> = {
  neutral: "border-[var(--color-border-subtle)]",
  success: "border-[var(--color-status-success)]",
  warning: "border-[var(--color-status-warning)]",
  critical: "border-[var(--color-status-critical)]",
};

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-full border bg-[var(--color-surface-lowest)] px-3 py-1 text-xs font-bold text-[var(--color-on-surface)] ${tones[tone]}`}>{children}</span>;
}
