/**
 * Records the submission demo video from the REAL app.
 *
 * Structure: authoring surface -> the cinematic tour -> the palace + Curator
 * agent -> a live recall session. Everything here is the actual product running;
 * no mockups, no stills.
 *
 * Honest framing note: this is desktop/emulator capture, not headset footage.
 * The video's opening card states that plainly.
 */
const fs = require('fs');
const { chromium } = require('/home/user/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');

const W = 1600, H = 900;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const ctx = await b.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: '/home/user/loci/shots/video-raw', size: { width: W, height: H } }
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1400);

  const wait = (ms) => p.waitForTimeout(ms);

  // ---- 1. Authoring surface (the product, not a splash screen)
  await wait(3000);

  // ---- 2. Add a note with a real keyboard
  await p.click('#front-input');
  await p.type('#front-input', 'What does "sonder" mean?', { delay: 45 });
  await p.click('#back-input');
  await p.type('#back-input', 'That every stranger has a life as vivid as your own.', { delay: 22 });
  await wait(600);
  await p.click('#add-form button[type=submit]');
  await wait(1800);

  // ---- 3. The cinematic tour (33s, five captioned shots)
  await p.click('#start-tour');
  await wait(34500);

  // ---- 4. Palace overview: the Curator agent speaks
  await p.keyboard.press('o');
  await wait(4500);

  // ---- 5. A live recall session
  await p.keyboard.press('r');
  await wait(2600);
  // Reveal
  await p.mouse.click(W / 2, H * 0.74);
  await wait(2800);
  // Grade "Good" — third of four buttons
  await p.mouse.click(W * 0.55, H * 0.70);
  await wait(2600);
  // Reveal + grade the next one
  await p.mouse.click(W / 2, H * 0.74);
  await wait(2200);
  await p.mouse.click(W * 0.55, H * 0.70);
  await wait(3000);

  // ---- 6. Close on the schedule / streak
  await p.keyboard.press('Escape');
  await wait(3200);

  const state = await p.evaluate(() => ({
    mode: document.body.dataset.mode,
    streak: document.getElementById('stat-streak')?.textContent,
    total: document.getElementById('stat-total')?.textContent
  }));
  console.log('final state:', JSON.stringify(state));

  await ctx.close();
  await b.close();

  const files = fs.readdirSync('/home/user/loci/shots/video-raw').filter(f => f.endsWith('.webm'));
  console.log('recorded:', files.join(', '));
})();
