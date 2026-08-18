import { chromium } from "@playwright/test";
import { access, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  RC_VIEWPORTS,
  addDiscoveredRoutes,
  attachErrorCollector,
  captureEvidence,
  collectSameOriginLinks,
  inspectPage,
  recordCriticalRoute,
  worstStatus,
  writeReports,
} from "./smoke-lib.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const baseURL = argument("--base-url", process.env.E2E_BASE_URL || "https://estoque-mercearia.onrender.com").replace(/\/$/, "");
const outputDir = argument("--output-dir", process.env.E2E_OUTPUT_DIR || "e2e-output");
const storageStatePath = path.resolve(argument("--storage-state", ".e2e-auth-state.json"));
const routesPath = argument("--routes-json", path.join(outputDir, "route-inventory.json"));
const reportPath = path.join(outputDir, "report.json");

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function revisitRoute(report, browser, viewportName, viewport, route, hasStorage) {
  const protectedRoute = route.type !== "public";
  if (protectedRoute && !hasStorage) {
    recordCriticalRoute(report, route.route, {
      viewport: viewportName,
      path: route.concretePath,
      status: "BLOCKED",
      evidence: [],
      findings: [{
        code: "credential_gate",
        severity: "warning",
        detail: "Independent authenticated RC could not run without E2E storage state.",
      }],
    });
    return;
  }

  if (!route.concretePath) {
    recordCriticalRoute(report, route.route, {
      viewport: viewportName,
      path: null,
      status: "BLOCKED",
      evidence: [],
      findings: [{
        code: "dynamic_route_missing",
        severity: "error",
        detail: "No concrete path was available for independent RC.",
      }],
    });
    return;
  }

  const context = await browser.newContext({
    viewport,
    ...(protectedRoute ? { storageState: storageStatePath } : {}),
  });
  const page = await context.newPage();
  const runtimeErrors = attachErrorCollector(page);

  try {
    const target = `${baseURL}${route.concretePath}`;
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 60_000 });
        if (response && response.status() >= 500) throw new Error(`HTTP ${response.status()} for ${target}`);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 0) await page.waitForTimeout(750);
      }
    }
    if (lastError) throw lastError;
    await page.waitForTimeout(300);

    const pathname = new URL(page.url()).pathname;
    const expectedPathname = new URL(target).pathname;
    const findings = [];
    if (pathname !== expectedPathname) {
      findings.push({
        code: "unexpected_redirect",
        severity: "error",
        detail: `expected ${expectedPathname}, got ${pathname}`,
      });
    }

    const inspection = await inspectPage(page, route.route, viewportName, runtimeErrors);
    findings.push(...inspection.findings);
    const evidence = await captureEvidence(
      page,
      outputDir,
      viewportName,
      route.route,
      "critical-review",
      "critical-review",
    );
    addDiscoveredRoutes(report, await collectSameOriginLinks(page, baseURL));
    const status = findings.some((item) => item.severity === "error")
      ? "FAIL"
      : findings.some((item) => item.severity === "warning")
        ? "PASS_COM_RESSALVA"
        : "PASS";

    recordCriticalRoute(report, route.route, {
      viewport: viewportName,
      path: route.concretePath,
      status,
      evidence: [evidence],
      findings,
      url: page.url(),
    });
    report.criticalReview.evidence.push(evidence);
    report.criticalReview.findings.push(...findings.map((finding) => ({
      ...finding,
      route: route.route,
      viewport: viewportName,
    })));
  } catch (error) {
    const evidence = await captureEvidence(
      page,
      outputDir,
      viewportName,
      route.route,
      "critical-review-failure",
      "critical-review",
    ).catch(() => null);
    const finding = {
      code: "critical_review_navigation_failure",
      severity: "error",
      detail: String(error?.message ?? error),
      route: route.route,
      viewport: viewportName,
    };
    recordCriticalRoute(report, route.route, {
      viewport: viewportName,
      path: route.concretePath,
      status: "FAIL",
      evidence: evidence ? [evidence] : [],
      findings: [finding],
      url: page.url(),
    });
    if (evidence) report.criticalReview.evidence.push(evidence);
    report.criticalReview.findings.push(finding);
  } finally {
    await context.close();
  }
}

async function main() {
  const report = await loadJson(reportPath);
  const routes = await loadJson(routesPath);
  const hasStorage = await exists(storageStatePath);
  report.criticalReview.executed = true;
  report.criticalReview.findings = [];
  report.criticalReview.evidence = [];

  const statuses = [];
  for (const [viewportName, viewport] of Object.entries(RC_VIEWPORTS)) {
    // Fresh Chromium process per breakpoint keeps RC independent from the normal smoke and from the other RC width.
    const freshBrowser = await chromium.launch({ headless: true });
    try {
      for (const route of routes) {
        await revisitRoute(report, freshBrowser, viewportName, viewport, route, hasStorage);
      }
    } finally {
      await freshBrowser.close();
    }
  }

  for (const route of report.routes) {
    statuses.push(...route.rc.map((entry) => entry.status));
  }
  report.criticalReview.status = worstStatus(statuses, hasStorage ? "PASS" : "BLOCKED");
  if (!hasStorage) {
    report.runNotes.push("Critical review public routes ran, but authenticated/admin RC is BLOCKED because storage-state is unavailable.");
  }

  await writeReports(report, outputDir);
  if (report.criticalReview.status === "FAIL") process.exitCode = 1;
  else if (report.criticalReview.status === "BLOCKED") process.exitCode = 2;

  await unlink(storageStatePath).catch(() => {});
}

await main();
