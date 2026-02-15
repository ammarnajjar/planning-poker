import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Sharing', () => {
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

  test('should copy full room URL when clicking share button', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard only works reliably in Chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    const roomId = captureRoomId(page);

    const shareButton = page.locator('button[mattooltip="Share Room URL"]');
    await shareButton.click();

    await page.waitForTimeout(500);
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Should contain the full URL, not just room ID
    expect(clipboardText).toContain('/room/');
    expect(clipboardText).toContain(roomId);
    expect(clipboardText).toContain('http');
  });

  test('should allow second user to join using shared URL', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      // Admin creates room
      await adminPage.goto('/');
      await adminPage.locator('input[placeholder="Enter your name"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomUrl = adminPage.url();
      captureRoomId(adminPage);

      // Wait for admin to be in room
      await expect(adminPage.locator('.section-title')).toContainText('Participants (1)', { timeout: 10000 });

      // User navigates to the shared URL directly
      await userPage.goto(roomUrl);

      // Should show name entry dialog or join form
      await userPage.locator('input[placeholder="Enter your name"]').fill('User 2');
      await userPage.getByRole('button', { name: /^Join$/i }).click();

      // Both should see 2 participants
      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(userPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should show room not found for invalid room ID in URL', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');

    // Try to navigate to non-existent room
    await page.goto('/room/INVALID123');

    // Should redirect to home or show error
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
