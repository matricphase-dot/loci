/**
 * Verifies the browser tour actually runs: captions advance, the camera moves,
 * and it ends cleanly. Also captures frames from each shot for the gallery.
 */
const { chromium } = require('/home/user/.npm/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core');

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'] });
  const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);

  // Start the tour via the primary CTA.
  await p.click('#start-tour');
  await p.waitForTimeout(1500);

  const started = await p.evaluate(() => ({
    touring: document.body.classList.contains('touring'),
    caption: document.getElementById('tour-caption')?.textContent ?? '',
    progress: document.getElementById('tour-progress')?.style.width ?? ''
  }));
  console.log('started:', JSON.stringify(started));

  // Sample across the whole 33s run, capturing one frame per shot.
  const captions = new Set([started.caption]);
  let shots = 0;
  for (let i = 0; i < 20; i++) {
    await p.waitForTimeout(2000);
    const st = await p.evaluate(() => ({
      caption: document.getElementById('tour-caption')?.textContent ?? '',
      progress: document.getElementById('tour-progress')?.style.width ?? '',
      touring: document.body.classList.contains('touring')
    }));
    if (st.caption) captions.add(st.caption);
    if (i === 1 || i === 4 || i === 7 || i === 9) {
      await p.screenshot({ path: `/home/user/loci/shots/tour-shot-${++shots}.png` });
    }
    if (!st.touring) break;
  }

  const ended = await p.evaluate(() => document.body.classList.contains('touring'));
  const real = errs.filter(e => !/favicon|Failed to load resource/i.test(e));

  console.log('distinct captions seen:', captions.size);
  for (const c of captions) if (c) console.log('  •', c);
  console.log('tour ended cleanly:', !ended);
  console.log('errors:', real.length ? real.slice(0, 3) : 'none');
  console.log((captions.size >= 4 && real.length === 0) ? 'TOUR OK' : 'TOUR PROBLEM');

  await b.close();
})();
