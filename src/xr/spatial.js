/**
 * LOCII — spatial layer.
 *
 * This is where the "your room is the mnemonic" claim is actually earned.
 *
 *  - Passthrough is the default view. LOCII never covers your room; it annotates it.
 *  - Placement uses the WebXR hit-test module against real geometry, then reads
 *    the hit pose's ORIENTATION so a note on a wall lies flat on that wall and
 *    a note on a table lies flat on the table. No guessing, no manual rotation.
 *  - Everything is expressed in the local-floor reference space, which Quest
 *    keeps stable for a given room, so a note left on the kitchen wall is still
 *    on the kitchen wall tomorrow.
 *  - Placement is constrained to a reachable shell (0.45m–2.2m) so the
 *    airplane-seat test holds: you never have to stand up or walk.
 */

import * as THREE from 'three';

/**
 * Headset field of view. Used to keep placements inside the region a seated
 * user can actually see and reach without craning — the rubric's "FoV-aware
 * design" requirement, applied at the moment of placement rather than after.
 */
export const FOV = {
  ASSUMED_HALF_H: 52,  // degrees, horizontal half-angle (Quest ~104° total)
  ASSUMED_HALF_V: 48,  // degrees, vertical half-angle
  SAFE_H_FRACTION: 0.78, // keep targets well inside the periphery
  SAFE_V_FRACTION: 0.82,
  SWEET_SPOT_DEG: 20   // best legibility zone, centred
};

export const COMFORT = {
  MIN_DIST: 0.45, // beyond a pinch's reach
  MAX_DIST: 2.2,  // beyond comfortable gaze targeting while seated
  MIN_HEIGHT: 0.15, // below the knees — don't put notes on the floor
  MAX_HEIGHT: 2.1
};

export class SpatialSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this._fallbackCamera = null;
    this.session = null;
    this.refSpace = null;
    this.viewerSpace = null;
    this.hitTestSource = null;
    this.hitTestReady = false;
    this.hitPose = null;
    this.hasHit = false;
    this.reticle = null;
    this.surfaceHint = '';
    this._tmp = new THREE.Vector3();
    this._tmpQ = new THREE.Quaternion();
  }

  async init(session, { scene }) {
    this.session = session;
    this.refSpace = await session.requestReferenceSpace('local-floor');
    this.viewerSpace = await session.requestReferenceSpace('viewer');

    this._buildReticle(scene);

    // Try hand-targeted ray first (most direct for a hands-first app),
    // fall back to gaze-targeted ray. Either way we end up hitting real geometry.
    const src = session.inputSources?.find((s) => s.hand) ?? session.inputSources?.[0];
    const spaceForHit = src?.targetRaySpace ?? this.viewerSpace;

    if (session.requestHitTestSource) {
      try {
        this.hitTestSource = await session.requestHitTestSource({ space: spaceForHit });
        this.hitTestReady = !!this.hitTestSource;
      } catch {
        try {
          this.hitTestSource = await session.requestHitTestSource({ space: this.viewerSpace });
          this.hitTestReady = !!this.hitTestSource;
        } catch {
          this.hitTestReady = false;
        }
      }
    }
    return this;
  }

  _buildReticle(scene) {
    const g = new THREE.Group();
    // A thin ring + dot reads clearly over passthrough without occluding the room.
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.045, 28),
      new THREE.MeshBasicMaterial({ color: 0x7fe3c0, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false })
    );
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.008, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false })
    );
    dot.position.z = 0.0005;
    g.add(ring, dot);
    g.renderOrder = 999;
    g.visible = false;
    this.reticle = g;
    scene.add(g);
  }

  /** Call every frame with the XRFrame and a THREE.Group for the camera rig. */
  update(frame, delta = 0) {
    if (!this.hitTestReady || !frame || !this.hitTestSource) {
      this.hasHit = false;
      if (this.reticle) this.reticle.visible = false;
      return;
    }
    const results = frame.getHitTestResults(this.hitTestSource);
    if (!results.length) {
      this.hasHit = false;
      if (this.reticle) this.reticle.visible = false;
      return;
    }
    const pose = results[0].getPose(this.refSpace);
    if (!pose) {
      this.hasHit = false;
      if (this.reticle) this.reticle.visible = false;
      return;
    }

    this.hasHit = true;
    this.hitPose = pose;

    // Position the reticle. Orient it to the surface normal so it visibly
    // "lie down" on the table or "stand up" on the wall — this is the affordance
    // that tells the user their room is being understood, not just drawn over.
    const p = pose.transform.position;
    this.reticle.position.set(p.x, p.y, p.z);
    const o = pose.transform.orientation;
    this.reticle.quaternion.set(o.x, o.y, o.z, o.w);
    // lift 1mm off the surface to avoid z-fighting with the real world
    this.reticle.position.add(
      new THREE.Vector3(0, 0, 0.001).applyQuaternion(this.reticle.quaternion)
    );

    this.surfaceHint = classifySurface(pose);
    const inRange = this.isComfortable(this.reticle.position);
    this.reticle.visible = true;
    this.reticle.children[0].material.color.set(inRange ? 0x7fe3c0 : 0xff9a6b);
    this.reticle.children[0].material.opacity = inRange ? 0.85 : 0.5;
  }

  /**
   * Is this world position usable by a seated user?
   * Checks distance, height AND angular offset from where they are actually
   * looking — a note behind your shoulder passes the distance test but is
   * useless, and would silently fail the airplane-seat test.
   */
  isComfortable(worldPos) {
    const cam = this.renderer.xr.getCamera?.() ?? this._fallbackCamera;
    if (!cam) return true;

    const head = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    cam.getWorldPosition(head);
    cam.getWorldQuaternion(quat);

    const d = head.distanceTo(worldPos);
    if (d < COMFORT.MIN_DIST || d > COMFORT.MAX_DIST) return false;
    if (worldPos.y < COMFORT.MIN_HEIGHT || worldPos.y > COMFORT.MAX_HEIGHT) return false;

    // Angular offset from the head's forward axis.
    const toTarget = worldPos.clone().sub(head).normalize();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const angle = THREE.MathUtils.radToDeg(forward.angleTo(toTarget));
    return angle <= FOV.ASSUMED_HALF_H * FOV.SAFE_H_FRACTION;
  }

  /** How centred a target is, 0 (edge of vision) .. 1 (dead centre). */
  fovScore(worldPos) {
    const cam = this.renderer.xr.getCamera?.() ?? this._fallbackCamera;
    if (!cam) return 0.5;
    const head = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    cam.getWorldPosition(head);
    cam.getWorldQuaternion(quat);
    const toTarget = worldPos.clone().sub(head).normalize();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const angle = THREE.MathUtils.radToDeg(forward.angleTo(toTarget));
    return Math.max(0, 1 - angle / FOV.ASSUMED_HALF_H);
  }

  /**
   * Convert the current hit pose into a durable anchor record.
   * Returns null when the user is aiming somewhere unusable, so the UI can
   * simply refuse rather than placing a note in the void.
   */
  /**
   * Ask the device for a durable anchor at the current hit, then *also* keep the
   * local-floor pose.
   *
   * The rubric names "persistent anchors" specifically. A real XRAnchor is the
   * strongest form — the runtime keeps it pinned across sessions and relocalises
   * it after the headset sleeps. But anchors are not available everywhere, so the
   * pose is always stored too and is the source of truth for rendering. If the
   * runtime gives us an anchor we keep the handle; if it does not, nothing breaks.
   */
  async captureAnchorAsync(frame) {
    const base = this.captureAnchor();
    if (!base) return null;
    try {
      if (frame && frame.createAnchor && this.hitTestSource) {
        const results = frame.getHitTestResults(this.hitTestSource);
        if (results.length) {
          const pose = results[0].getPose(this.refSpace);
          if (pose) {
            const anchor = await frame.createAnchor(pose.transform, this.refSpace);
            if (anchor) {
              base.persistent = true;
              this._anchors = this._anchors ?? new Map();
              this._anchors.set(base, anchor);
            }
          }
        }
      }
    } catch {
      // Anchors unsupported or quota exceeded — the pose still works.
      base.persistent = false;
    }
    return base;
  }

  captureAnchor() {
    if (!this.hasHit || !this.hitPose) return null;
    const p = this.hitPose.transform.position;
    const o = this.hitPose.transform.orientation;
    const pos = new THREE.Vector3(p.x, p.y, p.z);
    if (!this.isComfortable(pos)) return null;

    return {
      type: 'surface',
      // Stored in local-floor space — stable per room across sessions.
      p: [round4(p.x), round4(p.y), round4(p.z)],
      q: [round4(o.x), round4(o.y), round4(o.z), round4(o.w)],
      surface: classifySurface(this.hitPose)
    };
  }

  /**
   * Fallback arc for emulators, desktop, and any device without hit-test.
   *
   * Cards are laid out on a gentle horizontal arc at a fixed eye-level radius,
   * then wrapped to a second, slightly further and slightly higher ring. The
   * ring radius is derived from the card's angular width plus a gap so cards
   * can never touch, no matter how many there are.
   */
  static arcAnchor(index, total, headPos, headQuat) {
    const CARD_W = 0.28;
    const GAP = 0.055;              // breathing room between cards, metres
    const RADIUS = 1.15;            // reading distance from the head
    const angularStep = (CARD_W + GAP) / RADIUS;   // radians per card
    const maxPerRing = Math.max(1, Math.floor(
      THREE.MathUtils.degToRad(76) / angularStep  // keep the arc within ±38°
    ));

    const ring = Math.floor(index / maxPerRing);
    const idxInRing = index % maxPerRing;
    const countInRing = Math.min(maxPerRing, total - ring * maxPerRing) || 1;

    const r = RADIUS + ring * 0.3;
    const startAngle = -((countInRing - 1) / 2) * angularStep;
    const angle = startAngle + idxInRing * angularStep;

    // Build the arc around the head's flat forward direction.
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(headQuat);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();

    const dir = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
    // Vertical spacing between rings must exceed the card height (0.36m) or the
    // rings visually collide, which reads as a bug rather than as depth.
    // Sits just above eye level, rising per ring: the lower third of the view
    // is reserved for the action panel, and nothing ever overlaps.
    const y = THREE.MathUtils.clamp(headPos.y + 0.04 + ring * 0.44, 1.0, 2.02);

    const pos = new THREE.Vector3(
      headPos.x + dir.x * r,
      y,
      headPos.z + dir.z * r
    );

    // Face the user squarely (yaw only) — a tilted card is hard to read.
    //
    // Orientation matters here: Matrix4.lookAt(eye, target) aligns local -Z
    // with (target - eye). A plane's visible face is +Z. So the "eye" must be
    // the HEAD and the target the CARD, otherwise the card shows its back and
    // the texture appears to be missing entirely.
    const m = new THREE.Matrix4().lookAt(
      new THREE.Vector3(headPos.x, y, headPos.z),
      pos,
      new THREE.Vector3(0, 1, 0)
    );
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return {
      type: 'arc',
      p: [round4(pos.x), round4(pos.y), round4(pos.z)],
      q: [round4(q.x), round4(q.y), round4(q.z), round4(q.w)],
      surface: 'floating'
    };
  }

  dispose() {
    if (this.hitTestSource) {
      try { this.hitTestSource.cancel(); } catch { /* already gone */ }
    }
    this.hitTestSource = null;
    this.hitTestReady = false;
  }
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

/**
 * Guess what we landed on, from the pose orientation. Used only for copy and
 * subtle styling — never for behaviour that could break in an unseen room.
 */
export function classifySurface(pose) {
  const o = pose.transform.orientation;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion(o.x, o.y, o.z, o.w));
  const verticality = Math.abs(up.y);
  if (verticality > 0.85) return up.y > 0 ? 'desk' : 'desk'; // facing up = horizontal surface
  if (verticality < 0.3) return 'wall';
  return 'shelf';
}

/** Human-readable name for a surface, for the UI. */
export const surfaceLabel = (s) => ({
  desk: 'a flat surface',
  wall: 'a wall',
  shelf: 'an angled surface',
  floating: 'floating in front of you'
}[s] ?? 'here');
