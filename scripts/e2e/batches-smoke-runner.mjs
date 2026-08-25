import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PRIMARY_VIEWPORTS, captureEvidence, inspectPage, recordFunctional, recordRoute, worstStatus, writeReports } from "./smoke-lib.mjs";

const DEFAULT_BASE_URL = "https://estoque-mercearia.onrender.com";
const baseURL = (process.env.E2E_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const outputDir = process.env.E2E_OUTPUT_DIR || "e2e-output";
const authStatePath = path.resolve(".e2e-auth-state.json");
const report = JSON.parse(await readFile(path.join(outputDir, "report.json"), "utf8"));
const browser = await chromium.launch({ headless: true });
const routes = [
  { template: "/batches", path: "/batches", name: "batches", heading: "Lotes e validade" },
  { template: "/batches/new", path: "/batches/new", name: "batch-new", heading: "Registrar lote" },
];

try {
  for (const route of routes) {
    let routePass = true;
    for (const [viewportName, viewport] of Object.entries(PRIMARY_VIEWPORTS)) {
      const context = await browser.newContext({ viewport, storageState: authStatePath });
      const page = await context.newPage();
      try {
        const response = await page.goto(`${baseURL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        if (response && response.status() >= 500) throw new Error(`HTTP ${response.status()} for ${route.path}`);
        if (new URL(page.url()).pathname !== route.path) throw new Error(`unexpected redirect to ${page.url()}`);
        await page.getByRole("heading", { name: route.heading, level: 1 }).waitFor({ state: "visible", timeout: 10_000 });
        const inspection = await inspectPage(page, route.path, viewportName, []);
        const evidence = await captureEvidence(page, outputDir, viewportName, route.name, "default", "batches");
        const status = inspection.findings.some((finding) => finding.severity === "error") ? "FAIL" : inspection.findings.some((finding) => finding.severity === "warning") ? "PASS_COM_RESSALVA" : "PASS";
        if (status === "FAIL") routePass = false;
        recordRoute(report, { ...route, type: route.path.endsWith("/new") ? "administrative" : "authenticated", viewport: viewportName, status, evidence, findings: inspection.findings, url: page.url() });
      } catch (error) {
        routePass = false;
        recordRoute(report, { ...route, type: route.path.endsWith("/new") ? "administrative" : "authenticated", viewport: viewportName, status: "FAIL", findings: [{ code: "batches_smoke_failure", severity: "error", detail: String(error?.message ?? error) }], url: page.url() });
      } finally {
        await context.close();
      }
    }
    recordFunctional(report, route.template, routePass ? "PASS" : "FAIL", routePass ? `${route.path} loaded with authenticated QA state.` : `${route.path} failed smoke validation.`);
  }

  await writeReports(report, outputDir);
  const normalStatus = worstStatus([report.dimensions.desktop_visual.status, report.dimensions.mobile_visual.status, report.dimensions.functional_smoke.status, report.dimensions.responsive_consistency.status], "BLOCKED");
  if (normalStatus === "FAIL" || normalStatus === "BLOCKED") process.exitCode = 1;
} finally {
  await browser.close().catch(() => {});
}
