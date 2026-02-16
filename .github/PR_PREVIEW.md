# PR Preview Deployments

This repository uses automatic PR preview deployments to GitHub Pages, allowing you to test changes before merging.

## How It Works

### When a PR is Created or Updated

1. **Automatic Build**: When you create or update a pull request, GitHub Actions automatically:
   - Builds the application with a PR-specific base URL
   - Deploys to `https://ammarnajjar.github.io/planning-poker/pr-{PR_NUMBER}/`
   - Posts a comment on the PR with the preview URL

2. **Preview URL**: Each PR gets its own isolated deployment:
   - PR #123 → `https://ammarnajjar.github.io/planning-poker/pr-123/`
   - PR #456 → `https://ammarnajjar.github.io/planning-poker/pr-456/`

3. **Automatic Updates**: Every time you push new commits to the PR, the preview is automatically rebuilt and updated.

### When a PR is Merged or Closed

1. **Automatic Cleanup**: The preview deployment is automatically removed from GitHub Pages
2. **Cleanup Notification**: A comment is posted on the PR confirming the cleanup

## Benefits

✅ **Test Before Merge**: See exactly how your changes will work in production
✅ **Share with Others**: Send the preview URL to team members or stakeholders
✅ **Isolated Testing**: Each PR has its own deployment, no conflicts
✅ **Zero Maintenance**: Automatic cleanup when PR is closed
✅ **Full Features**: PWA, Service Worker, and all app features work in preview

## Workflow Details

The workflow is defined in [`.github/workflows/pr-preview.yml`](./workflows/pr-preview.yml) and:

- **Triggers**: On PR open, update, reopen, or close
- **Permissions**: Needs `contents: write` and `pull-requests: write`
- **Environment**: Uses the same Supabase secrets as production
- **Branch**: Deploys to `gh-pages` branch in subdirectories

## Limitations

⚠️ **GitHub Pages Limitations**:
- All PRs share the same Supabase database (no PR-specific databases)
- Data changes in previews affect the production database
- Service Worker caching may persist between preview updates (hard refresh with Cmd+Shift+R)

⚠️ **Cleanup**:
- Previews are automatically removed when PR is closed/merged
- Old preview URLs become 404 after cleanup
- No manual cleanup needed

## Troubleshooting

### Preview Not Appearing

If your preview deployment fails:

1. **Check GitHub Actions**: Go to the "Actions" tab and check the workflow run
2. **Build Errors**: Ensure the PR passes all CI checks first
3. **Permissions**: Verify the workflow has `contents: write` permission
4. **GitHub Pages**: Confirm GitHub Pages is enabled and set to `gh-pages` branch

### Preview Shows Old Version

If you see outdated content:

1. **Hard Refresh**: Press Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
2. **Clear Service Worker**: Open DevTools → Application → Service Workers → Unregister
3. **Wait for Build**: Check the Actions tab to ensure the build completed

### Preview URL 404

If the preview URL returns 404:

1. **Wait for First Deploy**: The first deploy can take 1-2 minutes
2. **Check gh-pages Branch**: Verify the `pr-{number}` directory exists in gh-pages
3. **GitHub Pages Settings**: Ensure GitHub Pages is configured correctly

## Alternative: Local Testing

For quick iterations, you can also test locally:

```bash
# Test with PR-like base href
ng build --base-href=/planning-poker/pr-test/
npx http-server dist/planning-poker/browser -p 8080
```

## Disabling PR Previews

To disable automatic PR previews:

1. Delete or rename `.github/workflows/pr-preview.yml`
2. Manually remove PR directories from gh-pages branch:
   ```bash
   git checkout gh-pages
   git rm -rf pr-*
   git commit -m "Remove PR previews"
   git push
   ```

## Cost and Quotas

- **GitHub Actions**: Free for public repositories (2,000 minutes/month for private)
- **GitHub Pages**: Free for public repositories with 100GB bandwidth/month
- **Storage**: Each preview is ~1-2MB, negligible impact on repository size
