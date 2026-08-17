create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    'OPERATOR'::public.app_role,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

revoke all on public.profiles from anon;
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant select on public.profiles to authenticated;
revoke insert, update, delete, truncate on public.profiles from service_role;

drop policy if exists "categories_select_authenticated" on public.categories;
create policy "categories_select_active_user"
on public.categories
for select
to authenticated
using (
  (select private.is_active_user())
  and (active = true or (select private.is_admin()))
);

drop policy if exists "products_select_authenticated" on public.products;
create policy "products_select_active_user"
on public.products
for select
to authenticated
using (
  (select private.is_active_user())
  and (active = true or (select private.is_admin()))
);

create or replace function public.admin_update_profile(
  p_user_id uuid,
  p_role public.app_role,
  p_active boolean
)
returns table (
  id uuid,
  name text,
  role public.app_role,
  active boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_target_role public.app_role;
  v_target_active boolean;
  v_active_admins integer;
begin
  if v_actor_id is null or not (select private.is_admin()) then
    raise exception using errcode = 'P0001', message = 'ADMIN_REQUIRED';
  end if;

  if p_user_id is null or p_role is null or p_active is null then
    raise exception using errcode = 'P0001', message = 'INVALID_PROFILE_UPDATE';
  end if;

  select p.role, p.active
  into v_target_role, v_target_active
  from public.profiles p
  where p.id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'PROFILE_NOT_FOUND';
  end if;

  if v_target_role = 'ADMIN'::public.app_role
     and v_target_active = true
     and (p_role <> 'ADMIN'::public.app_role or p_active = false)
  then
    select count(*)
    into v_active_admins
    from public.profiles p
    where p.role = 'ADMIN'::public.app_role
      and p.active = true;

    if v_active_admins <= 1 then
      raise exception using errcode = 'P0001', message = 'LAST_ACTIVE_ADMIN';
    end if;
  end if;

  update public.profiles p
  set role = p_role,
      active = p_active,
      updated_at = timezone('utc', now())
  where p.id = p_user_id;

  return query
  select p.id, p.name, p.role, p.active
  from public.profiles p
  where p.id = p_user_id;
end;
$$;

revoke all on function public.admin_update_profile(uuid, public.app_role, boolean) from public;
revoke all on function public.admin_update_profile(uuid, public.app_role, boolean) from anon;
revoke all on function public.admin_update_profile(uuid, public.app_role, boolean) from service_role;
grant execute on function public.admin_update_profile(uuid, public.app_role, boolean) to authenticated;

comment on function public.admin_update_profile(uuid, public.app_role, boolean) is
  'Atualiza papel/ativacao somente por ADMIN ativo e impede remover o ultimo ADMIN ativo.';
comment on column public.profiles.active is
  'Novos cadastros iniciam inativos e somente passam a acessar dados operacionais apos aprovacao administrativa.';