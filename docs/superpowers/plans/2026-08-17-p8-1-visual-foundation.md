# P8.1 Visual Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Estoque Mercearia Design System v1 foundation—semantic tokens, Inter/JetBrains Mono typography, reusable UI primitives, responsive application shell, and dashboard shell adoption—without changing business logic, database behavior, authentication, Server Actions, RLS, or stock invariants.

**Architecture:** Keep `src/app` as the route/composition and server-data boundary. Add presentation-only components under `src/components/ui` and responsive navigation/layout under `src/components/shell`; these components receive role/data through props and never access Supabase. P8.1 wraps only the existing dashboard in the new shell as proof of integration; dashboard queries, calculations, actions, routes, and functional copy remain intact.

**Tech Stack:** Next.js 16.3.1, React 19.2.8, TypeScript 5, Tailwind CSS 4, Node.js test runner (`node --test`).

## Global Constraints

- Identity is exactly `Estoque Mercearia`; initial language is `pt-BR`.
- UI font is `Inter`; data/SKU/tabular font is `JetBrains Mono`.
- Semantic colors: primary `#006C49`, primary-container/success `#10B981`, warning `#F59E0B`, critical `#EF4444`, error `#BA1A1A`, secondary `#0058BE`, background/surface `#F8F9FA`.
- Spacing base is 4px; principal mobile touch targets are at least 48px.
- Responsive boundary: `<768px` mobile TopBar + BottomNav; `>=768px` persistent desktop sidebar.
- No new UI/icon dependency in P8.1.
- No dark mode promise in P8.1.
- No migration/schema/RLS/auth/Server Action/business-rule change.
- No raw Stitch HTML, Tailwind CDN, inline Stitch scripts, StockFlow/FreshFlow/Main Branch/Manager Access copy, or generic employee photos.
- UI and shell components must not import Supabase clients.
- Existing tests must remain green; final gate requires lint, full tests, typecheck, and build.

---

## File Structure

**Create**
- `tests/p8-design-system-foundation.test.mjs` — structural contract for tokens, fonts, presentation boundaries, shell accessibility, and dashboard adoption.
- `src/components/ui/Button.tsx` — base button primitive without domain logic.
- `src/components/ui/DataCard.tsx` — generic elevated surface container.
- `src/components/ui/MetricCard.tsx` — generic metric display surface.
- `src/components/ui/StatusBadge.tsx` — semantic text badge for status display.
- `src/components/ui/PageHeader.tsx` — title/subtitle/actions composition.
- `src/components/shell/navigation.ts` — canonical route metadata and role filtering.
- `src/components/shell/DesktopSidebar.tsx` — desktop persistent navigation with active state.
- `src/components/shell/MobileTopBar.tsx` — mobile brand bar plus ADMIN shortcut.
- `src/components/shell/MobileBottomNav.tsx` — mobile operational navigation with active state.
- `src/components/shell/AppShell.tsx` — responsive layout composition around route content.

**Modify**
- `src/app/globals.css` — semantic CSS variables, font aliases, background/text defaults, focus-visible baseline, touch-target utility.
- `src/app/layout.tsx` — load Inter and JetBrains Mono with `next/font/google` and expose CSS variables.
- `src/app/page.tsx` — wrap existing dashboard UI in `AppShell`, preserving queries/actions/business logic.

---

### Task 1: RED contract for Design System foundation

**Files:**
- Create: `tests/p8-design-system-foundation.test.mjs`

**Interfaces:**
- Consumes: existing source files only.
- Produces: executable structural contract for Tasks 2–5.

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

test("P8.1 defines semantic design tokens and accessible global interaction defaults", async () => {
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

test("P8.1 loads Inter and JetBrains Mono through Next font variables", async () => {
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /Inter/);
  assert.match(layout, /JetBrains_Mono/);
  assert.match(layout, /--font-inter/);
  assert.match(layout, /--font-jetbrains-mono/);
  assert.match(layout, /lang="pt-BR"/);
});

test("P8.1 presentation layer remains independent from Supabase", async () => {
  for (const path of presentationFiles) {
    const source = await read(path);
    assert.doesNotMatch(source, /@\/lib\/supabase|createClient|\.from\(/, path);
  }
});

test("P8.1 shell exposes responsive canonical navigation with accessible active state", async () => {
  const nav = await read("src/components/shell/navigation.ts");
  const desktop = await read("src/components/shell/DesktopSidebar.tsx");
  const mobile = await read("src/components/shell/MobileBottomNav.tsx");
  const shell = await read("src/components/shell/AppShell.tsx");

  assert.match(nav, /Painel/);
  assert.match(nav, /Produtos/);
  assert.match(nav, /Estoque/);
  assert.match(nav, /Movimentações/);
  assert.match(nav, /Histórico/);
  assert.match(nav, /Administração/);
  assert.match(nav, /ADMIN/);
  assert.match(desktop, /aria-current/);
  assert.match(mobile, /aria-current/);
  assert.match(shell, /DesktopSidebar/);
  assert.match(shell, /MobileTopBar/);
  assert.match(shell, /MobileBottomNav/);
});

test("P8.1 dashboard adopts AppShell without losing M5 business contracts", async () => {
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

- [ ] **Step 2: Run the focused test and prove RED**

```bash
node --test tests/p8-design-system-foundation.test.mjs
```

Expected: FAIL because tokens/components/AppShell do not exist yet.

- [ ] **Step 3: Record RED evidence**

Record in Issue #13 / PR notes: command, failing assertions or missing files, and the commit SHA containing only the new RED contract.

- [ ] **Step 4: Commit the RED contract**

```bash
git add tests/p8-design-system-foundation.test.mjs
git commit -m "test: define P8.1 visual foundation contract"
```

---

### Task 2: Semantic tokens and typography

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Test: `tests/p8-design-system-foundation.test.mjs`

**Interfaces:**
- Produces CSS variables `--color-*`, `--font-ui`, `--font-data`, and Next font variables `--font-inter`, `--font-jetbrains-mono` used by later components.

- [ ] **Step 1: Replace `src/app/globals.css` with the semantic baseline**

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

* {
  box-sizing: border-box;
}

html {
  background: var(--color-background);
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-on-surface);
  font-family: var(--font-ui);
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: inherit;
}

:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
}

.font-data {
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
}

.touch-target {
  min-height: var(--touch-target);
  min-width: var(--touch-target);
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx` with approved fonts while preserving metadata**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Estoque Mercearia",
  description: "Controle simples e rastreável de estoque para pequena mercearia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${jetBrainsMono.variable}`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Run the focused test**

```bash
node --test tests/p8-design-system-foundation.test.mjs
```

Expected: token/font assertions PASS; presentation/shell assertions still FAIL until Tasks 3–4.

- [ ] **Step 4: Run existing bootstrap/M5 regressions**

```bash
node --test tests/bootstrap.test.mjs tests/m5-history-dashboard.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit tokens and typography**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add P8.1 design tokens and typography"
```

---

### Task 3: UI primitives with no domain/data dependency

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/DataCard.tsx`
- Create: `src/components/ui/MetricCard.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/PageHeader.tsx`
- Test: `tests/p8-design-system-foundation.test.mjs`

**Interfaces:**
- `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>` with `variant?: "primary" | "secondary" | "danger"`.
- `DataCardProps = { children: React.ReactNode; className?: string }`.
- `MetricCardProps = { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: Tone }`.
- `StatusBadgeProps = { children: React.ReactNode; tone?: Tone }`.
- `PageHeaderProps = { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }`.
- `Tone = "neutral" | "success" | "warning" | "critical"`; primitives do not derive tones from business data.

- [ ] **Step 1: Create `Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-[var(--color-primary)] text-[var(--color-on-primary)]",
  secondary: "border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] text-[var(--color-primary)]",
  danger: "border-transparent bg-[var(--color-error)] text-[var(--color-on-primary)]",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-12 rounded-lg border px-4 py-2 font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Create `DataCard.tsx`**

```tsx
import type { ReactNode } from "react";

export function DataCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] p-4 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Create `StatusBadge.tsx`**

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
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-[var(--color-surface-lowest)] px-3 py-1 text-xs font-bold text-[var(--color-on-surface)] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create `MetricCard.tsx`**

```tsx
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "critical";

const tones: Record<Tone, string> = {
  neutral: "border-[var(--color-border-subtle)]",
  success: "border-[var(--color-status-success)]",
  warning: "border-[var(--color-status-warning)]",
  critical: "border-[var(--color-status-critical)]",
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
}) {
  return (
    <article className={`rounded-xl border bg-[var(--color-surface-lowest)] p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm text-[var(--color-on-surface-variant)]">{label}</p>
      <div className="mt-1 text-3xl font-bold tracking-tight">{value}</div>
      {hint ? <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{hint}</div> : null}
    </article>
  );
}
```

- [ ] **Step 5: Create `PageHeader.tsx`**

```tsx
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{subtitle}</div> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
```

- [ ] **Step 6: Run the focused contract**

```bash
node --test tests/p8-design-system-foundation.test.mjs
```

Expected: tokens/fonts and available presentation-independence checks PASS; shell files remain missing until Task 4.

- [ ] **Step 7: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit primitives**

```bash
git add src/components/ui
git commit -m "feat: add P8.1 UI primitives"
```

---

### Task 4: Responsive AppShell and canonical navigation

**Files:**
- Create: `src/components/shell/navigation.ts`
- Create: `src/components/shell/DesktopSidebar.tsx`
- Create: `src/components/shell/MobileTopBar.tsx`
- Create: `src/components/shell/MobileBottomNav.tsx`
- Create: `src/components/shell/AppShell.tsx`
- Test: `tests/p8-design-system-foundation.test.mjs`

**Interfaces:**
- `Role = "ADMIN" | "OPERATOR"`.
- `NavItem = { href: string; label: string; adminOnly?: boolean }`.
- `getNavigation(role: Role): NavItem[]` returns canonical visible items.
- `isNavActive(pathname: string, href: string): boolean` provides one active-link rule.
- `AppShell({ children, role }: { children: React.ReactNode; role: Role })`.

- [ ] **Step 1: Create `navigation.ts`**

```ts
export type Role = "ADMIN" | "OPERATOR";
export type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const navigation: NavItem[] = [
  { href: "/", label: "Painel" },
  { href: "/products", label: "Produtos" },
  { href: "/inventory", label: "Estoque" },
  { href: "/movements/new", label: "Movimentações" },
  { href: "/history", label: "Histórico" },
  { href: "/admin/users", label: "Administração", adminOnly: true },
];

export function getNavigation(role: Role): NavItem[] {
  return navigation.filter((item) => !item.adminOnly || role === "ADMIN");
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
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
      <div className="mb-6 px-3 py-2">
        <p className="text-xl font-bold text-[var(--color-primary)]">Estoque Mercearia</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
          {role === "ADMIN" ? "Administrador" : "Operador"}
        </p>
      </div>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2">
        {getNavigation(role).map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center rounded-lg px-3 py-2 font-semibold transition ${
                active
                  ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
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

  return (
    <header className="sticky top-0 z-40 flex min-h-12 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 md:hidden">
      <Link className="font-bold text-[var(--color-primary)]" href="/">
        Estoque Mercearia
      </Link>
      {role === "ADMIN" ? (
        <Link
          aria-current={adminActive ? "page" : undefined}
          className="flex min-h-12 items-center px-2 text-sm font-semibold text-[var(--color-primary)]"
          href="/admin/users"
        >
          Administração
        </Link>
      ) : null}
    </header>
  );
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

  return (
    <nav
      aria-label="Navegação móvel"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-1 py-1 shadow-lg md:hidden"
    >
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 items-center justify-center rounded-lg px-1 text-center text-[11px] font-semibold leading-tight ${
              active
                ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]"
                : "text-[var(--color-on-surface-variant)]"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
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
```

- [ ] **Step 6: Run focused tests**

```bash
node --test tests/p8-design-system-foundation.test.mjs
```

Expected: token/font/presentation/shell assertions PASS; dashboard-adoption assertion still FAIL.

- [ ] **Step 7: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit shell**

```bash
git add src/components/shell
git commit -m "feat: add responsive P8.1 app shell"
```

---

### Task 5: Adopt AppShell on dashboard without functional rewrite

**Files:**
- Modify: `src/app/page.tsx`
- Test: `tests/p8-design-system-foundation.test.mjs`
- Regression: `tests/m5-history-dashboard.test.mjs`

**Interfaces:**
- Consumes: `AppShell({ role, children })` from Task 4.
- Preserves: existing Supabase claims/profile/products queries, stock calculations, logout action, route links, and M5 metric copy.

- [ ] **Step 1: Add the AppShell import**

```tsx
import { AppShell } from "@/components/shell/AppShell";
```

Do not modify existing Supabase imports or the `logout` import.

- [ ] **Step 2: Wrap only the returned dashboard presentation**

Keep all code before `return` unchanged. Replace only the outer returned `<main>` with the `AppShell` wrapper below, and move the exact current JSX children of `<main>` into the new inner `<main>` without modifying their text, links, conditions, form actions, or data expressions:

```tsx
return (
  <AppShell role={profile.role === "ADMIN" ? "ADMIN" : "OPERATOR"}>
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      CURRENT_DASHBOARD_CHILDREN_UNCHANGED
    </main>
  </AppShell>
);
```

`CURRENT_DASHBOARD_CHILDREN_UNCHANGED` is not literal source code: it denotes the existing header, metrics section, module navigation, ADMIN section, and urgent-stock section already present in `src/app/page.tsx`. The resulting source file must contain those existing JSX nodes and must not contain the marker string.

- [ ] **Step 3: Verify P8.1 and M5 focused tests**

```bash
node --test tests/p8-design-system-foundation.test.mjs tests/m5-history-dashboard.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Inspect the dashboard diff for functional invariants**

Confirm the diff has no edits to:
- `createClient()`;
- `auth.getClaims()`;
- profile `.select(...)` and `.eq(...)`;
- products `.select(...)`, `.eq(...)`, and `.order(...)`;
- `inventoryQuantity()`;
- `zeroStock`, `lowStock`, and `urgent` calculations;
- `logout` Server Action import/call;
- ADMIN visibility condition for the existing admin section.

- [ ] **Step 5: Commit dashboard adoption**

```bash
git add src/app/page.tsx
git commit -m "feat: adopt P8.1 shell on dashboard"
```

---

### Task 6: Full regression and implementation gate

**Files:**
- No functional file changes unless a validation failure proves a P8.1 regression.
- Record implementation evidence in Issue #13 and the review PR.

**Interfaces:**
- Consumes: complete P8.1 branch.
- Produces: review evidence; it does not authorize merge by itself.

- [ ] **Step 1: Run full tests**

```bash
npm test
```

Expected: all legacy tests plus the P8.1 contract PASS.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Inspect changed-file scope**

Allowed functional scope:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/ui/*`
- `src/components/shell/*`
- `tests/p8-design-system-foundation.test.mjs`
- P8.1 design/plan/evidence docs.

Expected absent changes:
- `supabase/migrations/*`
- `src/lib/supabase/*`
- `src/proxy.ts`
- any `actions.ts`
- `src/modules/inventory/*`
- `package.json` / `package-lock.json`.

- [ ] **Step 6: Perform accessibility/source review**

Confirm:
- `lang="pt-BR"` retained;
- navigation is understandable without icons;
- active navigation exposes `aria-current="page"`;
- global `:focus-visible` is present;
- mobile navigation actions are at least 48px high;
- ADMIN navigation is role-filtered;
- newly introduced status primitives display textual content and never rely on color alone.

- [ ] **Step 7: Open review PR without merging**

Title:

```text
feat: P8.1 visual foundation and app shell
```

Body must contain:
- link to Issue #13;
- RED commit/run evidence;
- GREEN CI commands/results;
- changed-file scope;
- exact statement `NO DB/RLS/AUTH/BUSINESS RULE CHANGE`;
- accessibility review result;
- explicit hold at integration gate.

- [ ] **Step 8: Hold at integration gate**

Do not merge and do not intentionally trigger a production deployment until the applicable MCF review/gate is satisfied.
