# Progressive Enhancements

This document describes the progressive enhancements implemented in Planning Poker to improve user experience on modern browsers while maintaining functionality on older browsers.

## Quick Wins Implemented

### 1. Keyboard Shortcuts ⌨️

Power users can use keyboard shortcuts for faster navigation and actions.

#### Admin Shortcuts (Room Creators Only)
- `R` - Reveal/Hide votes
- `S` - Start new voting round
- `D` - Start discussion mode (highlight min/max voters)
- `Z` - Reset all votes

#### Voting Shortcuts (Participants)
- `0-9` - Quick vote on card at position (0=first card, 9=ninth card)
- `?` - Vote "?" (unknown)

#### Universal Shortcuts (All Users)
- `C` - Copy room ID to clipboard
- `Shift+C` - Share room URL (opens native share or copies to clipboard)
- `Esc` - Leave room

**Notes:**
- Shortcuts are ignored when typing in input fields
- All shortcuts include haptic feedback on supported devices

---

### 2. Vibration API 📳

Haptic feedback for tactile confirmation of user actions (mobile devices).

#### Vibration Patterns
- **Vote submitted**: 30ms pulse
- **Reveal votes**: Double pulse (50ms, 50ms)
- **Copy/Share**: Triple pulse (30ms, 20ms, 30ms)
- **Remove participant**: Warning pattern (100ms, 50ms, 100ms)
- **Admin actions**: 50ms pulse

**Browser Support:**
- Chrome/Edge: ✅ Full support
- Safari iOS: ✅ Full support
- Firefox Android: ✅ Full support
- Desktop browsers: ⚠️ No-op (gracefully ignored)

**Implementation:**
```typescript
// Progressive enhancement - checks for support
if ('vibrate' in navigator) {
  navigator.vibrate([30, 20, 30]);
}
```

---

### 3. Web Share API 🔗

Native share sheet on mobile devices with clipboard fallback.

#### Features
- **Primary**: Native share UI on mobile (Android/iOS)
- **Fallback**: Clipboard copy on desktop or unsupported browsers
- Includes room title, description, and full URL
- User can choose where to share (WhatsApp, Slack, Email, etc.)

#### Usage
Click the "Share" button in the room toolbar, or use `Shift+C` keyboard shortcut.

**Browser Support:**
- Chrome/Edge Mobile: ✅ Native share sheet
- Safari iOS: ✅ Native share sheet
- Desktop browsers: ⚠️ Falls back to clipboard copy
- Firefox Mobile: ⚠️ Limited support, falls back to clipboard

**Implementation:**
```typescript
if (navigator.share) {
  await navigator.share({
    title: 'Planning Poker Room',
    text: `Join my Planning Poker room: ${roomId}`,
    url: roomUrl,
  });
} else {
  // Fallback to clipboard
  await navigator.clipboard.writeText(roomUrl);
}
```

---

### 4. Desktop Notifications 🔔

Background notifications for critical game events when tab is not focused.

#### Notification Triggers
- **Voting Started**: When admin starts a new voting round
- **Votes Revealed**: When admin reveals all votes
- **All Votes In**: When 100% of participants have voted

**Smart Behavior:**
- Only shown when page is **hidden** (not focused)
- Requires user permission (requested once)
- Uses Service Worker for reliability
- Includes app icon and badge
- Click notification to focus the app

**Browser Support:**
- Chrome/Edge Desktop: ✅ Full support
- Firefox Desktop: ✅ Full support
- Safari macOS: ⚠️ Limited support
- Mobile browsers: ⚠️ Varies by OS

**Permission Request:**
The app will request notification permission automatically. Users can also:
- Enable in browser settings: `Settings > Notifications > planning-poker`
- Disable anytime without breaking functionality

---

## Feature Detection

All progressive enhancements use feature detection to ensure graceful degradation:

```typescript
// Vibration API
if ('vibrate' in navigator) { /* use feature */ }

// Web Share API
if (navigator.share) { /* use feature */ }

// Notifications API
if ('Notification' in window) { /* use feature */ }

// Clipboard API
if (navigator.clipboard) { /* use feature */ }
```

## Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Keyboard Shortcuts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ⚠️ Android only | ✅ iOS | ✅ | ✅ |
| Web Share API | ✅ Mobile | ⚠️ Limited | ✅ iOS | ✅ Mobile | ✅ |
| Desktop Notifications | ✅ | ✅ | ⚠️ Limited | ✅ | ⚠️ Varies |
| Network Information | ✅ | ⚠️ Limited | ❌ | ✅ | ✅ |
| Page Visibility | ✅ | ✅ | ✅ | ✅ | ✅ |
| Idle Detection | ✅ | ❌ | ❌ | ✅ | ✅ |
| Screen Orientation | ✅ Mobile | ✅ Mobile | ⚠️ Limited | ✅ Mobile | ✅ |

✅ Full support
⚠️ Partial support
❌ Not supported (falls back gracefully)

---

## Testing Progressive Enhancements

### Keyboard Shortcuts
1. Join a room as admin
2. Press `S` to start voting (no mouse needed)
3. Press `R` to reveal votes
4. Press `C` to copy room ID
5. Press `Esc` to leave

### Vibration API (Mobile)
1. Open app on mobile device
2. Vote on a card - feel short pulse
3. Admin: Reveal votes - feel double pulse
4. Copy room ID - feel triple pulse pattern

### Web Share API (Mobile)
1. Open app on mobile browser
2. Click "Share" button in toolbar
3. Native share sheet should appear
4. Choose app to share with (WhatsApp, Slack, etc.)

### Desktop Notifications
1. Open room in one tab
2. Switch to another tab (hide the room tab)
3. Have someone start voting in the room
4. You should see a notification

### Network Information API
1. **Chrome DevTools Network Throttling:**
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - Click "Online" dropdown at top
   - Select "Fast 3G" or "Slow 3G"
   - Check browser console for polling interval changes
   - Expected: `[Supabase] Adjusting heartbeat interval to 5000ms (poor connection)`

2. **Connection Quality Indicator:**
   - Throttle network to "Slow 3G"
   - Look at room toolbar - should see warning icon (signal bars)
   - Icon should pulse orange/red
   - Hover to see connection description

3. **Data Saver Mode:**
   - Chrome: Settings → Privacy and security → Enable "Data Saver"
   - Check console for 5-second polling interval
   - Expected: Respects data saver preference

### Page Visibility API
1. **Tab Switching:**
   - Open room in Chrome
   - Open DevTools console (F12)
   - Join the room (start heartbeat)
   - Switch to another tab
   - Check console: `[Supabase] Page visibility changed: hidden`
   - Check console: `[Supabase] Reducing polling rate to 6000ms` (or 3x current rate)
   - Switch back to room tab
   - Check console: `[Supabase] Page visibility changed: visible`
   - Check console: `[Supabase] Restoring polling rate to 2000ms`

2. **Battery Impact Test:**
   - Open room on mobile device
   - Let it run for 5 minutes in foreground
   - Note battery drain
   - Switch to another app (room tab hidden)
   - Let it run for 5 minutes in background
   - Battery drain should be significantly less (3x reduction in polling)

3. **Minimize Window:**
   - Open room
   - Minimize browser window completely
   - Page should detect as hidden and reduce polling
   - Restore window - polling should return to normal

### Idle Detection API
1. **Chrome/Edge Only (Permission Required):**
   - Open room in Chrome or Edge
   - Console should show permission request
   - If prompted, allow "idle detection" permission
   - Stay inactive (don't touch mouse/keyboard) for 2+ minutes
   - After 2 minutes, check toolbar - idle icon (eye-off) should appear
   - Icon should pulse gray
   - Move mouse or type - icon should disappear

2. **Permission Denied Test:**
   - Open room in Chrome
   - When prompted, deny permission
   - Check console: `[IdleDetection] Permission denied`
   - No idle detection should occur (graceful fallback)

3. **Screen Lock Test:**
   - Open room on laptop with Chrome
   - Allow idle detection permission
   - Lock your screen (Windows: Win+L, Mac: Cmd+Ctrl+Q)
   - User should be marked as idle immediately
   - Unlock screen - should return to active

### Screen Orientation API
1. **Mobile Device - Portrait to Landscape:**
   - Open room on mobile device (phone)
   - Hold device in portrait mode
   - Join/create room
   - Check console: `[ScreenOrientation] Locked to landscape`
   - Device should auto-rotate to landscape (if auto-rotate enabled)
   - Leave room
   - Check console: `[ScreenOrientation] Orientation unlocked`
   - Device can now rotate freely again

2. **Mobile Device - Already Landscape:**
   - Hold device in landscape mode
   - Join/create room
   - Check console - should see no lock message (already in desired orientation)
   - Device stays in landscape

3. **Desktop Test:**
   - Open room on desktop browser
   - Check console - no orientation locking should occur
   - Check: `isMobileDevice()` returns false
   - Feature is disabled on desktop (screen size > 768px)

4. **Tablet Test:**
   - Open room on tablet (iPad, Android tablet)
   - If screen < 768px, should lock to landscape
   - If screen >= 768px, no lock

5. **Safari iOS Test:**
   - Open room on iPhone Safari
   - Note: Lock may fail (limited support)
   - Check console for error message
   - App should work normally despite failure (graceful fallback)

---

### 5. Network Information API 📶

Adaptive polling based on connection quality for optimal performance.

#### Features
- **Connection monitoring**: Detects 2G/3G/4G connection types
- **Adaptive polling**: Automatically adjusts heartbeat frequency
- **Visual indicator**: Shows connection status when poor/offline
- **Data saver mode**: Respects user's data saver setting

#### Polling Intervals by Connection Quality
- **Excellent** (4G, >5 Mbps): 1 second - fast real-time updates
- **Good** (4G, 3G with low latency): 2 seconds - normal updates
- **Poor** (3G with high latency, 2G): 5 seconds - reduced bandwidth
- **Offline**: 10 seconds - minimal polling for reconnection
- **Data Saver Enabled**: 5 seconds - respects user preference

**Smart Behavior:**
- Monitors `effectiveType`, `downlink`, and `rtt` (round-trip time)
- Automatically restarts heartbeat with new interval when connection changes
- Shows warning icon in toolbar when connection is poor/offline
- Falls back to standard 2-second polling if API not supported

**Browser Support:**
- Chrome/Edge: ✅ Full support
- Firefox: ⚠️ Limited support (effectiveType only)
- Safari: ❌ Not supported (falls back to good connection)

**Implementation:**
```typescript
// Monitor connection quality and adjust polling
effect(() => {
  const interval = this.networkService.getRecommendedPollingInterval();
  const quality = this.networkService.connectionQuality();

  if (this.currentHeartbeatInterval !== interval) {
    this.restartHeartbeatWithNewInterval(interval);
  }
});
```

---

### 6. Page Visibility API ⚡

Battery optimization by reducing polling when tab is hidden.

#### Features
- **Automatic detection**: Monitors when tab loses/gains focus
- **Adaptive polling**: Reduces heartbeat frequency by 3x when hidden
- **Battery saving**: Significant battery improvement on mobile
- **Seamless transitions**: Automatically restores normal polling when visible

#### Polling Behavior
- **Visible**: Normal polling (network-adaptive: 1-5s)
- **Hidden**: 3x slower polling (3-15s depending on network)
- **Example**: 2s → 6s when tab is hidden

**Smart Behavior:**
- Monitors `document.hidden` state
- Combines with Network Information API for optimal intervals
- Automatically adjusts when switching tabs
- Preserves real-time updates while saving battery

**Browser Support:**
- All modern browsers: ✅ Full support
- IE11+: ✅ Full support

---

### 7. Idle Detection API 💤

Show user status when idle (away from keyboard/screen).

#### Features
- **Idle detection**: Monitors user activity and screen state
- **Visual indicator**: Shows "idle" icon in toolbar when away
- **Configurable threshold**: Default 2 minutes (120 seconds)
- **Permission-based**: Requires user permission

#### Idle States
- **Active**: User is interacting with device
- **Idle**: User inactive for threshold duration OR screen locked
- **Visual**: Eye-off icon appears in toolbar

**Smart Behavior:**
- Monitors both user activity and screen state
- Respects user privacy with explicit permission
- Helpful for team awareness in large rooms
- Falls back gracefully if permission denied

**Browser Support:**
- Chrome/Edge 94+: ✅ Full support
- Firefox: ❌ Not supported
- Safari: ❌ Not supported

---

### 8. Screen Orientation API 📱

Automatically lock to landscape for better poker table view on mobile.

#### Features
- **Auto-lock**: Automatically locks to landscape on mobile devices
- **Better UX**: Poker table looks better in landscape orientation
- **Smart detection**: Only activates on mobile (< 768px)
- **Auto-unlock**: Unlocks when leaving room

#### Orientation Behavior
- **Mobile + Portrait**: Auto-locks to landscape when entering room
- **Mobile + Landscape**: No action needed
- **Desktop**: No orientation lock (not needed)
- **On leave**: Automatically unlocks orientation

**Smart Behavior:**
- Only affects mobile devices (tablets and phones)
- Respects current orientation (no lock if already landscape)
- Auto-cleanup prevents orientation from staying locked
- Falls back silently if not supported

**Browser Support:**
- Chrome/Edge Mobile: ✅ Full support
- Safari iOS: ⚠️ Limited (requires fullscreen)
- Firefox Mobile: ✅ Full support

---

## Future Enhancements (Not Yet Implemented)

### Medium Priority
- **Badge API**: Show vote count on PWA icon
- **Fullscreen API**: Immersive mode for team displays

### Low Priority
- **IndexedDB**: Store room history
- **Periodic Sync**: Background data cleanup
- **Screen Wake Lock**: Keep screen on during voting

---

## Technical Implementation

### Files Modified
- [src/app/components/room/room.component.ts](src/app/components/room/room.component.ts) - Keyboard shortcuts, vibration, Web Share, connection indicator, idle indicator, orientation
- [src/app/services/pwa.service.ts](src/app/services/pwa.service.ts) - Desktop notifications
- [src/app/services/network.service.ts](src/app/services/network.service.ts) - Network quality monitoring
- [src/app/services/supabase.service.ts](src/app/services/supabase.service.ts) - Adaptive polling based on network, page visibility
- [src/app/services/idle-detection.service.ts](src/app/services/idle-detection.service.ts) - Idle state detection
- [src/app/services/screen-orientation.service.ts](src/app/services/screen-orientation.service.ts) - Screen orientation management

### Key Methods
- `handleKeyboardShortcut()` - Keyboard event handler with @HostListener
- `vibrate()` - Vibration API wrapper with feature detection
- `shareRoom()` - Web Share API with clipboard fallback
- `showNotification()` - Desktop notification through Service Worker
- `getRecommendedPollingInterval()` - Network-based polling interval calculation
- `updateConnectionInfo()` - Monitor connection quality changes
- `setupPageVisibilityMonitoring()` - Monitor tab visibility for battery optimization
- `startMonitoring()` - Start idle detection with configurable threshold
- `lockToLandscape()` - Lock screen orientation to landscape
- `autoLockForPokerTable()` - Auto-lock on mobile devices

---

## User Experience Impact

**Before:**
- Mouse-only navigation
- No tactile feedback
- Share requires manual URL copy
- Miss events when tab is hidden

**After:**
- ⚡ Power users can navigate without mouse
- 📳 Tactile confirmation on mobile
- 🔗 Native share UI on mobile
- 🔔 Desktop notifications for critical events

**Result:** Faster, more responsive, more engaging user experience with zero breaking changes for older browsers.
