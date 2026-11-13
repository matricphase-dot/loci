# Do this next — 90 minutes

You're past the hard part. The XR session works. What's left is packaging it.

---

## Step 1 — Deploy (15 min)

Open <https://app.netlify.com/drop> → drag the **`dist`** folder from
`D:\games\loci-submission (2)\dist` into the page. You get an HTTPS URL like
`https://calm-otter-9f2a1b.netlify.app`. HTTPS is mandatory — WebXR won't start
on plain HTTP.

Copy that URL into `SUBMISSION.md` §1 (**Try it**).

## Step 2 — Re-check it on the deployed URL (10 min)

1. Open the Netlify URL on your laptop. Press **Play the tour · 35s**. It should
   finish on its own, captions advancing.
2. Now enable IWE **for that netlify.app site** (the toolbar button is per-site —
   this is the thing that bit you before), then `Ctrl+Shift+R`.
3. Status pill → **IMMERSIVE AR READY** → **Enter your palace**.

## Step 3 — Record the XR footage (20 min) ⬅ the money

Start **Win+Alt+R** *before* you enter the session. Then, in one clean take:

| # | Do this | Camera evidence for |
|---|---|---|
| 1 | Look slowly across the room | gaze targeting |
| 2 | Settle the ring on a note — it brightens, ring goes green | hover |
| 3 | **Hold left mouse** (left hand pinch) | hands-first, pinch |
| 4 | Reveal the answer, grade **Good** — watch the card settle and dim | appearance = memory |
| 5 | Curator **"Place one"** → aim at the **wall** → pinch | hit-test |
| 6 | Place another on the **table** — it lies flat | surface orientation |
| 7 | **Exit XR, re-enter** — notes still on the walls | anchors |

Stop. Save as `loci-emulator.mp4`. Trim the dead first/last second.

> Keep both **Hand [L] / Hand [R]** indicators visible. They are the proof that
> nothing here is a controller. Hide everything else in the DevUI.
> If the reticle never goes green, you didn't load a room — that's the one trap.

## Step 4 — Cut the video (30 min)

Follow `VIDEO.md`, section **"The 3-minute edit"**. Order:

- **0:00–0:50** your emulator footage (beats 1–6 above)
- **0:50–1:25** `shots/video/loci-demo-full.mp4` — the flat authoring beat
- **1:25–1:50** back to emulator: full session, seated, completion panel
- **1:50–2:10** dwell-only confirm (no pinch) — Accessibility Forward award
- **2:10–2:50** the schematic + close

Burn this lower third over **every XR frame**:

> **Recorded in Meta's Immersive Web Emulator — real hand tracking, hit-test and
> anchors. Room is simulated.**

Use `shots/video-thumbnail.png` as the YouTube thumbnail. Narration script is at
the bottom of `VIDEO.md` — read it, don't over-produce it.

## Step 5 — Upload + submit (25 min)

- YouTube, **Public** (not unlisted), title
  `LOCI — A Memory Palace for Your Real Room | Meta VR Start 2026`
- Fill the Devpost form from `SUBMISSION.md` §1–§3. Description is **499/500
  words** — paste it verbatim, it's already at the limit.
- **"Anything else you should know"** → paste §3 of `EVIDENCE.md`, the paragraph
  about the `getJointPose` crash. That's the most credible 120 words you have.
- Submit, then open your own submission page and click every link.

---

## Deadline

**19 Nov 2026, 1:30 AM IST.** Today is the 13th. You have margin — spend it on
the recording, not on more features. The build is done.
