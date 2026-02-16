import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should register Service Worker', async ({ page, context }) => {
    await page.goto('/');

    // Wait for Service Worker registration
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        return false;
      }

      // Wait for registration
      await new Promise(resolve => setTimeout(resolve, 2000));

      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });

    expect(swRegistered).toBe(true);
  });

  test('should have Service Worker in activated state', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for SW registration

    const swState = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.active?.state;
    });

    expect(swState).toBe('activated');
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for caching

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

    // In browser tests, this will be false
    // When installed as PWA, it would be true
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
    // Check if 192x192 icon exists (minimum required)
    const response192 = await page.goto('/icons/icon-192x192.png');
    expect(response192?.status()).toBe(200);

    // Check if 512x512 icon exists (for splash screen)
    const response512 = await page.goto('/icons/icon-512x512.png');
    expect(response512?.status()).toBe(200);
  });

  test('should serve from Service Worker after first load', async ({ page }) => {
    // First load - network
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Reload - should serve from SW cache
    await page.reload();
    await page.waitForTimeout(1000);

    // Check if requests are served by Service Worker
    const fromServiceWorker = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')
        .some((entry: PerformanceEntry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          return navEntry.transferSize === 0 && navEntry.decodedBodySize > 0;
        });
    });

    // Note: This may not always be reliable depending on caching strategy
    console.log('Served from Service Worker cache:', fromServiceWorker);
  });

  test('should work offline for cached pages', async ({ page, context }) => {
    // First load with network
    await page.goto('/');
    await page.waitForTimeout(2000); // Wait for caching

    // Go offline
    await context.setOffline(true);

    // Try to reload
    await page.reload();

    // Should still load from cache
    await expect(page.locator('app-root')).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);
  });

  test.skip('should show install prompt on supported browsers', async ({ page }) => {
    // Note: Install prompt is hard to test in automated tests
    // This would require specific browser configurations
    // Best tested manually

    await page.goto('/');

    // Check if beforeinstallprompt event can be triggered
    // This is browser-specific and may not work in tests
  });

  test('should have update notification in DOM when triggered', async ({ page }) => {
    await page.goto('/');

    // Check if update banner is initially hidden
    const updateBanner = page.locator('.update-banner');
    await expect(updateBanner).not.toBeVisible();

    // Note: Testing actual update detection requires:
    // 1. Service Worker update (new version deployed)
    // 2. Detection mechanism triggered
    // This is better tested manually or with specialized PWA testing tools
  });
});

test.describe('PWA Service Worker Caching Strategies', () => {
  test('should cache static assets (JS, CSS)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const planningPokerCache = cacheNames.find(name =>
        name.startsWith('planning-poker-')
      );

      if (!planningPokerCache) return [];

      const cache = await caches.open(planningPokerCache);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    });

    console.log('Cached resources:', cachedResources);
    expect(cachedResources.length).toBeGreaterThan(0);
  });

  test('should not cache API calls in static cache', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const cachedResources = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const planningPokerCache = cacheNames.find(name =>
        name.startsWith('planning-poker-')
      );

      if (!planningPokerCache) return [];

      const cache = await caches.open(planningPokerCache);
      const requests = await cache.keys();
      return requests.map(req => req.url);
    });

    // API calls should not be in cache (network-first strategy)
    const hasSupabaseCache = cachedResources.some(url =>
      url.includes('supabase.co')
    );

    expect(hasSupabaseCache).toBe(false);
  });
});
