import { test, expect, startVoting, castVote } from './helpers/fixtures';

test.describe('Multi-User Edge Cases Tests', () => {
  test('should handle joining non-existent room gracefully', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="name-input"]').fill('Test User');
    await page.getByRole('button', { name: /Join Existing Room/i }).click();
    await page.locator('[data-testid="room-id-input"]').fill('NONEXIST');
    await page.getByRole('button', { name: /^Join Room$/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('should maintain room state after browser refresh', async ({ adminRoom }) => {
    const { page } = adminRoom;
    const roomUrl = page.url();

    await startVoting(page);
    await castVote(page);

    await page.reload();

    await expect(page).toHaveURL(roomUrl);
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });
  });

  test('should sync state across multiple tabs of same user', async ({ adminRoom }) => {
    const { page } = adminRoom;
    const roomUrl = page.url();

    // Open same room in a second tab within the same context (same user session)
    const tab2 = await page.context().newPage();
    await tab2.goto(roomUrl);
    await expect(tab2).toHaveURL(roomUrl);

    await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
    await expect(tab2.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

    const card1 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    await card1.click();
    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });
    await expect(tab2.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });

    await tab2.close();
  });
});
