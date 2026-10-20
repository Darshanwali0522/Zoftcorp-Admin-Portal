import { createClient } from './client';
import { Category, Tag } from '@/types/blog';
import { slugify } from '@/lib/utils';

/**
 * Fetch all categories with accurate post count from Supabase
 */
export async function getCategories(): Promise<{ data: Category[]; error?: string }> {
  const supabase = createClient();

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    // Get post count for each category
    const { data: posts, error: postErr } = await supabase
      .from('posts')
      .select('category_slug');

    const counts: Record<string, number> = {};
    if (!postErr && posts) {
      posts.forEach((p: { category_slug?: string | null }) => {
        const slug = p.category_slug || '';
        counts[slug] = (counts[slug] || 0) + 1;
      });
    }

    const categoriesWithCount: Category[] = (categories || []).map((cat: Category) => ({
      ...cat,
      post_count: counts[cat.slug] || 0,
    }));

    return { data: categoriesWithCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], error: message };
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  description?: string,
  customSlug?: string
): Promise<{ data?: Category; error?: string }> {
  const supabase = createClient();
  const trimmedName = name.trim();
  if (!trimmedName) return { error: 'Category name is required.' };

  const slug = customSlug ? slugify(customSlug) : slugify(trimmedName);

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: trimmedName,
        slug,
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'A category with this name or slug already exists.' };
      }
      return { error: error.message };
    }

    return { data: data as Category };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create category.';
    return { error: message };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  name: string,
  slug?: string,
  description?: string
): Promise<{ data?: Category; error?: string }> {
  const supabase = createClient();
  const trimmedName = name.trim();
  if (!trimmedName) return { error: 'Category name is required.' };

  const updateSlug = slug ? slugify(slug) : slugify(trimmedName);

  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: trimmedName,
        slug: updateSlug,
        description: description?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Category };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update category.';
    return { error: message };
  }
}

/**
 * Delete a category with safety check and automatic reassignment
 */
export async function deleteCategory(
  id: string,
  categorySlug: string,
  fallbackSlug = 'general'
): Promise<{ success: boolean; affectedPosts?: number; error?: string }> {
  const supabase = createClient();

  try {
    // 1. Reassign any posts currently using this category to fallback
    const { data: postsToReassign, error: fetchErr } = await supabase
      .from('posts')
      .select('id')
      .eq('category_slug', categorySlug);

    if (fetchErr) {
      return { success: false, error: fetchErr.message };
    }

    const affectedCount = postsToReassign?.length || 0;

    if (affectedCount > 0) {
      await supabase
        .from('posts')
        .update({
          category: 'General',
          category_slug: fallbackSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('category_slug', categorySlug);
    }

    // 2. Delete the category record
    const { error: deleteErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return { success: false, error: deleteErr.message };
    }

    return { success: true, affectedPosts: affectedCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete category.';
    return { success: false, error: message };
  }
}

/**
 * Fetch all tags with post counts
 */
export async function getTags(): Promise<{ data: Tag[]; error?: string }> {
  const supabase = createClient();

  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    // Count how many posts contain each tag
    const { data: posts, error: postErr } = await supabase
      .from('posts')
      .select('tags');

    const counts: Record<string, number> = {};
    if (!postErr && posts) {
      posts.forEach((p: { tags?: string[] | null }) => {
        const postTags: string[] = p.tags || [];
        postTags.forEach((t: string) => {
          const normalized = t.toLowerCase().trim();
          counts[normalized] = (counts[normalized] || 0) + 1;
        });
      });
    }

    const tagsWithCount: Tag[] = (tags || []).map((t: Tag) => ({
      ...t,
      post_count: counts[t.name.toLowerCase().trim()] || 0,
    }));

    return { data: tagsWithCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: [], error: message };
  }
}

/**
 * Create a new tag
 */
export async function createTag(name: string, customSlug?: string): Promise<{ data?: Tag; error?: string }> {
  const supabase = createClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Tag name is required.' };

  const slug = customSlug ? slugify(customSlug) : slugify(trimmed);

  try {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: trimmed,
        slug,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'A tag with this name already exists.' };
      }
      return { error: error.message };
    }

    return { data: data as Tag };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create tag.';
    return { error: message };
  }
}

/**
 * Update an existing tag
 */
export async function updateTag(
  id: string,
  name: string,
  slug?: string
): Promise<{ data?: Tag; error?: string }> {
  const supabase = createClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Tag name is required.' };

  const updateSlug = slug ? slugify(slug) : slugify(trimmed);

  try {
    const { data, error } = await supabase
      .from('tags')
      .update({
        name: trimmed,
        slug: updateSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Tag };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update tag.';
    return { error: message };
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete tag.';
    return { success: false, error: message };
  }
}
