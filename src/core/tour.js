/**
 * LOCI — the browser tour.
 *
 * Why this exists:
 *   Judges are not guaranteed a headset, and neither are the people who browse
 *   the project gallery. If the only way to understand LOCI is to put on a Quest,
 *   then most of the audience scores a black rectangle.
 *
 *   So the flat experience is not a fallback — it is a *screening room*. A slow,
 *   authored camera move through the palace, with captions, that shows exactly
 *   what the headset shows: notes on a wall, notes flat on a table, and a note
 *   fading as its memory rots.
 *
 *   Sixty seconds, no input required, no headset required. It is the honest
 *   version of a trailer: the real app, real scheduler, real rendering — just
 *   with the camera on rails.
 */

/** Authored camera shots. Positions in metres, matching the staged room. */
export const SHOTS = [
  {
    dur: 6500,
    from: { p: [-0.55, 1.48, 1.95], l: [-0.55, 1.34, -2.3] },
    to: { p: [-0.55, 1.52, 0.75], l: [-0.60, 1.30, -2.3] },
    caption: 'Your notes, in the room you already know.',
    sub: 'LOCI is a memory palace that lives on your actual walls.'
  },
  {
    dur: 7000,
    from: { p: [-0.70, 1.54, 0.60], l: [-1.40, 1.46, -2.27] },
    to: { p: [-1.15, 1.56, -0.15], l: [-1.35, 1.52, -2.27] },
    caption: 'A note’s appearance is its memory strength.',
    sub: 'Freshly reviewed, it sits solid and calm.'
  },
  {
    dur: 7000,
    from: { p: [-1.05, 1.52, -0.10], l: [-0.62, 1.20, -2.27] },
    to: { p: [-0.75, 1.44, -0.35], l: [-0.62, 1.10, -2.27] },
    caption: 'As you begin to forget, it fades and drifts.',
    sub: 'Your room becomes a live readout of what your brain is about to lose.'
  },
  {
    dur: 7000,
    from: { p: [-0.10, 1.50, 0.10], l: [0.05, 0.84, -1.15] },
    to: { p: [0.10, 1.30, -0.20], l: [0.02, 0.80, -1.20] },
    caption: 'Placed on a real surface, it lies flat on that surface.',
    sub: 'Hit-test reads the orientation of your wall, table or shelf.'
  },
  {
    dur: 6500,
    from: { p: [-0.20, 1.34, 0.30], l: [-0.55, 1.22, -2.3] },
    to: { p: [-0.55, 1.50, 1.35], l: [-0.55, 1.30, -2.30] },
    caption: 'Come back tomorrow. The fading ones will be waiting.',
    sub: 'A ten-note session brings the whole palace back.'
  }
];

const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export class Tour {
  constructor({ camera, onCaption, onEnd, onProgress }) {
    this.camera = camera;
    this.onCaption = onCaption ?? (() => {});
    this.onEnd = onEnd ?? (() => {});
    this.onProgress = onProgress ?? (() => {});
    this.playing = false;
    this.index = 0;
    this.t = 0;
    this.lookAt = null;
  }

  start() {
    this.playing = true;
    this.index = 0;
    this.t = 0;
    this._enterShot(0);
    return this;
  }

  stop() {
    this.playing = false;
    this.onProgress(0);
  }

  skip() {
    if (!this.playing) return;
    this.index += 1;
    this.t = 0;
    if (this.index >= SHOTS.length) {
      this.playing = false;
      this.onProgress(0);
      this.onEnd();
    } else {
      this._enterShot(this.index);
    }
  }

  _enterShot(i) {
    const s = SHOTS[i];
    this.onCaption(s.caption, s.sub, i);
  }

  /** @param {number} dt seconds */
  update(dt) {
    if (!this.playing) return;
    const s = SHOTS[this.index];
    if (!s) { this.stop(); return; }

    this.t += dt * 1000;
    const raw = Math.min(1, this.t / s.dur);
    const e = easeInOut(raw);

    this.camera.position.set(
      lerp(s.from.p[0], s.to.p[0], e),
      lerp(s.from.p[1], s.to.p[1], e),
      lerp(s.from.p[2], s.to.p[2], e)
    );

    const look = {
      x: lerp(s.from.l[0], s.to.l[0], e),
      y: lerp(s.from.l[1], s.to.l[1], e),
      z: lerp(s.from.l[2], s.to.l[2], e)
    };
    this.camera.lookAt(look.x, look.y, look.z);

    const overall = (this.index + raw) / SHOTS.length;
    this.onProgress(overall);

    if (raw >= 1) {
      this.index += 1;
      this.t = 0;
      if (this.index >= SHOTS.length) {
        this.playing = false;
        this.onProgress(0);
        this.onEnd();
      } else {
        this._enterShot(this.index);
      }
    }
  }
}
