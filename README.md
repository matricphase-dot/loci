# LOCI

**A memory palace for your real room.**

Author notes on the flat screen. Put the headset on. Your notes are nailed to
your actual walls, table and shelves — and every day, the ones you're about to
forget are waiting for you exactly where you left them.

Built for the **Meta VR Start Developer Competition 2026** — Productivity track,
New Experience division, on WebXR.

> Submission copy, video shot list and judging map: **[SUBMISSION.md](./SUBMISSION.md)**

---

## Why passthrough is load-bearing

The method of loci works because spatial memory is more durable than verbal
memory. LOCI uses your room's real geometry as the mnemonic scaffold, which means
turning passthrough off would not make the app uglier — it would make it
meaningless. That is the test the judging criteria set, and it is the reason this
was built for `immersive-ar` rather than a virtual room.

**The core idea:** a note's appearance *is* its memory strength. Freshly reviewed,
it sits solid and calm. As you begin to forget it, it fades, desaturates, and
drifts. Your room becomes a live physical readout of what your brain is about to
lose.

## Hands-first, end to end

- **Gaze aims, pinch confirms.** Gaze is precise and free; pinch is the most
  reliable discrete signal a tracked hand produces; neither tires your arm.
- **Dwell-to-confirm** fills a ring while you hold your gaze, so the whole
  experience is operable without pinching.
- **No controllers** anywhere in the flow. Controllers work if present; nothing
  is gated behind them.
- **No typing in VR.** Authoring happens on a flat screen with a real keyboard,
  before you put the headset on. This single decision removes the most common
  failure mode of VR productivity apps.

## Run it

```bash
npm install
npm test          # 91 checks: scheduler, ritual, curator, pinch, rubric…
npm run verify    # full suite incl. browser e2e (needs Chromium)
npm run dev       # http://localhost:5173
npm run build     # production bundle in dist/
npm run preview   # serve the built bundle
```

Open on **Meta Quest Browser** over HTTPS, press *Enter your palace*, accept the
immersive-ar prompt. Everything else — hit-test, hand tracking, the notes —
happens automatically.

The flat-screen view works on desktop and is fully functional for authoring. It
honestly labels itself: without passthrough it is not the product.

## Architecture

```
src/
  core/
    srs.js        Scheduling engine. Pure functions, no DOM. FSRS-style
                  stability/difficulty model, session planner, palace stats.
    store.js      localStorage persistence with defensive record repair.
    audio.js      Every sound synthesised at runtime via WebAudio. No assets.
  xr/
    spatial.js    Passthrough, WebXR hit-test, surface-normal orientation,
                  comfort shell, fallback arc layout.
    input.js      Hand pinch via joint-distance with hysteresis, gaze ray,
                  controller support, dwell-to-confirm.
    note.js       Canvas-rasterised note textures; per-frame fading/glow.
    ui.js         Canvas-backed panels, gaze-targeted menu, dwell cursor.
  app.js          Modes, session flow, interaction resolution, XR lifecycle.
```

**No external assets of any kind.** Text is rasterised to canvas at runtime,
audio is synthesised with WebAudio, geometry is procedural. Nothing to download,
nothing to license, nothing to break offline.

## The scheduling engine

`src/core/srs.js` is the part that has to be provably correct, so it is pure
functions with 15 unit tests (`npm test`):

- Exponential forgetting curve; retrievability hits 0.9 at exactly one stability.
- Non-linear urgency: a note 1 day overdue does not glow as hard as one 12 days
  overdue. This drives the visual fading, so it is a product feature, not a stat.
- A lapse collapses stability and forces the card back within a day.
- Interleaved session planning capped at 10 cards (~10 minutes).
- A **120-day simulated learner** proving daily review load collapses as memories
  consolidate — i.e. the app gets *less* demanding the more you use it.

## Verification

Run in this repo:

```bash
node test/run-all.cjs          # all 9 steps, 91 checks
node test/srs.test.js          # 15/15 scheduler unit tests
node test/pinch.test.js        # 9/9 pinch-robustness regressions
```

End-to-end (needs Chromium; see `test/e2e/`):

```bash
node test/e2e/smoke.cjs        # 13/13 — boots, authors, persists, no console errors
node test/e2e/prod.cjs         # verifies the built bundle, not just the dev server
node test/e2e/visual.cjs       # renders submission screenshots into shots/
```

`test/e2e/` was written because the headset was not available in the build
environment. It is not a substitute for testing on a Quest — see the hardware
checklist in SUBMISSION.md §7.

## Accessibility

- Dwell-to-confirm as a complete alternative to pinching.
- No timed reactions and no locomotion at all; everything is seated within a
  0.45–2.2 m reach shell.
- Type sized for reading at distance; every interactive target is comfortably
  large at arm's length.
- No colour-only state: memory strength is conveyed by opacity, saturation,
  scale and motion together.
- `prefers-reduced-motion` is respected on the flat-screen UI.

## Privacy

No accounts, no analytics, no network requests. Notes live in `localStorage` on
the device and never leave it.

## Licence

MIT.
