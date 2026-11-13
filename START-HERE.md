# START HERE → submit

Everything is built, tested, packaged — **and now verified in a real XR session**.
What remains is your accounts, a 10-minute screen recording, and the form.

| File | What it is | Action |
|---|---|---|
| **NEXT.md** | **The 90-minute hit list**, step by step, in order | Start here |
| **EVIDENCE.md** | What was verified, the bug IWE found, and what I am *not* claiming | Paste §3 into Devpost |
| **SUBMISSION.md** | Devpost form fields, copy-paste ready. Description **498/500** words, tagline **107/140** chars. Includes the special-award playbook. | Copy into the form |
| **VIDEO.md** | The 3-minute cut, now built around your emulator footage | Follow it |
| **DEPLOY-GITHUB.md** | **Your pick:** GitHub repo, then a live Pages URL that rebuilds and retests on every push | Do this first |
| **DEPLOY.md** | The same in three flavours, plus the post-deploy checks | Reference |
| **EMULATOR-STEPS.md** | The IWE walkthrough you already worked through — keep it for re-runs | Reference |
| **NO-HEADSET.md** | Why no headset is fine, and what the emulator can and can't prove | Read |
| **shots/emulator-session.png** | **Proof shot: live immersive session, hands tracked, note on a wall** | Devpost gallery |
| **shots/emulator-bug-found.png** | The console error IWE surfaced — your "we really tested this" receipt | Optional |
| **shots/video/loci-demo-full.mp4** | 69s demo of the real app. Under the 3-min limit. | Edit into the cut |
| **shots/** | 10 images: UI, palace, agent, 4 cinematic tour frames | Devpost gallery |
| **loci-submission.zip** | Complete package incl. built `dist/` — drag straight into Netlify Drop | Backup |

---

## The 5 steps that actually matter

```
0. Emulator verification  ✓ DONE — session entered, hands tracked, note placed on a wall
1. Deploy
2. Verify the deployed URL
3. Record 60s of emulator footage + cut the video
4. Upload it public, fill the form
5. Submit
```

0. **Emulator test — done.** You entered `immersive-ar` in Meta's Immersive Web
   Emulator, got a synthetic room, two tracked hands, and a note pinned to a
   wall. The one real bug it exposed (`getJointPose` on untracked joints) is
   fixed and now has 9 regression tests. Details in SUBMISSION.md §7.
1. **Deploy to GitHub Pages** — push the repo, then Settings → Pages → Source:
   **GitHub Actions**. `.github/workflows/deploy.yml` tests, builds and publishes
   on every push, so you get `https://<you>.github.io/loci/` plus a commit
   history. Full walkthrough in `DEPLOY-GITHUB.md`.
2. **Verify** — open that URL on your laptop. Page loads, press **Play the tour · 35s**,
   captions advance, it finishes on its own. If that passes, the deploy is good.
3. **Record the XR footage** — 60–75 seconds of the emulator session, per VIDEO.md
   §A. Then cut it with `loci-demo-full.mp4`.
4. **Upload the video** to YouTube — set it **Public**, not unlisted.
5. **Fill the form** from SUBMISSION.md §1–§3, submit, then click every link.

Roughly **90 minutes**, and none of it needs a headset.

---

## Your unfair advantage: most judges have no headset either

If the only way to understand LOCI is to put on a Quest, most people scoring it
see a black rectangle. So the browser **is** a screening room:

There is a built-in **35-second cinematic tour** — five captioned camera shots
through the palace, no input required, ending on its own. Anyone can evaluate
the product from a link, on any laptop. Most entries will not have this. Then,
underneath it, one screenshot proves the XR half is real.

Say it in your submission: *"No headset? Press Play the tour."*

---

## Verified in this workspace

```
✓ Scheduler engine      15 passed
✓ Daily ritual           8 passed
✓ Curator agent         14 passed
✓ Pinch robustness       9 passed   ← written from the emulator session
✓ Rubric conformance    30 passed
✓ Production build      ✓
✓ End-to-end            15/15
✓ Browser tour          ✓
✓ Production bundle     ✓
                        ─────────
                        91 checks
```

Plus, on your machine: Immersive Web Emulator 2.0 attached to the dev server,
`immersive-ar` session entered, synthetic room + both hands tracked, note pinned
to a wall, status pill **IMMERSIVE AR READY**.
