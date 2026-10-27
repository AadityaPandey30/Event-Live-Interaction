import { QUESTIONS, TOTAL_QUESTIONS } from './questions';
import { isValidAnswer } from './scoring';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Validates the single submission payload sent after the participant finishes.
 * @returns {{ ok: true, data: object } | { ok: false, error: string, fields?: string[] }}
 */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid request body.' };
  }

  const sessionId = cleanText(body.sessionId, 120);
  if (!sessionId) return { ok: false, error: 'Missing sessionId.' };
  if (!isUuid(body.submissionId)) return { ok: false, error: 'Invalid submissionId.' };
  if (body.participantId && !isUuid(body.participantId)) return { ok: false, error: 'Invalid participantId.' };

  const participantName = cleanText(body.participantName, 80);
  const companyName = cleanText(body.companyName, 120);
  if (participantName.length < 2) return { ok: false, error: 'Participant name is required.', fields: ['participantName'] };
  if (companyName.length < 2) return { ok: false, error: 'Company name is required.', fields: ['companyName'] };

  const rawAnswers = body.answers;
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    return { ok: false, error: 'Answers must be an object keyed by question number.' };
  }

  const answers = {};
  const invalid = [];
  for (const q of QUESTIONS) {
    const value = rawAnswers[q.number] ?? rawAnswers[String(q.number)];
    if (!isValidAnswer(value)) {
      invalid.push(q.number);
      continue;
    }
    answers[q.number] = value;
  }
  if (invalid.length) {
    return {
      ok: false,
      error:
        invalid.length === TOTAL_QUESTIONS
          ? 'No valid answers supplied.'
          : `Invalid or missing answers for questions: ${invalid.join(', ')}.`,
      fields: invalid.map((n) => `answers.${n}`),
    };
  }

  const extraKeys = Object.keys(rawAnswers).filter((k) => ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'].includes(k));
  if (extraKeys.length) {
    return { ok: false, error: `Unexpected answer keys: ${extraKeys.slice(0, 5).join(', ')}.` };
  }

  return {
    ok: true,
    data: {
      sessionId,
      submissionId: body.submissionId.toLowerCase(),
      participantId: body.participantId ? body.participantId.toLowerCase() : null,
      participantName,
      companyName,
      answers,
    },
  };
}
