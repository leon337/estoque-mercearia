"use client";

import { useState } from "react";
import { quantityStepForUnit } from "@/modules/inventory/quantity-policy.mjs";

type CategoryOption = { id: string; name: string; active?: boolean };
type ProductFormValues = {
  internal_code?: string;
  barcode?: string | null;
  name?: string;
  category_id?: string | null;
  unit?: string;
  minimum_stock?: number | string;
  cost_price?: number | string;
  sale_price?: number | string;
};

const fieldClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)]";

export function ProductFormFields({ categories, values = {} }: { categories: CategoryOption[]; values?: ProductFormValues }) {
  const [unit, setUnit] = useState(String(values.unit ?? ""));

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">Código interno *<input className={`${fieldClass} font-data`} defaultValue={values.internal_code ?? ""} name="internal_code" required /></label>
      <label className="grid gap-2 text-sm font-medium">Código de barras<input className={`${fieldClass} font-data`} defaultValue={values.barcode ?? ""} inputMode="numeric" name="barcode" /></label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2">Nome *<input className={fieldClass} defaultValue={values.name ?? ""} name="name" required /></label>
      <label className="grid gap-2 text-sm font-medium">Categoria<select className={fieldClass} defaultValue={values.category_id ?? ""} name="category_id"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.active === false ? " (inativa)" : ""}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium">Unidade *<input className={fieldClass} name="unit" onChange={(event) => setUnit(event.target.value)} placeholder="UN, KG, L, CX..." required value={unit} /></label>
      <label className="grid gap-2 text-sm font-medium">Custo atual *<input className={`${fieldClass} font-data`} defaultValue={String(values.cost_price ?? 0)} min="0" name="cost_price" required step="0.0001" type="number" /><span className="text-xs font-normal text-[var(--color-on-surface-variant)]">Até 4 casas decimais.</span></label>
      <label className="grid gap-2 text-sm font-medium">Preço de venda *<input className={`${fieldClass} font-data`} defaultValue={String(values.sale_price ?? 0)} min="0" name="sale_price" required step="0.01" type="number" /><span className="text-xs font-normal text-[var(--color-on-surface-variant)]">Valor em BRL com até 2 casas decimais.</span></label>
      <label className="grid gap-2 text-sm font-medium sm:col-span-2 sm:max-w-xs">Estoque mínimo *<input className={`${fieldClass} font-data`} defaultValue={String(values.minimum_stock ?? 0)} min="0" name="minimum_stock" required step={quantityStepForUnit(unit)} type="number" /><span className="text-xs font-normal text-[var(--color-on-surface-variant)]">UN, CX e PCT usam valores inteiros; demais unidades aceitam até 3 casas decimais.</span></label>
    </div>
  );
}
