# PWA Testing Guide

## Prerequisites

```bash
# Build production version
npm run build

# Serve locally
npx http-server dist/planning-poker/browser -p 8080
```

Open http://localhost:8080 in Chrome

## Test 1: Service Worker Registration

### Steps:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in sidebar

### Expected Result:
✅ Status: "activated and is running"
✅ Source: `sw.js`
✅ Scope: "/"

### Console Check:
```javascript
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
// Should show 1 registration
```

## Test 2: Caching

### Steps:
1. Open **Application** → **Cache Storage**
2. Expand `planning-poker-v1.2.3`

### Expected Result:
✅ See cached files:
- `/`
- `/index.html`
- `/favicon.ico`
- `/manifest.webmanifest`

### Test Cache-First Strategy:
1. Load page (Network tab shows initial requests)
2. Refresh page
3. Check Network tab - requests show ⚙️ icon (from Service Worker)
4. Toggle offline (Network tab → Offline)
5. Refresh - page still loads!

## Test 3: Update Notification

### Steps:
1. Keep first tab open with app running
2. Open `public/sw.js` in editor
3. Change `CACHE_VERSION`:
   ```javascript
   const CACHE_VERSION = 'v1.2.4'; // Changed from v1.2.3
   ```
4. Rebuild: `npm run build`
5. In another terminal, restart the server
6. In the browser tab, wait ~10 seconds or refresh

### Expected Result:
✅ Update banner appears at bottom
✅ Shows: "A new version is available!"
✅ Buttons: "Later" and "Update Now"

### Test Update Actions:
- Click "Later" → Banner dismisses
- Refresh page → Banner appears again (update still pending)
- Click "Update Now" → Page reloads with new version

## Test 4: PWA Installation

### Desktop (Chrome/Edge):
1. Look for install icon in address bar (⊕ or download icon)
2. Or: DevTools → Application → Manifest → "Add to homescreen"

### Expected Result:
✅ Install prompt appears
✅ After install, app opens in standalone window (no browser UI)

### Mobile (Chrome Android):
1. Open menu → "Add to Home screen" or "Install app"

### Verify Installation:
```javascript
// In console
window.matchMedia('(display-mode: standalone)').matches
// Should return true if installed
```

## Test 5: Offline Functionality

### Steps:
1. Load app normally
2. Navigate to a room
3. Open DevTools → Network tab
4. Select "Offline" mode
5. Refresh page

### Expected Result:
✅ Page loads from cache
✅ UI is visible
⚠️ API calls fail (expected - Supabase needs network)

## Test 6: Different Caching Strategies

### Test Cache-First (Static Assets):
```javascript
// In DevTools Network tab, filter by JS/CSS
// After first load, these should show "from ServiceWorker"
```

### Test Network-First (API Calls):
```javascript
// Supabase requests should always try network first
// Only fallback to cache when offline
```

### Test Stale-While-Revalidate (HTML):
```javascript
// HTML pages return cached version immediately
// Then update in background for next visit
```

## Test 7: Update Check Frequency

### Automatic Checks:
- On page load
- Every 1 hour (configured in pwa.service.ts)
- On navigation

### Manual Check:
```javascript
// In console
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});
```

## Test 8: Push Notifications (Future)

Service Worker is ready for push notifications:

```javascript
// Check permission
console.log('Notification permission:', Notification.permission);

// Request permission
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

## Test 9: Multiple Tabs

### Steps:
1. Open app in 2 tabs
2. Make change and rebuild
3. First tab shows update notification
4. Second tab also shows notification

### Expected Result:
✅ Both tabs detect update
✅ Clicking "Update Now" in either tab reloads both

## Test 10: Service Worker Lifecycle

### Install → Activate → Fetch:

```javascript
// Check lifecycle state
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Installing:', reg.installing);
  console.log('Waiting:', reg.waiting);
  console.log('Active:', reg.active);
});
```

## Common Issues

### Issue: Service Worker not registering
**Solution:**
- Must use HTTPS or localhost
- Check console for errors
- Try hard refresh (Ctrl+Shift+R)

### Issue: Update not detected
**Solution:**
- Wait up to 1 hour (auto-check interval)
- Manual update: DevTools → Application → Service Workers → Update
- Or rebuild with different version

### Issue: Cache not clearing
**Solution:**
- Version change triggers cleanup automatically
- Manual: DevTools → Application → Clear storage

### Issue: "Controller is null"
**Solution:**
- First visit requires refresh to activate
- Or use `skipWaiting()` in Service Worker (already configured)

## Debugging Commands

```javascript
// List all caches
caches.keys().then(names => console.log('Caches:', names));

// Clear specific cache
caches.delete('planning-poker-v1.2.3');

// Clear all caches
caches.keys().then(names =>
  Promise.all(names.map(name => caches.delete(name)))
);

// Unregister Service Worker
navigator.serviceWorker.getRegistrations().then(registrations =>
  Promise.all(registrations.map(r => r.unregister()))
);

// Check PWA install status
console.log('Installed:', window.matchMedia('(display-mode: standalone)').matches);
```

## Production Testing

### Test on Real Device:
1. Deploy to GitHub Pages or hosting
2. Must be HTTPS
3. Open on mobile device
4. Test install prompt
5. Test offline mode
6. Test update notification

### Chrome Lighthouse:
```bash
# Run Lighthouse PWA audit
npx lighthouse http://localhost:8080 --view
```

Expected scores:
- ✅ PWA badge
- ✅ Installable
- ✅ Works offline
- ✅ Has service worker

## Clean Up After Testing

```bash
# Remove Service Worker
# In DevTools: Application → Service Workers → Unregister

# Or in console:
navigator.serviceWorker.getRegistrations().then(r => r[0].unregister());

# Clear all caches
# DevTools: Application → Storage → Clear site data
```

---

## Quick Test Script

```javascript
// Run this in DevTools console for quick diagnostics
(async function testPWA() {
  console.log('=== PWA Diagnostics ===');

  // Service Worker
  const reg = await navigator.serviceWorker.getRegistration();
  console.log('✓ Service Worker:', reg ? 'Registered' : '✗ Not registered');

  // Cache
  const caches = await caches.keys();
  console.log('✓ Caches:', caches.length);

  // Install status
  const installed = window.matchMedia('(display-mode: standalone)').matches;
  console.log('✓ Installed:', installed ? 'Yes' : 'No');

  // Notifications
  console.log('✓ Notifications:', Notification.permission);

  console.log('===================');
})();
```
