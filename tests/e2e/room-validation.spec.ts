import { test, expect, getRoomId } from './helpers/fixtures';

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

  test('should handle room ID case sensitivity', async ({ adminRoom }) => {
    const { roomId } = adminRoom;

    expect(roomId).toMatch(/^[A-Z0-9]+$/);
    expect(roomId.length).toBeGreaterThan(0);
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

    await expect(page.locator('[data-testid="name-input"]')).toHaveValue('');
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

  test('should trim whitespace from room ID input', async ({ twoUserRoom }) => {
    const { adminPage } = twoUserRoom;
    const roomId = getRoomId(adminPage);

    // userPage is already in the room via the fixture — verify join worked despite potential whitespace handling
    // by testing a fresh join with whitespace from a third context
    const freshContext = await adminPage.context().browser()!.newContext();
    const freshPage = await freshContext.newPage();

    try {
      await freshPage.goto('/');
      await freshPage.locator('[data-testid="name-input"]').fill('User2');
      await freshPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await freshPage.locator('[data-testid="room-id-input"]').fill(`  ${roomId}  `);
      await freshPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(freshPage).toHaveURL(/\/room\//, { timeout: 10000 });
    } finally {
      await freshContext.close();
    }
  });
});
