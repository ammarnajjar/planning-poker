import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';
import { createTestUser, PerformanceBudgets, Selectors } from './helpers/factories';

test.describe('Performance @performance', () => {
  let createdRoomIds: string[] = [];

  const captureRoomId = (page: any) => {
    const url = page.url();
    const roomId = url.split('/room/')[1];
    if (roomId && !createdRoomIds.includes(roomId)) {
      createdRoomIds.push(roomId);
    }
    return roomId;
  };

  test.afterEach(async () => {
    for (const roomId of createdRoomIds) {
      await cleanupTestRoom(roomId);
    }
    createdRoomIds = [];
  });

  test('should load home page within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`Home page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(PerformanceBudgets.PAGE_LOAD);
  });

  test('should navigate to room within performance budget', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('PerfTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    const startTime = Date.now();
    await expect(page).toHaveURL(/\/room\//);
    const navigationTime = Date.now() - startTime;

    console.log(`Room navigation time: ${navigationTime}ms`);
    expect(navigationTime).toBeLessThan(PerformanceBudgets.NAVIGATION);

    captureRoomId(page);
  });

  test('should start voting session within performance budget', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('PerfTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    const startButton = page.locator(Selectors.room.startVotingButton);
    const startTime = Date.now();

    await startButton.click();
    await expect(page.locator(Selectors.room.votingSection)).toBeVisible();

    const interactionTime = Date.now() - startTime;

    console.log(`Start voting interaction time: ${interactionTime}ms`);
    expect(interactionTime).toBeLessThan(PerformanceBudgets.INTERACTION);
  });

  test('should submit vote within performance budget', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('PerfTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation
    await page.locator(Selectors.room.participationCheckbox).click();
    await page.waitForTimeout(500);

    // Start voting
    await page.locator(Selectors.room.startVotingButton).click();
    await expect(page.locator(Selectors.room.votingSection)).toBeVisible();

    const card = page.locator(`${Selectors.room.voteCardGrid}, ${Selectors.room.voteCardCarousel}`).first();
    const startTime = Date.now();

    await card.click();
    await expect(page.locator(Selectors.room.currentSelection)).toContainText('Your vote:', { timeout: 5000 });

    const voteTime = Date.now() - startTime;

    console.log(`Vote submission time: ${voteTime}ms`);
    expect(voteTime).toBeLessThan(PerformanceBudgets.INTERACTION);
  });

  test('should measure web vitals', async ({ page }) => {
    await page.goto('/');

    // Inject web vitals measurement
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: { FCP?: number; LCP?: number } = {};

        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.LCP = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Resolve after a short delay to collect metrics
        setTimeout(() => resolve(vitals), 2000);
      });
    }) as { FCP?: number; LCP?: number };

    console.log('Web Vitals:', webVitals);

    // Assert on web vitals (adjust thresholds as needed)
    if (webVitals.FCP) {
      expect(webVitals.FCP).toBeLessThan(1800); // FCP < 1.8s is good
    }
    if (webVitals.LCP) {
      expect(webVitals.LCP).toBeLessThan(2500); // LCP < 2.5s is good
    }
  });

  test('should not have memory leaks during typical usage', async ({ page }) => {
    await page.goto('/');

    interface MemoryMetrics {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
    }

    // Get initial memory usage (if available)
    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    }) as MemoryMetrics | null;

    // Perform typical user actions
    await page.locator(Selectors.home.nameInput).fill(createTestUser('MemoryTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable participation and start voting
    await page.locator(Selectors.room.participationCheckbox).click();
    await page.waitForTimeout(500);
    await page.locator(Selectors.room.startVotingButton).click();
    await expect(page.locator(Selectors.room.votingSection)).toBeVisible();

    // Submit a vote
    const card = page.locator(`${Selectors.room.voteCardGrid}, ${Selectors.room.voteCardCarousel}`).first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await page.waitForTimeout(1000);
    }

    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    }) as MemoryMetrics | null;

    if (initialMetrics && finalMetrics) {
      const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory increase should be reasonable (< 10MB for basic operations)
      expect(memoryIncreaseMB).toBeLessThan(10);
    }
  });
});
