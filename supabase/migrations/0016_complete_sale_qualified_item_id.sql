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
    where public.sale_items.id = v_item.id;
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

revoke all on function private.complete_sale(uuid, uuid) from public;
revoke all on function private.complete_sale(uuid, uuid) from anon;
revoke all on function private.complete_sale(uuid, uuid) from service_role;
grant execute on function private.complete_sale(uuid, uuid) to authenticated;
