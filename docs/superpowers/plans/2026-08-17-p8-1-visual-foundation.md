# P8.1 Visual Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Estoque Mercearia Design System v1 foundation—semantic tokens, Inter/JetBrains Mono typography, reusable UI primitives, responsive application shell, and a dashboard shell adoption—without changing existing business logic, database behavior, authentication, Server Actions, RLS, or stock invariants.

**Architecture:** Keep `src/app` as route/composition and server-data boundary. Add presentation-only components under `src/components/ui` and responsive navigation/layout under `src/components/shell`; shell components receive role/data through props and never access Supabase. P8.1 wraps only the existing dashboard in the new shell as a proof of integration; dashboard queries and functional copy remain intact.

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
- `src/components/ui/Button.tsx` — base button/link visual primitive without domain logic.
- `src/components/ui/DataCard.tsx` — generic elevated surface container.
- `src/components/ui/MetricCard.tsx` — generic metric display surface.
- `src/components/ui/StatusBadge.tsx` — semantic text badge for success/warning/critical/neutral states.
- `src/components/ui/PageHeader.tsx` — title/subtitle/actions composition.
- `src/components/shell/navigation.ts` — canonical route metadata, including ADMIN-only entry.
- `src/components/shell/DesktopSidebar.tsx` — desktop persistent navigation with active state.
- `src/components/shell/MobileTopBar.tsx` — mobile brand bar with ADMIN shortcut when applicable.
- `src/components/shell/MobileBottomNav.tsx` — mobile operational navigation with active state.
- `src/components/shell/AppShell.tsx` — responsive layout composition around route content.

**Modify**
- `src/app/globals.css` — semantic CSS variables, font aliases, background/text defaults, focus-visible baseline, touch-target utility.
- `src/app/layout.tsx` — load Inter and JetBrains Mono with `next/font/google` and expose CSS variables.
- `src/app/page.tsx` — wrap the existing dashboard UI in `AppShell` and preserve all queries/actions/business logic.

---

### Task 1: RED contract for Design System foundation

**Files:**
- Create: `tests/p8-design-system-foundation.test.mjs`

**Interfaces:**
- Consumes: existing source files only.
- Produces: executable structural contract for Tasks 2–4.

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

Run:

```bash
node --test tests/p8-design-system-foundation.test.mjs
```

Expected: FAIL because tokens/components/AppShell do not exist yet.

- [ ] **Step 3: Record RED evidence in the P8.1 issue/PR notes**

Expected record: command, failing assertions/missing files, commit SHA containing only the test.

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
- Produces CSS variables `--color-*`, `--font-ui`, `--font-data`, and Next font variables `--font-inter`, `--font-jetbrains-mono` used by all later components.

- [ ] **Step 1: Implement semantic global CSS**

Replace the minimal global CSS with a Tailwind 4-compatible semantic baseline:

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
body {
  margin: 0;
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-on-surface);
  font-family: var(--font-ui);
}
button, input, select, textarea { font: inherit; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
.font-data { font-family: var(--font-data); font-variant-numeric: tabular-nums; }
.touch-target { min-height: var(--touch-target); min-width: var(--touch-target); }
```

- [ ] **Step 2: Load approved fonts in the root layout**

Use `next/font/google` and CSS variables:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

// keep existing metadata unchanged

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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

Expected: token/font assertions PASS; component/shell assertions still FAIL.

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
- `Button`: `ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>` with `variant?: "primary" | "secondary" | "danger"`.
- `DataCard`: `{ children: React.ReactNode; className?: string }`.
- `MetricCard`: `{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "neutral" | "success" | "warning" | "critical" }`.
- `StatusBadge`: `{ children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "critical" }`.
- `PageHeader`: `{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }`.

- [ ] **Step 1: Implement minimal primitives using semantic CSS variables**

Rules:
- no Supabase imports;
- no business-state calculations;
- native HTML controls/elements by default;
- `Button` keeps a 48px minimum height;
- focus is inherited from the global `:focus-visible` baseline;
- tones use `var(--color-...)`, not copied Stitch hex values.

Representative `StatusBadge` implementation:

```tsx
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "critical";
const tones: Record<Tone, string> = {
  neutral: "border-[var(--color-border-subtle)] bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)]",
  success: "border-[var(--color-status-success)]/30 bg-[var(--color-status-success)]/10 text-[var(--color-primary)]",
  warning: "border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning)]/10 text-amber-800",
  critical: "border-[var(--color-status-critical)]/30 bg-[var(--color-status-critical)]/10 text-red-700",
};

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
```

- [ ] **Step 2: Run the focused contract**

```bash
node --test tests/p8-design-system-foundation.test.mjs
```

Expected: tokens/fonts/presentation independence PASS; shell/dashboard assertions still FAIL.

- [ ] **Step 3: Run lint and typecheck on the new primitives**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit primitives**

```bash
git add src/components/ui tests/p8-design-system-foundation.test.mjs
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
- `AppShell({ children, role }: { children: React.ReactNode; role: Role })`.

- [ ] **Step 1: Create canonical route metadata**

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

export function getNavigation(role: Role) {
  return navigation.filter((item) => !item.adminOnly || role === "ADMIN");
}
```

- [ ] **Step 2: Implement active-link rule consistently**

`DesktopSidebar` and `MobileBottomNav` are client components using `usePathname()`.

Active rule:

```ts
const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
```

Each active link must render:

```tsx
aria-current={active ? "page" : undefined}
```

- [ ] **Step 3: Implement desktop sidebar**

Requirements:
- hidden below `md`;
- width about 18rem (`w-72`);
- semantic surface/background variables;
- `Estoque Mercearia` brand only;
- ADMIN item filtered by `role`;
- links at least 48px tall.

- [ ] **Step 4: Implement mobile top bar and bottom nav**

Requirements:
- `MobileTopBar`: visible below `md`, brand `Estoque Mercearia`, optional `Administração` shortcut only for ADMIN;
- `MobileBottomNav`: visible below `md`, fixed bottom, operational items Painel/Produtos/Estoque/Movimentações/Histórico; ADMIN remains available through TopBar shortcut;
- no generic avatar/photo;
- no icon library dependency;
- `aria-current` on active bottom-nav link.

- [ ] **Step 5: Compose AppShell**

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

Expected: all assertions except dashboard adoption PASS.

- [ ] **Step 7: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit shell**

```bash
git add src/components/shell tests/p8-design-system-foundation.test.mjs
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

- [ ] **Step 1: Add only the AppShell import and wrapper**

Add:

```tsx
import { AppShell } from "@/components/shell/AppShell";
```

After the existing role/profile validation, wrap the existing dashboard presentation:

```tsx
return (
  <AppShell role={profile.role}>
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* existing dashboard content remains functionally unchanged */}
    </main>
  </AppShell>
);
```

If Supabase typing does not narrow `profile.role` to `"ADMIN" | "OPERATOR"`, narrow it locally only after the existing active-profile validation; do not change the database query or role model.

- [ ] **Step 2: Verify P8.1 and M5 focused tests**

```bash
node --test tests/p8-design-system-foundation.test.mjs tests/m5-history-dashboard.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Confirm dashboard business-source invariants are unchanged**

Inspect diff and ensure no edits to:
- `createClient()` call;
- `auth.getClaims()`;
- profile `.select(...)` / `.eq(...)`;
- products `.select(...)` / `.eq(...)` / `.order(...)`;
- `zeroStock`, `lowStock`, `urgent` calculations;
- `logout` Server Action import/call.

- [ ] **Step 4: Commit dashboard adoption**

```bash
git add src/app/page.tsx tests/p8-design-system-foundation.test.mjs
git commit -m "feat: adopt P8.1 shell on dashboard"
```

---

### Task 6: Full regression and implementation gate

**Files:**
- No functional file changes unless a validation failure reveals a P8.1 regression.
- Update implementation evidence in Issue #13 / PR description.

**Interfaces:**
- Consumes the complete P8.1 branch.
- Produces gate evidence for review; does not authorize merge by itself.

- [ ] **Step 1: Run full tests**

```bash
npm test
```

Expected: all legacy tests plus P8.1 contract PASS.

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

Expected changed functional scope only:
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/ui/*`
- `src/components/shell/*`
- `tests/p8-design-system-foundation.test.mjs`
- P8.1 docs/evidence

No expected changes to migrations, Supabase proxy/client code, Server Actions, package dependencies, inventory module, or database policy files.

- [ ] **Step 6: Perform accessibility/source review**

Check:
- `lang="pt-BR"` retained;
- all navigation links remain textual and understandable without icons;
- active navigation exposes `aria-current="page"`;
- global `:focus-visible` is visible;
- mobile nav actions are >=48px;
- ADMIN-only navigation is role-filtered;
- no status/domain meaning is expressed by color alone in newly introduced primitives.

- [ ] **Step 7: Open review PR without merging**

PR title:

```text
feat: P8.1 visual foundation and app shell
```

PR body must include RED evidence, GREEN commands/results, changed-file scope, explicit statement `NO DB/RLS/AUTH/BUSINESS RULE CHANGE`, accessibility review, and linkage to Issue #13.

- [ ] **Step 8: Hold at integration gate**

Do not merge or trigger production deployment until the applicable MCF review/gate is satisfied.
