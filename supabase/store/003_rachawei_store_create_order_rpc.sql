-- =============================================================================
-- Rachawei-store — atomic create-order RPC (+ optional realtime)
-- Run AFTER 001 + 002 on project Rachawei-store ONLY.
-- Safe: does not DROP tables or delete existing rows.
-- =============================================================================

-- Atomic insert: store_orders + store_order_items in one transaction.
-- Callable by anon + authenticated (matches public checkout + admin).
create or replace function public.store_create_order(
  p_order jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_item jsonb;
begin
  if p_order is null or jsonb_typeof(p_order) <> 'object' then
    raise exception 'invalid order payload';
  end if;

  v_id := nullif(trim(p_order->>'id'), '');
  if v_id is null then
    raise exception 'order id required';
  end if;

  if exists (select 1 from public.store_orders where id = v_id) then
    -- Idempotent: same id already stored (retry / double-submit)
    return jsonb_build_object('ok', true, 'id', v_id, 'duplicate', true);
  end if;

  insert into public.store_orders (
    id,
    customer_name,
    customer_phone,
    phone_display,
    customer_address,
    note,
    method,
    subtotal,
    promo_discount,
    shipping_fee,
    total,
    status_index,
    history,
    payment_slip,
    slip_uploaded_at
  ) values (
    v_id,
    coalesce(nullif(trim(p_order->>'customer_name'), ''), 'ลูกค้า'),
    coalesce(p_order->>'customer_phone', ''),
    coalesce(p_order->>'phone_display', ''),
    coalesce(p_order->>'customer_address', ''),
    coalesce(p_order->>'note', ''),
    coalesce(nullif(trim(p_order->>'method'), ''), 'transfer'),
    coalesce((p_order->>'subtotal')::numeric, 0),
    coalesce((p_order->>'promo_discount')::numeric, 0),
    coalesce((p_order->>'shipping_fee')::numeric, 0),
    coalesce((p_order->>'total')::numeric, 0),
    coalesce((p_order->>'status_index')::integer, 0),
    case
      when jsonb_typeof(p_order->'history') = 'array' then p_order->'history'
      else '[]'::jsonb
    end,
    nullif(p_order->>'payment_slip', ''),
    case
      when nullif(p_order->>'slip_uploaded_at', '') is null then null
      else (p_order->>'slip_uploaded_at')::timestamptz
    end
  );

  if p_items is not null and jsonb_typeof(p_items) = 'array' then
    for v_item in select value from jsonb_array_elements(p_items)
    loop
      insert into public.store_order_items (
        order_id,
        product_id,
        product_name,
        emoji,
        qty,
        unit_price,
        line_total
      ) values (
        v_id,
        nullif(trim(v_item->>'product_id'), ''),
        coalesce(nullif(trim(v_item->>'product_name'), ''), 'สินค้า'),
        coalesce(nullif(trim(v_item->>'emoji'), ''), '🧺'),
        greatest(1, coalesce((v_item->>'qty')::integer, 1)),
        coalesce((v_item->>'unit_price')::numeric, 0),
        coalesce((v_item->>'line_total')::numeric, 0)
      );
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'duplicate', false);
end;
$$;

revoke all on function public.store_create_order(jsonb, jsonb) from public;
grant execute on function public.store_create_order(jsonb, jsonb) to anon, authenticated;

-- Optional: let admin UI receive live order inserts (ignore if already in publication)
do $$
begin
  begin
    alter publication supabase_realtime add table public.store_orders;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;
