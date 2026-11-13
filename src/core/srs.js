/**
 * LOCI — scheduling engine.
 *
 * Pure functions only. No DOM, no three.js. This is the part that has to be
 * provably correct, because "Reason to Come Back" is judged on whether the
 * app brings you back at the *right* moment, not on whether it has a timer.
 *
 * Design notes:
 *  - Uses a variant of the FSRS-lite / SM-2 family: each card carries a
 *    stability (days until retrievability drops to ~0.9) and a difficulty.
 *  - Everything is expressed in whole days so that a palace can be scheduled
 *    against a real calendar without drift.
 *  - `overdueStrength` is deliberately non-linear: a card 1 day overdue should
 *    NOT glow as hard as a card 12 days overdue. This drives the visual
 *    "fading" in the room, which is the whole product.
 */

export const DAY_MS = 86400000;

export const GRADE = {
  FORGOT: 0,
  HARD: 1,
  GOOD: 2,
  EASY: 3
};

/** Fresh card. */
export function newCard(now = Date.now()) {
  return {
    id: null,
    front: '',
    back: '',
    // scheduling
    stability: 0.6, // days
    difficulty: 5.0, // 1..10, higher = harder for this user
    reps: 0,
    lapses: 0,
    due: now, // ms epoch
    lastReview: null,
    // placement is filled in by the anchor system
    anchor: null
  };
}

/** Clamp helper. */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Retrievability R at time t: probability the user still recalls the card.
 * Exponential forgetting curve over elapsed days / stability.
 */
export function retrievability(card, now = Date.now()) {
  if (!card.lastReview || card.stability <= 0) return 0;
  const elapsedDays = Math.max(0, (now - card.lastReview) / DAY_MS);
  return Math.exp(Math.log(0.9) * (elapsedDays / card.stability));
}

/**
 * How "urgent" a card is right now, 0..1.
 *
 * 0   = freshly reviewed, fully solid, should be nearly invisible in the room
 * 1   = thoroughly forgotten, should be a bright ghost demanding attention
 *
 * Unreviewed cards read as 0.85 — they should look *present* and slightly
 * unfinished, which is what pulls a first-time user into their first review.
 */
export function overdueStrength(card, now = Date.now()) {
  if (card.reps === 0 || card.lastReview === null) return 0.85;
  const r = retrievability(card, now);
  // Normalise against a "gone" floor: below ~35% recall a note is effectively
  // forgotten, so everything past that point should read as maximally urgent
  // rather than creeping asymptotically toward an unreachable 1.
  //   r=1.00 (just reviewed) -> 0.00  (note is solid, nearly invisible)
  //   r=0.90 (exactly due)   -> ~0.22 (a gentle pull)
  //   r=0.50                 -> ~0.81
  //   r<=0.35 (long gone)    -> 1.00  (bright ghost demanding attention)
  const FLOOR = 0.35;
  return clamp(Math.pow(clamp((1 - r) / (1 - FLOOR), 0, 1), 0.8), 0, 1);
}

/** Is the card due for review? (Due today or earlier.) */
export function isDue(card, now = Date.now()) {
  return card.due <= now;
}

/** Whole days until due; negative if overdue. */
export function daysUntilDue(card, now = Date.now()) {
  return Math.ceil((card.due - now) / DAY_MS);
}

/**
 * Apply a review grade and return a NEW card object.
 * Never mutates the input — makes the reducer trivially testable.
 */
export function review(card, grade, now = Date.now()) {
  const c = { ...card };
  const elapsedDays = c.lastReview ? Math.max(0, (now - c.lastReview) / DAY_MS) : 0;
  const r = c.lastReview ? retrievability(c, now) : 0;

  // Difficulty drifts toward the grade: FORGOT (0) makes a card HARDER,
  // EASY (3) makes it easier. Note the inverted sign — a low grade must raise
  // difficulty, which is easy to get backwards.
  const dDelta = (2.0 - grade) * 0.35;
  c.difficulty = clamp(c.difficulty + dDelta, 1, 10);

  if (grade === GRADE.FORGOT) {
    // A lapse: collapse stability hard. The card must come back tomorrow,
    // no matter how well it was known before. This is what makes the room
    // visibly reorganise after a bad session.
    c.lapses += 1;
    c.stability = Math.max(0.35, c.stability * 0.25);
    c.due = now + 1 * DAY_MS;
  } else {
    // Successful recall: stability grows by a factor that depends on how easy
    // the card is, how late you were, and the difficulty of the card itself.
    const easeBoost = [0, 1.25, 1.9, 2.6][grade] ?? 1.9;
    const difficultyPenalty = 1 - (c.difficulty - 5) * 0.06; // 5 -> 1.0, 10 -> 0.7
    const lateBonus = 1 + clamp(1 - r, 0, 1) * 0.5; // letting it rot then nailing it = strong memory
    let next = Math.max(c.stability, 0.6) * easeBoost * difficultyPenalty * lateBonus;

    // Floor per grade so the first few reviews feel like they stick.
    const floor = [0, 1, 2, 4][grade];
    next = Math.max(next, floor);

    c.stability = clamp(next, 0.35, 365 * 3);
    c.due = now + Math.round(c.stability) * DAY_MS;
  }

  c.reps += 1;
  c.lastReview = now;
  return c;
}

/**
 * Session planner. Returns the cards to show, in the order a good tutor would
 * show them: most-forgotten first, but interleaved so you never get three of
 * the same kind back to back, and capped so a session is always ~10 minutes.
 *
 * @param {Array} cards
 * @param {object} opts { now, limit, interleaveBy }
 */
export function planSession(cards, opts = {}) {
  const now = opts.now ?? Date.now();
  const limit = opts.limit ?? 12;
  const keyFn = opts.interleaveBy ?? ((c) => c.front);

  const due = cards.filter((c) => isDue(c, now));
  due.sort((a, b) => overdueStrength(b, now) - overdueStrength(a, now));

  // Greedy interleave: walk the urgency-sorted list, skipping a card whose
  // "kind" matches the previously emitted kind when an alternative exists.
  const out = [];
  const pool = due.slice();
  let lastKey = null;
  while (pool.length && out.length < limit) {
    let pickIdx = pool.findIndex((c) => keyFn(c) !== lastKey);
    if (pickIdx === -1) pickIdx = 0;
    const picked = pool.splice(pickIdx, 1)[0];
    out.push(picked);
    lastKey = keyFn(picked);
  }
  return out;
}

/** Aggregate stats for the "daily ritual" summary panel. */
export function palaceStats(cards, now = Date.now()) {
  const total = cards.length;
  const due = cards.filter((c) => isDue(c, now)).length;
  const solid = cards.filter((c) => c.reps > 0 && !isDue(c, now) && retrievability(c, now) > 0.9).length;
  const fragile = cards.filter((c) => c.reps > 0 && !isDue(c, now) && retrievability(c, now) <= 0.9).length;
  const fresh = cards.filter((c) => c.reps === 0).length;
  let strength = 0;
  if (total) {
    strength = cards.reduce((s, c) => s + (c.reps === 0 ? 0 : retrievability(c, now)), 0) / total;
  }
  const nextDue = cards.length
    ? Math.min(...cards.map((c) => c.due))
    : null;
  return { total, due, solid, fragile, fresh, strength, nextDue };
}

/** Human-readable "next visit" line, for the flat-screen UI. */
export function nextVisitLabel(cards, now = Date.now()) {
  const s = palaceStats(cards, now);
  if (!s.total) return 'No notes yet';
  if (s.due > 0) return `${s.due} note${s.due === 1 ? '' : 's'} waiting for you`;
  if (s.nextDue == null) return 'Nothing scheduled';
  const d = Math.max(0, Math.ceil((s.nextDue - now) / DAY_MS));
  if (d <= 1) return 'Your palace is warm — come back tomorrow';
  return `Next visit in ${d} day${d === 1 ? '' : 's'}`;
}

/** Simple deterministic id generator (no crypto dependency needed). */
let seq = 0;
export function makeId(prefix = 'c') {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`;
}
