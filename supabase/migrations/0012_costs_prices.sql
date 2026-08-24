alter table public.products
  add column cost_price numeric(14, 4) not null default 0 check (cost_price >= 0),
  add column sale_price numeric(14, 2) not null default 0 check (sale_price >= 0);

alter table public.purchase_order_items
  add column unit_cost numeric(14, 4) not null default 0 check (unit_cost >= 0);

grant insert (cost_price, sale_price) on public.products to authenticated;
grant update (cost_price, sale_price) on public.products to authenticated;
grant insert (unit_cost) on public.purchase_order_items to authenticated;
grant update (unit_cost) on public.purchase_order_items to authenticated;

create or replace function private.purchase_item_unit_cost_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.purchase_order_status;
begin
  if new.unit_cost is not distinct from old.unit_cost then
    return new;
  end if;

  select po.status into v_status
  from public.purchase_orders po
  where po.id = new.purchase_order_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_FOUND';
  end if;

  if v_status <> 'DRAFT'::public.purchase_order_status then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_DRAFT';
  end if;

  return new;
end;
$$;

revoke all on function private.purchase_item_unit_cost_guard() from public;
revoke all on function private.purchase_item_unit_cost_guard() from anon;
revoke all on function private.purchase_item_unit_cost_guard() from authenticated;
revoke all on function private.purchase_item_unit_cost_guard() from service_role;

create trigger purchase_order_items_unit_cost_guard
before update of unit_cost on public.purchase_order_items
for each row execute function private.purchase_item_unit_cost_guard();

create or replace function private.purchase_receipt_items_update_cost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_unit_cost numeric(14, 4);
begin
  select poi.product_id, poi.unit_cost
  into v_product_id, v_unit_cost
  from public.purchase_order_items poi
  where poi.id = new.purchase_order_item_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_ITEM_NOT_FOUND';
  end if;

  update public.products
  set cost_price = v_unit_cost,
      updated_at = timezone('utc', now())
  where id = v_product_id;

  return new;
end;
$$;

revoke all on function private.purchase_receipt_items_update_cost() from public;
revoke all on function private.purchase_receipt_items_update_cost() from anon;
revoke all on function private.purchase_receipt_items_update_cost() from authenticated;
revoke all on function private.purchase_receipt_items_update_cost() from service_role;

create trigger purchase_receipt_items_update_cost
after insert on public.purchase_receipt_items
for each row execute function private.purchase_receipt_items_update_cost();
