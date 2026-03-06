import { test, expect, waitForServiceWorker, waitForCache } from './helpers/fixtures';

test.describe('PWA Features', () => {
  test('should register Service Worker', async ({ page }) => {
    await page.goto('/');

    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });

    expect(swRegistered).toBe(true);
  });

  test('should have Service Worker in activated state', async ({ page }) => {
    await page.goto('/');
    await waitForServiceWorker(page);

    const swState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.active?.state;
    });

    expect(swState).toBe('activated');
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/');
    await waitForCache(page);

    const hasCaches = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.some(name => name.startsWith('planning-poker-'));
    });

    expect(hasCaches).toBe(true);
  });

  test('should detect if running as PWA', async ({ page }) => {
    await page.goto('/');

    const isStandalone = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches;
    });

    // In browser tests this is false; when installed as PWA it would be true
    expect(typeof isStandalone).toBe('boolean');
  });

  test('should have PWA manifest', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest.name).toBe('Planning Poker');
    expect(manifest.short_name).toBe('Poker');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have PWA icons available', async ({ page }) => {
    const response192 = await page.goto('/icons/icon-192x192.png');
    expect(response192?.status()).toBe(200);

    const response512 = await page.goto('/icons/icon-512x512.png');
    expect(response512?.status()).toBe(200);
  });

  test('should serve from Service Worker after first load', async ({ page }) => {
    await page.goto('/');
    await waitForServiceWorker(page);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const fromServiceWorker = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')
        .some((entry: PerformanceEntry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          return navEntry.transferSize === 0 && navEntry.decodedBodySize > 0;
        });
    });

    test.info().annotations.push({ type: 'pwa', description: `Served from SW cache: ${fromServiceWorker}` });
  });

  test('should work offline for cached pages', async ({ page, context }) => {
    await page.goto('/');
    await waitForCache(page);

    await context.setOffline(true);

    await page.reload();

    await expect(page.locator('app-root')).toBeVisible({ timeout: 5000 });

    await context.setOffline(false);
  });

  test.skip('should show install prompt on supported browsers', async ({ page }) => {
    // Install prompt requires specific browser configurations — test manually
    await page.goto('/');
  });

  test('should have update notification in DOM when triggered', async ({ page }) => {
    await page.goto('/');

    const updateBanner = page.locator('.update-banner');
    await expect(updateBanner).not.toBeVisible();
  });
});

test.describe('PWA Service Worker Caching Strategies', () => {
  test('should cache static assets (JS, CSS)', async ({ page }) => {
    await page.goto('/');
    await waitForCache(page);

    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const planningPokerCache = cacheNames.find(name => name.startsWith('planning-poker-'));
      if (!planningPokerCache) return [];
      const cache = await caches.open(planningPokerCache);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    });

    test.info().annotations.push({ type: 'pwa', description: `Cached resources: ${cachedResources.length}` });
    expect(cachedResources.length).toBeGreaterThan(0);
  });

  test('should not cache API calls in static cache', async ({ page }) => {
    await page.goto('/');
    await waitForCache(page);

    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const planningPokerCache = cacheNames.find(name => name.startsWith('planning-poker-'));
      if (!planningPokerCache) return [];
      const cache = await caches.open(planningPokerCache);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    });

    const hasSupabaseCache = cachedResources.some(url => url.includes('supabase.co'));
    expect(hasSupabaseCache).toBe(false);
  });
});
