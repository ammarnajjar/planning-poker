import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 12 Pro'],
});

test.describe('Mobile-Specific Features', () => {
  test('should have proper viewport meta tag', async ({ page }) => {
    await page.goto('/');

    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
    expect(viewport).toContain('viewport-fit=cover');
  });

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');

    // Check that buttons meet iOS touch target guidelines (44px minimum)
    const createButton = page.getByRole('button', { name: /Create New Room/i });
    const buttonBox = await createButton.boundingBox();

    if (buttonBox) {
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should not zoom on input focus', async ({ page }) => {
    await page.goto('/');

    const nameInput = page.locator('input[placeholder="Enter your name"]');

    // Get computed font size
    const fontSize = await nameInput.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    // Should be 16px or larger to prevent iOS zoom
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });

  test('should display compact mobile layout', async ({ page }) => {
    await page.goto('/');

    // Check mobile-specific styling
    const toolbar = page.locator('mat-toolbar');
    const toolbarHeight = await toolbar.evaluate(el => {
      return window.getComputedStyle(el).minHeight;
    });

    // Mobile toolbar should be 56px
    expect(toolbarHeight).toBe('56px');
  });

  test('should have proper touch targets in room', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Start voting
    await page.getByRole('button', { name: /Start Voting/i }).click();

    // Check card sizes for touch
    const card = page.locator('.card').first();
    const cardBox = await card.boundingBox();

    if (cardBox) {
      // Cards should be large enough for easy tapping
      expect(cardBox.width).toBeGreaterThanOrEqual(60);
      expect(cardBox.height).toBeGreaterThanOrEqual(60);
    }
  });

  test('should enable scrolling on mobile', async ({ page }) => {
    await page.goto('/');

    // Check that body allows scrolling
    const bodyOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflowY;
    });

    expect(bodyOverflow).toBe('auto');
  });

  test('should hide toolbar title on mobile in room', async ({ page }) => {
    // Create room
    await page.goto('/');
    await page.locator('input[placeholder="Enter your name"]').fill('Mobile User');
    await page.getByRole('button', { name: /Create New Room/i }).click();
    await page.getByRole('button', { name: /Skip/i }).click();

    await expect(page).toHaveURL(/\/room\//);

    // Toolbar title should be hidden on mobile
    const toolbarTitle = page.locator('.toolbar-title');
    const isVisible = await toolbarTitle.isVisible();
    expect(isVisible).toBe(false);
  });

  test('should handle orientation change', async ({ page }) => {
    await page.goto('/');

    // Test portrait mode (default)
    let viewportSize = page.viewportSize();
    expect(viewportSize?.height).toBeGreaterThan(viewportSize?.width || 0);

    // Simulate landscape by changing viewport
    await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 Pro landscape

    // Page should still be usable
    await expect(page.locator('mat-card')).toBeVisible();
    await expect(page.locator('.toolbar-title')).toBeVisible();
  });

  test('should show smooth animations', async ({ page }) => {
    await page.goto('/');

    // Check that cards have fade-in animation
    const card = page.locator('mat-card').first();

    // Get animation properties
    const animationName = await card.evaluate(el => {
      return window.getComputedStyle(el).animationName;
    });

    expect(animationName).toBe('fadeIn');
  });

  test('should respect reduced motion preference', async ({ page, context }) => {
    // Set reduced motion preference
    await context.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
      });
    });

    await page.goto('/');

    // Animations should be nearly instant
    const card = page.locator('mat-card').first();
    const animationDuration = await card.evaluate(el => {
      return window.getComputedStyle(el).animationDuration;
    });

    // With reduced motion, duration should be very short
    expect(parseFloat(animationDuration)).toBeLessThan(0.1);
  });
});

test.describe('Mobile Safari Specific', () => {
  test.use({
    ...devices['iPhone 12 Pro'],
    hasTouch: true,
  });

  test('should be installable as PWA', async ({ page }) => {
    await page.goto('/');

    // Check for web app manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest/);

    // Check for apple-touch-icon
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveCount(1);

    // Check for apple-mobile-web-app-capable
    const webAppCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(webAppCapable).toHaveAttribute('content', 'yes');
  });

  test('should have proper status bar styling', async ({ page }) => {
    await page.goto('/');

    const statusBarStyle = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
    await expect(statusBarStyle).toHaveAttribute('content', 'black-translucent');
  });
});
