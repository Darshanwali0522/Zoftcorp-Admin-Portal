import { createClient } from './client';
import { EventItem, EventFormValues, ContentStatus } from '@/types/events';
import { slugify } from '@/lib/utils';

/**
 * Fetch all events from Supabase with optional search and status filter.
 * Supabase is the sole authoritative persistent data source.
 */
export async function getEvents(options: {
  search?: string;
  status?: 'all' | 'published' | 'draft';
} = {}): Promise<{ data: EventItem[]; isSchemaMissing?: boolean; error?: string }> {
  const supabase = createClient();
  const { search, status = 'all' } = options;

  try {
    let query = supabase.from('events').select('*').order('event_date', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`title.ilike.${term},description.ilike.${term},location.ilike.${term},slug.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache')
      ) {
        console.warn('[Supabase Events] events table missing in schema:', error.message);
        return { data: [], isSchemaMissing: true };
      }
      return { data: [], error: error.message };
    }

    const mapped: EventItem[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      event_date: row.event_date,
      location: row.location || null,
      event_type: row.event_type || 'meetup',
      registration_url: row.registration_url || null,
      recording_url: row.recording_url || null,
      photos: Array.isArray(row.photos) ? row.photos : [],
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return { data: mapped };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve events.';
    return { data: [], error: msg };
  }
}

/**
 * Fetch a single event by ID.
 */
export async function getEventById(id: string): Promise<{ data?: EventItem; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { error: error.message };
    }

    const mapped: EventItem = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      event_date: data.event_date,
      location: data.location || null,
      event_type: data.event_type || 'meetup',
      registration_url: data.registration_url || null,
      recording_url: data.recording_url || null,
      photos: Array.isArray(data.photos) ? data.photos : [],
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: mapped };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to retrieve event.' };
  }
}

/**
 * Validate event form values before persisting.
 */
export function validateEventForm(values: EventFormValues): { error?: string } {
  if (!values.title || !values.title.trim()) {
    return { error: 'Event title is required.' };
  }
  if (!values.description || !values.description.trim()) {
    return { error: 'Event description is required.' };
  }
  if (!values.event_date || !values.event_date.trim()) {
    return { error: 'Event date is required.' };
  }
  const parsedDate = new Date(values.event_date);
  if (isNaN(parsedDate.getTime())) {
    return { error: 'Please provide a valid event date.' };
  }
  return {};
}

/**
 * Create a new event record in Supabase.
 */
export async function createEvent(
  values: EventFormValues
): Promise<{ data?: EventItem; error?: string }> {
  const validation = validateEventForm(values);
  if (validation.error) return { error: validation.error };

  const supabase = createClient();
  const slug = values.slug?.trim() || slugify(values.title);

  const payload = {
    title: values.title.trim(),
    slug,
    description: values.description.trim(),
    event_date: new Date(values.event_date).toISOString(),
    location: values.location?.trim() || null,
    event_type: values.event_type?.trim() || 'meetup',
    registration_url: values.registration_url?.trim() || null,
    recording_url: values.recording_url?.trim() || null,
    photos: Array.isArray(values.photos) ? values.photos.filter(p => Boolean(p && p.trim())) : [],
    status: values.status || 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message?.includes('slug')) {
        return { error: `An event with slug "${slug}" already exists. Please choose a unique title or slug.` };
      }
      return { error: error.message };
    }

    return {
      data: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        event_date: data.event_date,
        location: data.location || null,
        event_type: data.event_type || 'meetup',
        registration_url: data.registration_url || null,
        recording_url: data.recording_url || null,
        photos: Array.isArray(data.photos) ? data.photos : [],
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to create event.' };
  }
}

/**
 * Update an existing event in Supabase.
 */
export async function updateEvent(
  id: string,
  values: Partial<EventFormValues>
): Promise<{ data?: EventItem; error?: string }> {
  const supabase = createClient();

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (values.title !== undefined) {
    if (!values.title.trim()) return { error: 'Event title cannot be empty.' };
    updatePayload.title = values.title.trim();
  }
  if (values.slug !== undefined) {
    const s = values.slug.trim() || slugify(values.title || '');
    if (s) updatePayload.slug = s;
  }
  if (values.description !== undefined) {
    if (!values.description.trim()) return { error: 'Description cannot be empty.' };
    updatePayload.description = values.description.trim();
  }
  if (values.event_date !== undefined) {
    const parsed = new Date(values.event_date);
    if (isNaN(parsed.getTime())) return { error: 'Invalid event date.' };
    updatePayload.event_date = parsed.toISOString();
  }
  if (values.location !== undefined) {
    updatePayload.location = values.location?.trim() || null;
  }
  if (values.event_type !== undefined) {
    updatePayload.event_type = values.event_type?.trim() || 'meetup';
  }
  if (values.registration_url !== undefined) {
    updatePayload.registration_url = values.registration_url?.trim() || null;
  }
  if (values.recording_url !== undefined) {
    updatePayload.recording_url = values.recording_url?.trim() || null;
  }
  if (values.photos !== undefined) {
    updatePayload.photos = Array.isArray(values.photos) ? values.photos.filter(p => Boolean(p && p.trim())) : [];
  }
  if (values.status !== undefined) {
    updatePayload.status = values.status;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' && error.message?.includes('slug')) {
        return { error: `An event with slug "${updatePayload.slug}" already exists.` };
      }
      return { error: error.message };
    }

    return {
      data: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        event_date: data.event_date,
        location: data.location || null,
        event_type: data.event_type || 'meetup',
        registration_url: data.registration_url || null,
        recording_url: data.recording_url || null,
        photos: Array.isArray(data.photos) ? data.photos : [],
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to update event.' };
  }
}

/**
 * Toggle publication status between 'draft' and 'published'.
 */
export async function toggleEventPublishStatus(
  id: string,
  currentStatus: ContentStatus
): Promise<{ success: boolean; newStatus?: ContentStatus; error?: string }> {
  const newStatus: ContentStatus = currentStatus === 'published' ? 'draft' : 'published';
  const res = await updateEvent(id, { status: newStatus });
  if (res.error) {
    return { success: false, error: res.error };
  }
  return { success: true, newStatus };
}

/**
 * Delete an event and safely clean up unreferenced images.
 */
export async function deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // 1. Fetch current event to inspect photo URLs for cleanup
    const { data: event } = await supabase
      .from('events')
      .select('photos')
      .eq('id', id)
      .maybeSingle();

    // 2. Delete database record
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // 3. Clean up unreferenced storage images asynchronously
    if (event?.photos && Array.isArray(event.photos)) {
      for (const photo of event.photos) {
        await safeDeleteEventImageIfUnreferenced(photo, id);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete event.' };
  }
}

/**
 * Safely delete an uploaded event image if no other event record depends on it.
 */
async function safeDeleteEventImageIfUnreferenced(photoUrl: string, deletedEventId: string): Promise<void> {
  const supabase = createClient();
  try {
    const { data: remainingWithPhoto } = await supabase
      .from('events')
      .select('id')
      .contains('photos', [photoUrl])
      .neq('id', deletedEventId);

    if (remainingWithPhoto && remainingWithPhoto.length > 0) {
      return; // Another event still depends on this image
    }

    const match = photoUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const filePath = match[2];
      await supabase.storage.from(bucket).remove([filePath]);
    }
  } catch {
    // Non-critical cleanup failure, ignore
  }
}

/**
 * Upload an event photo file to Supabase Storage with strict validation.
 * Accepts PNG, JPEG, WebP. Max 5MB.
 */
export async function uploadEventPhoto(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  // 1. Validate file format
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      error: 'Invalid file format. Please upload a valid image (JPEG, PNG, or WebP).',
    };
  }

  // 2. Max size 5MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: 'Image size exceeds the maximum limit of 5 MB.' };
  }

  // 3. Generate safe unique path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const filePath = `events/${Date.now()}-${cleanName}.${ext}`;

  // Try 'event-images' bucket first, fallback to 'blog-images'
  let targetBucket = 'event-images';

  try {
    let uploadRes = await supabase.storage.from(targetBucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadRes.error && uploadRes.error.message.includes('Bucket not found')) {
      targetBucket = 'blog-images';
      uploadRes = await supabase.storage.from(targetBucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    }

    if (uploadRes.error) {
      return {
        error: `Storage upload failed: ${uploadRes.error.message}. Please verify Supabase storage bucket permissions.`,
      };
    }

    const { data: urlData } = supabase.storage.from(targetBucket).getPublicUrl(uploadRes.data.path);
    return { url: urlData.publicUrl };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Storage upload failed.' };
  }
}
