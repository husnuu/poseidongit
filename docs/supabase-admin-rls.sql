-- Admin-only policies for bookings and yacht_inquiries
-- Run in Supabase SQL editor.

-- Helper: check admin flag from public.users
create or replace function public.is_admin_user(uid text)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.users u
    where u.id::text = uid
      and u.is_admin = true
  );
$$;

-- users table: authenticated user can read its own admin flag
alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own
  on public.users
  for select
  to authenticated
  using (id::text = auth.uid()::text);

-- bookings table: authenticated admins can select/update/delete
alter table public.bookings enable row level security;

-- Web rezervasyon akışı için insert izni (anon + authenticated).
drop policy if exists bookings_public_insert on public.bookings;
create policy bookings_public_insert
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists bookings_admin_select on public.bookings;
create policy bookings_admin_select
  on public.bookings
  for select
  to authenticated
  using (public.is_admin_user(auth.uid()::text));

drop policy if exists bookings_admin_update on public.bookings;
create policy bookings_admin_update
  on public.bookings
  for update
  to authenticated
  using (public.is_admin_user(auth.uid()::text))
  with check (public.is_admin_user(auth.uid()::text));

drop policy if exists bookings_admin_delete on public.bookings;
create policy bookings_admin_delete
  on public.bookings
  for delete
  to authenticated
  using (public.is_admin_user(auth.uid()::text));

-- yacht_inquiries table: authenticated admins can select/update/delete
alter table public.yacht_inquiries enable row level security;

drop policy if exists yacht_inquiries_admin_select on public.yacht_inquiries;
create policy yacht_inquiries_admin_select
  on public.yacht_inquiries
  for select
  to authenticated
  using (public.is_admin_user(auth.uid()::text));

drop policy if exists yacht_inquiries_admin_update on public.yacht_inquiries;
create policy yacht_inquiries_admin_update
  on public.yacht_inquiries
  for update
  to authenticated
  using (public.is_admin_user(auth.uid()::text))
  with check (public.is_admin_user(auth.uid()::text));

drop policy if exists yacht_inquiries_admin_delete on public.yacht_inquiries;
create policy yacht_inquiries_admin_delete
  on public.yacht_inquiries
  for delete
  to authenticated
  using (public.is_admin_user(auth.uid()::text));
