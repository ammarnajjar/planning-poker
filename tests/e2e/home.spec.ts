import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the home page with title and branding', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/Planning Poker/);

    // Check toolbar
    await expect(page.locator('mat-toolbar')).toBeVisible();
    await expect(page.locator('mat-toolbar mat-icon')).toContainText('casino');
    await expect(page.locator('.toolbar-title')).toContainText('Planning Poker');

    // Check main card
    await expect(page.locator('mat-card')).toBeVisible();
    await expect(page.locator('mat-card-title')).toContainText('Welcome to Planning Poker');
    await expect(page.locator('mat-card-subtitle')).toContainText('Estimate your user stories with your team');
  });

  test('should show "How it works" section', async ({ page }) => {
    await expect(page.locator('.info-section')).toBeVisible();
    await expect(page.locator('.info-section h3')).toContainText('How it works');

    // Check list items
    const listItems = page.locator('.info-section li');
    await expect(listItems).toHaveCount(4);
    await expect(listItems.first()).toContainText('Create a room');
  });

  test('should have name input field', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEditable();
  });

  test('should show create and join buttons initially', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create New Room/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Join Existing Room/i })).toBeVisible();
  });

  test('should toggle join form when clicking Join Existing Room', async ({ page }) => {
    // Initially room ID input should not be visible
    await expect(page.locator('input[placeholder="Enter room ID"]')).not.toBeVisible();

    // Click join button
    await page.getByRole('button', { name: /Join Existing Room/i }).click();

    // Room ID input should now be visible
    await expect(page.locator('input[placeholder="Enter room ID"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Join Room$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Back/i })).toBeVisible();
  });

  test('should show admin checkbox when in join mode', async ({ page }) => {
    // Click join button
    await page.getByRole('button', { name: /Join Existing Room/i }).click();

    // Admin checkbox should be visible
    await expect(page.locator('mat-checkbox')).toBeVisible();
    await expect(page.locator('mat-checkbox')).toContainText('Join as admin');
  });

  test('should validate required name field when creating room', async ({ page }) => {
    // Try to create room without name
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Should show snackbar message
    await expect(page.locator('simple-snack-bar')).toContainText('Please enter your name');
  });

  test('should create room with valid name', async ({ page }) => {
    // Enter name
    await page.locator('input[placeholder="Enter your name"]').fill('Test User');

    // Click create room - this will show PIN dialog
    await page.getByRole('button', { name: /Create New Room/i }).click();

    // Wait for PIN dialog
    await expect(page.locator('h2')).toContainText('Set Admin PIN');
  });

  test('should be mobile responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      // On mobile, check that elements are stacked vertically
      const toolbar = page.locator('mat-toolbar');
      await expect(toolbar).toHaveCSS('min-height', '56px');

      // Check that buttons stack vertically
      const buttons = page.locator('.action-button');
      const firstButton = buttons.first();
      const secondButton = buttons.nth(1);

      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();

      if (firstBox && secondBox) {
        // Buttons should be vertically stacked
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
      }
    }
  });

  test('should prevent zoom on input focus (mobile)', async ({ page, isMobile }) => {
    if (isMobile) {
      const nameInput = page.locator('input[placeholder="Enter your name"]');

      // Check that font size is 16px or larger to prevent iOS zoom
      const fontSize = await nameInput.evaluate(el => {
        return window.getComputedStyle(el).fontSize;
      });

      const fontSizeValue = parseInt(fontSize);
      expect(fontSizeValue).toBeGreaterThanOrEqual(16);
    }
  });
});
