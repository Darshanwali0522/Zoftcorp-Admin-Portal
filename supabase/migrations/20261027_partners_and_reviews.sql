-- =========================================================================
-- ZOFTCORP CMS: PARTNERSHIPS & CLIENT REVIEWS SCHEMA MIGRATION
-- Safe, repeatable migration for Partner Ecosystems and Verified Client Reviews.
-- Preserves all existing blog posts, categories, tags, and admin users.
-- =========================================================================

-- 1. PARTNERS TABLE
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  details text,
  logo_url text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Performance & Query Indexes for Partners
create index if not exists idx_partners_slug on public.partners(slug);
create index if not exists idx_partners_status on public.partners(status);
create index if not exists idx_partners_updated_at on public.partners(updated_at desc);

-- 2. CLIENT REVIEWS TABLE
create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  company_name text,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Performance & Query Indexes for Client Reviews
create index if not exists idx_client_reviews_status on public.client_reviews(status);
create index if not exists idx_client_reviews_rating on public.client_reviews(rating);
create index if not exists idx_client_reviews_updated_at on public.client_reviews(updated_at desc);

-- 3. DEDICATED updated_at TRIGGER FUNCTION
-- Uses a clean, generic function for tables that do not have a published_at column.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_partners_updated_at on public.partners;
create trigger trigger_partners_updated_at
  before update on public.partners
  for each row
  execute function public.set_updated_at();

drop trigger if exists trigger_client_reviews_updated_at on public.client_reviews;
create trigger trigger_client_reviews_updated_at
  before update on public.client_reviews
  for each row
  execute function public.set_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.partners enable row level security;
alter table public.client_reviews enable row level security;

-- Partners RLS:
-- Public visitors (e.g. main website) can read published partner records only
drop policy if exists "Public can view published partners" on public.partners;
create policy "Public can view published partners"
  on public.partners for select
  using (status = 'published');

-- Authorized administrators can view all partner records (both drafts and published)
drop policy if exists "Admins can view all partners" on public.partners;
create policy "Admins can view all partners"
  on public.partners for select
  using (public.is_admin());

-- Only verified administrators can insert, update, or delete partners
drop policy if exists "Admins can create partners" on public.partners;
create policy "Admins can create partners"
  on public.partners for insert
  with check (public.is_admin());

drop policy if exists "Admins can update partners" on public.partners;
create policy "Admins can update partners"
  on public.partners for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete partners" on public.partners;
create policy "Admins can delete partners"
  on public.partners for delete
  using (public.is_admin());

-- Client Reviews RLS:
-- Public visitors can read published client reviews only
drop policy if exists "Public can view published reviews" on public.client_reviews;
create policy "Public can view published reviews"
  on public.client_reviews for select
  using (status = 'published');

-- Authorized administrators can view all client reviews
drop policy if exists "Admins can view all reviews" on public.client_reviews;
create policy "Admins can view all reviews"
  on public.client_reviews for select
  using (public.is_admin());

-- Only verified administrators can insert, update, or delete reviews
drop policy if exists "Admins can create reviews" on public.client_reviews;
create policy "Admins can create reviews"
  on public.client_reviews for insert
  with check (public.is_admin());

drop policy if exists "Admins can update reviews" on public.client_reviews;
create policy "Admins can update reviews"
  on public.client_reviews for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete reviews" on public.client_reviews;
create policy "Admins can delete reviews"
  on public.client_reviews for delete
  using (public.is_admin());

-- 5. PARTNER LOGOS STORAGE BUCKET CONFIGURATION
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-logos',
  'partner-logos',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Storage Policies for 'partner-logos' bucket:
drop policy if exists "Public read partner logos" on storage.objects;
create policy "Public read partner logos"
  on storage.objects for select
  using (bucket_id = 'partner-logos');

drop policy if exists "Admins can upload partner logos" on storage.objects;
create policy "Admins can upload partner logos"
  on storage.objects for insert
  with check (bucket_id = 'partner-logos' and public.is_admin());

drop policy if exists "Admins can update partner logos" on storage.objects;
create policy "Admins can update partner logos"
  on storage.objects for update
  using (bucket_id = 'partner-logos' and public.is_admin());

drop policy if exists "Admins can delete partner logos" on storage.objects;
create policy "Admins can delete partner logos"
  on storage.objects for delete
  using (bucket_id = 'partner-logos' and public.is_admin());

-- 6. SEED THE FOUR INITIAL OFFICIAL PARTNERS SAFELY (IDEMPOTENT)
-- Matches approved partner ecosystems from Zoftcorp website.
-- Preserves existing records and avoids duplicates via ON CONFLICT (slug) DO NOTHING.
insert into public.partners (name, slug, description, details, logo_url, status)
values
  (
    'AWS',
    'aws',
    'ZOFT''s work across AWS environments.',
    'Designing, modernizing, and optimizing AWS cloud architecture, database workloads, data engineering pipelines, and operational resilience.',
    '/platforms/aws.svg',
    'published'
  ),
  (
    'Microsoft Azure',
    'azure',
    'ZOFT''s work across Microsoft Azure environments.',
    'Architecting and managing enterprise Microsoft Azure environments, SQL Server workloads, data platforms, and cloud infrastructure optimization.',
    '/platforms/azure.svg',
    'published'
  ),
  (
    'Google Cloud Platform',
    'gcp',
    'ZOFT''s work across Google Cloud environments.',
    'Leveraging Google Cloud infrastructure for analytical workloads, vector database integration, modern data pipelines, and scalable cloud services.',
    '/platforms/gcp.svg',
    'published'
  ),
  (
    'Oracle',
    'oracle',
    'ZOFT''s work across Oracle environments.',
    'Deep technical advisory, database administration, high-availability architecture, and performance tuning across enterprise Oracle environments.',
    '/platforms/oracle.svg',
    'published'
  )
on conflict (slug) do nothing;
