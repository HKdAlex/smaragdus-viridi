-- Ensure price_amount stays in sync when price_per_carat is updated manually.

create or replace function public.update_price_amount_from_per_carat()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.price_per_carat is null
     or new.weight_carats is null
     or new.weight_carats <= 0 then
    return new;
  end if;

  new.price_amount :=
    round(
      (new.price_per_carat::numeric * new.weight_carats::numeric),
      0
    )::bigint;

  return new;
end;
$function$;

drop trigger if exists price_per_carat_updates_price on public.gemstones;

create trigger price_per_carat_updates_price
before update of price_per_carat on public.gemstones
for each row
when (new.price_per_carat is distinct from old.price_per_carat)
execute function public.update_price_amount_from_per_carat();

