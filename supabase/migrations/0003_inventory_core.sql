create type public.stock_movement_type as enum ('INITIAL', 'ENTRY', 'EXIT', 'ADJUSTMENT');

create table public.inventory (
  product_id uuid primary key references public.products(id) on delete restrict,
  quantity numeric not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique,
  product_id uuid not null references public.products(id) on delete restrict,
  type public.stock_movement_type not null,
  quantity_delta numeric not null,
  previous_quantity numeric not null check (previous_quantity >= 0),
  resulting_quantity numeric not null check (resulting_quantity >= 0),
  reason text check (reason is null or length(btrim(reason)) > 0),
  performed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create index stock_movements_product_created_idx
on public.stock_movements (product_id, created_at desc);

create index stock_movements_performed_by_idx
on public.stock_movements (performed_by);

insert into public.inventory (product_id, quantity)
select id, 0
from public.products
on conflict (product_id) do nothing;

create or replace function private.ensure_product_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.inventory (product_id, quantity)
  values (new.id, 0)
  on conflict (product_id) do nothing;
  return new;
end;
$$;

revoke all on function private.ensure_product_inventory() from public;

create trigger products_create_inventory
after insert on public.products
for each row execute function private.ensure_product_inventory();

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function private.is_active_user() from public;
grant execute on function private.is_active_user() to authenticated;

alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;

revoke all on public.inventory from anon;
revoke all on public.inventory from authenticated;
grant select on public.inventory to authenticated;

revoke all on public.stock_movements from anon;
revoke all on public.stock_movements from authenticated;
grant select on public.stock_movements to authenticated;

create policy "inventory_select_active_user"
on public.inventory
for select
to authenticated
using (
  (select private.is_active_user())
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and (p.active = true or (select private.is_admin()))
  )
);

create policy "stock_movements_select_active_user"
on public.stock_movements
for select
to authenticated
using (
  (select private.is_active_user())
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and (p.active = true or (select private.is_admin()))
  )
);

create or replace function private.prevent_stock_movement_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = 'P0001', message = 'STOCK_MOVEMENT_IMMUTABLE';
end;
$$;

revoke all on function private.prevent_stock_movement_mutation() from public;

create trigger stock_movements_immutable
before update or delete on public.stock_movements
for each row execute function private.prevent_stock_movement_mutation();

create or replace function public.register_stock_movement(
  p_product_id uuid,
  p_type public.stock_movement_type,
  p_quantity numeric,
  p_operation_id uuid,
  p_reason text default null
)
returns table (
  movement_id uuid,
  previous_quantity numeric,
  quantity_delta numeric,
  resulting_quantity numeric,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_role public.app_role;
  v_user_active boolean;
  v_product_active boolean;
  v_previous numeric;
  v_result numeric;
  v_delta numeric;
  v_reason text := nullif(btrim(p_reason), '');
  v_existing public.stock_movements%rowtype;
  v_movement_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'AUTH_REQUIRED';
  end if;

  select p.role, p.active
  into v_role, v_user_active
  from public.profiles p
  where p.id = v_user_id;

  if not found or not v_user_active then
    raise exception using errcode = 'P0001', message = 'USER_INACTIVE_OR_MISSING';
  end if;

  if p_product_id is null or p_type is null or p_quantity is null or p_operation_id is null then
    raise exception using errcode = 'P0001', message = 'INVALID_MOVEMENT_INPUT';
  end if;

  if p_quantity < 0 or (p_type in ('ENTRY', 'EXIT') and p_quantity <= 0) then
    raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY';
  end if;

  if p_type in ('INITIAL', 'ADJUSTMENT') and v_role <> 'ADMIN'::public.app_role then
    raise exception using errcode = 'P0001', message = 'ADMIN_REQUIRED';
  end if;

  if p_type = 'ADJUSTMENT'::public.stock_movement_type and v_reason is null then
    raise exception using errcode = 'P0001', message = 'REASON_REQUIRED';
  end if;

  select sm.*
  into v_existing
  from public.stock_movements sm
  where sm.operation_id = p_operation_id;

  if found then
    if v_existing.product_id <> p_product_id
      or v_existing.type <> p_type
      or v_existing.performed_by <> v_user_id
      or coalesce(v_existing.reason, '') <> coalesce(v_reason, '')
      or (
        p_type in ('ENTRY', 'EXIT')
        and abs(v_existing.quantity_delta) <> p_quantity
      )
      or (
        p_type in ('INITIAL', 'ADJUSTMENT')
        and v_existing.resulting_quantity <> p_quantity
      )
    then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;

    return query
    select
      v_existing.id,
      v_existing.previous_quantity,
      v_existing.quantity_delta,
      v_existing.resulting_quantity,
      true;
    return;
  end if;

  select p.active
  into v_product_active
  from public.products p
  where p.id = p_product_id
  for share;

  if not found then
    raise exception using errcode = 'P0001', message = 'PRODUCT_NOT_FOUND';
  end if;

  if not v_product_active then
    raise exception using errcode = 'P0001', message = 'INACTIVE_PRODUCT';
  end if;

  insert into public.inventory (product_id, quantity)
  values (p_product_id, 0)
  on conflict (product_id) do nothing;

  select i.quantity
  into v_previous
  from public.inventory i
  where i.product_id = p_product_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'INVENTORY_NOT_FOUND';
  end if;

  select sm.*
  into v_existing
  from public.stock_movements sm
  where sm.operation_id = p_operation_id;

  if found then
    if v_existing.product_id <> p_product_id
      or v_existing.type <> p_type
      or v_existing.performed_by <> v_user_id
      or coalesce(v_existing.reason, '') <> coalesce(v_reason, '')
      or (
        p_type in ('ENTRY', 'EXIT')
        and abs(v_existing.quantity_delta) <> p_quantity
      )
      or (
        p_type in ('INITIAL', 'ADJUSTMENT')
        and v_existing.resulting_quantity <> p_quantity
      )
    then
      raise exception using errcode = 'P0001', message = 'IDEMPOTENCY_CONFLICT';
    end if;

    return query
    select
      v_existing.id,
      v_existing.previous_quantity,
      v_existing.quantity_delta,
      v_existing.resulting_quantity,
      true;
    return;
  end if;

  if p_type = 'INITIAL'::public.stock_movement_type
    and exists (
      select 1
      from public.stock_movements sm
      where sm.product_id = p_product_id
    )
  then
    raise exception using errcode = 'P0001', message = 'INITIAL_ALREADY_REGISTERED';
  end if;

  case p_type
    when 'INITIAL'::public.stock_movement_type then
      v_result := p_quantity;
      v_delta := v_result - v_previous;
    when 'ENTRY'::public.stock_movement_type then
      v_delta := p_quantity;
      v_result := v_previous + v_delta;
    when 'EXIT'::public.stock_movement_type then
      v_delta := -p_quantity;
      v_result := v_previous + v_delta;
      if v_result < 0 then
        raise exception using errcode = 'P0001', message = 'STOCK_INSUFFICIENT';
      end if;
    when 'ADJUSTMENT'::public.stock_movement_type then
      v_result := p_quantity;
      v_delta := v_result - v_previous;
  end case;

  insert into public.stock_movements (
    operation_id,
    product_id,
    type,
    quantity_delta,
    previous_quantity,
    resulting_quantity,
    reason,
    performed_by
  )
  values (
    p_operation_id,
    p_product_id,
    p_type,
    v_delta,
    v_previous,
    v_result,
    v_reason,
    v_user_id
  )
  returning id into v_movement_id;

  update public.inventory
  set quantity = v_result,
      updated_at = timezone('utc', now())
  where product_id = p_product_id;

  return query
  select v_movement_id, v_previous, v_delta, v_result, false;
end;
$$;

revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from public;
revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from anon;
grant execute on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) to authenticated;

comment on table public.inventory is 'Saldo atual materializado por produto; alterações passam pelo RPC register_stock_movement.';
comment on table public.stock_movements is 'Histórico append-only de movimentações de estoque.';
comment on column public.stock_movements.operation_id is 'Chave de idempotência fornecida pelo cliente por intenção de movimentação.';
comment on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) is 'Registra movimentação de estoque de forma autorizada, atômica e serializada por produto.';
