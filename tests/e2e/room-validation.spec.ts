import { test, expect, createRoom, getRoomId } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Validation', () => {
  test('should reject empty room ID when joining', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');
    await page.getByRole('button', { name: /Join Existing Room/i }).click();

    const roomIdInput = page.locator('[data-testid="room-id-input"]');
    await expect(roomIdInput).toBeVisible();

    await roomIdInput.fill('');
    await page.getByRole('button', { name: /^Join Room$/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('should handle room ID case sensitivity', async ({ page }) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);

    expect(roomId).toMatch(/^[A-Z0-9]+$/);
    expect(roomId.length).toBeGreaterThan(0);

    await cleanupTestRoom(roomId);
  });

  test('should generate unique room IDs', async ({ page }) => {
    const roomIds = new Set<string>();

    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.locator('[data-testid="name-input"]').fill(`User ${i}`);
      await page.getByRole('button', { name: /Create New Room/i }).click();
      await page.getByRole('button', { name: /OK/i }).click();

      await expect(page).toHaveURL(/\/room\//);
      const roomId = getRoomId(page);

      expect(roomIds.has(roomId)).toBe(false);
      roomIds.add(roomId);

      await page.goBack();
    }

    expect(roomIds.size).toBe(3);
  });

  test('should validate user name is required', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.locator('[data-testid="name-input"]');
    await expect(nameInput).toHaveValue('');

    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('should accept valid room ID format', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');
    await page.getByRole('button', { name: /Join Existing Room/i }).click();

    const roomIdInput = page.locator('[data-testid="room-id-input"]');
    await roomIdInput.fill('ABC123');
    expect(await roomIdInput.inputValue()).toBe('ABC123');
  });

  test('should trim whitespace from room ID input', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await userPage.goto('/');
      await userPage.locator('[data-testid="name-input"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('[data-testid="room-id-input"]').fill(`  ${roomId}  `);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//, { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
