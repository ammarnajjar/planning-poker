import { test, expect, createRoom, joinRoom, getRoomId, castVote, revealVotes } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Discussion Tests', () => {
  test('should start discussion mode and highlight min/max voters', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    const adminPage = await context1.newPage();
    const user1Page = await context2.newPage();
    const user2Page = await context3.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await joinRoom(user1Page, roomId, 'User1');
      await joinRoom(user2Page, roomId, 'User2');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (3)', { timeout: 10000 });

      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(user1Page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(user1Page, '2');
      await castVote(user2Page, '13');

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2', { timeout: 15000 });

      await revealVotes(adminPage);
      await expect(user1Page.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

      await expect(adminPage.getByRole('button', { name: /Discuss/i })).toBeVisible();
      await adminPage.getByRole('button', { name: /Discuss/i }).click();

      await expect(adminPage.getByRole('button', { name: /End Discussion/i })).toBeVisible({ timeout: 10000 });

      await expect(adminPage.locator('[data-testid="discussion-title"]')).toContainText('Discussion Mode');
      await expect(adminPage.locator('[data-testid="discussion-indicator-min"]')).toContainText('LOW');
      await expect(adminPage.locator('[data-testid="discussion-indicator-max"]')).toContainText('HIGH');

      await expect(user1Page.locator('[data-testid="discussion-title"]')).toBeVisible({ timeout: 15000 });
      await expect(user2Page.locator('[data-testid="discussion-title"]')).toBeVisible({ timeout: 15000 });

      await expect(user1Page.locator('[data-testid="discussion-indicator-min"]')).toContainText('LOW', { timeout: 15000 });
      await expect(user2Page.locator('[data-testid="discussion-indicator-min"]')).toContainText('LOW', { timeout: 15000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });

  test('should end discussion mode when admin clicks End Discussion', async ({ browser }) => {
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
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(adminPage, '3');
      await castVote(userPage, '8');

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

      await revealVotes(adminPage);
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

      await adminPage.getByRole('button', { name: /Discuss/i }).click();
      await expect(userPage.locator('[data-testid="discussion-title"]')).toBeVisible({ timeout: 15000 });

      await adminPage.getByRole('button', { name: /End Discussion/i }).click();

      await expect(adminPage.getByRole('button', { name: /Discuss/i })).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('[data-testid="discussion-title"]')).not.toBeVisible();
      await expect(userPage.locator('[data-testid="discussion-title"]')).not.toBeVisible({ timeout: 15000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should automatically end discussion mode when hiding votes', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      await joinRoom(userPage, roomId, 'User');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(adminPage, '5');
      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('1/2', { timeout: 10000 });

      await castVote(userPage, '13');
      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2', { timeout: 15000 });

      await revealVotes(adminPage);
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

      await adminPage.getByRole('button', { name: /Discuss/i }).click();
      await expect(userPage.locator('[data-testid="discussion-title"]')).toBeVisible({ timeout: 15000 });

      await adminPage.getByRole('button', { name: /Hide/i }).click();

      await expect(adminPage.locator('[data-testid="discussion-title"]')).not.toBeVisible();
      await expect(adminPage.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });
      await expect(userPage.locator('[data-testid="discussion-title"]')).not.toBeVisible({ timeout: 15000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should not show Discuss button when all votes are the same', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      await joinRoom(userPage, roomId, 'User');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 15000 });

      await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(adminPage, '5');
      await expect(adminPage.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });

      await castVote(userPage, '5');
      await expect(userPage.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

      await revealVotes(adminPage);
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

      const discussVisible = await adminPage.getByRole('button', { name: /Discuss/i }).isVisible().catch(() => false);
      expect(discussVisible).toBe(false);

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
