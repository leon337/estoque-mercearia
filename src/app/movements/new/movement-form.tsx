"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { registerMovementAction } from "../actions";

type MovementType = "ENTRY" | "EXIT" | "INITIAL";

type ProductOption = {
  id: string;
  internalCode: string;
  name: string;
  unit: string;
  currentQuantity: number;
};

type MovementFormProps = {
  products: ProductOption[];
  isAdmin: boolean;
  initialType: MovementType;
  initialOperationId: string;
  initialProductId?: string;
  errorMessage?: string | null;
};

const controlClass =
  "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)] focus:border-[var(--color-primary)]";

export function MovementForm({
  products,
  isAdmin,
  initialType,
  initialOperationId,
  initialProductId,
  errorMessage,
}: MovementFormProps) {
  const [operationId, setOperationId] = useState(initialOperationId);
  const [type, setType] = useState<MovementType>(
    initialType === "INITIAL" && !isAdmin ? "ENTRY" : initialType,
  );
  const [productId, setProductId] = useState(
    initialProductId && products.some((product) => product.id === initialProductId)
      ? initialProductId
      : products[0]?.id ?? "",
  );
  const [quantityText, setQuantityText] = useState(type === "INITIAL" ? "0" : "");

  const product = useMemo(
    () => products.find((candidate) => candidate.id === productId) ?? products[0],
    [productId, products],
  );
  const quantity = Number(quantityText);
  const validQuantity = Number.isFinite(quantity) && quantity >= 0 && (type === "INITIAL" || quantity > 0);
  const currentQuantity = product?.currentQuantity ?? 0;
  const projectedQuantity = !validQuantity
    ? currentQuantity
    : type === "INITIAL"
      ? quantity
      : type === "ENTRY"
        ? currentQuantity + quantity
        : currentQuantity - quantity;
  const insufficient = type === "EXIT" && validQuantity && quantity > currentQuantity;
  const unit = product?.unit ?? "";

  function handleTypeChange(nextType: MovementType) {
    setType(nextType);
    setQuantityText(nextType === "INITIAL" ? "0" : "");
    setOperationId(crypto.randomUUID());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (insufficient || !validQuantity || !operationId || !product) {
      event.preventDefault();
      return;
    }

    const label = type === "ENTRY" ? "entrada" : type === "EXIT" ? "saída" : "inventário inicial";
    const accepted = window.confirm(
      `Confirmar ${label} de ${quantity} ${unit} para ${product.name}? Saldo após: ${projectedQuantity} ${unit}.`,
    );

    if (!accepted) {
      event.preventDefault();
    }
  }

  const typeOptions: MovementType[] = isAdmin
    ? ["ENTRY", "EXIT", "INITIAL"]
    : ["ENTRY", "EXIT"];

  return (
    <form action={registerMovementAction} className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <input name="operation_id" type="hidden" value={operationId} />

      {errorMessage ? (
        <p
          className="rounded-lg border border-[var(--color-error)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <DataCard>
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="movement-type">Tipo de movimentação</label>
            <select
              className={controlClass}
              id="movement-type"
              name="type"
              onChange={(event) => handleTypeChange(event.target.value as MovementType)}
              value={type}
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ENTRY" ? "Entrada" : option === "EXIT" ? "Saída" : "Inventário inicial"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="product">Produto</label>
            <select
              className={controlClass}
              id="product"
              name="product_id"
              onChange={(event) => {
                setProductId(event.target.value);
                setOperationId(crypto.randomUUID());
              }}
              value={productId}
            >
              {products.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.internalCode} · {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="quantity">
              {type === "INITIAL" ? "Contagem inicial" : "Quantidade"}
            </label>
            <input
              className={`${controlClass} font-data text-lg`}
              id="quantity"
              inputMode="decimal"
              min={type === "INITIAL" ? 0 : 0.000001}
              name="quantity"
              onChange={(event) => setQuantityText(event.target.value)}
              required
              step="any"
              type="number"
              value={quantityText}
            />
          </div>
        </div>
      </DataCard>

      <div aria-live="polite">
        <DataCard>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-[var(--color-on-surface-variant)]">Saldo atual</dt>
              <dd className="font-data mt-1 text-xl font-bold">{currentQuantity} {unit}</dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-on-surface-variant)]">Saldo após</dt>
              <dd className="font-data mt-1 text-xl font-bold">{projectedQuantity} {unit}</dd>
            </div>
          </dl>
          {insufficient ? (
            <p className="mt-3 text-sm font-semibold text-[var(--color-error)]" role="alert">
              Estoque insuficiente para esta saída.
            </p>
          ) : null}
          {type === "INITIAL" ? (
            <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">
              Use somente para a primeira contagem do produto. O banco rejeita um segundo inventário inicial.
            </p>
          ) : null}
        </DataCard>
      </div>

      <Button
        className="w-full"
        disabled={!operationId || !product || !validQuantity || insufficient}
        type="submit"
      >
        Confirmar movimentação
      </Button>
    </form>
  );
}
