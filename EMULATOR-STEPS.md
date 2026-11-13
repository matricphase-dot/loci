# Immersive Web Emulator — step by step

**Total time: 25–35 minutes.** No headset, no Meta account, no Developer Dashboard.
This is the one test that turns "unverified claim" into "verified build."

You'll need: Chrome or Edge on your laptop, and the `loci` folder.

---

## The one thing that will trip you up

> **The emulator has no real room, so hit-test finds nothing unless you LOAD A
> ROOM FIRST.**

If you skip this, the app will open, the notes will appear, but **pinching at a
wall will do nothing** and you'll think placement is broken. It isn't. Open the
emulator's room, then place.

Write that on a sticky note. It's the difference between "it works" and 40
minutes of confusion.

---

# Phase 1 — Install (5 min)

### Step 1. Install the extension

Chrome: <https://chrome.google.com/webstore/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik>

Edge: <https://microsoftedge.microsoft.com/addons/detail/immersive-web-emulator/hhlkbhldhffpeibcfggfndbkfohndamj>

Click **Add to Chrome**. Published by **Meta Platforms, Inc.** — check that
before installing.

### Step 2. Pin it

Click the puzzle-piece icon in the toolbar → find **Immersive Web Emulator** →
click the pin so it's always visible.

### Step 3. Confirm the version

You want **2.0.0 or later** (July 2026). Click the icon and check the version at
the bottom of the popup.

> IWE 2.0 does **not** switch on automatically for every page — that's a change
> from 1.x. You enable it per site, deliberately. This is normal, not a bug.

---

# Phase 2 — Serve LOCI over HTTP (3 min)

WebXR needs a real origin. Do **not** double-click `index.html`.

**Option A — dev server (recommended; gives you hot reload while testing)**

```bash
cd loci
npm install
npm run dev
```

You get `http://localhost:5173`.

**Option B — built bundle**

```bash
cd loci
npm run build
npm run preview
```

You get `http://localhost:4173`. Use this one to test exactly what you'll deploy.

Leave the terminal running.

---

# Phase 3 — Enable the emulator for the site (2 min)

### Step 4. Open LOCI

Go to `http://localhost:5173` in Chrome. The normal desktop view appears.

### Step 5. Click the IWE toolbar button

The page **reloads** and now has a simulated WebXR runtime plus an in-page
overlay (DevUI) for controlling the fake headset and hands.

### Step 6. Check the emulator panel

If you don't see the overlay, open **DevTools (F12) → WebXR tab**. That's where
persistent settings live:

| Setting | Set it to |
|---|---|
| Device | **Meta Quest 3** |
| Input mode | **Hands** (not controllers) |
| Environment | **Load a room** ← the critical one |

---

# Phase 4 — Enter the session (3 min)

### Step 7. Load a room

In the DevUI / WebXR panel, pick one of the emulator's **synthetic rooms** (a
room with a table and walls). This is what gives hit-test actual surfaces to hit.

### Step 8. Press "Enter your palace in VR"

In the top status bar LOCI should now say **"Immersive AR ready"** instead of
"Desktop preview". Click **Enter your palace in VR**.

### Step 9. Accept

The browser may ask for permission for an immersive session. Accept.

You are now inside.

### Step 10. Run diagnostics — **do this before anything else**

Open the console (F12 → Console) and type:

```js
__LOCI_DIAG__()
```

You should see something like:

```js
{
  webxr: true,
  inSession: true,          ← must be true
  refSpace: "ok",           ← must be "ok"
  hitTest: "ready",         ← must be "ready", not "NOT READY"
  hitNow: true,             ← true when you aim at a surface
  surface: "wall" | "desk",
  hands: 1,                 ← must be 1 (or 2)
  anchorsApi: "available",
  notes: 8,
  anchored: 8,
  fps: 60
}
```

**Copy that whole object and keep it.** If anything says `MISSING`,
`NOT READY`, or `hands: 0`, stop and send it to me — that's exactly the
information needed to fix it.

---

# Phase 5 — Test the six claims (10 min)

Work down this list. Tick each one. This list *is* your submission's technical
evidence.

> **Status on your machine (session of 13 Nov):** the session opens, the
> synthetic room loads, both hands are tracked, and a note renders pinned to a
> wall — so Tests 1 and 2 have effectively passed. What is left is Tests 3–6,
> and they are worth 60 seconds of recording each.

### ☑ Test 1 — Gaze cursor appears
Look around. A small ring should sit in the centre of your view. As you turn, it
stays centred.

### ☑ Test 2 — Notes are on surfaces
You should see notes on the wall and notes lying flat on the table. If a note
looks like it's floating in front of you with no place, that's an unplaced note
(see Test 5).

### ☐ Test 3 — Hover works
Aim the centre ring at a note. It should brighten and the ring should turn
green.

### ☐ Test 4 — Pinch acts
With a note hovered, **pinch**: bring the thumb and index finger together.

In the emulator you can do this two ways:
- Each hand's panel in DevUI has a **Pinch** slider — drag it 0 → 1.
- Or, in Play mode, **hold the left mouse button** to pinch the left hand,
  **right mouse button** for the right hand.

Pinching a note should start a one-card review. **This is the hands-first
requirement passing.**

### ☐ Test 5 — Hit-test placement
1. Press **Place** (or accept the Curator's "place one" suggestion).
2. Aim the ring at the **wall**.
3. The reticle should turn **green** when the surface is in a comfortable spot,
   **orange** when it's out of reach.
4. Pinch.

The note should snap flat onto the wall. Then repeat aimed at the **table** — the
new note should lie flat on the table, not upright.

> If the reticle never turns green: you didn't load a room. Go back to Step 7.

### ☐ Test 6 — Anchors persist
Leave the session (browser back / exit XR). Re-enter. Your placed notes should
still be on the same walls.

> Anchors need the browser to support them. The diagnostic line
> `anchorsApi: "available"` confirms the API is exposed. If placement survives a
> re-entry, you have real persistence.

> **Emulator caveat:** IWE keeps the synthetic room for the tab, but a full page
> reload rebuilds the room and can drop anchors. "Re-enter" means exit XR and
> come back **without** reloading the page. Record it that way, and caption it
> exactly as *"anchors persist across session re-entry"* — which is what you
> actually demonstrated. Don't let the caption claim more than the footage shows.

---

## If something fails

| Symptom | Cause | Fix |
|---|---|---|
| No "Enter your palace in VR" effect | Emulator not enabled for this site | Click the IWE toolbar button again; the page must reload |
| `hitTest: "NOT READY"` | No synthetic room loaded | DevUI → load a room, then re-enter the session |
| Reticle never turns green | Aiming out of the comfort shell, or no surfaces | Load a room; aim within ~2 m at torso height |
| `hands: 0` | Input mode is controllers | DevUI → switch input to **Hands** |
| Pinch does nothing | Pinch slider at 0, or you pinched while not hovering | Hover a note first, then pinch |
| Black screen after entering | GL context lost on a weak GPU | Close other tabs; use a simpler room |
| `inSession: false` after clicking Enter | Session request rejected | Check the browser console for the exact error and send it to me |

---

## Phase 6 — Capture proof (5 min)

While you're in there, record it. This is the footage your submission is missing.

1. Start **OBS** (or macOS `Cmd+Shift+5`, Windows `Win+Alt+R`).
2. Record the emulator window.
3. Perform: look around → hover a note → pinch → reveal → grade → place a note on
   the table.
4. Stop, save as `loci-emulator.mp4`.

Even 60 seconds of this transforms your video from "desktop demo" to "verified
in a Quest-simulated XR session."

Put this lower-third on it in your edit:

> **Recorded in Meta's Immersive Web Emulator — real hand tracking, hit-test and
> anchors. Room is simulated.**

---

## What you can now honestly write

Once the six tests pass, this sentence becomes true — and it is worth a lot in
the Technical Implementation criterion:

> *"Verified in Meta's Immersive Web Emulator: hand-tracking pinch, gaze
> targeting, hit-test placement onto wall and table surfaces with correct
> orientation, and persistent anchors across session re-entry."*

Note what it does **not** say: it doesn't claim a headset. That precision is the
point.

---

## Handy commands while testing

```js
__LOCI_DIAG__()        // full state dump — paste this if anything looks wrong
```

Keyboard (desktop only, ignored while typing):
- `O` — palace overview (where the Curator agent appears)
- `R` — start a review session
- `Esc` — back to lobby

---

## When you're done

Come back and tell me:

1. The `__LOCI_DIAG__()` output from inside the session.
2. Which of the six tests passed and which failed.

If all six pass — you're submission-ready with a verified build. If any fail,
that output tells me exactly what to fix, and I'll fix it.
