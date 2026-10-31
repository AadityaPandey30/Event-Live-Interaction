'use client';

import { useMemo, useState } from 'react';
import { QUESTIONS, TOTAL_QUESTIONS } from '@/lib/questions';
import { computeResults } from '@/lib/scoring';
import ResultsScreen from './ResultsScreen';

const emptyProfile = { name: '', company: '' };

export default function ParticipantApp() {
  const [profile, setProfile] = useState(emptyProfile);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [viewIndex, setViewIndex] = useState(0);
  const [missing, setMissing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [participantId] = useState(() => globalThis.crypto?.randomUUID?.() || String(Date.now()));

  const results = useMemo(() => (finished ? computeResults(answers) : null), [finished, answers]);

  const handleStart = (event) => {
    event.preventDefault();
    const name = profile.name.trim();
    const company = profile.company.trim();
    if (name.length < 2 || company.length < 2) return;
    setProfile({ name, company });
    setStarted(true);
    setViewIndex(0);
    setMissing(false);
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
    if (viewIndex === TOTAL_QUESTIONS - 1) {
      setFinished(true);
    } else {
      setViewIndex((i) => i + 1);
    }
  };

  const handlePrevious = () => {
    if (viewIndex === 0) return;
    setMissing(false);
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
            Nine questions on your sales, operations and finance systems.
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
            disabled={profile.name.trim().length < 2 || profile.company.trim().length < 2}
          >
            Begin
          </button>
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
      />
    );
  }

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

        <div className="mt-auto flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" className="btn-ghost" onClick={handlePrevious} disabled={viewIndex === 0}>
            Previous
          </button>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto sm:min-w-[180px]"
            onClick={handleNext}
            disabled={selected === undefined}
          >
            {viewIndex === TOTAL_QUESTIONS - 1 ? 'View Results' : 'Next'}
          </button>
        </div>
      </section>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-400">
        <span>
          Question {viewIndex + 1} of {TOTAL_QUESTIONS}
        </span>
      </footer>
    </main>
  );
}
