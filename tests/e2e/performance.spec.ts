import { test, expect, createRoom, getRoomId, startVoting, castVote } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';
import { createTestUser, PerformanceBudgets, Selectors } from './helpers/factories';

test.describe('Performance @performance', () => {
  test('should load home page within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    test.info().annotations.push({ type: 'perf', description: `Home page load time: ${loadTime}ms` });
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

    test.info().annotations.push({ type: 'perf', description: `Room navigation time: ${navigationTime}ms` });
    expect(navigationTime).toBeLessThan(PerformanceBudgets.NAVIGATION);

    await cleanupTestRoom(getRoomId(page));
  });

  test('should start voting session within performance budget', async ({ page }) => {
    await createRoom(page, createTestUser('PerfTest'));
    const roomId = getRoomId(page);

    const startButton = page.locator(Selectors.room.startVotingButton);
    const startTime = Date.now();

    await startButton.click();
    await expect(page.locator(Selectors.room.votingSection)).toBeVisible();

    const interactionTime = Date.now() - startTime;

    test.info().annotations.push({ type: 'perf', description: `Start voting interaction time: ${interactionTime}ms` });
    expect(interactionTime).toBeLessThan(PerformanceBudgets.INTERACTION);

    await cleanupTestRoom(roomId);
  });

  test('should submit vote within performance budget', async ({ page }) => {
    await createRoom(page, createTestUser('PerfTest'));
    const roomId = getRoomId(page);

    await startVoting(page);

    const card = page.locator(`${Selectors.room.voteCardGrid}, ${Selectors.room.voteCardCarousel}`).first();
    const startTime = Date.now();

    await card.click();
    await expect(page.locator(Selectors.room.currentSelection)).toContainText('Your vote:', { timeout: 5000 });

    const voteTime = Date.now() - startTime;

    test.info().annotations.push({ type: 'perf', description: `Vote submission time: ${voteTime}ms` });
    expect(voteTime).toBeLessThan(PerformanceBudgets.INTERACTION);

    await cleanupTestRoom(roomId);
  });

  test('should measure web vitals', async ({ page }) => {
    await page.goto('/');

    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: { FCP?: number; LCP?: number } = {};

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.FCP = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });

        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.LCP = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        setTimeout(() => resolve(vitals), 2000);
      });
    }) as { FCP?: number; LCP?: number };

    test.info().annotations.push({ type: 'perf', description: `Web Vitals: FCP=${webVitals.FCP?.toFixed(0)}ms LCP=${webVitals.LCP?.toFixed(0)}ms` });

    if (webVitals.FCP) {
      expect(webVitals.FCP).toBeLessThan(1800);
    }
    if (webVitals.LCP) {
      expect(webVitals.LCP).toBeLessThan(2500);
    }
  });

  test('should not have memory leaks during typical usage', async ({ page }) => {
    await page.goto('/');

    interface MemoryMetrics {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
    }

    const initialMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    }) as MemoryMetrics | null;

    await createRoom(page, createTestUser('MemoryTest'));
    const roomId = getRoomId(page);

    await startVoting(page);
    await castVote(page);

    const finalMetrics = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    }) as MemoryMetrics | null;

    if (initialMetrics && finalMetrics) {
      const memoryIncreaseMB = (finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize) / (1024 * 1024);
      test.info().annotations.push({ type: 'perf', description: `Memory increase: ${memoryIncreaseMB.toFixed(2)}MB` });
      expect(memoryIncreaseMB).toBeLessThan(10);
    }

    await cleanupTestRoom(roomId);
  });
});
