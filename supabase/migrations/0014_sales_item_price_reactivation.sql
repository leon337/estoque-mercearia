create or replace function private.validate_sale_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.sale_status;
  v_unit text;
  v_product_active boolean;
  v_sale_price numeric(14, 2);
  v_structural_change boolean := true;
begin
  select s.status into v_status
  from public.sales s
  where s.id = new.sale_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'SALE_NOT_FOUND';
  end if;

  if v_status <> 'DRAFT'::public.sale_status then
    raise exception using errcode = 'P0001', message = 'SALE_NOT_DRAFT';
  end if;

  if tg_op = 'UPDATE' then
    v_structural_change := new.sale_id is distinct from old.sale_id
      or new.product_id is distinct from old.product_id
      or new.quantity is distinct from old.quantity
      or new.active is distinct from old.active;
  end if;

  if v_structural_change then
    select p.unit, p.active, p.sale_price
    into v_unit, v_product_active, v_sale_price
    from public.products p
    where p.id = new.product_id;

    if not found or not v_product_active then
      raise exception using errcode = 'P0001', message = 'PRODUCT_INACTIVE_OR_MISSING';
    end if;

    if new.quantity is null or new.quantity <= 0 then
      raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY';
    end if;

    if not private.quantity_matches_unit_precision(v_unit, new.quantity) then
      raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY_PRECISION';
    end if;

    if tg_op = 'INSERT' then
      new.unit_sale_price := v_sale_price;
    elsif tg_op = 'UPDATE'
      and (
        new.product_id is distinct from old.product_id
        or (old.active = false and new.active = true)
      ) then
      new.unit_sale_price := v_sale_price;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_sale_item() from public;
revoke all on function private.validate_sale_item() from anon;
revoke all on function private.validate_sale_item() from authenticated;
revoke all on function private.validate_sale_item() from service_role;
