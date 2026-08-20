create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 160),
  tax_id text null check (tax_id is null or length(btrim(tax_id)) between 3 and 40),
  email text null check (email is null or length(btrim(email)) <= 254),
  phone text null check (phone is null or length(btrim(phone)) <= 40),
  notes text null check (notes is null or length(notes) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index suppliers_tax_id_unique_normalized
on public.suppliers (lower(regexp_replace(btrim(tax_id), '\s+', '', 'g')))
where tax_id is not null and btrim(tax_id) <> '';

create index suppliers_name_search on public.suppliers (lower(name));

create table public.product_suppliers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  supplier_code text null check (supplier_code is null or length(btrim(supplier_code)) <= 80),
  preferred boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, supplier_id)
);

create unique index product_suppliers_one_preferred_active
on public.product_suppliers (product_id)
where preferred = true and active = true;

create index product_suppliers_supplier_idx on public.product_suppliers (supplier_id);
create index product_suppliers_product_idx on public.product_suppliers (product_id);

alter table public.suppliers enable row level security;
alter table public.product_suppliers enable row level security;

revoke all on public.suppliers from anon;
revoke all on public.product_suppliers from anon;
grant select, insert, update on public.suppliers to authenticated;
grant select, insert, update on public.product_suppliers to authenticated;
revoke delete on public.suppliers from authenticated;
revoke delete on public.product_suppliers from authenticated;

create policy "suppliers_active_select"
on public.suppliers
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active = true
  )
  and (active = true or (select private.is_admin()))
);

create policy "suppliers_admin_insert"
on public.suppliers
for insert
to authenticated
with check ((select private.is_admin()));

create policy "suppliers_admin_update"
on public.suppliers
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "product_suppliers_active_select"
on public.product_suppliers
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active = true
  )
  and (
    (
      active = true
      and exists (
        select 1 from public.suppliers s
        where s.id = supplier_id and s.active = true
      )
    )
    or (select private.is_admin())
  )
);

create policy "product_suppliers_admin_insert"
on public.product_suppliers
for insert
to authenticated
with check ((select private.is_admin()));

create policy "product_suppliers_admin_update"
on public.product_suppliers
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create or replace function private.suppliers_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function private.suppliers_touch_updated_at() from public;

create trigger suppliers_touch_updated_at
before update on public.suppliers
for each row execute function private.suppliers_touch_updated_at();

create trigger product_suppliers_touch_updated_at
before update on public.product_suppliers
for each row execute function private.suppliers_touch_updated_at();

create or replace function private.deactivate_supplier_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.active = true and new.active = false then
    update public.product_suppliers
    set active = false, preferred = false, updated_at = timezone('utc', now())
    where supplier_id = new.id and active = true;
  end if;
  return new;
end;
$$;

revoke all on function private.deactivate_supplier_links() from public;

create trigger suppliers_deactivate_links
after update of active on public.suppliers
for each row execute function private.deactivate_supplier_links();

create or replace function private.single_preferred_product_supplier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.active = false then
    new.preferred = false;
    return new;
  end if;

  if new.preferred = true then
    update public.product_suppliers
    set preferred = false, updated_at = timezone('utc', now())
    where product_id = new.product_id
      and id <> new.id
      and preferred = true;
  end if;
  return new;
end;
$$;

revoke all on function private.single_preferred_product_supplier() from public;

create trigger product_suppliers_single_preferred
before insert or update of preferred, active on public.product_suppliers
for each row execute function private.single_preferred_product_supplier();

comment on table public.suppliers is 'Fornecedores comerciais da mercearia; inativação preserva histórico.';
comment on table public.product_suppliers is 'Vínculos produto-fornecedor com código comercial e preferência por produto.';
