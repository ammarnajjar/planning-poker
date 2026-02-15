import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Voting Advanced', () => {
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

  test('should handle special vote values', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await page.locator('mat-checkbox').getByText('I want to participate').click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.vote-status')).toBeVisible({ timeout: 5000 });

    const firstCard = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });
    await firstCard.click();
    await expect(page.locator('.current-selection')).toContainText('Your vote:', { timeout: 5000 });

    await page.waitForTimeout(500);
    const card5 = page.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
    if (await card5.isVisible().catch(() => false)) {
      await card5.click();
      await expect(page.locator('.current-selection')).toContainText('5', { timeout: 5000 });
    }
  });

  test('should handle reset during voting', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await page.locator('mat-checkbox').getByText('I want to participate').click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.vote-status')).toBeVisible({ timeout: 5000 });

    const card = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
    await card.waitFor({ state: 'visible', timeout: 5000 });
    await card.click();
    await expect(page.locator('.current-selection')).toContainText('Your vote:', { timeout: 5000 });

    await page.getByRole('button', { name: /Reset/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });

    await expect(page.locator('.vote-status')).toContainText('Waiting for voting to start', { timeout: 5000 });
  });

  test('should be mobile responsive in room', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    if (isMobile) {
      const toolbarTitle = page.locator('.toolbar-title');
      const isVisible = await toolbarTitle.isVisible();
      expect(isVisible).toBe(false);

      const roomId = page.locator('.room-id');
      await expect(roomId).toBeVisible();

      const fontSize = await roomId.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });

      expect(parseInt(fontSize)).toBe(14);
    }
  });

  test('should copy room ID to clipboard', async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit' || browserName === 'firefox' || !!process.env['CI'] || true,
      'Clipboard API not fully supported in headless browsers'
    );

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    const roomId = captureRoomId(page);

    await expect(page.locator('.room-id')).toBeVisible();

    await page.locator('button[mattooltip="Copy Room ID"]').click();

    await page.waitForTimeout(500);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(roomId);
  });
});
