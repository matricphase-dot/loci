/**
 * LOCII — the Curator.
 *
 * A small, deterministic, on-device agent that watches your palace and proposes
 * one useful action at a time.
 *
 * Why this exists, and why it is honest:
 *   Most "agentic" features in a hackathon are a thin wrapper that forwards your
 *   text to a cloud LLM. That fails the brief's own take-it-away test, and it
 *   fails here: you would need a network, an API key, and a privacy concession
 *   for an app that otherwise touches nothing.
 *
 *   So the Curator is a policy engine. It observes real state — lapse counts,
 *   placement spread, review gaps, palace strength — and acts. Every suggestion
 *   it makes is derived from data already on the device, is explainable in one
 *   sentence, and can be accepted with a single pinch or ignored forever.
 *
 *   That is the honest version of agentic: it does work on your behalf without
 *   being asked, and it never leaves your room to do it.
 *
 * Design constraints:
 *   - At most ONE suggestion is surfaced at a time, because a nagging agent is
 *     worse than no agent.
 *   - Every rule must be able to say *why*, in plain language.
 *   - Suggestions expire. A dismissed suggestion does not come back for a day.
 */

import { retrievability, overdueStrength, isDue, DAY_MS } from './srs.js';

export const SUGGESTION = {
  REANCHOR: 'reanchor',
  PLACE: 'place',
  SPREAD: 'spread',
  RETURN: 'return',
  CELEBRATE: 'celebrate',
  SESSION: 'session'
};

/** A card is a "leech" when it keeps slipping despite repeated study. */
export function findLeeches(cards, { minLapses = 3, minReps = 4 } = {}) {
  return cards
    .filter((c) => (c.lapses ?? 0) >= minLapses && (c.reps ?? 0) >= minReps)
    .sort((a, b) => (b.lapses ?? 0) - (a.lapses ?? 0));
}

/**
 * Notes clustered too tightly to be distinguishable.
 * The method of loci depends on each location being *distinct*; two notes
 * within 12cm of each other blur into one and weaken both memories.
 */
export function findClusters(cards, { minSeparation = 0.18 } = {}) {
  const placed = cards.filter((c) => c.anchor?.p);
  const clusters = [];
  const used = new Set();

  for (const a of placed) {
    if (used.has(a.id)) continue;
    const group = [a];
    for (const b of placed) {
      if (b.id === a.id || used.has(b.id)) continue;
      const d = Math.hypot(
        a.anchor.p[0] - b.anchor.p[0],
        a.anchor.p[1] - b.anchor.p[1],
        a.anchor.p[2] - b.anchor.p[2]
      );
      if (d < minSeparation) group.push(b);
    }
    if (group.length >= 3) {
      group.forEach((c) => used.add(c.id));
      clusters.push(group);
    }
  }
  return clusters;
}

/**
 * Produce the single highest-value suggestion, or null.
 *
 * @param {Array} cards
 * @param {object} settings  includes `curatorMuted` and `dismissed` map
 * @param {number} now
 * @param {object} ctx  `{ justCompleted }` — celebration is a *moment*, not a state
 * @returns {{type, cardId?, priority, title, body, cta}|null}
 */
export function suggest(cards, settings = {}, now = Date.now(), ctx = {}) {
  if (settings.curatorMuted) return null;
  if (!cards.length) return null;

  const dismissed = settings.dismissed ?? {};
  const isDismissed = (key) => {
    const until = dismissed[key];
    return typeof until === 'number' && until > now;
  };

  const due = cards.filter((c) => isDue(c, now));
  const candidates = [];

  // 1. A note you keep failing is a note in the wrong place. Moving it is the
  //    single highest-leverage repair the app can offer.
  for (const c of findLeeches(cards)) {
    if (isDismissed(`reanchor:${c.id}`)) continue;
    candidates.push({
      type: SUGGESTION.REANCHOR,
      cardId: c.id,
      priority: 100 + (c.lapses ?? 0),
      title: 'THIS ONE KEEPS SLIPPING',
      body: `You have lost this note ${c.lapses} times. Notes survive when their place is distinctive — move it somewhere you'd never confuse with anything else.`,
      cta: 'Move it'
    });
    break;
  }

  // 2. Notes authored but never placed in the room are invisible in the headset,
  //    so they never benefit from the method at all.
  const unplaced = cards.filter((c) => !c.anchor);
  if (unplaced.length && !isDismissed('place')) {
    candidates.push({
      type: SUGGESTION.PLACE,
      cardId: unplaced[0].id,
      priority: 80 + Math.min(unplaced.length, 10),
      title: `${unplaced.length} NOTE${unplaced.length === 1 ? '' : 'S'} HAVE NO PLACE`,
      body: 'A note without a location is just a flashcard. Put it on a wall or a table and your room starts doing the remembering.',
      cta: 'Place one'
    });
  }

  // 3. Clustered notes blur together and weaken each other.
  const clusters = findClusters(cards);
  if (clusters.length && !isDismissed('spread')) {
    candidates.push({
      type: SUGGESTION.SPREAD,
      cardId: clusters[0][0].id,
      priority: 70,
      title: 'THESE ARE TOO CLOSE TOGETHER',
      body: `${clusters[0].length} notes sit almost on top of each other. Distinct places make distinct memories — spread them out.`,
      cta: 'Fix it'
    });
  }

  // 4. Returning after a gap: tell them plainly what decayed while they were away.
  if (due.length && !isDismissed('return')) {
    const most = due.slice().sort((a, b) => overdueStrength(b, now) - overdueStrength(a, now))[0];
    const daysAway = most.lastReview
      ? Math.floor((now - most.lastReview) / DAY_MS)
      : null;
    if (daysAway && daysAway >= 3) {
      candidates.push({
        type: SUGGESTION.RETURN,
        cardId: most.id,
        priority: 90,
        title: 'WELCOME BACK',
        body: `${due.length} note${due.length === 1 ? ' has' : 's have'} faded while you were away — the oldest by ${daysAway} days. Ten minutes brings the whole palace back.`,
        cta: 'Start'
      });
    }
  }

  // 5. Nothing wrong? Say something true and specific rather than nothing.
  const strength = cards.reduce(
    (s, c) => s + (c.reps === 0 ? 0 : retrievability(c, now)), 0
  ) / (cards.length || 1);

  // An agent that congratulates you every time you open it is just noise, so
  // celebration only fires in the moment right after a completed session.
  if (!candidates.length && ctx.justCompleted && strength > 0.85
      && cards.length >= 5 && !isDismissed('celebrate')) {
    candidates.push({
      type: SUGGESTION.CELEBRATE,
      cardId: null,
      priority: 20,
      title: 'YOUR PALACE IS HOLDING',
      body: `${Math.round(strength * 100)}% of what you've placed is solid right now. This is what it feels like when it's working.`,
      cta: 'Nice'
    });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0];
}

/** Record that a suggestion was acted on or waved away. */
export function dismiss(settings, suggestion, now = Date.now(), days = 1) {
  const dismissed = { ...(settings.dismissed ?? {}) };
  const key = suggestion.type === SUGGESTION.REANCHOR || suggestion.type === SUGGESTION.PLACE
    ? `${suggestion.type}${suggestion.type === SUGGESTION.REANCHOR ? `:${suggestion.cardId}` : ''}`
    : suggestion.type;
  dismissed[key] = now + days * DAY_MS;
  return { ...settings, dismissed };
}

/**
 * Rank the palace for a "what to look at first" hint.
 * Exposed so the UI can point at the most urgent note without duplicating logic.
 */
export function mostUrgent(cards, now = Date.now()) {
  if (!cards.length) return null;
  return cards.slice().sort((a, b) => overdueStrength(b, now) - overdueStrength(a, now))[0];
}
