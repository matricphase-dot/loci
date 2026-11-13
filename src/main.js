import { boot } from './app.js';

/**
 * Entry point. Kept deliberately tiny: everything interesting is in app.js and
 * the modules it pulls in. If boot throws, we surface it on screen rather than
 * leaving a judge staring at a blank canvas.
 */
try {
  boot();
} catch (err) {
  console.error('[LOCI] boot failed', err);
  const el = document.createElement('pre');
  el.style.cssText = 'position:fixed;inset:24px;z-index:99;color:#ff9a6b;background:#0a0f12;border:1px solid #ff9a6b44;padding:20px;border-radius:12px;overflow:auto;font:12px ui-monospace,monospace;white-space:pre-wrap';
  el.textContent = `LOCI failed to start.\n\n${err?.stack ?? err}`;
  document.body.appendChild(el);
}
