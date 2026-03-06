import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Multi-Round Voting', () => {
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

  test('should support multiple rounds of voting', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation
    await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await page.waitForTimeout(500);

    // Round 1
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const card1 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    await card1.click();
    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });

    // Reveal and reset for round 2
    await page.getByRole('button', { name: /Reveal/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Reset/i }).click();
    await page.waitForTimeout(1000);

    // Round 2 - should be able to vote again
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const card2 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').nth(1);
    if (await card2.isVisible().catch(() => false)) {
      await card2.click();
    } else {
      await card1.click();
    }
    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });
  });

  test('should clear previous votes when starting new round', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await page.waitForTimeout(500);

    // First round
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const card = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]').filter({ hasText: /^5$/ });
    if (await card.isVisible().catch(() => false)) {
      await card.click();
    } else {
      await page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first().click();
    }
    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });

    // Reveal and reset
    await page.getByRole('button', { name: /Reveal/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Reset/i }).click();
    await page.waitForTimeout(1000);

    // New round - vote status should show "Waiting"
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start', { timeout: 5000 });
  });

  test('should maintain participant list across multiple rounds', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      // Setup: Admin creates room, user joins
      await adminPage.goto('/');
      await adminPage.locator('[data-testid="name-input"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = captureRoomId(adminPage);

      await userPage.goto('/');
      await userPage.locator('[data-testid="name-input"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('[data-testid="room-id-input"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      // Enable admin participation
      await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await adminPage.waitForTimeout(500);

      // Round 1
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      // Both vote
      const adminCard = adminPage.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
      const userCard = userPage.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();

      if (await adminCard.isVisible().catch(() => false)) {
        await adminCard.click();
      }
      if (await userCard.isVisible().catch(() => false)) {
        await userCard.click();
      }

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2', { timeout: 15000 });

      // Reset for round 2
      await adminPage.getByRole('button', { name: /Reveal/i }).click();
      await adminPage.waitForTimeout(1000);
      await adminPage.getByRole('button', { name: /Reset/i }).click();
      await adminPage.waitForTimeout(1000);

      // Participant count should still be 2
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(userPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
