create type public.purchase_order_status as enum (
  'DRAFT',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED'
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  status public.purchase_order_status not null default 'DRAFT',
  notes text null check (notes is null or length(notes) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  ordered_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index purchase_orders_supplier_created_idx
on public.purchase_orders (supplier_id, created_at desc);

create index purchase_orders_status_created_idx
on public.purchase_orders (status, created_at desc);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  ordered_quantity numeric not null check (ordered_quantity > 0),
  received_quantity numeric not null default 0 check (received_quantity >= 0 and received_quantity <= ordered_quantity),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (purchase_order_id, product_id)
);

create index purchase_order_items_order_idx on public.purchase_order_items (purchase_order_id);
create index purchase_order_items_product_idx on public.purchase_order_items (product_id);

create table public.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  operation_id uuid not null unique,
  request_payload jsonb not null,
  performed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index purchase_receipts_order_created_idx
on public.purchase_receipts (purchase_order_id, created_at desc);

create table public.purchase_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.purchase_receipts(id) on delete restrict,
  purchase_order_item_id uuid not null references public.purchase_order_items(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  stock_movement_id uuid not null unique references public.stock_movements(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (receipt_id, purchase_order_item_id)
);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_receipts enable row level security;
alter table public.purchase_receipt_items enable row level security;

revoke all on public.purchase_orders from anon;
revoke all on public.purchase_order_items from anon;
revoke all on public.purchase_receipts from anon;
revoke all on public.purchase_receipt_items from anon;

revoke all on public.purchase_orders from authenticated;
revoke all on public.purchase_order_items from authenticated;
revoke all on public.purchase_receipts from authenticated;
revoke all on public.purchase_receipt_items from authenticated;

grant select on public.purchase_orders to authenticated;
grant select on public.purchase_order_items to authenticated;
grant select on public.purchase_receipts to authenticated;
grant select on public.purchase_receipt_items to authenticated;
grant insert (supplier_id, notes) on public.purchase_orders to authenticated;
grant update (notes) on public.purchase_orders to authenticated;
grant insert (purchase_order_id, product_id, ordered_quantity, active) on public.purchase_order_items to authenticated;
grant update (ordered_quantity, active) on public.purchase_order_items to authenticated;

create policy "purchase_orders_active_select"
on public.purchase_orders
for select
to authenticated
using ((select private.is_active_user()));

create policy "purchase_orders_admin_insert"
on public.purchase_orders
for insert
to authenticated
with check ((select private.is_admin()));

create policy "purchase_orders_admin_update"
on public.purchase_orders
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "purchase_order_items_active_select"
on public.purchase_order_items
for select
to authenticated
using ((select private.is_active_user()));

create policy "purchase_order_items_admin_insert"
on public.purchase_order_items
for insert
to authenticated
with check ((select private.is_admin()));

create policy "purchase_order_items_admin_update"
on public.purchase_order_items
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "purchase_receipts_active_select"
on public.purchase_receipts
for select
to authenticated
using ((select private.is_active_user()));

create policy "purchase_receipt_items_active_select"
on public.purchase_receipt_items
for select
to authenticated
using ((select private.is_active_user()));

create or replace function private.purchase_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function private.purchase_touch_updated_at() from public;

create trigger purchase_orders_touch_updated_at
before update on public.purchase_orders
for each row execute function private.purchase_touch_updated_at();

create trigger purchase_order_items_touch_updated_at
before update on public.purchase_order_items
for each row execute function private.purchase_touch_updated_at();

create or replace function private.purchase_order_set_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;
  new.created_by := (select auth.uid());
  return new;
end;
$$;

revoke all on function private.purchase_order_set_actor() from public;

create trigger purchase_orders_set_actor
before insert on public.purchase_orders
for each row execute function private.purchase_order_set_actor();

create or replace function private.validate_purchase_order_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_supplier_id uuid;
  v_status public.purchase_order_status;
  v_unit text;
  v_product_active boolean;
  v_supplier_active boolean;
  v_structural_change boolean := true;
begin
  if tg_op = 'UPDATE' then
    v_structural_change := new.purchase_order_id is distinct from old.purchase_order_id
      or new.product_id is distinct from old.product_id
      or new.ordered_quantity is distinct from old.ordered_quantity
      or new.active is distinct from old.active;
  end if;

  if v_structural_change then
    select po.supplier_id, po.status
    into v_supplier_id, v_status
    from public.purchase_orders po
    where po.id = new.purchase_order_id;

    if not found then
      raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_FOUND';
    end if;
    if v_status <> 'DRAFT'::public.purchase_order_status then
      raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_DRAFT';
    end if;

    select s.active into v_supplier_active
    from public.suppliers s where s.id = v_supplier_id;
    if not coalesce(v_supplier_active, false) then
      raise exception using errcode = 'P0001', message = 'SUPPLIER_INACTIVE';
    end if;

    select p.unit, p.active
    into v_unit, v_product_active
    from public.products p
    where p.id = new.product_id;
    if not found or not v_product_active then
      raise exception using errcode = 'P0001', message = 'PRODUCT_INACTIVE_OR_MISSING';
    end if;

    if not exists (
      select 1
      from public.product_suppliers ps
      where ps.supplier_id = v_supplier_id
        and ps.product_id = new.product_id
        and ps.active = true
    ) then
      raise exception using errcode = 'P0001', message = 'PRODUCT_NOT_LINKED_TO_SUPPLIER';
    end if;

    if not private.quantity_matches_unit_precision(v_unit, new.ordered_quantity) then
      raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY_PRECISION';
    end if;
  end if;

  if new.received_quantity < 0 or new.received_quantity > new.ordered_quantity then
    raise exception using errcode = 'P0001', message = 'INVALID_RECEIVED_QUANTITY';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_purchase_order_item() from public;

create trigger purchase_order_items_validate
before insert or update on public.purchase_order_items
for each row execute function private.validate_purchase_order_item();

create or replace function private.assert_purchase_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role public.app_role;
  v_active boolean;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;
  select p.role, p.active into v_role, v_active
  from public.profiles p where p.id = v_user_id;
  if not found or not v_active then
    raise exception using errcode = 'P0001', message = 'USER_INACTIVE_OR_MISSING';
  end if;
  if v_role <> 'ADMIN'::public.app_role then
    raise exception using errcode = 'P0001', message = 'ADMIN_REQUIRED';
  end if;
  return v_user_id;
end;
$$;

revoke all on function private.assert_purchase_admin() from public;
revoke all on function private.assert_purchase_admin() from anon;
revoke all on function private.assert_purchase_admin() from service_role;
grant execute on function private.assert_purchase_admin() to authenticated;

create or replace function private.mark_purchase_order_ordered(p_order_id uuid)
returns table (id uuid, status public.purchase_order_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.purchase_orders%rowtype;
begin
  perform private.assert_purchase_admin();

  select po.* into v_order
  from public.purchase_orders po
  where po.id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'DRAFT'::public.purchase_order_status then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_DRAFT';
  end if;
  if not exists (
    select 1 from public.purchase_order_items poi
    where poi.purchase_order_id = p_order_id and poi.active = true
  ) then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_EMPTY';
  end if;
  if not exists (
    select 1 from public.suppliers s
    where s.id = v_order.supplier_id and s.active = true
  ) then
    raise exception using errcode = 'P0001', message = 'SUPPLIER_INACTIVE';
  end if;

  update public.purchase_orders po
  set status = 'ORDERED'::public.purchase_order_status,
      ordered_at = timezone('utc', now()),
      cancelled_at = null
  where po.id = p_order_id;

  return query select p_order_id, 'ORDERED'::public.purchase_order_status;
end;
$$;

create or replace function private.cancel_purchase_order(p_order_id uuid)
returns table (id uuid, status public.purchase_order_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.purchase_order_status;
begin
  perform private.assert_purchase_admin();

  select po.status into v_status
  from public.purchase_orders po
  where po.id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_FOUND';
  end if;
  if v_status not in ('DRAFT'::public.purchase_order_status, 'ORDERED'::public.purchase_order_status) then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_CANNOT_CANCEL';
  end if;
  if exists (select 1 from public.purchase_receipts pr where pr.purchase_order_id = p_order_id) then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_HAS_RECEIPTS';
  end if;

  update public.purchase_orders po
  set status = 'CANCELLED'::public.purchase_order_status,
      cancelled_at = timezone('utc', now())
  where po.id = p_order_id;

  return query select p_order_id, 'CANCELLED'::public.purchase_order_status;
end;
$$;

revoke all on function private.mark_purchase_order_ordered(uuid) from public;
revoke all on function private.cancel_purchase_order(uuid) from public;
revoke all on function private.mark_purchase_order_ordered(uuid) from anon;
revoke all on function private.cancel_purchase_order(uuid) from anon;
revoke all on function private.mark_purchase_order_ordered(uuid) from service_role;
revoke all on function private.cancel_purchase_order(uuid) from service_role;
grant execute on function private.mark_purchase_order_ordered(uuid) to authenticated;
grant execute on function private.cancel_purchase_order(uuid) to authenticated;

create function public.mark_purchase_order_ordered(p_order_id uuid)
returns table (id uuid, status public.purchase_order_status)
language sql
security invoker
set search_path = ''
as $$
  select * from private.mark_purchase_order_ordered(p_order_id);
$$;

create function public.cancel_purchase_order(p_order_id uuid)
returns table (id uuid, status public.purchase_order_status)
language sql
security invoker
set search_path = ''
as $$
  select * from private.cancel_purchase_order(p_order_id);
$$;

revoke all on function public.mark_purchase_order_ordered(uuid) from public;
revoke all on function public.cancel_purchase_order(uuid) from public;
revoke all on function public.mark_purchase_order_ordered(uuid) from anon;
revoke all on function public.cancel_purchase_order(uuid) from anon;
revoke all on function public.mark_purchase_order_ordered(uuid) from service_role;
revoke all on function public.cancel_purchase_order(uuid) from service_role;
grant execute on function public.mark_purchase_order_ordered(uuid) to authenticated;
grant execute on function public.cancel_purchase_order(uuid) to authenticated;

create or replace function private.receive_purchase_order(
  p_order_id uuid,
  p_operation_id uuid,
  p_items jsonb
)
returns table (
  receipt_id uuid,
  order_status public.purchase_order_status,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_order public.purchase_orders%rowtype;
  v_existing public.purchase_receipts%rowtype;
  v_entry jsonb;
  v_item public.purchase_order_items%rowtype;
  v_item_id uuid;
  v_stock_operation_id uuid;
  v_quantity numeric;
  v_unit text;
  v_product_active boolean;
  v_movement_id uuid;
  v_receipt_id uuid;
  v_status public.purchase_order_status;
begin
  v_user_id := private.assert_purchase_admin();

  if p_order_id is null or p_operation_id is null
    or p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_RECEIPT_INPUT';
  end if;

  select pr.* into v_existing
  from public.purchase_receipts pr
  where pr.operation_id = p_operation_id;

  if found then
    if v_existing.purchase_order_id <> p_order_id
      or v_existing.request_payload <> p_items then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;
    select po.status into v_status from public.purchase_orders po where po.id = p_order_id;
    return query select v_existing.id, v_status, true;
    return;
  end if;

  select po.* into v_order
  from public.purchase_orders po
  where po.id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_FOUND';
  end if;
  if v_order.status not in ('ORDERED'::public.purchase_order_status, 'PARTIALLY_RECEIVED'::public.purchase_order_status) then
    raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_NOT_RECEIVABLE';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) e
    group by e->>'purchase_order_item_id'
    having count(*) > 1
  ) then
    raise exception using errcode = 'P0001', message = 'DUPLICATE_RECEIPT_ITEM';
  end if;

  insert into public.purchase_receipts (purchase_order_id, operation_id, request_payload, performed_by)
  values (p_order_id, p_operation_id, p_items, v_user_id)
  returning id into v_receipt_id;

  for v_entry in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_item_id := (v_entry->>'purchase_order_item_id')::uuid;
      v_stock_operation_id := (v_entry->>'stock_operation_id')::uuid;
      v_quantity := (v_entry->>'quantity')::numeric;
    exception when others then
      raise exception using errcode = 'P0001', message = 'INVALID_RECEIPT_INPUT';
    end;

    if v_item_id is null or v_stock_operation_id is null or v_quantity is null or v_quantity <= 0 then
      raise exception using errcode = 'P0001', message = 'INVALID_RECEIPT_INPUT';
    end if;

    select poi.* into v_item
    from public.purchase_order_items poi
    where poi.id = v_item_id
      and poi.purchase_order_id = p_order_id
      and poi.active = true
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'PURCHASE_ORDER_ITEM_NOT_FOUND';
    end if;

    select p.unit, p.active into v_unit, v_product_active
    from public.products p where p.id = v_item.product_id;
    if not found or not v_product_active then
      raise exception using errcode = 'P0001', message = 'PRODUCT_INACTIVE_OR_MISSING';
    end if;
    if not private.quantity_matches_unit_precision(v_unit, v_quantity) then
      raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY_PRECISION';
    end if;
    if v_item.received_quantity + v_quantity > v_item.ordered_quantity then
      raise exception using errcode = 'P0001', message = 'RECEIPT_QUANTITY_EXCEEDS_ORDERED';
    end if;

    select r.movement_id into v_movement_id
    from private.register_stock_movement(
      v_item.product_id,
      'ENTRY'::public.stock_movement_type,
      v_quantity,
      v_stock_operation_id,
      concat('Recebimento pedido ', p_order_id::text)
    ) r
    limit 1;

    if v_movement_id is null then
      raise exception using errcode = 'P0001', message = 'MOVEMENT_RESULT_MISSING';
    end if;

    insert into public.purchase_receipt_items (
      receipt_id, purchase_order_item_id, quantity, stock_movement_id
    ) values (
      v_receipt_id, v_item.id, v_quantity, v_movement_id
    );

    update public.purchase_order_items poi
    set received_quantity = poi.received_quantity + v_quantity
    where poi.id = v_item.id;
  end loop;

  if exists (
    select 1 from public.purchase_order_items poi
    where poi.purchase_order_id = p_order_id
      and poi.active = true
      and poi.received_quantity < poi.ordered_quantity
  ) then
    v_status := 'PARTIALLY_RECEIVED'::public.purchase_order_status;
  else
    v_status := 'RECEIVED'::public.purchase_order_status;
  end if;

  update public.purchase_orders po set status = v_status where po.id = p_order_id;

  return query select v_receipt_id, v_status, false;
end;
$$;

revoke all on function private.receive_purchase_order(uuid, uuid, jsonb) from public;
revoke all on function private.receive_purchase_order(uuid, uuid, jsonb) from anon;
revoke all on function private.receive_purchase_order(uuid, uuid, jsonb) from service_role;
grant execute on function private.receive_purchase_order(uuid, uuid, jsonb) to authenticated;

create function public.receive_purchase_order(
  p_order_id uuid,
  p_operation_id uuid,
  p_items jsonb
)
returns table (
  receipt_id uuid,
  order_status public.purchase_order_status,
  replayed boolean
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.receive_purchase_order(p_order_id, p_operation_id, p_items);
$$;

revoke all on function public.receive_purchase_order(uuid, uuid, jsonb) from public;
revoke all on function public.receive_purchase_order(uuid, uuid, jsonb) from anon;
revoke all on function public.receive_purchase_order(uuid, uuid, jsonb) from service_role;
grant execute on function public.receive_purchase_order(uuid, uuid, jsonb) to authenticated;

comment on table public.purchase_orders is 'Pedidos de compra sem dimensão monetária; PHASE-12.';
comment on table public.purchase_receipts is 'Recebimentos idempotentes vinculados aos movimentos autoritativos de estoque.';
comment on function public.receive_purchase_order(uuid, uuid, jsonb) is 'API invoker para recebimento transacional ADMIN-only.';
