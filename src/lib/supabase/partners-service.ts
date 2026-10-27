import { createClient } from './client';
import { Partner, PartnerFormValues } from '@/types/partners';
import { slugify } from '@/lib/utils';

export const INITIAL_PARTNERS: PartnerFormValues[] = [
  {
    name: 'AWS',
    slug: 'aws',
    description: "ZOFT's work across AWS environments.",
    details: 'Designing, modernizing, and optimizing AWS cloud architecture, database workloads, data engineering pipelines, and operational resilience.',
    logo_url: '/platforms/aws.svg',
    status: 'published',
  },
  {
    name: 'Microsoft Azure',
    slug: 'azure',
    description: "ZOFT's work across Microsoft Azure environments.",
    details: 'Architecting and managing enterprise Microsoft Azure environments, SQL Server workloads, data platforms, and cloud infrastructure optimization.',
    logo_url: '/platforms/azure.svg',
    status: 'published',
  },
  {
    name: 'Google Cloud Platform',
    slug: 'gcp',
    description: "ZOFT's work across Google Cloud environments.",
    details: 'Leveraging Google Cloud infrastructure for analytical workloads, vector database integration, modern data pipelines, and scalable cloud services.',
    logo_url: '/platforms/gcp.svg',
    status: 'published',
  },
  {
    name: 'Oracle',
    slug: 'oracle',
    description: "ZOFT's work across Oracle environments.",
    details: 'Deep technical advisory, database administration, high-availability architecture, and performance tuning across enterprise Oracle environments.',
    logo_url: '/platforms/oracle.svg',
    status: 'published',
  },
];

/**
 * Fetch all partners from Supabase with optional search and status filter.
 * Supabase is the sole authoritative persistent data source.
 */
export async function getPartners(options: {
  search?: string;
  status?: 'all' | 'published' | 'draft';
} = {}): Promise<{ data: Partner[]; isSchemaMissing?: boolean; error?: string }> {
  const supabase = createClient();
  const { search, status = 'all' } = options;

  try {
    let query = supabase.from('partners').select('*').order('created_at', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},description.ilike.${term},slug.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      const isMissing = error.message.includes('partners') || error.code === 'PGRST205' || error.code === '42P01';
      return {
        data: [],
        isSchemaMissing: isMissing,
        error: isMissing
          ? 'Table "public.partners" not found in Supabase. Please apply the migration in supabase/migrations/20261027_partners_and_reviews.sql via the Supabase SQL Editor.'
          : error.message,
      };
    }

    return { data: (data as Partner[]) || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { data: [], error: message };
  }
}

/**
 * Fetch a single partner by ID.
 */
export async function getPartnerById(id: string): Promise<{ data?: Partner; error?: string }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.from('partners').select('*').eq('id', id).maybeSingle();
    if (error) {
      return { error: error.message };
    }
    if (!data) {
      return { error: 'Partner record not found in Supabase.' };
    }
    return { data: data as Partner };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown database error' };
  }
}

/**
 * Check if a partner slug is unique.
 */
export async function checkPartnerSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = createClient();
  try {
    let query = supabase.from('partners').select('id').eq('slug', slug);
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query;
    if (error) {
      return true;
    }
    return !data || data.length === 0;
  } catch {
    return true;
  }
}

/**
 * Create a new partner record in Supabase.
 */
export async function createPartner(
  values: PartnerFormValues
): Promise<{ data?: Partner; isSchemaMissing?: boolean; error?: string }> {
  const supabase = createClient();

  // Field validation
  if (!values.name.trim()) return { error: 'Partner name is required.' };
  if (!values.logo_url.trim()) return { error: 'Partner logo or image is required.' };
  if (!values.description.trim()) return { error: 'Short description is required.' };

  const cleanSlug = values.slug ? slugify(values.slug) : slugify(values.name);
  const isAvailable = await checkPartnerSlugAvailability(cleanSlug);
  if (!isAvailable) {
    return { error: `The identifier/slug "${cleanSlug}" is already in use by another partner.` };
  }

  const now = new Date().toISOString();
  const insertPayload = {
    name: values.name.trim(),
    slug: cleanSlug,
    description: values.description.trim(),
    details: values.details?.trim() || null,
    logo_url: values.logo_url.trim(),
    status: values.status || 'published',
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from('partners')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      const isMissing = error.message.includes('partners') || error.code === 'PGRST205' || error.code === '42P01';
      return {
        isSchemaMissing: isMissing,
        error: isMissing
          ? 'Cannot save: "public.partners" table is not created in Supabase. Please apply the migration first.'
          : error.message,
      };
    }

    return { data: data as Partner };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to insert partner record.' };
  }
}

/**
 * Update an existing partner record in Supabase.
 */
export async function updatePartner(
  id: string,
  values: Partial<PartnerFormValues>
): Promise<{ data?: Partner; error?: string }> {
  const supabase = createClient();

  if (values.name !== undefined && !values.name.trim()) {
    return { error: 'Partner name cannot be empty.' };
  }
  if (values.description !== undefined && !values.description.trim()) {
    return { error: 'Description cannot be empty.' };
  }
  if (values.logo_url !== undefined && !values.logo_url.trim()) {
    return { error: 'Logo cannot be empty.' };
  }

  let cleanSlug: string | undefined;
  if (values.slug !== undefined || values.name !== undefined) {
    const candidate = values.slug || values.name || '';
    if (candidate) {
      cleanSlug = slugify(candidate);
      const isAvailable = await checkPartnerSlugAvailability(cleanSlug, id);
      if (!isAvailable) {
        return { error: `The slug "${cleanSlug}" is already taken by another partner.` };
      }
    }
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (values.name !== undefined) updatePayload.name = values.name.trim();
  if (cleanSlug !== undefined) updatePayload.slug = cleanSlug;
  if (values.description !== undefined) updatePayload.description = values.description.trim();
  if (values.details !== undefined) updatePayload.details = values.details.trim() || null;
  if (values.logo_url !== undefined) updatePayload.logo_url = values.logo_url.trim();
  if (values.status !== undefined) updatePayload.status = values.status;

  try {
    const { data, error } = await supabase
      .from('partners')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as Partner };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Database update failed.' };
  }
}

/**
 * Delete a partner record and safely clean up stored images if not referenced elsewhere.
 */
export async function deletePartner(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // 1. Fetch current partner to inspect logo URL
    const { data: partner } = await getPartnerById(id);

    // 2. Delete the record from Supabase
    const { error } = await supabase.from('partners').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // 3. Clean up stored image safely:
    // Only if image is hosted in Supabase Storage AND no other partner references it AND it's not a static public asset
    if (partner?.logo_url && !partner.logo_url.startsWith('/platforms/')) {
      await safeDeletePartnerImageIfUnreferenced(partner.logo_url, id);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete partner.' };
  }
}

/**
 * Safely delete an uploaded partner image if no other partner record depends on it.
 */
async function safeDeletePartnerImageIfUnreferenced(logoUrl: string, deletedPartnerId: string): Promise<void> {
  const supabase = createClient();
  try {
    // Check if any other partner record uses this same logo
    const { data: remainingWithLogo } = await supabase
      .from('partners')
      .select('id')
      .eq('logo_url', logoUrl)
      .neq('id', deletedPartnerId);

    if (remainingWithLogo && remainingWithLogo.length > 0) {
      // Another partner still depends on this image, do not delete it!
      return;
    }

    // Extract storage bucket and path if it's a Supabase storage URL
    const match = logoUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
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
 * Upload a partner logo file to Supabase Storage with strict validation.
 * Accepts PNG, JPEG, WebP, and safe SVG only. Reject executables or arbitrary files. Max 5MB.
 */
export async function uploadPartnerLogo(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  // 1. Validate file extension and MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      error: 'Invalid file format. Please upload a valid image (PNG, JPEG, WebP, or SVG). Executable and other file types are strictly prohibited.',
    };
  }

  // 2. Max size 5MB
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: 'Image size exceeds the maximum limit of 5 MB.' };
  }

  // 3. Safe SVG inspection (prevent inline scripts / malicious payload)
  if (file.type === 'image/svg+xml') {
    try {
      const text = await file.text();
      const lower = text.toLowerCase();
      if (
        lower.includes('<script') ||
        lower.includes('javascript:') ||
        lower.includes('onload=') ||
        lower.includes('onerror=')
      ) {
        return { error: 'The uploaded SVG file contains disallowed script elements. Please provide a clean vector asset.' };
      }
    } catch {
      return { error: 'Unable to parse SVG file safely.' };
    }
  }

  // 4. Generate safe unique path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const filePath = `partners/${Date.now()}-${cleanName}.${ext}`;

  // Try 'partner-logos' bucket first, fallback to 'blog-images'
  let targetBucket = 'partner-logos';

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

/**
 * Repeatable, idempotent seeding of the four initial authentic partners:
 * - AWS
 * - Microsoft Azure
 * - Google Cloud Platform
 * - Oracle
 * Preserves any existing records and reports conflicts instead of overwriting.
 */
export async function seedInitialPartners(): Promise<{
  data: Partner[];
  conflicts: string[];
  error?: string;
}> {
  const supabase = createClient();
  const conflicts: string[] = [];
  const inserted: Partner[] = [];

  try {
    for (const partner of INITIAL_PARTNERS) {
      const slug = partner.slug || slugify(partner.name);

      // Check if already exists in Supabase
      const { data: existing, error: checkErr } = await supabase
        .from('partners')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (checkErr) {
        return { data: [], conflicts: [], error: checkErr.message };
      }

      if (existing) {
        conflicts.push(`Partner "${partner.name}" (${slug}) already exists; preserved existing record.`);
        inserted.push(existing as Partner);
        continue;
      }

      const now = new Date().toISOString();
      const { data: created, error: insertErr } = await supabase
        .from('partners')
        .insert({
          name: partner.name,
          slug,
          description: partner.description,
          details: partner.details,
          logo_url: partner.logo_url,
          status: partner.status,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (insertErr) {
        return { data: inserted, conflicts, error: insertErr.message };
      }

      if (created) {
        inserted.push(created as Partner);
      }
    }

    return { data: inserted, conflicts };
  } catch (err: unknown) {
    return { data: [], conflicts: [], error: err instanceof Error ? err.message : 'Seeding failed.' };
  }
}
