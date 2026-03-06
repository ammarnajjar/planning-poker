import { test, expect, devices } from '@playwright/test';
import { createRoom, getRoomId, startVoting } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

// In CI (chromium project), use Pixel 5 for mobile tests
// This ensures mobile tests run on chromium which is installed in CI
const mobileDevice = process.env['CI']
  ? devices['Pixel 5']   // Android device using chromium
  : devices['iPhone 12 Pro'];  // iOS device using webkit

test.use({
  ...mobileDevice,
});

test.describe('Mobile-Specific Features', () => {
  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');

    const createButton = page.getByRole('button', { name: /Create New Room/i });
    const buttonBox = await createButton.boundingBox();

    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should not zoom on input focus', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.locator('[data-testid="name-input"]');
    const fontSize = await nameInput.evaluate(el => window.getComputedStyle(el).fontSize);

    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });

  test('should display compact mobile layout', async ({ page }) => {
    await page.goto('/');

    const toolbar = page.locator('mat-toolbar');
    const toolbarHeight = await toolbar.evaluate(el => window.getComputedStyle(el).minHeight);

    expect(toolbarHeight).toBe('56px');
  });

  test('should have proper touch targets in room', async ({ page }) => {
    await createRoom(page, 'Mobile User');
    const roomId = getRoomId(page);

    await startVoting(page);

    const card = page.locator('[data-testid="carousel-vote-card"]');
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();

    if (cardBox) {
      expect(cardBox.width).toBeGreaterThanOrEqual(60);
      expect(cardBox.height).toBeGreaterThanOrEqual(60);
    }

    await cleanupTestRoom(roomId);
  });

  test('should enable scrolling on mobile', async ({ page }) => {
    await page.goto('/');

    const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflowY);

    expect(bodyOverflow).toBe('auto');
  });

  test('should hide toolbar title on mobile in room', async ({ page }) => {
    await createRoom(page, 'Mobile User');
    const roomId = getRoomId(page);

    const toolbarTitle = page.locator('.toolbar-title');
    expect(await toolbarTitle.isVisible()).toBe(false);

    await cleanupTestRoom(roomId);
  });

  test('should handle orientation change', async ({ page }) => {
    await page.goto('/');

    const viewportSize = page.viewportSize();
    expect(viewportSize?.height).toBeGreaterThan(viewportSize?.width || 0);

    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 Pro landscape

    await expect(page.locator('mat-card')).toBeVisible();
    await expect(page.locator('.toolbar-title')).toBeVisible();
  });

  test('should navigate carousel with next/previous buttons', async ({ page }) => {
    await createRoom(page, 'Mobile User');
    const roomId = getRoomId(page);

    await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const carousel = page.locator('.card-carousel');
    if (await carousel.isVisible().catch(() => false)) {
      const nextButton = page.locator('.nav-button.next');
      await expect(nextButton).toBeVisible();

      const prevButton = page.locator('.nav-button.prev');
      await expect(prevButton).toBeDisabled();

      await nextButton.click();
      await expect(prevButton).toBeEnabled();

      await prevButton.click();
      await expect(prevButton).toBeDisabled();
    }

    await cleanupTestRoom(roomId);
  });

  test('should navigate carousel with indicator dots', async ({ page }) => {
    await createRoom(page, 'Mobile User');
    const roomId = getRoomId(page);

    await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const indicators = page.locator('.carousel-indicators .indicator-dot');
    if (await indicators.first().isVisible().catch(() => false)) {
      const count = await indicators.count();
      expect(count).toBeGreaterThan(1);

      if (count > 1) {
        await indicators.nth(1).click();
        // Wait for the active state to update
        await expect(indicators.nth(1)).toHaveClass(/active/);
      }
    }

    await cleanupTestRoom(roomId);
  });

  test('should have proper ARIA labels for voting cards', async ({ page }) => {
    await createRoom(page, 'Test User');
    const roomId = getRoomId(page);

    await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const cards = page.locator('[role="button"].vote-card-large');
    await expect(cards.first()).toBeVisible();

    const tabindex = await cards.first().getAttribute('tabindex');
    expect(tabindex).toBe('0');

    await cleanupTestRoom(roomId);
  });
});
