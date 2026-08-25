import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runSalesQaFlow } from "./sales-smoke-flow.mjs";
import { recordRoute, worstStatus, writeReports } from "./smoke-lib.mjs";

const DEFAULT_BASE_URL = "https://estoque-mercearia.onrender.com";
const baseURL = (process.env.E2E_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const outputDir = process.env.E2E_OUTPUT_DIR || "e2e-output";
const authStatePath = path.resolve(".e2e-auth-state.json");
const runId = String(process.env.GITHUB_RUN_ID || Date.now());
const runAttempt = String(process.env.GITHUB_RUN_ATTEMPT || "1");
const qaIdentity = `${runId}-${runAttempt}`;
const report = JSON.parse(await readFile(path.join(outputDir, "report.json"), "utf8"));
const browser = await chromium.launch({ headless: true });

try {
  const sale = await runSalesQaFlow({
    browser,
    baseURL,
    authStatePath,
    outputDir,
    report,
    qaIdentity,
    runId,
    runAttempt,
  });

  if (!sale.salePath) {
    recordRoute(report, {
      template: "/sales/[id]",
      path: null,
      name: "sale-detail",
      type: "authenticated",
      viewport: "mobile",
      status: "BLOCKED",
      findings: [{
        code: "dynamic_route_not_materialized",
        severity: "error",
        detail: "QA sale detail path was not available.",
      }],
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
