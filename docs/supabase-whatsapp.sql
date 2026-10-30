-- Run in Supabase SQL Editor (bir kez).
-- WhatsApp bildirimleri: gönderim kaydı + rezervasyondaki WhatsApp izni.
-- Bkz. docs/WHATSAPP_KURULUM.md

create extension if not exists pgcrypto;

-- Rezervasyon formundaki "WhatsApp ile bildirim" kutusu.
alter table public.bookings
  add column if not exists whatsapp_opt_in boolean;

-- Her rezervasyon + mesaj türü için tek satır: aynı hatırlatmanın iki kez
-- gitmesini engeller, admin panelinde gönderim geçmişi olarak görünür.
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  kind text not null,            -- confirmation | reminder_24h | reminder_2h | disruption:<id> | test:… | confirmation:resend:…
  to_phone text,
  template text,
  language text,
  status text not null default 'pending',  -- pending | sent | delivered | read | failed | skipped
  wa_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists whatsapp_messages_booking_kind_uniq
  on public.whatsapp_messages (booking_id, kind)
  where booking_id is not null;

create index if not exists whatsapp_messages_wa_id_idx
  on public.whatsapp_messages (wa_message_id);

create index if not exists whatsapp_messages_created_idx
  on public.whatsapp_messages (created_at desc);

-- Yalnızca sunucu (service role) erişir; tarayıcıdan okunamaz.
alter table public.whatsapp_messages enable row level security;
