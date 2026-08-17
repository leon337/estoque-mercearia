import type { SupabaseClient } from "@supabase/supabase-js";

export type StockMovementType = "INITIAL" | "ENTRY" | "EXIT" | "ADJUSTMENT";

export type RegisterStockMovementInput = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  operationId: string;
  reason?: string | null;
};

export async function registerStockMovement(
  supabase: SupabaseClient,
  input: RegisterStockMovementInput,
) {
  const reason = input.reason?.trim() || null;

  const { data, error } = await supabase.rpc("register_stock_movement", {
    p_product_id: input.productId,
    p_type: input.type,
    p_quantity: input.quantity,
    p_operation_id: input.operationId,
    p_reason: reason,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error("MOVEMENT_RESULT_MISSING");
  }

  return row;
}
