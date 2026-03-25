-- =============================================
-- CarTracker Pro — Schéma SQL Supabase
-- Exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLE: clients
-- =============================================
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  phone         text,
  email         text,
  budget        integer,
  criteria      text,
  notes         text,
  billing_type  text not null default 'search',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients_select" on public.clients for select using (auth.uid() = user_id);
create policy "clients_insert" on public.clients for insert with check (auth.uid() = user_id);
create policy "clients_update" on public.clients for update using (auth.uid() = user_id);
create policy "clients_delete" on public.clients for delete using (auth.uid() = user_id);

-- =============================================
-- TABLE: client_notes
-- =============================================
create table if not exists public.client_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  client_id   uuid not null references public.clients(id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);

alter table public.client_notes enable row level security;

create policy "client_notes_select" on public.client_notes for select using (auth.uid() = user_id);
create policy "client_notes_insert" on public.client_notes for insert with check (auth.uid() = user_id);
create policy "client_notes_update" on public.client_notes for update using (auth.uid() = user_id);
create policy "client_notes_delete" on public.client_notes for delete using (auth.uid() = user_id);

-- =============================================
-- TABLE: listings
-- =============================================
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  client_id     uuid references public.clients(id) on delete set null,
  brand         text not null,
  model         text,
  generation    text,
  year          integer,
  km            integer,
  price         integer,
  fuel          text,
  gearbox       text,
  body          text,
  country       text,
  seller        text,
  first_owner   boolean not null default false,
  url           text,
  source        text,
  notes         text,
  status        text not null default 'new',
  tags          text[],
  auto_score    integer,
  manual_score  integer,
  horsepower    integer,
  color         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Si la table listings existe déjà, ajouter les nouvelles colonnes :
-- alter table public.listings add column if not exists horsepower integer;
-- alter table public.listings add column if not exists color text;

alter table public.listings enable row level security;

create policy "listings_select" on public.listings for select using (auth.uid() = user_id);
create policy "listings_insert" on public.listings for insert with check (auth.uid() = user_id);
create policy "listings_update" on public.listings for update using (auth.uid() = user_id);
create policy "listings_delete" on public.listings for delete using (auth.uid() = user_id);

-- Index pour la performance
create index if not exists listings_user_id_idx on public.listings(user_id);
create index if not exists listings_client_id_idx on public.listings(client_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_created_at_idx on public.listings(created_at desc);

-- =============================================
-- TABLE: listing_margins
-- =============================================
create table if not exists public.listing_margins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  listing_id    uuid not null unique references public.listings(id) on delete cascade,
  buy_price     integer,
  transport     integer not null default 0,
  repair        integer not null default 0,
  ct_cost       integer not null default 80,
  registration  integer not null default 300,
  other_costs   integer not null default 0,
  sell_price    integer,
  total_cost    integer,
  margin        integer,
  created_at    timestamptz not null default now()
);

alter table public.listing_margins enable row level security;

create policy "listing_margins_select" on public.listing_margins for select using (auth.uid() = user_id);
create policy "listing_margins_insert" on public.listing_margins for insert with check (auth.uid() = user_id);
create policy "listing_margins_update" on public.listing_margins for update using (auth.uid() = user_id);
create policy "listing_margins_delete" on public.listing_margins for delete using (auth.uid() = user_id);

-- =============================================
-- TABLE: listing_checklist
-- =============================================
create table if not exists public.listing_checklist (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  listing_id        uuid not null unique references public.listings(id) on delete cascade,
  ct_ok             boolean not null default false,
  carnet_ok         boolean not null default false,
  histovec_ok       boolean not null default false,
  owners_ok         boolean not null default false,
  no_sinistres      boolean not null default false,
  test_drive        boolean not null default false,
  mecanique_ok      boolean not null default false,
  carrosserie_ok    boolean not null default false,
  pneus_ok          boolean not null default false,
  papiers_ok        boolean not null default false,
  no_gage           boolean not null default false,
  price_negotiated  boolean not null default false,
  notes             text,
  created_at        timestamptz not null default now()
);

alter table public.listing_checklist enable row level security;

create policy "listing_checklist_select" on public.listing_checklist for select using (auth.uid() = user_id);
create policy "listing_checklist_insert" on public.listing_checklist for insert with check (auth.uid() = user_id);
create policy "listing_checklist_update" on public.listing_checklist for update using (auth.uid() = user_id);
create policy "listing_checklist_delete" on public.listing_checklist for delete using (auth.uid() = user_id);

-- =============================================
-- TABLE: saved_searches
-- =============================================
create table if not exists public.saved_searches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  query       text not null,
  created_at  timestamptz not null default now()
);

alter table public.saved_searches enable row level security;

create policy "saved_searches_select" on public.saved_searches for select using (auth.uid() = user_id);
create policy "saved_searches_insert" on public.saved_searches for insert with check (auth.uid() = user_id);
create policy "saved_searches_update" on public.saved_searches for update using (auth.uid() = user_id);
create policy "saved_searches_delete" on public.saved_searches for delete using (auth.uid() = user_id);

-- =============================================
-- TABLE: price_history
-- =============================================
create table if not exists public.price_history (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  price       integer,
  recorded_at timestamptz not null default now()
);

-- Pas de RLS user_id sur price_history — accès via listing_id (inherited via listings RLS)
-- Si besoin d'un accès direct sécurisé, ajouter user_id et RLS

-- =============================================
-- FONCTION: updated_at automatique
-- =============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.handle_updated_at();

-- =============================================
-- TABLE: listing_photos
-- =============================================
create table if not exists public.listing_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  url         text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.listing_photos enable row level security;

create policy "listing_photos_select" on public.listing_photos for select using (auth.uid() = user_id);
create policy "listing_photos_insert" on public.listing_photos for insert with check (auth.uid() = user_id);
create policy "listing_photos_update" on public.listing_photos for update using (auth.uid() = user_id);
create policy "listing_photos_delete" on public.listing_photos for delete using (auth.uid() = user_id);

create index if not exists listing_photos_listing_id_idx on public.listing_photos(listing_id);

-- Storage bucket (à créer manuellement dans Supabase Dashboard > Storage)
-- Bucket name: listing-photos
-- Public: true
-- Allowed MIME types: image/*
