import { chromium } from "@playwright/test";
import { rm, unlink } from "node:fs/promises";
import path from "node:path";
import {
  PRIMARY_VIEWPORTS,
  SEED_ROUTES,
  addDiscoveredRoutes,
  attachErrorCollector,
  captureEvidence,
  collectSameOriginLinks,
  createReport,
  inspectPage,
  recordFunctional,
  recordRoute,
  retryOnce,
  seedRouteRecord,
  worstStatus,
  writeReports,
} from "./smoke-lib.mjs";

const DEFAULT_BASE_URL = "https://estoque-mercearia.onrender.com";
const baseURL = (process.env.E2E_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const adminEmail = process.env.E2E_ADMIN_EMAIL || "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "";
const outputDir = process.env.E2E_OUTPUT_DIR || "e2e-output";
const authStatePath = path.resolve(".e2e-auth-state.json");
const runId = String(process.env.GITHUB_RUN_ID || Date.now());
const qaName = `QA-E2E-${runId}`;
const qaEditedName = `${qaName}-EDIT`;
const qaInternalCode = `QA${runId.slice(-10)}`;
const qaBarcode = `${Date.now()}`.slice(-13).padStart(13, "9");

const report = createReport(baseURL);
report.routes = SEED_ROUTES.map(seedRouteRecord);
report.credentials.available = Boolean(adminEmail && adminPassword);
report.runNotes.push(`run_id=${runId}`);
report.runNotes.push("No credential values are written to this report.");

await rm(outputDir, { recursive: true, force: true });
await unlink(authStatePath).catch(() => {});

const browser = await chromium.launch({ headless: true });

async function gotoWithRetry(page, pathname) {
  const url = pathname.startsWith("http") ? pathname : `${baseURL}${pathname}`;
  await retryOnce(async () => {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (response && response.status() >= 500) {
      throw new Error(`HTTP ${response.status()} for ${url}`);
    }
  });
  await page.waitForTimeout(250);
}

function routeIdentity(route, concretePath = route.path) {
  return {
    template: route.template,
    path: concretePath,
    name: route.name,
    type: route.type,
  };
}

async function auditRoute(context, route, viewportName, concretePath = route.path, state = "default") {
  const page = await context.newPage();
  const runtimeErrors = attachErrorCollector(page);
  try {
    await gotoWithRetry(page, concretePath);
    const current = new URL(page.url());
    const expectedPath = new URL(`${baseURL}${concretePath}`).pathname;
    const findings = [];
    if (current.pathname !== expectedPath) {
      findings.push({
        code: "unexpected_redirect",
        severity: "error",
        route: route.template,
        viewport: viewportName,
        detail: `expected ${expectedPath}, got ${current.pathname}`,
      });
    }

    const inspection = await inspectPage(page, route.template, viewportName, runtimeErrors);
    findings.push(...inspection.findings);
    const evidence = await captureEvidence(page, outputDir, viewportName, route.name, state);
    addDiscoveredRoutes(report, await collectSameOriginLinks(page, baseURL));
    const status = findings.some((item) => item.severity === "error")
      ? "FAIL"
      : findings.some((item) => item.severity === "warning")
        ? "PASS_COM_RESSALVA"
        : "PASS";
    recordRoute(report, {
      ...routeIdentity(route, concretePath),
      viewport: viewportName,
      status,
      evidence,
      findings,
      url: page.url(),
    });
    return { page, status, evidence, findings };
  } catch (error) {
    let evidence = null;
    try {
      evidence = await captureEvidence(page, outputDir, viewportName, route.name, "failure");
    } catch {}
    const findings = [{
      code: "navigation_or_assertion_failure",
      severity: "error",
      route: route.template,
      viewport: viewportName,
      detail: String(error?.message ?? error),
    }];
    recordRoute(report, {
      ...routeIdentity(route, concretePath),
      viewport: viewportName,
      status: "FAIL",
      evidence,
      findings,
      url: page.url(),
    });
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

async function publicSmoke() {
  const publicRoutes = SEED_ROUTES.filter((route) => route.type === "public");
  for (const [viewportName, viewport] of Object.entries(PRIMARY_VIEWPORTS)) {
    const context = await browser.newContext({ viewport });
    try {
      for (const route of publicRoutes) {
        await auditRoute(context, route, viewportName);
      }
    } finally {
      await context.close();
    }
  }

  const guardContext = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.desktop });
  const page = await guardContext.newPage();
  try {
    for (const route of SEED_ROUTES.filter((item) => item.type !== "public" && item.path)) {
      await gotoWithRetry(page, route.path);
      const pathname = new URL(page.url()).pathname;
      if (pathname !== "/login") {
        report.runNotes.push(`Unauthenticated guard FAIL for ${route.path}: redirected to ${pathname}`);
        recordFunctional(report, route.template, "FAIL", `Unauthenticated request should redirect to /login, got ${pathname}.`);
      }
    }
  } finally {
    await guardContext.close();
  }
}

function blockAuthenticatedCoverage(reason) {
  for (const route of SEED_ROUTES.filter((item) => item.type !== "public")) {
    recordRoute(report, {
      ...routeIdentity(route, route.path),
      viewport: "desktop",
      status: "BLOCKED",
      findings: [{ code: "credential_gate", severity: "warning", detail: reason }],
    });
    recordRoute(report, {
      ...routeIdentity(route, route.path),
      viewport: "mobile",
      status: "BLOCKED",
      findings: [{ code: "credential_gate", severity: "warning", detail: reason }],
    });
    recordFunctional(report, route.template, "BLOCKED", reason);
  }
}

async function authenticate() {
  const context = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.desktop });
  const page = await context.newPage();
  const runtimeErrors = attachErrorCollector(page);
  try {
    await gotoWithRetry(page, "/login");
    await page.locator('input[name="email"]').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/", { timeout: 60_000 }),
      page.getByRole("button", { name: "Entrar", exact: true }).click(),
    ]);
    await page.getByRole("heading", { name: "Painel", exact: true }).waitFor({ timeout: 30_000 });
    if (runtimeErrors.length) {
      report.runNotes.push(`Login emitted ${runtimeErrors.length} browser error(s); authenticated state was still reached.`);
    }
    await context.storageState({ path: authStatePath });
    recordFunctional(report, "/login", "PASS", "Successful ADMIN login and authenticated dashboard reached.");
    return true;
  } catch (error) {
    const evidence = await captureEvidence(page, outputDir, "desktop", "login", "auth-failed").catch(() => null);
    recordRoute(report, {
      template: "/login",
      path: "/login",
      name: "login",
      type: "public",
      viewport: "desktop",
      status: "FAIL",
      evidence,
      findings: [{ code: "authentication_failed", severity: "error", detail: String(error?.message ?? error) }],
    });
    recordFunctional(report, "/login", "FAIL", "Configured E2E credentials did not reach the authenticated dashboard.");
    return false;
  } finally {
    await context.close();
  }
}

async function authenticatedVisualSweep() {
  const staticProtected = SEED_ROUTES.filter((route) => route.type !== "public" && !route.dynamic && route.path);
  for (const [viewportName, viewport] of Object.entries(PRIMARY_VIEWPORTS)) {
    const context = await browser.newContext({ viewport, storageState: authStatePath });
    try {
      for (const route of staticProtected) {
        try {
          await auditRoute(context, route, viewportName);
        } catch (error) {
          report.runNotes.push(`${viewportName} visual sweep failed on ${route.template}: ${String(error?.message ?? error)}`);
        }
      }
    } finally {
      await context.close();
    }
  }
}

async function chooseOptionContaining(select, text) {
  const options = select.locator("option");
  const count = await options.count();
  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    const label = (await option.textContent()) || "";
    if (label.includes(text)) {
      const value = await option.getAttribute("value");
      if (value !== null) {
        await select.selectOption(value);
        return value;
      }
    }
  }
  throw new Error(`Option containing ${text} not found`);
}

async function functionalQaFlow() {
  const context = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.desktop, storageState: authStatePath });
  const page = await context.newPage();
  let editPath = null;
  let productId = null;
  const qaRecord = {
    kind: "product",
    initialName: qaName,
    finalName: qaEditedName,
    internalCode: qaInternalCode,
    id: null,
    cleanup: "pending",
  };
  report.qaData.push(qaRecord);

  try {
    await gotoWithRetry(page, "/products/new");
    await page.locator('input[name="internal_code"]').fill(qaInternalCode);
    await page.locator('input[name="barcode"]').fill(qaBarcode);
    await page.locator('input[name="name"]').fill(qaName);
    await page.locator('select[name="category_id"]').selectOption("");
    await page.locator('input[name="unit"]').fill("UN");
    await page.locator('input[name="minimum_stock"]').fill("1");
    await captureEvidence(page, outputDir, "desktop", "product-new", "qa-filled");

    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/products", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Produto cadastrado." }).waitFor({ timeout: 30_000 });
    await captureEvidence(page, outputDir, "desktop", "products", "qa-created");
    recordFunctional(report, "/products/new", "PASS", `Created isolated QA product ${qaName}.`);

    await gotoWithRetry(page, `/products?q=${encodeURIComponent(qaName)}&status=all`);
    await page.getByRole("heading", { name: qaName, exact: true }).waitFor({ timeout: 30_000 });
    const editLink = page.getByRole("link", { name: "Editar", exact: true }).first();
    editPath = await editLink.getAttribute("href");
    if (!editPath || !/^\/products\/[^/]+\/edit$/.test(editPath)) {
      throw new Error(`Dynamic edit link was not materialized: ${editPath}`);
    }
    productId = editPath.split("/")[2];
    qaRecord.id = productId;

    await gotoWithRetry(page, editPath);
    await page.getByRole("heading", { name: "Editar produto", exact: true }).waitFor();
    if ((await page.locator('input[name="name"]').inputValue()) !== qaName) throw new Error("Persisted QA product name mismatch.");
    if ((await page.locator('input[name="internal_code"]').inputValue()) !== qaInternalCode) throw new Error("Persisted QA internal code mismatch.");
    const inspection = await inspectPage(page, "/products/[id]/edit", "desktop", []);
    const editEvidence = await captureEvidence(page, outputDir, "desktop", "product-edit", "persisted");
    recordRoute(report, {
      template: "/products/[id]/edit",
      path: editPath,
      name: "product-edit",
      type: "administrative",
      viewport: "desktop",
      status: inspection.status,
      evidence: editEvidence,
      findings: inspection.findings,
      url: page.url(),
    });
    addDiscoveredRoutes(report, [editPath]);

    await page.locator('input[name="name"]').fill(qaEditedName);
    await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/products", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Produto atualizado." }).waitFor({ timeout: 30_000 });
    await gotoWithRetry(page, `/products?q=${encodeURIComponent(qaEditedName)}&status=all`);
    await page.getByRole("heading", { name: qaEditedName, exact: true }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/products/[id]/edit", "PASS", "Persisted values loaded, QA product renamed, and updated value persisted.");
    recordFunctional(report, "/products", "PASS", "QA product was located in the list before and after edit.");

    await gotoWithRetry(page, "/inventory");
    await page.getByText(qaEditedName, { exact: true }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/inventory", "PASS", "Active QA product is visible in current inventory.");

    await gotoWithRetry(page, `/movements/new?type=ENTRY&product=${encodeURIComponent(productId)}`);
    const movementProduct = page.locator('select[name="product_id"]');
    if ((await movementProduct.inputValue()) !== productId) await movementProduct.selectOption(productId);
    await page.locator('input[name="quantity"]').fill("1");
    const movementButton = page.getByRole("button", { name: "Confirmar movimentação", exact: true });
    if (await movementButton.isDisabled()) throw new Error("Movement submit remained disabled after valid QA input.");
    recordFunctional(report, "/movements/new", "PASS", "QA product selection, balance preview input and enabled submit state verified without committing stock mutation.");

    await gotoWithRetry(page, "/history");
    for (const selector of ['select[name="product"]', 'select[name="type"]', 'input[name="actor"]', 'input[name="from"]', 'input[name="to"]']) {
      if (!(await page.locator(selector).count())) throw new Error(`History filter missing: ${selector}`);
    }
    recordFunctional(report, "/history", "PASS", "Read-only history filters render and are operable.");

    await gotoWithRetry(page, "/admin/users");
    if (!(await page.locator('select[name="role"]').count()) || !(await page.locator('select[name="active"]').count())) {
      throw new Error("Admin user controls are missing.");
    }
    recordFunctional(report, "/admin/users", "PASS", "ADMIN profile controls render; no user role/status mutation was submitted.");

    await gotoWithRetry(page, "/admin/adjustment");
    const adjustmentProduct = page.locator('select[name="product_id"]');
    await chooseOptionContaining(adjustmentProduct, qaEditedName);
    const adjustmentButton = page.getByRole("button", { name: "Confirmar ajuste", exact: true });
    if (!(await adjustmentButton.isDisabled())) throw new Error("Adjustment submit should start disabled.");
    await page.locator('input[name="quantity"]').fill("0");
    await page.locator('textarea[name="reason"]').fill(`QA E2E smoke ${runId} — validation only, not submitted`);
    if (await adjustmentButton.isDisabled()) throw new Error("Adjustment submit did not enable after valid QA fields.");
    await captureEvidence(page, outputDir, "desktop", "admin-adjustment", "qa-valid-not-submitted");
    recordFunctional(report, "/admin/adjustment", "PASS", "QA product selection and disabled→enabled validation states verified; adjustment was intentionally not submitted.");

    const mobileContext = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.mobile, storageState: authStatePath });
    try {
      const dynamicRoute = SEED_ROUTES.find((route) => route.template === "/products/[id]/edit");
      await auditRoute(mobileContext, dynamicRoute, "mobile", editPath, "persisted");
    } finally {
      await mobileContext.close();
    }

    await gotoWithRetry(page, editPath);
    const inactivateButton = page.getByRole("button", { name: "Inativar produto", exact: true });
    await inactivateButton.click();
    await page.waitForURL((url) => url.pathname === "/products", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Produto inativado." }).waitFor({ timeout: 30_000 });
    await gotoWithRetry(page, `/products?q=${encodeURIComponent(qaEditedName)}&status=inactive`);
    await page.getByRole("heading", { name: qaEditedName, exact: true }).waitFor({ timeout: 30_000 });
    await page.getByText("Inativo", { exact: true }).first().waitFor({ timeout: 30_000 });
    qaRecord.cleanup = "inactivated";
    recordFunctional(report, "/products/[id]/edit", "PASS", "QA product edit/persistence passed and QA product was inactivated at cleanup.");
    return { editPath, productId };
  } catch (error) {
    report.runNotes.push(`Functional QA flow FAIL: ${String(error?.message ?? error)}`);
    const evidence = await captureEvidence(page, outputDir, "desktop", "functional-flow", "failure").catch(() => null);
    recordFunctional(report, "/products/new", "FAIL", `QA flow failed: ${String(error?.message ?? error)}${evidence ? `; evidence=${evidence}` : ""}`);
    qaRecord.cleanup = qaRecord.id ? "unknown_after_failure" : "not_created_or_unknown";
    return { editPath, productId, error };
  } finally {
    await context.close();
  }
}

async function main() {
  try {
    await publicSmoke();

    if (!report.credentials.available) {
      const reason = "GitHub Actions secrets E2E_ADMIN_EMAIL and/or E2E_ADMIN_PASSWORD are unavailable.";
      report.runNotes.push(reason);
      blockAuthenticatedCoverage(reason);
      await writeReports(report, outputDir);
      process.exitCode = 2;
      return;
    }

    const authenticated = await authenticate();
    if (!authenticated) {
      blockAuthenticatedCoverage("Configured E2E credentials could not authenticate as an active ADMIN.");
      await writeReports(report, outputDir);
      process.exitCode = 1;
      return;
    }

    await authenticatedVisualSweep();
    const functional = await functionalQaFlow();
    if (!functional.editPath) {
      recordRoute(report, {
        template: "/products/[id]/edit",
        path: null,
        name: "product-edit",
        type: "administrative",
        viewport: "mobile",
        status: "BLOCKED",
        findings: [{ code: "dynamic_route_not_materialized", severity: "error", detail: "QA product edit path was not available." }],
      });
    }

    await writeReports(report, outputDir);
    const normalStatus = worstStatus([
      report.dimensions.desktop_visual.status,
      report.dimensions.mobile_visual.status,
      report.dimensions.functional_smoke.status,
      report.dimensions.responsive_consistency.status,
    ], "BLOCKED");
    if (normalStatus === "FAIL" || normalStatus === "BLOCKED") process.exitCode = 1;
  } finally {
    await browser.close().catch(() => {});
  }
}

await main();
