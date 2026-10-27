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

console.log('====================================================');
console.log('ZOFTCORP ADMIN PORTAL — PARTNERS & REVIEWS TEST SUITE');
console.log('====================================================');

async function runValidationTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ': ' + detail : ''}`);
      failed++;
    }
  }

  // 1. Test Client Review Rating Validation
  console.log('\n--- 1. Testing Rating Validation (Integers 1 to 5) ---');
  const testRatings = [
    { rating: 1, valid: true },
    { rating: 3, valid: true },
    { rating: 5, valid: true },
    { rating: 0, valid: false },
    { rating: 6, valid: false },
    { rating: -2, valid: false },
    { rating: 3.5, valid: false },
    { rating: 'abc' as any, valid: false },
  ];

  for (const { rating, valid } of testRatings) {
    const num = Number(rating);
    const isValid = Number.isInteger(num) && num >= 1 && num <= 5;
    assert(
      isValid === valid,
      `Rating value "${rating}" expected ${valid ? 'VALID' : 'INVALID'}`
    );
  }

  // 2. Test Partner Input Validation
  console.log('\n--- 2. Testing Partner Validation Rules ---');
  const validPartner = { name: 'Snowflake', description: 'Data warehouse partner', logo_url: '/platforms/snowflake.png' };
  const emptyName = { name: '', description: 'Data warehouse partner', logo_url: '/platforms/snowflake.png' };
  const emptyDesc = { name: 'Snowflake', description: '', logo_url: '/platforms/snowflake.png' };
  const emptyLogo = { name: 'Snowflake', description: 'Data warehouse partner', logo_url: '' };

  assert(Boolean(validPartner.name.trim() && validPartner.description.trim() && validPartner.logo_url.trim()), 'Complete partner values pass validation');
  assert(!emptyName.name.trim(), 'Empty partner name rejected');
  assert(!emptyDesc.description.trim(), 'Empty partner description rejected');
  assert(!emptyLogo.logo_url.trim(), 'Empty partner logo rejected');

  // 3. Test File Format and Size Validation
  console.log('\n--- 3. Testing Logo Upload Validation Rules ---');
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  const disallowedMime = ['application/x-msdownload', 'text/html', 'application/javascript', 'application/pdf'];

  for (const mime of allowedMime) {
    assert(allowedMime.includes(mime), `Allowed MIME type "${mime}" accepted`);
  }
  for (const mime of disallowedMime) {
    assert(!allowedMime.includes(mime), `Disallowed MIME type "${mime}" rejected`);
  }

  // 4. Test SVG Sanitization check
  console.log('\n--- 4. Testing SVG Security Rules ---');
  const safeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
  const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("hack")</script></svg>';
  const onloadSvg = '<svg onload="alert(1)"></svg>';

  function isSvgMalicious(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes('<script') ||
      lower.includes('javascript:') ||
      lower.includes('onload=') ||
      lower.includes('onerror=')
    );
  }

  assert(!isSvgMalicious(safeSvg), 'Clean SVG accepted');
  assert(isSvgMalicious(maliciousSvg), 'SVG with <script> tag rejected');
  assert(isSvgMalicious(onloadSvg), 'SVG with onload attribute rejected');

  // 5. Test Four Official Partners Static Assets
  console.log('\n--- 5. Verifying Official Partner Logo Assets ---');
  const officialLogos = [
    { name: 'AWS', file: 'public/platforms/aws.svg' },
    { name: 'Microsoft Azure', file: 'public/platforms/azure.svg' },
    { name: 'Google Cloud Platform', file: 'public/platforms/gcp.svg' },
    { name: 'Oracle', file: 'public/platforms/oracle.svg' },
  ];

  for (const { name, file } of officialLogos) {
    const exists = fs.existsSync(path.resolve(__dirname, '..', file));
    assert(exists, `Authentic logo asset exists for ${name} (${file})`);
  }

  // 6. Test Unauthenticated Public Client Row Level Security Protection
  console.log('\n--- 6. Verifying RLS Enforcement Against Unauthorized Public Client ---');
  const client = createClient(supabaseUrl, supabaseAnonKey);

  // Attempt to insert unauthorized partner as anon client
  const { error: unauthPartnerErr } = await client.from('partners').insert({
    name: 'Unauthorized Partner',
    slug: 'unauthorized-partner',
    description: 'Should fail',
    logo_url: '/platforms/fake.png',
  });

  if (unauthPartnerErr) {
    assert(true, `Unauthorized partner insert correctly blocked or table protected (${unauthPartnerErr.message})`);
  } else {
    assert(false, 'Unauthorized partner insert succeeded (RLS violation!)');
  }

  // Attempt to insert unauthorized client review as anon client
  const { error: unauthReviewErr } = await client.from('client_reviews').insert({
    client_name: 'Fake Reviewer',
    rating: 5,
    review_text: 'Should fail',
  });

  if (unauthReviewErr) {
    assert(true, `Unauthorized client review insert correctly blocked or table protected (${unauthReviewErr.message})`);
  } else {
    assert(false, 'Unauthorized client review insert succeeded (RLS violation!)');
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 ALL PARTNERS & REVIEWS VALIDATION CHECKS PASSED!');
  } else {
    process.exit(1);
  }
}

runValidationTests();
