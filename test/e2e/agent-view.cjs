/** Captures the Curator's suggestion card to confirm it renders in the app. */
const { chromium } = require('/home/user/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 880 } })).newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  // Force the flat view into the palace overview so the agent renders.
  await p.evaluate(() => {
    document.querySelector('.rail').style.display = 'none';
    document.querySelector('.stage').style.display = 'none';
  });
  // Notes are unplaced in a fresh demo, so the agent should offer to place one.
  const dump = await p.evaluate(() => {
    const d = window.__LOCI_DEBUG__ ? window.__LOCI_DEBUG__() : null;
    return d;
  });
  console.log('notes:', dump?.count, 'mode:', dump?.mode);
  // Enter the palace overview, where the Curator surfaces its one suggestion.
  await p.keyboard.press('o');
  await p.waitForTimeout(1200);
  const after = await p.evaluate(() => window.__LOCI_DEBUG__?.()?.mode);
  console.log('mode after overview:', after);
  await p.waitForTimeout(400);
  await p.screenshot({ path: '/home/user/loci/shots/scene-agent.png' });
  await b.close();
})();
