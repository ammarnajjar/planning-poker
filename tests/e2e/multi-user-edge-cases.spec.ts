import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Edge Cases Tests', () => {
  test.describe.configure({ mode: 'serial' });

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

  test('should handle joining non-existent room gracefully', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('/');
      await page.locator('input[placeholder="Enter your name"]').fill('Test User');
      await page.getByRole('button', { name: /Join Existing Room/i }).click();

      // Try to join a room that doesn't exist
      await page.locator('input[placeholder="Enter room ID"]').fill('NONEXIST');
      await page.getByRole('button', { name: /^Join Room$/i }).click();

      // Should stay on home page or show error
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL('/');

      // Error indication should be present (inline error or error message)
      // The app shows inline error for invalid rooms
    } finally {
      await context.close();
    }
  });

  // High Priority Coverage - Room State Persistence: Refresh During Voting
  test('should maintain room state after browser refresh', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Create room and start voting
      await page.goto('/');
      await page.locator('input[placeholder="Enter your name"]').fill('Admin');
      await page.getByRole('button', { name: /Create New Room/i }).click();
      await page.getByRole('button', { name: /OK/i }).click();

      await expect(page).toHaveURL(/\/room\//);
      const roomUrl = page.url();
      const roomId = captureRoomId(page);

      await page.locator('mat-checkbox').filter({ hasText: 'I want to participate' }).click();
      await page.getByRole('button', { name: /Start Voting/i }).click();
      await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // Vote
      const card = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
      await card.click();
      await expect(page.locator('.current-selection')).toContainText('Your vote:', { timeout: 5000 });

      // Refresh the page
      await page.reload();

      // Should still be in the room
      await expect(page).toHaveURL(roomUrl);

      // Voting section should still be visible
      await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // User should still be marked as voted
      await expect(page.locator('.current-selection')).toContainText('Your vote:', { timeout: 5000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context.close();
    }
  });

  // High Priority Coverage - Multiple Tabs Same Room
  test('should sync state across multiple tabs of same user', async ({ browser }) => {
    const context = await browser.newContext();
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    try {
      // Create room in first tab
      await tab1.goto('/');
      await tab1.locator('input[placeholder="Enter your name"]').fill('Admin');
      await tab1.getByRole('button', { name: /Create New Room/i }).click();
      await tab1.getByRole('button', { name: /OK/i }).click();

      await expect(tab1).toHaveURL(/\/room\//);
      const roomUrl = tab1.url();
      const roomId = captureRoomId(tab1);

      // Open same room in second tab
      await tab2.goto(roomUrl);
      await expect(tab2).toHaveURL(roomUrl);

      // Start voting in first tab
      await tab1.locator('mat-checkbox').filter({ hasText: 'I want to participate' }).click();
      await tab1.getByRole('button', { name: /Start Voting/i }).click();
      await expect(tab1.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // Second tab should also show voting
      await expect(tab2.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // Vote in first tab
      const card1 = tab1.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
      await card1.click();
      await expect(tab1.locator('.current-selection')).toContainText('Your vote:', { timeout: 5000 });

      // Second tab should also show the vote
      await expect(tab2.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context.close();
    }
  });
});
