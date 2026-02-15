import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Validation', () => {
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

  test('should reject empty room ID when joining', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Join Existing Room/i }).click();

    // Try to join without entering room ID
    const joinButton = page.getByRole('button', { name: /^Join Room$/i });

    // Room ID input should be required
    const roomIdInput = page.locator('input[placeholder="Enter room ID"]');
    await expect(roomIdInput).toBeVisible();

    // Join button might be disabled or form validation prevents submission
    await roomIdInput.fill('');
    await joinButton.click();

    // Should still be on home page (join didn't succeed)
    await expect(page).toHaveURL('/');
  });

  test('should handle room ID case sensitivity', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    const roomId = captureRoomId(page);

    // Room ID should be uppercase
    expect(roomId).toMatch(/^[A-Z0-9]+$/);
    expect(roomId.length).toBeGreaterThan(0);
  });

  test('should generate unique room IDs', async ({ page }) => {
    const roomIds = new Set();

    // Create 3 rooms and verify they all have unique IDs
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.locator('input[placeholder="Enter your name"]').fill(`User ${i}`);
      await page.getByRole('button', { name: /Create New Room/i }).click();
      await page.getByRole('button', { name: /OK/i }).click();

      await expect(page).toHaveURL(/\/room\//);
      const roomId = captureRoomId(page);

      expect(roomIds.has(roomId)).toBe(false);
      roomIds.add(roomId);

      await page.goBack();
    }

    expect(roomIds.size).toBe(3);
  });

  test('should validate user name is required', async ({ page }) => {
    await page.goto('/');

    // Try to create room without entering name
    const createButton = page.getByRole('button', { name: /Create New Room/i });

    // Name input should be empty
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('');

    await createButton.click();

    // Should show validation error or not proceed
    // Still on home page
    await expect(page).toHaveURL('/');
  });

  test('should accept valid room ID format', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Join Existing Room/i }).click();

    const roomIdInput = page.locator('input[placeholder="Enter room ID"]');

    // Valid formats should be accepted
    await roomIdInput.fill('ABC123');
    const value = await roomIdInput.inputValue();
    expect(value).toBe('ABC123');
  });

  test('should trim whitespace from room ID input', async ({ browser }) => {
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
      const roomId = captureRoomId(adminPage);

      // User tries to join with whitespace
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();

      await userPage.locator('input[placeholder="Enter room ID"]').fill(`  ${roomId}  `);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      // Should successfully join despite whitespace
      await expect(userPage).toHaveURL(/\/room\//, { timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
