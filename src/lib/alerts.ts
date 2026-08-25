export type AlertSeverity = "CRITICAL" | "WARNING";

export type InventoryAlertInput = {
  id: string;
  internalCode: string;
  name: string;
  unit: string;
  quantity: number;
  minimumStock: number;
};

export type InventoryAlert = InventoryAlertInput & {
  severity: AlertSeverity;
};

export function deriveInventoryAlert(input: InventoryAlertInput): InventoryAlert | null {
  const { quantity, minimumStock } = input;
  if (quantity <= 0) return { ...input, severity: "CRITICAL" };
  if (quantity > 0 && quantity <= minimumStock) return { ...input, severity: "WARNING" };
  return null;
}

export function buildInventoryAlerts(inputs: InventoryAlertInput[]): InventoryAlert[] {
  const rank: Record<AlertSeverity, number> = { CRITICAL: 0, WARNING: 1 };
  return inputs
    .map(deriveInventoryAlert)
    .filter((alert): alert is InventoryAlert => Boolean(alert))
    .sort((left, right) => rank[left.severity] - rank[right.severity] || left.name.localeCompare(right.name, "pt-BR"));
}
