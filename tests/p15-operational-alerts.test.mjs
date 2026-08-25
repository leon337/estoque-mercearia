import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("P15 exposes a derived operational alerts center", async () => {
  const [page, helper] = await Promise.all([
    read("src/app/alerts/page.tsx"),
    read("src/lib/alerts.ts"),
  ]);
  assert.match(page, /title="Alertas operacionais"/);
  assert.match(page, /\.from\("products"\)/);
  assert.match(page, /\.from\("inventory"\)/);
  assert.doesNotMatch(page, /inventory\(quantity\)/);
  assert.match(helper, /CRITICAL/);
  assert.match(helper, /WARNING/);
  assert.match(helper, /quantity\s*<=\s*0/);
  assert.match(helper, /quantity\s*>\s*0\s*&&\s*quantity\s*<=\s*minimumStock/);
});

test("P15 alerts support search/filter and preserve session boundary", async () => {
  const page = await read("src/app/alerts/page.tsx");
  assert.match(page, /getClaims\(\)/);
  assert.match(page, /profile\?\.active/);
  assert.match(page, /severity/);
  assert.match(page, /query/);
  assert.match(page, /CRITICAL/);
  assert.match(page, /WARNING/);
});

test("P15 navigation exposes alerts without expanding the qualified mobile bottom nav", async () => {
  const [navigation, mobile] = await Promise.all([
    read("src/components/shell/navigation.ts"),
    read("src/components/shell/MobileBottomNav.tsx"),
  ]);
  assert.match(navigation, /"\/alerts"/);
  assert.match(navigation, /label:\s*"Alertas"/);
  assert.match(mobile, /slice\(0,\s*5\)/);
  const mobileRoutes = mobile.match(/MOBILE_NAV_ROUTES:[\s\S]*?\];/)?.[0] ?? "";
  assert.doesNotMatch(mobileRoutes, /"\/alerts"/);
});

test("P15 dashboard attention block points operators to the alerts center", async () => {
  const page = await read("src/app/page.tsx");
  assert.match(page, /Atenção no estoque[\s\S]*href="\/alerts"[\s\S]*Ver todos os alertas/);
});

test("P15 Production Smoke covers the alerts route in both primary viewports", async () => {
  const [runner, orchestrator] = await Promise.all([
    read("scripts/e2e/alerts-smoke-runner.mjs"),
    read("scripts/e2e/production-smoke.mjs"),
  ]);
  assert.match(runner, /PRIMARY_VIEWPORTS/);
  assert.match(runner, /\/alerts/);
  assert.match(runner, /Alertas operacionais/);
  assert.match(runner, /recordFunctional/);
  assert.match(orchestrator, /alerts-smoke-runner\.mjs/);
});
