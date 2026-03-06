import { test, expect, castVote, revealVotes } from './helpers/fixtures';

test.describe('Multi-User Real-Time Sync', () => {
  test('should show both users when they join the same room @smoke', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)');
    await expect(userPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)');

    await expect(adminPage.locator('[data-testid="participant-name"]').first()).toContainText('Admin');
    await expect(adminPage.locator('[data-testid="participant-name"]').nth(1)).toContainText('User', { timeout: 10000 });

    await expect(userPage.locator('[data-testid="participant-name"]').first()).toContainText('Admin');
    await expect(userPage.locator('[data-testid="participant-name"]').nth(1)).toContainText('User');
  });

  test('should sync vote count between users in real-time @smoke', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await adminPage.getByRole('button', { name: /Start Voting/i }).click();

    await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible();
    await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    await castVote(adminPage, '5');
    await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('1/2 voted', { timeout: 20000 });

    await castVote(userPage, '8');
    await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });
  });

  test('should sync when user leaves room', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)');
    await expect(userPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)');

    await userPage.locator('[data-testid="leave-room-button"]').click();
    await expect(userPage).toHaveURL('/');

    await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 20000 });
    await expect(adminPage.locator('[data-testid="participant-name"]').filter({ hasText: 'User' })).toHaveCount(0, { timeout: 5000 });
  });

  test('should sync vote reveal between admin and participants @smoke', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await adminPage.getByRole('button', { name: /Start Voting/i }).click();

    await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible();
    await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    await castVote(adminPage, '5');
    await castVote(userPage, '8');

    await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

    await revealVotes(adminPage);
    await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });
  });
});
