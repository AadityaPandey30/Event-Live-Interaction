import test from 'node:test';
import assert from 'node:assert/strict';
import { computeResults, validateAnswers, classifyOverall } from '../lib/scoring.js';

const all = (v) => Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, v]));

const withLevels = (levels) => Object.fromEntries(levels.map((v, i) => [i + 1, v]));

test('all zeros scores 0 and classifies as priority area', () => {
  const r = computeResults(all(0));
  assert.equal(r.overallScore, 0);
  assert.equal(r.classification.label, 'Priority areas to investigate');
});

test('all max scores 100 and classifies as stronger foundations', () => {
  const r = computeResults(all(3));
  assert.equal(r.overallScore, 100);
  assert.equal(r.totalEarned, 27);
  assert.equal(r.classification.label, 'Stronger foundations');
});

test('scoring example: 19 of 27 displays 70', () => {
  // 19 points across 27: 3 full pillars worth split so total is exactly 19.
  const answers = withLevels([
    3, 3, 3, // sales 9/9
    3, 3, 2, // operations 8/9
    1, 1, 0, // finance 2/9
  ]);
  const r = computeResults(answers);
  assert.equal(r.totalEarned, 19);
  assert.equal(r.overallScore, 70);
  assert.equal(r.classification.label, 'Room to strengthen');
});

test('pillar scores use 9-point denominator', () => {
  const answers = withLevels([
    2, 2, 2, // sales 6/9 -> 67
    3, 3, 3, // operations 9/9 -> 100
    0, 1, 1, // finance 2/9 -> 22
  ]);
  const r = computeResults(answers);
  const byKey = Object.fromEntries(r.pillarScores.map((p) => [p.key, p.score]));
  assert.equal(byKey.sales, 67);
  assert.equal(byKey.operations, 100);
  assert.equal(byKey.finance, 22);
});

test('weakest pillar becomes primary, highest becomes relative strength', () => {
  const answers = withLevels([
    3, 3, 3, // sales 100
    1, 1, 1, // operations 33
    2, 2, 2, // finance 67
  ]);
  const r = computeResults(answers);
  assert.deepEqual(r.areaToInvestigate, ['operations']);
  assert.deepEqual(r.secondaryArea, ['finance']);
  assert.deepEqual(r.relativeStrength, ['sales']);
  assert.match(r.recommendations[0].text, /founder dependency/);
});

test('tied lowest pillars are both reported', () => {
  const answers = withLevels([
    1, 1, 1, // sales 33
    1, 1, 1, // operations 33
    3, 3, 3, // finance 100
  ]);
  const r = computeResults(answers);
  assert.deepEqual(r.areaToInvestigate.sort(), ['operations', 'sales']);
  assert.deepEqual(r.secondaryArea, []);
  assert.deepEqual(r.relativeStrength, ['finance']);
});

test('missing answers make the assessment incomplete, not zero', () => {
  const answers = all(3);
  delete answers[5];
  const r = computeResults(answers);
  assert.equal(r.complete, false);
  assert.deepEqual(r.missing, [5]);
  assert.equal(r.overallScore, undefined);
});

test('out-of-range and non-integer answers are rejected', () => {
  assert.equal(validateAnswers({ ...all(3), 2: 4 }).complete, false);
  assert.equal(validateAnswers({ ...all(3), 2: 1.5 }).complete, false);
  assert.equal(validateAnswers({ ...all(3), 2: '2' }).complete, false);
  assert.equal(validateAnswers({ ...all(3), 2: -1 }).complete, false);
});

test('classification boundaries', () => {
  assert.equal(classifyOverall(100).label, 'Stronger foundations');
  assert.equal(classifyOverall(80).label, 'Stronger foundations');
  assert.equal(classifyOverall(79).label, 'Room to strengthen');
  assert.equal(classifyOverall(51).label, 'Room to strengthen');
  assert.equal(classifyOverall(50).label, 'Priority areas to investigate');
  assert.equal(classifyOverall(0).label, 'Priority areas to investigate');
});
