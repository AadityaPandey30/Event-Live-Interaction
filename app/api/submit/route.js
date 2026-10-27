import { NextResponse } from 'next/server';
import { getDb, isDbConfigured } from '@/lib/supabaseAdmin';
import { validateSubmission } from '@/lib/validation';
import { computeResults, SCORING_VERSION } from '@/lib/scoring';
import { SESSION_ID } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = { 'Cache-Control': 'no-store' };

// Single POST per completed assessment. Scores are recomputed here; the client's
// numbers are only cross-checked, never trusted.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: noStore });
  }

  const validated = validateSubmission(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error, fields: validated.fields || [] }, { status: 422, headers: noStore });
  }

  const { submissionId, participantId, participantName, companyName, answers } = validated.data;
  const results = computeResults(answers);
  if (!results.complete) {
    return NextResponse.json(
      { error: 'Assessment is incomplete. Unanswered questions must not be scored as zero.', fields: results.missing.map((n) => `answers.${n}`) },
      { status: 422, headers: noStore }
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Storage is not configured on this deployment.' }, { status: 503, headers: noStore });
  }

  const row = {
    submission_id: submissionId,
    participant_id: participantId,
    session_id: SESSION_ID,
    participant_name: participantName,
    company_name: companyName,
    answers,
    sales_score: results.pillarScores.find((p) => p.key === 'sales').score,
    operations_score: results.pillarScores.find((p) => p.key === 'operations').score,
    finance_score: results.pillarScores.find((p) => p.key === 'finance').score,
    total_points: results.totalEarned,
    overall_score: results.overallScore,
    classification: results.classification.label,
    weakest_pillar: results.areaToInvestigate[0] || null,
    scoring_version: SCORING_VERSION,
    assessed_at: typeof body.assessmentTimestamp === 'string' ? body.assessmentTimestamp : new Date().toISOString(),
  };

  const db = getDb();

  const { error } = await db.from('bhc_assessments').insert(row);

  if (error) {
    // 23505 = unique_violation on submission_id: the retry path hitting an already-stored record.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true, submissionId, serverResults: results }, { status: 200, headers: noStore });
    }
    return NextResponse.json({ error: `Could not save the assessment: ${error.message}` }, { status: 500, headers: noStore });
  }

  return NextResponse.json({ ok: true, duplicate: false, submissionId, serverResults: results }, { status: 201, headers: noStore });
}
