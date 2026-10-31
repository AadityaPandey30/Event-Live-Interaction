import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission, isUuid } from '../lib/validation.js';

const uuid = '3f1d6c8a-0b7e-4a5e-9c1a-2d8f4b6e9a10';
const answers = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i + 1, 2]));
const base = {
  submissionId: uuid,
  participantName: 'Asha Rao',
  companyName: 'Rao Textiles',
  answers,
};

test('accepts a complete payload', () => {
  const r = validateSubmission(base);
  assert.equal(r.ok, true);
  assert.equal(r.data.participantName, 'Asha Rao');
  assert.equal(Object.keys(r.data.answers).length, 9);
});

test('string keys are normalized to numbers', () => {
  const r = validateSubmission({ ...base, answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [String(k), v])) });
  assert.equal(r.ok, true);
  assert.equal(r.data.answers[1], 2);
});

test('rejects a missing answer instead of scoring it zero', () => {
  const partial = { ...answers };
  delete partial[5];
  const r = validateSubmission({ ...base, answers: partial });
  assert.equal(r.ok, false);
  assert.match(r.error, /questions: 5/);
});

test('rejects out-of-range answers', () => {
  assert.equal(validateSubmission({ ...base, answers: { ...answers, 3: 5 } }).ok, false);
  assert.equal(validateSubmission({ ...base, answers: { ...answers, 3: 'x' } }).ok, false);
});

test('rejects unknown answer keys', () => {
  assert.equal(validateSubmission({ ...base, answers: { ...answers, 10: 1 } }).ok, false);
});

test('rejects a bad submission id, empty names and non-objects', () => {
  assert.equal(validateSubmission({ ...base, submissionId: 'abc' }).ok, false);
  assert.equal(validateSubmission({ ...base, participantName: ' ' }).ok, false);
  assert.equal(validateSubmission({ ...base, companyName: '' }).ok, false);
  assert.equal(validateSubmission(null).ok, false);
  assert.equal(validateSubmission([]).ok, false);
});

test('trims and collapses whitespace in names', () => {
  const r = validateSubmission({ ...base, participantName: '  Asha   Rao  ', companyName: ' Rao  Textiles ' });
  assert.equal(r.data.participantName, 'Asha Rao');
  assert.equal(r.data.companyName, 'Rao Textiles');
});

test('isUuid', () => {
  assert.equal(isUuid(uuid), true);
  assert.equal(isUuid(uuid.toUpperCase()), true);
  assert.equal(isUuid('nope'), false);
});
