// Applies supabase/schema.sql through the Supabase SQL-over-HTTP endpoint.
// Usage: npm run db:setup  (reads .env.local / .env, or set the vars inline)
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

loadEnv(path.resolve('.env.local'));
loadEnv(path.resolve('.env'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Add them to .env.local, then re-run: npm run db:setup');
  process.exit(1);
}

const sql = readFileSync(path.resolve('supabase/schema.sql'), 'utf8');

const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
  body: JSON.stringify({ sql }),
});

if (!response.ok) {
  const detail = await response.text();
  console.error(`Schema apply failed (${response.status}).`);
  console.error(detail.slice(0, 600));
  console.error('\nFallback: paste supabase/schema.sql into the Supabase SQL Editor, then run:');
  console.error('  node scripts/check-supabase.mjs');
  process.exit(1);
}

console.log('Schema applied. Verifying...');
const verify = await fetch(`${url.replace(/\/$/, '')}/rest/v1/bhc_sessions?select=id&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
console.log(verify.ok ? 'Supabase is ready: bhc_sessions reachable.' : `Verify failed (${verify.status}).`);
