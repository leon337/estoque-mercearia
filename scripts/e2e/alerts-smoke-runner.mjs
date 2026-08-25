import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PRIMARY_VIEWPORTS,
  captureEvidence,
  inspectPage,
  recordFunctional,
  recordRoute,
  worstStatus,
  writeReports,
} from "./smoke-lib.mjs";

const DEFAULT_BASE_URL = "https://estoque-mercearia.onrender.com";
const baseURL = (process.env.E2E_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const outputDir = process.env.E2E_OUTPUT_DIR || "e2e-output";
const authStatePath = path.resolve(".e2e-auth-state.json");
const report = JSON.parse(await readFile(path.join(outputDir, "report.json"), "utf8"));
const browser = await chromium.launch({ headless: true });

try {
  let functionalPass = true;
  for (const [viewportName, viewport] of Object.entries(PRIMARY_VIEWPORTS)) {
    const context = await browser.newContext({ viewport, storageState: authStatePath });
    const page = await context.newPage();
    const findings = [];
    try {
      const response = await page.goto(`${baseURL}/alerts`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      if (response && response.status() >= 500) throw new Error(`HTTP ${response.status()} for /alerts`);
      if (new URL(page.url()).pathname !== "/alerts") throw new Error(`unexpected redirect to ${page.url()}`);
      await page.getByRole("heading", { name: "Alertas operacionais", level: 1 }).waitFor({ state: "visible", timeout: 10_000 });
      const inspection = await inspectPage(page, "/alerts", viewportName, []);
      findings.push(...inspection.findings);
      const evidence = await captureEvidence(page, outputDir, viewportName, "alerts", "default", "alerts");
      const status = findings.some((finding) => finding.severity === "error") ? "FAIL" : findings.some((finding) => finding.severity === "warning") ? "PASS_COM_RESSALVA" : "PASS";
      if (status === "FAIL") functionalPass = false;
      recordRoute(report, { template: "/alerts", path: "/alerts", name: "alerts", type: "authenticated", viewport: viewportName, status, evidence, findings, url: page.url() });
    } catch (error) {
      functionalPass = false;
      findings.push({ code: "alerts_smoke_failure", severity: "error", detail: String(error?.message ?? error) });
      recordRoute(report, { template: "/alerts", path: "/alerts", name: "alerts", type: "authenticated", viewport: viewportName, status: "FAIL", findings, url: page.url() });
    } finally {
      await context.close();
    }
  }

  recordFunctional(report, "/alerts", functionalPass ? "PASS" : "FAIL", functionalPass ? "Authenticated alerts center loaded and rendered." : "Alerts center failed smoke validation.");
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
