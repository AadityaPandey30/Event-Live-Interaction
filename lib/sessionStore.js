import { getDb } from './supabaseAdmin';
import { SESSION_ID, startIndex } from './session';
import { TOTAL_QUESTIONS } from './questions';

const lastIndex = TOTAL_QUESTIONS - 1;

const DEFAULT_STATE = {
  sessionId: SESSION_ID,
  questionIndex: startIndex(),
  status: 'live',
  unlockVersion: 0,
  updatedAt: null,
};

/**
 * Reads the current synchronization state.
 * Falls back to a deterministic default when the DB is not configured yet so the
 * questionnaire still runs; the controller surfaces the degraded mode.
 */
export async function readSessionState() {
  const db = getDb();
  if (!db) return { state: { ...DEFAULT_STATE }, persisted: false };

  const { data, error } = await db
    .from('bhc_sessions')
    .select('id, question_index, status, unlock_version, updated_at')
    .eq('id', SESSION_ID)
    .maybeSingle();

  if (error) throw new Error(`Failed to read session state: ${error.message}`);

  if (!data) {
    const seeded = { ...DEFAULT_STATE };
    const { data: created, error: insertError } = await db
      .from('bhc_sessions')
      .upsert(
        { id: SESSION_ID, question_index: seeded.questionIndex, status: seeded.status, unlock_version: seeded.unlockVersion },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      .select('id, question_index, status, unlock_version, updated_at')
      .maybeSingle();
    if (insertError) throw new Error(`Failed to initialize session: ${insertError.message}`);
    return { state: created ? toState(created) : seeded, persisted: true };
  }

  return { state: toState(data), persisted: true };
}

function toState(row) {
  return {
    sessionId: row.id,
    questionIndex: row.question_index,
    status: row.status,
    unlockVersion: row.unlock_version,
    updatedAt: row.updated_at,
  };
}

/**
 * Atomically advances the session using a compare-and-swap on unlock_version.
 * Concurrent controller requests therefore cannot skip a question: only the
 * request whose expected version matches wins, everyone else gets a 409.
 *
 * @param {{ action: 'next'|'prev'|'reset'|'pause'|'resume'|'end', expectedVersion: number }} input
 */
export async function advanceSession({ action, expectedVersion }) {
  const db = getDb();
  if (!db) {
    const err = new Error('Database is not configured on this deployment.');
    err.status = 503;
    throw err;
  }

  const { data: current, error: readError } = await db
    .from('bhc_sessions')
    .select('id, question_index, status, unlock_version, updated_at')
    .eq('id', SESSION_ID)
    .maybeSingle();

  if (readError) throw new Error(`Failed to read session: ${readError.message}`);

  const base = current ? toState(current) : { ...DEFAULT_STATE };
  if (Number.isInteger(expectedVersion) && expectedVersion !== base.unlockVersion) {
    const err = new Error('Session changed since you last loaded it. Refreshed with the latest state.');
    err.status = 409;
    err.state = base;
    throw err;
  }

  let nextIndex = base.questionIndex;
  let nextStatus = base.status;
  switch (action) {
    case 'next':
      nextIndex = Math.min(lastIndex, base.questionIndex + 1);
      nextStatus = 'live';
      break;
    case 'prev':
      nextIndex = Math.max(0, base.questionIndex - 1);
      break;
    case 'reset':
      nextIndex = 0;
      nextStatus = 'live';
      break;
    case 'pause':
      nextStatus = 'paused';
      break;
    case 'resume':
      nextStatus = 'live';
      break;
    case 'end':
      nextStatus = 'ended';
      break;
    default: {
      const err = new Error('Unsupported action.');
      err.status = 400;
      throw err;
    }
  }

  const payload = { question_index: nextIndex, status: nextStatus, unlock_version: base.unlockVersion + 1 };

  if (!current) {
    const { data: inserted, error: insertError } = await db
      .from('bhc_sessions')
      .insert({ id: SESSION_ID, ...payload })
      .select('id, question_index, status, unlock_version, updated_at')
      .single();
    if (insertError) throw new Error(`Failed to create session: ${insertError.message}`);
    return toState(inserted);
  }

  const { data: updated, error: updateError } = await db
    .from('bhc_sessions')
    .update(payload)
    .eq('id', SESSION_ID)
    .eq('unlock_version', base.unlockVersion)
    .select('id, question_index, status, unlock_version, updated_at')
    .maybeSingle();

  if (updateError) throw new Error(`Failed to advance session: ${updateError.message}`);

  if (!updated) {
    // Lost the compare-and-swap race: another controller request already advanced it.
    const err = new Error('Another controller action landed first. Refreshed with the latest state.');
    err.status = 409;
    const { data: latest } = await db
      .from('bhc_sessions')
      .select('id, question_index, status, unlock_version, updated_at')
      .eq('id', SESSION_ID)
      .maybeSingle();
    err.state = latest ? toState(latest) : base;
    throw err;
  }

  return toState(updated);
}
