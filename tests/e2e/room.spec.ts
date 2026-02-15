import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Room Functionality', () => {
  let createdRoomIds: string[] = [];

  // Helper to capture room ID from URL
  const captureRoomId = (page: any) => {
    const url = page.url();
    const roomId = url.split('/room/')[1];
    if (roomId && !createdRoomIds.includes(roomId)) {
      createdRoomIds.push(roomId);
    }
    return roomId;
  };

  test.afterEach(async () => {
    // Clean up any rooms created during tests
    for (const roomId of createdRoomIds) {
      await cleanupTestRoom(roomId);
    }
    createdRoomIds = [];
  });

  test('should create room and navigate to room page', async ({ page }) => {
    await page.goto('/');

    // Enter name
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');

    // Click create room
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Handle PIN dialog - skip PIN for test
    await expect(page.locator('h2')).toContainText('Set Admin PIN');
    await page.getByRole('button', { name: /OK/i }).click();

    // Should navigate to room page
    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Check room toolbar
    await expect(page.locator('mat-toolbar')).toBeVisible();
    await expect(page.locator('.room-id')).toBeVisible();
  });

  test('should display admin controls for room creator', async ({ page }) => {
    // Create room and navigate
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    // Wait for room page
    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Wait for room state to load and admin controls to appear
    await expect(page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

    // Check admin controls
    await expect(page.locator('.admin-controls')).toBeVisible();
    await expect(page.locator('mat-checkbox')).toContainText('I want to participate');
  });

  test('should show voting cards when voting starts', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation to see voting cards
    const participateCheckbox = page.locator('mat-checkbox').getByText('I want to participate');
    await participateCheckbox.click();

    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Voting section should be visible
    await expect(page.locator('.voting-section')).toBeVisible();

    // Should show voting cards - check both grid (desktop) and carousel (mobile)
    // At least one layout should be visible
    const gridCards = page.locator('.vote-cards-grid .vote-card-large');
    const carouselCard = page.locator('.card-carousel .vote-card-large');

    const gridVisible = await gridCards.first().isVisible().catch(() => false);
    const carouselVisible = await carouselCard.isVisible().catch(() => false);

    expect(gridVisible || carouselVisible).toBeTruthy();
  });

  test('should allow selecting a card', async ({ page }) => {
    // Fixed: Now using optimistic updates for vote state
    // Vote state is updated locally immediately when voting, then synced to Supabase

    // Create room and start voting
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation (click the text, not the checkbox itself)
    const participateCheckbox = page.locator('mat-checkbox').getByText('I want to participate');
    await participateCheckbox.click();

    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Wait for voting section to be visible
    await expect(page.locator('.voting-section')).toBeVisible();

    // On desktop, cards are in a grid. On mobile, cards are in a carousel.
    // We'll click whichever card is currently visible
    // Desktop: find card in grid, Mobile: use the visible carousel card
    const gridCard = page.locator('.vote-cards-grid .vote-card-large').first();
    const carouselCard = page.locator('.card-carousel .vote-card-large');

    // Determine which layout is visible and click a card
    const gridVisible = await gridCard.isVisible().catch(() => false);

    if (gridVisible) {
      // Desktop: Click specific card "5" (use exact match to avoid matching "35", "50")
      const card5 = page.locator('.vote-cards-grid .vote-card-large').filter({ hasText: /^5$/ });
      await card5.click();

      // Wait for vote to be recorded (vote syncs with Supabase)
      // Check that "Your vote:" updates from "?" to "5"
      await expect(page.locator('.current-selection')).toContainText('Your vote: 5', { timeout: 10000 });

      // Now verify the card has selected class
      await expect(card5).toHaveClass(/selected/);
    } else {
      // Mobile: Click the currently visible carousel card
      await expect(carouselCard).toBeVisible();
      const cardValue = await carouselCard.textContent();
      await carouselCard.click();

      // Wait for vote to be recorded (vote syncs with Supabase)
      // Check that "Your vote:" updates from "?" to the clicked card value
      await expect(page.locator('.current-selection')).toContainText(`Your vote: ${cardValue?.trim()}`, { timeout: 10000 });
    }
  });

  test('should copy room ID to clipboard', async ({ page, context, browserName }) => {
    // Skip on webkit (Safari) and firefox - clipboard permissions not supported
    test.skip(browserName === 'webkit' || browserName === 'firefox', 'Clipboard permissions not fully supported');

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    const roomId = captureRoomId(page);

    // Wait for room ID to be visible
    await expect(page.locator('.room-id')).toBeVisible();

    // Click copy button
    await page.locator('button[mattooltip="Copy Room ID"]').click();

    // Wait a moment for clipboard operation
    await page.waitForTimeout(500);

    // Check clipboard content matches the room ID from URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(roomId);

    // Should show snackbar confirmation (Material snackbar)
    // The snackbar might disappear quickly, so we just check the clipboard worked above
    // If we want to verify snackbar: await expect(page.locator('.mat-mdc-snack-bar-container')).toBeVisible({ timeout: 2000 });
  });

  test('should leave room and return to home', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Admin User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Click back button
    await page.locator('button[mattooltip="Leave Room"]').click();

    // Should return to home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('mat-card-title')).toContainText('Welcome to Planning Poker');
  });

  test('should show participants list', async ({ page }) => {
    // Fixed: Now using optimistic updates for participants
    // Participant is added to local state immediately when joining/creating room

    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Participants section should be visible
    await expect(page.locator('.participants-section')).toBeVisible();

    // Wait for participant count to update from (0) to at least (1)
    await expect(page.locator('.section-title')).toContainText('Participants (1)');

    // Now verify participant name is visible (use first() because there are mobile and desktop layouts)
    await expect(page.locator('.participant-name').first()).toContainText('Test User');
  });

  test('should be mobile responsive in room', async ({ page, isMobile }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

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
