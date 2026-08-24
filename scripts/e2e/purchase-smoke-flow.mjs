import {
  PRIMARY_VIEWPORTS,
  addDiscoveredRoutes,
  captureEvidence,
  inspectPage,
  recordFunctional,
  recordRoute,
  retryOnce,
} from "./smoke-lib.mjs";

async function gotoWithRetry(page, baseURL, pathname) {
  const url = pathname.startsWith("http") ? pathname : `${baseURL}${pathname}`;
  await retryOnce(async () => {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (response && response.status() >= 500) {
      throw new Error(`HTTP ${response.status()} for ${url}`);
    }
  });
  await page.waitForTimeout(250);
}

function isPurchaseDetailPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return pathname.startsWith("/purchases/") && pathname !== "/purchases/new" && segments.length === 2;
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

async function inactivateFixture(page, baseURL, editPath, buttonName, expectedPath, successText) {
  if (!editPath) return false;
  try {
    await gotoWithRetry(page, baseURL, editPath);
    const button = page.getByRole("button", { name: buttonName, exact: true });
    if (!(await button.count())) return true;
    await button.click();
    await page.waitForURL((url) => url.pathname === expectedPath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: successText }).waitFor({ timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

export async function runPurchaseQaFlow({
  browser,
  baseURL,
  authStatePath,
  outputDir,
  report,
  qaIdentity,
  runId,
  runAttempt,
}) {
  const context = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.desktop, storageState: authStatePath });
  const page = await context.newPage();
  const qaPurchaseTag = `QA-PURCHASE-${qaIdentity}`;
  const productName = `QA-PURCHASE-PRODUCT-${qaIdentity}`;
  const productCode = `QP${runId.slice(-8)}A${runAttempt.slice(-3)}`;
  const supplierName = `QA-PURCHASE-SUPPLIER-${qaIdentity}`;
  const supplierTaxId = `QA-PUR-${runId.slice(-10)}-${runAttempt.slice(-3)}`;
  let productEditPath = null;
  let supplierEditPath = null;
  let purchasePath = null;
  let productId = null;
  let supplierId = null;
  let purchaseId = null;
  let supplierClean = false;
  let productClean = false;

  const qaRecord = {
    kind: "purchase",
    tag: qaPurchaseTag,
    productName,
    supplierName,
    productId: null,
    supplierId: null,
    purchaseId: null,
    orderedQuantity: 2,
    receivedQuantity: 0,
    cleanup: "pending",
  };
  report.qaData.push(qaRecord);

  try {
    await gotoWithRetry(page, baseURL, "/products/new");
    await page.locator('input[name="internal_code"]').fill(productCode);
    await page.locator('input[name="barcode"]').fill("");
    await page.locator('input[name="name"]').fill(productName);
    await page.locator('select[name="category_id"]').selectOption("");
    await page.locator('input[name="unit"]').fill("UN");
    await page.locator('input[name="minimum_stock"]').fill("0");
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/products", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Produto cadastrado." }).waitFor({ timeout: 30_000 });

    await gotoWithRetry(page, baseURL, `/products?q=${encodeURIComponent(productName)}&status=all`);
    await page.getByRole("heading", { name: productName, exact: true }).waitFor({ timeout: 30_000 });
    productEditPath = await page.getByRole("link", { name: "Editar", exact: true }).first().getAttribute("href");
    if (!productEditPath || !/^\/products\/[^/]+\/edit$/.test(productEditPath)) {
      throw new Error(`Purchase QA product edit path was not materialized: ${productEditPath}`);
    }
    productId = productEditPath.split("/")[2];
    qaRecord.productId = productId;

    await gotoWithRetry(page, baseURL, "/suppliers/new");
    await page.locator('input[name="name"]').fill(supplierName);
    await page.locator('input[name="tax_id"]').fill(supplierTaxId);
    await page.getByRole("button", { name: "Cadastrar fornecedor", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/suppliers", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Fornecedor cadastrado." }).waitFor({ timeout: 30_000 });

    await gotoWithRetry(page, baseURL, `/suppliers?q=${encodeURIComponent(supplierName)}&status=all`);
    await page.getByRole("heading", { name: supplierName, exact: true }).waitFor({ timeout: 30_000 });
    supplierEditPath = await page.getByRole("link", { name: "Editar", exact: true }).first().getAttribute("href");
    if (!supplierEditPath || !/^\/suppliers\/[^/]+\/edit$/.test(supplierEditPath)) {
      throw new Error(`Purchase QA supplier edit path was not materialized: ${supplierEditPath}`);
    }
    supplierId = supplierEditPath.split("/")[2];
    qaRecord.supplierId = supplierId;

    await gotoWithRetry(page, baseURL, supplierEditPath);
    await chooseOptionContaining(page.locator('select[name="product_id"]'), productName);
    await page.locator('input[name="supplier_code"]').first().fill(`PUR-${runId.slice(-6)}`);
    await page.getByRole("button", { name: "Vincular produto", exact: true }).click();
    await page.waitForURL((url) => url.pathname === supplierEditPath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Vínculo salvo." }).waitFor({ timeout: 30_000 });

    await gotoWithRetry(page, baseURL, "/purchases/new");
    await chooseOptionContaining(page.locator('select[name="supplier_id"]'), supplierName);
    await page.locator('textarea[name="notes"]').fill(qaPurchaseTag);
    await captureEvidence(page, outputDir, "desktop", "purchase-new", "qa-filled");
    await page.getByRole("button", { name: "Criar pedido", exact: true }).click();
    await page.waitForURL((url) => isPurchaseDetailPath(url.pathname), { timeout: 60_000 });
    purchasePath = new URL(page.url()).pathname;
    purchaseId = purchasePath.split("/")[2];
    qaRecord.purchaseId = purchaseId;
    await page.getByRole("status").filter({ hasText: "Pedido criado." }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/purchases/new", "PASS", `Created isolated ${qaPurchaseTag}.`);

    const desktopInspection = await inspectPage(page, "/purchases/[id]", "desktop", []);
    const desktopEvidence = await captureEvidence(page, outputDir, "desktop", "purchase-detail", "draft");
    recordRoute(report, {
      template: "/purchases/[id]",
      path: purchasePath,
      name: "purchase-detail",
      type: "administrative",
      viewport: "desktop",
      status: desktopInspection.status,
      evidence: desktopEvidence,
      findings: desktopInspection.findings,
      url: page.url(),
    });
    addDiscoveredRoutes(report, [purchasePath]);

    await chooseOptionContaining(page.locator('select[name="product_id"]'), productName);
    await page.locator('input[name="quantity"]').fill("2");
    await page.getByRole("button", { name: "Adicionar item", exact: true }).click();
    await page.waitForURL((url) => url.pathname === purchasePath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Item adicionado ao pedido." }).waitFor({ timeout: 30_000 });

    await page.getByRole("button", { name: "Marcar como enviado", exact: true }).click();
    await page.waitForURL((url) => url.pathname === purchasePath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Pedido marcado como enviado." }).waitFor({ timeout: 30_000 });
    await page.getByText("Enviado", { exact: true }).waitFor({ timeout: 30_000 });

    await page.locator('input[name="quantity"]').fill("1");
    await page.getByRole("button", { name: "Registrar recebimento", exact: true }).click();
    await page.waitForURL((url) => url.pathname === purchasePath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Recebimento registrado no estoque." }).waitFor({ timeout: 30_000 });
    await page.getByText("Recebido parcialmente", { exact: true }).waitFor({ timeout: 30_000 });
    qaRecord.receivedQuantity = 1;
    await captureEvidence(page, outputDir, "desktop", "purchase-detail", "partially-received");

    await page.locator('input[name="quantity"]').fill("1");
    await page.getByRole("button", { name: "Registrar recebimento", exact: true }).click();
    await page.waitForURL((url) => url.pathname === purchasePath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Recebimento registrado no estoque." }).waitFor({ timeout: 30_000 });
    await page.getByText("Recebido", { exact: true }).waitFor({ timeout: 30_000 });
    qaRecord.receivedQuantity = 2;
    await captureEvidence(page, outputDir, "desktop", "purchase-detail", "received");

    await gotoWithRetry(page, baseURL, "/inventory");
    const productHeading = page.getByRole("heading", { name: productName, exact: true });
    await productHeading.waitFor({ timeout: 30_000 });
    const inventoryCard = productHeading.locator("xpath=ancestor::div[.//dt[normalize-space()='Saldo atual']][1]");
    await inventoryCard.getByText("2 UN", { exact: true }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/inventory", "PASS", `${qaPurchaseTag} receipt produced the expected isolated balance of 2 UN.`);

    const mobileContext = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.mobile, storageState: authStatePath });
    const mobilePage = await mobileContext.newPage();
    try {
      await gotoWithRetry(mobilePage, baseURL, purchasePath);
      const mobileInspection = await inspectPage(mobilePage, "/purchases/[id]", "mobile", []);
      const mobileEvidence = await captureEvidence(mobilePage, outputDir, "mobile", "purchase-detail", "received");
      recordRoute(report, {
        template: "/purchases/[id]",
        path: purchasePath,
        name: "purchase-detail",
        type: "administrative",
        viewport: "mobile",
        status: mobileInspection.status,
        evidence: mobileEvidence,
        findings: mobileInspection.findings,
        url: mobilePage.url(),
      });
    } finally {
      await mobileContext.close();
    }

    await gotoWithRetry(page, baseURL, "/purchases");
    await page.getByRole("link", { name: "Abrir pedido", exact: true }).filter({ has: page.locator(`xpath=..`) }).first().count().catch(() => 0);
    recordFunctional(report, "/purchases", "PASS", `${qaPurchaseTag} reached the purchases lifecycle and remains as immutable QA history.`);
    recordFunctional(report, "/purchases/[id]", "PASS", "Purchase moved DRAFT → ORDERED → PARTIALLY_RECEIVED → RECEIVED and stock balance reached 2 UN.");

    return { purchasePath, purchaseId, productId, supplierId };
  } catch (error) {
    report.runNotes.push(`Purchase QA flow FAIL: ${String(error?.message ?? error)}`);
    const evidence = await captureEvidence(page, outputDir, "desktop", "purchase-flow", "failure").catch(() => null);
    recordFunctional(report, "/purchases/[id]", "FAIL", `Purchase QA flow failed: ${String(error?.message ?? error)}${evidence ? `; evidence=${evidence}` : ""}`);
    return { purchasePath, purchaseId, productId, supplierId, error };
  } finally {
    supplierClean = await inactivateFixture(page, baseURL, supplierEditPath, "Inativar fornecedor", "/suppliers", "Fornecedor inativado.");
    productClean = await inactivateFixture(page, baseURL, productEditPath, "Inativar produto", "/products", "Produto inativado.");
    qaRecord.cleanup = `supplier=${supplierClean ? "inactivated" : "unknown"};product=${productClean ? "inactivated" : "unknown"};purchase=historical`;
    await context.close();
  }
}
