# Deployment Guide

The app is a fully static site. There is no server. All data is pre-fetched at build time by a GitHub Action and baked into `public/data.json`. Users load that single file — no API calls happen in their browser.

---

## 1. Create the GitHub repository

```bash
git init
git add .
git commit -m "Initial commit"

# Create the repo on GitHub (replace with your username/repo name)
gh repo create your-username/npm-visualizer --public --source=. --push
```

Or create the repo manually on github.com and push:

```bash
git remote add origin https://github.com/your-username/npm-visualizer.git
git push -u origin main
```

---

## 2. Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Save

That's it. The workflow handles everything else.

---

## 3. Trigger the first deployment

The workflow runs automatically on every push to `main`. Your initial push in step 1 will trigger it.

You can also trigger it manually:
- Go to **Actions** → **Fetch data & deploy to GitHub Pages** → **Run workflow**

The workflow will:
1. Fetch download stats from the npm API (last 18 months)
2. Fetch package metadata from the npm registry
3. Fetch GitHub star counts (authenticated via the built-in `GITHUB_TOKEN` — no setup needed)
4. Write everything to `public/data.json`
5. Build the Vite app
6. Deploy to `https://your-username.github.io/npm-visualizer/`

First deploy takes ~1 minute. After that it auto-refreshes every 6 hours.

---

## 4. Customise the packages

Edit one file:

```ts
// src/constants/packages.ts
export const PACKAGES = [
  '@your-org/package-one',
  '@your-org/package-two',
  // ...
] as const;
```

Commit and push — the Action will re-fetch and redeploy automatically.

---

## Local development

To see real data locally, run the fetch script first:

```bash
bun run fetch-data   # writes public/data.json
bun run dev          # starts at http://localhost:5173
```

Without running `fetch-data`, the app loads with empty data (skeletons).

---

## How it works

| Step | Where |
|------|-------|
| Package list | `src/constants/packages.ts` |
| Data fetch script | `scripts/fetch-data.ts` |
| GitHub Actions workflow | `.github/workflows/deploy.yml` |
| Data refresh schedule | Every 6 hours (cron `0 */6 * * *`) |
| Data served from | `public/data.json` → `dist/data.json` |
| GitHub API auth | Auto via `secrets.GITHUB_TOKEN` (built-in, no setup) |
