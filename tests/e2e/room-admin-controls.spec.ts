import { test, expect, createRoom, getRoomId, startVoting } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Admin Controls', () => {
  test('should display admin controls for room creator @smoke', async ({ page }) => {
    await createRoom(page, 'Admin User');
    await cleanupTestRoom(getRoomId(page));

    await expect(page.locator('[data-testid="admin-participate-checkbox"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should toggle admin participation @smoke', async ({ page }) => {
    await createRoom(page, 'Admin');
    await cleanupTestRoom(getRoomId(page));

    await startVoting(page);

    // Admin should see voting cards (confirms participation is enabled)
    const voteCards = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]');
    await expect(voteCards.first()).toBeAttached({ timeout: 5000 });

    // Verify vote status shows 1 participant
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('0/1', { timeout: 5000 });
  });

  test('should have share room button', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));

    await expect(page.locator('[data-testid="share-room-button"]')).toBeVisible();
  });

  test('should show participants list', async ({ page }) => {
    await createRoom(page, 'Test User');
    await cleanupTestRoom(getRoomId(page));

    await expect(page.locator('[data-testid="participants-title"]')).toContainText('Participants');
    await expect(page.locator('[data-testid="participant-name"]').first()).toBeVisible();
  });
});
