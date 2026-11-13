/**
 * LOCI — input.
 *
 * Hands are the primary and complete input path:
 *    GAZE aims  →  PINCH confirms.
 *
 * That pairing is deliberate. Direct touch in the air is imprecise and tiring
 * from a sofa; gaze is precise and free. Pinch is the most reliable discrete
 * signal a tracked hand produces. Together they satisfy the hard requirement
 * — you can finish the whole experience without ever pairing a controller —
 * and they're the most comfortable option while seated.
 *
 * Controllers are supported (they arrive as gamepads with a select button) but
 * nothing is gated behind them. A mouse/pointer fallback exists so the same
 * build runs in an emulator, on desktop, and in the flat browser preview.
 */

import * as THREE from 'three';

const PINCH_ON = 0.022;   // metres, thumb-tip↔index-tip
const PINCH_OFF = 0.032;  // hysteresis so a pinch can't chatter
const DWELL_MS = 1000;    // dwell-to-confirm for users who can't pinch

export class InputSystem {
  constructor() {
    this.mode = 'gaze'; // 'hands' | 'controllers' | 'gaze' | 'pointer'
    this.cursor = new THREE.Vector2(0, 0); // NDC, for gaze/pointer
    this.hovered = null;
    this.pinching = false;
    this.justPinched = false;
    this.justReleased = false;
    this.dwellProgress = 0;
    this.dwellEnabled = false;
    this.sources = new Map();
    this._lastPinch = new Map();
    this._pinchHandThisFrame = false;
    this._selectThisFrame = false;
    this._squeezeThisFrame = false;
    this._pointers = new Map();
    this._raycaster = new THREE.Raycaster();
    this.handScreenPos = new THREE.Vector2(0, 0);
    this.hasHandScreenPos = false;
    this._addedListeners = false;
  }

  /** Wire flat-screen pointer + keyboard input (desktop preview, emulators). */
  attachFlatInput(domElement) {
    if (this._addedListeners) return;
    this._addedListeners = true;
    this.dom = domElement;

    const setFromEvent = (e) => {
      const r = domElement.getBoundingClientRect();
      this.cursor.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      this.cursor.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      this.mode = 'pointer';
    };
    domElement.addEventListener('pointermove', setFromEvent);
    domElement.addEventListener('pointerdown', (e) => {
      setFromEvent(e);
      this._selectThisFrame = true;
      this.pointerDownThisFrame = true;
    });
    domElement.addEventListener('pointerleave', () => { this.hovered = null; });

    // Space/Enter act as "confirm" so the flat preview can be driven without a
    // pointer. But they must NEVER swallow the key while the user is typing —
    // doing so silently eats every spacebar in a note ("oranges reproduce"
    // became "orangesreproduce"), which looks like a text-rendering bug and
    // corrupts the user's input.
    window.addEventListener('keydown', (e) => {
      const t = e.target;
      const tag = (t?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || t?.isContentEditable;
      if (typing) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        this._selectThisFrame = true;
        e.preventDefault();
      }
    });
  }

  /** Called each frame while an XR session is active. */
  updateXR(frame, refSpace, session) {
    this.justPinched = false;
    this.justReleased = false;
    this._pinchHandThisFrame = false;
    this._selectThisFrame = false;
    this._squeezeThisFrame = false;

    const inputs = session.inputSources ? Array.from(session.inputSources) : [];
    let sawHand = false;
    let sawController = false;

    for (const src of inputs) {
      if (src.hand) {
        sawHand = true;
        const pinching = this._readHandPinch(frame, src, refSpace);
        if (pinching && !this._lastPinch.get(src.handedness)) {
          this._pinchHandThisFrame = true;
        }
        this._lastPinch.set(src.handedness, pinching);
        this.pinching = this.pinching || pinching;
        this._readHandScreenPos(frame, src, refSpace);
      }
      // A hand source can *also* expose a gamepad. Read it regardless, so a
      // runtime that only surfaces pinch there is still usable.
      if (src.gamepad) {
        sawController = sawController || !src.hand;
        const gp = src.gamepad;
        const pressed = !!(gp.buttons?.[0]?.pressed || gp.buttons?.[5]?.pressed);
        if (pressed) this._selectThisFrame = true;
        // Thumbstick nudges the gaze cursor for people who prefer sticks.
        const ax = gp.axes?.[0] ?? 0;
        const ay = gp.axes?.[1] ?? 0;
        if (Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15) {
          this.cursor.x = THREE.MathUtils.clamp(this.cursor.x + ax * 0.03, -1, 1);
          this.cursor.y = THREE.MathUtils.clamp(this.cursor.y + ay * 0.03, -1, 1);
        }
      }
    }

    if (sawHand) this.mode = 'hands';
    else if (sawController) this.mode = 'controllers';
    else this.mode = 'gaze';

    if (!sawHand) {
      this.pinching = false;
      this._lastPinch.clear();
    }

    // Collapse every confirm signal into one edge-triggered event.
    const confirm = this._pinchHandThisFrame || this._selectThisFrame;
    this.justPinched = confirm;
    this.justReleased = !this.pinching && !this._selectThisFrame;
    this.confirmThisFrame = confirm;
  }

  /**
   * Read a tracked hand's pinch state.
   *
   * This runs every frame for every hand, so it must never throw. In practice
   * `frame` can arrive undefined on the first frames of a session, `hand.get()`
   * can return undefined for a joint the runtime has not started tracking, and
   * `getJointPose` is not guaranteed to exist at all. Any of those used to throw
   * an uncaught TypeError inside the render loop.
   *
   * Order of preference:
   *   1. Real joint poses (thumb-tip to index-tip) — the accurate path.
   *   2. The input source's gamepad button — many runtimes expose hand pinch
   *      there, and some emulators provide only this.
   */
  _readHandPinch(frame, src, refSpace) {
    const hand = src && src.hand;
    if (!hand) return false;

    const was = this._lastPinch.get(src.handedness) ?? false;

    // --- path 1: joint poses
    if (frame && typeof frame.getJointPose === 'function') {
      let thumb, index;
      try {
        thumb = hand.get('thumb-tip');
        index = hand.get('index-finger-tip');
      } catch {
        thumb = index = null;
      }

      if (thumb && index) {
        let pt, pi;
        try {
          pt = frame.getJointPose(thumb, refSpace);
          pi = frame.getJointPose(index, refSpace);
        } catch {
          pt = pi = null;
        }
        if (pt && pi) {
          const a = pt.transform.position;
          const b = pi.transform.position;
          const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
          return was ? d < PINCH_OFF : d < PINCH_ON;
        }
      }
    }

    // --- path 2: gamepad fallback (hands often expose a select/pinch button)
    const gp = src.gamepad;
    if (gp && gp.buttons) {
      const pressed = !!(gp.buttons[0]?.pressed || gp.buttons[3]?.pressed);
      if (pressed) return true;
    }

    return was && false; // no signal this frame: hold nothing pressed
  }

  _readHandScreenPos(frame, src, refSpace) {
    const hand = src && src.hand;
    if (!hand || !this._camera) return;
    if (!frame || typeof frame.getJointPose !== 'function') return;
    let idx;
    try { idx = hand.get('index-finger-tip'); } catch { return; }
    if (!idx) return;
    let p;
    try { p = frame.getJointPose(idx, refSpace); } catch { return; }
    if (!p) return;
    const v = new THREE.Vector3(p.transform.position.x, p.transform.position.y, p.transform.position.z);
    v.project(this._camera);
    if (Number.isFinite(v.x) && Number.isFinite(v.y)) {
      this.handScreenPos.set(v.x, v.y);
      this.hasHandScreenPos = true;
    }
  }

  /**
   * Update gaze targeting against a set of interactive objects.
   *
   * In-headset the ray is thrown from the centre of the head — where you look.
   * Gaze is far steadier than an outstretched fingertip and it never tires your
   * arm, which is what makes long seated sessions possible.
   *
   * Returns the hovered target and populates `this.hoveredHit` with the raycast
   * result (including UV coordinates for panel hit-testing).
   */
  updateHover(camera, targets, dwellAllowed = true) {
    this._camera = camera;

    // Centre the ray for hands/gaze. Controller users keep their stick cursor.
    if (this.mode === 'hands' || this.mode === 'gaze') this.cursor.set(0, 0);

    this._raycaster.setFromCamera(this.cursor, camera);
    this._raycaster.far = 6;

    const meshes = [];
    for (const t of targets) {
      if (!t || !t.object3d || !t.object3d.visible) continue;
      t.object3d.traverse((o) => {
        if (o.isMesh) {
          o.userData.owner = t;
          meshes.push(o);
        }
      });
    }
    const hits = this._raycaster.intersectObjects(meshes, false);
    const first = hits.length ? hits[0] : null;
    const next = first ? first.object.userData.owner : null;

    this.hoveredHit = first
      ? { target: next, uv: first.uv ?? null, point: first.point, distance: first.distance }
      : null;

    if (next !== this.hovered) {
      this.hovered = next;
      this._hoverStart = performance.now();
      this.dwellProgress = 0;
    } else if (next && dwellAllowed) {
      const held = performance.now() - (this._hoverStart ?? performance.now());
      this.dwellProgress = Math.min(1, held / DWELL_MS);
    } else {
      this.dwellProgress = 0;
    }
    return this.hovered;
  }

  /** True once per frame when an action should fire. */
  get confirmed() {
    return !!(this.confirmThisFrame || this.pointerDownThisFrame);
  }

  clearFrameFlags() {
    this.pointerDownThisFrame = false;
    this.confirmThisFrame = false;
  }

  get modeLabel() {
    return {
      hands: 'Hands',
      controllers: 'Controller',
      gaze: 'Gaze',
      pointer: 'Mouse'
    }[this.mode] ?? this.mode;
  }
}
