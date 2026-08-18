import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const files = {
  workflow: ".github/workflows/production-smoke.yml",
  runner: "scripts/e2e/production-smoke.mjs",
  criticalReview: "scripts/e2e/critical-review.mjs",
  lib: "scripts/e2e/smoke-lib.mjs",
};

async function assertExists(path) {
  let exists = true;
  try {
    await access(new URL(`../${path}`, import.meta.url));
  } catch {
    exists = false;
  }
  assert.equal(exists, true, `${path} must exist`);
}

test("P9 autonomous smoke provides workflow runner helpers and independent RC", async () => {
  for (const path of Object.values(files)) {
    await assertExists(path);
  }
});

test("P9 workflow is MCF-triggerable, evidence-preserving and credential-safe", async () => {
  await assertExists(files.workflow);
  const source = await read(files.workflow);

  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /issue_comment:/);
  assert.match(source, /issue\.number\s*==\s*19/);
  assert.match(source, /smoke-production/);
  assert.match(source, /pull_request:/);
  assert.match(source, /E2E_ADMIN_EMAIL:\s*\$\{\{\s*secrets\.E2E_ADMIN_EMAIL\s*\}\}/);
  assert.match(source, /E2E_ADMIN_PASSWORD:\s*\$\{\{\s*secrets\.E2E_ADMIN_PASSWORD\s*\}\}/);
  assert.match(source, /actions\/upload-artifact@v4/);
  assert.match(source, /continue-on-error:\s*true/);
  assert.doesNotMatch(source, /password\s*:\s*["'][^$]/i);
});

test("P9 runner covers public authenticated admin dynamic routes and QA lifecycle", async () => {
  await assertExists(files.runner);
  await assertExists(files.lib);
  const runner = await read(files.runner);
  const lib = await read(files.lib);
  const combined = `${runner}\n${lib}`;

  for (const route of [
    "/login",
    "/register",
    "/products/new",
    "/products/[id]/edit",
    "/admin/adjustment",
    "/admin/users",
    "/inventory",
    "/movements/new",
    "/history",
  ]) {
    assert.match(combined, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(combined, /QA-E2E-/);
  assert.match(combined, /E2E_ADMIN_EMAIL/);
  assert.match(combined, /E2E_ADMIN_PASSWORD/);
  assert.match(combined, /BLOCKED/);
  assert.match(combined, /Inativar/);
  assert.match(combined, /route-inventory\.json/);
  assert.match(combined, /report\.json/);
  assert.match(combined, /report\.md/);
});

test("P9 responsive matrix includes primary desktop mobile and independent boundary widths", async () => {
  await assertExists(files.lib);
  await assertExists(files.criticalReview);
  const lib = await read(files.lib);
  const rc = await read(files.criticalReview);

  assert.match(lib, /1440/);
  assert.match(lib, /900/);
  assert.match(lib, /375/);
  assert.match(lib, /812/);
  assert.match(lib, /320/);
  assert.match(lib, /568/);
  assert.match(lib, /1024/);
  assert.match(lib, /768/);
  assert.match(rc, /critical-review/);
  assert.match(rc, /storage-state/);
  assert.match(rc, /fresh|chromium\.launch/i);
});

test("P9 evidence classification prevents false PASS and preserves non-secret screenshots", async () => {
  await assertExists(files.lib);
  const source = await read(files.lib);

  for (const status of ["PASS", "PASS_COM_RESSALVA", "FAIL", "BLOCKED"]) {
    assert.match(source, new RegExp(status));
  }
  for (const dimension of [
    "desktop_visual",
    "mobile_visual",
    "functional_smoke",
    "responsive_consistency",
    "critical_review",
    "overall",
  ]) {
    assert.match(source, new RegExp(dimension));
  }

  assert.match(source, /scrollWidth/);
  assert.match(source, /innerWidth/);
  assert.match(source, /screenshot/);
  assert.match(source, /fullPage:\s*true/);
  assert.doesNotMatch(source, /E2E_ADMIN_PASSWORD\s*[:=]\s*["'][^"']+["']/);
});
