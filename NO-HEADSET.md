# You don't have a headset. That's fine.

**The competition FAQ says so explicitly:**

> **"Do I have to have a headset to compete in the competition?"**
> **"No, you are not required to own a Meta Quest headset to compete in the Meta
> VR Start Developer Competition."**

And the submission rules accept footage from *"a Meta VR device, **via XR
Simulator, or another equivalent emulator**."*

So you can complete this entry end to end on a laptop. Here is exactly how.

---

## The tool: Immersive Web Emulator (by Meta)

Meta ships a browser extension that simulates Quest headsets in desktop Chrome.
Version 2.0 (July 2026) supports **everything LOCI needs**:

- `immersive-ar` sessions (so passthrough mode)
- **hand tracking with pinch input** ← the core gesture
- **hit test** and **plane detection** ← how notes find your surfaces
- **anchors** ← persistence
- synthetic MR environment data
- controller simulation, if you want it

**Install:** Chrome Web Store → search *Immersive Web Emulator* → published by **Meta**.
(`cgffilbpcibhmcfbgggfhfolhkfbhmik`) Requires Chrome 116+.

### How to run LOCI inside it

1. Deploy LOCI (or run `npm run dev` locally at `http://localhost:5173`).
2. Pin the **Immersive Web Emulator** button to your toolbar.
3. Open the LOCI URL.
4. **Click the IWE toolbar button** to enable emulation for that site — the page
   reloads with a simulated Quest runtime. (v2.0 is opt-in per site; it no longer
   activates automatically.)
5. Open DevTools → **WebXR** tab to set device, FOV, and hands-vs-controllers.
6. Press **Enter your palace** in LOCI. You are now in a simulated immersive-ar
   session.
7. Use the **in-page overlay** to move the simulated head and hands, and to
   trigger a **pinch**.

An alternative if extensions are blocked where you work: **IWER** (Meta's
Immersive Web Emulation Runtime) can be scripted directly, and there is a
standalone desktop app called **XR View** built on it.

---

## What the emulator proves — and what it doesn't

Be honest about this in your submission. It protects your credibility.

| Requirement | Emulator | Notes |
|---|---|---|
| Hands-first, pinch to act | ✅ Proves it | Real `XRHand` joint poses, real thresholds |
| Gaze + dwell alternative | ✅ Proves it | Pure maths, no hardware |
| Hit-test placement | ✅ Proves the logic | Synthetic planes, not your actual room |
| Surface orientation | ✅ Proves the maths | Notes lie flat on staged planes |
| Anchors requested | ✅ Proves the call | Notes survive exit-and-re-enter within the tab; a real sleep/relaunch is untested |
| Fills a real room | ❌ Cannot prove | Only a Quest can |
| 60 fps on Quest hardware | ❌ Cannot prove | Emulator runs on your GPU |
| Feels good while seated | ❌ Cannot prove | Needs a human in a headset |

**Do not write "tested on Quest" anywhere.** Write what is true: *"Developed and
verified with Meta's Immersive Web Emulator (IWE), which simulates Quest hand
tracking, hit-test and anchors."* This build has now actually been through that
session — session entry, both hands tracked, a note pinned to a wall, a crash
found and fixed. Judges respect a precise claim far more than a
vague one they suspect.

---

## Your video, without a headset

This is the part people get wrong. Emulator footage of floating notes over a dark
void looks like an unfinished prototype — and would undersell LOCI badly.

**So I built you a stage.** `src/xr/stage.js` renders a quiet, stylised room
(floor, two walls, a table, a shelf, a window) whenever there is no passthrough
to draw on. It is deliberately abstract so it never pretends to be camera
footage, but it gives the notes **real surfaces to sit on** — a wall cluster and
notes lying flat on a table. That is the entire premise of the product, made
visible.

You can capture a genuinely representative demo today:

1. Enter immersive-ar in the emulator, using IWE's **mixed reality environment**.
2. Record the emulator window (OBS, or macOS `Cmd+Shift+5`).
3. Use the overlay to move the simulated head and pinch a note.
4. Follow the shot list in **VIDEO.md**, minus the "real room" beats.

### The honest framing that makes emulator footage an asset

Put a lower-third on screen for the first five seconds:

> **"Recorded in Meta's Immersive Web Emulator — real hand tracking, hit-test and
> anchors. The room is a stand-in."**

Judges see dozens of submissions pretending to be more than they are. Stating
your method plainly, up front, reads as confidence. It also removes the only
question they would otherwise hold against you.

---

## The free way to get a real room in the video

You live in Mumbai. Before you buy anything, try this — genuinely, it works:

**Meta Quest demo units.** Many large electronics retailers and VR arcades keep
a Quest on display. Some Meta Start community events and developer meetups have
units. Ask in the Meta Developer Forum or the competition's Discussions tab
whether anyone near Mumbai can spare 30 minutes. The WebXR community is small and
unusually helpful.

**You need about 3 minutes of headset time**, not ownership:

1. Open your deployed LOCI URL in Quest Browser.
2. Accept the immersive-ar prompt.
3. Perform the shot list.
4. Have the person cast to a phone or record via `adb`.

That is it. If you can get that, your submission goes from "very good emulator
entry" to "indistinguishable from a studio entry."

**Do not buy a headset for this.** The prize is not guaranteed, and a ₹35,000
purchase to improve one video is a bad trade.

---

## What actually changed in the build for you

Because you have no headset, I hardened the parts you *can* verify:

- **A real staged room** replaces the old wireframe grid, so screenshots and
  emulator capture look designed rather than empty. (`src/xr/stage.js`)
- **The demo palace now has surface anchors** — five notes on the wall, three
  lying flat on the table — so the app demonstrates its core claim on first
  frame, before you touch anything.
- **Camera reframed** to seated eye height about two metres from the wall, so
  every capture matches the framing the product assumes in-headset.
- **Keyboard shortcuts for capture:** `O` overview, `R` review, `Esc` lobby.
  Makes recording a clean take far easier.

Run `npm run verify` and all 80 checks still pass.

---

## Revised timeline (no headset)

| # | Task | Time |
|---|---|---|
| 1 | Install Immersive Web Emulator, deploy LOCI | 20 min |
| 2 | Click through the full flow in the emulator; fix anything that breaks | 45 min |
| 3 | Record emulator footage with OBS, one clean take | 40 min |
| 4 | Edit to VIDEO.md shot list, add the method lower-third | 60 min |
| 5 | Upload to YouTube, **public** | 10 min |
| 6 | Fill the Devpost form from SUBMISSION.md | 25 min |
| 7 | Optional: borrow a Quest for 3 minutes and reshoot the room beats | 1–2 hrs |
| 8 | Submit | 10 min |

Steps 1–6 and 8 are all you strictly need. Step 7 is upside, not a requirement.
