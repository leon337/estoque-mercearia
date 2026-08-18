create or replace function private.enforce_product_minimum_stock_precision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.quantity_matches_unit_precision(new.unit, new.minimum_stock) then
    raise exception using errcode = 'P0001', message = 'INVALID_MINIMUM_STOCK_PRECISION';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_product_minimum_stock_precision() from public;

create trigger products_minimum_stock_precision
before insert or update of unit, minimum_stock on public.products
for each row execute function private.enforce_product_minimum_stock_precision();

comment on function private.enforce_product_minimum_stock_precision() is
  'Impede estoque mínimo com precisão incompatível com a unidade do produto.';
