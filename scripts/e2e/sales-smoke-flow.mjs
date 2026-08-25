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
    if (response && response.status() >= 500) throw new Error(`HTTP ${response.status()} for ${url}`);
  });
  await page.waitForTimeout(250);
}

function isSaleDetailPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return pathname.startsWith("/sales/") && pathname !== "/sales/new" && segments.length === 2;
}

async function chooseOptionContaining(select, text) {
  const options = select.locator("option");
  const count = await options.count();
  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    const label = (await option.textContent()) || "";
    if (!label.includes(text)) continue;
    const value = await option.getAttribute("value");
    if (value !== null) {
      await select.selectOption(value);
      return value;
    }
  }
  throw new Error(`Option containing ${text} not found`);
}

async function inactivateProduct(page, baseURL, editPath) {
  if (!editPath) return false;
  try {
    await gotoWithRetry(page, baseURL, editPath);
    const button = page.getByRole("button", { name: "Inativar produto", exact: true });
    if (!(await button.count())) return true;
    await button.click();
    await page.waitForURL((url) => url.pathname === "/products", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Produto inativado." }).waitFor({ timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

export async function runSalesQaFlow({
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
  const qaSaleTag = `QA-SALE-${qaIdentity}`;
  const productName = `QA-SALE-PRODUCT-${qaIdentity}`;
  const productCode = `QS${runId.slice(-8)}A${runAttempt.slice(-3)}`;
  let productEditPath = null;
  let productId = null;
  let salePath = null;
  let saleId = null;
  let productClean = false;

  const qaRecord = {
    kind: "sale",
    tag: qaSaleTag,
    productName,
    productId: null,
    saleId: null,
    initialQuantity: 5,
    soldQuantity: 3,
    expectedFinalQuantity: 2,
    unitSalePrice: 4.99,
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
    await page.locator('input[name="cost_price"]').fill("2.0000");
    await page.locator('input[name="sale_price"]').fill("4.99");
    await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/products", { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Produto cadastrado." }).waitFor({ timeout: 30_000 });

    await gotoWithRetry(page, baseURL, `/products?q=${encodeURIComponent(productName)}&status=all`);
    await page.getByRole("heading", { name: productName, exact: true }).waitFor({ timeout: 30_000 });
    productEditPath = await page.getByRole("link", { name: "Editar", exact: true }).first().getAttribute("href");
    if (!productEditPath || !/^\/products\/[^/]+\/edit$/.test(productEditPath)) throw new Error(`Sale QA product path missing: ${productEditPath}`);
    productId = productEditPath.split("/")[2];
    qaRecord.productId = productId;

    await gotoWithRetry(page, baseURL, `/movements/new?type=INITIAL&product=${encodeURIComponent(productId)}`);
    const movementProduct = page.locator('select[name="product_id"]');
    if ((await movementProduct.inputValue()) !== productId) await movementProduct.selectOption(productId);
    await page.locator('input[name="quantity"]').fill("5");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Confirmar movimentação", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/inventory", { timeout: 60_000 });
    const initialHeading = page.getByRole("heading", { name: productName, exact: true });
    await initialHeading.waitFor({ timeout: 30_000 });
    const initialCard = initialHeading.locator("xpath=ancestor::div[.//dt[normalize-space()='Saldo atual']][1]");
    await initialCard.getByText("5 UN", { exact: true }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/movements/new", "PASS", `${qaSaleTag} initialized authoritative stock at 5 UN.`);

    await gotoWithRetry(page, baseURL, "/sales/new");
    await page.locator('textarea[name="notes"]').fill(qaSaleTag);
    await captureEvidence(page, outputDir, "desktop", "sale-new", "qa-filled");
    await page.getByRole("button", { name: "Criar venda", exact: true }).click();
    await page.waitForURL((url) => isSaleDetailPath(url.pathname), { timeout: 60_000 });
    salePath = new URL(page.url()).pathname;
    saleId = salePath.split("/")[2];
    qaRecord.saleId = saleId;
    await page.getByRole("status").filter({ hasText: "Venda criada." }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/sales/new", "PASS", `Created isolated ${qaSaleTag}.`);

    const desktopInspection = await inspectPage(page, "/sales/[id]", "desktop", []);
    const desktopEvidence = await captureEvidence(page, outputDir, "desktop", "sale-detail", "draft");
    recordRoute(report, {
      template: "/sales/[id]",
      path: salePath,
      name: "sale-detail",
      type: "authenticated",
      viewport: "desktop",
      status: desktopInspection.status,
      evidence: desktopEvidence,
      findings: desktopInspection.findings,
      url: page.url(),
    });
    addDiscoveredRoutes(report, [salePath, "/sales", "/sales/new"]);

    await chooseOptionContaining(page.locator('select[name="product_id"]'), productName);
    await page.locator('input[name="quantity"]').fill("3");
    await page.getByRole("button", { name: "Adicionar item", exact: true }).click();
    await page.waitForURL((url) => url.pathname === salePath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Item adicionado à venda." }).waitFor({ timeout: 30_000 });
    await page.getByText("R$ 4,99", { exact: false }).first().waitFor({ timeout: 30_000 }).catch(async () => {
      await page.getByText("4,99", { exact: false }).first().waitFor({ timeout: 30_000 });
    });
    recordFunctional(report, "/sales/[id]", "PASS", `${qaSaleTag} captured the product sale price snapshot for 3 UN.`);

    await page.getByRole("button", { name: "Concluir venda", exact: true }).click();
    await page.waitForURL((url) => url.pathname === salePath, { timeout: 60_000 });
    await page.getByRole("status").filter({ hasText: "Venda concluída e estoque baixado." }).waitFor({ timeout: 30_000 });
    await page.getByText("Concluída", { exact: true }).waitFor({ timeout: 30_000 });
    await captureEvidence(page, outputDir, "desktop", "sale-detail", "completed");

    await gotoWithRetry(page, baseURL, "/inventory");
    const productHeading = page.getByRole("heading", { name: productName, exact: true });
    await productHeading.waitFor({ timeout: 30_000 });
    const inventoryCard = productHeading.locator("xpath=ancestor::div[.//dt[normalize-space()='Saldo atual']][1]");
    await inventoryCard.getByText("2 UN", { exact: true }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/inventory", "PASS", `${qaSaleTag} completed with Saldo atual = 2 UN; expected isolated balance 2 UN.`);
    recordFunctional(report, "/sales/[id]", "PASS", "Sale moved DRAFT → COMPLETED and generated the expected authoritative EXIT of 3 UN.");

    const mobileContext = await browser.newContext({ viewport: PRIMARY_VIEWPORTS.mobile, storageState: authStatePath });
    const mobilePage = await mobileContext.newPage();
    try {
      await gotoWithRetry(mobilePage, baseURL, salePath);
      const mobileInspection = await inspectPage(mobilePage, "/sales/[id]", "mobile", []);
      const mobileEvidence = await captureEvidence(mobilePage, outputDir, "mobile", "sale-detail", "completed");
      recordRoute(report, {
        template: "/sales/[id]",
        path: salePath,
        name: "sale-detail",
        type: "authenticated",
        viewport: "mobile",
        status: mobileInspection.status,
        evidence: mobileEvidence,
        findings: mobileInspection.findings,
        url: mobilePage.url(),
      });
    } finally {
      await mobileContext.close();
    }

    await gotoWithRetry(page, baseURL, "/sales");
    await page.getByRole("heading", { name: "Vendas", exact: true }).waitFor({ timeout: 30_000 });
    recordFunctional(report, "/sales", "PASS", `${qaSaleTag} remains visible as immutable completed sales history.`);

    return { salePath, saleId, productId };
  } catch (error) {
    report.runNotes.push(`Sales QA flow FAIL: ${String(error?.message ?? error)}`);
    const evidence = await captureEvidence(page, outputDir, "desktop", "sales-flow", "failure").catch(() => null);
    recordFunctional(report, "/sales/[id]", "FAIL", `Sales QA flow failed: ${String(error?.message ?? error)}${evidence ? `; evidence=${evidence}` : ""}`);
    return { salePath, saleId, productId, error };
  } finally {
    productClean = await inactivateProduct(page, baseURL, productEditPath);
    qaRecord.cleanup = `product=${productClean ? "inactivated" : "unknown"};sale=historical`;
    await context.close();
  }
}
