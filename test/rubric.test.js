/**
 * LOCII — rubric conformance tests.
 *
 * These encode the competition's own stated requirements as executable checks.
 * If an edit ever breaks a hard requirement ("fully usable with hands, end to
 * end"), this suite fails rather than the entry failing silently in judging.
 *
 * Source: Meta VR Start Developer Competition 2026 — What to Build, Design
 * Guidelines, and Judging Criteria.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const SRC_FILES = ['src/app.js', 'src/main.js', 'src/core/srs.js', 'src/core/store.js',
  'src/core/audio.js', 'src/core/curator.js', 'src/xr/spatial.js',
  'src/xr/input.js', 'src/xr/note.js', 'src/xr/ui.js'];

let passed = 0;
const t = (n, f) => { try { f(); passed++; console.log(`  ok  ${n}`); } catch (e) { console.error(`FAIL  ${n}\n      ${e.message}`); process.exitCode = 1; } };

console.log('\nLOCII rubric conformance\n');

// ---------------------------------------------------------------- hard requirements
t('HANDS-FIRST: immersive-ar (passthrough), never immersive-vr', () => {
  const app = read('src/app.js');
  assert.match(app, /requestSession\('immersive-ar'/, 'must request immersive-ar');
  assert.ok(!/requestSession\('immersive-vr'/.test(app), 'must never fall back to a fully virtual session');
});

t('HANDS-FIRST: hand-tracking is requested', () => {
  const app = read('src/app.js');
  assert.match(app, /'hand-tracking'/);
});

t('HANDS-FIRST: pinch is read from real joint poses, not a gamepad button', () => {
  const input = read('src/xr/input.js');
  assert.match(input, /get\('thumb-tip'\)/);
  assert.match(input, /get\('index-finger-tip'\)/);
  assert.match(input, /getJointPose/);
});

t('HANDS-FIRST: pinch threshold is metric with hysteresis (no chatter)', () => {
  const input = read('src/xr/input.js');
  assert.match(input, /PINCH_ON\s*=\s*0\.0\d+/);
  assert.match(input, /PINCH_OFF\s*=\s*0\.0\d+/);
  const on = parseFloat(input.match(/PINCH_ON\s*=\s*([\d.]+)/)[1]);
  const off = parseFloat(input.match(/PINCH_OFF\s*=\s*([\d.]+)/)[1]);
  assert.ok(off > on, 'release threshold must exceed press threshold');
});

t('HANDS-FIRST: there is a complete non-pinch path (dwell-to-confirm)', () => {
  const input = read('src/xr/input.js');
  assert.match(input, /DWELL_MS/);
  assert.match(input, /dwellProgress/);
  const app = read('src/app.js');
  assert.match(app, /dwellFired/, 'dwell must actually be able to trigger actions');
});

t('HANDS-FIRST: no interaction is gated behind a controller', () => {
  const app = read('src/app.js');
  const input = read('src/xr/input.js');
  // Controllers may contribute input, but nothing may *require* one.
  assert.ok(!/if\s*\(\s*!.*gamepad/.test(app), 'no flow may require a gamepad');
  assert.ok(!/requiresController|controllerOnly/.test(app + input));
});

// ---------------------------------------------------------------- design guidelines
t('SEATED: placement is clamped to a reachable, seated shell', () => {
  const spatial = read('src/xr/spatial.js');
  const min = parseFloat(spatial.match(/MIN_DIST:\s*([\d.]+)/)[1]);
  const max = parseFloat(spatial.match(/MAX_DIST:\s*([\d.]+)/)[1]);
  assert.ok(min >= 0.4, `min distance ${min} should be ~arm's length`);
  assert.ok(max <= 2.5, `max distance ${max} must stay inside a 2ft-radius seated envelope`);
});

t('SEATED: there is no locomotion anywhere', () => {
  for (const f of SRC_FILES) {
    const src = read(f);
    assert.ok(!/camera\.position\.(x|y|z)\s*\+=/.test(src), `${f} must not translate the camera`);
    assert.ok(!/applyTranslation|locomotion/i.test(src), `${f} must not implement locomotion`);
  }
});

t('FOV-AWARE: placement checks angular offset from gaze, not just distance', () => {
  const spatial = read('src/xr/spatial.js');
  assert.match(spatial, /FOV/);
  assert.match(spatial, /fovScore|angleTo/);
  assert.match(spatial, /SAFE_H_FRACTION/);
});

t('BUS STOP: a session is capped to roughly ten minutes', () => {
  const store = read('src/core/store.js');
  const limit = parseInt(store.match(/sessionLimit:\s*(\d+)/)[1], 10);
  assert.ok(limit >= 5 && limit <= 15, `sessionLimit ${limit} should be a 10-minute-ish session`);
});

t('BUS STOP: the experience reaches a real completion state', () => {
  const app = read('src/app.js');
  assert.match(app, /SESSION COMPLETE/);
  assert.match(app, /finishSession/);
});

t('COLD START: no network calls at runtime (fast, and nothing to fail)', () => {
  for (const f of SRC_FILES) {
    const src = read(f);
    assert.ok(!/\bfetch\(/.test(src), `${f} must not fetch`);
    assert.ok(!/XMLHttpRequest/.test(src), `${f} must not XHR`);
    assert.ok(!/import\(['"]https?:/.test(src), `${f} must not import from a CDN`);
  }
  const html = read('index.html');
  assert.ok(!/<link[^>]+href="https?:/.test(html), 'no external stylesheets');
  assert.ok(!/<script[^>]+src="https?:/.test(html), 'no external scripts');
});

t('ORIGINAL, NOT A WRAPPER: take-it-away test — no third-party service', () => {
  const all = SRC_FILES.map(read).join('\n');
  const banned = /youtube|youtu\.be|openai|anthropic|chatgpt|api\.openai|gemini|huggingface|firebase|supabase|aws-sdk/i;
  assert.ok(!banned.test(all), 'no third-party platform dependencies');
});

t('COLD START: zero external assets — audio and type are generated at runtime', () => {
  const audio = read('src/core/audio.js');
  assert.match(audio, /AudioContext/, 'audio must be synthesised');
  assert.ok(!/\.mp3|\.wav|\.ogg/.test(audio), 'no audio files');
  for (const f of SRC_FILES) {
    assert.ok(!/\.(png|jpg|jpeg|glb|gltf|woff2?|ttf)\b/.test(read(f)), `${f} must not reference binary assets`);
  }
});

// ---------------------------------------------------------------- judging criteria
t('INNOVATION: passthrough is load-bearing (no hit-test means no product)', () => {
  const app = read('src/app.js');
  assert.match(app, /needs passthrough/);
  const spatial = read('src/xr/spatial.js');
  assert.match(spatial, /requestHitTestSource/);
});

t('TECHNICAL: uses the WebXR hit-test module against real geometry', () => {
  const spatial = read('src/xr/spatial.js');
  assert.match(spatial, /requestHitTestSource/);
  assert.match(spatial, /getHitTestResults/);
  assert.match(spatial, /captureAnchor/);
});

t('TECHNICAL: hit-pose ORIENTATION is used, so notes conform to surfaces', () => {
  const spatial = read('src/xr/spatial.js');
  assert.match(spatial, /transform\.orientation/, 'must read the hit pose orientation');
  assert.match(spatial, /q:\s*\[/, 'must persist a quaternion');
});

t('TECHNICAL: persistent anchors are requested and degrade gracefully', () => {
  const spatial = read('src/xr/spatial.js');
  assert.match(spatial, /createAnchor/, 'must attempt a real XRAnchor');
  assert.match(spatial, /persistent/, 'must record anchor durability');
  assert.match(spatial, /catch/, 'must degrade when anchors are unsupported');
});

t('TECHNICAL: single unlit material path — no lighting cost on Quest', () => {
  const app = read('src/app.js');
  assert.ok(!/new THREE\.(DirectionalLight|PointLight|AmbientLight|HemisphereLight)/.test(app),
    'all materials are MeshBasic; adding lights would waste GPU budget');
});

t('TECHNICAL: renders pixel-ratio-capped for stable frame rate', () => {
  const app = read('src/app.js');
  assert.match(app, /setPixelRatio\(Math\.min\(window\.devicePixelRatio,\s*2\)\)/);
});

t('POLISH: every interactive target is comfortably sized at arm length', () => {
  const ui = read('src/xr/ui.js');
  assert.match(ui, /PX_PER_M/);
  // menu panel is a real-world size in metres
  const m = ui.match(/width\s*=\s*([\d.]+),\s*height\s*=\s*([\d.]+)/);
  assert.ok(m && parseFloat(m[1]) > 0.5, 'menu must be physically large enough to read and hit');
});

t('POLISH: state is never conveyed by colour alone', () => {
  const note = read('src/xr/note.js');
  assert.match(note, /opacity/, 'opacity carries state');
  assert.match(note, /scale\.setScalar/, 'scale carries state');
  assert.match(note, /Math\.sin/, 'motion carries state');
});

t('ACCESSIBILITY: reduced motion is respected on the flat UI', () => {
  const html = read('index.html');
  assert.match(html, /prefers-reduced-motion/);
});

t('ACCESSIBILITY: text is sized relative to card height, not fixed pixels', () => {
  const note = read('src/xr/note.js');
  assert.match(note, /H \* 0\.0\d+/, 'type scale must be proportional so it stays legible at distance');
});

t('REASON TO COME BACK: the schedule drives the next visit', () => {
  const srs = read('src/core/srs.js');
  assert.match(srs, /nextVisitLabel/);
  const store = read('src/core/store.js');
  assert.match(store, /recordSession/);
  assert.match(store, /streak/);
});

t('AGENTIC: there is an on-device agent that acts, not just chats', () => {
  const curator = read('src/core/curator.js');
  assert.match(curator, /export function suggest/);
  assert.match(curator, /REANCHOR|PLACE|SPREAD/, 'must propose concrete repairs');
  const app = read('src/app.js');
  assert.match(app, /acceptSuggestion/, 'suggestion must be actionable in one pinch');
  // ...and it must not depend on the network.
  assert.ok(!/fetch\(/.test(curator), 'the agent must run entirely on device');
});

t('AGENTIC: the agent surfaces at most one suggestion at a time', () => {
  const curator = read('src/core/curator.js');
  assert.match(curator, /candidates\.sort/, 'must rank');
  assert.match(curator, /return candidates\[0\]/, 'must return exactly one');
});

// ---------------------------------------------------------------- submission mechanics
t('SUBMISSION: description is within the 500-word limit', () => {
  const md = read('SUBMISSION.md');
  const start = md.indexOf('> **Inspiration**');
  const end = md.indexOf('## 3. Hand interactions');
  assert.ok(start > 0 && end > start, 'description section must exist');
  const clean = md.slice(start, end).replace(/^>\s?/gm, '').replace(/\*\*/g, '');
  const words = clean.split(/\s+/).filter((w) => w && w !== '---');
  assert.ok(words.length <= 500, `description is ${words.length} words, limit is 500`);
});

t('SUBMISSION: tagline is within the 140-character limit', () => {
  const md = read('SUBMISSION.md');
  const m = md.match(/\*\*Tagline\*\*[^\n]*\n([^\n]+)/) || md.match(/\*\*Tagline\*\*.*?\n\s*\n?([^\n]{20,140})/);
  assert.ok(m, 'tagline must be present');
  const line = m[1].trim().replace(/^\*+|\*+$/g, '');
  assert.ok(line.length <= 140, `tagline is ${line.length} chars: "${line}"`);
  assert.ok(line.length > 40, 'tagline should be substantive');
});

t('SUBMISSION: required form fields are all documented', () => {
  const md = read('SUBMISSION.md');
  for (const field of ['Submission name', 'Tagline', 'Track', 'Division', 'video', 'Description']) {
    assert.ok(md.toLowerCase().includes(field.toLowerCase()), `missing: ${field}`);
  }
});

console.log(`\n${passed} passed\n`);
