/**
 * Verifies the PRODUCTION build (not the dev server) actually runs — this is
 * what is deployed and what judges load.
 */
const { chromium } = require('/home/user/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const state = await p.evaluate(() => ({
    cards: document.getElementById('stat-total')?.textContent,
    canvas: !!document.querySelector('#canvas-root canvas'),
    fatal: !!document.querySelector('pre'),
    notes: window.__LOCII_DEBUG__ ? window.__LOCII_DEBUG__().count : -1
  }));
  const real = errs.filter(e => !/favicon|Failed to load resource/i.test(e));
  console.log('production build:', JSON.stringify(state));
  console.log('errors:', real.length ? real.slice(0,3) : 'none');
  const ok = state.cards === '8' && state.canvas && !state.fatal && state.notes === 8 && real.length === 0;
  console.log(ok ? 'PRODUCTION BUILD OK' : 'PRODUCTION BUILD FAILED');
  await b.close();
  process.exit(ok ? 0 : 1);
})();
