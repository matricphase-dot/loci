# Deploy LOCI in 10 minutes

You need **HTTPS**. WebXR refuses to start on plain HTTP (except localhost).
Both options below give you HTTPS automatically and are free.

Verified in this repo: the production bundle works from a **subdirectory**
(`/loci-app/`), so a GitHub Pages *project* site is fine — that is the case
which normally breaks WebXR builds.

---

## Option A — Netlify Drop (fastest, no account needed to try)

1. Run `npm run build` in the project folder.
2. Open <https://app.netlify.com/drop>.
3. Drag the **`dist`** folder onto the page.
4. You get an HTTPS URL immediately, like `https://quiet-loci-1a2b3c.netlify.app`.

That URL works on Quest Browser and in the emulator straight away. Sign in
afterwards if you want to keep it permanently.

**This is the one I'd use today.** No CLI, no account, no config, ~2 minutes.

---

## Option B — Vercel (better if you'll iterate)

```bash
npm install -g vercel
npm run build
vercel deploy --prod dist
```

Paste the printed `https://….vercel.app` URL into the Devpost form.

---

## Option C — GitHub Pages + auto-deploy on every push ⭐ recommended

**Full walkthrough: `DEPLOY-GITHUB.md`.** The repo ships with
`.github/workflows/deploy.yml`, which runs the unit tests, builds, and publishes
to Pages on every push to `main`. Short version below.

Judges often like seeing the repo, and a public repo alongside a live link reads
well. The build already uses relative asset paths, so a project subpath works.

```bash
# from the project root
git init
git add .
git commit -m "LOCI — a memory palace for your real room"

# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/loci.git
git branch -M main
git push -u origin main
```

Then, **once**: repo → Settings → Pages → Source = **GitHub Actions**.
`.github/workflows/deploy.yml` does the rest — tests, build, deploy — on every
push. No `gh-pages` branch, no manual `npm run build` before pushing.

Your URL will be `https://<you>.github.io/loci/`.

> **Important:** `vite.config.js` sets `base: './'`. Do **not** change it to an
> absolute path — relative is what makes the subdirectory deploy work.

---

## After deploying — verify in 60 seconds

Open the URL on your laptop first, **not** the headset:

1. Page loads, you see the notes in a staged room. ✅
2. Press **"▶ Play the 60-second tour"**. Captions should advance through five
   shots and it should finish on its own in ~33 seconds. ✅
3. Add a note in the left rail. It should appear in the list. ✅

If all three pass, the deployment is good. Then open the same URL:

- **On Quest:** press *"Enter your palace in VR"* → accept the immersive-ar prompt.
- **In the emulator:** enable IWE for the site first, then press the same button.

---

## Do not do this

- ❌ Don't open `index.html` by double-clicking it from your filesystem. ES
  modules are blocked on `file://` and you'll get a blank page. Serve it.
- ❌ Don't deploy only the `index.html` — it needs the `assets/` folder beside it.
- ❌ Don't use `http://` for the submitted link. WebXR will silently fail and a
  judge will score a broken build.

---

## What to paste into Devpost

```
Live demo:   https://<your-url>
Source:      https://github.com/<you>/loci        (optional but recommended)
Video:       https://youtu.be/<your-video-id>
```

Add one line to the description if you like:

> No headset? Open the live link and press **Play the 60-second tour** — it runs
> the palace in the browser, no hardware required.

---

## After you deploy — the 3-minute check

Do all three before you put the URL on Devpost:

1. **Flat screen:** open the URL, press **Play the tour · 35s**. It must finish
   on its own. If the tour works, the bundle, the assets and the paths are all
   correct.
2. **Emulator on the live URL:** click the IWE toolbar button **on that
   netlify.app tab** (it's per-site — this is the trap), `Ctrl+Shift+R`, then
   check the status pill reads **IMMERSIVE AR READY**. Enter the session and
   place one note.
3. **HTTPS, not http:** look at the address bar. If it says `http://`, WebXR will
   silently refuse to start and you'll waste an hour blaming the build.

Then paste the URL into `SUBMISSION.md` §1 (**Try it**) and into Devpost.

### Common post-deploy failures

| Symptom | Cause | Fix |
|---|---|---|
| Blank white page | Dragged the project folder, not `dist` | Drag **`dist`** itself |
| Tour runs but no notes | Notes live in `localStorage` per-origin; a new domain is a fresh install | Expected — the demo palace seeds itself on first run |
| "Enter your palace" does nothing | Not HTTPS, or emulator not enabled **for this site** | Check scheme; re-enable IWE, reload |
| 404 on `./assets/…` | You dragged `dist` *into* a subfolder on an existing site | Netlify Drop should host `dist` as the site root |
