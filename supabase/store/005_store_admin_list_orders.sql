-- =============================================================================
-- 005 — Admin list orders RPC (non-destructive)
-- Ensures authenticated store admins can load orders + items reliably.
-- Does NOT drop tables / delete data / recreate products.
-- =============================================================================

create or replace function public.store_admin_list_orders(p_limit integer default 200)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 200), 500));
  v_result jsonb;
begin
  if auth.uid() is null or not public.store_is_admin() then
    raise exception 'not_admin';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'phone_display', o.phone_display,
        'customer_address', o.customer_address,
        'note', o.note,
        'method', o.method,
        'subtotal', o.subtotal,
        'promo_discount', o.promo_discount,
        'shipping_fee', o.shipping_fee,
        'total', o.total,
        'status_index', o.status_index,
        'history', o.history,
        'payment_slip', o.payment_slip,
        'slip_uploaded_at', o.slip_uploaded_at,
        'created_at', o.created_at,
        'items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'product_id', i.product_id,
              'product_name', i.product_name,
              'emoji', i.emoji,
              'qty', i.qty,
              'unit_price', i.unit_price,
              'line_total', i.line_total
            )
            order by i.created_at
          )
          from public.store_order_items i
          where i.order_id = o.id
        ), '[]'::jsonb)
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select *
    from public.store_orders
    order by created_at desc
    limit v_limit
  ) o;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.store_admin_list_orders(integer) from public;
grant execute on function public.store_admin_list_orders(integer) to authenticated;
