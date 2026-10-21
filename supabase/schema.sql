-- 玄藏 Atelier Noir — independent schema. Do not run against other projects.

create table if not exists admin (
  id int primary key default 1 check (id = 1),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists staff (
  id text primary key,
  display_name text not null,
  role text not null,
  line_url text not null default '',
  line_id text not null default '',
  note text not null default '',
  line_user_id text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cars (
  id text primary key,
  slug text unique not null,
  make text not null,
  make_en text not null default '',
  model text not null,
  year int not null,
  price bigint not null,
  mileage int not null default 0,
  color text not null default '',
  interior text not null default '',
  engine text not null default '',
  horsepower int not null default 0,
  transmission text not null default '',
  drivetrain text not null default '',
  options jsonb not null default '[]'::jsonb,
  story text not null default '',
  status text not null default 'available',
  published boolean not null default false,
  featured boolean not null default false,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table admin enable row level security;
alter table staff enable row level security;
alter table cars enable row level security;

drop policy if exists staff_public_read on staff;
create policy staff_public_read on staff for select using (true);

drop policy if exists cars_public_read on cars;
create policy cars_public_read on cars for select using (published = true);

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
