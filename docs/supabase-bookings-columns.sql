-- Run in Supabase SQL Editor
-- Ensures the `public.bookings` table has all columns used by the app.
-- Tam şema + normalize geçiş yolu: supabase-schema-app-compatible-and-normalization-path.sql

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists status text,
  add column if not exists tour_id text,
  add column if not exists tour_title text,
  add column if not exists date date,
  add column if not exists time text,
  add column if not exists meeting_point text,
  add column if not exists class_id text,
  add column if not exists class_name text,
  add column if not exists first_class_locas text[],
  add column if not exists first_class_loca text,
  add column if not exists unit_price numeric,
  add column if not exists total_price numeric,
  add column if not exists currency text,
  add column if not exists customer_first_name text,
  add column if not exists customer_last_name text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists customer_note text,
  add column if not exists adult_count integer,
  add column if not exists child_count integer,
  add column if not exists infant_count integer,
  add column if not exists additional_travelers jsonb,
  add column if not exists meal_preference jsonb,
  add column if not exists source text,
  add column if not exists access_token text,
  add column if not exists manual_source text,
  add column if not exists created_by_admin boolean,
  add column if not exists admin_note text,
  add column if not exists reference text,
  add column if not exists paid_now numeric,
  add column if not exists ui_locale text;

-- NestPay / Payten callback sonrası ödeme metadatası (callbackUrl güvenilir kaynak)
alter table public.bookings
  add column if not exists payment_status text,
  add column if not exists nestpay_auth_code text,
  add column if not exists nestpay_host_ref_num text,
  add column if not exists nestpay_trans_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists payment_callback_payload jsonb,
  add column if not exists payment_last_error text,
  add column if not exists payment_verification_status text;

comment on column public.bookings.ui_locale is 'Site language at booking (tr|en|de) — customer emails / PDF';
comment on column public.bookings.payment_status is 'Ödeme durumu özeti: paid | failed (status ile uyumlu olmalı)';
comment on column public.bookings.payment_verification_status is 'NestPay HASH: verified | hash_mismatch';

update public.bookings
set created_at = now()
where created_at is null;

alter table public.bookings
  alter column created_at set default now(),
  alter column created_at set not null;

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_date_idx on public.bookings (date);
create index if not exists bookings_tour_id_idx on public.bookings (tour_id);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_source_idx on public.bookings (source);
create index if not exists bookings_access_token_idx on public.bookings (access_token);

-- RLS / permissions (test ve uygulama akışı için)
alter table public.bookings enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.bookings to anon, authenticated;

drop policy if exists bookings_insert_policy on public.bookings;
create policy bookings_insert_policy
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists bookings_select_policy on public.bookings;
create policy bookings_select_policy
  on public.bookings
  for select
  to anon, authenticated
  using (true);

drop policy if exists bookings_update_policy on public.bookings;
create policy bookings_update_policy
  on public.bookings
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- If you still get RLS errors during migration/testing, keep bookings open temporarily.
-- Re-enable + tighten policies after migration is complete.
alter table public.bookings disable row level security;
