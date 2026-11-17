-- SOLISIA BAY orders. Run once in the Supabase SQL editor.
-- This project shares the Supabase project with Radiant; every object is prefixed `solisia_`
-- so nothing collides with `radiant_store` or other apps.

create table if not exists public.solisia_orders (
  code text primary key,
  token text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null,
  total numeric(10, 2) not null,
  currency text not null default 'USD',
  email text not null,
  customer_name text not null,
  phone text not null default '',
  address jsonb not null default '{}'::jsonb,
  creem_checkout_id text,
  creem_order_id text,
  amount_paid_cents integer,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists solisia_orders_status_idx on public.solisia_orders (status, created_at desc);
create index if not exists solisia_orders_email_idx on public.solisia_orders (lower(email));

-- Only the server (service role key) touches this table.
alter table public.solisia_orders enable row level security;
