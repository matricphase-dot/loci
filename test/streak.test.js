import assert from 'node:assert/strict';
import { recordSession, dayKey, needsVisitToday } from '../src/core/store.js';

// store.js touches localStorage only inside load/save; these pure helpers don't.
let passed = 0;
const t = (n, f) => { try { f(); passed++; console.log(`  ok  ${n}`); } catch (e) { console.error(`FAIL  ${n}\n      ${e.message}`); process.exitCode = 1; } };
const DAY = 86400000;

console.log('\nLOCI daily ritual\n');

t('first ever session starts a streak of 1', () => {
  const now = new Date(2026, 10, 13, 10).getTime();
  const r = recordSession({}, now);
  assert.equal(r.streak, 1);
  assert.equal(r.isNew, true);
  assert.equal(r.milestone, null);
});

t('consecutive days extend the streak', () => {
  const d1 = new Date(2026, 10, 13, 10).getTime();
  let s = recordSession({}, d1).settings;
  for (let i = 1; i <= 4; i++) {
    const r = recordSession(s, d1 + i * DAY);
    s = r.settings;
    assert.equal(r.streak, i + 1, `day ${i + 1} should be streak ${i + 1}`);
  }
  assert.equal(s.longestStreak, 5);
});

t('a second session the same day does not double-count', () => {
  const d1 = new Date(2026, 10, 13, 9).getTime();
  let s = recordSession({}, d1).settings;
  const again = recordSession(s, d1 + 3600_000);
  assert.equal(again.streak, 1);
  assert.equal(again.isNew, false);
  assert.equal(again.settings.totalSessions, 2);
});

t('missing a day resets the streak but keeps the record', () => {
  const d1 = new Date(2026, 10, 13, 10).getTime();
  let s = recordSession({}, d1).settings;
  s = recordSession(s, d1 + DAY).settings;      // streak 2
  const afterGap = recordSession(s, d1 + 3 * DAY); // skipped a day
  assert.equal(afterGap.streak, 1);
  assert.equal(afterGap.settings.longestStreak, 2, 'best streak must be preserved');
});

t('milestones fire exactly on 3, 7, 30', () => {
  let s = {};
  const base = new Date(2026, 10, 1, 10).getTime();
  const hits = [];
  for (let i = 0; i < 31; i++) {
    const r = recordSession(s, base + i * DAY);
    s = r.settings;
    if (r.milestone) hits.push(r.milestone);
  }
  assert.deepEqual(hits, [3, 7, 14, 30]);
});

t('streak follows the local calendar across midnight', () => {
  const lateNight = new Date(2026, 10, 13, 23, 30).getTime();
  const nextMorning = new Date(2026, 10, 14, 8, 0).getTime();
  let s = recordSession({}, lateNight).settings;
  const r = recordSession(s, nextMorning);
  assert.equal(r.streak, 2, 'just after midnight must still count as the next day');
});

t('dayKey is stable and local', () => {
  assert.equal(dayKey(new Date(2026, 10, 13, 0, 0).getTime()), '2026-11-13');
  assert.equal(dayKey(new Date(2026, 10, 13, 23, 59).getTime()), '2026-11-13');
});

t('needsVisitToday is true before, false after', () => {
  const now = new Date(2026, 10, 13, 10).getTime();
  assert.equal(needsVisitToday({}, now), true);
  const s = recordSession({}, now).settings;
  assert.equal(needsVisitToday(s, now), false);
  assert.equal(needsVisitToday(s, now + DAY), true);
});

console.log(`\n${passed} passed\n`);
