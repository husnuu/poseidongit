-- Run in Supabase SQL Editor
-- Ekip uygulaması (/ekip) — Tekne Barı sipariş tablosu.
-- checked_in_at kolonu için ayrıca docs/supabase-bookings-columns.sql dosyasını çalıştırın.

create extension if not exists pgcrypto;

create table if not exists public.bar_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- Sefer bilgisi: hangi tur / hangi gün / hangi saat
  tour_id text not null,
  tour_title text not null,
  trip_date date not null,
  trip_time text,
  -- Rezervasyona bağlıysa booking id; masaüstü / yürüyerek gelen (walk-in) siparişlerde null
  booking_id uuid references public.bookings(id) on delete set null,
  guest_label text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  currency text not null default 'TRY',
  status text not null default 'new',
  payment_status text not null default 'unpaid',
  payment_method text,
  served_at timestamptz,
  paid_at timestamptz
);

comment on column public.bar_orders.status is 'new | preparing | served';
comment on column public.bar_orders.payment_status is 'unpaid | paid';
comment on column public.bar_orders.payment_method is 'cash | card (yalnızca payment_status=paid iken anlamlı)';
comment on column public.bar_orders.items is '[{title, price, qty}]';

create index if not exists bar_orders_trip_idx on public.bar_orders (tour_id, trip_date);
create index if not exists bar_orders_status_idx on public.bar_orders (status);
create index if not exists bar_orders_created_at_idx on public.bar_orders (created_at desc);

alter table public.bar_orders enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.bar_orders to anon, authenticated;

drop policy if exists bar_orders_all_policy on public.bar_orders;
create policy bar_orders_all_policy
  on public.bar_orders
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Test/geçiş sürecinde RLS ile ilgili hata alırsanız geçici olarak kapatabilirsiniz.
-- alter table public.bar_orders disable row level security;
