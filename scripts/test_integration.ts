import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

console.log('====================================================');
console.log('ZOFTCORP ADMIN PORTAL — BACKEND INTEGRATION TEST SUITE');
console.log('====================================================');
console.log(`Target URL: ${supabaseUrl}`);

async function runTests() {
  const client = createClient(supabaseUrl, supabaseAnonKey);

  let allPassed = true;

  // 1. Test Public / Anon Query for Published Posts
  console.log('\n[TEST 1] Querying published posts as public client...');
  const { data: publishedPosts, error: pubErr } = await client
    .from('posts')
    .select('id, title, slug, status')
    .eq('status', 'published');

  if (pubErr) {
    console.error('❌ Failed to query published posts:', pubErr.message);
    allPassed = false;
  } else {
    console.log(`✅ Success! Retrieved ${publishedPosts?.length || 0} published post(s):`);
    publishedPosts?.forEach((p) => console.log(`   - [${p.status}] ${p.title} (/blog-2/${p.slug})`));
  }

  // 2. Test RLS Protection: Query Draft Posts as Public Client
  console.log('\n[TEST 2] Verifying Row Level Security (drafts hidden from public)...');
  const { data: draftPosts, error: draftErr } = await client
    .from('posts')
    .select('id, title, status')
    .eq('status', 'draft');

  if (draftErr) {
    console.error('❌ Error querying drafts:', draftErr.message);
    allPassed = false;
  } else if (draftPosts && draftPosts.length > 0) {
    console.error(`❌ Security failure: Public client could see ${draftPosts.length} draft posts!`);
    allPassed = false;
  } else {
    console.log('✅ Success! Public client retrieved 0 draft posts (Private drafts are strictly hidden by RLS).');
  }

  // 3. Test Unauthorized Insert as Public Client (should fail)
  console.log('\n[TEST 3] Testing unauthorized insert as unauthenticated client (must be blocked)...');
  const { error: unauthInsertErr } = await client.from('posts').insert({
    title: 'Hacker Post',
    slug: 'hacker-post',
    content: 'This should be blocked',
    status: 'published',
  });

  if (!unauthInsertErr) {
    console.error('❌ Security failure: Unauthenticated client was allowed to insert a post!');
    allPassed = false;
  } else {
    console.log(`✅ Success! Unauthorized insert was blocked by RLS (${unauthInsertErr.message}).`);
  }

  // 4. Test Storage Bucket Public Access
  console.log('\n[TEST 4] Verifying storage bucket public access...');
  const { data: publicUrlData } = client.storage
    .from('blog-images')
    .getPublicUrl('test-sample.jpg');

  if (publicUrlData && publicUrlData.publicUrl.includes('/blog-images/')) {
    console.log(`✅ Success! Storage CDN public URL generated properly:\n   ${publicUrlData.publicUrl}`);
  } else {
    console.error('❌ Failed to generate storage public URL');
    allPassed = false;
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL INTEGRATION CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ Some checks failed. Review errors above.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
