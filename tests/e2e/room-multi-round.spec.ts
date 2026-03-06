import { test, expect, createRoom, joinRoom, getRoomId, startVoting, castVote, revealVotes } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Multi-Round Voting', () => {
  test('should support multiple rounds of voting', async ({ page }) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);

    await startVoting(page);

    await castVote(page);

    await revealVotes(page);
    await page.getByRole('button', { name: /Reset/i }).click();
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });

    // Round 2
    await startVoting(page);

    const card2 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').nth(1);
    const first = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    if (await card2.isVisible().catch(() => false)) {
      await card2.click();
    } else {
      await first.click();
    }
    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });

    await cleanupTestRoom(roomId);
  });

  test('should clear previous votes when starting new round', async ({ page }) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);

    await startVoting(page);
    await castVote(page, '5');

    await revealVotes(page);
    await page.getByRole('button', { name: /Reset/i }).click();

    await expect(page.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start', { timeout: 5000 });

    await cleanupTestRoom(roomId);
  });

  test('should maintain participant list across multiple rounds', async ({ browser }) => {
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

      const adminCard = adminPage.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
      const userCard = userPage.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();

      if (await adminCard.isVisible().catch(() => false)) await adminCard.click();
      if (await userCard.isVisible().catch(() => false)) await userCard.click();

      await expect(adminPage.locator('[data-testid="vote-status"]')).toContainText('2/2', { timeout: 15000 });

      await revealVotes(adminPage);
      await adminPage.getByRole('button', { name: /Reset/i }).click();

      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(userPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
