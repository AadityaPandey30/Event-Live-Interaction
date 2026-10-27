import { NextResponse } from 'next/server';
import { readSessionState } from '@/lib/sessionStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// Participants only ever receive synchronization state - never question content.
export async function GET() {
  try {
    const { state, persisted } = await readSessionState();
    return NextResponse.json(
      {
        sessionId: state.sessionId,
        questionIndex: state.questionIndex,
        status: state.status,
        unlockVersion: state.unlockVersion,
        updatedAt: state.updatedAt,
        persisted,
        serverTime: new Date().toISOString(),
      },
      { headers: noStore }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to read session state.' }, { status: 500, headers: noStore });
  }
}
