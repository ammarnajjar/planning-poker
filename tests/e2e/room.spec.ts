import { test, expect } from '@playwright/test';

test.describe('Room Functionality', () => {
  test('should create room and navigate to room page', async ({ page }) => {
    await page.goto('/');

    // Enter name
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');

    // Click create room
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Handle PIN dialog - skip PIN for test
    await expect(page.locator('h2')).toContainText('Set Admin PIN');
    await page.getByRole('button', { name: /Skip/i }).click();

    // Should navigate to room page
    await expect(page).toHaveURL(/\/room\//);

    // Check room toolbar
    await expect(page.locator('mat-toolbar')).toBeVisible();
    await expect(page.locator('.room-id')).toBeVisible();
  });

  test('should display admin controls for room creator', async ({ page }) => {
    // Create room and navigate
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    // Wait for room page
    await expect(page).toHaveURL(/\/room\//);

    // Check admin controls
    await expect(page.locator('.admin-controls')).toBeVisible();
    await expect(page.locator('mat-checkbox')).toContainText('I want to participate');
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  });

  test('should show voting cards when voting starts', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Voting section should be visible
    await expect(page.locator('.voting-section')).toBeVisible();

    // Should show voting cards
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
  });

  test('should allow selecting a card', async ({ page }) => {
    // Create room and start voting
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Enable admin participation
    const participateCheckbox = page.locator('mat-checkbox');
    if (!(await participateCheckbox.isChecked())) {
      await participateCheckbox.click();
    }

    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Wait for cards to be visible
    await expect(page.locator('.card').first()).toBeVisible();

    // Click a card (e.g., "5")
    const card5 = page.locator('.card').filter({ hasText: '5' }).first();
    await card5.click();

    // Card should be selected
    await expect(card5).toHaveClass(/selected/);
  });

  test('should copy room ID to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Get room ID text
    const roomIdText = await page.locator('.room-id').textContent();

    // Click copy button
    await page.locator('button[mattooltip="Copy Room ID"]').click();

    // Check clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(roomIdText?.trim());

    // Should show snackbar confirmation
    await expect(page.locator('simple-snack-bar')).toContainText('Room ID copied');
  });

  test('should leave room and return to home', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Click back button
    await page.locator('button[mattooltip="Leave Room"]').click();

    // Should return to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('mat-card-title')).toContainText('Welcome to Planning Poker');
  });

  test('should show participants list', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Participants section should be visible
    await expect(page.locator('.participants-section')).toBeVisible();

    // Should show at least one participant (admin)
    const participants = page.locator('.participant-card');
    await expect(participants).toHaveCount(1);
    await expect(participants.first()).toContainText('Test User');
  });

  test('should be mobile responsive in room', async ({ page, isMobile }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    if (isMobile) {
      // On mobile, toolbar title should be hidden
      const toolbarTitle = page.locator('.toolbar-title');
      const isVisible = await toolbarTitle.isVisible();
      expect(isVisible).toBe(false);

      // Room ID should be visible and compact
      const roomId = page.locator('.room-id');
      await expect(roomId).toBeVisible();

      const fontSize = await roomId.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });

      expect(parseInt(fontSize)).toBe(14); // Mobile font size
    }
  });
});
