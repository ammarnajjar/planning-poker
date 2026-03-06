import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createRoom, getRoomId, startVoting } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';
import { createTestUser, Selectors } from './helpers/factories';

test.describe('Accessibility @a11y', () => {
  test('should not have accessibility violations on home page', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('should not have accessibility violations on room page', async ({ page }) => {
    await createRoom(page, createTestUser('A11yTest'));
    const roomId = getRoomId(page);

    await expect(page.locator(Selectors.room.adminControls)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();

    expect(results.violations).toEqual([]);

    await cleanupTestRoom(roomId);
  });

  test('should not have accessibility violations during voting', async ({ page }) => {
    await createRoom(page, createTestUser('A11yTest'));
    const roomId = getRoomId(page);

    await startVoting(page);

    const results = await new AxeBuilder({ page })
      .disableRules(['landmark-one-main', 'page-has-heading-one', 'region'])
      .analyze();

    expect(results.violations).toEqual([]);

    await cleanupTestRoom(roomId);
  });

  test('should support keyboard navigation on home page', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    await expect(page.locator(Selectors.home.nameInput)).toBeFocused();

    await page.keyboard.type(createTestUser('KeyboardTest'));

    await page.keyboard.press('Tab');
    await expect(page.locator(Selectors.home.createButton)).toBeFocused();
  });

  test('should support keyboard navigation for voting cards', async ({ page }) => {
    await createRoom(page, createTestUser('KeyboardTest'));
    const roomId = getRoomId(page);

    await startVoting(page);

    const firstCard = page.locator(`${Selectors.room.voteCardGrid}, ${Selectors.room.voteCardCarousel}`).first();
    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(Selectors.room.currentSelection)).toContainText('Your vote:', { timeout: 10000 });
    }

    await cleanupTestRoom(roomId);
  });

  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    await createRoom(page, createTestUser('ARIATest'));
    const roomId = getRoomId(page);

    await expect(page.locator(Selectors.room.startVotingButton)).toHaveAccessibleName(/Start Voting/i);
    await expect(page.locator(Selectors.room.shareButton)).toHaveAttribute('mattooltip', 'Share Room URL');

    await cleanupTestRoom(roomId);
  });

  test('should maintain focus visibility', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const nameInput = page.locator(Selectors.home.nameInput);
    await expect(nameInput).toBeFocused();

    const hasFocusStyle = await nameInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    expect(hasFocusStyle).toBe(true);
  });
});
