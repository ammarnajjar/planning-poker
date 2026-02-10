# Quick Setup Guide

## Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Run Development Server**
```bash
npm start
```
Visit `http://localhost:4200`

3. **Build for Production**
```bash
npm run build:prod
```

## GitHub Pages Deployment

### Step 1: Update Base Href
In [package.json](package.json), update the repository name:
```json
"build:prod": "ng build --configuration production --base-href /YOUR-REPO-NAME/"
```

### Step 2: Enable GitHub Pages
1. Go to GitHub repository **Settings** → **Pages**
2. Under "Build and deployment", select **Source: GitHub Actions**

### Step 3: Push to Main Branch
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

The GitHub Actions workflow will automatically deploy your app!

## Project Architecture

### Key Files

- **[src/app/services/gun.service.ts](src/app/services/gun.service.ts)** - Gun.js P2P sync with Angular Signals
- **[src/app/components/home/home.component.ts](src/app/components/home/home.component.ts)** - Room creation/joining
- **[src/app/components/room/room.component.ts](src/app/components/room/room.component.ts)** - Voting interface
- **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)** - Automated deployment

### Features Implemented

✅ Standalone Angular Components (No NgModules)
✅ Angular Signals for reactive state management
✅ Gun.js P2P synchronization
✅ Fibonacci voting cards (0, 1, 2, 3, 5, 8, 13, 21, ?)
✅ Hide/Reveal votes functionality
✅ Reset votes
✅ Average calculation (computed signal)
✅ Participant tracking with heartbeat
✅ Mobile-first responsive design
✅ Angular Material UI
✅ GitHub Actions deployment

## Gun.js Relay Peers

The app uses these free public Gun.js relay servers:
- `https://gun-manhattan.herokuapp.com/gun`
- `https://gun-us.herokuapp.com/gun`

No configuration or API keys needed!

## How It Works

1. **Create/Join Room**: User enters name and creates/joins a room with a unique ID
2. **P2P Sync**: Gun.js syncs room state across all participants in real-time
3. **Vote**: Users select cards, votes are hidden until revealed
4. **Reveal**: All votes shown simultaneously, average calculated
5. **Reset**: Clear votes for next round

## Testing Locally

1. Start the dev server: `npm start`
2. Open `http://localhost:4200` in two browser windows
3. Create a room in window 1
4. Copy the Room ID and join in window 2
5. Vote in both windows and test reveal/reset

## Need Help?

Check the full [README.md](README.md) for detailed documentation.
