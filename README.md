# Planning Poker

A production-ready Planning Poker application built with Angular 21 and Supabase for reliable real-time synchronization.

## Features

- **Real-Time Sync**: Reliable cross-browser synchronization with Supabase PostgreSQL and real-time subscriptions
- **Visual Estimation Cards**: Each participant has a visual estimation card with 3D flip animation
  - Face-down cards with diagonal stripe pattern
  - Cards turn green when participant votes
  - Animated card flip reveals votes when admin triggers reveal
  - Orange border for "?" (unknown) votes
- **Room Management**: Secure and validated room creation and joining
  - Only admins can create rooms
  - Room existence validation before joining
  - Inline error messages for failed joins (no disruptive popups)
  - Optional "join as admin" checkbox to streamline the joining process
- **Admin Controls**: Room creator has exclusive control over voting sessions
  - Optional admin participation toggle - choose to vote or just facilitate
  - Start Voting button to begin estimation rounds
  - Reveal/Hide votes toggle with animated card flip
  - Reset votes for new rounds
  - Remove participants from room (hover-activated button)
  - Discussion mode to highlight min/max voters for focused conversations
- **Desktop Poker Table**: Immersive poker table layout for desktop and tablets
  - Realistic green felt texture with wooden border
  - Participants positioned in an ellipse around the table
  - Decorative card suit symbols (♠♣♥♦)
  - Dynamic center display showing vote count or discussion mode
  - Animated poker cards appear on table when votes are revealed
  - Table background dims during discussion mode to emphasize highlighted participants
- **Discussion Mode**: Facilitate estimate discussions with automatic voter selection
  - Randomly selects one participant with lowest and highest estimates
  - Visual highlighting with animated pulsing and gradient backgrounds
  - "LOW" and "HIGH" badges on selected participants
  - Dim non-selected participants to focus attention
  - Automatically ends when admin hides votes
- **Tinder-Style Voting (Mobile)**: Swipeable card interface for mobile devices
  - Touch-friendly carousel navigation
  - Swipe left/right to browse voting cards
  - Visual indicator dots showing current card position
- **Smart Defaults**: "?" card pre-selected for participants who haven't voted
- **Share Room**: Copy room URL to clipboard for easy team sharing
- **Accessibility**: Full keyboard navigation support with ARIA attributes
- **Custom Favicon & Background**: Expressive Planning Poker themed design
- **Progressive Web App (PWA)**: Installable on desktop and mobile with native Service Worker
  - Smart caching strategies for optimal performance
  - Offline support for previously loaded content
  - Automatic update notifications with user control
  - Push notification ready (future enhancement)
- **Modern Stack**: Angular 21 with Standalone Components, Signals, and linkedSignal()
- **Responsive Design**: Mobile-first UI with Angular Material
- **GitHub Pages**: Free static hosting with automated deployments
- **Persistent Storage**: Data backed by PostgreSQL database
- **Free Tier Available**: Generous Supabase free tier (500MB database, 5GB bandwidth)

## Tech Stack

- **Frontend**: Angular 21 (Standalone Components)
- **State Management**: Angular Signals with `linkedSignal()`
- **Real-Time Sync**: Supabase (PostgreSQL + Real-time subscriptions)
- **UI Library**: Angular Material
- **Styling**: SCSS
- **PWA**: Native Service Worker (following Angular's recommendation to use browser APIs directly)
  - Cache-first strategy for static assets
  - Network-first strategy for API calls
  - Stale-while-revalidate for HTML pages
- **Testing**:
  - Unit Tests: Vitest with 100% statement coverage (244 tests)
  - E2E Tests: Playwright with 100% pass rate (239 tests passing, 15 skipped)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/planning-poker.git
cd planning-poker
```

2. Install dependencies:
```bash
npm install
```

3. **Set up Supabase** (required):
   - Follow the detailed setup guide in [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
   - Create a Supabase project
   - Set up database tables
   - Configure environment files with your API keys

### Development Server

Run the development server:
```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### Build

Build the project for production:
```bash
npm run build:prod
```

The build artifacts will be stored in the `dist/` directory.

## Testing

The project has comprehensive test coverage with both unit tests and end-to-end tests.

### Unit Tests (Vitest)

The project has 244 unit tests across all components and services with 100% statement coverage.

```bash
# Run all unit tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui

# Run tests in watch mode
npm test -- --watch
```

**Unit Test Coverage:**
- **Statement Coverage**: 100% ✅
- **Branch Coverage**: 98% ✅
- **Function Coverage**: 100% ✅
- **Line Coverage**: 100% ✅

See [TESTING.md](TESTING.md) for detailed information about the unit test suite.

### End-to-End Tests (Playwright)

The project has 254 e2e tests across 51 test cases running on 5 browser configurations with 100% pass rate (excluding skipped tests).

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all e2e tests across 5 browsers
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step-by-step)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

**E2E Test Coverage:**
- **Total Tests**: 254 (51 test cases × 5 browsers, with 3 clipboard tests skipped per browser)
- **Passed**: 239 tests (100% of runnable tests) ✅
- **Skipped**: 15 tests (3 clipboard tests × 5 browsers - headless limitation)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12 Pro)
- **Duration**: ~2 minutes for full suite
- **Test Suites**:
  - **High Priority** (27 test cases): Core functionality, room management, voting, multi-user sync, admin controls
  - **Moderate Priority** (17 test cases): Room sharing, multi-round voting, validation, UI states
  - **Home & Mobile** (7 test cases): Login flow, mobile responsiveness, touch targets

See [tests/e2e/E2E_TESTING.md](tests/e2e/E2E_TESTING.md) for comprehensive e2e testing documentation.

## How to Use

### Creating a Room

1. Go to the home page
2. Enter your name
3. Click "Create New Room"
4. Optionally set an admin PIN (recommended for persistent admin access)
5. Share the generated Room ID with your team

### Joining a Room

1. Go to the home page
2. Enter your name
3. Click "Join Existing Room"
4. Enter the Room ID shared by your team
5. (Optional) Check "Join as admin (requires PIN)" if you want to join as admin
6. Click "Join Room"
7. If you checked the admin option, enter the admin PIN in the dialog
8. You'll join the room if it exists, or see an error if the room doesn't exist

**Note**: Rooms can only be created by clicking "Create New Room". You cannot create a room by trying to join a non-existent room ID.

### Voting

1. **Admin setup** (optional): Check "I want to participate in voting" if admin wants to vote
   - Unchecked (default): Admin facilitates without voting
   - Checked: Admin participates like regular participants
2. The room creator (admin) starts by clicking **"Start Voting"**
3. **Participants see visual cards**: Each participant (except non-participating admin) has a face-down estimation card next to their avatar
4. Once voting starts, all participants can select a card value (Fibonacci: 0, 1, 2, 3, 5, 8, 13, 20, 35, 50, 100, ?)
   - "?" is pre-selected by default for those who haven't voted
   - Participants can change their votes freely until admin reveals
5. **Visual feedback**: Estimation cards turn green when participant submits their vote
6. Votes are hidden from others until revealed
7. Admin clicks **"Reveal Votes"** to trigger animated 3D card flip revealing all votes
   - Small poker cards appear on the table (desktop view) showing each participant's vote
   - Voting is locked - participants cannot change their votes while revealed
8. View the average calculation (excluding "?" votes)
9. Admin clicks **"Reset Votes"** to start a new round (returns to "Start Voting" state)

### Admin Features

The room creator has exclusive admin controls:
- **Admin Participation Toggle**: Choose whether to participate in voting
  - Unchecked (default): No estimation card shown, voting disabled for admin
  - Checked: Admin votes like regular participants with their vote counting in average
  - Can be toggled at any time
- **Admin PIN Protection**: Set an optional PIN when creating a room for persistent admin access
  - Admin ID persists permanently (no 24-hour expiry)
  - Use PIN to regain admin access when returning to the room
  - Regular participants still have 24-hour session expiry
- **Start Voting**: Begin a new voting round (clears previous votes automatically)
- **Reveal/Hide Votes**: Toggle vote visibility with animated 3D card flip for all participants
- **Discussion Mode**: Facilitate focused discussions
  - Automatically selects one min and one max voter randomly
  - Visual highlighting with pulsing animations and badges
  - Table background dims to emphasize highlighted participants
  - Click "Discuss" button when votes are revealed and estimates differ
  - Click "End Discussion" to exit discussion mode
  - Automatically stops when admin hides votes
- **Reset Votes**: Clear all votes and return to initial state
- **Remove Participants**: Remove any participant from the room (except yourself)
  - Hover over participant card to reveal remove button
  - Removed participants are silently redirected to home page
- **Share Room**: Copy full room URL to share with team members

### Rejoining as Admin

To rejoin a room as admin after closing your browser:
1. Go to the home page and click "Join Existing Room"
2. Enter your name and the Room ID
3. **Check the "Join as admin (requires PIN)" checkbox**
4. Click "Join Room"
5. In the dialog, enter the admin PIN you set when creating the room
6. Click "OK" to join as admin with full admin controls

**Note**: If you don't check the admin checkbox, you'll join as a regular participant and won't be prompted for a PIN.

## Deployment to GitHub Pages

### One-Time Setup

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**:
   - Source: Select "GitHub Actions"

### Automatic Deployment

The application is configured to automatically deploy to GitHub Pages on every push to the `main` branch.

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
1. Install dependencies
2. Build the Angular app with the correct base href
3. Deploy to GitHub Pages

### Manual Deployment

To manually trigger a deployment:
1. Go to the **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

### Update Base Href

Make sure to update the `base-href` in [package.json](package.json) to match your repository name:

```json
"build:prod": "ng build --configuration production --base-href /your-repo-name/"
```

Replace `your-repo-name` with your actual GitHub repository name.

## Project Structure

```
planning-poker/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   ├── home.component.html
│   │   │   │   └── home.component.scss
│   │   │   ├── room/
│   │   │   │   ├── room.component.ts
│   │   │   │   ├── room.component.html
│   │   │   │   └── room.component.scss
│   │   │   └── admin-pin-dialog/
│   │   │       ├── admin-pin-dialog.component.ts
│   │   │       └── admin-pin-dialog.component.html
│   │   ├── services/
│   │   │   ├── supabase.service.ts
│   │   │   └── pwa.service.ts
│   │   ├── environments/
│   │   │   ├── environment.ts (created from template)
│   │   │   ├── environment.prod.ts (created from template)
│   │   │   └── environment.template.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   └── home-background.svg
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-*.png
│   ├── apple-touch-icon.png
│   ├── manifest.json
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── public/
│   ├── sw.js (Native Service Worker)
│   ├── manifest.webmanifest
│   └── icons/ (PWA icons: 72x72 to 512x512)
├── tests/
│   └── e2e/ (Playwright E2E tests)
├── .github/
│   └── workflows/
│       └── deploy.yml
├── SUPABASE_SETUP.md
├── FAVICON.md
├── TEST_PWA.md
├── PWA_USER_GUIDE.md
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### SupabaseService

The `SupabaseService` handles all Supabase interactions and exposes Angular Signals for reactive state management:

- **State Management**: Uses `WritableSignal<RoomState>` for reactive updates
- **Room Operations**: Separate `createRoom()` and `joinRoom()` methods with validation
- **Room Validation**: `roomExists()` method to check room availability before joining
- **Real-Time Sync**: Connects to Supabase PostgreSQL with real-time subscriptions
- **Heartbeat**: Sends periodic updates (every 2 seconds) to show active participants
- **Real-Time Updates**: Automatically syncs votes, participants, and reveal state
- **Persistence**: Data stored in PostgreSQL database with proper cleanup

### Components

#### HomeComponent
- Create new rooms with random alphanumeric IDs (8 characters)
- Admin PIN setup dialog for room creators (optional but recommended)
- Join existing rooms by entering a Room ID
- Room existence validation before navigation
- Inline error messages for invalid room IDs
- "Join as admin" checkbox to skip PIN dialog for regular participants
- Admin PIN verification for rejoining as admin
- Input validation for user name and room ID

#### RoomComponent
- **Desktop Poker Table** (768px+):
  - Realistic green felt table with wooden border and decorative suits
  - Participants positioned dynamically in an ellipse around the table
  - Center display showing vote count, voting status, or discussion mode
- **Mobile Grid Layout** (< 768px):
  - Simple grid of participant cards
  - Touch-optimized spacing and sizing
- **Visual estimation cards** next to each participant:
  - Face-down cards with diagonal stripe pattern (gray)
  - Turn green when participant votes
  - Animate with 3D flip when votes are revealed
  - Orange border for "?" (unknown) votes
- **Voting Interface**:
  - Desktop: Grid view showing all Fibonacci cards (0, 1, 2, 3, 5, 8, 13, 20, 35, 50, 100, ?)
  - Mobile: Tinder-style carousel with swipe gestures and navigation dots
  - "?" pre-selected by default for participants who haven't voted
  - Keyboard accessible (Enter/Space key support)
- Admin-only controls:
  - **Participation toggle**: Checkbox to enable/disable admin voting
  - Start Voting, Reveal/Hide, Discuss (when applicable), Reset
  - Remove participants (hover-activated button on participant cards)
- **Discussion Mode**:
  - Highlights one min and one max voter with pulsing animations
  - Blue gradient for LOW estimates, red/orange for HIGH estimates
  - "LOW" and "HIGH" badges on selected participants
  - Dims non-selected participants with grayscale filter
  - Dims poker table background to emphasize highlighted participants
  - Shows "Discussion Mode" in center of poker table
- Vote state management (disabled until admin starts voting)
- Animated vote reveal with 3D card flip effect
- Average calculation using computed signals (excludes non-participating admin)
- Share room URL button (copies full URL to clipboard)
- Copy Room ID button (copies just the ID)
- Real-time participant updates around the table
- Fully responsive with mobile-first design and desktop optimizations

## Supabase Configuration

The application uses Supabase for reliable real-time synchronization across browsers and machines.

### Database Tables

- **rooms**: Stores room state (revealed status, voting_started flag, admin_user_id, admin_pin, admin_participates, discussion_active, discussion_min_voter, discussion_max_voter)
- **participants**: Stores participant information (votes, names, lastSeen timestamps)

### Real-Time Subscriptions

The app subscribes to PostgreSQL changes using Supabase Realtime:

- **Participant updates**: Detects when users join, vote, or leave
- **Room updates**: Detects when votes are revealed, reset, or admin participation changes
- **Automatic cleanup**: Stale participants (inactive >10 seconds) are removed

### Heartbeat & Cleanup Architecture

The application uses a sophisticated heartbeat and cleanup mechanism to maintain accurate participant state:

#### How It Works

**1. Heartbeat System** ([supabase.service.ts:29](src/app/services/supabase.service.ts#L29))
- **Interval**: Every 2 seconds (`HEARTBEAT_INTERVAL_MS = 2000`)
- **Action**: Updates the participant's `last_seen` timestamp in the database
- **Purpose**: Signals "I'm still active" to other participants
- **Implementation**: Runs continuously while user is in a room

**2. Cleanup System** ([supabase.service.ts:30](src/app/services/supabase.service.ts#L30))
- **Interval**: Every 3 seconds (`CLEANUP_INTERVAL_MS = 3000`)
- **Threshold**: 10 seconds of inactivity (`PARTICIPANT_TIMEOUT_MS = 5000` × 2)
- **Action**: Removes participants from local state if their `last_seen` is older than threshold
- **Scope**: Client-side only (removes from UI, not from database)

**3. Browser Close Handler** ([supabase.service.ts:79-93](src/app/services/supabase.service.ts#L79))
- **Trigger**: When user closes browser tab or navigates away
- **Action**: Sets participant's `last_seen` to 0 immediately
- **Purpose**: Fast cleanup without waiting for timeout
- **Result**: Other participants see them disappear within 3 seconds

#### Why Client-Side Cleanup?

The cleanup is intentionally **client-side only** for several reasons:

1. **Performance**: No database operations during cleanup checks
2. **Scalability**: Each client manages their own view independently
3. **Consistency**: Real-time subscriptions keep all clients in sync
4. **Data Retention**: Historical data remains in database for analytics (optional)

#### Database Cleanup (Optional)

For production environments, you can enable **server-side cleanup** using PostgreSQL triggers:

```sql
-- Auto-delete participants older than 1 hour (see SUPABASE_SETUP.md)
CREATE OR REPLACE FUNCTION cleanup_old_participants()
RETURNS void AS $$
BEGIN
  DELETE FROM participants
  WHERE last_seen < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000);
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (every 15 minutes)
SELECT cron.schedule('cleanup-old-participants', '*/15 * * * *',
  'SELECT cleanup_old_participants();');
```

This is **optional** and not required for the app to function correctly.

#### Test Data Cleanup

For E2E tests, automatic cleanup is **implemented**:

- **Production**: Client-side cleanup removes from UI only
- **E2E Tests**: Automatically delete test data after each test using `cleanupTestRoom()`
- **Implementation**: All test files use `test.afterEach()` hooks with room ID tracking
- **Benefits**: Test isolation, no data pollution, clean database state

Example from [tests/e2e/room.spec.ts](tests/e2e/room.spec.ts):
```typescript
import { cleanupTestRoom } from './helpers/cleanup';

let createdRoomIds: string[] = [];

test.afterEach(async () => {
  for (const roomId of createdRoomIds) {
    await cleanupTestRoom(roomId);
  }
  createdRoomIds = [];
});
```

See [E2E_TESTING.md](tests/e2e/E2E_TESTING.md#test-data-cleanup-strategy) for full implementation details.

#### Timing Summary

| Event | Interval | Purpose |
|-------|----------|---------|
| Heartbeat | 2 seconds | Update `last_seen` timestamp |
| Cleanup Check | 3 seconds | Remove stale participants from UI |
| Timeout Threshold | 10 seconds | Mark participant as inactive |
| Database Cleanup | Optional (15 min) | Remove old data from database |

### Benefits of Supabase

- ✅ **Reliable**: No dependency on unreliable public relay servers
- ✅ **Cross-browser sync**: Works reliably between different browsers and devices
- ✅ **Persistent storage**: PostgreSQL database with proper backups
- ✅ **Scalable**: Handles many concurrent users
- ✅ **Admin features**: Database-backed admin controls and permissions
- ✅ **Free tier**: Generous limits (500MB DB, 5GB bandwidth)

## State Management

The application uses Angular Signals for reactive state management:

- **Room State Signal**: Central state containing participants, votes, reveal status, voting_started flag, and admin_participates flag
- **Computed Signals**: Derived values like average vote, participant count, voted count, and admin status
- **Automatic Reactivity**: UI updates automatically when Supabase pushes state changes via real-time subscriptions
- **3D Animations**: CSS transforms with perspective for card flip animations
- **Local State**: Form state (userName, roomId, joinAsAdmin, joinError) managed with signals for reactive UI updates

## Key Technical Decisions

- **Why Supabase**: Reliable real-time sync without peer-to-peer complexity, persistent storage, and generous free tier
- **Why Angular Signals**: Modern reactive programming with better performance than RxJS for simple state management
- **Why Standalone Components**: Simpler dependency injection, better tree-shaking, and modern Angular architecture
- **Why Material Design**: Battle-tested component library with excellent accessibility and mobile support
- **Why GitHub Pages**: Free hosting, automatic deployments, and HTTPS by default
- **Why No Authentication**: Reduces friction for quick team sessions, no account signup required
- **Why Room Validation**: Prevents navigation to non-existent rooms, better UX with inline errors
- **Why Separate Create/Join**: Clear separation of concerns, better security model for room creation
- **Why Native Service Worker**: Angular's Service Worker is deprecated with limited features; native implementation provides:
  - Full control over caching strategies
  - Better performance with custom optimizations
  - Future-proof (won't be deprecated)
  - Push notification support
  - More flexible update mechanisms

## Mobile Support

The application is fully responsive with mobile-first design:
- **Tinder-Style Voting**: Swipeable card carousel with touch gestures
  - Swipe left/right to browse Fibonacci cards
  - Visual indicator dots showing current position
  - Large, touch-friendly voting cards (170×240px)
- **Mobile Grid Layout**: Simple grid of participant cards (< 768px)
- **Desktop Enhancements** (768px+):
  - Immersive poker table layout with participants positioned around table
  - Grid view showing all voting cards simultaneously
  - Hover effects and larger click targets
  - No-scroll layout optimized for desktop viewports
- Touch-friendly voting interface
- Responsive estimation cards (70×70px desktop, 60×60px mobile)
- Mobile-optimized navigation and spacing
- **PWA Installation**:
  - Install on home screen (Android, iOS, Desktop)
  - Standalone app window without browser UI
  - Offline support for basic functionality
  - Smart caching for instant loading
  - Automatic update notifications
- Apple touch icon for iOS home screen
- Adaptive typography and animations

### Installing the PWA

**Android/Chrome:**
- Tap menu → "Add to Home screen" or "Install app"

**iOS/Safari:**
- Tap Share (□↑) → "Add to Home Screen"

**Desktop (Chrome/Edge):**
- Click install icon (⊕) in address bar

See [PWA_USER_GUIDE.md](PWA_USER_GUIDE.md) for complete installation and uninstallation instructions.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## User Experience

The application prioritizes user experience with thoughtful design decisions:

- **No Disruptive Popups**: Validation errors appear inline where users are working
- **Immediate Feedback**: Room validation happens before navigation, preventing unnecessary page loads
- **Smart Forms**: Error messages clear automatically when users correct their input
- **Optional Complexity**: Advanced features (admin PIN, admin participation) are optional and clearly labeled
- **Progressive Enhancement**: Users can join as regular participants without dealing with admin features
- **Visual Hierarchy**: Important actions (Create/Join) are prominently displayed with clear CTAs
- **Error Recovery**: Users stay in context when errors occur, making it easy to correct mistakes

## Security & Privacy

- **Room Isolation**: Each room is completely isolated with unique IDs
- **Admin Protection**: Optional PIN protection for admin access with permanent admin ID persistence
- **Session Management**: Regular participants have 24-hour session expiry, admins can persist indefinitely with PIN
- **No Account Required**: No user registration or personal data collection
- **Client-Side State**: User preferences stored locally in browser
- **Secure Communication**: All data transmitted over HTTPS
- **Data Cleanup**: Stale participants automatically removed after 10 seconds of inactivity
- **Room Validation**: Prevents unauthorized room creation attempts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Troubleshooting

### Database Migration (Existing Installations)

If you're updating from an earlier version, you need to add new columns to your existing database:

```sql
-- Add voting_started column (if not already added)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS voting_started BOOLEAN DEFAULT false;

-- Add admin_pin column for persistent admin access
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_pin TEXT;

-- Add admin_participates column to control admin voting participation
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_participates BOOLEAN DEFAULT false;

-- Add discussion mode columns (v1.1.0+)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS discussion_active BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS discussion_min_voter TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS discussion_max_voter TEXT;
```

Run this in your Supabase SQL Editor (Settings → Database → SQL Editor).

### Supabase Connection Issues

If you experience sync issues:
1. Verify your Supabase API keys are correct in environment files
2. Check that database tables exist (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
3. Ensure all required columns exist in the `rooms` table:
   - `voting_started`, `admin_pin`, `admin_participates`
4. Ensure Realtime is enabled for both tables
5. Check browser console for errors
6. Verify your Supabase project is not paused (free tier)

### Build Errors

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Angular cache: `rm -rf .angular/cache`
4. Run `npm run build:prod`

### Deployment Issues

If GitHub Pages deployment fails:
1. Check the Actions tab for error logs
2. Ensure GitHub Pages is enabled in repository settings
3. Verify the base-href in package.json matches your repo name
4. Check that the workflow has the correct permissions

## Visual Design

The application features custom Planning Poker themed graphics:
- **Custom Favicon**: Poker card design with Fibonacci number "8" in Material Indigo
- **Multiple Icon Sizes**: SVG, ICO, and PNG formats for all devices (16x16, 32x32, 180x180, 512x512)
- **Background Design**: Expressive home page background with floating poker cards and Fibonacci numbers
- **Desktop Poker Table**: Realistic green felt table with wooden border
  - Crosshatch felt texture pattern
  - Dashed betting circle in center
  - Decorative card suits (♠♣♥♦) positioned around table
  - Inset shadows and lighting effects for depth
  - Participants dynamically positioned in ellipse around table
- **Estimation Cards**: Face-down cards with diagonal stripe pattern, 3D flip animation
- **Discussion Mode Highlighting**:
  - Blue gradient and pulsing animation for LOW voters
  - Red/orange gradient and pulsing animation for HIGH voters
  - "LOW" and "HIGH" badges with bounce-in animation
  - Grayscale dimming for non-selected participants
- **Animated Reveals**: 3D card flip animation (0.6s) with perspective transforms when votes are revealed
- **Material Design**: Consistent color scheme using Material Indigo, green for votes, orange for unknown
- **Visual Feedback**: Color changes indicate voting status (gray → green → revealed)
- **Hover Effects**: Remove button appears on participant card hover (admins only)

For more details on the favicon design, see [FAVICON.md](FAVICON.md).

## Recent Updates

### v1.3.0-rc.4 (February 16, 2026) - iOS PWA Status Bar Fixes
- 🍎 **iOS PWA Status Bar Fixes**
  - Fixed app header overlapping with iPhone status bar (time, battery, notch area)
  - Changed `apple-mobile-web-app-status-bar-style` from "black-translucent" to "default"
  - Removed `viewport-fit=cover` to ensure status bar visibility in landscape mode
  - Added CSS safe area support using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`
  - Optimized for notched iPhones (iPhone X and newer)
  - Fixed excessive header padding on desktop
- 📊 **Dynamic Version Indicator**
  - Version pulled dynamically from package.json
  - Displayed on home page for deployment verification
  - Updated GitHub Actions workflows to include version in environment files
- 📚 **Documentation**
  - Comprehensive [PR_DESCRIPTION.md](PR_DESCRIPTION.md): Complete PR overview with all features
  - Updated [PWA_USER_GUIDE.md](PWA_USER_GUIDE.md): iOS-specific troubleshooting
  - Updated [TEST_PWA.md](TEST_PWA.md): iOS status bar testing procedures
  - Updated [PROGRESSIVE_ENHANCEMENTS.md](PROGRESSIVE_ENHANCEMENTS.md): iOS PWA fixes documentation

**Important for iOS users:** Meta tag changes only take effect after deleting and reinstalling the PWA. To get the fix:
1. Delete PWA from home screen
2. Clear Safari cache: Settings → Safari → Clear History and Website Data
3. Reinstall from Safari using "Add to Home Screen"

### v1.4.0 (February 15, 2026) - Native PWA Implementation
- 📱 **Native Service Worker** implementation following Angular's recommendation
  - Migrated from deprecated Angular Service Worker to native browser APIs
  - Cache-first strategy for static assets (JS, CSS, images, fonts)
  - Network-first strategy for API calls and Supabase
  - Stale-while-revalidate strategy for HTML pages
  - Automatic version detection and cache cleanup
- ✨ **PWA Update Notifications**
  - Visual update banner when new version available
  - "Update Now" or "Later" user control
  - Automatic checks every hour + on page load
  - Smooth slide-up animation
- 📦 **PWA Services**
  - [pwa.service.ts](src/app/services/pwa.service.ts): Service Worker registration and management
  - [sw.js](public/sw.js): Native Service Worker with smart caching strategies
  - Update detection and application
  - Install prompt handling
  - Installation status tracking
- 📚 **Documentation**
  - [TEST_PWA.md](TEST_PWA.md): Comprehensive PWA testing guide for developers
  - [PWA_USER_GUIDE.md](PWA_USER_GUIDE.md): User-friendly installation/uninstallation guide
- 🎯 **Better Performance**
  - Offline support for previously loaded rooms
  - Faster page loads with smart caching
  - Reduced network requests with cache-first strategy
- 🔮 **Push Notifications Ready**: Service Worker configured for future push notification support

### v1.3.0 (February 15, 2026) - E2E Testing Suite + Bug Fixes
- 🧪 **Comprehensive E2E Testing Suite** with Playwright
  - 254 tests across 5 browser configurations (100% pass rate for runnable tests)
  - 239 passing, 15 skipped (3 clipboard tests - headless browser limitation)
  - Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari coverage
  - **High Priority Tests** (27 test cases): Core features, room management, voting, multi-user sync
  - **Moderate Priority Tests** (17 test cases): Room sharing, multi-round voting, validation, UI states
  - Automatic test data cleanup after each test
  - Comprehensive [E2E_TESTING.md](tests/e2e/E2E_TESTING.md) documentation
  - Automated CI testing with GitHub Actions
- 🐛 **Critical Bug Fix: Participant List Loading**
  - Fixed participant count staying at (0) after room creation
  - Implemented optimistic UI updates for instant participant visibility
  - Participants now appear instantly when joining rooms
- 🐛 **Critical Bug Fix: Vote Selection Syncing**
  - Fixed vote staying at "?" after card selection
  - Implemented optimistic UI updates for immediate vote feedback
  - Vote selections now update instantly with visual feedback
- ⚡ **Performance Improvements**
  - Optimistic UI updates eliminate lag in real-time synchronization
  - Better UX across all browsers and devices

See [tests/e2e/E2E_TESTING.md](tests/e2e/E2E_TESTING.md) for complete e2e testing details.

### v1.2.0 (February 14, 2026) - Angular 21 Upgrade
- ⬆️ **Upgraded to Angular 21** from Angular 19
  - Leveraging latest Angular 21 features: `linkedSignal()` for reactive state
  - Improved zoneless change detection support
  - Enhanced signal-based reactivity
- 🧪 **Comprehensive Unit Test Suite** with 100% statement coverage
  - 244 tests passing across 4 test suites
  - 100% statement coverage, 98% branch coverage
  - Full coverage of all features including Angular 21 APIs
  - Type-safe tests with proper TypeScript types
- ✅ **Code Quality Improvements**
  - Zero linting errors with strict TypeScript configuration
  - Proper type safety throughout codebase
  - Production-ready build with all checks passing
- 📚 **Documentation Updates**
  - Comprehensive [TESTING.md](TESTING.md) documenting all 244 tests
  - Updated coverage metrics and testing strategies
  - Detailed examples of Angular 21 feature testing

See [TESTING.md](TESTING.md) for complete unit test coverage details.

### v1.1.0 (February 14, 2026)
- ✨ Admin participant removal with hover-activated button
- ✨ Discussion mode to highlight min/max voters for focused conversations
  - Table background dims during discussion mode for better focus
  - Automatically stops when admin hides votes
- ✨ Desktop poker table layout with realistic felt texture and wooden border
  - Animated poker cards appear on table when votes are revealed
- ✨ Tinder-style swipeable voting cards for mobile devices
- ✨ Voting lock - participants cannot change votes once revealed
- ♿ Full keyboard navigation support with ARIA attributes
- 🐛 Fixed UI flash on page refresh for admin controls
- 🐛 Fixed share URL to include base href path for production deployments
- 🐛 Fixed participant counting to exclude non-participating admins
- 🐛 Fixed white square backgrounds appearing around participant cards
- 📱 Optimized no-scroll desktop layout for better UX

See [RELEASE_NOTES_v1.1.0.md](RELEASE_NOTES_v1.1.0.md) for complete details.

## Future Enhancements

Possible improvements:
- Timer for voting rounds with countdown
- Custom card values configuration
- Room password protection
- Vote history and statistics tracking
- Export results to CSV or PDF
- Multiple voting rounds history
- Spectator mode (observe without voting)
- Custom themes and color schemes
- Voice/video chat integration
- Integration with Jira/Linear/GitHub Issues
- Re-roll discussion participants without exiting discussion mode

## Support

For issues and questions:
1. Check the [Issues](https://github.com/YOUR_USERNAME/planning-poker/issues) page
2. Create a new issue with details about your problem
3. Include browser version and error messages

---

Built with ❤️ using Angular 21 and Supabase