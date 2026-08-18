const WHOLE_UNITS = new Set(["UN", "CX", "PCT"]);
const DEFAULT_DECIMAL_SCALE = 3;

export function normalizeQuantityUnit(unit) {
  return String(unit ?? "").trim().toUpperCase();
}

export function quantityScaleForUnit(unit) {
  return WHOLE_UNITS.has(normalizeQuantityUnit(unit)) ? 0 : DEFAULT_DECIMAL_SCALE;
}

export function quantityStepForUnit(unit) {
  return quantityScaleForUnit(unit) === 0 ? "1" : "0.001";
}

export function isQuantityTextValidForUnit(rawValue, unit) {
  const normalized = String(rawValue ?? "").trim().replace(",", ".");
  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalized);

  if (!match) return false;

  const fraction = match[2] ?? "";
  const scale = quantityScaleForUnit(unit);

  if (scale === 0) {
    return fraction.length === 0 || /^0+$/.test(fraction);
  }

  return fraction.length <= scale;
}

export function formatQuantityPtBr(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: quantityScaleForUnit(unit),
  }).format(numericValue);
}
