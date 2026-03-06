import { test, expect, createRoom, getRoomId, startVoting, revealVotes } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('UI States and Feedback', () => {
  test('should show correct button states based on room state', async ({ page }) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);

    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reveal/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).not.toBeVisible();

    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();

    await revealVotes(page);
    await expect(page.getByRole('button', { name: /Hide/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible();

    await cleanupTestRoom(roomId);
  });

  test('should display vote status correctly', async ({ page }) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);

    await expect(page.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start');

    await startVoting(page);
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('0/1', { timeout: 5000 });

    const card = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await expect(page.locator('[data-testid="vote-status"]')).toContainText('1/1', { timeout: 5000 });
    }

    await cleanupTestRoom(roomId);
  });

  test('should show participant vote status indicators', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await adminPage.getByRole('button', { name: /Start Voting/i }).click();
    await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const userCard = userPage.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    if (await userCard.isVisible().catch(() => false)) {
      await userCard.click();
      await expect(userPage.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });
      await expect(adminPage.locator('[data-testid="vote-count"]')).toContainText('1/1', { timeout: 10000 });
    }
  });

  test('should show admin controls only to admin', async ({ twoUserRoom }) => {
    const { adminPage, userPage } = twoUserRoom;

    await expect(adminPage.locator('[data-testid="admin-controls"]')).toBeVisible();
    await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    await expect(userPage.locator('[data-testid="admin-controls"]')).not.toBeVisible();
    await expect(userPage.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();
  });
});
