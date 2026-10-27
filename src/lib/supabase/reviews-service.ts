import { createClient } from './client';
import { ClientReview, ReviewFormValues } from '@/types/reviews';

/**
 * Fetch all client reviews from Supabase with optional search, rating, and status filter.
 * Supabase is the sole authoritative persistent data source.
 */
export async function getClientReviews(options: {
  search?: string;
  rating?: number | 'all';
  status?: 'all' | 'published' | 'draft';
} = {}): Promise<{ data: ClientReview[]; isSchemaMissing?: boolean; error?: string }> {
  const supabase = createClient();
  const { search, rating = 'all', status = 'all' } = options;

  try {
    let query = supabase.from('client_reviews').select('*').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (rating && rating !== 'all') {
      query = query.eq('rating', rating);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`client_name.ilike.${term},review_text.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      const isMissing = error.message.includes('client_reviews') || error.code === 'PGRST205' || error.code === '42P01';
      return {
        data: [],
        isSchemaMissing: isMissing,
        error: isMissing
          ? 'Table "public.client_reviews" not found in Supabase. Please apply the migration in supabase/migrations/20261027_partners_and_reviews.sql via the Supabase SQL Editor.'
          : error.message,
      };
    }

    return { data: (data as ClientReview[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { data: [], error: message };
  }
}

/**
 * Fetch a single client review by ID.
 */
export async function getClientReviewById(id: string): Promise<{ data?: ClientReview; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('client_reviews').select('*').eq('id', id).maybeSingle();
    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: 'Client review record not found in Supabase.' };
    }
    return { data: data as ClientReview };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown database error' };
  }
}

/**
 * Create a new client review with strict rating validation (integer between 1 and 5).
 */
export async function createClientReview(
  values: ReviewFormValues
): Promise<{ data?: ClientReview; isSchemaMissing?: boolean; error?: string }> {
  const supabase = createClient();

  // 1. Client Name validation
  if (!values.client_name || !values.client_name.trim()) {
    return { error: 'Client name is required.' };
  }

  // 2. Rating validation: must be an integer between 1 and 5
  const parsedRating = Number(values.rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return { error: 'Rating must be an integer between 1 and 5 stars.' };
  }

  // 3. Review text validation
  if (!values.review_text || !values.review_text.trim()) {
    return { error: 'Review description / testimonial is required.' };
  }

  const now = new Date().toISOString();
  const insertPayload = {
    client_name: values.client_name.trim(),
    company_name: values.company_name?.trim() || null,
    rating: parsedRating,
    review_text: values.review_text.trim(),
    status: values.status || 'published',
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('client_reviews')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      const isMissing = error.message.includes('client_reviews') || error.code === 'PGRST205' || error.code === '42P01';
      return {
        isSchemaMissing: isMissing,
        error: isMissing
          ? 'Cannot save: "public.client_reviews" table is not created in Supabase. Please apply the migration first.'
          : error.message,
      };
    }

    return { data: data as ClientReview };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to insert client review record.' };
  }
}

/**
 * Update an existing client review in Supabase.
 */
export async function updateClientReview(
  id: string,
  values: Partial<ReviewFormValues>
): Promise<{ data?: ClientReview; error?: string }> {
  const supabase = createClient();

  if (values.client_name !== undefined && !values.client_name.trim()) {
    return { error: 'Client name cannot be empty.' };
  }

  if (values.rating !== undefined) {
    const parsed = Number(values.rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      return { error: 'Rating must be an integer between 1 and 5 stars.' };
    }
  }

  if (values.review_text !== undefined && !values.review_text.trim()) {
    return { error: 'Review description cannot be empty.' };
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (values.client_name !== undefined) updatePayload.client_name = values.client_name.trim();
  if (values.company_name !== undefined) updatePayload.company_name = values.company_name.trim() || null;
  if (values.rating !== undefined) updatePayload.rating = Number(values.rating);
  if (values.review_text !== undefined) updatePayload.review_text = values.review_text.trim();
  if (values.status !== undefined) updatePayload.status = values.status;

  try {
    const { data, error } = await supabase
      .from('client_reviews')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as ClientReview };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Database update failed.' };
  }
}

/**
 * Delete a client review from Supabase by ID.
 */
export async function deleteClientReview(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('client_reviews').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete client review.' };
  }
}
