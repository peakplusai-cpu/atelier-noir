-- SOLISIA BAY orders. Run once in the Supabase SQL editor.
-- This project shares the Supabase project with Radiant; every object is prefixed `solisia_`
-- so nothing collides with `radiant_store` or other apps.

create table if not exists public.solisia_orders (
  code text primary key,
  token text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'completed', 'failed', 'cancelled', 'review')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null,
  total numeric(10, 2) not null,
  currency text not null default 'USD',
  email text not null,
  customer_name text not null,
  phone text not null default '',
  address jsonb not null default '{}'::jsonb,
  payment_order_id text,
  payment_capture_id text,
  amount_paid_cents integer,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists solisia_orders_status_idx on public.solisia_orders (status, created_at desc);
create index if not exists solisia_orders_email_idx on public.solisia_orders (lower(email));

-- Only the server (service role key) touches this table.
alter table public.solisia_orders enable row level security;

-- Staff login. One row: the signing secret plus the password hash set on first visit to /admin.
create table if not exists public.solisia_staff (
  id int primary key check (id = 1),
  password_hash text,
  secret text not null,
  created_at timestamptz not null default now()
);

alter table public.solisia_staff enable row level security;

-- Re-run this block on an existing database so `review` (payment needs a manual check) is allowed.
alter table public.solisia_orders drop constraint if exists solisia_orders_status_check;
alter table public.solisia_orders
  add constraint solisia_orders_status_check
  check (status in ('pending', 'paid', 'shipped', 'completed', 'failed', 'cancelled', 'review'));

-- Catalog, coupons, wall, settings, and order meta. Same statements as
-- supabase/migrations/20261117_admin_store.sql.
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
