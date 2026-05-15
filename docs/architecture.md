# Software Architecture

---

## High-level structure

```
Browser (Angular 21 SPA)
│
├── HomeComponent          /
├── RoomComponent          /room/:id
└── AdminPinDialogComponent   (dialog)
        │
        ▼
    SupabaseService  ←──── WritableSignal<RoomState>  (single source of truth)
        │
        ├── REST (PostgREST HTTP)   ──►  Supabase PostgreSQL
        └── Realtime (WebSocket)   ◄──  Supabase Realtime (WAL stream)
```

No zone.js. The entire app uses `provideZonelessChangeDetection()`.

---

## Routing

```typescript
// app.routes.ts
{ path: '',          component: HomeComponent }
{ path: 'room/:id',  component: RoomComponent }
{ path: '**',        redirectTo: '' }
```

Navigation between home and room passes `{ userName, adminPin, isCreating }` via `history.state` — no query params, no route data.

---

## State management

All shared state lives in a single `WritableSignal<RoomState>` inside `SupabaseService`. Components receive it as a readonly signal.

```typescript
// RoomState shape
{
  roomId: string
  participants: Record<string, Participant>   // keyed by user_id
  revealed: boolean
  votingStarted: boolean
  adminUserId: string
  adminParticipates: boolean
  discussionActive: boolean
  discussionMinVoter: string | null
  discussionMaxVoter: string | null
}

// Participant shape
{
  id: string
  name: string
  vote?: string
  lastSeen: number   // Unix ms
}
```

**All state mutations are optimistic**: local signal updated immediately, then async Supabase call fires. There is no loading/pending state — the UI is always consistent with the latest local write.

Components derive everything else with `computed()`:

```
participants()         = Object.values(state.participants)
participatingUsers()   = participants filtered by adminParticipates flag
votedCount()           = participatingUsers with vote != null
totalCount()           = participatingUsers.length
averageVote()          = mean of numeric votes (revealed only)
myVote()               = state.participants[currentUserId].vote
isAdmin()              = currentUserId === state.adminUserId
shouldShowVotingCards()
isVotingEnabled()
getMinMaxCandidates()
canStartDiscussion()
```

`linkedSignal<number>()` (Angular 21) tracks the mobile card carousel index, automatically syncing to `myVote()` while still allowing manual overrides.

---

## Database connection

### Credentials

```
src/environments/environment.ts        (dev — git-ignored)
src/environments/environment.prod.ts   (prod — git-ignored)
    supabaseUrl
    supabaseAnonKey
```

In CI/CD, GitHub Actions secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` are written into the environment files at build time. The files are never committed.

### Supabase client initialisation

```typescript
this.supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})
```

Supabase Auth is fully disabled — the app manages identity itself via `localStorage`.

### Two transport modes

**1. REST (PostgREST)**

All reads and writes go through PostgREST HTTP calls:

```
supabase.from('rooms').insert(...)          POST   /rest/v1/rooms
supabase.from('rooms').update(...)          PATCH  /rest/v1/rooms
supabase.from('participants').upsert(...)   PUT    /rest/v1/participants
supabase.from('participants').update(...)   PATCH  /rest/v1/participants
supabase.from('participants').delete(...)   DELETE /rest/v1/participants
supabase.from('rooms').select(...)          GET    /rest/v1/rooms
```

**2. Realtime (WebSocket)**

A persistent WebSocket subscribes to Postgres WAL change events:

```typescript
supabase.channel(`room:${roomId}`)
  .on('postgres_changes', { table: 'participants', filter: `room_id=eq.${roomId}` }, handler)
  .on('postgres_changes', { table: 'rooms',        filter: `id=eq.${roomId}` },        handler)
  .subscribe()
```

Both tables are added to the `supabase_realtime` Postgres publication. One channel per room, torn down on leave.

---

## Database schema

### `rooms`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | 8-char alphanumeric |
| `revealed` | BOOLEAN | vote visibility |
| `voting_started` | BOOLEAN | gates whether votes are accepted |
| `admin_user_id` | TEXT | matches a `participants.user_id` |
| `admin_pin` | TEXT nullable | plain-text PIN — no hashing |
| `admin_participates` | BOOLEAN | whether admin also votes |
| `discussion_active` | BOOLEAN | discussion mode flag |
| `discussion_min_voter` | TEXT nullable | selected low outlier |
| `discussion_max_voter` | TEXT nullable | selected high outlier |
| `created_at` | TIMESTAMPTZ | auto |
| `updated_at` | TIMESTAMPTZ | auto |

### `participants`

| Column | Type | Notes |
|---|---|---|
| `room_id` | TEXT | composite PK with `user_id` |
| `user_id` | TEXT | composite PK |
| `name` | TEXT | display name |
| `vote` | TEXT nullable | e.g. `"5"`, `"13"`, `"?"` |
| `last_seen` | BIGINT | Unix ms — heartbeat timestamp |
| `created_at` | TIMESTAMPTZ | auto |
| `updated_at` | TIMESTAMPTZ | auto |

Row Level Security is enabled. Policies are wide-open (`USING (true)`) — the anon key is sufficient for all operations.

Indexes: `idx_participants_room_id` on `participants(room_id)`, `idx_participants_last_seen` on `participants(last_seen)`.

---

## Identity model

User identity is local-only; no Supabase Auth.

```
localStorage["planning-poker-userid-<roomId>"]  = "user_<timestamp>_<random>"
localStorage["planning-poker-admin-<roomId>"]   = <adminUserId>
localStorage["planning-poker-username"]          = <last used name>
```

- Regular participant IDs expire after 24 hours (checked on rejoin by parsing the embedded timestamp).
- Admin ID does not expire. Re-authentication requires the PIN stored in `rooms.admin_pin`.
- Rejoining with a correct PIN sets `currentUserId = rooms.admin_user_id`, granting full admin access.

---

## Presence and heartbeat

```
startHeartbeat(roomId)
  → immediate UPDATE participants SET last_seen = Date.now()
  → setInterval(currentHeartbeatInterval)  UPDATE last_seen
  → setInterval(3s)                        prune stale participants from local state
```

**Adaptive interval** (driven by `NetworkService` → Angular `effect()`):

| Connection | Interval |
|---|---|
| 4G excellent (>5 Mbps) | 1 s |
| 4G / 3G good | 2 s (default) |
| 3G poor / 2G | 5 s |
| Offline | 10 s |
| Data Saver enabled | 5 s |

**Page Visibility API**: when the tab is hidden the interval is multiplied by 3×. Restored when the tab regains focus.

**Participant timeout**: 15 minutes (`PARTICIPANT_TIMEOUT_MS`). Participants with `last_seen = 0` (set on `beforeunload`) are pruned immediately by the cleanup interval.

Cleanup is **client-side only** — no server-side deletes during normal operation. An optional `pg_cron` job can purge rows older than 1 hour.

---

## Key services

### `SupabaseService`
- Owns the `WritableSignal<RoomState>`
- Implements `createRoom`, `joinRoom`, `leaveRoom`, `vote`, `toggleReveal`, `startVoting`, `resetVotes`, `toggleAdminParticipation`, `toggleDiscussion`, `removeParticipant`
- Manages the Realtime channel, heartbeat interval, cleanup interval, and page-visibility monitoring
- Exposes `userRemoved` signal (set when the current user is deleted by admin) — `RoomComponent` uses an `effect()` to redirect on this signal

### `NetworkService`
- Wraps the Network Information API (`navigator.connection`)
- Signals: `connectionQuality`, `effectiveType`, `isOnline`, `saveData`, `downlink`, `rtt`
- `getRecommendedPollingInterval()` returns the heartbeat interval in ms

### `IdleDetectionService`
- Wraps the Idle Detection API (Chrome/Edge 94+ only)
- Signal: `idleState` (`'active' | 'idle'`)
- Threshold configurable; default 120 s in `RoomComponent`

### `ScreenOrientationService`
- Wraps `screen.orientation.lock('landscape')`
- `autoLockForPokerTable()` only activates on mobile (viewport < 768px)
- Unlocked in `ngOnDestroy`

### `PwaService`
- Registers `/sw.js` as the Service Worker
- Detects updates via `updatefound` / `statechange` lifecycle; prompts user to reload
- `showNotification()` delegates to `ServiceWorkerRegistration.showNotification` (falls back to `new Notification()`)
- Signals: `updateAvailable`, `isInstalled`, `notificationPermission`

### `ThemeService`
- Light / dark / system toggle, persisted in `localStorage`

---

## Component responsibilities

### `HomeComponent`
- Two modes: create room (generates random 8-char ID) and join room
- Validates room existence via `supabaseService.roomExists()` before navigating
- Opens `AdminPinDialogComponent` (Material Dialog) for PIN entry
- Passes `{ userName, adminPin, isCreating }` to `RoomComponent` via `history.state`

### `RoomComponent`
- Reads `supabaseService.state` signal; derives display state via `computed()`
- Desktop: poker table layout with participants in CSS `ellipse` positions
- Mobile: Tinder-style swipeable card carousel (`linkedSignal` for index, touch start/end handlers)
- `@HostListener('window:keydown')` handles all keyboard shortcuts
- `effect()` watches `userRemoved` signal → redirects to home
- `effect()` sends desktop notifications when tab is hidden

### `AdminPinDialogComponent`
- Four modes: `create`, `join`, `verify`, `confirm`
- Returns PIN string on confirm, `null` on cancel

---

## CI/CD pipeline

```
push → main
  │
  ├── ci.yml (parallel jobs, all share one npm install + cache)
  │     ├── lint     (ESLint)
  │     ├── test     (Vitest unit tests)
  │     └── build    (ng build --configuration production)
  │
  └── deploy.yml (triggers after ci.yml succeeds)
        ├── npm ci
        ├── Inject SUPABASE_URL + SUPABASE_ANON_KEY into environment files
        ├── ng build --base-href /planning-poker/
        └── peaceiris/actions-gh-pages → publish dist/ to gh-pages branch
```

Pull requests get preview deployments via `pr-preview.yml`.

---

## PWA caching strategies (sw.js)

| Asset type | Strategy |
|---|---|
| Static assets (JS, CSS, images, fonts) | Cache-first |
| API calls and Supabase | Network-first |
| HTML pages | Stale-while-revalidate |

The Service Worker is registered manually in `main.ts` through `PwaService.register()`, not via the Angular CLI schematic.

---

## Security notes

- **No authentication**: by design — no user accounts, no sign-up friction.
- **Admin PIN**: stored as plain text in `rooms.admin_pin`. Sufficient for the threat model (casual team tooling) but not suitable for sensitive data.
- **RLS policies**: enabled but permissive. Provides structural protection against cross-room leakage only if policies are tightened.
- **Credentials**: never committed; injected at build time from GitHub secrets.
- **HTTPS**: enforced by GitHub Pages.
- **Session expiry**: regular participants expire after 24 h; no server-side enforcement, purely client-side.
