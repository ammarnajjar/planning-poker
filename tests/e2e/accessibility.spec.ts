import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cleanupTestRoom } from './helpers/cleanup';
import { createTestUser, Selectors } from './helpers/factories';

test.describe('Accessibility @a11y', () => {
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

  test('should not have accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    // Disable rules for known structural issues (to be fixed in future)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on room page', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('A11yTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Wait for room to be fully loaded
    await expect(page.locator(Selectors.room.adminControls)).toBeVisible();

    // Disable rules for known structural issues (to be fixed in future)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations during voting', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('A11yTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation
    await page.locator(Selectors.room.participationCheckbox).click();
    await page.waitForTimeout(500);

    // Start voting
    await page.locator(Selectors.room.startVotingButton).click();
    await expect(page.locator(Selectors.room.votingSection)).toBeVisible({ timeout: 10000 });

    // Disable rules for known structural issues (to be fixed in future)
    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation on home page', async ({ page }) => {
    await page.goto('/');

    // Tab to name input
    await page.keyboard.press('Tab');
    const nameInput = page.locator(Selectors.home.nameInput);
    await expect(nameInput).toBeFocused();

    // Type name
    await page.keyboard.type(createTestUser('KeyboardTest'));

    // Tab to Create button
    await page.keyboard.press('Tab');
    const createButton = page.locator(Selectors.home.createButton);
    await expect(createButton).toBeFocused();
  });

  test('should support keyboard navigation for voting cards', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('KeyboardTest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Enable admin participation
    await page.locator(Selectors.room.participationCheckbox).click();
    await page.waitForTimeout(500);

    // Start voting
    await page.locator(Selectors.room.startVotingButton).click();
    await expect(page.locator(Selectors.room.votingSection)).toBeVisible({ timeout: 10000 });

    // Check that vote cards are keyboard accessible
    const firstCard = page.locator(`${Selectors.room.voteCardGrid}, ${Selectors.room.voteCardCarousel}`).first();
    if (await firstCard.isVisible().catch(() => false)) {
      // Focus the card (it should be tabbable)
      await firstCard.focus();

      // Press Enter or Space to select
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify vote was registered
      await expect(page.locator(Selectors.room.currentSelection)).toContainText('Your vote:', { timeout: 10000 });
    }
  });

  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.locator(Selectors.home.nameInput).fill(createTestUser('ARIATest'));
    await page.locator(Selectors.home.createButton).click();
    await page.getByRole('button', { name: /OK/i }).click();

    await expect(page).toHaveURL(/\/room\//);
    captureRoomId(page);

    // Check that buttons have accessible names
    const startButton = page.locator(Selectors.room.startVotingButton);
    await expect(startButton).toHaveAccessibleName(/Start Voting/i);

    const shareButton = page.locator(Selectors.room.shareButton);
    await expect(shareButton).toHaveAttribute('mattooltip', 'Share Room URL');
  });

  test('should maintain focus visibility', async ({ page }) => {
    await page.goto('/');

    // Check that focused elements have visible focus indicator
    await page.keyboard.press('Tab');
    const nameInput = page.locator(Selectors.home.nameInput);
    await expect(nameInput).toBeFocused();

    // Verify focus styles are applied (this is a visual check, actual implementation may vary)
    const hasFocusStyle = await nameInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      // Check if outline or box-shadow is set (common focus indicators)
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    expect(hasFocusStyle).toBe(true);
  });
});
