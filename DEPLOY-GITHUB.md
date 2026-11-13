# Deploy from GitHub (and keep editing later)

**Your repo:** <https://github.com/matricphase-dot/loci> — already created and empty.
**Your live URL will be:** <https://matricphase-dot.github.io/loci/>
**Your exact commands:** see "Your commands, copy-paste" below.

**Yes — GitHub is the better choice for you.** Netlify Drop gives you a URL but
no history; every change means re-dragging a folder. GitHub gives you a live
site that **rebuilds and retests itself on every push**, so "make a change
later" becomes one `git push`.

This repo is already wired for it: `.github/workflows/deploy.yml` runs the unit
tests, builds, and publishes to GitHub Pages.

---

## One-time setup (5 minutes)

### 1. Create the empty repo

<https://github.com/new> → name it `loci` → **Public** → do **not** add a
README, .gitignore or licence (you already have them) → Create.

> **Public matters twice:** GitHub Pages needs it on free accounts, and a
> public repo beside a live link reads well to judges. This repo contains no
> secrets — grep it yourself: no API keys, no accounts, no network calls.

### 2. Push from your machine  ← your commands

First, get the right folder into place. **Do not push `dist` on its own** — the
`dist` folder inside the zip is not a repo, and pushing it would give you a page
with no source and no workflow.

```powershell
# fresh folder, so nothing stale can sneak in
Remove-Item -Recurse -Force "D:\games\loci-git" -ErrorAction SilentlyContinue
Expand-Archive -Path "D:\games\loci-submission.zip" -DestinationPath "D:\games\loci-git"
cd "D:\games\loci-git"

# sanity check: both of these must exist
Test-Path package.json                       # True
Test-Path .github\workflows\deploy.yml      # True
```

Now the six commands:

```powershell
git init
git add .
git commit -m "LOCI - a memory palace for your real room"
git branch -M main
git remote add origin https://github.com/matricphase-dot/loci.git
git push -u origin main
```

If git complains it doesn't know who you are, run these once first:

```powershell
git config --global user.name "matricphase-dot"
git config --global user.email "matricphase-dot@users.noreply.github.com"
```

**Or do it in one line** (the zip now contains `push.ps1`, which runs all six,
sets the identity, and refuses to run if you're in the wrong directory):

```powershell
.\push.ps1
```

A browser window will ask you to sign in to GitHub the first time. Use
**matricphase-dot**. If it asks for a password, use a **personal access token**
(GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
→ repo scope), not your account password — GitHub stopped accepting passwords
for git in 2021.

### 3. Turn on Pages — this is the step people miss

Repo → **Settings** → **Pages** → **Source: GitHub Actions** (not "Deploy from a
branch"). Save.

Nothing deploys until you do this. The first run appears under the **Actions**
tab; it takes about 90 seconds.

### 4. Your live URL

```
https://matricphase-dot.github.io/loci/
```

That is a **project subpath**, and the build already uses relative asset paths
(`base: './'`), so it works — this is the case that normally breaks WebXR builds,
and it's been verified in this workspace from `/loci-app/`.

---

## Every change after that

```powershell
cd "D:\games\loci-submission (2)"
git add .
git commit -m "fix: whatever you changed"
git push
```

The Action reruns the tests, rebuilds, and redeploys. Two minutes, no dragging.

> If the tests fail, the deploy does **not** happen — you keep the last good
> version live. That's the whole reason to use this over a drag-and-drop.

---

## The one thing that catches everyone

**GitHub Pages serves HTTPS, which WebXR requires — good. But the emulator is
per-site.** After the first deploy, open the Pages URL, click the Immersive Web
Emulator toolbar button **on that tab**, then `Ctrl+Shift+R`. The status pill
must read **IMMERSIVE AR READY** before you enter the session.

And remember: a new domain is a new `localStorage` origin, so your local notes
won't appear. The demo palace seeds itself on first run — that's expected.

---

## If you'd rather keep the Netlify URL

Both can exist at once. GitHub Pages is your source of truth and history;
Netlify is a spare link. They serve the same build, so nothing conflicts.
