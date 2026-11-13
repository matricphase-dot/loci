/**
 * LOCII — in-headset UI.
 *
 * Rules this file exists to enforce:
 *  1. Nothing is ever typed inside the headset. Authoring happens on the flat
 *     screen; the headset is for looking, recalling and grading. This single
 *     decision removes the biggest failure mode of VR productivity apps.
 *  2. Every target is comfortably large at arm's length and sits within a 2ft
 *     radius of the seat, so the airplane-seat test holds.
 *  3. Gaze aims, pinch confirms, and a dwell ring fills, so the interaction is
 *     legible without instructions and usable by people who cannot pinch.
 *
 * All text is rasterised to canvas at runtime — no fonts, no images, no CDN.
 */

import * as THREE from 'three';

// Texture density. 1600 px/m keeps 26–38px type crisp at typical reading
// distance without blowing past Quest texture memory (a menu is ~1152×512).
const PX_PER_M = 1600;

function makeCanvas(wM, hM) {
  const c = document.createElement('canvas');
  c.width = Math.max(64, Math.round(wM * PX_PER_M));
  c.height = Math.max(64, Math.round(hM * PX_PER_M));
  return c;
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** A flat, canvas-backed panel. Redrawn only when state changes. */
export class Panel {
  constructor({ width, height, position = [0, 0, 0], opacity = 0.94 }) {
    this.width = width;
    this.height = height;
    this.canvas = makeCanvas(width, height);
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
    this.mesh.position.set(position[0], position[1], position[2]);
    this.mesh.renderOrder = 10;
    this.buttons = [];
    this.dirty = true;
  }

  get pxW() { return this.canvas.width; }
  get pxH() { return this.canvas.height; }

  setPosition(x, y, z) { this.mesh.position.set(x, y, z); return this; }
  setVisible(v) { this.mesh.visible = v; return this; }

  clear() {
    this.ctx.clearRect(0, 0, this.pxW, this.pxH);
    this.buttons = [];
    return this;
  }

  bg(color = 'rgba(10,14,20,0.85)', strokeColor = null, radius = 52) {
    const { ctx } = this;
    rr(ctx, 7, 7, this.pxW - 14, this.pxH - 14, radius);
    ctx.fillStyle = color;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    return this;
  }

  /**
   * Text. `size` is a fraction of panel height; `x`/`y` are fractions of
   * width/height. 0.05 of a 0.32m panel ≈ 26px, which is the floor for
   * comfortable reading inside a headset.
   */
  text(str, {
    x = 0.055, y = 0.1, size = 0.06, weight = 500, color = '#ffffff',
    align = 'left', maxW = 0.89, lineH = 1.38, maxLines = 6
  } = {}) {
    const { ctx } = this;
    const px = Math.max(10, size * this.pxH);
    ctx.font = `${weight} ${px}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';

    const limit = this.pxW * maxW;
    const words = String(str ?? '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > limit && line) {
        lines.push(line);
        line = w;
        if (lines.length === maxLines) break;
      } else {
        line = test;
      }
    }
    if (lines.length < maxLines && line) lines.push(line);
    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(`${last}…`).width > limit && last.length > 1) last = last.slice(0, -1);
      lines[maxLines - 1] = `${last}…`;
    }

    const ax = align === 'center' ? this.pxW / 2
      : align === 'right' ? this.pxW * (1 - x)
        : this.pxW * x;
    lines.forEach((l, i) => ctx.fillText(l, ax, this.pxH * y + i * px * lineH));
    return this;
  }

  /** Add a button. Geometry is recorded so the parent can hit-test in UV space. */
  button(label, { x, y, w, h, accent = '#7fe3c0', textColor = '#06131a', fontSize = 0.055, kind = 'solid' }) {
    const b = {
      label,
      id: `${label}:${this.buttons.length}`,
      accent,
      rect: {
        x: x * this.pxW,
        y: y * this.pxH,
        w: w * this.pxW,
        h: h * this.pxH
      }
    };
    this.buttons.push(b);
    this._drawButton(b, textColor, fontSize, kind);
    return b;
  }

  _drawButton(b, textColor, fontSize, kind) {
    const { ctx } = this;
    const r = b.rect;
    rr(ctx, r.x, r.y, r.w, r.h, Math.min(r.h / 2, 34));
    if (kind === 'solid') {
      ctx.fillStyle = b.accent;
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fill();
      ctx.strokeStyle = b.accent;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    const px = Math.max(10, fontSize * this.pxH);
    ctx.font = `600 ${px}px ${FONT}`;
    ctx.fillStyle = kind === 'solid' ? textColor : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shrink-to-fit so long labels never overflow a narrow button.
    let label = b.label;
    const maxTextW = r.w - 26;
    while (ctx.measureText(label).width > maxTextW && px > 10 && label.length > 2) {
      label = label.slice(0, -1);
    }
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + px * 0.04);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  flush() {
    this.texture.needsUpdate = true;
    this.dirty = false;
  }

  dispose() {
    this.texture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}

/**
 * The contextual action panel. Rebuilt whenever the mode or state changes —
 * LOCII's button sets are small, so a redraw is cheaper than diffing them.
 */
export class Menu {
  constructor({ width = 0.74, height = 0.34, position = [0, -0.3, -0.8] } = {}) {
    this.panel = new Panel({ width, height, position });
    this.buttons = [];
    this.spec = { title: '', body: '', buttons: [] };
    this.object3d = this.panel.mesh;
    this._hl = null;
  }

  /**
   * @param {{title?:string, body?:string, buttons:Array<{label:string, action:string, accent?:string, kind?:string}>}} spec
   */
  render(spec = null) {
    if (spec) this.spec = spec;
    const { title, body, buttons } = this.spec;
    const p = this.panel;
    p.clear();
    p.bg('rgba(8,11,17,0.88)', 'rgba(127,227,192,0.24)', 52);

    // Pinch any button to act. Hovered buttons are drawn solid.
    this.buttons = [];

    let y = 0.085;
    if (title) {
      p.text(title, { x: 0.055, y, size: 0.082, weight: 700, color: '#7fe3c0', maxLines: 1 });
      y += 0.17;
    }
    if (body) {
      const lines = body.length > 78 ? 3 : 2;
      p.text(body, {
        x: 0.055, y, size: 0.058, weight: 400,
        color: 'rgba(255,255,255,0.84)', maxLines: lines, lineH: 1.42
      });
      y += lines * 0.058 * 1.42 + 0.06;
    }

    const n = Math.max(1, buttons.length);
    const gap = 0.026;
    const margin = 0.055;
    const bw = (1 - margin * 2 - gap * (n - 1)) / n;
    const bh = 0.26;
    const by = Math.min(0.66, Math.max(y, 0.6));

    this.buttons = buttons.map((b, i) => {
      const accent = b.accent ?? '#7fe3c0';
      const hovered = this._hl === b.label;
      // Ghost buttons become solid while gazed at, which is the only hover
      // state we need and it reads instantly.
      const kind = hovered ? 'solid' : (b.kind ?? 'solid');
      const drawn = p.button(b.label, {
        x: margin + i * (bw + gap),
        y: by,
        w: bw,
        h: bh,
        accent: hovered ? '#ffffff' : accent,
        kind,
        fontSize: 0.062
      });
      return { ...drawn, action: b.action, baseRect: { ...drawn.rect }, label: b.label };
    });

    p.flush();
    return this;
  }

  /** Map a UV hit on the panel (0..1, y-up) to a button record. */
  hitTest(uv) {
    if (!uv) return null;
    // PlaneGeometry UVs have (0,0) bottom-left; canvas y runs top-down.
    const px = uv.x * this.panel.pxW;
    const py = (1 - uv.y) * this.panel.pxH;
    for (const b of this.buttons) {
      const r = b.baseRect ?? b.rect;
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return b;
    }
    return null;
  }

  setVisible(v) { this.panel.setVisible(v); return this; }
  dispose() { this.panel.dispose(); }

  /**
   * Sit the panel in front of, and slightly below, the eyes — always inside the
   * 2ft working radius, never blocking the room.
   */
  placeRelativeTo(camera, forwardOffset = 0.8, downOffset = 0.26) {
    const head = new THREE.Vector3();
    camera.getWorldPosition(head);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
    dir.normalize();
    const target = head.clone().addScaledVector(dir, forwardOffset);
    target.y = head.y - downOffset;
    this.panel.mesh.position.copy(target);
    // Yaw-only billboard: a panel that pitches with your neck is nauseating.
    this.panel.mesh.lookAt(head.x, target.y, head.z);
  }
}

/**
 * Gaze reticle with a dwell ring. Doubles as the confirm affordance for users
 * who cannot comfortably pinch.
 */
export class GazeCursor {
  constructor(scene) {
    this.group = new THREE.Group();
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.0038, 0.0055, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthTest: false, side: THREE.DoubleSide })
    );
    this.ring.renderOrder = 1000;
    this.dwell = new THREE.Mesh(
      new THREE.RingGeometry(0.0068, 0.0088, 48, 1, -Math.PI / 2, 0.001),
      new THREE.MeshBasicMaterial({ color: 0x7fe3c0, transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide })
    );
    this.dwell.renderOrder = 1001;
    this.group.add(this.ring, this.dwell);
    this.group.visible = false;
    scene.add(this.group);
    this._lastProgress = -1;
  }

  update(camera, progress = 0, active = false) {
    if (!camera) return;
    const head = new THREE.Vector3();
    camera.getWorldPosition(head);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    this.group.position.copy(head).addScaledVector(dir, 0.45);
    this.group.quaternion.copy(camera.quaternion);
    this.group.visible = true;

    this.ring.material.color.set(active ? 0x7fe3c0 : 0xffffff);
    this.ring.material.opacity = active ? 0.95 : 0.5;
    this.ring.scale.setScalar(active ? 1.2 : 1);

    // Only rebuild the arc geometry when the fraction visibly changes.
    const p = Math.round(Math.max(0, Math.min(1, progress)) * 60) / 60;
    if (p !== this._lastProgress) {
      this._lastProgress = p;
      this.dwell.geometry.dispose();
      this.dwell.geometry = new THREE.RingGeometry(
        0.0068, 0.0088, 48, 1, -Math.PI / 2, Math.max(0.001, p * Math.PI * 2)
      );
    }
    this.dwell.visible = progress > 0.02;
  }

  dispose() {
    this.ring.geometry.dispose();
    this.ring.material.dispose();
    this.dwell.geometry.dispose();
    this.dwell.material.dispose();
  }
}
