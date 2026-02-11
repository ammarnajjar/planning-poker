# Planning Poker

A production-ready Planning Poker application built with Angular 17+ and Supabase for reliable real-time synchronization.

## Features

- **Real-Time Sync**: Reliable cross-browser synchronization with Supabase PostgreSQL and real-time subscriptions
- **Visual Estimation Cards**: Each participant has a visual estimation card with 3D flip animation
  - Face-down cards with diagonal stripe pattern
  - Cards turn green when participant votes
  - Animated card flip reveals votes when admin triggers reveal
  - Orange border for "?" (unknown) votes
- **Admin Controls**: Room creator has exclusive control over voting sessions
  - Optional admin participation toggle - choose to vote or just facilitate
  - Start Voting button to begin estimation rounds
  - Reveal/Hide votes toggle with animated card flip
  - Reset votes for new rounds
  - Remove participants from room
- **Visual Poker Table**: Interactive circular table with participants seated around it
- **Smart Defaults**: "?" card pre-selected for participants who haven't voted
- **Share Room**: Copy room URL to clipboard for easy team sharing
- **Custom Favicon & Background**: Expressive Planning Poker themed design
- **PWA Support**: Web app manifest for installation on mobile devices
- **Modern Stack**: Angular 17+ with Standalone Components and Signals
- **Responsive Design**: Mobile-first UI with Angular Material
- **GitHub Pages**: Free static hosting with automated deployments
- **Persistent Storage**: Data backed by PostgreSQL database
- **Free Tier Available**: Generous Supabase free tier (500MB database, 5GB bandwidth)

## Tech Stack

- **Frontend**: Angular 17+ (Standalone Components)
- **State Management**: Angular Signals
- **Real-Time Sync**: Supabase (PostgreSQL + Real-time subscriptions)
- **UI Library**: Angular Material
- **Styling**: SCSS
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+

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
5. **Visual feedback**: Estimation cards turn green when participant submits their vote
6. Votes are hidden from others until revealed
7. Admin clicks **"Reveal Votes"** to trigger animated 3D card flip revealing all votes
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
- **Reset Votes**: Clear all votes and return to initial state
- **Remove Participants**: Remove any participant from the room (except yourself)
- **Share Room**: Copy full room URL to share with team members

### Rejoining as Admin

To rejoin a room as admin after closing your browser:
1. Go to the home page and click "Join Existing Room"
2. Enter your name and the Room ID
3. Click "Join Room"
4. In the dialog, enter the admin PIN you set when creating the room
5. Click "OK" to join as admin with full admin controls

**Note**: If you leave the PIN field empty, you'll join as a regular participant instead.

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
│   │   │   └── room/
│   │   │       ├── room.component.ts
│   │   │       ├── room.component.html
│   │   │       └── room.component.scss
│   │   ├── services/
│   │   │   └── supabase.service.ts
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
├── .github/
│   └── workflows/
│       └── deploy.yml
├── SUPABASE_SETUP.md
├── FAVICON.md
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### SupabaseService

The `SupabaseService` handles all Supabase interactions and exposes Angular Signals for reactive state management:

- **State Management**: Uses `WritableSignal<RoomState>` for reactive updates
- **Real-Time Sync**: Connects to Supabase PostgreSQL with real-time subscriptions
- **Heartbeat**: Sends periodic updates to show active participants
- **Real-Time Updates**: Automatically syncs votes, participants, and reveal state
- **Persistence**: Data stored in PostgreSQL database

### Components

#### HomeComponent
- Create new rooms with random alphanumeric IDs
- Admin PIN setup dialog for room creators
- Join existing rooms by entering a Room ID
- Admin PIN verification for rejoining as admin
- Input validation for user name

#### RoomComponent
- Visual poker table with participants seated around it
- **Visual estimation cards** next to each participant:
  - Face-down cards with diagonal stripe pattern (gray)
  - Turn green when participant votes
  - Animate with 3D flip when votes are revealed
  - Orange border for "?" (unknown) votes
- Fibonacci voting cards (0, 1, 2, 3, 5, 8, 13, 20, 35, 50, 100, ?)
  - "?" pre-selected by default for participants who haven't voted
- Admin-only controls:
  - **Participation toggle**: Checkbox to enable/disable admin voting
  - Start Voting, Reveal/Hide, Reset, Remove Participants
- Vote state management (disabled until admin starts voting)
- Animated vote reveal with 3D card flip effect
- Average calculation using computed signals
- Share room URL button (copies full URL to clipboard)
- Copy Room ID button (copies just the ID)
- Real-time participant updates around the table
- Fully responsive with mobile optimization

## Supabase Configuration

The application uses Supabase for reliable real-time synchronization across browsers and machines.

### Database Tables

- **rooms**: Stores room state (revealed status, voting_started flag, admin_user_id, admin_pin, admin_participates)
- **participants**: Stores participant information (votes, names, lastSeen timestamps)

### Real-Time Subscriptions

The app subscribes to PostgreSQL changes using Supabase Realtime:

- **Participant updates**: Detects when users join, vote, or leave
- **Room updates**: Detects when votes are revealed, reset, or admin participation changes
- **Automatic cleanup**: Stale participants (inactive >10 seconds) are removed

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

## Mobile Support

The application is fully responsive with mobile-first design:
- Touch-friendly voting cards (72px height on mobile)
- Responsive estimation cards (50×70px desktop, 40×56px mobile)
- Responsive grid layouts (4-column card grid on mobile)
- Mobile-optimized navigation
- Adaptive typography and spacing
- Compact table layout (350px height on mobile)
- PWA support for installation on mobile devices
- Apple touch icon for iOS home screen
- Responsive poker table that scales on mobile devices

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

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
- **Poker Table Layout**: Visual circular table with participants seated around it
- **Estimation Cards**: Face-down cards with diagonal stripe pattern, 3D flip animation
- **Animated Reveals**: 3D card flip animation (0.6s) with perspective transforms when votes are revealed
- **Material Design**: Consistent color scheme using Material Indigo, green for votes, orange for unknown
- **Visual Feedback**: Color changes indicate voting status (gray → green → revealed)

For more details on the favicon design, see [FAVICON.md](FAVICON.md).

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

## Support

For issues and questions:
1. Check the [Issues](https://github.com/YOUR_USERNAME/planning-poker/issues) page
2. Create a new issue with details about your problem
3. Include browser version and error messages

---

Built with ❤️ using Angular 17+ and Supabase