# Setup PR Previews - Action Required

## 🔧 GitHub Pages Configuration Change Needed

The PR preview workflow is ready, but requires a one-time configuration change in your GitHub repository settings.

### Step-by-Step Instructions

1. **Go to Repository Settings**
   - Navigate to: https://github.com/ammarnajjar/planning-poker/settings/pages

2. **Change Pages Source**
   - Under "Build and deployment" section:
   - **Current**: Source = "GitHub Actions" ❌
   - **Required**: Source = "Deploy from a branch" ✅

3. **Select gh-pages Branch**
   - Branch: **gh-pages**
   - Folder: **/ (root)**

4. **Save**
   - Click "Save" button

### Why This Change?

Your current setup uses "GitHub Actions" deployment which:
- ❌ Only allows ONE deployment at a time
- ❌ Replaces the entire site on each deploy
- ❌ Cannot host multiple versions (main + PR previews)

The new setup uses "gh-pages branch" deployment which:
- ✅ Allows multiple deployments in subdirectories
- ✅ Main site at `/` (root)
- ✅ PR previews at `/pr-{number}/`
- ✅ Automatic cleanup when PRs close

### What Happens After the Change?

1. **Main Deployments** (from `main` branch):
   - Deploy to root: `https://ammarnajjar.github.io/planning-poker/`
   - Preserves PR preview directories

2. **PR Deployments** (from PRs):
   - Deploy to: `https://ammarnajjar.github.io/planning-poker/pr-{number}/`
   - Auto-updates on new commits
   - Auto-cleanup on PR close

### Testing After Setup

Once you've changed the GitHub Pages configuration:

1. The current PR (feature/progressive-enhancements) will automatically deploy a preview
2. You'll see a comment on the PR with the preview URL
3. Try it: push a new commit to this PR and watch it update

### Rollback (If Needed)

If you want to revert to the old deployment method:

1. Go to Settings → Pages
2. Change Source back to "GitHub Actions"
3. Delete `.github/workflows/pr-preview.yml`
4. Revert changes to `.github/workflows/deploy.yml`

### Questions?

See the full documentation: [PR_PREVIEW.md](./PR_PREVIEW.md)
