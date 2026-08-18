"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { registerAdjustmentAction } from "./actions";

type ProductOption = {
  id: string;
  internalCode: string;
  name: string;
  unit: string;
  currentQuantity: number;
};

const controlClass =
  "mt-1 min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2 font-normal text-[var(--color-on-surface)] focus:border-[var(--color-primary)]";

export function AdjustmentForm({
  products,
  initialOperationId,
}: {
  products: ProductOption[];
  initialOperationId: string;
}) {
  const [operationId, setOperationId] = useState(initialOperationId);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [text, setText] = useState("");
  const [reason, setReason] = useState("");

  const product = useMemo(
    () => products.find((candidate) => candidate.id === productId) ?? products[0],
    [productId, products],
  );
  const quantity = Number(text);
  const valid = Number.isFinite(quantity) && quantity >= 0 && reason.trim().length > 0;
  const current = product?.currentQuantity ?? 0;
  const difference = valid ? quantity - current : 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (!valid || !product || !operationId) {
      event.preventDefault();
      return;
    }

    if (!window.confirm(`Confirmar ajuste? Saldo atual ${current}; contagem ${quantity}; diferença ${difference}.`)) {
      event.preventDefault();
    }
  }

  return (
    <form action={registerAdjustmentAction} className="mt-6 space-y-5" onSubmit={submit}>
      <input type="hidden" name="operation_id" value={operationId} />

      <DataCard>
        <div className="grid gap-5">
          <label className="block text-sm font-semibold">
            Produto
            <select
              className={controlClass}
              name="product_id"
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value);
                setOperationId(crypto.randomUUID());
              }}
            >
              {products.map((option) => (
                <option key={option.id} value={option.id}>{option.internalCode} · {option.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Contagem física
            <input
              className={`${controlClass} font-data`}
              type="number"
              step="any"
              min="0"
              name="quantity"
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-semibold">
            Motivo
            <textarea
              className="mt-1 min-h-24 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-3 text-[var(--color-on-surface)] focus:border-[var(--color-primary)]"
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>
        </div>
      </DataCard>

      <div aria-live="polite">
        <DataCard>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-[var(--color-on-surface-variant)]">Saldo atual</dt>
              <dd className="font-data mt-1 text-xl font-bold">{current} {product?.unit}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-on-surface-variant)]">Diferença</dt>
              <dd className="font-data mt-1 text-xl font-bold">{valid ? difference : "—"} {product?.unit}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">
            O ajuste registra a diferença entre o saldo atual e a contagem física informada.
          </p>
        </DataCard>
      </div>

      <Button className="w-full" disabled={!valid || !product || !operationId} type="submit">
        Confirmar ajuste
      </Button>
    </form>
  );
}
