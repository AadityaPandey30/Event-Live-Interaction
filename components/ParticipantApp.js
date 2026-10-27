'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { QUESTIONS, TOTAL_QUESTIONS } from '@/lib/questions';
import { computeResults } from '@/lib/scoring';
import { useSessionSync } from '@/lib/useSessionSync';
import ResultsScreen from './ResultsScreen';

const STATUS_COPY = {
  paused: 'Aaditya has paused the assessment for a moment.',
  ended: 'This assessment session has ended. Thank you for participating.',
};

const emptyProfile = { name: '', company: '' };

export default function ParticipantApp() {
  const [profile, setProfile] = useState(emptyProfile);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [viewIndex, setViewIndex] = useState(0);
  // Version at which the participant last moved to its current question.
  const [allowedVersion, setAllowedVersion] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [missing, setMissing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [participantId] = useState(() => globalThis.crypto?.randomUUID?.() || String(Date.now()));
  const startedRef = useRef(false);

  const viewIndexRef = useRef(0);
  viewIndexRef.current = viewIndex;

  const { state, connected, realtimeMode, refresh } = useSessionSync({
    onUpdate: (next) => {
      // Land on the presenter's question whenever it has moved ahead of us.
      if (!startedRef.current) return;
      if (next.questionIndex > viewIndexRef.current) {
        setWaiting(false);
        setViewIndex(next.questionIndex);
      }
    },
  });

  const results = useMemo(() => (finished ? computeResults(answers) : null), [finished, answers]);

  const currentIndex = state?.questionIndex ?? 0;
  const presenterAhead = started && state && viewIndex < currentIndex;
  const presenterBehind = started && state && viewIndex > currentIndex;
  const unlockedHere =
    Boolean(state) && viewIndex === currentIndex && state.status === 'live' && state.unlockVersion > allowedVersion;

  useEffect(() => {
    if (presenterAhead) {
      setViewIndex(currentIndex);
      setAllowedVersion(state.unlockVersion);
    }
  }, [presenterAhead, currentIndex, state]);

  const handleStart = (event) => {
    event.preventDefault();
    const name = profile.name.trim();
    const company = profile.company.trim();
    if (name.length < 2 || company.length < 2) return;
    setProfile({ name, company });
    setStarted(true);
    startedRef.current = true;
    setViewIndex(state?.questionIndex ?? 0);
    setAllowedVersion(state?.unlockVersion ?? 0);
    setWaiting(false);
  };

  const question = QUESTIONS[viewIndex] || QUESTIONS[0];
  const selected = answers[question.number];

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [question.number]: value }));
    setMissing(false);
  };

  const handleNext = () => {
    if (selected === undefined) {
      setMissing(true);
      return;
    }
    setMissing(false);
    if (unlockedHere) {
      setWaiting(false);
      if (viewIndex === TOTAL_QUESTIONS - 1) {
        setFinished(true);
        return;
      }
      setViewIndex(viewIndex + 1);
      return;
    }
    // Not yet authorized by the presenter: hold position and confirm with the server.
    setWaiting(true);
    refresh();
  };

  const handlePrevious = () => {
    if (viewIndex === 0) return;
    setWaiting(false);
    setViewIndex((i) => Math.max(0, i - 1));
  };

  if (!started) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-10">
        <div className="mb-8">
          <p className="eyebrow">Catalygn Edge</p>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ink-900 sm:text-4xl">
            Business Health Check
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ink-600">
            Fifteen questions on your sales, operations and finance. Aaditya will walk through each one with you.
          </p>
        </div>

        <form onSubmit={handleStart} className="card p-6" noValidate>
          <div className="mb-5">
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input
              id="name"
              className="field"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              autoComplete="name"
              maxLength={80}
              required
            />
          </div>
          <div className="mb-6">
            <label className="label" htmlFor="company">
              Company name
            </label>
            <input
              id="company"
              className="field"
              value={profile.company}
              onChange={(e) => setProfile((p) => ({ ...p, company: e.target.value }))}
              autoComplete="organization"
              maxLength={120}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={profile.name.trim().length < 2 || profile.company.trim().length < 2 || !state}
          >
            {state ? 'Begin' : 'Connecting…'}
          </button>
          {!connected && error && (
            <p className="mt-3 text-sm text-amber-700" role="status">
              Reconnecting to the live session… you can still enter your details.
            </p>
          )}
        </form>
      </main>
    );
  }

  if (finished && results?.complete) {
    return (
      <ResultsScreen
        profile={profile}
        answers={answers}
        results={results}
        participantId={participantId}
        sessionId={state?.sessionId || ''}
      />
    );
  }

  const lockedCopy =
    state?.status === 'paused' || state?.status === 'ended'
      ? STATUS_COPY[state.status]
      : 'Please wait for Aaditya to move to the next question.';

  const progressPercent = Math.round(((viewIndex + 1) / TOTAL_QUESTIONS) * 100);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">Catalygn Edge · Business Health Check</p>
          <p className="mt-1 truncate text-sm text-ink-500">
            {profile.name} · {profile.company}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-ink-500" aria-live="polite">
          <span
            className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-brand-500' : 'bg-amber-500'}`}
            aria-hidden="true"
          />
          {connected ? 'Live' : 'Reconnecting'}
        </div>
      </header>

      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_QUESTIONS} aria-valuenow={viewIndex + 1}>
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      <section className="card mt-6 flex flex-1 flex-col p-6 sm:p-8">
        <h1 className="font-serif text-xl leading-snug text-ink-900 sm:text-2xl">{question.prompt}</h1>

        <fieldset className="mt-6 space-y-3">
          <legend className="sr-only">Choose one option</legend>
          {question.options.map((option, index) => {
            const isSelected = selected === index;
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-base transition ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-600/20'
                    : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${question.number}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleSelect(index)}
                  className="mt-1 h-4 w-4 shrink-0 accent-brand-700"
                />
                <span className="text-ink-800">{option}</span>
              </label>
            );
          })}
        </fieldset>

        {missing && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800" role="alert">
            Please select an option before continuing.
          </p>
        )}

        {(waiting || presenterBehind) && (
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-3 text-sm font-medium text-brand-800" role="status">
            {lockedCopy}
          </p>
        )}

        <div className="mt-auto flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className="btn-ghost" onClick={handlePrevious} disabled={viewIndex === 0}>
            Previous
          </button>
          <button type="button" className="btn-primary w-full sm:w-auto sm:min-w-[180px]" onClick={handleNext}>
            {waiting ? 'Waiting for Aaditya…' : 'Next'}
          </button>
        </div>
      </section>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
        <span>
          Question {viewIndex + 1} of {TOTAL_QUESTIONS}
        </span>
        <span>{realtimeMode === 'realtime' ? 'Synced live' : 'Auto-refresh every 12s'}</span>
      </footer>
    </main>
  );
}
