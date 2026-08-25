create type public.sale_status as enum ('DRAFT', 'COMPLETED', 'CANCELLED');

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  status public.sale_status not null default 'DRAFT',
  notes text null check (notes is null or length(notes) <= 1000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  completion_operation_id uuid null unique,
  completed_by uuid null references public.profiles(id) on delete restrict,
  cancelled_by uuid null references public.profiles(id) on delete restrict,
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index sales_status_created_idx on public.sales (status, created_at desc);
create index sales_created_by_idx on public.sales (created_by);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit_sale_price numeric(14, 2) not null check (unit_sale_price >= 0),
  stock_operation_id uuid not null default gen_random_uuid() unique,
  stock_movement_id uuid null unique references public.stock_movements(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (sale_id, product_id)
);

create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_product_idx on public.sale_items (product_id);

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

revoke all on public.sales from anon;
revoke all on public.sale_items from anon;
revoke all on public.sales from authenticated;
revoke all on public.sale_items from authenticated;

grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;
grant insert (notes) on public.sales to authenticated;
grant insert (sale_id, product_id, quantity, active) on public.sale_items to authenticated;
grant update (quantity, active) on public.sale_items to authenticated;

create policy "sales_active_select"
on public.sales
for select
to authenticated
using ((select private.is_active_user()));

create policy "sales_active_insert"
on public.sales
for insert
to authenticated
with check ((select private.is_active_user()));

create policy "sale_items_active_select"
on public.sale_items
for select
to authenticated
using ((select private.is_active_user()));

create policy "sale_items_active_insert"
on public.sale_items
for insert
to authenticated
with check ((select private.is_active_user()));

create policy "sale_items_active_update"
on public.sale_items
for update
to authenticated
using ((select private.is_active_user()))
with check ((select private.is_active_user()));

create or replace function private.sale_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function private.sale_touch_updated_at() from public;
revoke all on function private.sale_touch_updated_at() from anon;
revoke all on function private.sale_touch_updated_at() from authenticated;
revoke all on function private.sale_touch_updated_at() from service_role;

create trigger sales_touch_updated_at
before update on public.sales
for each row execute function private.sale_touch_updated_at();

create trigger sale_items_touch_updated_at
before update on public.sale_items
for each row execute function private.sale_touch_updated_at();

create or replace function private.sale_set_actor()
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
  new.status := 'DRAFT'::public.sale_status;
  return new;
end;
$$;

revoke all on function private.sale_set_actor() from public;
revoke all on function private.sale_set_actor() from anon;
revoke all on function private.sale_set_actor() from authenticated;
revoke all on function private.sale_set_actor() from service_role;

create trigger sales_set_actor
before insert on public.sales
for each row execute function private.sale_set_actor();

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
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_sale_item() from public;
revoke all on function private.validate_sale_item() from anon;
revoke all on function private.validate_sale_item() from authenticated;
revoke all on function private.validate_sale_item() from service_role;

create trigger sale_items_validate
before insert or update on public.sale_items
for each row execute function private.validate_sale_item();

create or replace function private.assert_sales_user()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_active boolean;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select p.active into v_active
  from public.profiles p
  where p.id = v_user_id;

  if not found or not v_active then
    raise exception using errcode = 'P0001', message = 'USER_INACTIVE_OR_MISSING';
  end if;

  return v_user_id;
end;
$$;

revoke all on function private.assert_sales_user() from public;
revoke all on function private.assert_sales_user() from anon;
revoke all on function private.assert_sales_user() from authenticated;
revoke all on function private.assert_sales_user() from service_role;

create or replace function private.complete_sale(
  p_sale_id uuid,
  p_operation_id uuid
)
returns table (id uuid, status public.sale_status, replayed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_sale public.sales%rowtype;
  v_item public.sale_items%rowtype;
  v_movement_id uuid;
begin
  v_user_id := private.assert_sales_user();

  if p_sale_id is null or p_operation_id is null then
    raise exception using errcode = 'P0001', message = 'INVALID_SALE_INPUT';
  end if;

  select s.* into v_sale
  from public.sales s
  where s.id = p_sale_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'SALE_NOT_FOUND';
  end if;

  if v_sale.status = 'COMPLETED'::public.sale_status then
    if v_sale.completion_operation_id = p_operation_id then
      return query select p_sale_id, 'COMPLETED'::public.sale_status, true;
      return;
    end if;
    raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
  end if;

  if v_sale.status <> 'DRAFT'::public.sale_status then
    raise exception using errcode = 'P0001', message = 'SALE_NOT_DRAFT';
  end if;

  if exists (
    select 1 from public.sales s
    where s.completion_operation_id = p_operation_id
      and s.id <> p_sale_id
  ) then
    raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
  end if;

  if not exists (
    select 1 from public.sale_items si
    where si.sale_id = p_sale_id and si.active = true
  ) then
    raise exception using errcode = 'P0001', message = 'SALE_EMPTY';
  end if;

  for v_item in
    select si.*
    from public.sale_items si
    where si.sale_id = p_sale_id
      and si.active = true
    order by si.id
    for update
  loop
    select r.movement_id into v_movement_id
    from private.register_stock_movement(
      v_item.product_id,
      'EXIT'::public.stock_movement_type,
      v_item.quantity,
      v_item.stock_operation_id,
      concat('Venda ', p_sale_id::text)
    ) r;

    update public.sale_items
    set stock_movement_id = v_movement_id
    where id = v_item.id;
  end loop;

  update public.sales
  set status = 'COMPLETED'::public.sale_status,
      completion_operation_id = p_operation_id,
      completed_by = v_user_id,
      completed_at = timezone('utc', now()),
      cancelled_by = null,
      cancelled_at = null
  where sales.id = p_sale_id;

  return query select p_sale_id, 'COMPLETED'::public.sale_status, false;
end;
$$;

create or replace function private.cancel_sale(p_sale_id uuid)
returns table (id uuid, status public.sale_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_status public.sale_status;
begin
  v_user_id := private.assert_sales_user();

  select s.status into v_status
  from public.sales s
  where s.id = p_sale_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'SALE_NOT_FOUND';
  end if;

  if v_status <> 'DRAFT'::public.sale_status then
    raise exception using errcode = 'P0001', message = 'SALE_NOT_DRAFT';
  end if;

  update public.sales
  set status = 'CANCELLED'::public.sale_status,
      cancelled_by = v_user_id,
      cancelled_at = timezone('utc', now())
  where sales.id = p_sale_id;

  return query select p_sale_id, 'CANCELLED'::public.sale_status;
end;
$$;

revoke all on function private.complete_sale(uuid, uuid) from public;
revoke all on function private.complete_sale(uuid, uuid) from anon;
revoke all on function private.complete_sale(uuid, uuid) from service_role;
grant execute on function private.complete_sale(uuid, uuid) to authenticated;

revoke all on function private.cancel_sale(uuid) from public;
revoke all on function private.cancel_sale(uuid) from anon;
revoke all on function private.cancel_sale(uuid) from service_role;
grant execute on function private.cancel_sale(uuid) to authenticated;

create function public.complete_sale(p_sale_id uuid, p_operation_id uuid)
returns table (id uuid, status public.sale_status, replayed boolean)
language sql
security invoker
set search_path = ''
as $$
  select * from private.complete_sale(p_sale_id, p_operation_id);
$$;

create function public.cancel_sale(p_sale_id uuid)
returns table (id uuid, status public.sale_status)
language sql
security invoker
set search_path = ''
as $$
  select * from private.cancel_sale(p_sale_id);
$$;

revoke all on function public.complete_sale(uuid, uuid) from public;
revoke all on function public.complete_sale(uuid, uuid) from anon;
revoke all on function public.complete_sale(uuid, uuid) from service_role;
grant execute on function public.complete_sale(uuid, uuid) to authenticated;

revoke all on function public.cancel_sale(uuid) from public;
revoke all on function public.cancel_sale(uuid) from anon;
revoke all on function public.cancel_sale(uuid) from service_role;
grant execute on function public.cancel_sale(uuid) to authenticated;
