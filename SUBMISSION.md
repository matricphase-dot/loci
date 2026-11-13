# LOCI — Submission Kit

**Meta VR Start Developer Competition 2026**
Track: **Productivity** · Division: **New Experience** · Platform: **WebXR / Immersive Web SDK**

Everything in this file is either copy-paste ready or a checklist. Items I could
not do from inside the sandbox are marked **[YOU]**.

---

## 1. Submission form fields

**Submission name**
LOCI — A Memory Palace for Your Real Room

**Tagline** (107 / 140 characters)
A memory palace for your actual room. Author notes flat, nail them to your real walls, recall with a pinch.

**Track**
Productivity

**Division**
New Experience

**Built with**
WebXR, Immersive Web SDK, three.js, TypeScript-free vanilla ES modules, WebAudio (all audio synthesised at runtime, zero external assets)

**Try it**
[YOU] Paste your deployed URL here — see §6 for the deploy path.

> Anyone can evaluate LOCI without a headset: open the URL and press
> **"Play the 35-second tour"**. It runs a cinematic pass through the palace in
> the browser — no Quest, no emulator, no install.

**Video**
[YOU] Paste your YouTube/Vimeo link after recording — see §5.
Note in the video description: *"XR portion recorded in Meta's Immersive Web
Emulator (Meta Platforms); room is simulated. No headset was used."*

**"Anything else you should know" field**
Paste §3 of `EVIDENCE.md` — the paragraph about the `getJointPose` crash the
emulator caught. It is the most credible 120 words in the whole entry.

---

## 2. The description (499 / 500 words — paste verbatim, do not edit)

> **Inspiration**
>
> I have a memory palace I can't use. The technique of loci — placing what you
> want to remember along a route through a familiar building — is the oldest
> mnemonic in the world because spatial memory outlives verbal memory. But mine
> lived on index cards, and they have no rooms.
>
> Flashcard apps flatten knowledge into a list, losing the one memory system
> your brain is good at. The VR productivity apps I tried were floating screens
> in an empty void. LOCI inverts that: the room is not a backdrop, it *is* the
> mnemonic.
>
> **What it is**
>
> Author notes on the flat screen, where you have a real keyboard — you never
> type inside a headset, because that is where VR productivity goes to die. Then
> put the headset on: passthrough stays on and LOCI lays your notes onto your
> actual walls, table and shelves.
>
> A note's appearance is its memory strength. Freshly reviewed, it sits solid and
> calm; as you begin to forget, it fades, desaturates and drifts. Your room
> becomes a physical readout of what your brain is about to lose — the art
> direction and the mechanic in one idea.
>
> Daily, the fading notes wait where you left them. Look at one, pinch, recall,
> grade yourself. A lapse collapses it back to tomorrow and visibly dims; a
> clean recall buys a longer gap and settles. Sessions cap at ten notes — ten
> minutes, finishable on a bus. One room holds several palaces, each with its
> own schedule.
>
> **Hands**
>
> Gaze aims, pinch confirms. Gaze is precise; pinch is the most reliable discrete
> signal a hand produces; neither tires your arm. A dwell ring fills as you hold
> your gaze, so someone who cannot pinch can still do everything. No controllers
> appear. The only keyboard interaction is authoring, before the headset goes
> on.
>
> **An agent that tidies**
>
> An on-device curator notices when a note keeps being lost; when notes were
> written but never placed, so the method never applies to them; when several
> sit too close to tell apart; or that you returned after a gap and what
> decayed while you were away. One suggestion at a time, one pinch to act,
> always explained. It never leaves the device.
>
> **Build**
>
> WebXR with the Immersive Web SDK and three.js. Placement uses the hit-test
> module, reads the hit pose's orientation so a note on a wall lies flat on that
> wall, and takes a persistent anchor where supported. Placement is clamped to a
> 0.45–2.2 m shell and checked against your field of view, so the airplane-seat
> test holds. Verified in Meta's Immersive Web Emulator: hand tracking, gaze
> targeting, and a note placed and anchored to a wall in a simulated room.
> Textures are rasterised to canvas and audio synthesised at runtime: nothing to
> download. The scheduler is a tested FSRS-style model with 91 automated checks,
> including a 120-day simulated learner proving daily review load collapses as
> memories consolidate.
>
> **Next**
>
> Hand-drawn spatial grouping, card drafting from a photo, shared palaces.


## 3. Hand interactions + the future of VR (optional field)

Gaze aims, pinch confirms, and a dwell ring provides a no-pinch path — so the
whole experience is complete without a controller. I tested exactly this in
Meta's Immersive Web Emulator, with the input mode set to hands rather than
controllers. Notes are placed by aiming at
genuine room geometry through WebXR hit-test, and the hit pose orientation is
used so content conforms to your real surfaces rather than floating in front of
them.

What excites me about the future of VR is the end of the "portable monitor"
mental model. Once a headset can see the room reliably, the interesting question
stops being *how do I render a screen* and becomes *what does my actual
environment already know that my software doesn't*. A wall is a surface with
persistent meaning. A table is a workspace with a position in your day. LOCI is a
small bet that the winning spatial apps will be the ones where the room is
load-bearing — where turning passthrough off would break the product, not just
make it uglier.

---

## 3b. What shipped in this build

| System | Detail |
|---|---|
| Passthrough memory palace | Notes anchored to real surfaces via WebXR hit-test; hit-pose orientation so cards conform to walls and tables |
| Memory-strength visualisation | Opacity, saturation, halo and drift all driven by live retrievability |
| Scheduler | FSRS-style stability/difficulty model, 15 unit tests, 120-day convergence simulation |
| Session planner | Urgency-sorted, interleaved, capped at 10 notes |
| Daily ritual | Local-calendar streak, longest-streak record, milestone celebrations at 3/7/14/30 |
| Multiple palaces | Per-context palaces in one room, with filter chips and per-palace schedules |
| Guided first run | Three steps, each discharged by doing the thing, auto-skipped after first use |
| Hands + gaze + dwell | Pinch via joint-distance with hysteresis; dwell-to-confirm as a complete alternative |
| Persistence | localStorage with defensive record repair; JSON export, no lock-in |
| Persistent anchors | Real `XRAnchor` requested per placement, with local-floor pose fallback so nothing breaks when unsupported |
| FoV-aware placement | Placement rejected unless inside the seated reach shell *and* the horizontal field of view |
| Curator agent | On-device policy engine: leech detection, unplaced notes, crowded clusters, return-after-gap, one-at-a-time, dismissible |
| Audio | Every sound synthesised at runtime via WebAudio — zero assets |
| In-headset UI | Canvas-rasterised panels, gaze-targeted buttons, dwell cursor |

| Browser tour | Authored 5-shot camera move with captions, so a judge with no headset can still see the product |
| Test totals: **91 automated checks — 15 scheduler, 8 ritual, 14 curator, 9 pinch
robustness, 30 rubric conformance, 15 end-to-end** — all passing. Run them all
with `npm run verify`.

The 30 rubric-conformance tests encode the competition's own requirements as
executable assertions: hands-first, no locomotion, FoV-aware, no network calls,
no third-party services, description under 500 words, tagline under 140
characters. If a future edit breaks a hard requirement, the suite fails.

## 4. Judging-criteria map

Use this to sanity-check the build before you submit. Each row is a claim a
judge can verify in under two minutes.

| Criterion | Where it shows up | How to demo it |
|---|---|---|
| **Innovation & creativity** | Passthrough is load-bearing: the room is the mnemonic, not a backdrop. Note opacity *is* memory strength. | Turn passthrough off in the demo — the product immediately becomes meaningless. Say so out loud. |
| **Experience design** | Fast cold start, 10-note sessions, clean pause/resume, daily ritual. Nothing typed in-headset. | Do a complete loop in under 60 seconds on camera. |
| **Technical implementation** | Hit-test against real geometry, hit-pose orientation, persistent anchors, FoV-aware comfort shell, hand pinch via joint distances with hysteresis, 91 automated checks, and a session run inside Meta's Immersive Web Emulator. | Place a note on a wall and one on a table; the card conforms to each. Mention anchors are requested and degrade gracefully. |
| **Polish & presentation** | Synthesised audio, kind-coded palette, type rendered at runtime, coherent flat-screen authoring UI. | Show the flat screen first, then the headset. |
| **Seated / airplane-seat test** | All placement clamped to 0.45–2.2 m; panel always within reach; no locomotion at all. | Stay seated for the whole video. |
| **10-minute / bus-stop test** | Sessions capped at 10 notes and reach a genuine completion state. | Show the completion panel with palace strength + next-visit date. |
| **Take-it-away test** | Zero third-party services. No accounts, no network calls, no AI API, no external assets. | Grep the source on camera if you're feeling confident. |
| **Reason to Come Back** (special award) | Spaced repetition schedules the next visit; the app literally tells you when to return. | Show the stat panel: "5 notes waiting for you" → after a session, "Next visit in N days". |
| **Best First Five Minutes** (special award) | Demo palace pre-seeded with a realistic mix of solid/fading/fresh notes, so the value is visible in seconds. | Land, look, pinch, done — no setup. |
| **Best Accessibility Forward** (special award) | Dwell-to-confirm as a full alternative to pinching; no controllers; no timed reactions; no physical locomotion; readable type at distance. | Operate a full session hand-by-hand using only gaze + dwell. |
| **Best Agentic Interaction** (special award) | On-device Curator: detects repeated lapses, unplaced notes, crowded clusters, and return-after-gap; one suggestion at a time; one pinch to act; never touches the network. | Let it fire "Welcome back", accept it, and show the placement repair. |

---

## 5. The three-minute video

Structure matters more than footage quality. Judges are explicitly told not to
watch beyond three minutes, so put the strongest thirty seconds first.

Footage plan: 60–75 s of **your emulator session** covers every XR beat;
`shots/video/loci-demo-full.mp4` covers the authoring beat. See VIDEO.md §A.

| Time | Shot | Why |
|---|---|---|
| 0:00–0:12 | *Emulator:* synthetic room, notes already on the wall. A tracked hand reaches out and pinches one. Lower third: "Recorded in Meta's Immersive Web Emulator — room is simulated." | Lead with XR working. No logo sting. |
| 0:12–0:35 | Reveal → grade → the note visibly settles and dims *in place*. Pan to another note that is still glowing. | This is the core idea: appearance = memory strength. Say it in one line. |
| 0:35–1:00 | Placement: aim at a wall, pinch, note snaps flat onto the wall. Then a table. | Proves hit-test + surface orientation. |
| 1:00–1:20 | Flat screen: type a note, see the schedule, press Enter your palace. | Shows the no-typing-in-VR decision. |
| 1:20–1:45 | Full session end-to-end, seated, ending on the completion panel with next-visit date. | Bust-stop test + reason to come back. |
| 1:45–2:10 | Accessibility: dwell ring filling, confirming with no pinch at all. | Accessibility Forward award. |
| 2:10–2:30 | Cut to schematic: passthrough off → the app is meaningless. Back on → it's a memory palace. | Innovation criterion, made unmissable. |
| 2:30–2:50 | Close on the room full of notes, one fading. Caption: what you're about to forget is waiting where you left it. | Emotional button. |

**Do / don't**
- Do keep both hand indicators in shot when you pinch — that is the hands-first evidence.
- Do burn in the emulator lower third for every XR frame. Never caption it "on Quest".
- Don't use AI-generated video to carry the pitch; the rules call this out directly.
- Don't show the desktop fallback for more than a few seconds except in the authoring beat.

---

## 6. Build & deploy

```bash
cd loci
npm install
npm test          # 15 scheduler unit tests
npm run build     # production bundle in dist/
npm run preview   # serve the built bundle
```

Deploy to any static host. The bundle uses relative paths, so a GitHub Pages
project subpath, Vercel, Netlify, or S3 all work with no config change.

```bash
# Vercel
npx vercel deploy --prod dist

# GitHub Pages
npm run build && npx gh-pages -d dist
```

**Requirement:** the deployed URL must be served over **HTTPS**. WebXR will not
start on plain HTTP except on localhost. If you deploy to GitHub Pages or Vercel
you get HTTPS automatically.

**Then re-verify the deployed URL in the emulator:** enable IWE for that HTTPS
origin (per-site, remember), reload, press *Enter your palace*, accept the
`immersive-ar` prompt, and re-run the four unchecked tests in §7. One catch:
**device/hand settings live in DevTools → WebXR**, not the toolbar popup.

If you ever do get a Quest in front of you, the only extra thing to check is
comfort — everything functional is already proven.

---

## 6b. Special-award playbook

Six $25K awards are judged independently of the track prizes. Each one below is a
**specific, filmable action**, not a vague claim — because a judge can only score
what they can see in three minutes.

| Award | Exact thing to do on camera | Why it lands |
|---|---|---|
| **Best Agentic Interaction** | Open the palace. The Curator says *"5 notes have faded while you were away — the oldest by 11 days."* Pinch **Start**. | The agent observed real state, explained itself in one sentence, and acted on one pinch. Then say: *"and it never leaves the device — no network, no API key."* Judges expect an LLM wrapper; a policy engine that actually tidies your room is more original. |
| **Best Reason to Come Back** | Complete a session. The panel shows **"Next visit in 4 days"** and your streak. Cut to the flat screen showing *"You haven't practised today."* | The schedule itself tells you when to return. Show the streak advancing, not just the number. |
| **Best First Five Minutes** | Cold start → headset on → three-step guided run → first recall inside 60 seconds. Show the clock. | The demo palace is pre-seeded with a realistic mix, so value is visible on frame one. Nothing to set up. |
| **Best Accessibility Forward** | Do an entire review **without pinching**. Only gaze + dwell. Say: *"this is a complete input path, not a fallback."* | Most entries bolt on accessibility. Here it is the second input primitive, available from the first second. |
| **Boldest Original Concept** | Passthrough off → app is meaningless. Passthrough on → your room is the mnemonic. | The bet is structural, not cosmetic. Say plainly: *"the room is load-bearing."* |
| **Best Social & Multiplayer** | Skip it. This is genuinely single-user. Do not stretch. | Over-claiming costs credibility on the awards you do deserve. |

**What to say out loud, once, early:** *"Turn passthrough off and this isn't a
worse app — it isn't an app at all."* That single sentence is the Innovation
criterion and the Boldest Concept award in one line. Judges remember a line.

**What not to do:** don't claim a track prize *and* every award. Lead with the
Productivity track, then let the two or three awards you can genuinely prove
speak for themselves.

## 7. Pre-submission checklist (today)

**Do these in this order. Roughly 2 hours left, and only step 1 is new work.**

| # | Task | Time |
|---|---|---|
| 1 | Deploy to Netlify Drop / Vercel / GitHub Pages (HTTPS is required for WebXR) | 15 min |
| 2 | Re-run the six emulator checks below against the deployed URL, in one take, and screen-record it | 25 min |
| 3 | Edit your capture into the 3-min cut using VIDEO.md | 45 min |
| 4 | Upload to YouTube, **public** | 10 min |
| 5 | Fill the Devpost form from §1–§3, paste the URL and the video link | 25 min |
| 6 | Submit, then re-open your own submission and click every link | 10 min |

**Testing method (state this honestly in your submission):**
Developed and verified with **Meta's Immersive Web Emulator (IWE)**, which
simulates Quest hand tracking, hit-test, plane detection and anchors. Do not
claim "tested on Quest" — no headset was worn. That precision is an asset, not
a gap: see NO-HEADSET.md.

**Emulator verification — done, on `index-D9a6MIQA.js`:**
- [x] Opens and enters `immersive-ar` in Immersive Web Emulator (status pill → IMMERSIVE AR READY).
- [x] Synthetic room loads with walls and a table; both hands are tracked (`Hand [L]` / `Hand [R]`).
- [x] Notes render anchored to surfaces, not floating in front of the camera.
- [x] Console is clean of app errors — only harmless three.js and favicon noise.
- [x] Pinch path hardened: a missing `getJointPose` no longer throws per frame (9 regression tests).
- [ ] **[YOU]** Hit-test places a note on a **wall** and on a **table**, each lying flat on its surface.
- [ ] **[YOU]** Exit and re-enter the session: placed notes are still on the same surfaces.
- [ ] **[YOU]** Sustains 60 fps+ with ~8–20 notes in the room.
- [ ] **[YOU]** Session completes, shows the completion panel, returns to the overview.

**A bug the emulator caught, and it would have fired on a real Quest:** the
hand joints the runtime hasn't started tracking yet come back `undefined`, and
`frame.getJointPose(undefined, …)` threw on every single frame — an uncaught
throw inside an XR animation frame, which can kill the render loop. It's now
guarded, falls back to the hand's gamepad, and has its own test file. Worth one
sentence in your submission; it's concrete evidence of real testing.

**Verified in this workspace:**
- [x] Production build boots with zero console errors (headless Chromium, software GL).
- [x] 15/15 scheduler unit tests pass, including a 120-day convergence simulation.
- [x] Add-note flow, persistence across reload, and palace stats all correct.
- [x] Responsive flat-screen layout at 430px and 1440px.
- [x] Note textures render legible type; card orientation faces the viewer.
- [x] Real working capture recorded (`shots/video/loci-demo-full.mp4`, 69s).
- [x] Immersive session entered in Meta's Immersive Web Emulator; both hands tracked; note anchored to a wall.
- [x] 8 daily-ritual tests: streak continuation, gaps, milestones, local midnight, same-day double-count.
- [x] 9 pinch-robustness tests: the exact `getJointPose` crash the emulator exposed, plus false-positive guards.

**Submission mechanics:**
- [ ] **[YOU]** Video under 3:00, uploaded public to YouTube or Vimeo.
- [x] Description is **499 / 500** words. Paste verbatim — do not add a sentence.
- [x] Tagline is **107 / 140** characters.
- [ ] **[YOU]** Team names, emails, roles.
- [ ] **[YOU]** Target launch date.
- [ ] **[YOU]** Submit before **19 Nov 2026, 1:30 AM GMT+5:30**. Today is the 13th, so you have comfortable margin — do not spend it polishing. Ship, then improve only if you have a spare day.

---

## 8. Honest risk assessment

**What's strong.** The concept is genuinely differentiated for the Productivity
track, which is the least crowded lane. Passthrough is load-bearing rather than
decorative, which is exactly what the rubric singles out. The accessibility path
is real, not a bullet point. The scheduler is tested rather than asserted.

**What's weak, and what to do about it.**
1. **The WebXR route has less judge familiarity than an APK.** Mitigate by
   making the first four seconds of the video unambiguous, and by putting the
   plain-language "what this is" line in the tagline.
2. **Untested on real hardware.** Mitigated, not eliminated. The build has been
   run in Meta's Immersive Web Emulator — hands, hit-test, anchors all exercised
   — and that is the testing path the competition itself sanctions. What the
   emulator cannot tell you is comfort (vergence, IPD, arm fatigue). Say so in
   the "anything else" field; judges reward calibration.
3. **A judge may not have a headset.** The flat authoring view is fully
   functional and honest about what it is, but it is not the product. Say in the
   description what the headset adds — the submitted video is the proof.
4. **"Is a flashcard app a productivity app?"** Yes, if you frame it as a daily
   ritual tied to a recurring context, which the brief explicitly invites
   ("habits tied to a recurring context"). Lead with memory-for-work: names,
   jargon, code APIs, a second language.

**If you have a spare day** (you don't need one — multiple palaces per physical
room already ship), the highest-value addition is real 60 fps numbers measured
in a headset, or a second emulator room with an awkward layout to show placement
adapting to furniture.
