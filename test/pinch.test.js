/**
 * Pinch reading must never throw, no matter how incomplete the frame data is.
 * Regression: `frame.getJointPose` was called without checking that the joint
 * existed, which threw an uncaught TypeError every frame in the emulator.
 */
import assert from 'node:assert/strict';

// Minimal stand-ins for the DOM/three globals input.js touches at import time.
globalThis.window = { addEventListener() {}, AudioContext: class {} };
globalThis.performance = globalThis.performance ?? { now: () => 0 };
globalThis.document = { addEventListener() {}, createElement: () => ({ getContext: () => ({}) }) };

const { InputSystem } = await import('../src/xr/input.js');

let passed = 0;
const t = (n, f) => { try { f(); passed++; console.log(`  ok  ${n}`); } catch (e) { console.error(`FAIL  ${n}\n      ${e.message}`); process.exitCode = 1; } };

const refSpace = {};
const fakeHand = (joints) => ({
  get: (name) => (name in joints ? joints[name] : undefined)
});

console.log('\nLOCII pinch robustness\n');

t('does not throw when frame is undefined', () => {
  const i = new InputSystem();
  const src = { hand: fakeHand({}), handedness: 'right' };
  assert.equal(i._readHandPinch(undefined, src, refSpace), false);
});

t('does not throw when getJointPose is missing entirely', () => {
  const i = new InputSystem();
  const src = { hand: fakeHand({}), handedness: 'right' };
  assert.equal(i._readHandPinch({}, src, refSpace), false);
});

t('does not throw when a joint is undefined (the original crash)', () => {
  const i = new InputSystem();
  // thumb-tip present, index-finger-tip missing -> previously called
  // getJointPose(undefined) and threw.
  const src = { hand: fakeHand({ 'thumb-tip': {} }), handedness: 'right' };
  const frame = { getJointPose: () => ({ transform: { position: { x: 0, y: 0, z: 0 } } }) };
  assert.equal(i._readHandPinch(frame, src, refSpace), false);
});

t('does not throw when getJointPose throws', () => {
  const i = new InputSystem();
  const src = { hand: fakeHand({ 'thumb-tip': {}, 'index-finger-tip': {} }), handedness: 'right' };
  const frame = { getJointPose: () => { throw new Error('boom'); } };
  assert.equal(i._readHandPinch(frame, src, refSpace), false);
});

t('detects a real pinch from joint distance', () => {
  const i = new InputSystem();
  const src = { hand: fakeHand({ 'thumb-tip': {}, 'index-finger-tip': {} }), handedness: 'right' };
  const frame = {
    getJointPose: () => ({ transform: { position: { x: 0, y: 0, z: 0 } } })
  };
  assert.equal(i._readHandPinch(frame, src, refSpace), true, 'touching tips = pinch');
});

t('does not report a pinch when fingertips are far apart', () => {
  const i = new InputSystem();
  const src = { hand: fakeHand({ 'thumb-tip': {}, 'index-finger-tip': {} }), handedness: 'right' };
  let call = 0;
  const frame = {
    getJointPose: () => ({ transform: { position: call++ === 0 ? { x: 0, y: 0, z: 0 } : { x: 0.2, y: 0, z: 0 } } })
  };
  assert.equal(i._readHandPinch(frame, src, refSpace), false);
});

t('falls back to a gamepad button when joints are unavailable', () => {
  const i = new InputSystem();
  const src = { hand: fakeHand({}), handedness: 'left', gamepad: { buttons: [{ pressed: true }], axes: [0, 0] } };
  assert.equal(i._readHandPinch({}, src, refSpace), true);
});

t('updateXR survives an empty session', () => {
  const i = new InputSystem();
  assert.doesNotThrow(() => i.updateXR(undefined, refSpace, { inputSources: [] }));
});

t('updateXR survives a malformed input source', () => {
  const i = new InputSystem();
  const session = { inputSources: [{ hand: null, gamepad: null }] };
  assert.doesNotThrow(() => i.updateXR({}, refSpace, session));
});

console.log(`\n${passed} passed\n`);
