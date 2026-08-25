export type BatchExpiryStatus = "EXPIRED" | "EXPIRING" | "OK" | "NO_EXPIRY";

export function batchExpiryStatus(expiresOn: string | null, today = new Date()): BatchExpiryStatus {
  if (!expiresOn) return "NO_EXPIRY";
  const todayKey = today.toISOString().slice(0, 10);
  if (expiresOn < todayKey) return "EXPIRED";
  const limit = new Date(`${todayKey}T00:00:00.000Z`);
  limit.setUTCDate(limit.getUTCDate() + 30);
  const limitKey = limit.toISOString().slice(0, 10);
  if (expiresOn <= limitKey) return "EXPIRING";
  return "OK";
}

export function batchStatusLabel(status: BatchExpiryStatus) {
  if (status === "EXPIRED") return "VENCIDO";
  if (status === "EXPIRING") return "VENCE EM ATÉ 30 DIAS";
  if (status === "NO_EXPIRY") return "SEM VALIDADE";
  return "OK";
}
