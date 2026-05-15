# Planning Poker — Overview

A production-ready Planning Poker application for agile teams to estimate story points collaboratively in real time.

**Live demo**: https://ammarnajjar.github.io/planning-poker/
**Repository**: https://github.com/ammarnajjar/planning-poker

---

## What it does

During sprint planning, team members vote simultaneously on effort estimates using story-point cards. Votes are hidden until the admin reveals them all at once, eliminating anchoring bias. The admin can then facilitate a discussion between the participants who gave the lowest and highest estimates.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | Angular 21 (Standalone Components, zoneless) |
| State management | Angular Signals + `linkedSignal()` |
| Backend / database | Supabase (PostgreSQL + Realtime) |
| UI library | Angular Material |
| Styling | SCSS |
| PWA | Native Service Worker (not `@angular/service-worker`) |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

---

## Key features

### Voting
- Extended Fibonacci cards: `0, 1, 2, 3, 5, 8, 13, 20, 35, 50, 100, ?`
- Cards are face-down until admin reveals; participants cannot see others' votes until reveal
- Average calculated from numeric votes (excludes `?` and non-participating admin)
- Voting locked once revealed; participants cannot change votes
- `?` is pre-selected by default

### Room management
- 8-character random alphanumeric room IDs
- Rooms can only be created, not joined into existence
- Room existence validated before navigation
- Optional admin PIN for persistent admin re-access
- Regular participant sessions expire after 24 hours; admin sessions do not

### Admin controls
- Optional participation toggle (facilitate only, or vote alongside team)
- Start Voting — clears previous votes and opens a new round
- Reveal / Hide votes with 3D card-flip animation
- Discussion Mode — randomly highlights one lowest and one highest voter
- Reset Votes — returns all participants to unvoted state
- Remove participant — silently redirects removed user to home

### Real-time sync
- Live updates via Supabase Realtime (WebSocket / Postgres WAL)
- Presence via heartbeat: `last_seen` updated every 2 seconds
- Stale participants (inactive >15 minutes) pruned from local state

### Progressive enhancements
- Keyboard shortcuts (admin: `V/S/D/Z`; voting: `0–9/?`; universal: `C/Shift+C/Esc`)
- Haptic feedback via Vibration API
- Native share sheet via Web Share API with clipboard fallback
- Desktop push notifications for voting events when tab is hidden
- Adaptive heartbeat polling based on Network Information API
- 3× polling slowdown when tab hidden (Page Visibility API)
- Idle detection badge (Chrome/Edge only)
- Auto landscape lock on mobile (Screen Orientation API)

### UI / UX
- **Desktop (≥768px)**: Immersive green-felt poker table; participants arranged in an ellipse; animated poker cards appear on reveal
- **Mobile (<768px)**: Tinder-style swipeable card carousel with dot indicators
- Light / dark / system theme toggle
- iOS safe-area support for notched iPhones

### PWA
- Installable on Android, iOS, and desktop
- Cache-first strategy for static assets; network-first for API calls; stale-while-revalidate for HTML
- Automatic update detection with user-controlled reload prompt
- Offline support for previously loaded content

---

## Voting cards

```
0   1   2   3   5   8   13   20   35   50   100   ?
```

---

## Browser support

| Browser | Support |
|---|---|
| Chrome / Edge (latest) | Full |
| Firefox (latest) | Full |
| Safari (latest) | Full |
| iOS Safari | Full |
| Chrome Mobile | Full |

---

## Version history (summary)

| Version | Date | Highlights |
|---|---|---|
| v1.3.1 | 2026-03-06 | Participant timeout extended to 15 min; all deps updated |
| v1.3.0 | 2026-02-16 | Native PWA, progressive enhancements, dark mode, keyboard shortcuts |
| v1.2.0 | 2026-02-14 | Playwright E2E suite (254 tests, 5 browsers); optimistic UI updates |
| v1.1.0 | 2026-02-13 | Angular 21 upgrade; `linkedSignal()`; 244 unit tests at 100% coverage |
| v1.0.0 | 2026-02-12 | Initial release: poker table layout, discussion mode, mobile swipe cards |
