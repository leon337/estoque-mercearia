import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const STATUSES = ["PASS", "PASS_COM_RESSALVA", "FAIL", "BLOCKED"];

export const PRIMARY_VIEWPORTS = Object.freeze({
  desktop: Object.freeze({ width: 1440, height: 900 }),
  mobile: Object.freeze({ width: 375, height: 812 }),
});

export const RC_VIEWPORTS = Object.freeze({
  narrow_mobile: Object.freeze({ width: 320, height: 568 }),
  intermediate: Object.freeze({ width: 1024, height: 768 }),
});

export const SEED_ROUTES = Object.freeze([
  { template: "/login", path: "/login", name: "login", type: "public" },
  { template: "/register", path: "/register", name: "register", type: "public" },
  { template: "/", path: "/", name: "dashboard", type: "authenticated" },
  { template: "/products", path: "/products", name: "products", type: "authenticated" },
  { template: "/products/new", path: "/products/new", name: "product-new", type: "administrative" },
  { template: "/products/[id]/edit", path: null, name: "product-edit", type: "administrative", dynamic: true },
  { template: "/suppliers", path: "/suppliers", name: "suppliers", type: "authenticated" },
  { template: "/suppliers/new", path: "/suppliers/new", name: "supplier-new", type: "administrative" },
  { template: "/suppliers/[id]/edit", path: null, name: "supplier-edit", type: "administrative", dynamic: true },
  { template: "/inventory", path: "/inventory", name: "inventory", type: "authenticated" },
  { template: "/movements/new", path: "/movements/new", name: "movement-new", type: "authenticated" },
  { template: "/history", path: "/history", name: "history", type: "authenticated" },
  { template: "/admin/users", path: "/admin/users", name: "admin-users", type: "administrative" },
  { template: "/admin/adjustment", path: "/admin/adjustment", name: "admin-adjustment", type: "administrative" },
]);

const STATUS_RANK = Object.freeze({
  PASS: 0,
  PASS_COM_RESSALVA: 1,
  BLOCKED: 2,
  FAIL: 3,
});

export function worstStatus(statuses, fallback = "PASS") {
  const values = statuses.filter(Boolean);
  if (!values.length) return fallback;
  return values.slice(1).reduce((worst, current) =>
    (STATUS_RANK[current] ?? -1) > (STATUS_RANK[worst] ?? -1) ? current : worst,
  values[0]);
}

export function createReport(baseURL) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseURL,
    credentials: { available: false },
    routes: [],
    discoveredRoutes: [],
    qaData: [],
    runNotes: [],
    criticalReview: {
      status: "BLOCKED",
      executed: false,
      findings: [],
      evidence: [],
    },
    dimensions: {
      desktop_visual: { status: "BLOCKED" },
      mobile_visual: { status: "BLOCKED" },
      functional_smoke: { status: "BLOCKED" },
      responsive_consistency: { status: "BLOCKED" },
      critical_review: { status: "BLOCKED" },
      overall: { status: "BLOCKED" },
    },
  };
}

export function routeSlug(value) {
  if (!value || value === "/") return "dashboard";
  return value
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/\?.*$/, "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\[|\]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase() || "dashboard";
}

export function seedRouteRecord(route) {
  return {
    template: route.template,
    path: route.path,
    name: route.name,
    type: route.type,
    dynamic: Boolean(route.dynamic),
    desktop: null,
    mobile: null,
    functional: null,
    rc: [],
    overall: "BLOCKED",
  };
}

function ensureRoute(report, input) {
  const template = input.template ?? input.path;
  let route = report.routes.find((candidate) => candidate.template === template);
  if (!route) {
    route = seedRouteRecord({
      template,
      path: input.path ?? template,
      name: input.name ?? routeSlug(template),
      type: input.type ?? "discovered",
      dynamic: input.dynamic,
    });
    report.routes.push(route);
  }
  if (input.path) route.path = input.path;
  if (input.name) route.name = input.name;
  if (input.type) route.type = input.type;
  return route;
}

export function recordRoute(report, input) {
  const route = ensureRoute(report, input);
  if (input.viewport) {
    route[input.viewport] = {
      status: input.status,
      evidence: input.evidence ? [input.evidence] : [],
      findings: input.findings ?? [],
      url: input.url ?? null,
    };
  }
  if (input.functionalStatus) {
    route.functional = {
      status: input.functionalStatus,
      note: input.functionalNote ?? "",
    };
  }
  route.overall = worstStatus([
    route.desktop?.status,
    route.mobile?.status,
    route.functional?.status,
    ...route.rc.map((entry) => entry.status),
  ], "BLOCKED");
  return route;
}

export function recordFunctional(report, template, status, note = "") {
  return recordRoute(report, {
    template,
    functionalStatus: status,
    functionalNote: note,
  });
}

export function recordCriticalRoute(report, template, entry) {
  const route = ensureRoute(report, { template, path: entry.path });
  route.rc.push(entry);
  route.overall = worstStatus([
    route.desktop?.status,
    route.mobile?.status,
    route.functional?.status,
    ...route.rc.map((item) => item.status),
  ], "BLOCKED");
  return route;
}

export function statusFromFindings(findings) {
  if (findings.some((finding) => finding.severity === "error")) return "FAIL";
  if (findings.some((finding) => finding.severity === "warning")) return "PASS_COM_RESSALVA";
  return "PASS";
}

export function attachErrorCollector(page) {
  const errors = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) errors.length = 0;
  });
  page.on("pageerror", (error) => {
    errors.push({ type: "pageerror", text: String(error?.message ?? error) });
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push({ type: "console", text: message.text() });
    }
  });
  return errors;
}

export async function inspectPage(page, route, viewportName, runtimeErrors = []) {
  const geometry = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const maxScrollY = Math.max(0, doc.scrollHeight - innerHeight);

    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };

    const labelFor = (element) => {
      const text = (element.getAttribute("aria-label") || element.textContent || element.getAttribute("name") || element.tagName).trim();
      return text.replace(/\s+/g, " ").slice(0, 120);
    };

    const escaped = [];
    for (const element of document.querySelectorAll("button, a, input:not([type='hidden']), select, textarea, [role='button']")) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -2 || rect.right > innerWidth + 2) {
        escaped.push({
          tag: element.tagName.toLowerCase(),
          label: labelFor(element),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    }

    const targetSelector = "button:not([disabled]), input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), nav a, [role='button'], a[class*='min-h-12']";
    const smallTargets = [];
    for (const element of document.querySelectorAll(targetSelector)) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 46 || rect.height < 46) {
        smallTargets.push({
          tag: element.tagName.toLowerCase(),
          label: labelFor(element),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }

    const clippedText = [];
    for (const element of document.querySelectorAll("h1, h2, h3, label")) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -2 || rect.right > innerWidth + 2) {
        clippedText.push({
          tag: element.tagName.toLowerCase(),
          label: labelFor(element),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        });
      }
    }

    const fixedBottom = [...document.querySelectorAll("nav, [role='navigation']")]
      .filter(visible)
      .map((element) => ({ element, style: getComputedStyle(element), rect: element.getBoundingClientRect() }))
      .filter(({ style, rect }) => style.position === "fixed" && Math.abs(rect.bottom - innerHeight) <= 3)
      .map(({ rect }) => ({ top: rect.top, height: rect.height }));

    let bottomOverlap = null;
    if (fixedBottom.length) {
      const navTop = Math.min(...fixedBottom.map((item) => item.top));
      const candidates = [...document.querySelectorAll("main button, main a, main input, main select, main textarea")]
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { label: labelFor(element), documentBottom: rect.bottom + window.scrollY };
        });
      const last = candidates.sort((a, b) => b.documentBottom - a.documentBottom)[0];
      if (last) {
        const bottomAtMaxScroll = last.documentBottom - maxScrollY;
        if (bottomAtMaxScroll > navTop + 2) {
          bottomOverlap = {
            label: last.label,
            bottomAtMaxScroll: Math.round(bottomAtMaxScroll),
            navTop: Math.round(navTop),
          };
        }
      }
    }

    return {
      scrollWidth,
      innerWidth,
      innerHeight,
      horizontalOverflow: scrollWidth > innerWidth + 2,
      escaped,
      smallTargets,
      clippedText,
      bottomOverlap,
    };
  });

  const findings = [];
  if (geometry.horizontalOverflow) {
    findings.push({
      code: "horizontal_overflow",
      severity: "error",
      route,
      viewport: viewportName,
      detail: `document scrollWidth ${geometry.scrollWidth} exceeds innerWidth ${geometry.innerWidth}`,
    });
  }
  if (geometry.escaped.length) {
    findings.push({
      code: "horizontal_escape",
      severity: "error",
      route,
      viewport: viewportName,
      detail: geometry.escaped,
    });
  }
  if (geometry.clippedText.length) {
    findings.push({
      code: "clipped_heading_or_label",
      severity: "error",
      route,
      viewport: viewportName,
      detail: geometry.clippedText,
    });
  }
  if (geometry.smallTargets.length) {
    findings.push({
      code: "small_touch_target",
      severity: "warning",
      route,
      viewport: viewportName,
      detail: geometry.smallTargets,
    });
  }
  if (geometry.bottomOverlap) {
    findings.push({
      code: "bottom_navigation_overlap",
      severity: "error",
      route,
      viewport: viewportName,
      detail: geometry.bottomOverlap,
    });
  }
  for (const error of runtimeErrors) {
    findings.push({
      code: error.type,
      severity: "error",
      route,
      viewport: viewportName,
      detail: error.text,
    });
  }

  return { geometry, findings, status: statusFromFindings(findings) };
}

export async function captureEvidence(page, outputDir, viewportName, routeName, state = "default", subdir = "screenshots") {
  const directory = path.join(outputDir, subdir);
  await mkdir(directory, { recursive: true });
  const filename = `${viewportName}__${routeSlug(routeName)}__${routeSlug(state)}.png`;
  const absolutePath = path.join(directory, filename);
  await page.screenshot({ path: absolutePath, fullPage: true });
  return path.relative(outputDir, absolutePath).split(path.sep).join("/");
}

export async function collectSameOriginLinks(page, baseURL) {
  const origin = new URL(baseURL).origin;
  const hrefs = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
  return [...new Set(hrefs.flatMap((href) => {
    try {
      const url = new URL(href);
      if (url.origin !== origin) return [];
      return [`${url.pathname}${url.search}`];
    } catch {
      return [];
    }
  }))].sort();
}

export function addDiscoveredRoutes(report, paths) {
  for (const discovered of paths) {
    if (!report.discoveredRoutes.includes(discovered)) report.discoveredRoutes.push(discovered);
  }
  report.discoveredRoutes.sort();
}

function aggregateViewport(report, viewport) {
  const statuses = report.routes
    .map((route) => route[viewport]?.status)
    .filter(Boolean);
  return worstStatus(statuses, "BLOCKED");
}

function aggregateFunctional(report) {
  const statuses = report.routes.map((route) => route.functional?.status).filter(Boolean);
  return worstStatus(statuses, "BLOCKED");
}

function aggregateResponsive(report) {
  const routeStatuses = report.routes.flatMap((route) => [
    route.desktop?.status,
    route.mobile?.status,
    ...route.rc.map((entry) => entry.status),
  ]).filter(Boolean);
  return worstStatus(routeStatuses, "BLOCKED");
}

export function finalizeReport(report) {
  for (const route of report.routes) {
    route.overall = worstStatus([
      route.desktop?.status,
      route.mobile?.status,
      route.functional?.status,
      ...route.rc.map((entry) => entry.status),
    ], "BLOCKED");
  }

  report.dimensions.desktop_visual.status = aggregateViewport(report, "desktop");
  report.dimensions.mobile_visual.status = aggregateViewport(report, "mobile");
  report.dimensions.functional_smoke.status = aggregateFunctional(report);
  report.dimensions.responsive_consistency.status = aggregateResponsive(report);
  report.dimensions.critical_review.status = report.criticalReview.status;
  report.dimensions.overall.status = worstStatus([
    report.dimensions.desktop_visual.status,
    report.dimensions.mobile_visual.status,
    report.dimensions.functional_smoke.status,
    report.dimensions.responsive_consistency.status,
    report.dimensions.critical_review.status,
  ], "BLOCKED");
  return report;
}

function markdownCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export async function writeReports(report, outputDir) {
  finalizeReport(report);
  await mkdir(outputDir, { recursive: true });

  const inventory = report.routes.map((route) => ({
    route: route.template,
    concretePath: route.path,
    name: route.name,
    type: route.type,
    desktop: route.desktop?.status ?? "BLOCKED",
    mobile: route.mobile?.status ?? "BLOCKED",
    functional: route.functional?.status ?? "BLOCKED",
    evidence: [
      ...(route.desktop?.evidence ?? []),
      ...(route.mobile?.evidence ?? []),
      ...route.rc.flatMap((entry) => entry.evidence ?? []),
    ],
    result: route.overall,
  }));

  await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(outputDir, "route-inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  const rows = inventory.map((item) =>
    `| \`${markdownCell(item.route)}\` | ${item.desktop} | ${item.mobile} | ${item.functional} | ${markdownCell(item.evidence.join(", "))} | ${item.result} |`,
  );
  const dimensions = Object.entries(report.dimensions)
    .map(([name, value]) => `- \`${name}\`: **${value.status}**`)
    .join("\n");
  const qa = report.qaData.length
    ? report.qaData.map((item) => `- ${markdownCell(JSON.stringify(item))}`).join("\n")
    : "- nenhum dado QA persistido";

  const markdown = `# PHASE-09 — Autonomous Production Smoke Report\n\nGenerated: ${report.generatedAt}\n\nBase URL: ${report.baseURL}\n\nCredentials available: ${report.credentials.available ? "yes" : "no"}\n\n## Route matrix\n\n| Rota | Desktop | Mobile | Funcional | Evidência | Resultado |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n\n## Dimensions\n\n${dimensions}\n\n## QA data\n\n${qa}\n\n## Notes\n\n${report.runNotes.map((note) => `- ${markdownCell(note)}`).join("\n") || "- none"}\n`;
  await writeFile(path.join(outputDir, "report.md"), markdown, "utf8");
  return report;
}

export async function retryWithBackoff(
  operation,
  {
    maxAttempts = 8,
    delays = [0, 2_000, 4_000, 8_000, 12_000, 16_000, 20_000, 25_000],
    sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  } = {},
) {
  let firstError = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0 || (delays[attempt] ?? 0) > 0) {
      await sleep(delays[Math.min(attempt - 1, delays.length - 1)] ?? 0);
    }
    try {
      return await operation(attempt + 1);
    } catch (error) {
      firstError ??= error;
      const retryable = error?.retryable === true || /HTTP (429|502|503|504)\b/.test(String(error?.message ?? error));
      if (!retryable || attempt === maxAttempts - 1) {
        if (error && typeof error === "object") error.cause = error.cause ?? firstError;
        throw error;
      }
    }
  }
  throw firstError ?? new Error("Retry operation exhausted without a result.");
}

export async function retryOnce(operation) {
  return retryWithBackoff(operation);
}
