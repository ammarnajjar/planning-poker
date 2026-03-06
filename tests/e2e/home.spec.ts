import { test, expect, getRoomId } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the home page with title and branding @smoke', async ({ page }) => {
    await expect(page).toHaveTitle(/Planning Poker/);

    await expect(page.locator('mat-toolbar')).toBeVisible();
    await expect(page.locator('[data-testid="app-logo-icon"]')).toContainText('casino');
    await expect(page.locator('.toolbar-title')).toContainText('Planning Poker');

    await expect(page.locator('mat-card')).toBeVisible();
    await expect(page.locator('mat-card-title')).toContainText('Welcome to Planning Poker');
    await expect(page.locator('mat-card-subtitle')).toContainText('Estimate your user stories with your team');
  });

  test('should show "How it works" section', async ({ page }) => {
    await expect(page.locator('[data-testid="info-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="info-section"] h3')).toContainText('How it works');

    const listItems = page.locator('[data-testid="info-section"] li');
    await expect(listItems).toHaveCount(4);
    await expect(listItems.first()).toContainText('Create a room');
  });

  test('should have name input field @smoke', async ({ page }) => {
    const nameInput = page.locator('[data-testid="name-input"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEditable();
  });

  test('should show create and join buttons initially', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create New Room/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Join Existing Room/i })).toBeVisible();
  });

  test('should toggle join form when clicking Join Existing Room', async ({ page }) => {
    await expect(page.locator('[data-testid="room-id-input"]')).not.toBeVisible();

    await page.locator('[data-testid="show-join-form-button"]').click();

    await expect(page.locator('[data-testid="room-id-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="join-room-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="back-button"]')).toBeVisible();
  });

  test('should show admin checkbox when in join mode', async ({ page }) => {
    await page.locator('[data-testid="show-join-form-button"]').click();

    await expect(page.locator('[data-testid="join-as-admin-checkbox"]')).toBeVisible();
    await expect(page.locator('[data-testid="join-as-admin-checkbox"]')).toContainText('Join as admin');
  });

  test('should validate required name field when creating room', async ({ page }) => {
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page.locator('simple-snack-bar')).toContainText('Please enter your name');
  });

  test('should create room with valid name @smoke', async ({ page }) => {
    await page.locator('[data-testid="name-input"]').fill('Test User');
    await page.getByRole('button', { name: /Create New Room/i }).click();

    await expect(page.locator('h2')).toContainText('Set Admin PIN');

    // Clean up the room created by the dialog OK handler if any
    await page.getByRole('button', { name: /OK/i }).click();
    await expect(page).toHaveURL(/\/room\//);
    await cleanupTestRoom(getRoomId(page));
  });

  test('should be mobile responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      const toolbar = page.locator('mat-toolbar');
      await expect(toolbar).toHaveCSS('min-height', '56px');

      const buttons = page.locator('[data-testid="create-room-button"], [data-testid="show-join-form-button"]');
      const firstBox = await buttons.first().boundingBox();
      const secondBox = await buttons.nth(1).boundingBox();

      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
      }
    }
  });

  test('should prevent zoom on input focus (mobile)', async ({ page, isMobile }) => {
    if (isMobile) {
      const nameInput = page.locator('[data-testid="name-input"]');
      const fontSize = await nameInput.evaluate(el => window.getComputedStyle(el).fontSize);
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    }
  });
});
