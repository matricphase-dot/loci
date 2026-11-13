# Evidence — what was actually verified

Paste the "One real bug" paragraph into the Devpost **"Anything else we should
know"** field. Use the checklist to answer follow-up questions without guessing.

---

## 1. Verification environment

| | |
|---|---|
| Runtime | Chrome, desktop, `http://localhost:5173` |
| XR rig | **Meta Immersive Web Emulator 2.0** (Meta Platforms, Chrome Web Store, 9 Jul 2026) |
| Emulated device | Meta Quest 3, input mode **Hands** |
| Environment | IWE synthetic room (walls, floor, table) |
| Session type | `immersive-ar` — passthrough, no locomotion |
| Headset used | **None.** No Quest hardware was worn at any point. |

## 2. What the session demonstrated

- [x] `immersive-ar` session requested and entered; app status pill flipped to **IMMERSIVE AR READY**
- [x] Synthetic room geometry loaded; hit-test sources present
- [x] **Both hands tracked** — `Hand [L]` and `Hand [R]` reporting position, rotation and pinch
- [x] Notes rendered pinned to a wall surface, not billboarded to the camera
- [x] Gaze cursor active at screen centre; hover highlight reached
- [x] Persistent anchor API reported `available` in `__LOCI_DIAG__()`
- [x] Console clean after the fix — only benign three.js duplicate-import warning and a favicon 404
- [ ] Wall + table placement recorded on video *(in progress — see VIDEO.md)*
- [ ] Anchors across re-entry recorded on video *(in progress)*

## 3. The one real bug it found

> The emulator exposed a crash that a headset would have hit too. `XRHand.get()`
> returns `undefined` for any joint the runtime hasn't begun tracking yet, and
> my pinch detector passed that straight into `frame.getJointPose()`. The result
> was a `TypeError` on **every animation frame**. An uncaught throw inside an XR
> frame callback can end the render loop, so the failure mode was not "pinch
> feels flaky" — it was "the palace freezes the first time you raise a hand".
>
> The fix guards the joint lookup, falls back to the hand's emulated gamepad
> button state, and wraps the per-frame spatial and input updates so a single
> bad frame can never take down the loop. I then wrote nine regression tests
> that reproduce the crash — undefined joints, a missing `getJointPose`, a
> method that throws, an empty session, a malformed source — plus tests proving
> a real pinch still registers and that a close-but-not-touching hand does not
> false-positive. The suite went from 82 to 91 checks.

## 4. Automated suite — 91 checks, all passing

```
Scheduler engine      15   FSRS-style stability/difficulty, 120-day convergence simulation
Daily ritual           8   streak continuation, gaps, milestones, local midnight, double-count
Curator agent         14   leech, unplaced, crowding, return-after-gap, one-at-a-time
Pinch robustness       9   reproduces the emulator crash; asserts no-throw + correct detection
Rubric conformance    30   the competition's own requirements as executable assertions
Production build       ✓   vite build, zero errors
End-to-end           15/15 browser-driven: author → place → review → persist → reload
Browser tour           ✓   35s cinematic pass completes and tears itself down
Production bundle      ✓   built dist/ boots with no console errors
```

Run them: `npm run verify`

## 5. What I am *not* claiming

- Not "tested on Quest". No headset was involved.
- Not stereoscopic comfort validation — IWE cannot assess vergence or IPD comfort.
- Not real-room lighting estimation — IWE does not simulate it, and LOCI does not
  rely on it; all materials are unlit.
- Anchors were verified as *requested, granted and restored across session
  re-entry within the tab*. Cross-reload persistence on a real device is
  expected but was not demonstrated here, and I say so.

Stating the limit is the point: a judge who catches an overclaim discounts
everything else in the entry.
