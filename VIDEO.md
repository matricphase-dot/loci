# LOCI — Video Package

**No headset is needed for this video.** The competition rules accept capture
from "a Meta VR device, an XR Simulator, or another equivalent emulator" — and
you have Meta's own Immersive Web Emulator running a live session. That is your
device footage.

You have two assets:

1. **`shots/video/loci-demo-full.mp4` (69 s, 1600×900)** — the desktop/authoring
   half, already recorded from the real app. Real scheduler, real notes, real
   review loop.
2. **Your emulator capture** — the XR half: synthetic room, two tracked hands,
   notes pinned to walls, pinch-to-review. Record it in ~10 minutes following
   `EMULATOR-STEPS.md` → Phase 6.

Cut them together in the order in "The 3-minute edit" below. **Open on the
emulator, not the desktop** — judges must see hands-first XR in the first ten
seconds. Most entries in this track will open on a flat web page.

### Label the emulator footage honestly

Burn in this lower third for the whole XR section:

> **Recorded in Meta's Immersive Web Emulator — real hand tracking, hit-test and
> anchors. Room is simulated.**

That one caption converts a possible weakness into evidence of rigour. Never
caption it "on Quest". Precision is the point, and judges check.

---

## Recording the XR footage (emulator — 10 min)

You need **two** capture streams and then a simple edit.

### A. XR view — Immersive Web Emulator (the important one)

The session is already proven working on your machine. Now record it:

1. Serve `dist` (`python -m http.server 5173`), open `http://localhost:5173`,
   enable the emulator on that site, **hard reload**.
2. Press **Win+Alt+R** (or `Win+G` → Capture) *before* you enter the session.
3. Click **Enter your palace**. Once the synthetic room is up, **maximise the tab
   and hide the DevUI panels** so the frame is clean product, not a debugger.
   (Keep the two hand indicators if you can — they are the hands-first evidence.)
4. Perform the six-test sequence in order, slowly, narrating nothing:
   gaze-hover a note → pinch → reveal → grade → **Place one** → wall →
   table → exit → re-enter (anchors). Roughly 60–75 seconds.
5. Stop the recording. Save as `loci-emulator.mp4`.
6. Trim the first and last second, then burn in the lower third above.

If the tab capture is ugly, `Win+G` → Capture the **window**, or use OBS with a
"Window Capture" source on Chrome. 60–75 seconds of clean emulator footage is
plenty; it only needs to cover the 0:00–0:50 and 1:50–2:10 beats below.

### B. Flat-screen authoring view

Already recorded: `shots/video/loci-demo-full.mp4`. Use its authoring section for
the 1:05–1:25 beat. If you'd rather re-shoot it, `Win+Alt+R` while typing a note.

---

## The 3-minute edit

Judges are told not to watch past three minutes. Lead with the product already
working — no logo sting, no talking head.

| Time | Shot | Purpose |
|---|---|---|
| **0:00–0:10** | Headset POV: a real room in passthrough, notes already on the wall. A hand enters frame and pinches one. | Prove hands-first in the first ten seconds. |
| **0:10–0:30** | Reveal → grade "Good". The note visibly **settles and dims in place**. Pan to a neighbour still glowing. | The core idea. Say: *"A note's appearance is its memory strength."* |
| **0:30–0:50** | Placement: gaze at a wall → reticle lands → pinch → note snaps **flat onto the wall**. Repeat on a table. | Hit-test + surface orientation in an unseen room. |
| **0:50–1:05** | Gaze at a specific note and pinch → jumps straight into a one-card review. | Interaction density: the room is the menu. |
| **1:05–1:25** | Cut to desktop: type a note, choose a palace, press **Enter your palace**. | The no-typing-in-VR decision, and it looks like real software. |
| **1:25–1:50** | Full session, seated, no controllers in sight. End on the completion panel: streak + "Next visit in N days". | Bus-stop test + Reason to Come Back. |
| **1:50–2:10** | Accessibility: same session, but confirm **only by dwell** — no pinch at all. | Best Accessibility Forward. |
| **2:10–2:30** | Schematic: passthrough **off** → app is meaningless. Passthrough **on** → it's a memory palace. | The Innovation criterion, made unmissable. |
| **2:30–2:50** | Wide of the room full of notes, one fading. Caption: *"What you're about to forget is waiting where you left it."* | Emotional close. |

**Do:** keep your hands in frame when you pinch — that is the evidence judges want.
**Don't:** use AI-generated video to carry the pitch. The rules call this out directly.

---

## Narration script

Read at a natural pace; each block is roughly the length of its shot.

**0:00–0:30**
> Memory palaces are the oldest memory technique in the world, because spatial
> memory outlasts everything else. But mine lived on index cards, and index cards
> have no rooms. LOCI puts your notes on the walls you already know. And a note's
> appearance is its memory strength — as you start to forget it, it fades.

**0:30–1:05**
> Placement uses real room geometry. Look at a wall, pinch, and the note lies flat
> on that wall. On a table, it lies flat on the table. Not floating in front of
> you — actually on your surfaces. Gaze aims, a pinch confirms, and there is no
> controller anywhere in this.

**1:05–1:50**
> You never type inside a headset, because that is where VR productivity goes to
> die. You author on a flat screen, where you have a real keyboard. Then put the
> headset on, and your palace is already here. A session is ten notes — about ten
> minutes, finishable on a bus ride. And it tells you exactly when to come back.

**1:50–2:30**
> If pinching is hard, you never have to. Hold your gaze and the ring fills as a
> complete alternative. And that is the whole bet: turn passthrough off and LOCI
> isn't a worse app — it's not an app at all. The room isn't decoration. The room
> is the mnemonic.

---

## Upload checklist

- [ ] Export at 1080p, H.264 MP4, under 3:00 exactly.
- [ ] Upload to YouTube (unlisted is risky — use **public**) or Vimeo.
- [ ] Set the video title to `LOCI — A Memory Palace for Your Real Room | Meta VR Start 2026`.
- [ ] Paste the URL into the Devpost submission form.
- [ ] Watch your own video once end-to-end before submitting. Check the audio
      isn't clipping and the first 10 seconds land.
