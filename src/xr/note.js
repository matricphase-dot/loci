/**
 * LOCII — the note itself.
 *
 * The core visual idea: a note's *materiality* is its memory strength.
 *   - Just reviewed  → solid, saturated, sitting calmly on the surface.
 *   - Nearly forgotten → semi-transparent, desaturated, rim-glowing, drifting.
 *
 * So the room is a literal, legible map of what your brain is about to lose.
 * That's the mechanic and the art direction at once, which is why it fits in
 * six days and still reads as designed rather than assembled.
 *
 * All text is rasterised to canvas at runtime — no fonts to fetch, no images.
 */

import * as THREE from 'three';

export const KIND_COLORS = {
  general: '#7fe3c0',
  language: '#8fb8ff',
  science: '#c79bff',
  history: '#ffb683',
  code: '#7fd6ff',
  people: '#ff9ec4'
};

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const NOTE_W = 0.28;
const NOTE_H = 0.36;
const PX = 760;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  // Ellipsise if we ran out of room, so text never spills off the card.
  if (lines.length === maxLines) {
    const joined = lines.join(' ').length;
    const full = words.join(' ').length;
    if (joined < full) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

/**
 * Rasterise one face of a note.
 * @param {object} card
 * @param {'front'|'back'} face
 * @param {number} strength 0..1 urgency (drives desaturation)
 */
export function renderNoteTexture(card, face, strength = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = PX;
  canvas.height = Math.round(PX * (NOTE_H / NOTE_W));
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const accent = KIND_COLORS[card.kind] ?? KIND_COLORS.general;

  // All type is sized as a fraction of card HEIGHT, so the layout holds whether
  // the texture is 512px or 1024px tall. (Sizing in raw pixels is how the first
  // version rendered text too small to read.)
  const promptPx = Math.round(H * 0.092);
  const answerPx = Math.round(H * 0.072);
  const metaPx = Math.round(H * 0.052);
  const pad = Math.round(W * 0.055);

  // Card body: a very slightly translucent "glass" so the real room reads
  // through it — the note is an annotation on your room, not a window over it.
  ctx.clearRect(0, 0, W, H);
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, Math.round(W * 0.075));
  const bodyAlpha = 0.9 - strength * 0.14;
  ctx.fillStyle = `rgba(12, 17, 24, ${bodyAlpha})`;
  ctx.fill();
  ctx.lineWidth = Math.round(W * 0.007);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.55 + strength * 0.45;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Accent bar on the left edge — kind coding at a glance from across a room.
  const barW = Math.round(W * 0.018);
  roundRect(ctx, pad + Math.round(W * 0.022), pad + Math.round(H * 0.05), barW, H - pad * 2 - Math.round(H * 0.1), barW / 2);
  ctx.fillStyle = accent;
  ctx.fill();

  const textLeft = pad + Math.round(W * 0.075);
  const maxW = W - textLeft - pad - Math.round(W * 0.03);
  const lineH = 1.3;

  const isFront = face === 'front';

  // Back face carries the prompt small at the top, so the answer has context.
  if (!isFront) {
    ctx.fillStyle = `rgba(255,255,255,${0.42 - strength * 0.14})`;
    ctx.font = `500 ${metaPx}px ${FONT}`;
    const q = wrapText(ctx, card.front, maxW, 3);
    q.forEach((l, i) => ctx.fillText(l, textLeft, pad + Math.round(H * 0.05) + i * metaPx * 1.3));
  }

  const bodyText = isFront ? card.front : card.back;
  const size = isFront ? promptPx : answerPx;
  ctx.font = `600 ${size}px ${FONT}`;
  ctx.fillStyle = `rgba(255,255,255,${0.97 - strength * 0.2})`;
  ctx.textBaseline = 'top';

  const startY = isFront ? pad + Math.round(H * 0.07) : pad + Math.round(H * 0.07) + metaPx * 1.3 * 3;
  const available = H - pad * 2 - Math.round(H * 0.14);
  const maxLines = Math.max(2, Math.floor(available / (size * lineH)));
  const lines = wrapText(ctx, bodyText, maxW, maxLines);
  lines.forEach((l, i) => ctx.fillText(l, textLeft, startY + i * size * lineH));

  // Face marker, bottom right — unambiguous state without needing a label.
  ctx.font = `700 ${Math.round(metaPx * 0.92)}px ${FONT}`;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.6;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(isFront ? 'PROMPT' : 'ANSWER', W - pad - Math.round(W * 0.03), H - pad - Math.round(H * 0.035));
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Build the 3D note. Returns an object with `update(strength)` so the caller
 * can animate its fading without rebuilding geometry or textures.
 */
export function createNote(card) {
  const group = new THREE.Group();
  group.name = `note-${card.id}`;

  const frontTex = renderNoteTexture(card, 'front', 0.3);
  const backTex = renderNoteTexture(card, 'back', 0.3);

  const frontMat = new THREE.MeshBasicMaterial({
    map: frontTex, transparent: true, opacity: 1, depthWrite: false
  });
  const backMat = new THREE.MeshBasicMaterial({
    map: backTex, transparent: true, opacity: 1, depthWrite: false
  });

  const geo = new THREE.PlaneGeometry(NOTE_W, NOTE_H);
  const front = new THREE.Mesh(geo, frontMat);
  front.position.z = 0.001;
  const back = new THREE.Mesh(geo, backMat);
  back.rotation.y = Math.PI;

  const edge = new THREE.Mesh(
    new THREE.PlaneGeometry(NOTE_W * 1.06, NOTE_H * 1.06),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(KIND_COLORS[card.kind] ?? KIND_COLORS.general),
      transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide
    })
  );
  edge.position.z = -0.004;

  group.add(edge, back, front);
  group.userData.cardId = card.id;

  let showingBack = false;
  let dim = 1;
  const state = { strength: 0.5, t: Math.random() * 10 };

  const api = {
    object3d: group,
    cardId: card.id,
    setFace(face) {
      showingBack = face === 'back';
    },
    get face() { return showingBack ? 'back' : 'front'; },
    /** Dim companions during a focused review so one card owns attention. */
    setDimmed(v) {
      dim = v ? 0.22 : 1;
    },
    /**
     * @param {number} dt seconds
     * @param {number} strength 0..1 how forgotten this note is
     */
    update(dt, strength) {
      state.t += dt;
      state.strength = strength;
      // Fading memory => the card loses presence and gains a slow, uneasy drift.
      const fade = (1 - strength * 0.42) * dim;
      frontMat.opacity = showingBack ? 0 : fade;
      backMat.opacity = showingBack ? fade : 0;
      // Capped low on purpose: a full bright quad behind the card reads as a
      // rendering fault, not as a glow.
      const halo = (0.025 + strength * strength * 0.11) * dim;
      edge.material.opacity = halo;
      const pulse = 1 + Math.sin(state.t * (1.3 + strength * 1.5)) * 0.011 * strength;
      group.scale.setScalar(pulse);
    },
    dispose() {
      frontTex.dispose(); backTex.dispose();
      frontMat.dispose(); backMat.dispose();
      edge.material.dispose();
      geo.dispose();
      edge.geometry.dispose();
    }
  };

  api.setFace('front');
  return api;
}

export const NOTE_SIZE = { w: NOTE_W, h: NOTE_H };
