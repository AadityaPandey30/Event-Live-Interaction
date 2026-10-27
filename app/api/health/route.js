import { NextResponse } from 'next/server';
import { getDb, isDbConfigured, usingServiceRole } from '@/lib/supabaseAdmin';
import { SESSION_ID, startIndex } from '@/lib/session';
import { TOTAL_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = { 'Cache-Control': 'no-store' };

// Deployment check for Supabase wiring: confirms both tables exist and the
// session row is readable with the service role key.
export async function GET() {
  const report = { configured: isDbConfigured(), keyTier: usingServiceRole() ? 'service_role' : 'publishable', sessionId: SESSION_ID, tables: {}, ok: false };

  if (!report.configured) {
    return NextResponse.json(
      { ...report, error: 'Set NEXT_PUBLIC_SUPABASE_URL and a Supabase key, then redeploy.' },
      { status: 503, headers: noStore }
    );
  }

  const db = getDb();

  // Probe with a real row fetch: a missing table returns 404, and supabase-js can
  // surface that as error:null with count:null, so a status check alone is unsafe.
  const sessions = await db.from('bhc_sessions').select('id').eq('id', SESSION_ID).limit(1);
  report.tables.bhc_sessions = sessions.error ? `error: ${sessions.error.message}` : 'ok';

  const assessments = await db.from('bhc_assessments').select('id').limit(1);
  report.tables.bhc_assessments = assessments.error ? `error: ${assessments.error.message}` : 'ok';

  report.ok = report.tables.bhc_sessions === 'ok' && report.tables.bhc_assessments === 'ok';
  report.startIndex = startIndex();
  report.totalQuestions = TOTAL_QUESTIONS;

  if (!report.ok) {
    return NextResponse.json(
      { ...report, error: 'Run supabase/schema.sql in the Supabase SQL editor.' },
      { status: 503, headers: noStore }
    );
  }
  return NextResponse.json(report, { headers: noStore });
}
