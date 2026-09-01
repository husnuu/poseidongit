-- =============================================================================
-- Poseidon Booking — Supabase şeması (repo ile uyumlu) + normalize geçiş yolu
-- =============================================================================
--
-- BÖLÜM 1 — Uygulama kodunun (Next.js API routes) beklediği kolonlar / tipler.
--   Bu dosya idempotent’tir: mevcut projede tekrar çalıştırılabilir.
--
-- BÖLÜM 2 — “time_str + meal_preference_key + ayrı yolcu tablosu” taslaktan
--   mevcut uygulamaya uyum için ALTER / backfill örnekleri.
--
-- BÖLÜM 3 — İleride normalize modele (child table) geçiş — SQL taslağı + kod adımları.
--
-- Not: RLS/policy bu dosyada yok. Prod’da docs/supabase-admin-rls.sql vb. ile ayrıca
-- tanımlayın. Service role ile çalışan API route’lar RLS’ten muaf kalır.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- public.admin_users  — Admin panel girişi (e-posta + bcrypt şifre; Supabase Auth yok)
-- Şifre üret: node -e "console.log(require('bcryptjs').hashSync('PAROLAN', 12))"
-- .env: ADMIN_JWT_SECRET en az 24 karakter (JWT imzası)
-- -----------------------------------------------------------------------------

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_admin_users_email_lower on public.admin_users (lower(trim(email)));

-- -----------------------------------------------------------------------------
-- public.users  (isteğe bağlı; eski Firebase uid eşlemesi vb.)
-- -----------------------------------------------------------------------------

create table if not exists public.users (
  id text primary key,
  email text,
  is_admin boolean not null default false,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (email);

-- -----------------------------------------------------------------------------
-- public.bookings
--   Kod beklentisi: lib/bookingsSupabase.ts (SupabaseBookingRow) + insert’lerde
--   snake_case: time, meal_preference (jsonb), additional_travelers (jsonb), …
--   Durum: text — 'pending' | 'paid' | 'cancelled' | 'confirmed' (availability)
-- -----------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists updated_at timestamptz not null default now(),
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
  add column if not exists paid_now numeric,
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
  add column if not exists selected_extras jsonb,
  add column if not exists extras_total numeric,
  add column if not exists meal_preference jsonb,
  add column if not exists source text,
  add column if not exists access_token text,
  add column if not exists manual_source text,
  add column if not exists created_by_admin boolean,
  add column if not exists admin_note text,
  add column if not exists reference text,
  add column if not exists ui_locale text;

comment on column public.bookings.ui_locale is 'Rezervasyon sırasında site dili (tr|en|de); müşteri e-postası ve PDF';

-- Önerilen: token / reference aramaları için
create unique index if not exists idx_bookings_access_token_unique
  on public.bookings (access_token)
  where access_token is not null and length(trim(access_token)) > 0;

create unique index if not exists idx_bookings_reference_unique
  on public.bookings (reference)
  where reference is not null and length(trim(reference)) > 0;

create index if not exists idx_bookings_created_at on public.bookings (created_at desc);
create index if not exists idx_bookings_tour_date on public.bookings (tour_id, date);
create index if not exists idx_bookings_date on public.bookings (date);
create index if not exists idx_bookings_status on public.bookings (status);
create index if not exists idx_bookings_source on public.bookings (source, manual_source);
create index if not exists idx_bookings_class on public.bookings (class_id);
create index if not exists idx_bookings_customer_email on public.bookings (lower(customer_email));

-- -----------------------------------------------------------------------------
-- public.yacht_inquiries  (app/api/yacht-inquiry + admin/yacht-inquiries)
-- Aynı idempotent desen: tablo kabuğu + ALTER … ADD COLUMN IF NOT EXISTS
-- -----------------------------------------------------------------------------

create table if not exists public.yacht_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.yacht_inquiries
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists yacht_slug text,
  add column if not exists yacht_name text,
  add column if not exists location text,
  add column if not exists rental_type text default 'daily',
  add column if not exists date date,
  add column if not exists check_in date,
  add column if not exists check_out date,
  add column if not exists nights integer,
  add column if not exists guest_count integer,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists message text,
  add column if not exists price_from numeric,
  add column if not exists currency text,
  add column if not exists status text default 'new',
  add column if not exists source text default 'web',
  add column if not exists admin_note text,
  add column if not exists is_read boolean default false,
  add column if not exists read_at timestamptz,
  add column if not exists contacted_at timestamptz;

-- Yeni / boş tabloda NOT NULL ve CHECK’leri uygula (mevcut veride hata verirse
-- önce veriyi düzelt veya bu blokları yorum satırı yap).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'yacht_inquiries_rental_type_chk'
  ) then
    alter table public.yacht_inquiries
      add constraint yacht_inquiries_rental_type_chk
      check (rental_type is null or rental_type in ('daily', 'overnight'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'yacht_inquiries_overnight_chk'
  ) then
    alter table public.yacht_inquiries
      add constraint yacht_inquiries_overnight_chk check (
        (rental_type is distinct from 'overnight')
        or
        (rental_type = 'overnight' and check_in is not null and check_out is not null)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'yacht_inquiries_guest_chk'
  ) then
    alter table public.yacht_inquiries
      add constraint yacht_inquiries_guest_chk
      check (guest_count is null or (guest_count >= 1 and guest_count <= 120));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'yacht_inquiries_nights_chk'
  ) then
    alter table public.yacht_inquiries
      add constraint yacht_inquiries_nights_chk check (nights is null or nights >= 1);
  end if;
end $$;

create index if not exists idx_yacht_inquiries_created_at on public.yacht_inquiries (created_at desc);
create index if not exists idx_yacht_inquiries_status on public.yacht_inquiries (status);
create index if not exists idx_yacht_inquiries_is_read on public.yacht_inquiries (is_read);
create index if not exists idx_yacht_inquiries_date on public.yacht_inquiries (date);
create index if not exists idx_yacht_inquiries_email on public.yacht_inquiries (lower(email));

-- -----------------------------------------------------------------------------
-- updated_at tetikleyicisi (isteğe bağlı; kod zorunlu tutmaz)
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_bookings_set_updated_at on public.bookings;
create trigger trg_bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_yacht_inquiries_set_updated_at on public.yacht_inquiries;
create trigger trg_yacht_inquiries_set_updated_at
  before update on public.yacht_inquiries
  for each row execute function public.set_updated_at();


-- =============================================================================
-- BÖLÜM 2 — Yanlış taslağı (time_str, meal_preference_key/label, sadece child table)
-- mevcut uygulamaya çevirmek için örnek komutlar.
-- Aşağıdaki satırları yalnızca kendi şeman ne gerektiriyorsa çalıştır; hata alırsan
-- ilgili IF EXISTS / kolon adlarını düzelt.
-- =============================================================================
--
-- -- Saat kolonu yanlış adlandıysa:
-- alter table public.bookings add column if not exists time text;
-- update public.bookings set time = time_str where time is null and time_str is not null;
--
-- -- jsonb yemek tercihi eksikse, düz kolonlardan geri doldur:
-- alter table public.bookings add column if not exists meal_preference jsonb;
-- update public.bookings
--   set meal_preference = jsonb_build_object(
--     'key', meal_preference_key,
--     'label', meal_preference_label
--   )
-- where meal_preference is null
--   and meal_preference_key is not null
--   and meal_preference_label is not null;
--
-- -- Yolcular ayrı tablodayken uygulama hâlâ jsonb bekliyorsa — tek seferlik toplu json:
-- alter table public.bookings add column if not exists additional_travelers jsonb;
-- update public.bookings b
-- set additional_travelers = coalesce(sub.j, '[]'::jsonb)
-- from (
--   select
--     booking_id,
--     coalesce(
--       jsonb_agg(
--         jsonb_build_object(
--           'firstName', first_name,
--           'lastName', last_name,
--           'mealPreference', case
--             when meal_preference_key is not null and meal_preference_label is not null
--             then jsonb_build_object('key', meal_preference_key, 'label', meal_preference_label)
--             else null
--           end
--         )
--         order by sort_order, id
--       ) filter (where booking_id is not null),
--       '[]'::jsonb
--     ) as j
--   from public.booking_additional_travelers
--   group by booking_id
-- ) sub
-- where b.id = sub.booking_id
--   and (b.additional_travelers is null or b.additional_travelers = '[]'::jsonb);
--
-- =============================================================================
-- BÖLÜM 3 — Normalize hedef (ileride): booking_additional_travelers + opsiyonel düz
-- meal kolonları. Uygulama değişmeden ÖNCE jsonb’yi “source of truth” tutmaya devam
-- et; sonra aşağıdaki sırayı izle.
-- =============================================================================
--
-- Kod tarafı (özet checklist):
-- 1) lib/bookingsSupabase.ts / mapBookingRowToApi: önce child table’dan oku; yoksa
--    additional_travelers jsonb’ye düş (geçiş süresi için).
-- 2) app/api/bookings/route.ts POST insert: transaction içinde bookings + N satır
--    booking_additional_travelers (veya sadece child, jsonb’yi null bırak).
-- 3) app/api/admin/bookings/manual/route.ts: aynı transaction deseni.
-- 4) Admin liste / PATCH: zaten select('*'); yolcular için join veya RPC
--    (ör. get_booking_with_travelers)" eklenebilir.
-- 5) Birkaç gün / release sonra: jsonb additional_travelers’ı deprecated ilan et,
--    sadece migration backfill sonrası okuma yolunu kapat.
--
-- Örnek tablo (uygulama henüz kullanmıyor; yalnızca hedef):
--
-- create table if not exists public.booking_additional_travelers (
--   id uuid primary key default gen_random_uuid(),
--   booking_id uuid not null references public.bookings(id) on delete cascade,
--   sort_order integer not null default 0,
--   first_name text not null,
--   last_name text not null,
--   meal_preference_key text,
--   meal_preference_label text
-- );
-- create index if not exists idx_booking_additional_travelers_booking_id
--   on public.booking_additional_travelers (booking_id, sort_order);
--
-- İleri senkron (isteğe bağlı): INSERT/UPDATE sonrası jsonb’yi trigger ile türetmek
-- veya yalnızca uygulama katmanında çift yazmak — ikisinden birini seç; ikisi birden
-- drift üretebilir.

