type SupplierValues = {
  name?: string | null;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

const controlClass =
  "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

export function SupplierFormFields({ values = {} }: { values?: SupplierValues }) {
  return (
    <div className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium">
        Nome do fornecedor
        <input className={controlClass} defaultValue={values.name ?? ""} maxLength={160} name="name" required />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Documento
          <input className={controlClass} defaultValue={values.tax_id ?? ""} maxLength={40} name="tax_id" placeholder="CNPJ, CPF ou identificação" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Telefone
          <input className={controlClass} defaultValue={values.phone ?? ""} maxLength={40} name="phone" type="tel" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        E-mail
        <input className={controlClass} defaultValue={values.email ?? ""} maxLength={254} name="email" type="email" />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Observações
        <textarea className={`${controlClass} min-h-28`} defaultValue={values.notes ?? ""} maxLength={2000} name="notes" />
      </label>
    </div>
  );
}
