/**
 * LOCII — synthesised audio.
 *
 * Every sound is generated with the WebAudio API at runtime. No sample files,
 * no CDN, no licensing. This also means audio starts instantly and costs
 * nothing to download, which matters for "cold start" smoothness in-headset.
 */

let ctx = null;
let master = null;
let enabled = true;

export function setAudioEnabled(v) {
  enabled = !!v;
  if (master) master.gain.value = enabled ? 0.9 : 0;
}

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call from a user gesture to unlock audio on iOS/Quest browsers. */
export function unlockAudio() {
  ensure();
}

/**
 * Positional-ish tone. `pan` is -1..1 so placement feedback can come from the
 * side of the room the note actually lives on.
 */
function tone({ freq = 440, dur = 0.18, type = 'sine', gain = 0.18, pan = 0, glide = 0, delay = 0 }) {
  const c = ensure();
  if (!c || !enabled) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  const p = c.createStereoPanner();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + glide), t0 + dur);

  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t0);
  osc.connect(g).connect(p).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** A soft inhale: the note becoming present. */
export const sfxPlace = (pan = 0) => {
  tone({ freq: 520, dur: 0.26, type: 'sine', gain: 0.12, pan, glide: 180 });
  tone({ freq: 780, dur: 0.2, type: 'sine', gain: 0.05, pan, delay: 0.02 });
};

/** Rewards a correct recall — a clean, quietly satisfying fifth. */
export const sfxGood = (pan = 0) => {
  tone({ freq: 523.25, dur: 0.16, type: 'triangle', gain: 0.14, pan });
  tone({ freq: 783.99, dur: 0.22, type: 'triangle', gain: 0.10, pan, delay: 0.075 });
};

/** Softer, lower: partial recall. Never punishes. */
export const sfxHard = (pan = 0) => {
  tone({ freq: 392.0, dur: 0.16, type: 'triangle', gain: 0.11, pan });
  tone({ freq: 523.25, dur: 0.2, type: 'triangle', gain: 0.07, pan, delay: 0.09 });
};

/** The "it slipped away" sound: descending, warm, not a buzzer. */
export const sfxForgot = (pan = 0) => {
  tone({ freq: 349.23, dur: 0.2, type: 'sine', gain: 0.11, pan });
  tone({ freq: 261.63, dur: 0.34, type: 'sine', gain: 0.09, pan, delay: 0.11 });
};

/** Target acquired under the gaze cursor. */
export const sfxHover = () => tone({ freq: 880, dur: 0.045, type: 'sine', gain: 0.035 });

/** Confirmed a pinch. */
export const sfxPinch = () => {
  tone({ freq: 660, dur: 0.06, type: 'square', gain: 0.045 });
  tone({ freq: 990, dur: 0.07, type: 'sine', gain: 0.03, delay: 0.01 });
};

/** Whole palace consolidated at the end of a session. */
export const sfxComplete = () => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ freq: f, dur: 0.5, type: 'sine', gain: 0.09 - i * 0.012, delay: i * 0.085 }));
};

/** Entering the palace. */
export const sfxEnter = () => {
  tone({ freq: 196, dur: 0.7, type: 'sine', gain: 0.1, glide: 294 });
  tone({ freq: 392, dur: 0.6, type: 'sine', gain: 0.05, glide: 180, delay: 0.1 });
};
