import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Real-Time Sync', () => {
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

  test('should show both users when they join the same room', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const user1Page = await context1.newPage();
    const user2Page = await context2.newPage();

    try {
      await user1Page.goto('/');
      await user1Page.locator('input[placeholder="Enter your name"]').fill('User 1');
      await user1Page.getByRole('button', { name: /Create New Room/i }).click();
      await user1Page.getByRole('button', { name: /OK/i }).click();

      await expect(user1Page).toHaveURL(/\/room\//);
      const roomId = captureRoomId(user1Page);

      await expect(user1Page.locator('.section-title')).toContainText('Participants (1)');

      await user2Page.goto('/');
      await user2Page.locator('input[placeholder="Enter your name"]').fill('User 2');
      await user2Page.getByRole('button', { name: /Join Existing Room/i }).click();
      await user2Page.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await user2Page.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(user2Page).toHaveURL(/\/room\//);

      await expect(user1Page.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(user2Page.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      await expect(user1Page.locator('.participant-name').first()).toContainText('User 1');
      await expect(user1Page.locator('.participant-name').nth(1)).toContainText('User 2', { timeout: 10000 });

      await expect(user2Page.locator('.participant-name').first()).toContainText('User 1');
      await expect(user2Page.locator('.participant-name').nth(1)).toContainText('User 2');
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync vote count between users in real-time', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try{
      await adminPage.goto('/');
      await adminPage.locator('input[placeholder="Enter your name"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = captureRoomId(adminPage);

      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//);

      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.locator('mat-checkbox').getByText('I want to participate').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      await expect(adminPage.locator('.voting-section')).toBeVisible();
      await expect(userPage.locator('.voting-section')).toBeVisible({ timeout: 10000 });

      const adminGridCard = adminPage.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
      const adminCarouselCard = adminPage.locator('.card-carousel .vote-card-large');

      const adminGridVisible = await adminGridCard.isVisible().catch(() => false);
      if (adminGridVisible) {
        await adminGridCard.click();
      } else {
        await adminCarouselCard.click();
      }

      await expect(adminPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });

      await adminPage.waitForTimeout(2000);

      await expect(userPage.locator('.vote-status')).toContainText('1/2 voted', { timeout: 20000 });

      const userGridCard = userPage.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^8$/ });
      const userCarouselCard = userPage.locator('.card-carousel .vote-card-large');

      const userGridVisible = await userGridCard.isVisible().catch(() => false);
      if (userGridVisible) {
        await userGridCard.click();
      } else {
        await userCarouselCard.click();
      }

      await expect(userPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });

      await expect(adminPage.locator('.vote-status')).toContainText('2/2 voted', { timeout: 15000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync when user leaves room', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const user1Page = await context1.newPage();
    const user2Page = await context2.newPage();

    try {
      await user1Page.goto('/');
      await user1Page.locator('input[placeholder="Enter your name"]').fill('User 1');
      await user1Page.getByRole('button', { name: /Create New Room/i }).click();
      await user1Page.getByRole('button', { name: /OK/i }).click();

      await expect(user1Page).toHaveURL(/\/room\//);
      const roomId = captureRoomId(user1Page);

      await user2Page.goto('/');
      await user2Page.locator('input[placeholder="Enter your name"]').fill('User 2');
      await user2Page.getByRole('button', { name: /Join Existing Room/i }).click();
      await user2Page.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await user2Page.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(user2Page).toHaveURL(/\/room\//);

      await expect(user1Page.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(user2Page.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      await user2Page.locator('button[mattooltip="Leave Room"]').click();

      await expect(user2Page).toHaveURL('/');

      await expect(user1Page.locator('.section-title')).toContainText('Participants (1)', { timeout: 20000 });

      await expect(user1Page.locator('.participant-name').filter({ hasText: 'User 2' })).toHaveCount(0, { timeout: 5000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync vote reveal between admin and participants', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await adminPage.goto('/');
      await adminPage.locator('input[placeholder="Enter your name"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = captureRoomId(adminPage);

      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//);

      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.locator('mat-checkbox').getByText('I want to participate').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      await expect(adminPage.locator('.voting-section')).toBeVisible();
      await expect(userPage.locator('.voting-section')).toBeVisible({ timeout: 10000 });

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

      await expect(adminPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });
      await expect(userPage.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });

      await adminPage.getByRole('button', { name: /Reveal/i }).click();

      await expect(userPage.locator('.vote-status')).toContainText('Votes revealed', { timeout: 15000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
