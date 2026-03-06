import { test, expect, createRoom, getRoomId, joinRoom } from './helpers/fixtures';
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

  test('should redirect to home when visiting shared URL without username', async ({ twoUserRoom }) => {
    const { adminPage } = twoUserRoom;
    const roomUrl = adminPage.url();
    const roomId = getRoomId(adminPage);

    // A fresh context simulates a new user visiting the shared URL directly
    const freshContext = await adminPage.context().browser()!.newContext();
    const freshPage = await freshContext.newPage();

    try {
      await freshPage.goto(roomUrl);
      await expect(freshPage).toHaveURL('/', { timeout: 5000 });

      await joinRoom(freshPage, roomId, 'User 2');

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (3)', { timeout: 10000 });
      await expect(freshPage.locator('[data-testid="participants-title"]')).toContainText('Participants (3)', { timeout: 10000 });
    } finally {
      await freshContext.close();
    }
  });

  test('should show room not found for invalid room ID in URL', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');

    await page.goto('/room/INVALID123');

    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
