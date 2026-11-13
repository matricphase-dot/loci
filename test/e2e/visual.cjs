/**
 * Visual capture. Renders the 3D scene with the DOM shell hidden so the actual
 * spatial composition can be inspected (and used for submission screenshots).
 */
const path = require('path');
const { chromium } = require('/home/user/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);

  // 1. Lobby: hero + a few floating notes.
  await p.evaluate(() => {
    document.querySelector('.rail').style.display = 'none';
    document.querySelector('.stage').style.display = 'none';
  });
  await p.waitForTimeout(900);
  await p.screenshot({ path: '/home/user/loci/shots/scene-lobby.png' });

  // 2. Overview: notes revealed, menu panel present.
  await p.evaluate(() => {
    document.querySelector('.rail').style.display = '';
    document.getElementById('enter-xr').click();
  });
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    document.querySelector('.rail').style.display = 'none';
    document.querySelector('.stage').style.display = 'none';
    // Drive the mode directly for the capture.
    const ev = new KeyboardEvent('keydown', { key: 'r' });
    window.dispatchEvent(ev);
  });
  await p.waitForTimeout(1400);
  await p.screenshot({ path: '/home/user/loci/shots/scene-review.png' });

  await b.close();
  console.log('captured');
})();
