import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P8.3a dashboard adopts Design System primitives and canonical panel hierarchy", async () => {
  const source = await read("src/app/page.tsx");

  for (const primitive of ["PageHeader", "MetricCard", "DataCard", "StatusBadge", "Button"]) {
    assert.match(source, new RegExp(primitive), primitive);
  }

  assert.match(source, /title="Painel"/);
  assert.match(source, /Nova movimentação/);
  assert.match(source, /Atenção no estoque/);
  assert.match(source, /Ações rápidas/);
});

test("P8.3a dashboard preserves the qualified stock data and auth boundary", async () => {
  const source = await read("src/app/page.tsx");

  assert.match(source, /getClaims\(\)/);
  assert.match(source, /\.from\("profiles"\)/);
  assert.match(source, /\.eq\("id", claimsData\.claims\.sub\)/);
  assert.match(source, /\.from\("products"\)/);
  assert.match(source, /inventory\(quantity\)/);
  assert.match(source, /\.eq\("active",true\)/);
  assert.match(source, /zeroStock=rows\.filter/);
  assert.match(source, /lowStock=rows\.filter/);
  assert.match(source, /slice\(0,8\)/);
  assert.match(source, /action=\{logout\}/);
  assert.match(source, /profile\.role === "ADMIN"/);
});

test("P8.3a dashboard communicates inventory urgency with text and semantic tones", async () => {
  const source = await read("src/app/page.tsx");

  assert.match(source, /tone="critical"/);
  assert.match(source, /tone="warning"/);
  assert.match(source, /ZERADO/);
  assert.match(source, /BAIXO/);
  assert.match(source, /font-data/);
  assert.match(source, /Ver estoque completo|Ver todos os alertas/);
});

test("P8.3a dashboard stays mobile-first and does not invent unsupported analytics", async () => {
  const source = await read("src/app/page.tsx");

  assert.match(source, /sm:grid-cols-3/);
  assert.match(source, /lg:grid-cols-\[minmax\(0,2fr\)_minmax\(18rem,1fr\)\]/);
  assert.match(source, /min-h-12/);
  assert.doesNotMatch(source, /<canvas|<svg[^>]*chart|recharts|chart\.js/i);
  assert.doesNotMatch(source, /Vendas do mês|Faturamento|Relatórios de vendas/i);
});

test("P8.3a alert card removes base padding through the DataCard API", async () => {
  const dashboard = await read("src/app/page.tsx");
  const dataCard = await read("src/components/ui/DataCard.tsx");

  assert.match(dataCard, /padding\??:/);
  assert.match(dataCard, /none/);
  assert.match(dashboard, /<DataCard padding="none">/);
  assert.doesNotMatch(dashboard, /<DataCard className="p-0">/);
});
