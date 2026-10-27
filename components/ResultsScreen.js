'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AADITYA, DISCLAIMER } from '@/lib/brand';
import { PILLARS } from '@/lib/questions';
import { downloadBusinessHealthReport } from '@/lib/pdfReport';

const PILLAR_SHORT = { sales: 'Sales', operations: 'Operations', finance: 'Finance' };

function ScoreRing({ value, size = 148, stroke = 12, color = '#266555', track = '#eceef2', label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label || `${value} out of 100`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.28} fontWeight="700" fill="#12161d">
        {value}
      </text>
      <text x="50%" y="67%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.1} fill="#627085">
        / 100
      </text>
    </svg>
  );
}

function PillarBar({ pillar }) {
  const color = pillar.key === 'sales' ? '#266555' : pillar.key === 'operations' ? '#4f9b85' : '#c9a961';
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink-800">{pillar.label}</span>
        <span className="text-sm font-semibold text-ink-900">
          {pillar.score}<span className="text-ink-400">/100</span>
        </span>
      </div>
      <div
        className="mt-2 h-3 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-label={`${pillar.label} score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pillar.score}
      >
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pillar.score}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1 text-xs text-ink-400">
        {pillar.pointsEarned} of {pillar.pointsMax} points
      </p>
    </div>
  );
}

const names = (keys) => keys.map((k) => PILLAR_SHORT[k] || k).join(' and ');

export default function ResultsScreen({ profile, answers, results, participantId }) {
  const [submissionId] = useState(() => globalThis.crypto?.randomUUID?.());
  const [status, setStatus] = useState('idle'); // idle | saving | saved | failed
  const [submitError, setSubmitError] = useState('');
  const [pdfState, setPdfState] = useState('idle');
  const [redirecting, setRedirecting] = useState(false);
  const assessedAt = useMemo(() => new Date().toISOString(), []);
  const inFlight = useRef(false);

  const submit = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('saving');
    setSubmitError('');
    const payload = {
      submissionId,
      participantId,
      participantName: profile.name,
      companyName: profile.company,
      answers,
      pillarScores: results.pillarScores,
      overallScore: results.overallScore,
      classification: results.classification.label,
      scoringVersion: results.scoringVersion,
      assessmentTimestamp: assessedAt,
    };
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Submission failed (${response.status})`);
      }
      setStatus('saved');
    } catch (err) {
      setStatus('failed');
      setSubmitError(err.message || 'Submission failed.');
    } finally {
      inFlight.current = false;
    }
  }, [answers, assessedAt, participantId, profile.company, profile.name, results, submissionId]);

  useEffect(() => {
    submit();
  }, [submit]);

  const handleDownload = async () => {
    setPdfState('generating');
    try {
      await downloadBusinessHealthReport({ profile, answers, results, assessedAt });
      setPdfState('done');
      setRedirecting(true);
      // Give the browser time to commit the download before navigating away.
      setTimeout(() => {
        window.location.href = AADITYA.portfolioUrl;
      }, 2500);
    } catch (err) {
      setPdfState('error');
    }
  };

  const primary = results.areaToInvestigate;
  const secondary = results.secondaryArea;
  const strength = results.relativeStrength;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Catalygn Edge</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-ink-900 sm:text-4xl">Your Business Health Report</h1>
          <p className="mt-2 text-sm text-ink-500">
            {profile.name} · {profile.company} · {new Date(assessedAt).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-xs font-medium" aria-live="polite">
          {status === 'saving' && <span className="text-ink-400">Saving your submission…</span>}
          {status === 'saved' && <span className="text-brand-700">Submission saved</span>}
          {status === 'failed' && (
            <button type="button" onClick={submit} className="rounded-lg bg-amber-100 px-3 py-2 font-semibold text-amber-900">
              Not saved · Retry
            </button>
          )}
        </div>
      </header>

      {status === 'failed' && submitError && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          {submitError} Your results are kept on this screen; retrying will not create a duplicate record.
        </p>
      )}

      <section className="card mt-6 grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
        <div className="flex justify-center">
          <ScoreRing value={results.overallScore} label={`Overall Business Health Score: ${results.overallScore} out of 100`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-500">Overall Business Health Score</p>
          <p className="mt-1 font-serif text-2xl text-ink-900">{results.classification.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{results.classification.interpretation}</p>
          <p className="mt-3 text-xs text-ink-400">
            {results.totalEarned} of {results.totalMax} points · scoring {results.scoringVersion}
          </p>
        </div>
      </section>

      <section className="card mt-4 p-6 sm:p-8">
        <h2 className="font-serif text-xl text-ink-900">Pillar scores</h2>
        <div className="mt-5 space-y-5">
          {results.pillarScores.map((p) => (
            <PillarBar key={p.key} pillar={p} />
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Primary area to investigate</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">{names(primary)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Secondary area</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">{secondary.length ? names(secondary) : 'None — a clear strength stands out'}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Relative strength</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">{names(strength)}</p>
        </div>
      </section>

      <section className="card mt-4 p-6 sm:p-8">
        <h2 className="font-serif text-xl text-ink-900">What this suggests, and what to do next</h2>
        <ul className="mt-4 space-y-4">
          {results.recommendations.map((rec, index) => (
            <li key={`${rec.pillar || 'overall'}-${index}`} className="border-l-2 border-brand-600 pl-4">
              <p className="text-sm font-semibold text-ink-900">{rec.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{rec.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 p-6 sm:p-8">
        <p className="eyebrow">Who you are speaking with</p>
        <h2 className="mt-2 font-serif text-2xl text-ink-900">{AADITYA.name}</h2>
        <p className="text-sm font-semibold text-ink-500">{AADITYA.role} · Catalygn Edge</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-700">{AADITYA.summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {AADITYA.achievements.map((item) => (
            <div key={item.stat} className="rounded-xl bg-ink-50 p-4">
              <p className="font-serif text-2xl text-brand-700">{item.stat}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{item.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-600">{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-400">{AADITYA.disclaimer}</p>
        <a className="mt-4 inline-block text-sm font-semibold text-brand-700 underline" href={AADITYA.portfolioUrl} rel="noopener noreferrer" target="_blank">
          View Aaditya&apos;s portfolio
        </a>
      </section>

      <section className="card mt-4 p-6 sm:p-8">
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={handleDownload} disabled={pdfState === 'generating' || redirecting}>
          {pdfState === 'generating' ? 'Preparing your report…' : 'Download Business Health Report'}
        </button>
        <p className="mt-3 text-sm text-ink-500" aria-live="polite">
          {redirecting
            ? 'Download started. Taking you to Aaditya\u2019s portfolio…'
            : pdfState === 'error'
            ? 'The report could not be generated on this device. Please try again.'
            : 'A personalized PDF with your scores, interpretation and next steps.'}
        </p>
        {redirecting && (
          <a className="mt-2 inline-block text-sm font-semibold text-brand-700 underline" href={AADITYA.portfolioUrl}>
            Continue to the portfolio now
          </a>
        )}
      </section>

      <p className="mt-6 rounded-xl bg-ink-900 p-5 text-xs leading-relaxed text-ink-200">{DISCLAIMER}</p>
      <p className="mt-3 text-center text-xs text-ink-400">
        {PILLARS.sales.label} · {PILLARS.operations.label} · {PILLARS.finance.label}
      </p>
    </main>
  );
}
