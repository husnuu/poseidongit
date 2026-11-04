-- Run in Supabase SQL Editor
-- Instagram erişim token'ı: site 60 günlük token'ı haftada bir kendisi yeniler ve buraya yazar.
create table if not exists public.integration_tokens (
  key text primary key,
  token text not null,
  refreshed_at timestamptz not null default now()
);

-- Yalnızca sunucu (service role) erişir; token herkese açık anahtarla okunamaz.
alter table public.integration_tokens enable row level security;
revoke all on public.integration_tokens from anon, authenticated;
