-- Supabase SQL Editor'da bir kere çalıştır.
-- Auth (auth.users) Supabase tarafından hazır geliyor; email/password.

create extension if not exists "pgcrypto";

-- === ALBÜMLER ===
create table if not exists albums (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  slug          text not null unique,
  cover_message text,
  created_at    timestamptz not null default now()
);

create index if not exists albums_user_id_idx on albums (user_id, created_at desc);
create index if not exists albums_slug_idx on albums (slug);

alter table albums enable row level security;

-- Sahibi kendi albümlerini görebilir, oluşturabilir, silebilir, güncelleyebilir.
create policy "own albums read" on albums
  for select using (auth.uid() = user_id);
create policy "own albums insert" on albums
  for insert with check (auth.uid() = user_id);
create policy "own albums update" on albums
  for update using (auth.uid() = user_id);
create policy "own albums delete" on albums
  for delete using (auth.uid() = user_id);

-- Public: sadece slug ile temel bilgi okuma (yükleme sayfası için).
create policy "public slug read" on albums
  for select using (true);
-- Yukarıdaki policy tüm kolonları erişilebilir yapar — hassas alan yok (name, slug, cover_message).
-- user_id de görünür ama önemi yok.

-- === YÜKLEMELER ===
create table if not exists uploads (
  id           uuid primary key default gen_random_uuid(),
  album_id     uuid not null references albums(id) on delete cascade,
  uploader     text,
  file_name    text not null,
  file_size    bigint not null,
  mime_type    text not null,
  r2_key       text not null unique,
  kind         text not null check (kind in ('image','video','other')),
  ip_hash      text,
  created_at   timestamptz not null default now()
);

create index if not exists uploads_album_id_idx on uploads (album_id, created_at desc);
create index if not exists uploads_ip_hash_idx on uploads (ip_hash, created_at desc);

alter table uploads enable row level security;

-- Sahibi kendi albümündeki yüklemeleri görebilir + silebilir.
create policy "album owner reads uploads" on uploads
  for select using (
    exists (select 1 from albums a where a.id = uploads.album_id and a.user_id = auth.uid())
  );
create policy "album owner deletes uploads" on uploads
  for delete using (
    exists (select 1 from albums a where a.id = uploads.album_id and a.user_id = auth.uid())
  );
-- Insert sadece service_role (server API) tarafından yapılır — RLS bypass.
