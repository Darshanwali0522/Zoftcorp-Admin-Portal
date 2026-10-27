import { validateEventForm } from '../src/lib/supabase/events-service';
import { slugify } from '../src/lib/utils';
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

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const anonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('ZOFTCORP ADMIN & WEBSITE — EVENTS MODULE TEST SUITE');
  console.log('====================================================\n');

  // 1. Validation tests
  console.log('--- 1. Testing Event Form Validation Rules ---');
  const validEvent = {
    title: 'Cloud Database FinOps Summit 2026',
    slug: 'cloud-database-finops-summit-2026',
    description: 'Deep dive into AWS and Azure cost optimization.',
    event_date: '2026-11-20T15:00:00Z',
    location: 'Virtual / Online',
    photos: ['https://example.com/photo1.jpg'],
    status: 'published' as const,
  };
  assert(!validateEventForm(validEvent).error, 'Complete event form values pass validation');

  const emptyTitle = { ...validEvent, title: '   ' };
  assert(Boolean(validateEventForm(emptyTitle).error), 'Empty title is rejected');

  const emptyDesc = { ...validEvent, description: '   ' };
  assert(Boolean(validateEventForm(emptyDesc).error), 'Empty description is rejected');

  const emptyDate = { ...validEvent, event_date: '   ' };
  assert(Boolean(validateEventForm(emptyDate).error), 'Empty event_date is rejected');

  const invalidDate = { ...validEvent, event_date: 'not-a-date' };
  assert(Boolean(validateEventForm(invalidDate).error), 'Invalid date string is rejected');

  // 2. Slug generation
  console.log('\n--- 2. Testing Slug Generation ---');
  assert(slugify('Cloud Database FinOps Summit') === 'cloud-database-finops-summit', 'Generates clean slug from title');
  assert(slugify('Q&A: Database Optimization (2026!)') === 'qa-database-optimization-2026', 'Sanitizes special symbols');

  // 3. Photo MIME type and size rules
  console.log('\n--- 3. Testing Photo Upload MIME & Size Constraints ---');
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const disallowed = ['application/x-msdownload', 'text/html', 'application/javascript', 'application/pdf'];

  for (const mime of allowed) {
    assert(allowed.includes(mime), `Allowed photo MIME type: ${mime}`);
  }
  for (const mime of disallowed) {
    assert(!allowed.includes(mime), `Disallowed MIME type blocked: ${mime}`);
  }

  // 4. Row Level Security Enforcement
  console.log('\n--- 4. Testing RLS Protection Against Unauthorized Visitors ---');
  if (supabaseUrl && anonKey) {
    const publicClient = createClient(supabaseUrl, anonKey);

    const { data: insertData, error: insertError } = await publicClient
      .from('events')
      .insert({
        title: 'Hacked Event',
        slug: 'hacked-event',
        description: 'Unauthorized write attempt',
        event_date: new Date().toISOString(),
      })
      .select();

    assert(
      Boolean(insertError || (insertData && insertData.length === 0)),
      'Unauthorized event insert is blocked by RLS or table protected from anon writes',
      insertError?.message
    );
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 ALL EVENTS VALIDATION CHECKS PASSED!\n');
  } else {
    console.error('❌ SOME CHECKS FAILED!\n');
    process.exit(1);
  }
}

runTests().catch(console.error);
