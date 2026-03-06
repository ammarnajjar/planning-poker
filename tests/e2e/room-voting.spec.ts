import { test, expect, createRoom, getRoomId, startVoting, castVote } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Voting', () => {
  test('should show voting cards when voting starts @smoke', async ({ page }) => {
    await createRoom(page, 'Admin User');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    await expect(page.locator('[data-testid="voting-section"]')).toBeVisible();

    const gridCards = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]');
    const carouselCard = page.locator('[data-testid="carousel-vote-card"]');

    const gridVisible = await gridCards.first().isVisible().catch(() => false);
    const carouselVisible = await carouselCard.isVisible().catch(() => false);

    expect(gridVisible || carouselVisible).toBeTruthy();
  });

  test('should allow selecting a card @smoke', async ({ page }) => {
    await createRoom(page, 'Admin User');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    const card5 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]').filter({ hasText: /^5$/ });
    const carouselCard = page.locator('[data-testid="carousel-vote-card"]');

    const gridVisible = await card5.isVisible().catch(() => false);

    if (gridVisible) {
      await card5.click();
      await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote: 5', { timeout: 10000 });
      await expect(card5).toHaveClass(/selected/);
    } else {
      await expect(carouselCard).toBeVisible();
      const cardValue = await carouselCard.textContent();
      await carouselCard.click();
      await expect(page.locator('[data-testid="current-selection"]')).toContainText(`Your vote: ${cardValue?.trim()}`, { timeout: 10000 });
    }
  });

  test('should support keyboard navigation for voting cards', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    await expect(page.locator('[data-testid="vote-status"]')).toBeVisible({ timeout: 5000 });

    const firstCard = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });
    await firstCard.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });
  });

  test('should display voting cards with proper styling', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    const firstCard = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });

    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(40);
      expect(box.height).toBeGreaterThan(40);
    }
  });

  test('should show selected card state visually', async ({ page }) => {
    await createRoom(page, 'Admin');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    const card5 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]').filter({ hasText: /^5$/ });
    if (await card5.isVisible().catch(() => false)) {
      const classBefore = await card5.getAttribute('class');
      expect(classBefore).not.toContain('selected');

      await card5.click();
      await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });

      const classAfter = await card5.getAttribute('class');
      expect(classAfter).toContain('selected');
    }
  });

  test('should handle special vote values', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    await castVote(page);

    const card5 = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]').filter({ hasText: /^5$/ });
    if (await card5.isVisible().catch(() => false)) {
      await card5.click();
      await expect(page.locator('[data-testid="current-selection"]')).toContainText('5', { timeout: 5000 });
    }
  });

  test('should handle reset during voting', async ({ page }) => {
    await createRoom(page, 'Admin');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);
    await castVote(page);

    await page.getByRole('button', { name: /Reset/i }).click();

    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('Waiting for voting to start', { timeout: 5000 });
  });
});
