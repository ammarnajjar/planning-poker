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

  test('should display admin controls for room creator', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await expect(page.locator('mat-checkbox').getByText('I want to participate')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should toggle admin participation', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    // Check the participation checkbox
    const participationCheckbox = page.locator('mat-checkbox').getByText('I want to participate');
    await expect(participationCheckbox).toBeVisible();
    await participationCheckbox.click();
    await page.waitForTimeout(1000);

    // Start voting and verify admin can vote
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

    // Admin should see voting cards (confirms participation is enabled)
    const voteCards = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large');
    await expect(voteCards.first()).toBeVisible();

    // Verify vote status shows 1 participant
    await expect(page.locator('.vote-status')).toContainText('0/1', { timeout: 5000 });
  });

  test('should have share room button', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    const shareButton = page.locator('button[mattooltip="Share Room URL"]');
    await expect(shareButton).toBeVisible();
  });

  test('should show participants list', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await expect(page.locator('.section-title')).toContainText('Participants');
    await expect(page.locator('.participant-name').first()).toBeVisible();
  });
});
