# Supabase Setup & Backend Configuration Guide

This guide walks you through connecting **Zoftcorp Admin Portal** to Supabase PostgreSQL database, Authentication, and Storage.

---

## 1. Prerequisites

1. A Supabase account at [https://supabase.com](https://supabase.com)
2. A new or existing Supabase project (e.g. `zoftcorp-backend`)

---

## 2. Step 1: Run the Database Migrations

Open your Supabase project dashboard, navigate to **SQL Editor**, click **New Query**, and paste the contents of:

📁 `supabase/migrations/20261014_init_blog_schema.sql`

Click **Run**. This script will:
- Enable the `uuid-ossp` extension.
- Create the `admin_users` table with email, user_id, role, and timestamps.
- Create the `posts` table with title, slug, excerpt, content, featured image, category, status, SEO title, SEO description, reading time, and author metadata.
- Create performance indexes on `slug`, `status`, `category_slug`, and `updated_at`.
- Attach an automatic `updated_at` trigger.
- Create the `is_admin()` security definer function.
- Enable Row Level Security (RLS) on both tables:
  - **Public Read**: Anyone can read posts where `status = 'published'` (preparing for the main website integration).
  - **Private Drafts**: Only verified admins can view, create, edit, or delete draft posts.
  - **Admin Enforcement**: Only verified administrators can insert, update, or delete posts.
- Configure the `blog-images` storage bucket and its RLS policies.

---

## 3. Step 2: Create the Initial Administrator User

Per the project requirements, **public self-registration is permanently disabled**. Only explicitly authorized administrators can access the admin portal.

### A. Create the Auth User in Supabase
1. In your Supabase Dashboard, go to **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter the administrator's email and a secure password (e.g. `admin@zoftcorp.com`).
4. Click **Create User**.
5. Copy the generated **User UID** (a UUID like `1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d`).

### B. Whitelist the User in `admin_users` Table
Go to the **SQL Editor** in Supabase and run the following query, replacing `<USER_UID>` with the actual UUID copied in the previous step:

```sql
INSERT INTO public.admin_users (user_id, email, full_name, role)
VALUES (
  '<USER_UID>',
  'admin@zoftcorp.com',
  'Primary Administrator',
  'superadmin'
)
ON CONFLICT (user_id) DO NOTHING;
```

> **Note:** If an authenticated user attempts to log in without being present in `admin_users`, the portal will reject the session and display: *"Access denied: This account is not an authorized administrator."*

---

## 4. Step 3: Configure Storage Bucket

The SQL migration automatically creates the `blog-images` bucket. To verify in your Supabase dashboard:
1. Navigate to **Storage** -> **Buckets**.
2. Confirm `blog-images` exists and is marked as **Public Bucket**.
3. Under **Policies**, confirm:
   - `Public read blog images` is enabled for `SELECT`.
   - `Admins can upload blog images` is enabled for `INSERT`.
   - `Admins can delete blog images` is enabled for `DELETE`.

---

## 5. Step 4: Configure Local Environment Variables

1. In Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy your:
   - **Project URL** (e.g., `https://abcdefghijklm.supabase.co`)
   - **anon public API key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
3. Open or create `zoftcorp-admin-portal/.env.local` and add the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
```

4. Restart your development server:
```bash
npm run dev
```

---

## 6. Step 5: (Optional) Seed Sample Posts

To populate the admin portal with realistic initial posts matching Zoftcorp's existing website content:
1. Open the Supabase **SQL Editor**.
2. Run the script in:
   📁 `supabase/seed.sql`
3. This creates initial published and draft articles across *Database Administration*, *SQL Server*, and *Azure / Cloud*.

---

## 7. Architecture for Phase 2 Integration

The existing Zoftcorp main website (`../zoftcorp-website`) will later read published blog posts from this same database.

### Integration Principles:
- **Shared Backend**: Both projects use the same Supabase project URL and anon public key.
- **Row Level Security**: The main website's client queries `supabase.from('posts').select('*').eq('status', 'published')`. Private drafts and admin tables are automatically protected at the database level by PostgreSQL RLS.
- **Stable Slugs**: The admin editor enforces unique, URL-safe slugs that map 1:1 to `/blog-2/[slug]` routes.
- **Image URLs**: Uploaded images are stored in the public `blog-images` bucket and served via Supabase's global CDN.
