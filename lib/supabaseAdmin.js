import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer the service role key when present; otherwise fall back to the publishable
// key, which still reaches Postgres from the server (RLS blocks it on the client).
const serverKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('your-')
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isDbConfigured() {
  return Boolean(url && serverKey);
}

export function usingServiceRole() {
  return serverKey === process.env.SUPABASE_SERVICE_ROLE_KEY && Boolean(serverKey);
}

let cached = null;

// Server-only client: this key must never reach the browser bundle.
export function getDb() {
  if (!isDbConfigured()) return null;
  if (!cached) {
    cached = createClient(url, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'X-Client-Info': 'catalygn-edge-bhc-server' } },
    });
  }
  return cached;
}
