# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm start                    # Dev server at http://localhost:4200
npm run build                # Production build
npm run build:prod           # Production build with GitHub Pages base href (/planning-poker/)
npm run lint                 # ESLint

# Unit tests (Vitest)
npm test                     # Run all unit tests
npm run test:coverage        # Run with coverage (80% threshold enforced)
npm run test:ui              # Vitest UI

# E2E tests (Playwright)
npm run test:e2e             # All e2e tests (auto-starts dev server)
npm run test:e2e:smoke       # Only @smoke tagged tests
npm run test:e2e:headed      # Run with visible browser
npm run test:e2e:debug       # Debug mode
```

## Environment Setup

Before running the app, create environment files from the template:

```bash
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.template.ts src/environments/environment.prod.ts
```

Then fill in `supabaseUrl` and `supabaseAnonKey` from your Supabase project. See `SUPABASE_SETUP.md` for database schema and RLS policy setup.

## Architecture

**Angular 21 SPA** with Supabase as the backend. No Angular zones — uses `provideZonelessChangeDetection()` throughout.

### Routing
Two routes: `/` → `HomeComponent`, `/room/:id` → `RoomComponent`. All unknowns redirect to home.

### State Management
All shared state lives in `SupabaseService` as a single `WritableSignal<RoomState>`. Components consume the public readonly `state` signal. State updates are optimistic (local state updated immediately, then synced to Supabase).

### Real-Time Sync
`SupabaseService` subscribes to Postgres changes on the `participants` and `rooms` tables via a Supabase Realtime channel (`room:<roomId>`). Participant presence is maintained by a heartbeat interval (`last_seen` timestamp, 2s default). Stale participants (>10s since `last_seen`) are pruned from local state.

### Key Services
- `SupabaseService` — all room/participant state, Supabase client, heartbeat, real-time subscription
- `NetworkService` — monitors connection quality, adjusts heartbeat polling interval
- `IdleDetectionService` — detects user idle, can slow polling
- `ScreenOrientationService` — detects mobile portrait/landscape
- `PwaService` — handles SW update notifications
- `ThemeService` — light/dark theme toggle

### Components
- `HomeComponent` — create/join room form
- `RoomComponent` — main poker room; desktop shows a poker table layout, mobile shows Tinder-style swipeable cards (swipe threshold: 50px)
- `AdminPinDialogComponent` — dialog for admin PIN entry when joining as admin

### Database Schema (Supabase)
Two tables: `rooms` (id, revealed, voting_started, admin_user_id, admin_pin, admin_participates, discussion_active, discussion_min_voter, discussion_max_voter) and `participants` (room_id, user_id, name, vote, last_seen).

User identity is stored in `localStorage` as `planning-poker-userid-<roomId>` and expires after 24 hours. Admin identity is stored as `planning-poker-admin-<roomId>`.

### PWA
Uses native browser Service Worker (not Angular's `@angular/service-worker` schematic). SW registration and update handling is done manually in `PwaService`.

### CI/CD
GitHub Actions: `ci.yml` runs lint + unit tests + e2e tests. `deploy.yml` triggers after CI passes on `main`, builds with production config, and deploys to GitHub Pages. Supabase credentials are injected as GitHub secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) during the build step.

### Testing Patterns
- Unit tests use Vitest with jsdom. Coverage excludes bootstrapping files (`main.ts`, `app.routes.ts`, `app.config.ts`, `app.component.ts`).
- E2E tests live in `tests/e2e/` with shared helpers in `tests/e2e/helpers/`. Multi-user scenarios are split into dedicated spec files (`multi-user-*.spec.ts`).
- Voting cards use the extended Fibonacci sequence: `0, 1, 2, 3, 5, 8, 13, 20, 35, 50, 100, ?`
