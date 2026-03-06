import { test, expect, createRoom, getRoomId } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Creation and Navigation', () => {
  test('should create room and navigate to room page @smoke', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));
  });

  test('should copy room ID to clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Clipboard only works in Chromium');

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await createRoom(page, 'Test User');
    const roomId = getRoomId(page);

    await page.locator('[data-testid="copy-room-id-button"]').click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(roomId);

    await cleanupTestRoom(roomId);
  });

  test('should leave room and return to home @smoke', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));

    await page.locator('[data-testid="leave-room-button"]').click();

    await expect(page).toHaveURL('/');
  });
});
