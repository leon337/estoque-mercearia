import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "critical";
const tones: Record<Tone, string> = {
  neutral: "border-[var(--color-border-subtle)]",
  success: "border-[var(--color-status-success)]",
  warning: "border-[var(--color-status-warning)]",
  critical: "border-[var(--color-status-critical)]",
};

export function MetricCard({ label, value, hint, tone = "neutral" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <article className={`rounded-xl border bg-[var(--color-surface-lowest)] p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm text-[var(--color-on-surface-variant)]">{label}</p>
      <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{hint}</div> : null}
    </article>
  );
}
