"use client";

import { useMemo, useState } from "react";
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
        <p className="rounded-md border p-3 text-sm" role="alert">{errorMessage}</p>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor="movement-type">Tipo de movimentação</label>
        <select
          className="w-full rounded-md border px-3 py-3"
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
          className="w-full rounded-md border px-3 py-3"
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
          className="w-full rounded-md border px-3 py-3 text-lg"
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

      <section className="rounded-lg border p-4" aria-live="polite">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-neutral-600">Saldo atual</dt>
            <dd className="text-xl font-bold">{currentQuantity} {unit}</dd>
          </div>
          <div>
            <dt className="text-sm text-neutral-600">Saldo após</dt>
            <dd className="text-xl font-bold">{projectedQuantity} {unit}</dd>
          </div>
        </dl>
        {insufficient ? (
          <p className="mt-3 text-sm font-semibold" role="alert">Estoque insuficiente para esta saída.</p>
        ) : null}
        {type === "INITIAL" ? (
          <p className="mt-3 text-sm text-neutral-600">Use somente para a primeira contagem do produto. O banco rejeita um segundo inventário inicial.</p>
        ) : null}
      </section>

      <button
        className="w-full rounded-md bg-black px-4 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!operationId || !product || !validQuantity || insufficient}
        type="submit"
      >
        Confirmar movimentação
      </button>
    </form>
  );
}