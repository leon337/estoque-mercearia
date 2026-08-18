create or replace function private.quantity_scale_for_unit(p_unit text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case upper(btrim(coalesce(p_unit, '')))
    when 'UN' then 0
    when 'CX' then 0
    when 'PCT' then 0
    else 3
  end;
$$;

revoke all on function private.quantity_scale_for_unit(text) from public;

create or replace function private.quantity_matches_unit_precision(
  p_unit text,
  p_quantity numeric
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_quantity is not null
    and p_quantity = round(p_quantity, private.quantity_scale_for_unit(p_unit));
$$;

revoke all on function private.quantity_matches_unit_precision(text, numeric) from public;

create or replace function private.enforce_inventory_quantity_precision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unit text;
begin
  select p.unit
  into v_unit
  from public.products p
  where p.id = new.product_id;

  if found and not private.quantity_matches_unit_precision(v_unit, new.quantity) then
    raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY_PRECISION';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_inventory_quantity_precision() from public;

create trigger inventory_quantity_precision
before insert or update on public.inventory
for each row execute function private.enforce_inventory_quantity_precision();

create or replace function private.enforce_stock_movement_quantity_precision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unit text;
begin
  select p.unit
  into v_unit
  from public.products p
  where p.id = new.product_id;

  if found and (
    not private.quantity_matches_unit_precision(v_unit, new.quantity_delta)
    or not private.quantity_matches_unit_precision(v_unit, new.previous_quantity)
    or not private.quantity_matches_unit_precision(v_unit, new.resulting_quantity)
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY_PRECISION';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_stock_movement_quantity_precision() from public;

create trigger stock_movement_quantity_precision
before insert on public.stock_movements
for each row execute function private.enforce_stock_movement_quantity_precision();

comment on function private.quantity_scale_for_unit(text) is
  'Escala de quantidade por unidade: UN/CX/PCT inteiros; demais unidades até 3 casas decimais.';
comment on function private.quantity_matches_unit_precision(text, numeric) is
  'Valida a precisão numérica permitida para a unidade sem alterar o valor informado.';
