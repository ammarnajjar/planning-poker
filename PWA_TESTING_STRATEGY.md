# PWA Testing Strategy

## Overview

Testing PWA features requires a multi-layered approach because Service Workers run in a separate context from your application and involve browser APIs that are difficult to fully mock.

## Testing Pyramid for PWA

```
         Manual Testing (Real devices, browsers)
                 ↑
           E2E Tests (Playwright)
                 ↑
           Unit Tests (Vitest)
```

## 1. Unit Tests (Vitest) ✅

**Purpose:** Test isolated logic in PwaService

**What to test:**
- ✅ Service initialization
- ✅ Signal state management (updateAvailable, isInstalled)
- ✅ Method calls with mocked browser APIs
- ✅ Error handling

**What NOT to test:**
- ❌ Actual Service Worker behavior
- ❌ Real caching strategies
- ❌ Network interception
- ❌ Browser install prompts

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run PWA service tests only
npm test -- pwa.service.spec.ts

# Watch mode
npm test -- --watch
```

### Example Unit Test

```typescript
it('should register Service Worker', async () => {
  const mockRegister = vi.fn().mockResolvedValue(mockRegistration);
  navigator.serviceWorker.register = mockRegister;

  await service.register();

  expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
});
```

### Limitations

- Cannot test actual Service Worker lifecycle
- Cannot test real caching behavior
- Cannot test offline functionality
- Must heavily mock browser APIs

## 2. E2E Tests (Playwright) ⭐ Recommended

**Purpose:** Test PWA features in a real browser environment

**What to test:**
- ✅ Service Worker registration
- ✅ Service Worker activation
- ✅ Caching behavior
- ✅ Offline functionality
- ✅ Manifest validation
- ✅ PWA icons availability
- ✅ Update notifications (with limitations)

**What's difficult:**
- ⚠️ Install prompt (browser-specific)
- ⚠️ Update detection (requires deployment)
- ⚠️ Push notifications (requires subscription)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run PWA tests only
npx playwright test pwa.spec.ts

# Run with UI
npm run test:e2e:ui

# Debug mode
npx playwright test pwa.spec.ts --debug
```

### Example E2E Test

```typescript
test('should register Service Worker', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  const swRegistered = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined;
  });

  expect(swRegistered).toBe(true);
});
```

### Testing Offline Mode

```typescript
test('should work offline', async ({ page, context }) => {
  // Load with network
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Go offline
  await context.setOffline(true);

  // Reload
  await page.reload();

  // Should still work
  await expect(page.locator('app-root')).toBeVisible();
});
```

## 3. Manual Testing ⭐ Essential

**Purpose:** Test real-world PWA behavior on actual devices

**What to test:**
- ✅ Install prompt on different browsers
- ✅ Installation process (Android, iOS, Desktop)
- ✅ Standalone app window
- ✅ App icon on home screen
- ✅ Splash screen
- ✅ Update notification flow
- ✅ Offline functionality
- ✅ Push notifications (when implemented)

### Manual Test Checklist

#### Desktop (Chrome/Edge)

- [ ] Install prompt appears
- [ ] Click install → App installs
- [ ] App opens in standalone window (no browser UI)
- [ ] App icon appears in OS app list
- [ ] Offline mode works
- [ ] Update notification appears after new deployment
- [ ] Click "Update Now" → App updates
- [ ] Uninstall works correctly

#### Android (Chrome)

- [ ] "Add to Home screen" in menu
- [ ] Install prompt appears (if eligible)
- [ ] App icon on home screen
- [ ] App opens in standalone mode
- [ ] Splash screen shows correct icon
- [ ] Offline mode works
- [ ] Update notification appears
- [ ] Uninstall from app drawer works

#### iOS (Safari)

- [ ] "Add to Home Screen" in share menu
- [ ] App icon on home screen (correct size)
- [ ] App opens standalone
- [ ] Status bar style correct
- [ ] Offline mode works (limited)
- [ ] Update notification appears
- [ ] Uninstall by removing icon works

### Testing Update Flow

1. **Deploy version 1:**
   ```bash
   npm run build
   # Deploy to hosting
   ```

2. **Install PWA on device**

3. **Change version in sw.js:**
   ```javascript
   const CACHE_VERSION = 'v1.2.4'; // Was v1.2.3
   ```

4. **Deploy version 2**

5. **Open installed PWA**
   - Wait ~1 hour (automatic check)
   - Or navigate/reload (triggers check)

6. **Verify update banner appears**

7. **Click "Update Now"**
   - App should reload
   - New version should be active

## 4. Specialized PWA Testing Tools

### Lighthouse PWA Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run PWA audit
lighthouse http://localhost:8080 --view

# Check for:
# - Installable
# - Works offline
# - Has service worker
# - Has manifest
# - Has icons
```

### Chrome DevTools

**Service Worker Panel:**
- Application → Service Workers
- View status, scope, source
- Force update
- Unregister
- Simulate update

**Cache Storage:**
- Application → Cache Storage
- View cached resources
- Delete caches
- Inspect cached responses

**Manifest:**
- Application → Manifest
- View parsed manifest
- Validate icons
- Test "Add to homescreen"

### Firefox Developer Tools

**Service Workers:**
- about:debugging → This Firefox → Service Workers
- Start/stop/unregister
- View scope and status

**Storage:**
- Storage → Cache Storage
- View cached content

## Testing Best Practices

### 1. Test Service Worker Registration

```typescript
test('Service Worker should register on app load', async ({ page }) => {
  await page.goto('/');
  const registered = await page.evaluate(() => {
    return 'serviceWorker' in navigator;
  });
  expect(registered).toBe(true);
});
```

### 2. Test Caching Strategy

```typescript
test('Static assets should be cached', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  const cacheNames = await page.evaluate(async () => {
    return await caches.keys();
  });

  expect(cacheNames.some(name =>
    name.startsWith('planning-poker-')
  )).toBe(true);
});
```

### 3. Test Offline Functionality

```typescript
test('App should work offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('app-root')).toBeVisible();
});
```

### 4. Test Manifest

```typescript
test('Manifest should be valid', async ({ page }) => {
  const response = await page.goto('/manifest.webmanifest');
  expect(response?.status()).toBe(200);

  const manifest = await response?.json();
  expect(manifest.name).toBeDefined();
  expect(manifest.icons.length).toBeGreaterThan(0);
});
```

## Common Testing Challenges

### Challenge 1: Service Worker Lifecycle

**Problem:** Service Worker activation timing is unpredictable

**Solution:**
```typescript
await page.waitForTimeout(2000); // Wait for registration
await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
});
```

### Challenge 2: Update Detection

**Problem:** Hard to test update flow in automated tests

**Solution:**
- Use manual testing for update flow
- Or create test with version switching:
  ```typescript
  test('Update detection', async ({ page }) => {
    // Deploy v1, load, register SW
    // Deploy v2
    // Trigger update check
    // Verify notification appears
  });
  ```

### Challenge 3: Install Prompt

**Problem:** `beforeinstallprompt` event is browser-specific

**Solution:**
- Mark as `.skip` in automated tests
- Use manual testing checklist
- Test logic with mocked event

### Challenge 4: Offline Testing

**Problem:** Offline mode affects all network requests

**Solution:**
```typescript
test('Offline mode', async ({ page, context }) => {
  // Load and cache first
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Then go offline
  await context.setOffline(true);

  // Test offline functionality
  await page.reload();

  // Restore online
  await context.setOffline(false);
});
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run PWA E2E Tests
  run: |
    npm run build
    npm run test:e2e -- pwa.spec.ts
```

### Test Coverage Goals

- ✅ Unit Tests: 80%+ coverage for PwaService
- ✅ E2E Tests: Cover all PWA registration and caching
- ✅ Manual Tests: Before each production deployment

## Recommended Test Suite

### Minimum PWA Tests

1. ✅ Service Worker registers successfully
2. ✅ Service Worker activates
3. ✅ Static assets are cached
4. ✅ Manifest is valid and accessible
5. ✅ Required icons exist (192x192, 512x512)
6. ✅ Offline mode works for cached content
7. ✅ Update detection works (manual test)
8. ✅ Install prompt works (manual test)

### Nice-to-Have Tests

9. Cache cleanup on new version
10. Network-first strategy for API calls
11. Stale-while-revalidate for HTML
12. Push notification subscription (future)
13. Background sync (future)

## Resources

- [Playwright Service Worker Testing](https://playwright.dev/docs/service-workers-experimental)
- [Testing Service Workers (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#testing)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PWA Testing Best Practices](https://web.dev/testing/)

---

**Summary:** Use unit tests for logic, E2E tests for integration, and manual testing for real-world behavior. PWA features require a pragmatic testing approach!
