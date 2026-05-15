# Testing

---

## Frameworks

| Type | Framework | Runner |
|---|---|---|
| Unit tests | Vitest (jsdom) | `npm test` |
| E2E tests | Playwright | `npm run test:e2e` |

---

## Commands

```bash
# Unit tests
npm test                  # run all unit tests once
npm run test:coverage     # with coverage report (80% threshold enforced)
npm run test:ui           # interactive Vitest UI
npm test -- --watch       # watch mode

# E2E tests
npx playwright install    # first time only — install browsers
npm run test:e2e          # all tests across 5 browsers (auto-starts dev server)
npm run test:e2e:smoke    # @smoke tagged critical-path tests only
npm run test:e2e:headed   # run with visible browser
npm run test:e2e:debug    # step-by-step debug mode
npm run test:e2e:report   # open last HTML report
npm run test:e2e -- --grep @a11y        # accessibility tests only
npm run test:e2e -- --grep @performance # performance tests only
```

---

## Unit test coverage

**244 tests across 4 suites — 100% statement coverage**

| Metric | Result |
|---|---|
| Statements | 100% |
| Functions | 100% |
| Lines | 100% |
| Branches | 98% |

Coverage excludes bootstrapping files: `main.ts`, `app.routes.ts`, `app.config.ts`, `app.component.ts`.

### Suites

| Suite | Tests | File |
|---|---|---|
| `SupabaseService` | 109 | `src/app/services/supabase.service.spec.ts` |
| `RoomComponent` | 58 | `src/app/components/room/room.component.spec.ts` |
| `AdminPinDialogComponent` | 40 | `src/app/components/admin-pin-dialog/admin-pin-dialog.component.spec.ts` |
| `HomeComponent` | 37 | `src/app/components/home/home.component.spec.ts` |

### What is covered

- Room lifecycle: `createRoom`, `joinRoom`, `leaveRoom`
- All voting operations: `vote`, `startVoting`, `toggleReveal`, `resetVotes`
- Admin operations: participation toggle, discussion mode, participant removal, PIN verification
- Real-time subscription callbacks (participant and room changes)
- Heartbeat and stale-participant cleanup (using fake timers)
- Angular 21 features: `signal`, `linkedSignal`, `computed`, `effect`
- Edge cases: empty room ID, network errors, `beforeunload` handler, localStorage expiry

---

## E2E test coverage

**254 tests (51 test cases × 5 browsers) — 100% pass rate on runnable tests**

| Result | Count |
|---|---|
| Passed | 239 |
| Skipped | 15 (clipboard tests — headless limitation) |
| Failed | 0 |
| Duration | ~2 minutes |

**Browsers**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12 Pro)

### Test suites

#### High priority (27 test cases)

| Suite | Tests |
|---|---|
| `room-creation.spec.ts` | Create room, copy room ID, leave room |
| `room-admin-controls.spec.ts` | Admin controls, participation toggle, share button |
| `room-voting.spec.ts` | Voting cards, card selection, keyboard nav, styling |
| `room-voting-advanced.spec.ts` | Special values, reset, mobile responsiveness |
| `multi-user-sync.spec.ts` | Join, vote count sync, participant leave, reveal sync |
| `multi-user-reset.spec.ts` | Vote reset, new round |
| `multi-user-discussion.spec.ts` | Start/end discussion, auto-end on hide, identical votes |
| `multi-user-removal.spec.ts` | Remove participant, redirect, count update, admin-only UI |
| `multi-user-admin-pin.spec.ts` | Admin rejoin with PIN, wrong PIN rejection |
| `multi-user-edge-cases.spec.ts` | Non-existent room, browser refresh, multi-tab same user |
| `home.spec.ts` | Home page, form validation, create/join flow |
| `mobile.spec.ts` | Viewport, touch targets, no-zoom, orientation |

#### Moderate priority (17 test cases)

| Suite | Tests |
|---|---|
| `room-sharing.spec.ts` | Copy URL, redirect without username, invalid room in URL |
| `room-multi-round.spec.ts` | Multiple rounds, vote clearing, participant list persistence |
| `room-validation.spec.ts` | Empty ID, case sensitivity, unique IDs, whitespace trimming |
| `ui-states.spec.ts` | Button states, vote indicators, selected card, admin-only controls |

#### Specialized suites

| Suite | Tag | Tests |
|---|---|---|
| Smoke tests | `@smoke` | 12 critical-path tests for rapid CI feedback |
| Accessibility | `@a11y` | 7 WCAG tests via @axe-core/playwright |
| Performance | `@performance` | 6 tests with budgets (page load <3s, interaction <500ms, FCP <1.8s) |

---

## Mocking strategy

### Supabase client (unit tests)

```typescript
const mockSupabase = {
  from: vi.fn(),
  removeChannel: vi.fn(),
  channel: vi.fn(),
};
```

Chained builder calls are mocked per-test. This keeps tests fast and isolated from the real database.

### localStorage

```typescript
global.localStorage = {
  getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(),
  clear: vi.fn(), key: vi.fn(), length: 0
} as Storage;
```

### Timers (heartbeat / cleanup)

```typescript
vi.useFakeTimers();
await vi.advanceTimersByTimeAsync(3100);
vi.useRealTimers();
```

---

## Test patterns

All tests follow **AAA** (Arrange–Act–Assert). E2E tests use centralized helpers:

```
tests/e2e/helpers/
  cleanup.ts      cleanupTestRoom(roomId) — deletes test data after each test
  factories.ts    createTestUser(), Selectors, PerformanceBudgets, VotingCards
```

Every E2E test suite tracks created room IDs and calls `cleanupTestRoom()` in `test.afterEach()` to keep the database clean between runs.

---

## Coverage configuration (`vitest.config.ts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  reportsDirectory: './coverage',
  all: true,
  statements: 80,   // enforced threshold
  functions: 80,
  branches: 80,
  lines: 80,
  exclude: [
    'node_modules/', 'src/test-setup.ts', '**/*.spec.ts',
    'src/main.ts', 'src/app/app.routes.ts',
    'src/app/app.config.ts', 'src/app/app.component.ts'
  ]
}
```
