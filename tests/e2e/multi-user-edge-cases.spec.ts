import { test, expect, createRoom, getRoomId, startVoting, castVote } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Edge Cases Tests', () => {
  test('should handle joining non-existent room gracefully', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('/');
      await page.locator('[data-testid="name-input"]').fill('Test User');
      await page.getByRole('button', { name: /Join Existing Room/i }).click();
      await page.locator('[data-testid="room-id-input"]').fill('NONEXIST');
      await page.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(page).toHaveURL('/');
    } finally {
      await context.close();
    }
  });

  test('should maintain room state after browser refresh', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await createRoom(page, 'Admin');
      const roomUrl = page.url();
      const roomId = getRoomId(page);

      await startVoting(page);
      await castVote(page);

      await page.reload();

      await expect(page).toHaveURL(roomUrl);
      await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context.close();
    }
  });

  test('should sync state across multiple tabs of same user', async ({ browser }) => {
    const context = await browser.newContext();
    const tab1 = await context.newPage();
    const tab2 = await context.newPage();

    try {
      await createRoom(tab1, 'Admin');
      const roomUrl = tab1.url();
      const roomId = getRoomId(tab1);

      await tab2.goto(roomUrl);
      await expect(tab2).toHaveURL(roomUrl);

      await tab1.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
      await tab1.getByRole('button', { name: /Start Voting/i }).click();
      await expect(tab1.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
      await expect(tab2.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      const card1 = tab1.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
      await card1.click();
      await expect(tab1.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });
      await expect(tab2.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context.close();
    }
  });
});
