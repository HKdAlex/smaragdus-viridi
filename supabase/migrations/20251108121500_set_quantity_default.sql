alter table public.gemstones
  alter column quantity set default 1;

update public.gemstones
set quantity = 1
where quantity is null;

