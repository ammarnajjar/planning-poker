# Deployment

---

## Hosting

The app is hosted on GitHub Pages and deployed automatically on every push to `main`.

**URL pattern**: `https://<username>.github.io/<repo-name>/`

---

## One-time repository setup

### 1. Set the base href

In `package.json`, update the production build script to match your repository name:

```json
"build:prod": "ng build --configuration production --base-href /YOUR-REPO-NAME/"
```

### 2. Add Supabase secrets

In your GitHub repository go to **Settings → Secrets and variables → Actions** and add:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

These are injected into the Angular environment files at build time.

### 3. Enable GitHub Pages

In **Settings → Pages**, set the source to **GitHub Actions**.

---

## Automatic deployments

Every push to `main`:

1. **`ci.yml`** runs lint, unit tests, and a production build in parallel (all share one cached `npm install`).
2. **`deploy.yml`** triggers after `ci.yml` succeeds (or manually via workflow dispatch).
   - Checks out code
   - Injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into environment files
   - Runs `npm run build:prod`
   - Publishes `dist/planning-poker/browser/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`

---

## CI pipeline detail

```
push → main  (or pull_request → main)
         │
         └── ci.yml
               ├── setup job
               │     ├── npm ci
               │     ├── write environment files (placeholder credentials in CI)
               │     └── cache node_modules + environment files
               │
               ├── lint job      (needs: setup)  → npm run lint
               ├── test job      (needs: setup)  → npm test
               └── build job     (needs: setup)  → npm run build:prod
```

All three downstream jobs run in parallel; each restores from the shared cache.

---

## PR preview deployments

`pr-preview.yml` builds a preview for each pull request and deploys it to a sub-path of the `gh-pages` branch (e.g. `/pr-123/`). Previews are cleaned up automatically when the PR is closed.

---

## Manual deployment

1. Go to the **Actions** tab in GitHub.
2. Select **Deploy to GitHub Pages**.
3. Click **Run workflow** → `main`.

---

## Custom domain (optional)

1. Add a `CNAME` file to `src/` containing your domain (e.g. `poker.example.com`).
2. Add the `CNAME` to the `assets` array in `angular.json` so it is copied to `dist/`.
3. Configure DNS: add a CNAME record pointing to `<username>.github.io`.
4. In **Settings → Pages**, add the custom domain and enable HTTPS.

---

## Production checklist

- [ ] `--base-href` in `package.json` matches repo name
- [ ] `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets set
- [ ] GitHub Pages source set to GitHub Actions
- [ ] App loads without console errors
- [ ] Real-time sync works across two browser windows
- [ ] Mobile layout is correct
- [ ] Average calculation is correct
- [ ] Reset functionality works
