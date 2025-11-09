-- Grant admin users full CRUD access to gemstone-related tables via RLS policies.
-- Assumes user_profiles table stores admin role for authenticated users.

set check_function_bodies = off;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'admin'
  );
$function$;

comment on function public.is_admin() is 'Returns true if the current authenticated user has role = admin.';

-- Helper to apply admin policy to a table.
do $$
declare
  target_table text;
  policy_name text;
begin
  for target_table, policy_name in
    select * from (
      values
        ('gemstones', 'admin_all_on_gemstones'),
        ('gemstone_images', 'admin_all_on_gemstone_images'),
        ('gemstone_videos', 'admin_all_on_gemstone_videos'),
        ('gemstones_ai_v6', 'admin_all_on_gemstones_ai_v6'),
        ('certifications', 'admin_all_on_certifications')
    ) as t(table_name, pol_name)
  loop
    execute format('alter table public.%I enable row level security;', target_table);

    execute format(
      'drop policy if exists %I on public.%I;',
      policy_name,
      target_table
    );

    execute format(
      'create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin());',
      policy_name,
      target_table
    );
  end loop;
end
$$;

