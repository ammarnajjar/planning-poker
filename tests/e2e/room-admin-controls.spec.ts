import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Admin Controls', () => {
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

  test('should display admin controls for room creator @smoke', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await expect(page.locator('[data-testid="admin-participate-checkbox"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should toggle admin participation @smoke', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    // Check the participation checkbox
    const participationCheckbox = page.locator('[data-testid="admin-participate-checkbox"]');
    await expect(participationCheckbox).toBeVisible();
    await participationCheckbox.locator('label').click();
    await page.waitForTimeout(1000);

    // Start voting and verify admin can vote
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    // Admin should see voting cards (confirms participation is enabled)
    // On desktop: cards in a grid; on mobile: cards in a carousel (may be off-screen individually)
    const voteCards = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]');
    await expect(voteCards.first()).toBeAttached({ timeout: 5000 });

    // Verify vote status shows 1 participant
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('0/1', { timeout: 5000 });
  });

  test('should have share room button', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    const shareButton = page.locator('[data-testid="share-room-button"]');
    await expect(shareButton).toBeVisible();
  });

  test('should show participants list', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await expect(page.locator('[data-testid="participants-title"]')).toContainText('Participants');
    await expect(page.locator('[data-testid="participant-name"]').first()).toBeVisible();
  });
});
