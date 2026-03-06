import { test, expect, createRoom, joinRoom, getRoomId, castVote, revealVotes } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Real-Time Sync', () => {
  test('should show both users when they join the same room @smoke', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const user1Page = await context1.newPage();
    const user2Page = await context2.newPage();

    try {
      await createRoom(user1Page, 'User 1');
      const roomId = getRoomId(user1Page);

      await expect(user1Page.locator('[data-testid="participants-title"]')).toContainText('Participants (1)');

      await joinRoom(user2Page, roomId, 'User 2');

      await expect(user1Page.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(user2Page.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await expect(user1Page.locator('[data-testid="participant-name"]').first()).toContainText('User 1');
      await expect(user1Page.locator('[data-testid="participant-name"]').nth(1)).toContainText('User 2', { timeout: 10000 });

      await expect(user2Page.locator('[data-testid="participant-name"]').first()).toContainText('User 1');
      await expect(user2Page.locator('[data-testid="participant-name"]').nth(1)).toContainText('User 2');

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync vote count between users in real-time @smoke', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await joinRoom(userPage, roomId, 'User');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(adminPage, '5');
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('1/2 voted', { timeout: 20000 });

      await castVote(userPage, '8');

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

      await cleanupTestRoom(roomId);
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
      await createRoom(user1Page, 'User 1');
      const roomId = getRoomId(user1Page);

      await joinRoom(user2Page, roomId, 'User 2');

      await expect(user1Page.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(user2Page.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await user2Page.locator('[data-testid="leave-room-button"]').click();
      await expect(user2Page).toHaveURL('/');

      await expect(user1Page.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 20000 });
      await expect(user1Page.locator('[data-testid="participant-name"]').filter({ hasText: 'User 2' })).toHaveCount(0, { timeout: 5000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should sync vote reveal between admin and participants @smoke', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await joinRoom(userPage, roomId, 'User');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(adminPage, '5');
      await castVote(userPage, '8');

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

      await revealVotes(adminPage);
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
