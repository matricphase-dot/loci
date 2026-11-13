/**
 * Records a real walkthrough of the running app to video.
 *
 * This captures the actual product code executing (flat authoring -> palace ->
 * recall loop), not a mock. It is NOT stereoscopic headset footage — the
 * submission needs device capture for that — but it is an honest reference for
 * pacing, and a usable fallback for the desktop authoring beats.
 */
const fs = require('fs');
const { chromium } = require('/home/user/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: '/home/user/loci/shots/video', size: { width: 1280, height: 720 } }
  });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  const pause = (ms) => p.waitForTimeout(ms);

  // --- Beat 1: the flat authoring surface (0-6s)
  await pause(2600);

  // --- Beat 2: author a note, typed at a real keyboard
  await p.click('#front-input');
  await p.type('#front-input', 'What is the locus method?', { delay: 42 });
  await p.click('#back-input');
  await p.type('#back-input', 'Anchoring what you learn to places you already know.', { delay: 26 });
  await pause(500);
  await p.click('#add-form button[type=submit]');
  await pause(1600);

  // --- Beat 3: switch palace to prove multiple contexts
  // Chips are re-rendered on click, so re-query rather than holding handles.
  const clickChip = async (i) => {
    const c = (await p.$$('.chip'))[i];
    if (c) await c.click();
  };
  const chipCount = (await p.$$('.chip')).length;
  if (chipCount > 1) { await clickChip(1); await pause(1100); await clickChip(0); await pause(800); }

  // --- Beat 4: the palace itself
  await p.evaluate(() => {
    document.querySelector('.rail').style.display = 'none';
    document.querySelector('.stage').style.display = 'none';
  });
  await pause(3000); // let the notes drift and fade

  // --- Beat 5: recall loop
  await p.keyboard.press('r');
  await pause(2400);
  // Confirm button through the real gaze pipeline (menu is canvas; click centre)
  await p.mouse.move(760, 500);
  await p.mouse.click(760, 500);
  await pause(2200);
  await p.mouse.click(640, 500);
  await pause(2600);

  // --- Beat 6: back to the room
  await p.evaluate(() => {
    document.querySelector('.rail').style.display = '';
    document.querySelector('.stage').style.display = '';
  });
  await pause(1800);

  await ctx.close();
  await b.close();

  const files = fs.readdirSync('/home/user/loci/shots/video').filter(f => f.endsWith('.webm'));
  console.log('recorded:', files.join(', '));
})();
