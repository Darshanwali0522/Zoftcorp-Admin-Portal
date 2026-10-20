-- =========================================================================
-- ZOFTCORP BLOG DATABASE SCHEMA & ROW LEVEL SECURITY (PHASE 1)
-- =========================================================================

-- 1. Enable UUID Extension (standard in PostgreSQL / Supabase)
create extension if not exists "uuid-ossp";

-- 2. ADMIN USERS TABLE
-- Tracks explicitly authorized administrator accounts.
-- Public self-registration is disabled; administrators must have their auth.users id
-- listed here to log in and manage content.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  email text not null unique,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);

-- Index on user_id for fast lookup
create index if not exists idx_admin_users_user_id on public.admin_users(user_id);
create index if not exists idx_admin_users_email on public.admin_users(email);

-- 3. POSTS TABLE
-- Stores blog posts, drafts, SEO metadata, and category tagging.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  featured_image text,
  category text not null default 'General',
  category_slug text not null default 'general',
  tags text[] not null default array[]::text[],
  status text not null default 'draft' check (status in ('draft', 'published')),
  seo_title text,
  seo_description text,
  reading_time text default '3 min read',
  featured boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- Indexes for performance & query optimization
create index if not exists idx_posts_slug on public.posts(slug);
create index if not exists idx_posts_status on public.posts(status);
create index if not exists idx_posts_category_slug on public.posts(category_slug);
create index if not exists idx_posts_updated_at on public.posts(updated_at desc);
create index if not exists idx_posts_published_at on public.posts(published_at desc);

-- 4. AUTOMATIC updated_at TRIGGER
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  -- If post is being published and published_at is null, set published_at
  if new.status = 'published' and (old.status is null or old.status != 'published') and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_posts_updated_at on public.posts;
create trigger trigger_posts_updated_at
  before update on public.posts
  for each row
  execute function public.handle_updated_at();

-- 5. ADMIN VERIFICATION FUNCTION (SECURITY DEFINER)
-- Checks whether current authenticated user exists in admin_users table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.admin_users enable row level security;
alter table public.posts enable row level security;

-- Admin Users Policies:
-- Only authenticated admins or the user themselves can view their admin record
drop policy if exists "Admins can view admin_users" on public.admin_users;
create policy "Admins can view admin_users"
  on public.admin_users
  for select
  using (auth.uid() = user_id or public.is_admin());

-- Posts Policies:
-- 1) Public read policy for published posts:
--    Allows the main Zoftcorp website (or any public visitor) to read ONLY published posts.
--    Private drafts are strictly hidden from unauthenticated public visitors.
drop policy if exists "Public can view published posts" on public.posts;
create policy "Public can view published posts"
  on public.posts
  for select
  using (status = 'published');

-- 2) Admin read policy:
--    Authorized admins can view ALL posts (both drafts and published).
drop policy if exists "Admins can view all posts" on public.posts;
create policy "Admins can view all posts"
  on public.posts
  for select
  using (public.is_admin());

-- 3) Admin insert policy:
drop policy if exists "Admins can create posts" on public.posts;
create policy "Admins can create posts"
  on public.posts
  for insert
  with check (public.is_admin());

-- 4) Admin update policy:
drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
  on public.posts
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 5) Admin delete policy:
drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
  on public.posts
  for delete
  using (public.is_admin());

-- 7. SUPABASE STORAGE BUCKET CONFIGURATION
-- Create public bucket 'blog-images' for storing featured images and assets.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage Policies:
-- Anyone can view uploaded blog images (needed for published blogs)
drop policy if exists "Public read blog images" on storage.objects;
create policy "Public read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Only verified admins can upload, modify, or delete images in 'blog-images'
drop policy if exists "Admins can upload blog images" on storage.objects;
create policy "Admins can upload blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "Admins can update blog images" on storage.objects;
create policy "Admins can update blog images"
  on storage.objects for update
  using (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "Admins can delete blog images" on storage.objects;
create policy "Admins can delete blog images"
  on storage.objects for delete
  using (bucket_id = 'blog-images' and public.is_admin());
