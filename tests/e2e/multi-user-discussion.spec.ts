import { test, expect, castVote, revealVotes } from './helpers/fixtures';

test.describe('Multi-User Discussion Tests', () => {
  test('should start discussion mode and highlight min/max voters', async ({ threeUserRoom }) => {
    const { adminPage, user1Page, user2Page } = threeUserRoom;

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
  });

  test('should end discussion mode when admin clicks End Discussion', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

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
  });

  test('should automatically end discussion mode when hiding votes', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

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
  });

  test('should not show Discuss button when all votes are the same', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await adminPage.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await adminPage.getByRole('button', { name: /Start Voting/i }).click();
    await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    await castVote(adminPage, '5');
    await castVote(userPage, '5');

    await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2 voted', { timeout: 15000 });

    await revealVotes(adminPage);
    await expect(userPage.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 15000 });

    expect(await adminPage.getByRole('button', { name: /Discuss/i }).isVisible().catch(() => false)).toBe(false);
  });
});
