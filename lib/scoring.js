import { PILLARS, QUESTIONS, TOTAL_QUESTIONS } from './questions.js';

export const SCORING_VERSION = 'bhs-v1';

export const POINTS_PER_QUESTION = 3;

// Order matters: pillar ranking and classification both read from these.
export const CLASSIFICATIONS = [
  {
    min: 80,
    max: 100,
    label: 'Stronger foundations',
    interpretation: 'Systems appear relatively established; identify the next constraint.',
    action: 'Identify the next constraint and opportunities for measurable optimization.',
  },
  {
    min: 51,
    max: 79,
    label: 'Room to strengthen',
    interpretation: 'Some systems may be inconsistent, under-measured or under-optimized.',
    action: 'Strengthen inconsistent systems and validate where performance is leaking.',
  },
  {
    min: 0,
    max: 50,
    label: 'Priority areas to investigate',
    interpretation: 'Important visibility, process or control gaps may exist.',
    action: 'Establish basic visibility and investigate the most important operational or financial risks first.',
  },
];

export const PILLAR_ACTIONS = {
  sales: 'Investigate lead conversion, follow-up discipline, acquisition channels and repeat business.',
  operations: 'Investigate founder dependency, process consistency, employee accountability and recurring errors.',
  finance: 'Investigate margin visibility, cash-flow forecasting, overdue payments and break-even.',
};

const round = (value) => Math.round(value);

export function classifyOverall(overallScore) {
  return CLASSIFICATIONS.find((c) => overallScore >= c.min && overallScore <= c.max) || CLASSIFICATIONS[2];
}

export function isValidAnswer(value) {
  return Number.isInteger(value) && value >= 0 && value <= POINTS_PER_QUESTION;
}

/**
 * @param {Record<string, number>} answers keyed by question number (1-9)
 * @returns {{ complete: boolean, missing: number[] }}
 */
export function validateAnswers(answers) {
  const missing = [];
  for (const q of QUESTIONS) {
    const value = answers?.[q.number];
    if (!isValidAnswer(value)) missing.push(q.number);
  }
  return { complete: missing.length === 0, missing };
}

function rankPillars(pillarScores) {
  const sorted = [...pillarScores].sort((a, b) => a.score - b.score);
  const lowest = sorted[0].score;
  const highest = sorted[sorted.length - 1].score;
  // Ties are preserved rather than broken arbitrarily.
  const primary = sorted.filter((p) => p.score === lowest);
  const strength = sorted.filter((p) => p.score === highest);
  const primaryKeys = new Set(primary.map((p) => p.key));
  const strengthKeys = new Set(strength.map((p) => p.key));
  const secondary = sorted.filter((p) => !primaryKeys.has(p.key) && !strengthKeys.has(p.key));
  const unresolved = sorted.filter((p) => !primaryKeys.has(p.key) && p.score !== highest);
  return {
    primary: primary.length ? primary : sorted.slice(0, 1),
    secondary: secondary.length ? secondary : unresolved,
    strength,
  };
}

/**
 * Pure scoring function used by both the browser and the API route.
 * @param {Record<string, number>} answers
 */
export function computeResults(answers) {
  const { complete, missing } = validateAnswers(answers);
  if (!complete) {
    return { complete: false, missing };
  }

  const pillarScores = Object.values(PILLARS).map((pillar) => {
    const earned = pillar.questionNumbers.reduce((sum, n) => sum + answers[n], 0);
    const max = pillar.questionNumbers.length * POINTS_PER_QUESTION;
    return {
      key: pillar.key,
      label: pillar.label,
      pointsEarned: earned,
      pointsMax: max,
      score: round((earned / max) * 100),
    };
  });

  const totalEarned = pillarScores.reduce((sum, p) => sum + p.pointsEarned, 0);
  const totalMax = TOTAL_QUESTIONS * POINTS_PER_QUESTION;
  const overallScore = round((totalEarned / totalMax) * 100);
  const classification = classifyOverall(overallScore);
  const ranking = rankPillars(pillarScores);

  const recommendations = [];
  for (const p of ranking.primary) recommendations.push({ pillar: p.key, title: `${p.label} is the primary area to investigate`, text: PILLAR_ACTIONS[p.key] });
  for (const p of ranking.secondary) recommendations.push({ pillar: p.key, title: `${p.label} is the secondary area to investigate`, text: PILLAR_ACTIONS[p.key] });
  recommendations.push({ pillar: null, title: 'Overall next step', text: classification.action });

  return {
    complete: true,
    missing: [],
    scoringVersion: SCORING_VERSION,
    pillarScores,
    totalEarned,
    totalMax,
    overallScore,
    classification: { label: classification.label, interpretation: classification.interpretation, action: classification.action },
    areaToInvestigate: ranking.primary.map((p) => p.key),
    secondaryArea: ranking.secondary.map((p) => p.key),
    relativeStrength: ranking.strength.map((p) => p.key),
    recommendations,
  };
}
