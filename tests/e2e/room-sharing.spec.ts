import { test, expect, createRoom, joinRoom, getRoomId } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Sharing', () => {
  test('should copy full room URL when clicking share button', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard only works reliably in Chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await createRoom(page, 'Test User');
    const roomId = getRoomId(page);

    await expect(page.locator('[data-testid="room-id"]')).toContainText(roomId);

    await page.locator('[data-testid="share-room-button"]').click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('/room/');
    expect(clipboardText).toContain(roomId);
    expect(clipboardText).toContain('http');

    await cleanupTestRoom(roomId);
  });

  test('should redirect to home when visiting shared URL without username', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomUrl = adminPage.url();
      const roomId = getRoomId(adminPage);

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      // Direct URL visit without username in state → redirect to home
      await userPage.goto(roomUrl);
      await expect(userPage).toHaveURL('/', { timeout: 5000 });

      await joinRoom(userPage, roomId, 'User 2');

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(userPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should show room not found for invalid room ID in URL', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');

    await page.goto('/room/INVALID123');

    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
