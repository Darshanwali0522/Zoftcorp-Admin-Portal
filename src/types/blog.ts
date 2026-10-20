export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  category: string;
  category_slug: string;
  tags: string[];
  status: PostStatus;
  seo_title: string | null;
  seo_description: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  schema_type?: 'Article' | 'BlogPosting' | 'TechArticle';
  reading_time: string | null;
  featured: boolean;
  author_id: string | null;
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  post_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
  post_count?: number;
}

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'superadmin';
  created_at: string;
}

export interface BlogFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  category: string;
  category_slug: string;
  tags: string[];
  status: PostStatus;
  seo_title: string;
  seo_description: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  schema_type?: 'Article' | 'BlogPosting' | 'TechArticle';
  reading_time: string;
  featured: boolean;
  author_name: string;
}
