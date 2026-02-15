import { test, expect, devices } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

// In CI (chromium project), use Pixel 5 for mobile tests
// This ensures mobile tests run on chromium which is installed in CI
const mobileDevice = process.env['CI']
  ? devices['Pixel 5']  // Android device using chromium
  : devices['iPhone 12 Pro'];  // iOS device using webkit

test.use({
  ...mobileDevice,
});

test.describe('Mobile-Specific Features', () => {
  let createdRoomIds: string[] = [];

  // Helper to capture room ID from URL
  const captureRoomId = (page: any) => {
    const url = page.url();
    const roomId = url.split('/room/')[1];
    if (roomId && !createdRoomIds.includes(roomId)) {
      createdRoomIds.push(roomId);
    }
    return roomId;
  };

  test.afterEach(async () => {
    // Clean up any rooms created during tests
    for (const roomId of createdRoomIds) {
      await cleanupTestRoom(roomId);
    }
    createdRoomIds = [];
  });
  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');

    // Check that buttons meet iOS touch target guidelines (44px minimum)
    const createButton = page.getByRole('button', { name: /Create New Room/i });
    const buttonBox = await createButton.boundingBox();

    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should not zoom on input focus', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.locator('input[placeholder="Enter your name"]');

    // Get computed font size
    const fontSize = await nameInput.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    // Should be 16px or larger to prevent iOS zoom
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });

  test('should display compact mobile layout', async ({ page }) => {
    await page.goto('/');

    // Check mobile-specific styling
    const toolbar = page.locator('mat-toolbar');
    const toolbarHeight = await toolbar.evaluate(el => {
      return window.getComputedStyle(el).minHeight;
    });

    // Mobile toolbar should be 56px
    expect(toolbarHeight).toBe('56px');
  });

  test('should have proper touch targets in room', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation to see voting cards
    const participateCheckbox = page.locator('mat-checkbox').getByText('I want to participate');
    await participateCheckbox.click();

    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // On mobile, cards are in a carousel (.card-carousel), not grid (.vote-cards-grid)
    // Check for card in the visible carousel container
    const card = page.locator('.card-carousel .vote-card-large');
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();

    if (cardBox) {
      // Cards should be large enough for easy tapping
      expect(cardBox.width).toBeGreaterThanOrEqual(60);
      expect(cardBox.height).toBeGreaterThanOrEqual(60);
    }
  });

  test('should enable scrolling on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that body allows scrolling
    const bodyOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflowY;
    });

    expect(bodyOverflow).toBe('auto');
  });

  test('should hide toolbar title on mobile in room', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Toolbar title should be hidden on mobile
    const toolbarTitle = page.locator('.toolbar-title');
    const isVisible = await toolbarTitle.isVisible();
    expect(isVisible).toBe(false);
  });

  test('should handle orientation change', async ({ page }) => {
    await page.goto('/');

    // Test portrait mode (default)
    let viewportSize = page.viewportSize();
    expect(viewportSize?.height).toBeGreaterThan(viewportSize?.width || 0);

    // Simulate landscape by changing viewport
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 Pro landscape

    // Page should still be usable
    await expect(page.locator('mat-card')).toBeVisible();
    await expect(page.locator('.toolbar-title')).toBeVisible();
  });

});
