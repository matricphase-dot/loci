import assert from 'node:assert/strict';
import {
  newCard, review, GRADE, retrievability, overdueStrength, isDue,
  planSession, palaceStats, nextVisitLabel, DAY_MS, makeId
} from '../src/core/srs.js';

let passed = 0;
const t = (name, fn) => {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e) { console.error(`FAIL  ${name}\n      ${e.message}`); process.exitCode = 1; }
};

console.log('\nLOCII scheduling engine\n');

t('new cards are due immediately and read as newly-placed', () => {
  const now = 1_700_000_000_000;
  const c = newCard(now);
  assert.equal(isDue(c, now), true);
  assert.equal(overdueStrength(c, now), 0.85);
  assert.equal(c.reps, 0);
});

t('forgetting curve decays monotonically toward zero', () => {
  const now = 1_700_000_000_000;
  let c = { ...newCard(now), stability: 10, lastReview: now, reps: 1 };
  const r0 = retrievability(c, now);
  const r5 = retrievability(c, now + 5 * DAY_MS);
  const r30 = retrievability(c, now + 30 * DAY_MS);
  const r60 = retrievability(c, now + 60 * DAY_MS);
  assert.ok(r0 > r5 && r5 > r30 && r30 > r60, `expected monotone decay, got ${r0},${r5},${r30},${r60}`);
  assert.ok(r0 > 0.99, 'fresh review should be ~1.0');
  assert.ok(r30 < 0.8, `30d on 10d stability should be decaying, got ${r30}`);
  assert.ok(r60 < 0.55, `60d on 10d stability should be badly decayed, got ${r60}`);
});

t('retrievability hits ~0.9 exactly at one stability', () => {
  const now = 1_700_000_000_000;
  const c = { ...newCard(now), stability: 8, lastReview: now, reps: 1 };
  const r = retrievability(c, now + 8 * DAY_MS);
  assert.ok(Math.abs(r - 0.9) < 1e-6, `expected 0.9, got ${r}`);
});

t('urgency is non-linear and clamped to [0,1]', () => {
  const now = 1_700_000_000_000;
  const c = { ...newCard(now), stability: 5, lastReview: now, reps: 2 };
  const s1 = overdueStrength(c, now);
  const s5 = overdueStrength(c, now + 5 * DAY_MS);
  const s40 = overdueStrength(c, now + 40 * DAY_MS);
  assert.ok(s1 < 0.1, `just reviewed should be near-invisible, got ${s1}`);
  assert.ok(s1 < s5 && s5 < s40);
  assert.ok(s40 <= 1 && s40 > 0.85, `badly forgotten should be near 1, got ${s40}`);
  // a 1-day-overdue card must not look as urgent as a 12-day-overdue one
  const c2 = { ...newCard(now), stability: 1, lastReview: now, reps: 2 };
  assert.ok(overdueStrength(c2, now + 1 * DAY_MS) < overdueStrength(c2, now + 12 * DAY_MS));
});

t('successful reviews push the due date further out each time', () => {
  const now = 1_700_000_000_000;
  let c = { ...newCard(now), front: 'x' };
  const intervals = [];
  let clock = now;
  for (let i = 0; i < 5; i++) {
    c = review(c, GRADE.GOOD, clock);
    intervals.push(Math.round((c.due - clock) / DAY_MS));
    clock = c.due;
  }
  for (let i = 1; i < intervals.length; i++) {
    assert.ok(intervals[i] > intervals[i - 1],
      `intervals should expand, got ${intervals.join(', ')}`);
  }
  assert.ok(intervals[4] > 20, `5 good reviews should reach weeks, got ${intervals[4]}d`);
});

t('easy expands faster than good, hard slower', () => {
  const now = 1_700_000_000_000;
  const base = { ...newCard(now), stability: 5, lastReview: now, reps: 3, difficulty: 5 };
  const hard = review(base, GRADE.HARD, now);
  const good = review(base, GRADE.GOOD, now);
  const easy = review(base, GRADE.EASY, now);
  assert.ok(hard.stability < good.stability && good.stability < easy.stability,
    `expected hard<good<easy, got ${hard.stability},${good.stability},${easy.stability}`);
});

t('a lapse collapses stability and forces the card back within a day', () => {
  const now = 1_700_000_000_000;
  const strong = { ...newCard(now), stability: 60, lastReview: now, reps: 6, difficulty: 3 };
  const lapsed = review(strong, GRADE.FORGOT, now);
  assert.ok(lapsed.stability < strong.stability, 'stability must drop');
  assert.ok(lapsed.due - now <= 1 * DAY_MS + 1, 'must be due tomorrow');
  assert.equal(lapsed.lapses, 1);
  assert.ok(lapsed.difficulty > strong.difficulty, 'card should get harder');
});

t('review never mutates its input', () => {
  const now = 1_700_000_000_000;
  const c = { ...newCard(now), stability: 4, lastReview: now, reps: 2 };
  const snapshot = JSON.stringify(c);
  review(c, GRADE.EASY, now);
  assert.equal(JSON.stringify(c), snapshot);
});

t('difficulty stays bounded across extreme grading', () => {
  const now = 1_700_000_000_000;
  let c = newCard(now);
  for (let i = 0; i < 50; i++) c = review(c, GRADE.FORGOT, now + i * DAY_MS);
  assert.ok(c.difficulty <= 10 && c.difficulty >= 1, `difficulty out of range: ${c.difficulty}`);
  let d = newCard(now);
  for (let i = 0; i < 50; i++) d = review(d, GRADE.EASY, now + i * DAY_MS);
  assert.ok(d.difficulty <= 10 && d.difficulty >= 1, `difficulty out of range: ${d.difficulty}`);
  assert.ok(d.stability <= 365 * 3, 'stability capped');
});

t('session planner only returns due cards, most urgent first', () => {
  const now = 1_700_000_000_000;
  const mk = (id, strengthDays, lastOffset, reps = 2) => ({
    ...newCard(now), id, front: id,
    stability: strengthDays, lastReview: now - lastOffset * DAY_MS, reps,
    due: now - 1
  });
  const cards = [
    mk('fresh', 30, 1),
    mk('rotten', 1, 40),
    mk('middling', 5, 8),
    { ...newCard(now), id: 'notdue', front: 'notdue', due: now + 5 * DAY_MS, lastReview: now, reps: 2 }
  ];
  const plan = planSession(cards, { now, limit: 10 });
  const ids = plan.map((c) => c.id);
  assert.ok(!ids.includes('notdue'), 'must exclude not-yet-due cards');
  assert.equal(ids[0], 'rotten', `most forgotten first, got ${ids.join(',')}`);
  assert.ok(ids.indexOf('fresh') > ids.indexOf('middling'), 'less urgent sorts later');
});

t('session planner respects the limit and never duplicates', () => {
  const now = 1_700_000_000_000;
  const cards = Array.from({ length: 40 }, (_, i) => ({
    ...newCard(now), id: makeId('c'), front: `card${i}`, due: now - DAY_MS
  }));
  const plan = planSession(cards, { now, limit: 12 });
  assert.equal(plan.length, 12);
  assert.equal(new Set(plan.map((c) => c.id)).size, 12);
});

t('interleaving avoids same-key runs when alternatives exist', () => {
  const now = 1_700_000_000_000;
  const cards = [];
  for (let i = 0; i < 6; i++) {
    cards.push({ ...newCard(now), id: `a${i}`, front: `A${i}`, kind: 'A', due: now - DAY_MS, stability: 1, lastReview: now - 5 * DAY_MS, reps: 2 });
    cards.push({ ...newCard(now), id: `b${i}`, front: `B${i}`, kind: 'B', due: now - DAY_MS, stability: 1, lastReview: now - 5 * DAY_MS, reps: 2 });
  }
  const plan = planSession(cards, { now, limit: 10, interleaveBy: (c) => c.kind });
  let runs = 0;
  for (let i = 1; i < plan.length; i++) if (plan[i].kind === plan[i - 1].kind) runs++;
  assert.ok(runs <= 2, `too many adjacent same-kind pairs: ${runs}`);
});

t('empty palace does not crash and reads honestly', () => {
  const now = 1_700_000_000_000;
  assert.deepEqual(
    planSession([], { now }),
    []
  );
  const s = palaceStats([], now);
  assert.equal(s.total, 0);
  assert.equal(s.strength, 0);
  assert.equal(nextVisitLabel([], now), 'No notes yet');
});

t('stats partition the palace without double counting', () => {
  const now = 1_700_000_000_000;
  const cards = [
    { ...newCard(now), id: '1' }, // fresh
    { ...newCard(now), id: '2', stability: 100, lastReview: now, reps: 4, due: now + 90 * DAY_MS }, // solid
    { ...newCard(now), id: '3', stability: 2, lastReview: now - 30 * DAY_MS, reps: 4, due: now + 10 * DAY_MS } // fragile
  ];
  const s = palaceStats(cards, now);
  assert.equal(s.total, 3);
  assert.equal(s.fresh, 1);
  assert.equal(s.solid, 1);
  assert.equal(s.fragile, 1);
  assert.ok(s.strength > 0 && s.strength <= 1);
});

t('a full simulated learner converges (intervals grow, due load stays bounded)', () => {
  const start = 1_700_000_000_000;
  let cards = Array.from({ length: 10 }, (_, i) => ({ ...newCard(start), id: `c${i}`, front: `q${i}` }));
  let day = 0;
  let maxSession = 0;
  for (; day < 120; day++) {
    const now = start + day * DAY_MS;
    const plan = planSession(cards, { now, limit: 40 });
    maxSession = Math.max(maxSession, plan.length);
    // simulate a learner who recalls 85% of the time
    for (const p of plan) {
      const recalled = (Math.abs(Math.sin(day * 7 + p.front.length)) % 1) < 0.85;
      cards = cards.map((c) => (c.id === p.id ? review(c, recalled ? GRADE.GOOD : GRADE.FORGOT, now) : c));
    }
  }
  const final = palaceStats(cards, start + 120 * DAY_MS);
  assert.ok(maxSession <= 10, `daily load should collapse as memories consolidate, peaked at ${maxSession}`);
  assert.ok(final.strength > 0.7, `palace should be strong after 120 days, got ${final.strength.toFixed(2)}`);
});

console.log(`\n${passed} passed\n`);
