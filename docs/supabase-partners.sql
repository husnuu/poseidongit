-- Run in Supabase SQL Editor
-- Partner sistemi (otel/pansiyon/acente): /p/[slug] mini sayfa, /partner paneli, komisyon takibi.
-- Tekrar çalıştırılabilir. Kurulum: docs/PARTNER_KURULUM.md

create extension if not exists pgcrypto;

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- QR kodlara basılır: oluşturulduktan sonra değiştirilmez.
  slug text not null unique,
  name text not null,
  partner_type text not null default 'hotel',
  email text not null unique,
  password_hash text not null,
  password_changed_at timestamptz not null default now(),
  commission_rate numeric(5,2) not null default 10 check (commission_rate >= 0 and commission_rate <= 100),
  -- Küçültülmüş logo (data:image/...;base64) — ayrı depolama gerektirmez.
  logo_data text,
  welcome_message text,
  contact_name text,
  contact_phone text,
  admin_note text,
  is_active boolean not null default true
);

comment on column public.partners.partner_type is 'hotel | pension | agency | other';
comment on column public.partners.commission_rate is 'Yüzde. Yeni rezervasyonlara uygulanır; eskiler bookings.partner_commission_rate ile sabit kalır.';

create table if not exists public.partner_payouts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  amount numeric not null,
  note text,
  unique (partner_id, period)
);

comment on table public.partner_payouts is 'Aylık komisyon ödemeleri; period = tur tarihinin ayı (YYYY-MM).';

alter table public.bookings
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists partner_commission_rate numeric(5,2),
  add column if not exists partner_channel text;

comment on column public.bookings.partner_commission_rate is 'Rezervasyon anındaki oran; partnerin oranı değişse de eski kayıtlar etkilenmez.';
comment on column public.bookings.partner_channel is 'qr | link | reception';

create index if not exists bookings_partner_id_idx on public.bookings (partner_id) where partner_id is not null;

-- Yalnızca sunucu (service role) erişir: politika tanımlanmadığı için anon/authenticated
-- anahtarlarıyla bu tablolar okunamaz. password_hash burada tutulduğu için kapatmayın.
alter table public.partners enable row level security;
alter table public.partner_payouts enable row level security;
revoke all on public.partners from anon, authenticated;
revoke all on public.partner_payouts from anon, authenticated;
