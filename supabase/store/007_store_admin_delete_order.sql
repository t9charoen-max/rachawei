-- =============================================================================
-- 007 — Admin delete order RPC (non-destructive to other systems)
-- Authenticated store admins can delete one order + its items safely.
-- Auth check: auth.uid() + public.store_is_admin()
-- Does NOT alter create-order / products / login / auth.users.
-- =============================================================================

create or replace function public.store_admin_delete_order(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id text := nullif(trim(coalesce(p_order_id, '')), '');
  v_deleted_items integer := 0;
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;

  if v_order_id is null then
    raise exception 'missing_order_id';
  end if;

  if not exists (
    select 1
    from public.store_orders o
    where o.id = v_order_id
  ) then
    raise exception 'order_not_found';
  end if;

  -- Delete related items first (also covered by ON DELETE CASCADE on order_id)
  delete from public.store_order_items
  where order_id = v_order_id;
  get diagnostics v_deleted_items = row_count;

  delete from public.store_orders
  where id = v_order_id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'deleted_items', v_deleted_items
  );
end;
$$;

revoke all on function public.store_admin_delete_order(text) from public;
grant execute on function public.store_admin_delete_order(text) to authenticated;
