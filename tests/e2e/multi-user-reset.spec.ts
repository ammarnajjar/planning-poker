import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Reset Tests', () => {
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

  test('should clear vote counts when admin resets', async ({ browser }) => {
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

      // User joins room
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//);
      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      // Admin enables participation and starts voting
      await adminPage.locator('mat-checkbox').getByText('I want to participate').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      await expect(adminPage.locator('.voting-section')).toBeVisible();
      await expect(userPage.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // Both users vote
      const adminCard = adminPage.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
      const adminCardVisible = await adminCard.isVisible().catch(() => false);
      if (adminCardVisible) {
        await adminCard.click();
      } else {
        await adminPage.locator('.card-carousel .vote-card-large').click();
      }

      const userCard = userPage.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^8$/ });
      const userCardVisible = await userCard.isVisible().catch(() => false);
      if (userCardVisible) {
        await userCard.click();
      } else {
        await userPage.locator('.card-carousel .vote-card-large').click();
      }

      // Wait for both votes to be recorded
      await expect(adminPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });
      await expect(userPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });

      // Verify vote count shows 2/2 voted on both pages
      await expect(adminPage.locator('.vote-status')).toContainText('2/2 voted', { timeout: 15000 });
      await expect(userPage.locator('.vote-status')).toContainText('2/2 voted', { timeout: 15000 });

      // Admin resets votes (without revealing first)
      await adminPage.getByRole('button', { name: /Reset/i }).click();

      // Admin should see "Start Voting" button again
      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });

      // CRITICAL: User should see vote count reset to 0/2 (not preserved due to heartbeat protection)
      // This verifies the fix where vote preservation checks room state (votingStarted=false after reset)
      await expect(userPage.locator('.vote-status')).toContainText('Waiting for voting to start', { timeout: 15000 });

      // Admin starts voting again
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // Verify vote count is 0/2 (votes were actually cleared)
      await expect(adminPage.locator('.vote-status')).toContainText('0/2 voted', { timeout: 10000 });
      await expect(userPage.locator('.vote-status')).toContainText('0/2 voted', { timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync reset votes between users', async ({ browser }) => {
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

      // Wait for room to be fully initialized before user joins
      await expect(adminPage.locator('.section-title')).toContainText('Participants (1)', { timeout: 10000 });

      // User joins room
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//, { timeout: 10000 });

      // Wait for participants
      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      // Admin enables participation and starts voting
      await adminPage.locator('mat-checkbox').getByText('I want to participate').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      // Wait for voting section
      await expect(adminPage.locator('.voting-section')).toBeVisible();
      await expect(userPage.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      // User votes
      const userCard = userPage.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
      const userCardVisible = await userCard.isVisible().catch(() => false);
      if (userCardVisible) {
        await userCard.click();
      } else {
        await userPage.locator('.card-carousel .vote-card-large').click();
      }

      await expect(userPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });

      // Admin reveals votes
      await adminPage.getByRole('button', { name: /Reveal/i }).click();
      await expect(adminPage.getByRole('button', { name: /Hide/i })).toBeVisible();

      // Wait for reveal to sync to user's page
      await expect(userPage.locator('.vote-status')).toContainText('Votes revealed', { timeout: 15000 });

      // Admin resets votes
      await adminPage.getByRole('button', { name: /Reset/i }).click();

      // Admin should see "Start Voting" button again (voting reset)
      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();

      // User should see voting section disappear (via real-time sync)
      // The vote-status should change from "Votes revealed" back to "Waiting for voting to start"
      await expect(userPage.locator('.vote-status')).toContainText('Waiting for voting to start', { timeout: 15000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
