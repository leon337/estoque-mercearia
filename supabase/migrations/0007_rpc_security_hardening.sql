alter function public.register_stock_movement(
  uuid,
  public.stock_movement_type,
  numeric,
  uuid,
  text
) set schema private;

revoke all on function private.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from public;
revoke all on function private.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from anon;
revoke all on function private.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from service_role;
grant execute on function private.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) to authenticated;

create function public.register_stock_movement(
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
language sql
security invoker
set search_path = ''
as $$
  select *
  from private.register_stock_movement(
    p_product_id,
    p_type,
    p_quantity,
    p_operation_id,
    p_reason
  );
$$;

revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from public;
revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from anon;
revoke all on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) from service_role;
grant execute on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) to authenticated;

alter function public.admin_update_profile(uuid, public.app_role, boolean) set schema private;

revoke all on function private.admin_update_profile(uuid, public.app_role, boolean) from public;
revoke all on function private.admin_update_profile(uuid, public.app_role, boolean) from anon;
revoke all on function private.admin_update_profile(uuid, public.app_role, boolean) from service_role;
grant execute on function private.admin_update_profile(uuid, public.app_role, boolean) to authenticated;

create function public.admin_update_profile(
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
language sql
security invoker
set search_path = ''
as $$
  select * from private.admin_update_profile(p_user_id, p_role, p_active);
$$;

revoke all on function public.admin_update_profile(uuid, public.app_role, boolean) from public;
revoke all on function public.admin_update_profile(uuid, public.app_role, boolean) from anon;
revoke all on function public.admin_update_profile(uuid, public.app_role, boolean) from service_role;
grant execute on function public.admin_update_profile(uuid, public.app_role, boolean) to authenticated;

comment on function public.register_stock_movement(uuid, public.stock_movement_type, numeric, uuid, text) is
  'API invoker; delega autorizacao e transacao para implementacao privada SECURITY DEFINER.';
comment on function public.admin_update_profile(uuid, public.app_role, boolean) is
  'API invoker; delega autorizacao administrativa para implementacao privada SECURITY DEFINER.';