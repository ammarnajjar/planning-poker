import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Creation and Navigation', () => {
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

  test('should create room and navigate to room page @smoke', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));
  });

  test('should copy room ID to clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard only works in Chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    const roomId = captureRoomId(page);

    const copyButton = page.locator('button[mattooltip="Copy Room ID"]');
    await copyButton.click();

    await page.waitForTimeout(500);
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(roomId);
  });

  test('should leave room and return to home @smoke', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    const leaveButton = page.locator('button[mattooltip="Leave Room"]');
    await leaveButton.click();

    await expect(page).toHaveURL('/');
  });
});
