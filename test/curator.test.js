import assert from 'node:assert/strict';
import {
  suggest, findLeeches, findClusters, dismiss, mostUrgent,
  SUGGESTION
} from '../src/core/curator.js';
import { newCard, GRADE, review, DAY_MS } from '../src/core/srs.js';

let passed = 0;
const t = (n, f) => { try { f(); passed++; console.log(`  ok  ${n}`); } catch (e) { console.error(`FAIL  ${n}\n      ${e.message}`); process.exitCode = 1; } };
const NOW = 1_700_000_000_000;

const mk = (over = {}) => ({
  ...newCard(NOW),
  id: over.id ?? Math.random().toString(36).slice(2),
  front: 'q', back: 'a',
  ...over
});

console.log('\nLOCI curator agent\n');

t('a perfect palace yields no standing suggestion, and no empty praise', () => {
  const cards = Array.from({ length: 6 }, (_, i) => mk({
    id: `c${i}`, reps: 5, stability: 200, lastReview: NOW,
    due: NOW + 100 * DAY_MS, anchor: { p: [i * 1.0, 1.5, -1], q: [0,0,0,1] }
  }));
  // Not nagging, and not congratulating on every open either.
  assert.equal(suggest(cards, {}, NOW), null);
  assert.equal(suggest(cards, {}, NOW, { justCompleted: false }), null);
});

t('flags an unplaced note before anything cosmetic', () => {
  const cards = [mk({ id: 'a' }), mk({ id: 'b' })];
  const s = suggest(cards, {}, NOW);
  assert.equal(s.type, SUGGESTION.PLACE);
  assert.ok(s.body.length > 20, 'must explain itself');
  assert.ok(s.cta, 'must offer one action');
});

t('a repeatedly-lost note outranks everything else', () => {
  const cards = [
    mk({ id: 'leech', lapses: 5, reps: 9, stability: 2, lastReview: NOW - 3 * DAY_MS, due: NOW - DAY_MS }),
    mk({ id: 'unplaced' }),
    mk({ id: 'ok', lapses: 0, reps: 4 })
  ];
  const s = suggest(cards, {}, NOW);
  assert.equal(s.type, SUGGESTION.REANCHOR);
  assert.equal(s.cardId, 'leech');
});

t('leech detection needs both lapses and reps', () => {
  assert.equal(findLeeches([mk({ lapses: 9, reps: 1 })]).length, 0, 'one review cannot be a leech');
  assert.equal(findLeeches([mk({ lapses: 3, reps: 5 })]).length, 1);
});

t('detects notes crowded onto the same spot', () => {
  const cluster = [0, 1, 2].map((i) => mk({
    id: `n${i}`, reps: 3, anchor: { p: [0.001 * i, 1.5, -1], q: [0,0,0,1] }
  }));
  const far = mk({ id: 'far', reps: 3, anchor: { p: [2.4, 1.5, -1], q: [0,0,0,1] } });
  const found = findClusters([...cluster, far]);
  assert.equal(found.length, 1);
  assert.equal(found[0].length, 3);
});

t('notes far apart are not a cluster', () => {
  const cards = [0, 1, 2].map((i) => mk({
    id: `n${i}`, anchor: { p: [i * 0.5, 1.5, -1], q: [0,0,0,1] }
  }));
  assert.equal(findClusters(cards).length, 0);
});

t('welcomes you back with a measured decay count', () => {
  const cards = [0, 1, 2].map((i) => mk({
    id: `r${i}`, reps: 3, stability: 2,
    lastReview: NOW - 9 * DAY_MS, due: NOW - 5 * DAY_MS,
    anchor: { p: [i * 0.6, 1.5, -1], q: [0,0,0,1] }
  }));
  const s = suggest(cards, {}, NOW);
  assert.equal(s.type, SUGGESTION.RETURN);
  assert.match(s.body, /3 notes have faded/);
  assert.match(s.body, /9 days/);
});

t('one suggestion at a time, never a list of nagging', () => {
  const cards = [
    mk({ id: 'leech', lapses: 6, reps: 9, stability: 1, lastReview: NOW - 8 * DAY_MS, due: NOW - DAY_MS }),
    mk({ id: 'unplaced' })
  ];
  const s = suggest(cards, {}, NOW);
  assert.ok(s && typeof s === 'object' && s.type, 'returns exactly one object');
  assert.equal(Array.isArray(s), false);
});

t('a dismissed suggestion stays away for the day', () => {
  const cards = [mk({ id: 'a' })];
  const first = suggest(cards, {}, NOW);
  assert.equal(first.type, SUGGESTION.PLACE);
  const s2 = dismiss({}, first, NOW, 1);
  assert.equal(suggest(cards, s2, NOW + 1000), null, 'must not immediately repeat');
  // ...but returns tomorrow
  const later = suggest(cards, s2, NOW + 2 * DAY_MS);
  assert.equal(later?.type, SUGGESTION.PLACE);
});

t('muting silences the curator entirely', () => {
  const cards = [mk({ id: 'a' })];
  assert.equal(suggest(cards, { curatorMuted: true }, NOW), null);
});

t('celebrates a strong palace instead of inventing a problem', () => {
  const cards = Array.from({ length: 6 }, (_, i) => mk({
    id: `s${i}`, reps: 8, stability: 400, lastReview: NOW, due: NOW + 300 * DAY_MS,
    anchor: { p: [i * 0.7, 1.5, -1], q: [0,0,0,1] }
  }));
  const s = suggest(cards, {}, NOW, { justCompleted: true });
  assert.equal(s.type, SUGGESTION.CELEBRATE);
  assert.match(s.body, /%/);
});

t('mostUrgent points at the most decayed note', () => {
  const cards = [
    mk({ id: 'fresh', reps: 4, stability: 100, lastReview: NOW, due: NOW + 90 * DAY_MS }),
    mk({ id: 'rotten', reps: 4, stability: 1, lastReview: NOW - 30 * DAY_MS, due: NOW - 20 * DAY_MS })
  ];
  assert.equal(mostUrgent(cards, NOW).id, 'rotten');
});

t('empty palace never crashes the agent', () => {
  assert.equal(suggest([], {}, NOW), null);
  assert.equal(mostUrgent([], NOW), null);
  assert.deepEqual(findClusters([]), []);
  assert.deepEqual(findLeeches([]), []);
});

t('every suggestion is explainable in plain language', () => {
  const scenarios = [
    [mk({ id: 'u' })],
    [mk({ id: 'l', lapses: 5, reps: 8 })],
    [0,1,2].map(i => mk({ id: `c${i}`, reps: 3, anchor: { p: [0, 1.5, -1], q: [0,0,0,1] } }))
  ];
  for (const cards of scenarios) {
    const s = suggest(cards, {}, NOW);
    if (!s) continue;
    assert.ok(s.title && s.title.length > 4, 'needs a title');
    assert.ok(s.body && s.body.length > 30, 'needs a real explanation');
    assert.ok(!/\bnull\b|\bundefined\b|NaN/.test(s.body), `no broken interpolation: ${s.body}`);
  }
});

console.log(`\n${passed} passed\n`);
