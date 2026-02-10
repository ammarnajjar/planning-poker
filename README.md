# Planning Poker

A truly zero-cost, production-ready Planning Poker application built with Angular 17+ and Gun.js for decentralized peer-to-peer synchronization.

## Features

- **Zero Cost**: No backend, no API keys, no quotas - fully peer-to-peer using Gun.js
- **Real-Time Sync**: Decentralized state synchronization across all participants
- **Modern Stack**: Angular 17+ with Standalone Components and Signals
- **Responsive Design**: Mobile-first UI with Angular Material
- **GitHub Pages**: Free static hosting with automated deployments

## Tech Stack

- **Frontend**: Angular 17+ (Standalone Components)
- **State Management**: Angular Signals
- **Real-Time Sync**: Gun.js (P2P decentralized database)
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

3. Install Gun.js:
```bash
npm install gun
npm install --save-dev @types/gun
```

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
4. Share the generated Room ID with your team

### Joining a Room

1. Go to the home page
2. Enter your name
3. Click "Join Existing Room"
4. Enter the Room ID shared by your team
5. Click "Join Room"

### Voting

1. Once in a room, select a card value (Fibonacci: 0, 1, 2, 3, 5, 8, 13, 21, ?)
2. Your vote will be hidden from others until revealed
3. Wait for all participants to vote
4. Click "Reveal Votes" to show all votes
5. View the average calculation (excluding "?" votes)
6. Click "Reset Votes" to start a new round

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
│   │   │   └── gun.service.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── .github/
│   └── workflows/
│       └── deploy.yml
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### GunService

The `GunService` handles all Gun.js interactions and exposes Angular Signals for reactive state management:

- **State Management**: Uses `WritableSignal<RoomState>` for reactive updates
- **P2P Sync**: Connects to public Gun.js relay peers
- **Heartbeat**: Sends periodic updates to show active participants
- **Real-Time Updates**: Automatically syncs votes, participants, and reveal state

### Components

#### HomeComponent
- Create new rooms with random alphanumeric IDs
- Join existing rooms by entering a Room ID
- Input validation for user name

#### RoomComponent
- Display participants and their voting status
- Fibonacci voting cards (0, 1, 2, 3, 5, 8, 13, 21, ?)
- Reveal/hide votes toggle
- Reset votes functionality
- Average calculation using computed signals
- Copy Room ID to clipboard

## Gun.js Configuration

The application uses free public Gun.js relay peers for cross-browser and cross-machine synchronization:
- `https://gun-manhattan.herokuapp.com/gun`
- `https://relay.peer.ooo/gun`
- `https://gun-us.herokuapp.com/gun`
- `https://gunjs.herokuapp.com/gun`

Data is stored under the node key: `poker-room/<roomId>`

### Synchronization Mechanisms

The app uses two complementary sync mechanisms:

1. **BroadcastChannel** (Same Browser, Different Tabs)
   - Fast, reliable sync between tabs in the same browser
   - Works offline and without relay peers
   - Instant updates within the same browser instance

2. **Gun.js Relay Peers** (Cross-Browser & Cross-Machine)
   - Enables sync between different browsers
   - Enables sync between different machines
   - Requires at least one working relay peer
   - Works across the internet

**Note**: In local development, if relay peers are unavailable, sync will only work between tabs of the same browser. Once deployed to GitHub Pages and accessed from public URLs, relay peer connectivity typically improves.

## State Management

The application uses Angular Signals for reactive state management:

- **Room State Signal**: Central state containing participants, votes, and reveal status
- **Computed Signals**: Derived values like average vote, participant count, and voted count
- **Automatic Reactivity**: UI updates automatically when Gun.js pushes state changes

## Mobile Support

The application is fully responsive with mobile-first design:
- Touch-friendly voting cards
- Responsive grid layouts
- Mobile-optimized navigation
- Adaptive typography and spacing

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

### Gun.js Connection Issues

If you experience sync issues:
1. Check your internet connection
2. Ensure the Gun.js relay peers are accessible
3. Try refreshing the page
4. Check browser console for errors

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

## Future Enhancements

Possible improvements:
- Timer for voting rounds
- Custom card values
- Room password protection
- Vote history and statistics
- Export results to CSV
- Multiple voting rounds tracking
- Spectator mode
- Custom themes

## Support

For issues and questions:
1. Check the [Issues](https://github.com/YOUR_USERNAME/planning-poker/issues) page
2. Create a new issue with details about your problem
3. Include browser version and error messages

---

Built with ❤️ using Angular 17+ and Gun.js