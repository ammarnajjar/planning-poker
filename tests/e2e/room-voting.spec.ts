import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Voting', () => {
  let createdRoomIds: string[] = [];

  const captureRoomId = (page: any) => {
    const url = page.url();
    const roomId = url.split('/room/')[1];
    if (roomId && !createdRoomIds.includes(roomId)) {
      createdRoomIds.push(roomId);
    }
    return roomId;
  };

  test.afterEach(async () => {
    for (const roomId of createdRoomIds) {
      await cleanupTestRoom(roomId);
    }
    createdRoomIds = [];
  });

  test('should show voting cards when voting starts', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    const participateCheckbox = page.locator('mat-checkbox').getByText('I want to participate');
    await participateCheckbox.click();

    await page.getByRole('button', { name: /Start Voting/i }).click();

    await expect(page.locator('.voting-section')).toBeVisible();

    const gridCards = page.locator('.vote-cards-grid .vote-card-large');
    const carouselCard = page.locator('.card-carousel .vote-card-large');

    const gridVisible = await gridCards.first().isVisible().catch(() => false);
    const carouselVisible = await carouselCard.isVisible().catch(() => false);

    expect(gridVisible || carouselVisible).toBeTruthy();
  });

  test('should allow selecting a card', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    const participateCheckbox = page.locator('mat-checkbox').getByText('I want to participate');
    await participateCheckbox.click();

    await page.getByRole('button', { name: /Start Voting/i }).click();

    await expect(page.locator('.voting-section')).toBeVisible();

    const gridCard = page.locator('.vote-cards-grid .vote-card-large').first();
    const carouselCard = page.locator('.card-carousel .vote-card-large');

    const gridVisible = await gridCard.isVisible().catch(() => false);

    if (gridVisible) {
      const card5 = page.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
      await card5.click();

      await expect(page.locator('.current-selection')).toContainText('Your vote: 5', { timeout: 10000 });

      await expect(card5).toHaveClass(/selected/);
    } else {
      await expect(carouselCard).toBeVisible();
      const cardValue = await carouselCard.textContent();
      await carouselCard.click();

      await expect(page.locator('.current-selection')).toContainText(`Your vote: ${cardValue?.trim()}`, { timeout: 10000 });
    }
  });

  test('should support keyboard navigation for voting cards', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await page.locator('mat-checkbox').getByText('I want to participate').click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('.vote-status')).toBeVisible({ timeout: 5000 });

    const firstCard = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });
    await firstCard.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('.current-selection')).toContainText('Your vote:', { timeout: 10000 });
  });

  test('should display voting cards with proper styling', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(captureRoomId(page));

    await page.locator('mat-checkbox').getByText('I want to participate').click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Start Voting/i }).click();
    await expect(page.locator('.voting-section')).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('.vote-cards-grid .vote-card-large, .card-carousel .vote-card-large').first();
    await firstCard.waitFor({ state: 'visible', timeout: 5000 });

    const box = await firstCard.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(40);
      expect(box.height).toBeGreaterThan(40);
    }
  });
});
