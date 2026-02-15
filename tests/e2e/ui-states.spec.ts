import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('UI States and Feedback', () => {
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

  test('should show correct button states based on room state', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Initial state: "Start Voting" should be visible
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reveal/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).not.toBeVisible();

    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await page.waitForTimeout(1000);

    // During voting: "Reveal" should be visible, "Start Voting" hidden
    await expect(page.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Reveal/i })).toBeVisible();

    // After reveal
    await page.getByRole('button', { name: /Reveal/i }).click();
    await page.waitForTimeout(1000);

    // After reveal: "Hide" and "Reset" should be visible
    await expect(page.getByRole('button', { name: /Hide/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible();
  });

  test('should display vote status correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Initial status
    await expect(page.locator('.vote-status')).toContainText('Waiting for voting to start');

    // Enable participation and start voting
    await page.locator('mat-checkbox').getByText('I want to participate').click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

    // Should show 0/1 voted
    await expect(page.locator('.vote-status')).toContainText('0/1', { timeout: 5000 });

    // After voting
    const card = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await expect(page.locator('.vote-status')).toContainText('1/1', { timeout: 5000 });
    }
  });

  test('should show selected card state visually', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    await page.locator('mat-checkbox').getByText('I want to participate').click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

    const card5 = page.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
    if (await card5.isVisible().catch(() => false)) {
      // Before clicking - should not have selected class
      const classBeforeClick = await card5.getAttribute('class');
      expect(classBeforeClick).not.toContain('selected');

      await card5.click();
      await page.waitForTimeout(500);

      // After clicking - should have selected class
      const classAfterClick = await card5.getAttribute('class');
      expect(classAfterClick).toContain('selected');
    }
  });

  test('should show participant vote status indicators', async ({ browser }) => {
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

      // User joins
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      // Start voting
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // User votes
      const userCard = userPage.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
      if (await userCard.isVisible().catch(() => false)) {
        await userCard.click();
        await userPage.waitForTimeout(1000);

        // Admin should see that user has voted (status changes)
        await expect(adminPage.locator('.vote-status')).toContainText('1/2', { timeout: 10000 });
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should show admin controls only to admin', async ({ browser }) => {
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

      // User joins
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//);

      // Admin should see admin controls
      await expect(adminPage.locator('.admin-controls')).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();

      // User should NOT see admin controls
      await expect(userPage.locator('.admin-controls')).not.toBeVisible();
      await expect(userPage.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
