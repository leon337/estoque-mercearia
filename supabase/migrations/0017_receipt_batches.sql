create table public.receipt_batches (
  id uuid primary key default gen_random_uuid(),
  purchase_receipt_item_id uuid not null references public.purchase_receipt_items(id) on delete restrict,
  lot_code text not null check (length(btrim(lot_code)) between 1 and 100),
  expires_on date null,
  quantity numeric not null check (quantity > 0),
  active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (purchase_receipt_item_id, lot_code)
);

create index receipt_batches_receipt_item_idx
on public.receipt_batches (purchase_receipt_item_id);

create index receipt_batches_expiry_idx
on public.receipt_batches (active, expires_on)
where active = true;

alter table public.receipt_batches enable row level security;

revoke all on public.receipt_batches from anon;
revoke all on public.receipt_batches from authenticated;

grant select on public.receipt_batches to authenticated;
grant insert (purchase_receipt_item_id, lot_code, expires_on, quantity, active) on public.receipt_batches to authenticated;
grant update (lot_code, expires_on, quantity, active) on public.receipt_batches to authenticated;

create policy "receipt_batches_active_user_select"
on public.receipt_batches
for select
to authenticated
using ((select private.is_active_user()));

create policy "receipt_batches_admin_insert"
on public.receipt_batches
for insert
to authenticated
with check ((select private.is_admin()));

create policy "receipt_batches_admin_update"
on public.receipt_batches
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function private.receipt_batch_set_actor()
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

revoke all on function private.receipt_batch_set_actor() from public;

create trigger receipt_batches_set_actor
before insert on public.receipt_batches
for each row execute function private.receipt_batch_set_actor();

create or replace function private.receipt_batch_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

revoke all on function private.receipt_batch_touch_updated_at() from public;

create trigger receipt_batches_touch_updated_at
before update on public.receipt_batches
for each row execute function private.receipt_batch_touch_updated_at();

create or replace function private.validate_receipt_batch()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_received_quantity numeric;
  v_product_unit text;
  v_other_quantity numeric;
begin
  if tg_op = 'UPDATE' and new.purchase_receipt_item_id is distinct from old.purchase_receipt_item_id then
    raise exception using errcode = 'P0001', message = 'BATCH_RECEIPT_ITEM_IMMUTABLE';
  end if;

  new.lot_code := btrim(new.lot_code);

  perform 1
  from public.purchase_receipt_items pri
  where pri.id = new.purchase_receipt_item_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'BATCH_RECEIPT_ITEM_NOT_FOUND';
  end if;

  select pri.quantity, p.unit
  into v_received_quantity, v_product_unit
  from public.purchase_receipt_items pri
  join public.purchase_order_items poi on poi.id = pri.purchase_order_item_id
  join public.products p on p.id = poi.product_id
  where pri.id = new.purchase_receipt_item_id;

  if not private.quantity_matches_unit_precision(v_product_unit, new.quantity) then
    raise exception using errcode = 'P0001', message = 'INVALID_QUANTITY_PRECISION';
  end if;

  if new.active then
    select coalesce(sum(rb.quantity), 0)
    into v_other_quantity
    from public.receipt_batches rb
    where rb.purchase_receipt_item_id = new.purchase_receipt_item_id
      and rb.active = true
      and rb.id <> new.id;

    if v_other_quantity + new.quantity > v_received_quantity then
      raise exception using errcode = 'P0001', message = 'BATCH_QUANTITY_EXCEEDS_RECEIPT';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_receipt_batch() from public;

create trigger receipt_batches_validate
before insert or update on public.receipt_batches
for each row execute function private.validate_receipt_batch();

comment on table public.receipt_batches is
  'Rastreabilidade de lotes vinculada a itens efetivamente recebidos; não substitui o saldo autoritativo de public.inventory.';
