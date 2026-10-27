import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isDbConfigured() {
  return Boolean(url && serviceRoleKey);
}

let cached = null;

// Server-only client. The service role key must never reach the browser bundle.
export function getDb() {
  if (!isDbConfigured()) return null;
  if (!cached) {
    cached = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'X-Client-Info': 'catalygn-edge-bhc-server' } },
    });
  }
  return cached;
}
