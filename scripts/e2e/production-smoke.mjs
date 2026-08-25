import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const QA_PURCHASE_MARKER = "QA-PURCHASE-";
const QA_SALE_MARKER = "QA-SALE-";

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, script)], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`${script} exited with ${code ?? signal ?? "unknown"}`));
    });
  });
}

async function purchaseQaFlow() {
  void QA_PURCHASE_MARKER;
  await run("scripts/e2e/purchase-smoke-runner.mjs");
}

async function salesQaFlow() {
  void QA_SALE_MARKER;
  await run("scripts/e2e/sales-smoke-runner.mjs");
}

async function alertsQaFlow() {
  await run("scripts/e2e/alerts-smoke-runner.mjs");
}

await run("scripts/e2e/production-smoke-core.mjs");
await purchaseQaFlow();
await salesQaFlow();
await alertsQaFlow();
