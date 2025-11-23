-- Ensure price_amount stays in sync when price_per_carat or weight_carats is updated.
-- The trigger recalculates price_amount = price_per_carat * weight_carats

create or replace function public.update_price_amount_from_per_carat()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_price_per_carat bigint;
begin
  -- Use the current price_per_carat value (either from the update or existing in DB)
  -- This ensures we always use the correct value, not stale data
  -- Use new.price_per_carat if it's being updated, otherwise use old.price_per_carat
  current_price_per_carat := coalesce(new.price_per_carat, old.price_per_carat);
  
  if current_price_per_carat is null
     or new.weight_carats is null
     or new.weight_carats <= 0 then
    return new;
  end if;

  new.price_amount :=
    round(
      (current_price_per_carat::numeric * new.weight_carats::numeric),
      0
    )::bigint;

  return new;
end;
$function$;

drop trigger if exists price_per_carat_updates_price on public.gemstones;
drop trigger if exists weight_carats_updates_price on public.gemstones;

-- Trigger when price_per_carat changes
create trigger price_per_carat_updates_price
before update of price_per_carat on public.gemstones
for each row
when (new.price_per_carat is distinct from old.price_per_carat)
execute function public.update_price_amount_from_per_carat();

-- Trigger when weight_carats changes (if price_per_carat exists)
create trigger weight_carats_updates_price
before update of weight_carats on public.gemstones
for each row
when (
  new.weight_carats is distinct from old.weight_carats
  and new.price_per_carat is not null
  and old.price_per_carat is not null
)
execute function public.update_price_amount_from_per_carat();

