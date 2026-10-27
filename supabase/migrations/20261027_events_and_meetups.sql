-- =========================================================================
-- ZOFTCORP CMS: EVENTS & MEETUPS SCHEMA MIGRATION
-- Safe, repeatable migration for Technical Sessions, Webinars & Community Meetups.
-- Preserves all existing blog posts, partners, reviews, categories, tags, and admin users.
-- =========================================================================

-- 1. ENSURE BASE HELPER FUNCTIONS EXIST IDEMPOTENTLY
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

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. EVENTS TABLE
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  event_date timestamptz not null,
  location text,
  event_type text default 'meetup',
  registration_url text,
  recording_url text,
  photos text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Performance & Query Indexes for Events
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_event_date on public.events(event_date desc);
create index if not exists idx_events_updated_at on public.events(updated_at desc);

-- 3. DEDICATED updated_at TRIGGER
drop trigger if exists trigger_events_updated_at on public.events;
create trigger trigger_events_updated_at
  before update on public.events
  for each row
  execute function public.set_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.events enable row level security;

-- Events RLS:
-- Public visitors (e.g. main website) can read published events only
drop policy if exists "Public can view published events" on public.events;
create policy "Public can view published events"
  on public.events for select
  using (status = 'published');

-- Authorized administrators can view all events (both drafts and published)
drop policy if exists "Admins can view all events" on public.events;
create policy "Admins can view all events"
  on public.events for select
  using (public.is_admin());

-- Only verified administrators can insert, update, or delete events
drop policy if exists "Admins can create events" on public.events;
create policy "Admins can create events"
  on public.events for insert
  with check (public.is_admin());

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
  on public.events for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
  on public.events for delete
  using (public.is_admin());

-- 5. EVENT IMAGES STORAGE BUCKET CONFIGURATION
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policies for 'event-images' bucket:
drop policy if exists "Public read event images" on storage.objects;
create policy "Public read event images"
  on storage.objects for select
  using (bucket_id = 'event-images');

drop policy if exists "Admins can upload event images" on storage.objects;
create policy "Admins can upload event images"
  on storage.objects for insert
  with check (bucket_id = 'event-images' and public.is_admin());

drop policy if exists "Admins can update event images" on storage.objects;
create policy "Admins can update event images"
  on storage.objects for update
  using (bucket_id = 'event-images' and public.is_admin());

drop policy if exists "Admins can delete event images" on storage.objects;
create policy "Admins can delete event images"
  on storage.objects for delete
  using (bucket_id = 'event-images' and public.is_admin());
