import { NextResponse } from 'next/server';
import { requireController, isControllerConfigured } from '@/lib/auth';
import { advanceSession, readSessionState } from '@/lib/sessionStore';
import { TOTAL_QUESTIONS } from '@/lib/questions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ACTIONS = new Set(['next', 'prev', 'reset', 'pause', 'resume', 'end']);

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  if (!isControllerConfigured()) {
    return NextResponse.json({ error: 'Controller secret is not configured on the server.' }, { status: 500, headers: noStore });
  }
  if (!requireController(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: noStore });
  }
  try {
    const { state, persisted } = await readSessionState();
    return NextResponse.json(
      { ...state, persisted, totalQuestions: TOTAL_QUESTIONS },
      { headers: noStore }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: noStore });
  }
}

export async function POST(request) {
  if (!isControllerConfigured()) {
    return NextResponse.json({ error: 'Controller secret is not configured on the server.' }, { status: 500, headers: noStore });
  }
  if (!requireController(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: noStore });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: noStore });
  }

  const action = typeof body?.action === 'string' ? body.action : '';
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ error: `action must be one of: ${[...ACTIONS].join(', ')}` }, { status: 400, headers: noStore });
  }
  const expectedVersion = Number.isInteger(body?.expectedVersion) ? body.expectedVersion : null;
  if (action !== 'reset' && action !== 'pause' && action !== 'resume' && action !== 'end' && expectedVersion === null) {
    return NextResponse.json({ error: 'expectedVersion is required for this action.' }, { status: 400, headers: noStore });
  }

  try {
    const state = await advanceSession({ action, expectedVersion });
    return NextResponse.json({ ...state, totalQuestions: TOTAL_QUESTIONS }, { headers: noStore });
  } catch (error) {
    const status = error.status || 500;
    const payload = { error: error.message };
    if (error.state) payload.state = { ...error.state, totalQuestions: TOTAL_QUESTIONS };
    return NextResponse.json(payload, { status, headers: noStore });
  }
}
