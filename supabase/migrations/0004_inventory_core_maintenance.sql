create or replace function private.prevent_stock_movement_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'postgres' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  raise exception using errcode = 'P0001', message = 'STOCK_MOVEMENT_IMMUTABLE';
end;
$$;

revoke all on function private.prevent_stock_movement_mutation() from public;

comment on function private.prevent_stock_movement_mutation() is
  'Impede UPDATE/DELETE do histórico para a aplicação; somente o owner postgres pode executar manutenção controlada.';
