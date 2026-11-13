/**
 * LOCII — persistence.
 * Everything lives on the device: localStorage for the web build.
 * No accounts, no network calls, no third-party services. Passes the
 * "take it away" test trivially: remove everything external and LOCII still works.
 */

const KEY = 'loci.palace.v1';
const SETTINGS_KEY = 'loci.settings.v1';

const DEFAULT_SETTINGS = {
  sessionLimit: 10,
  audio: true,
  showTutorial: true,
  // Daily ritual state — this is what the "Reason to Come Back" award is about.
  streak: 0,
  longestStreak: 0,
  lastSessionDay: null,   // 'YYYY-MM-DD' of the last completed session
  totalSessions: 0,
  totalReviews: 0
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadCards() {
  const cards = safeParse(localStorage.getItem(KEY), []);
  if (!Array.isArray(cards)) return [];
  // Defensive normalisation: a corrupt or older record must never break the
  // palace. Any card missing scheduler fields is repaired, not dropped.
  return cards
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      id: String(c.id ?? Math.random().toString(36).slice(2)),
      front: String(c.front ?? ''),
      back: String(c.back ?? ''),
      kind: String(c.kind ?? 'general'),
      stability: Number.isFinite(c.stability) ? c.stability : 0.6,
      difficulty: Number.isFinite(c.difficulty) ? c.difficulty : 5,
      reps: Number.isFinite(c.reps) ? c.reps : 0,
      lapses: Number.isFinite(c.lapses) ? c.lapses : 0,
      due: Number.isFinite(c.due) ? c.due : Date.now(),
      lastReview: Number.isFinite(c.lastReview) ? c.lastReview : null,
      anchor: c.anchor && typeof c.anchor === 'object' ? c.anchor : null
    }));
}

export function saveCards(cards) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cards));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...safeParse(localStorage.getItem(SETTINGS_KEY), {}) };
}

export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* storage full or blocked — non-fatal */ }
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

/** Local-calendar day key. Streaks must follow the user's day, not UTC. */
export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Record a completed session and advance the daily streak.
 * Returns { streak, isNew, milestone } so the UI can celebrate honestly.
 */
export function recordSession(settings, now = Date.now()) {
  const today = dayKey(now);
  const yesterday = dayKey(now - 86400000);
  const s = { ...settings };

  if (s.lastSessionDay === today) {
    // Second session today: counts as practice, not a new streak day.
    s.totalSessions = (s.totalSessions ?? 0) + 1;
    return { settings: s, streak: s.streak ?? 0, isNew: false, milestone: null };
  }

  const continued = s.lastSessionDay === yesterday;
  s.streak = continued ? (s.streak ?? 0) + 1 : 1;
  s.longestStreak = Math.max(s.longestStreak ?? 0, s.streak);
  s.lastSessionDay = today;
  s.totalSessions = (s.totalSessions ?? 0) + 1;

  const milestones = [3, 7, 14, 30, 60, 100];
  const milestone = milestones.includes(s.streak) ? s.streak : null;
  return { settings: s, streak: s.streak, isNew: true, milestone };
}

/** True when the user has not yet practised today. Drives the return prompt. */
export function needsVisitToday(settings, now = Date.now()) {
  return settings.lastSessionDay !== dayKey(now);
}
