import { createClient } from './client';
import { AdminUser } from '@/types/blog';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
  };
  adminProfile?: AdminUser;
}

/**
 * Sign in as an administrator.
 * Validates credentials via Supabase Auth AND ensures the account
 * is explicitly listed in the `admin_users` table.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminAuthResult> {
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || 'Invalid email or password.',
    };
  }

  const userId = authData.user.id;
  const userEmail = authData.user.email || email;

  // Check if the authenticated user is explicitly authorized in admin_users
  try {
    const { data: adminRecord, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (adminError) {
      console.error('Error verifying admin authorization:', adminError);
      await supabase.auth.signOut();
      return {
        success: false,
        error: `Database authorization check failed: ${adminError.message}. Make sure the admin_users table exists and RLS policies are applied.`,
      };
    }

    if (!adminRecord) {
      // User is authenticated in Supabase Auth, but NOT authorized as an admin
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Access denied: This account is not an authorized administrator. Public self-registration is disabled.',
      };
    }

    return {
      success: true,
      user: {
        id: userId,
        email: userEmail,
      },
      adminProfile: adminRecord as AdminUser,
    };
  } catch (err: unknown) {
    await supabase.auth.signOut();
    const message = err instanceof Error ? err.message : 'Unknown authorization error';
    return {
      success: false,
      error: `Authorization error: ${message}`,
    };
  }
}

/**
 * Sign out the currently logged-in administrator.
 */
export async function signOutAdmin(): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return {};
}

/**
 * Get current session and admin profile in browser context
 */
export async function getCurrentAdmin(): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  email?: string;
  userId?: string;
  adminProfile?: AdminUser;
}> {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isAuthenticated: false, isAdmin: false };
  }

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    isAuthenticated: true,
    isAdmin: Boolean(adminRecord),
    email: user.email,
    userId: user.id,
    adminProfile: (adminRecord as AdminUser) || undefined,
  };
}

/**
 * Upload a blog featured image to Supabase Storage bucket 'blog-images'.
 * Returns the public URL of the uploaded image.
 */
export async function uploadBlogImage(file: File): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return { error: 'Please upload a valid image file (PNG, JPG, WebP, GIF, or SVG).' };
  }

  // Max 5MB limit
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { error: 'Image file size must be less than 5 MB.' };
  }

  // Create clean, unique file path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const filePath = `featured/${Date.now()}-${cleanBaseName}.${ext}`;

  try {
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return {
        error: `Failed to upload image: ${error.message}. Ensure the 'blog-images' bucket exists and permissions are configured.`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown upload error';
    return { error: `Upload error: ${message}` };
  }
}
