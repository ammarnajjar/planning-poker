import { test, expect, createRoom, getRoomId, startVoting, joinRoom, revealVotes } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('UI States and Feedback', () => {
  test('should show correct button states based on room state', async ({ page }) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);

    // Initial state
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reveal/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).not.toBeVisible();

    // Start voting (without participation — just clicks Start Voting and waits for Reveal to appear)
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();

    // Reveal
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

  test('should show participant vote status indicators', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const userContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const userPage = await userContext.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await joinRoom(userPage, roomId, 'User');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await adminPage.getByRole('button', { name: /Start Voting/i }).click();
      await expect(userPage.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });

      const userCard = userPage.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"], [data-testid="carousel-vote-card"]').first();
      if (await userCard.isVisible().catch(() => false)) {
        await userCard.click();
        await expect(userPage.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 5000 });

        await expect(adminPage.locator('[data-testid="vote-count"]')).toContainText('1/1', { timeout: 10000 });
      }

      await cleanupTestRoom(roomId);
    } finally {
      await adminContext.close();
      await userContext.close();
    }
  });

  test('should show admin controls only to admin', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const userContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const userPage = await userContext.newPage();

    try {
      await createRoom(adminPage, 'Admin');
      const roomId = getRoomId(adminPage);

      await joinRoom(userPage, roomId, 'User');
      await expect(userPage).toHaveURL(/\/room\//);

      await expect(adminPage.locator('[data-testid="admin-controls"]')).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();

      await expect(userPage.locator('[data-testid="admin-controls"]')).not.toBeVisible();
      await expect(userPage.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();

      await cleanupTestRoom(roomId);
    } finally {
      await adminContext.close();
      await userContext.close();
    }
  });
});
