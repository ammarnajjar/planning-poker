# PWA and Progressive Enhancements

---

## Progressive Web App

Planning Poker is a full PWA using a **native Service Worker** (not `@angular/service-worker`, which is deprecated).

The Service Worker lives at `public/sw.js` and is registered by `PwaService.register()` in `main.ts`.

### Caching strategies

| Asset type | Strategy |
|---|---|
| Static assets (JS, CSS, images, fonts) | Cache-first |
| API calls and Supabase | Network-first |
| HTML pages | Stale-while-revalidate |

### Update mechanism

The Service Worker checks for updates on every page load and then every hour. When a new version is found:
1. `PwaService.updateAvailable` signal is set to `true`.
2. A prompt asks the user to reload. They can choose "Update Now" or dismiss.
3. On confirm: `SKIP_WAITING` message is posted to the waiting worker, then the page reloads on `controllerchange`.

### Installation

| Platform | Steps |
|---|---|
| Android / Chrome | Menu → "Add to Home screen" or "Install app" |
| iOS / Safari | Share (□↑) → "Add to Home Screen" |
| Desktop Chrome/Edge | ⊕ icon in address bar |

### iOS notes

- `apple-mobile-web-app-status-bar-style` is set to `"default"` (not `"black-translucent"`) to avoid overlapping the notch/status bar.
- `viewport-fit=cover` is **not** used so the status bar remains visible in landscape.
- CSS uses `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` for notched iPhones.
- Meta-tag changes only take effect after deleting and reinstalling the PWA.

---

## Progressive enhancements

All enhancements use feature detection and degrade gracefully when the API is unavailable.

```typescript
if ('vibrate' in navigator) { /* use it */ }
if (navigator.share)        { /* use it */ }
if ('Notification' in window) { /* use it */ }
```

---

### Keyboard shortcuts

Implemented in `RoomComponent` via `@HostListener('window:keydown')`.

| Scope | Key | Action |
|---|---|---|
| Admin | `V` | Reveal / hide votes |
| Admin | `S` | Start voting |
| Admin | `D` | Start discussion |
| Admin | `Z` | Reset votes |
| Voting | `0–9` | Quick vote |
| Voting | `?` | Vote unknown |
| Universal | `C` | Copy room ID |
| Universal | `Shift+C` | Share room URL |
| Universal | `Esc` | Leave room |

Shortcuts are suppressed inside `INPUT` / `TEXTAREA` elements and when any modifier key is held.

---

### Haptic feedback (Vibration API)

```typescript
private vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
}
```

| Action | Pattern |
|---|---|
| Vote submitted | `[30]` |
| Reveal votes | `[50, 50]` |
| Copy / share | `[30, 20, 30]` |
| Remove participant | `[100, 50, 100]` |
| Admin action | `[50]` |

**Support**: Chrome/Edge/Safari iOS/Firefox Android. Silent no-op on desktop.

---

### Web Share API

Native share sheet on mobile; clipboard fallback on desktop.

```typescript
if (navigator.share) {
  await navigator.share({ title, text, url });
} else {
  await navigator.clipboard.writeText(url);
  // iOS Safari execCommand fallback also included
}
```

---

### Desktop notifications (Notification API / SW)

Notifications are sent only when `document.hidden` is true and permission has been granted.

| Event | Notification |
|---|---|
| Voting started | "A new voting round has started!" |
| Votes revealed | "All votes have been revealed!" |
| All votes in | "All N participants have voted!" |

Notifications go through `ServiceWorkerRegistration.showNotification()` when a SW registration is available, otherwise fall back to `new Notification()`.

---

### Network Information API (adaptive polling)

`NetworkService` monitors `navigator.connection` for `effectiveType`, `downlink`, `rtt`, and `saveData`.

| Quality | Heartbeat interval |
|---|---|
| Excellent (4G >5 Mbps) | 1 s |
| Good (4G / 3G low RTT) | 2 s (default) |
| Poor (3G high RTT / 2G) | 5 s |
| Offline | 10 s |
| Data Saver enabled | 5 s |

`SupabaseService` uses an Angular `effect()` to restart the heartbeat whenever `networkService.getRecommendedPollingInterval()` changes.

**Support**: Chrome/Edge full; Firefox partial; Safari not supported (falls back to 2 s).

---

### Page Visibility API (battery optimization)

`SupabaseService.setupPageVisibilityMonitoring()` listens to `document.visibilitychange`.

- Tab **hidden** → heartbeat interval × 3
- Tab **visible** → heartbeat interval restored

Example: 2 s → 6 s when the tab is hidden.

**Support**: All modern browsers.

---

### Idle Detection API

`IdleDetectionService.startMonitoring(threshold)` wraps the Chrome-only Idle Detection API.

- Threshold: 120 s (configurable)
- Sets `idleState` signal to `'idle'` when the user is inactive or the screen is locked
- Requires explicit browser permission (`idle-detection`)
- Graceful fallback: if permission denied or API unsupported, idle detection simply does not run

**Support**: Chrome/Edge 94+ only. Not supported in Firefox or Safari.

---

### Screen Orientation API

`ScreenOrientationService.autoLockForPokerTable()` is called in `RoomComponent.ngOnInit()`.

- Only activates on mobile devices (viewport < 768px)
- Locks to `landscape` when entering a room
- Unlocks in `ngOnDestroy`

**Support**: Chrome/Edge/Firefox Mobile full; Safari iOS limited (requires fullscreen).

---

## Browser compatibility matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---|---|---|---|---|---|
| Keyboard shortcuts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ⚠️ Android | ✅ iOS | ✅ | ✅ |
| Web Share API | ✅ Mobile | ⚠️ Limited | ✅ iOS | ✅ Mobile | ✅ |
| Desktop notifications | ✅ | ✅ | ⚠️ Limited | ✅ | ⚠️ Varies |
| Network Information | ✅ | ⚠️ Limited | ❌ | ✅ | ✅ |
| Page Visibility | ✅ | ✅ | ✅ | ✅ | ✅ |
| Idle Detection | ✅ | ❌ | ❌ | ✅ | ✅ |
| Screen Orientation | ✅ Mobile | ✅ Mobile | ⚠️ Limited | ✅ Mobile | ✅ |

✅ Full  ⚠️ Partial  ❌ Not supported
