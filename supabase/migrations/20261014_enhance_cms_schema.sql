-- =========================================================================
-- ZOFTCORP BLOG CMS ENHANCEMENT SCHEMA MIGRATION
-- Adds normalized categories, tags, and extended SEO/OG/Schema.org fields.
-- Preserves 100% of existing posts, drafts, and data.
-- =========================================================================

-- 1. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast category lookups
create index if not exists idx_categories_slug on public.categories(slug);

-- 2. TAGS TABLE
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tags_slug on public.tags(slug);

-- 3. EXTEND POSTS TABLE WITH OPEN GRAPH, CANONICAL & STRUCTURED DATA FIELDS
alter table public.posts
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image text,
  add column if not exists canonical_url text,
  add column if not exists schema_type text default 'Article';

-- 4. MIGRATE & POPULATE EXISTING CATEGORIES
insert into public.categories (name, slug, description)
values
  ('Database Administration', 'database-administration', 'Enterprise database architecture, failover clusters, and high-availability operations.'),
  ('SQL Server', 'sql-server', 'Deep-dive T-SQL queries, storage management, and index optimizations.'),
  ('Azure / Cloud', 'cloud-migrations', 'Cloud migrations, Azure SQL Managed Instance, and hybrid data platforms.'),
  ('Performance Tuning', 'performance-tuning', 'Query tuning, wait stats, execution plan analysis, and bottleneck resolution.'),
  ('Data Engineering', 'data-engineering', 'Data pipelines, warehousing, ETL architectures, and modern data platforms.')
on conflict (slug) do update set
  description = excluded.description;

-- Also pull any custom categories already in posts
insert into public.categories (name, slug, description)
select distinct category, category_slug, 'Articles and guides filed under ' || category
from public.posts
where category is not null and category != ''
on conflict (slug) do nothing;

-- 5. MIGRATE & POPULATE EXISTING TAGS FROM POSTS
insert into public.tags (name, slug)
select distinct tag, lower(regexp_replace(trim(tag), '[^a-zA-Z0-9]+', '-', 'g'))
from (
  select unnest(tags) as tag from public.posts
) t
where tag is not null and trim(tag) != ''
on conflict (name) do nothing;

-- 6. ENABLE ROW LEVEL SECURITY
alter table public.categories enable row level security;
alter table public.tags enable row level security;

-- Public can view categories and tags
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories"
  on public.categories for select
  using (true);

drop policy if exists "Public can view tags" on public.tags;
create policy "Public can view tags"
  on public.tags for select
  using (true);

-- Admins have full management permissions
drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
  on public.categories for insert
  with check (public.is_admin());

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
  on public.categories for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
  on public.categories for delete
  using (public.is_admin());

drop policy if exists "Admins can insert tags" on public.tags;
create policy "Admins can insert tags"
  on public.tags for insert
  with check (public.is_admin());

drop policy if exists "Admins can update tags" on public.tags;
create policy "Admins can update tags"
  on public.tags for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete tags" on public.tags;
create policy "Admins can delete tags"
  on public.tags for delete
  using (public.is_admin());
