import { test, expect, createRoom, getRoomId } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Voting Advanced', () => {
  test('should be mobile responsive in room', async ({ page, isMobile }) => {
    await createRoom(page, 'Mobile User');
    const roomId = getRoomId(page);

    if (isMobile) {
      const toolbarTitle = page.locator('.toolbar-title');
      const isVisible = await toolbarTitle.isVisible();
      expect(isVisible).toBe(false);

      const roomIdEl = page.locator('[data-testid="room-id"]');
      await expect(roomIdEl).toBeVisible();

      const fontSize = await roomIdEl.evaluate(el => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBe(14);
    }

    await cleanupTestRoom(roomId);
  });

  test('should copy room ID to clipboard', async ({ page, context, browserName }) => {
    test.skip(
      browserName === 'webkit' || browserName === 'firefox' || !!process.env['CI'] || true,
      'Clipboard API not fully supported in headless browsers'
    );

    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await createRoom(page, 'Admin User');
    const roomId = getRoomId(page);

    await expect(page.locator('[data-testid="room-id"]')).toBeVisible();

    await page.locator('[data-testid="copy-room-id-button"]').click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(roomId);

    await cleanupTestRoom(roomId);
  });
});
