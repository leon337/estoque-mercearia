revoke insert, update, delete, truncate on public.inventory from service_role;
revoke insert, update, delete, truncate on public.stock_movements from service_role;
revoke execute on function public.register_stock_movement(
  uuid,
  public.stock_movement_type,
  numeric,
  uuid,
  text
) from service_role;

comment on table public.inventory is
  'Saldo atual materializado por produto; escrita somente pelo RPC register_stock_movement sob sessão authenticated.';
comment on table public.stock_movements is
  'Histórico append-only; escrita operacional somente pelo RPC register_stock_movement sob sessão authenticated.';
