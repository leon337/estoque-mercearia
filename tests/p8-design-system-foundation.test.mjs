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

test("P8.1 global CSS does not override Tailwind link color utilities", async () => {
  const css = await read("src/app/globals.css");
  assert.doesNotMatch(css, /^\s*a\s*\{\s*color:\s*inherit;\s*\}\s*$/m);
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
  assert.match(nav, /href === "\/admin\/users"[\s\S]*pathname\.startsWith\("\/admin"\)/);
  assert.match(desktop, /aria-current/);
  assert.match(desktop, /sticky/);
  assert.match(desktop, /h-screen/);
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
