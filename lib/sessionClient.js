async function readSessionState() {
  const response = await fetch('/api/session', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Session state unavailable (${response.status})`);
  const raw = await response.json();
  const questionIndex = Number(raw?.questionIndex);
  const unlockVersion = Number(raw?.unlockVersion);
  if (!Number.isInteger(questionIndex) || !Number.isInteger(unlockVersion)) {
    throw new Error('Malformed session state.');
  }
  return {
    sessionId: typeof raw.sessionId === 'string' ? raw.sessionId : '',
    questionIndex,
    status: typeof raw.status === 'string' ? raw.status : 'live',
    unlockVersion,
  };
}

export { readSessionState };
