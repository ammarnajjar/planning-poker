import { test, expect, createRoom, joinRoom, getRoomId, castVote, revealVotes } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Reset Tests', () => {
  test('should clear vote counts when admin resets', async ({ browser }) => {
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
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

      await adminPage.getByRole('button', { name: /Reset/i }).click();

      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start', { timeout: 15000 });

      // Start again and verify votes were cleared
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('0/2 voted', { timeout: 10000 });
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('0/2 voted', { timeout: 10000 });

      await cleanupTestRoom(roomId);
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
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      await joinRoom(userPage, roomId, 'User');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await adminPage.getByRole('button', { name: /Start Voting/i }).click();

      await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      await castVote(userPage, '5');
      await expect(userPage.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });

      await revealVotes(adminPage);
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

      await adminPage.getByRole('button', { name: /Reset/i }).click();

      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();
      await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start', { timeout: 15000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
