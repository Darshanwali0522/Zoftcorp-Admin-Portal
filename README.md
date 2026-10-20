# Zoftcorp Admin Portal (Phase 1)

Private administration portal for managing technical blog posts, insights, drafts, categories, and SEO metadata for the Zoftcorp website.

## Technology Stack

- **Framework**: Next.js (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth (with explicit Admin Authorization Table & RLS)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (`blog-images` bucket)
- **Icons**: Lucide React

## Features Implemented

### 1. Admin Login & Authorization
- Clean, focused login interface (`/login`).
- Explicit admin verification: Only accounts present in the `admin_users` table can log in.
- No public self-registration.
- Session handling with route protection via Next.js middleware.
- Graceful detection of unconfigured environment variables with setup instructions.

### 2. Admin Dashboard
- Live metrics overview:
  - Total blog posts
  - Published articles count
  - Draft articles count
  - Categories count
- Recent posts activity feed with status badges and quick edit actions.
- Persistent sidebar navigation: Dashboard, All Posts, Create Blog, and Logout.
- Quick "Create New Blog" button.

### 3. Create & Edit Blogs
- Full-featured blog editor (`/dashboard/posts/new` and `/dashboard/posts/[id]/edit`):
  - Blog title with real-time auto-slug generator (with manual edit lock/toggle).
  - Featured image upload directly to Supabase Storage with preview and replacement options.
  - Article excerpt textarea with recommended character count.
  - Multi-tab Rich Text Editor: Visual WYSIWYG mode (bold, italic, headings, lists, quotes, code blocks, dividers, links) + HTML Source mode + Live rendered Preview.
  - Category selector aligned with Zoftcorp website categories.
  - Publication status: **Draft (Private)** vs. **Published (Live)**.
  - Google-style SEO search result preview, custom SEO title, and meta description.
  - Form validation with clear error alerts.

### 4. Posts Management
- Filterable and searchable post table (`/dashboard/posts`):
  - Search by title, excerpt, or category.
  - Filter by status (**All**, **Published**, **Drafts**).
  - Filter by category.
  - Explicit delete confirmation modal (prevents accidental or silent data loss).
  - Distinct status badges (emerald for published, amber for drafts).

### 5. Supabase Database & Storage
- SQL migrations in `supabase/migrations/20261014_init_blog_schema.sql`.
- Row Level Security (RLS) configured:
  - Public visitors can only query published posts.
  - Drafts are invisible to unauthenticated visitors.
  - Insert, update, and delete restricted to verified administrators.
- `blog-images` storage bucket configured for secure upload and CDN delivery.
- Seed data script in `supabase/seed.sql`.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for full instructions on applying migrations and creating your first admin user.

### 3. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the admin portal.

### 4. Build for Production
```bash
npm run build
```
