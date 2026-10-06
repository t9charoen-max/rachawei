-- =============================================================================
-- 008 — Fix public shop settings view for anon (non-destructive)
-- store_shop_settings_public had security_invoker=true, so anon needed SELECT
-- on the base table (which must stay locked to protect admin_pin_hash).
-- Switch view to invoker=false so public columns are readable via the view only.
-- =============================================================================

alter view public.store_shop_settings_public set (security_invoker = false);

grant select on public.store_shop_settings_public to anon, authenticated;

-- Keep base table locked from anon (pin hash / admin fields)
revoke all on public.store_shop_settings from anon;
