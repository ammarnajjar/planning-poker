import { test, expect, castVote, revealVotes } from './helpers/fixtures';

test.describe('Multi-User Reset Tests', () => {
  test('should clear vote counts when admin resets', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

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
  });

  test('should sync reset votes between users', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await adminPage.getByRole('button', { name: /Start Voting/i }).click();

    await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible();
    await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    await castVote(userPage, '5');

    await revealVotes(adminPage);
    await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

    await adminPage.getByRole('button', { name: /Reset/i }).click();

    await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();
    await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start', { timeout: 15000 });
  });
});
