create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index categories_name_unique_ci
on public.categories (lower(btrim(name)));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  internal_code text not null check (length(btrim(internal_code)) > 0),
  barcode text check (barcode is null or length(btrim(barcode)) > 0),
  name text not null check (length(btrim(name)) > 0),
  category_id uuid references public.categories(id) on delete restrict,
  unit text not null check (length(btrim(unit)) > 0),
  minimum_stock numeric not null default 0 check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index products_internal_code_unique_ci
on public.products (lower(btrim(internal_code)));

create unique index products_barcode_unique
on public.products (barcode)
where barcode is not null;

alter table public.categories enable row level security;
alter table public.products enable row level security;

revoke all on public.categories from anon;
revoke all on public.products from anon;
revoke delete on public.categories from authenticated;
revoke delete on public.products from authenticated;
grant select, insert, update on public.categories to authenticated;
grant select, insert, update on public.products to authenticated;

create policy "categories_select_authenticated"
on public.categories
for select
to authenticated
using (active = true or (select private.is_admin()));

create policy "categories_admin_insert"
on public.categories
for insert
to authenticated
with check ((select private.is_admin()));

create policy "categories_admin_update"
on public.categories
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "products_select_authenticated"
on public.products
for select
to authenticated
using (active = true or (select private.is_admin()));

create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check ((select private.is_admin()));

create policy "products_admin_update"
on public.products
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

comment on table public.categories is 'Categorias de produtos do estoque da mercearia.';
comment on table public.products is 'Cadastro mestre de produtos; saldo de estoque pertence a milestone posterior.';
comment on column public.products.internal_code is 'Código interno único sem diferenciar maiúsculas/minúsculas.';
comment on column public.products.barcode is 'Código de barras opcional; vazio deve ser persistido como NULL pela aplicação.';
