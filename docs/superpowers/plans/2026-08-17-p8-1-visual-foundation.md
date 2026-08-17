# P8.1 Visual Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Estoque Mercearia Design System v1 foundation with semantic tokens, Inter/JetBrains Mono typography, reusable presentation primitives, responsive navigation/AppShell, and dashboard shell adoption, without changing business logic, database behavior, authentication, Server Actions, RLS, or stock invariants.

**Architecture:** `src/app` remains the server-data/route boundary. `src/components/ui` contains presentation-only primitives; `src/components/shell` contains role-aware navigation/layout that receives `ADMIN | OPERATOR` via props and never accesses Supabase. P8.1 wraps only the existing dashboard with the shell; all existing dashboard queries, calculations, links, conditions, and actions remain unchanged.

**Tech Stack:** Next.js 16.3.1, React 19.2.8, TypeScript 5, Tailwind CSS 4, Node.js test runner (`node --test`).

## Global Constraints

- Identity: `Estoque Mercearia`; language: `pt-BR`.
- UI font: `Inter`; data/SKU/tabular font: `JetBrains Mono`.
- Colors: primary `#006C49`, success/primary-container `#10B981`, warning `#F59E0B`, critical `#EF4444`, error `#BA1A1A`, secondary `#0058BE`, background/surface `#F8F9FA`.
- Spacing base: 4px; mobile touch target: minimum 48px.
- `<768px`: TopBar + BottomNav. `>=768px`: persistent desktop sidebar.
- No new UI/icon dependency, dark mode, reports, suppliers, settings, or Stitch HTML/scripts.
- No migrations, schema, RLS, auth, proxy, Server Action, inventory-core, package dependency, or business-rule changes.
- New `ui`/`shell` code must not import Supabase.
- Final gate: full tests, lint, typecheck, and production build PASS.

## Files

Create:
- `tests/p8-design-system-foundation.test.mjs`
- `src/components/ui/Button.tsx`
- `src/components/ui/DataCard.tsx`
- `src/components/ui/MetricCard.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/PageHeader.tsx`
- `src/components/shell/navigation.ts`
- `src/components/shell/DesktopSidebar.tsx`
- `src/components/shell/MobileTopBar.tsx`
- `src/components/shell/MobileBottomNav.tsx`
- `src/components/shell/AppShell.tsx`

Modify:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`

---

### Task 1: RED contract

**Files:**
- Create: `tests/p8-design-system-foundation.test.mjs`

**Interfaces:**
- Produces the source-level contract for tokens, fonts, presentation boundaries, accessibility, canonical navigation, and dashboard adoption.

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const presentationFiles = [
  "src/components/ui/Button.tsx",
  "src/components/ui/DataCard.tsx",
  "src/components/ui/MetricCard.tsx",
  "src/components/ui/StatusBadge.tsx",
  "src/components/ui/PageHeader.tsx",
  "src/components/shell/navigation.ts",
  "src/components/shell/DesktopSidebar.tsx",
  "src/components/shell/MobileTopBar.tsx",
  "src/components/shell/MobileBottomNav.tsx",
  "src/components/shell/AppShell.tsx",
];

test("P8.1 defines semantic tokens and global accessibility defaults", async () => {
  const css = await read("src/app/globals.css");
  assert.match(css, /--color-primary:\s*#006c49/i);
  assert.match(css, /--color-surface:\s*#f8f9fa/i);
  assert.match(css, /--color-status-success:\s*#10b981/i);
  assert.match(css, /--color-status-warning:\s*#f59e0b/i);
  assert.match(css, /--color-status-critical:\s*#ef4444/i);
  assert.match(css, /--font-ui:/);
  assert.match(css, /--font-data:/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /48px/);
});

test("P8.1 loads approved fonts through Next font variables", async () => {
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /Inter/);
  assert.match(layout, /JetBrains_Mono/);
  assert.match(layout, /--font-inter/);
  assert.match(layout, /--font-jetbrains-mono/);
  assert.match(layout, /lang="pt-BR"/);
});

test("P8.1 presentation layer does not access Supabase", async () => {
  for (const path of presentationFiles) {
    const source = await read(path);
    assert.doesNotMatch(source, /@\/lib\/supabase|createClient|\.from\(/, path);
  }
});

test("P8.1 shell has canonical navigation and accessible active state", async () => {
  const nav = await read("src/components/shell/navigation.ts");
  const desktop = await read("src/components/shell/DesktopSidebar.tsx");
  const mobile = await read("src/components/shell/MobileBottomNav.tsx");
  const shell = await read("src/components/shell/AppShell.tsx");
  for (const label of ["Painel", "Produtos", "Estoque", "Movimentações", "Histórico", "Administração"]) {
    assert.match(nav, new RegExp(label));
  }
  assert.match(nav, /ADMIN/);
  assert.match(desktop, /aria-current/);
  assert.match(mobile, /aria-current/);
  assert.match(shell, /DesktopSidebar/);
  assert.match(shell, /MobileTopBar/);
  assert.match(shell, /MobileBottomNav/);
});

test("P8.1 dashboard adopts AppShell without losing M5 contracts", async () => {
  const source = await read("src/app/page.tsx");
  assert.match(source, /AppShell/);
  assert.match(source, /inventory\s*\(\s*quantity\s*\)/);
  assert.match(source, /minimum_stock/);
  assert.match(source, /Produtos ativos/);
  assert.match(source, /Estoque zerado/);
  assert.match(source, /Estoque baixo/);
  assert.match(source, /logout/);
});
```

- [ ] **Step 2: Prove RED**

Run:
```bash
node --test tests/p8-design-system-foundation.test.mjs
```
Expected: FAIL because the new components/tokens do not exist.

- [ ] **Step 3: Commit RED**

```bash
git add tests/p8-design-system-foundation.test.mjs
git commit -m "test: define P8.1 visual foundation contract"
```

Record the failing command/output and RED commit SHA in Issue #13.

---

### Task 2: Tokens, fonts, and UI primitives

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/DataCard.tsx`
- Create: `src/components/ui/MetricCard.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/PageHeader.tsx`

**Interfaces:**
- CSS variables: `--color-*`, `--font-ui`, `--font-data`, `--font-inter`, `--font-jetbrains-mono`.
- `ButtonProps`: native button props + `variant?: "primary" | "secondary" | "danger"`.
- `DataCard`: `{ children: ReactNode; className?: string }`.
- `MetricCard`: `{ label: string; value: ReactNode; hint?: ReactNode; tone?: "neutral" | "success" | "warning" | "critical" }`.
- `StatusBadge`: `{ children: ReactNode; tone?: "neutral" | "success" | "warning" | "critical" }`.
- `PageHeader`: `{ title: string; subtitle?: ReactNode; actions?: ReactNode }`.

- [ ] **Step 1: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

:root {
  --color-primary: #006c49;
  --color-primary-container: #10b981;
  --color-on-primary: #ffffff;
  --color-background: #f8f9fa;
  --color-surface: #f8f9fa;
  --color-surface-lowest: #ffffff;
  --color-surface-low: #f3f4f5;
  --color-surface-container: #edeeef;
  --color-surface-high: #e7e8e9;
  --color-surface-highest: #e1e3e4;
  --color-on-surface: #191c1d;
  --color-on-surface-variant: #3c4a42;
  --color-outline: #6c7a71;
  --color-outline-variant: #bbcabf;
  --color-border-subtle: #e5e7eb;
  --color-status-success: #10b981;
  --color-status-warning: #f59e0b;
  --color-status-critical: #ef4444;
  --color-error: #ba1a1a;
  --color-secondary: #0058be;
  --font-ui: var(--font-inter), Inter, Arial, Helvetica, sans-serif;
  --font-data: var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --touch-target: 48px;
}

* { box-sizing: border-box; }
html { background: var(--color-background); }
body { margin: 0; min-height: 100vh; background: var(--color-background); color: var(--color-on-surface); font-family: var(--font-ui); }
button, input, select, textarea { font: inherit; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
.font-data { font-family: var(--font-data); font-variant-numeric: tabular-nums; }
.touch-target { min-height: var(--touch-target); min-width: var(--touch-target); }
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Estoque Mercearia",
  description: "Controle simples e rastreável de estoque para pequena mercearia.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create `Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-[var(--color-primary)] text-[var(--color-on-primary)]",
  secondary: "border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] text-[var(--color-primary)]",
  danger: "border-transparent bg-[var(--color-error)] text-[var(--color-on-primary)]",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <button className={`min-h-12 rounded-lg border px-4 py-2 font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />;
}
```

- [ ] **Step 4: Create `DataCard.tsx`**

```tsx
import type { ReactNode } from "react";
export function DataCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] p-4 shadow-sm ${className}`}>{children}</section>;
}
```

- [ ] **Step 5: Create `StatusBadge.tsx`**

```tsx
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
```

- [ ] **Step 6: Create `MetricCard.tsx`**

```tsx
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
```

- [ ] **Step 7: Create `PageHeader.tsx`**

```tsx
import type { ReactNode } from "react";
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{subtitle ? <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{subtitle}</div> : null}</div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
```

- [ ] **Step 8: Run focused and regression checks**

```bash
node --test tests/p8-design-system-foundation.test.mjs
node --test tests/bootstrap.test.mjs tests/m5-history-dashboard.test.mjs
npm run lint
npm run typecheck
```

Expected: token/font tests PASS; P8 presentation test still fails only because shell files do not exist; legacy tests/lint/typecheck PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/ui
git commit -m "feat: add P8.1 design tokens and UI primitives"
```

---

### Task 3: Responsive shell and canonical navigation

**Files:**
- Create: `src/components/shell/navigation.ts`
- Create: `src/components/shell/DesktopSidebar.tsx`
- Create: `src/components/shell/MobileTopBar.tsx`
- Create: `src/components/shell/MobileBottomNav.tsx`
- Create: `src/components/shell/AppShell.tsx`

**Interfaces:**
- `Role = "ADMIN" | "OPERATOR"`.
- `getNavigation(role: Role): NavItem[]`.
- `isNavActive(pathname: string, href: string): boolean`.
- `AppShell({ children, role }: { children: ReactNode; role: Role })`.

- [ ] **Step 1: Create `navigation.ts`**

```ts
export type Role = "ADMIN" | "OPERATOR";
export type NavItem = { href: string; label: string; adminOnly?: boolean };
const navigation: NavItem[] = [
  { href: "/", label: "Painel" },
  { href: "/products", label: "Produtos" },
  { href: "/inventory", label: "Estoque" },
  { href: "/movements/new", label: "Movimentações" },
  { href: "/history", label: "Histórico" },
  { href: "/admin/users", label: "Administração", adminOnly: true },
];
export function getNavigation(role: Role): NavItem[] { return navigation.filter((item) => !item.adminOnly || role === "ADMIN"); }
export function isNavActive(pathname: string, href: string): boolean { return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`); }
```

- [ ] **Step 2: Create `DesktopSidebar.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigation, isNavActive, type Role } from "./navigation";
export function DesktopSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-container)] p-4 md:flex md:flex-col">
      <div className="mb-6 px-3 py-2"><p className="text-xl font-bold text-[var(--color-primary)]">Estoque Mercearia</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">{role === "ADMIN" ? "Administrador" : "Operador"}</p></div>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2">
        {getNavigation(role).map((item) => { const active = isNavActive(pathname, item.href); return <Link aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center rounded-lg px-3 py-2 font-semibold transition ${active ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]"}`} href={item.href} key={item.href}>{item.label}</Link>; })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create `MobileTopBar.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "./navigation";
export function MobileTopBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const adminActive = pathname.startsWith("/admin");
  return <header className="sticky top-0 z-40 flex min-h-12 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 md:hidden"><Link className="font-bold text-[var(--color-primary)]" href="/">Estoque Mercearia</Link>{role === "ADMIN" ? <Link aria-current={adminActive ? "page" : undefined} className="flex min-h-12 items-center px-2 text-sm font-semibold text-[var(--color-primary)]" href="/admin/users">Administração</Link> : null}</header>;
}
```

- [ ] **Step 4: Create `MobileBottomNav.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigation, isNavActive, type Role } from "./navigation";
export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = getNavigation(role).filter((item) => !item.adminOnly);
  return <nav aria-label="Navegação móvel" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-1 py-1 shadow-lg md:hidden">{items.map((item) => { const active = isNavActive(pathname, item.href); return <Link aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center justify-center rounded-lg px-1 text-center text-[11px] font-semibold leading-tight ${active ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)]"}`} href={item.href} key={item.href}>{item.label}</Link>; })}</nav>;
}
```

- [ ] **Step 5: Create `AppShell.tsx`**

```tsx
import type { ReactNode } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileTopBar } from "./MobileTopBar";
import type { Role } from "./navigation";
export function AppShell({ children, role }: { children: ReactNode; role: Role }) {
  return <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-on-surface)] md:flex"><DesktopSidebar role={role} /><div className="min-w-0 flex-1"><MobileTopBar role={role} /><div className="pb-24 md:pb-0">{children}</div></div><MobileBottomNav role={role} /></div>;
}
```

- [ ] **Step 6: Run checks**

```bash
node --test tests/p8-design-system-foundation.test.mjs
npm run lint
npm run typecheck
```

Expected: token/font/presentation/shell checks PASS; dashboard adoption still FAIL.

- [ ] **Step 7: Commit**

```bash
git add src/components/shell
git commit -m "feat: add responsive P8.1 app shell"
```

---

### Task 4: Dashboard adoption and full gate

**Files:**
- Modify: `src/app/page.tsx`
- Test: `tests/p8-design-system-foundation.test.mjs`
- Regression: all existing tests.

**Interfaces:**
- Consumes `AppShell`.
- Preserves every existing dashboard query, calculation, action, link, condition, and functional label.

- [ ] **Step 1: Add import**

Insert after the existing imports:
```tsx
import { AppShell } from "@/components/shell/AppShell";
```

- [ ] **Step 2: Change only the outer return wrapper**

In `src/app/page.tsx`, replace exactly:

```tsx
return <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
```

with:

```tsx
return <AppShell role={profile.role === "ADMIN" ? "ADMIN" : "OPERATOR"}><main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
```

Then replace the final:

```tsx
 </main>;
```

with:

```tsx
 </main></AppShell>;
```

No other line in `src/app/page.tsx` may change in P8.1.

- [ ] **Step 3: Prove focused GREEN**

```bash
node --test tests/p8-design-system-foundation.test.mjs tests/m5-history-dashboard.test.mjs
```
Expected: PASS.

- [ ] **Step 4: Verify diff invariants**

Confirm no changes to `createClient`, `auth.getClaims`, profile query, products query, `inventoryQuantity`, `zeroStock`, `lowStock`, `urgent`, `logout`, existing route hrefs, or ADMIN section condition.

- [ ] **Step 5: Commit dashboard adoption**

```bash
git add src/app/page.tsx
git commit -m "feat: adopt P8.1 shell on dashboard"
```

- [ ] **Step 6: Run complete gate**

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
Expected: all PASS.

- [ ] **Step 7: Scope review**

Allowed functional changes are limited to:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/ui/*`
- `src/components/shell/*`
- `tests/p8-design-system-foundation.test.mjs`.

No changes are allowed in migrations, `src/lib/supabase`, `src/proxy.ts`, any `actions.ts`, `src/modules/inventory`, `package.json`, or `package-lock.json`.

- [ ] **Step 8: Accessibility review**

Verify `lang="pt-BR"`, textual navigation, `aria-current="page"`, visible `:focus-visible`, >=48px mobile nav targets, role-filtered ADMIN link, and textual content in status primitives.

- [ ] **Step 9: Open review PR and hold**

PR title:
```text
feat: P8.1 visual foundation and app shell
```

PR body must link Issue #13 and include RED evidence, GREEN results, changed scope, accessibility review, exact statement `NO DB/RLS/AUTH/BUSINESS RULE CHANGE`, and explicit hold at integration gate. Do not merge or intentionally trigger production deployment before the applicable MCF gate.
