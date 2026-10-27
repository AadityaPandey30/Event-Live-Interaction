import { NextResponse } from 'next/server';
import { requireController, isControllerConfigured } from '@/lib/auth';

const noStore = { 'Cache-Control': 'no-store' };

// Verifies the secret without exposing it to the browser; the typed secret is
// kept in sessionStorage and only sent as a header on subsequent requests.
export async function POST(request) {
  if (!isControllerConfigured()) {
    return NextResponse.json({ error: 'Controller secret is not configured on the server.' }, { status: 500, headers: noStore });
  }
  if (!requireController(request)) {
    return NextResponse.json({ error: 'Incorrect access secret.' }, { status: 401, headers: noStore });
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
