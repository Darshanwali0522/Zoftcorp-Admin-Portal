import { createClient } from './client';
import { BlogPost, BlogFormValues, PostStatus } from '@/types/blog';
import { slugify, calculateReadingTime } from '@/lib/utils';

export interface PostFilterOptions {
  search?: string;
  status?: PostStatus | 'all';
  category?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  recentPosts: BlogPost[];
}

/**
 * Fetch a list of posts with optional search, filtering, and pagination.
 */
export async function getPosts(options: PostFilterOptions = {}): Promise<{
  data: BlogPost[];
  count: number;
  error?: string;
}> {
  const supabase = createClient();
  const {
    search,
    status = 'all',
    category = 'all',
    limit = 50,
    offset = 0,
    sortBy = 'updated_at',
    sortOrder = 'desc',
  } = options;

  try {
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' });

    // Filter by status if specified
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      query = query.eq('category_slug', category);
    }

    // Search query across title, excerpt, category, and slug
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},excerpt.ilike.${term},category.ilike.${term},slug.ilike.${term}`);
    }

    // Sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return { data: [], count: 0, error: error.message };
    }

    return {
      data: (data as BlogPost[]) || [],
      count: count || 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], count: 0, error: message };
  }
}

/**
 * Fetch a single blog post by its unique ID.
 */
export async function getPostById(id: string): Promise<{ data?: BlogPost; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: 'Blog post not found.' };
    }

    return { data: data as BlogPost };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

/**
 * Check if a URL slug is already taken (excluding a specific post ID if editing).
 */
export async function checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  let query = supabase.from('posts').select('id').eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Error checking slug availability:', error);
    return true;
  }
  return !data || data.length === 0;
}

/**
 * Create a new blog post with extended SEO/OG fields
 */
export async function createPost(
  values: BlogFormValues,
  authorId?: string | null
): Promise<{ data?: BlogPost; error?: string }> {
  const supabase = createClient();

  // Basic validation
  if (!values.title.trim()) {
    return { error: 'Title is required.' };
  }
  if (!values.slug.trim()) {
    return { error: 'Slug is required.' };
  }
  if (!values.content.trim()) {
    return { error: 'Article content cannot be empty.' };
  }

  const cleanSlug = slugify(values.slug);
  const isAvailable = await checkSlugAvailability(cleanSlug);
  if (!isAvailable) {
    return { error: `The URL slug "${cleanSlug}" is already in use. Please choose a unique slug.` };
  }

  const readingTime = values.reading_time || calculateReadingTime(values.content);
  const now = new Date().toISOString();

  const insertPayload = {
    title: values.title.trim(),
    slug: cleanSlug,
    excerpt: values.excerpt.trim(),
    content: values.content,
    featured_image: values.featured_image || null,
    category: values.category || 'General',
    category_slug: values.category_slug || slugify(values.category || 'General'),
    tags: values.tags || [],
    status: values.status,
    seo_title: values.seo_title.trim() || values.title.trim(),
    seo_description: values.seo_description.trim() || values.excerpt.trim(),
    og_title: values.og_title?.trim() || values.seo_title.trim() || values.title.trim(),
    og_description: values.og_description?.trim() || values.seo_description.trim() || values.excerpt.trim(),
    og_image: values.og_image || values.featured_image || null,
    canonical_url: values.canonical_url?.trim() || `https://zoftcorp.com/blog-2/${cleanSlug}`,
    schema_type: values.schema_type || 'Article',
    reading_time: readingTime,
    featured: values.featured ?? false,
    author_id: authorId || null,
    author_name: values.author_name || 'Admin',
    created_at: now,
    updated_at: now,
    published_at: values.status === 'published' ? now : null,
  };

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return { error: error.message };
    }

    return { data: data as BlogPost };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

/**
 * Update an existing blog post
 */
export async function updatePost(
  id: string,
  values: Partial<BlogFormValues>,
  currentPost?: BlogPost
): Promise<{ data?: BlogPost; error?: string }> {
  const supabase = createClient();

  if (values.title !== undefined && !values.title.trim()) {
    return { error: 'Title cannot be empty.' };
  }

  const cleanSlug = values.slug ? slugify(values.slug) : undefined;
  if (cleanSlug) {
    const isAvailable = await checkSlugAvailability(cleanSlug, id);
    if (!isAvailable) {
      return { error: `The URL slug "${cleanSlug}" is already in use by another post.` };
    }
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (values.title !== undefined) updatePayload.title = values.title.trim();
  if (cleanSlug !== undefined) updatePayload.slug = cleanSlug;
  if (values.excerpt !== undefined) updatePayload.excerpt = values.excerpt.trim();
  if (values.content !== undefined) {
    updatePayload.content = values.content;
    updatePayload.reading_time = values.reading_time || calculateReadingTime(values.content);
  }
  if (values.featured_image !== undefined) updatePayload.featured_image = values.featured_image;
  if (values.category !== undefined) {
    updatePayload.category = values.category;
    updatePayload.category_slug = values.category_slug || slugify(values.category);
  }
  if (values.tags !== undefined) updatePayload.tags = values.tags;
  if (values.status !== undefined) {
    updatePayload.status = values.status;
    if (values.status === 'published') {
      if (!currentPost || !currentPost.published_at) {
        updatePayload.published_at = new Date().toISOString();
      }
    }
  }
  if (values.seo_title !== undefined) updatePayload.seo_title = values.seo_title.trim();
  if (values.seo_description !== undefined) updatePayload.seo_description = values.seo_description.trim();
  if (values.og_title !== undefined) updatePayload.og_title = values.og_title.trim();
  if (values.og_description !== undefined) updatePayload.og_description = values.og_description.trim();
  if (values.og_image !== undefined) updatePayload.og_image = values.og_image;
  if (values.canonical_url !== undefined) updatePayload.canonical_url = values.canonical_url.trim();
  if (values.schema_type !== undefined) updatePayload.schema_type = values.schema_type;
  if (values.featured !== undefined) updatePayload.featured = values.featured;
  if (values.author_name !== undefined) updatePayload.author_name = values.author_name;

  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return { error: error.message };
    }

    return { data: data as BlogPost };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

/**
 * Toggle publication status (Publish or Unpublish)
 */
export async function togglePostStatus(
  id: string,
  newStatus: PostStatus
): Promise<{ success: boolean; data?: BlogPost; error?: string }> {
  const supabase = createClient();

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'published') {
    updatePayload.published_at = new Date().toISOString();
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as BlogPost };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update publication status.';
    return { success: false, error: message };
  }
}

/**
 * Delete a blog post by ID
 */
export async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Fetch aggregated statistics for the admin dashboard
 */
export async function getDashboardStats(): Promise<{
  data?: DashboardStats;
  error?: string;
}> {
  const supabase = createClient();

  try {
    // 1. Total posts count
    const totalPromise = supabase.from('posts').select('*', { count: 'exact', head: true });

    // 2. Published posts count
    const publishedPromise = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // 3. Draft posts count
    const draftPromise = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');

    // 4. Categories count from categories table
    const categoriesPromise = supabase.from('categories').select('*', { count: 'exact', head: true });

    // 5. Recent posts (latest 6)
    const recentPromise = supabase
      .from('posts')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(6);

    const [totalRes, publishedRes, draftRes, categoriesRes, recentRes] = await Promise.all([
      totalPromise,
      publishedPromise,
      draftPromise,
      categoriesPromise,
      recentPromise,
    ]);

    if (totalRes.error) {
      return { error: totalRes.error.message };
    }

    return {
      data: {
        totalPosts: totalRes.count || 0,
        publishedPosts: publishedRes.count || 0,
        draftPosts: draftRes.count || 0,
        totalCategories: categoriesRes.count || 0,
        recentPosts: (recentRes.data as BlogPost[]) || [],
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}
