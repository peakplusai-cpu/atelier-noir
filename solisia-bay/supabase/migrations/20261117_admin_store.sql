-- SOLISIA BAY admin catalog, coupons, wall, and checkout extras.
-- Safe to run more than once. Does not read or write radiant_* objects.
-- Run this whole file in the Supabase SQL editor.

create table if not exists public.solisia_store (
  id int primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.solisia_store (id)
values (1)
on conflict (id) do nothing;

alter table public.solisia_store enable row level security;
revoke all on table public.solisia_store from anon, authenticated;

alter table public.solisia_orders
  add column if not exists meta jsonb not null default '{}'::jsonb;

insert into storage.buckets (id, name, public)
values ('solisia-uploads', 'solisia-uploads', true)
on conflict (id) do nothing;
