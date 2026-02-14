# Quick Setup Guide

This guide helps you get Planning Poker up and running quickly. For detailed documentation, see [README.md](README.md).

## Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+
- Supabase account (free tier available)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase

**Important:** This app requires Supabase for real-time synchronization.

Follow the detailed setup guide: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

Quick summary:
1. Create a free Supabase project
2. Run the SQL schema to create tables
3. Copy environment template files
4. Add your Supabase API keys

### 3. Run Development Server
```bash
npm start
```
Visit `http://localhost:4200`

### 4. Run Tests
```bash
# Run all 244 tests
npm test

# Run with coverage report
npm run test:coverage

# Run with interactive UI
npm run test:ui
```

### 5. Build for Production
```bash
npm run build:prod
```

Build artifacts will be in `dist/` directory.

## Testing Locally

1. Start the dev server: `npm start`
2. Open `http://localhost:4200` in two browser windows
3. Create a room in window 1 (optionally set admin PIN)
4. Copy the Room ID and join in window 2
5. Start voting and test all features:
   - Voting with visual cards
   - Reveal/hide votes with 3D flip animation
   - Discussion mode highlighting
   - Admin controls (if you set a PIN)
   - Participant removal (admin only)

## GitHub Pages Deployment

### Step 1: Update Base Href
In [package.json](package.json), update the repository name:
```json
"build:prod": "ng build --configuration production --base-href /YOUR-REPO-NAME/"
```

### Step 2: Configure Supabase for Production
In `src/app/environments/environment.prod.ts`, add your production Supabase credentials.

### Step 3: Enable GitHub Pages
1. Go to GitHub repository **Settings** → **Pages**
2. Under "Build and deployment", select **Source: GitHub Actions**

### Step 4: Push to Main Branch
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically build and deploy your app!

## Project Architecture

### Tech Stack
- **Frontend**: Angular 21 (Standalone Components)
- **State Management**: Angular Signals with `linkedSignal()`
- **Real-Time Sync**: Supabase (PostgreSQL + Real-time subscriptions)
- **UI Library**: Angular Material
- **Testing**: Vitest with 100% statement coverage (244 tests)
- **Deployment**: GitHub Pages via GitHub Actions

### Key Files

#### Core Services
- **[src/app/services/supabase.service.ts](src/app/services/supabase.service.ts)** - Supabase integration with Angular Signals
  - Room management (create, join, leave)
  - Real-time synchronization
  - Voting operations
  - Admin operations (PIN, discussion mode, participant removal)
  - Heartbeat mechanism

#### Components
- **[src/app/components/home/home.component.ts](src/app/components/home/home.component.ts)** - Room creation/joining with admin PIN
- **[src/app/components/room/room.component.ts](src/app/components/room/room.component.ts)** - Voting interface with poker table layout
- **[src/app/components/admin-pin-dialog/admin-pin-dialog.component.ts](src/app/components/admin-pin-dialog/admin-pin-dialog.component.ts)** - Admin PIN management

#### Configuration
- **[src/app/environments/](src/app/environments/)** - Environment configuration
- **[vitest.config.ts](vitest.config.ts)** - Test configuration
- **[angular.json](angular.json)** - Angular build configuration
- **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)** - Automated deployment

#### Documentation
- **[README.md](README.md)** - Complete documentation
- **[TESTING.md](TESTING.md)** - Test suite documentation (244 tests)
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Supabase setup instructions

### Features Implemented

#### Core Features
✅ Angular 21 with Standalone Components
✅ Zoneless mode (no zone.js)
✅ Angular Signals with `linkedSignal()` for reactive state
✅ Supabase PostgreSQL + Real-time subscriptions
✅ 100% test coverage (244 tests)

#### Voting Features
✅ Fibonacci voting cards (0, 1, 2, 3, 5, 8, 13, 20, 35, 50, 100, ?)
✅ Visual estimation cards with 3D flip animation
✅ Hide/Reveal votes functionality
✅ Reset votes
✅ Average calculation (computed signal)
✅ Smart defaults ("?" pre-selected)
✅ Voting lock when revealed

#### Desktop Features
✅ Poker table layout with realistic felt texture
✅ Participants positioned around table in ellipse
✅ Decorative card suits (♠♣♥♦)
✅ Animated poker cards on reveal

#### Mobile Features
✅ Tinder-style swipeable card carousel
✅ Touch gestures for card navigation
✅ Mobile-optimized grid layout
✅ Responsive design

#### Admin Features
✅ Optional admin PIN protection
✅ Admin participation toggle
✅ Start voting button
✅ Discussion mode with min/max voter highlighting
✅ Remove participants
✅ Persistent admin access with PIN

#### Real-Time Features
✅ Participant tracking with heartbeat
✅ Automatic cleanup of stale participants
✅ Cross-browser synchronization
✅ Real-time vote updates

#### UI/UX Features
✅ Mobile-first responsive design
✅ Angular Material UI
✅ Accessibility (ARIA attributes, keyboard navigation)
✅ Custom favicon and background
✅ PWA support
✅ Share room URL to clipboard

#### CI/CD
✅ GitHub Actions deployment
✅ Automated testing
✅ Linting checks
✅ Build verification

## How It Works

### 1. Room Creation
- User enters name and clicks "Create New Room"
- Optionally sets admin PIN for persistent admin access
- Unique 8-character room ID generated
- Room stored in Supabase PostgreSQL database
- User becomes room admin

### 2. Joining a Room
- User enters name and room ID
- Option to join as admin (requires PIN)
- Room existence validated
- User added to participants table
- Real-time subscription established

### 3. Real-Time Synchronization
- Supabase real-time subscriptions for:
  - Participant changes (join, vote, leave)
  - Room state changes (reveal, voting started, discussion mode)
- Heartbeat mechanism (every 2 seconds)
- Automatic cleanup of inactive participants (>10 seconds)
- Cross-browser/device synchronization

### 4. Voting Flow
1. Admin clicks "Start Voting"
2. Participants see visual estimation cards (face-down)
3. Participants select values (desktop: grid, mobile: swipe carousel)
4. Cards turn green when participant votes
5. Admin clicks "Reveal Votes"
6. 3D flip animation reveals all votes
7. Average calculated (excluding "?" and non-participating admin)
8. Admin can start Discussion Mode to highlight min/max voters
9. Admin clicks "Reset Votes" to start new round

### 5. Discussion Mode
- Available when votes are revealed and estimates differ
- Randomly selects one min and one max voter
- Visual highlighting with pulsing animations
- "LOW" and "HIGH" badges
- Dims non-selected participants
- Table background dims for focus
- Ends automatically when admin hides votes

### 6. Data Persistence
- PostgreSQL database with:
  - `rooms` table: Room state and admin info
  - `participants` table: User votes and activity
- Data persists across sessions
- Admin can rejoin with PIN

## Supabase Configuration

The app uses Supabase for reliable real-time synchronization:

### Benefits
- ✅ Reliable cross-browser sync
- ✅ Persistent storage in PostgreSQL
- ✅ Real-time subscriptions
- ✅ Free tier available (500MB DB, 5GB bandwidth)
- ✅ No dependency on unreliable public relay servers
- ✅ Scalable for many concurrent users

### Required Tables
- **rooms**: Stores room state
- **participants**: Stores participant data

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for schema and setup instructions.

## Test Coverage

The project has comprehensive test coverage:
- **244 tests** across 4 test suites
- **100% statement coverage**
- **98% branch coverage**
- **100% function coverage**
- **100% line coverage**

See [TESTING.md](TESTING.md) for detailed test documentation.

## Troubleshooting

### Supabase Connection Issues
1. Verify API keys in environment files
2. Check that database tables exist
3. Ensure Realtime is enabled for both tables
4. Check browser console for errors
5. Verify Supabase project is not paused

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
rm -rf .angular/cache
npm run build:prod
```

### Test Failures
```bash
npm test
```
All 244 tests should pass. If not, check:
- Supabase mock configuration
- TypeScript compilation
- Vitest configuration

## Development Workflow

### Making Changes
1. Create a new branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Build: `npm run build:prod`
6. Commit and push
7. Create Pull Request

### Code Quality Checks
- TypeScript strict mode enabled
- ESLint with strict rules
- 100% test coverage requirement
- All tests must pass
- Zero linting errors

## Need Help?

- **Full Documentation**: [README.md](README.md)
- **Supabase Setup**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Issues**: [GitHub Issues](https://github.com/ammarnajjar/planning-poker/issues)

## Quick Links

- **Live Demo**: https://ammarnajjar.github.io/planning-poker/
- **Repository**: https://github.com/ammarnajjar/planning-poker
- **Supabase**: https://supabase.com/

---

**Built with ❤️ using Angular 21 and Supabase**
