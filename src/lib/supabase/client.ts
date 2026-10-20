import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!rawUrl || !rawKey) return false;

  const url = rawUrl.trim().replace(/^["']|["']$/g, '');
  const key = rawKey.trim().replace(/^["']|["']$/g, '');

  if (
    url.includes('your-project-id') ||
    url.includes('placeholder') ||
    key.includes('your-anon-key') ||
    key.includes('placeholder')
  ) {
    return false;
  }

  return url.startsWith('https://') && key.length > 20;
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const url = rawUrl.trim().replace(/^["']|["']$/g, '');
  const key = rawKey.trim().replace(/^["']|["']$/g, '');

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
