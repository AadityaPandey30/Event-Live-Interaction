'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { QUESTIONS, TOTAL_QUESTIONS, PILLARS } from '@/lib/questions';

const STATUS_BADGE = {
  live: { label: 'Live', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  paused: { label: 'Paused', className: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  ended: { label: 'Ended', className: 'bg-rose-500/15 text-rose-300 ring-rose-500/30' },
};

export default function ControllerApp() {
  const [state, setState] = useState(null);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const stateRef = useRef(null);
  stateRef.current = state;

  const authHeaders = useCallback(() => ({ 'Content-Type': 'application/json' }), []);

  const loadState = useCallback(async () => {
    try {
      const response = await fetch('/api/controller', { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load state (${response.status})`);
      }
      setState(await response.json());
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to reach the session.');
    }
  }, []);

  useEffect(() => {
    loadState();
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      loadState();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadState]);

  const act = async (action) => {
    const current = stateRef.current;
    if (!current) return;
    setBusyAction(action);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/controller', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action, expectedVersion: current.unlockVersion }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        if (data.state) setState(data.state);
        setNotice(data.error || 'Another action landed first; state refreshed.');
        return;
      }
      if (!response.ok) throw new Error(data.error || `Action failed (${response.status})`);

      setState(data);
      setNotice(
        action === 'next'
          ? `Question ${Math.min(data.questionIndex + 1, TOTAL_QUESTIONS)} unlocked for all participants.`
          : 'Updated.'
      );
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setBusyAction('');
      setTick((t) => t + 1);
    }
  };

  const questionIndex = state?.questionIndex ?? 0;
  const question = QUESTIONS[questionIndex];
  const pillar = question ? PILLARS[question.pillar] : null;
  const badge = STATUS_BADGE[state?.status] || STATUS_BADGE.live;
  const isLast = questionIndex >= TOTAL_QUESTIONS - 1;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">Catalygn Edge</p>
          <h1 className="mt-1 font-serif text-2xl text-white">Controller</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {state && (
            <span className={`rounded-full px-3 py-1 font-semibold ring-1 ${badge.className}`}>{badge.label}</span>
          )}
          <span className="text-ink-400">v{state?.unlockVersion ?? 0}</span>
        </div>
      </header>

      {!state && !error && <p className="mt-8 text-sm text-ink-400">Loading session state…</p>}
      {error && (
        <p className="mt-6 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
      {state && state.persisted === false && (
        <p className="mt-6 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="alert">
          Database not configured. Progression is not persisted and participants will not stay in sync.
        </p>
      )}

      {state && question && (
        <>
          <section className="mt-6 rounded-2xl border border-ink-800 bg-ink-900 p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400">
                Question {questionIndex + 1} of {TOTAL_QUESTIONS}
              </p>
              <p className="text-xs text-ink-400">{pillar?.label}</p>
            </div>
            <h2 className="mt-3 font-serif text-xl leading-snug text-white sm:text-2xl">{question.prompt}</h2>
            <ol className="mt-5 space-y-2">
              {question.options.map((option, index) => (
                <li key={option} className="flex gap-3 rounded-lg bg-ink-950/60 px-3 py-2 text-sm text-ink-200">
                  <span className="font-semibold text-gold-400">{index}</span>
                  <span>{option}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => act('next')}
              disabled={Boolean(busyAction) || isLast}
              className="w-full rounded-xl bg-gold-500 px-6 py-4 text-lg font-bold text-ink-950 transition hover:bg-gold-400 disabled:opacity-40 sm:flex-1"
            >
              {busyAction === 'next' ? 'Unlocking…' : isLast ? 'Last question' : 'Next question →'}
            </button>
            <button
              type="button"
              onClick={() => act('prev')}
              disabled={Boolean(busyAction) || questionIndex === 0}
              className="rounded-xl border border-ink-700 px-5 py-4 text-sm font-semibold text-ink-200 transition hover:bg-ink-900 disabled:opacity-40"
            >
              Previous
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => act(state.status === 'paused' ? 'resume' : 'pause')}
              disabled={Boolean(busyAction)}
              className="rounded-lg border border-ink-800 px-3 py-2 text-xs font-semibold text-ink-300 hover:bg-ink-900 disabled:opacity-40"
            >
              {state.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={() => act('end')}
              disabled={Boolean(busyAction)}
              className="rounded-lg border border-ink-800 px-3 py-2 text-xs font-semibold text-ink-300 hover:bg-ink-900 disabled:opacity-40"
            >
              End session
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset the session to question 1 for everyone?')) act('reset');
              }}
              disabled={Boolean(busyAction)}
              className="rounded-lg border border-ink-800 px-3 py-2 text-xs font-semibold text-ink-300 hover:bg-ink-900 disabled:opacity-40"
            >
              Reset to Q1
            </button>
            <button
              type="button"
              onClick={() => loadState()}
              className="rounded-lg border border-ink-800 px-3 py-2 text-xs font-semibold text-ink-300 hover:bg-ink-900"
            >
              Refresh
            </button>
          </div>

          <p className="mt-4 min-h-[20px] text-sm text-emerald-300" aria-live="polite">
            {notice}
          </p>
          <p className="mt-6 text-xs leading-relaxed text-ink-500">
            Participants see only the current question. Unlocking increments the unlock version, and participant screens pick
            it up within a few seconds by polling. Last check {tick} · state updated{' '}
            {state.updatedAt ? new Date(state.updatedAt).toLocaleTimeString('en-IN') : '—'}.
          </p>
        </>
      )}
    </main>
  );
}
