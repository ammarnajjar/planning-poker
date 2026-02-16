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

---

## Future Enhancements (Not Yet Implemented)

### Medium Priority
- **Page Visibility API**: Pause heartbeats when tab is hidden (battery saving)
- **Badge API**: Show vote count on PWA icon
- **Fullscreen API**: Immersive mode for team displays

### Low Priority
- **IndexedDB**: Store room history
- **Periodic Sync**: Background data cleanup
- **Screen Wake Lock**: Keep screen on during voting

---

## Technical Implementation

### Files Modified
- [src/app/components/room/room.component.ts](src/app/components/room/room.component.ts) - Keyboard shortcuts, vibration, Web Share
- [src/app/services/pwa.service.ts](src/app/services/pwa.service.ts) - Desktop notifications

### Key Methods
- `handleKeyboardShortcut()` - Keyboard event handler with @HostListener
- `vibrate()` - Vibration API wrapper with feature detection
- `shareRoom()` - Web Share API with clipboard fallback
- `showNotification()` - Desktop notification through Service Worker

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
