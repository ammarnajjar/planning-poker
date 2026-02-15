# Deployment Checklist for GitHub Pages

Follow these steps to deploy your Planning Poker app to GitHub Pages:

## Pre-Deployment

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```

- [ ] **Test Locally**
  ```bash
  npm start
  ```
  Open `http://localhost:4200` and test the app

- [ ] **Update package.json**
  Change `/planning-poker/` to your actual repository name:
  ```json
  "build:prod": "ng build --configuration production --base-href /YOUR-REPO-NAME/"
  ```

## GitHub Repository Setup

- [ ] **Create GitHub Repository**
  ```bash
  git init
  git add .
  git commit -m "Initial commit: Planning Poker app"
  git branch -M main
  git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
  git push -u origin main
  ```

## Enable GitHub Pages

- [ ] **Configure GitHub Pages**
  1. Go to your repository on GitHub
  2. Click **Settings** → **Pages**
  3. Under **Build and deployment**
  4. Set **Source** to: **GitHub Actions**

## Verify Deployment

- [ ] **Check GitHub Actions**
  1. Go to the **Actions** tab in your repository
  2. Watch the "Deploy to GitHub Pages" workflow
  3. Ensure it completes successfully (green checkmark)

- [ ] **Access Your Site**
  - Your site will be available at: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`
  - Wait 1-2 minutes after the workflow completes

## Test Production App

- [ ] **Test All Features**
  - [ ] Create a room
  - [ ] Copy Room ID
  - [ ] Open in a new browser/incognito window
  - [ ] Join the room with the Room ID
  - [ ] Vote in both windows
  - [ ] Reveal votes
  - [ ] Check average calculation
  - [ ] Reset votes
  - [ ] Test on mobile device

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build:prod
```

### 404 Error on GitHub Pages
- Check that base-href matches your repository name exactly
- Verify `.nojekyll` file is in the output
- Wait a few minutes for DNS propagation

### Supabase Not Syncing
- Check browser console for errors
- Verify internet connection
- Try refreshing both browser windows
- Check Supabase API keys are correct
- Verify Realtime is enabled for both tables

### Blank Page
- Check browser console for errors
- Verify base-href is correct
- Check that all assets loaded correctly in Network tab

## Update Deployment

Every time you push to the `main` branch, GitHub Actions will automatically rebuild and redeploy:

```bash
git add .
git commit -m "Update: describe your changes"
git push origin main
```

## Manual Deployment Trigger

If you need to redeploy without pushing code:
1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow** button

## Environment Variables

This app requires Supabase configuration in environment files:
- `src/environments/environment.ts` - Development
- `src/environments/environment.prod.ts` - Production

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup instructions.

## DNS & Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to `src/assets/` with your domain
2. Update angular.json to include the CNAME file
3. Configure DNS records with your domain provider
4. Update GitHub Pages settings with your custom domain

## Production Checklist

Before sharing with your team:
- [ ] App loads without errors
- [ ] All features work correctly
- [ ] Mobile responsive design works
- [ ] Multiple users can join and vote
- [ ] Real-time sync is working
- [ ] Room IDs are being generated
- [ ] Average calculation is correct
- [ ] Reset functionality works

## Performance

The app should:
- Load in < 3 seconds on 4G
- Be fully responsive on mobile
- Handle 10+ concurrent users in a room
- Sync changes within 1-2 seconds

## Support

If you encounter issues:
1. Check the [README.md](README.md) troubleshooting section
2. Review GitHub Actions logs
3. Check browser console for JavaScript errors
4. Verify Supabase connection and API keys

---

**Congratulations!** 🎉 Your Planning Poker app is now live on GitHub Pages!
