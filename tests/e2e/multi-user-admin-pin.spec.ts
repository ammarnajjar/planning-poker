import { test, expect, getRoomId } from './helpers/fixtures';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Admin PIN Tests', () => {
  test('should allow user to join as admin with correct PIN and control same admin user', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const admin1Page = await context1.newPage();
    const admin2Page = await context2.newPage();

    try {
      await admin1Page.goto('/');
      await admin1Page.locator('[data-testid="name-input"]').fill('Admin');
      await admin1Page.getByRole('button', { name: /Create New Room/i }).click();

      await expect(admin1Page.locator('h2')).toContainText('Set Admin PIN');
      await admin1Page.locator('input[type="password"]').fill('1234');
      await admin1Page.getByRole('button', { name: /OK/i }).click();

      await expect(admin1Page).toHaveURL(/\/room\//);
      const roomId = getRoomId(admin1Page);

      await admin2Page.goto('/');
      await admin2Page.locator('[data-testid="name-input"]').fill('AdminFromAnotherDevice');
      await admin2Page.getByRole('button', { name: /Join Existing Room/i }).click();
      await admin2Page.locator('[data-testid="room-id-input"]').fill(roomId);
      await admin2Page.locator('[data-testid="join-as-admin-checkbox"]').locator('label').click();
      await admin2Page.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(admin2Page.locator('h2')).toContainText('Enter Admin PIN');
      await admin2Page.locator('input[type="password"]').fill('1234');
      await admin2Page.getByRole('button', { name: /OK/i }).click();

      await expect(admin2Page).toHaveURL(/\/room\//);

      await expect(admin2Page.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });
      await expect(admin2Page.locator('[data-testid="participant-name"]').first()).toContainText('AdminFromAnotherDevice', { timeout: 10000 });

      await expect(admin1Page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
      await expect(admin2Page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

      await admin2Page.getByRole('button', { name: /Start Voting/i }).click();

      await expect(admin1Page.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });
      await expect(admin2Page.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should reject user with incorrect PIN and redirect to home', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await adminPage.goto('/');
      await adminPage.locator('[data-testid="name-input"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();

      await expect(adminPage.locator('h2')).toContainText('Set Admin PIN');
      await adminPage.locator('input[type="password"]').fill('1234');
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = getRoomId(adminPage);

      await userPage.goto('/');
      await userPage.locator('[data-testid="name-input"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('[data-testid="room-id-input"]').fill(roomId);
      await userPage.locator('[data-testid="join-as-admin-checkbox"]').locator('label').click();
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage.locator('h2')).toContainText('Enter Admin PIN');
      await userPage.locator('input[type="password"]').fill('wrong-pin');
      await userPage.getByRole('button', { name: /OK/i }).click();

      await expect(userPage).toHaveURL('/', { timeout: 5000 });
      await expect(userPage.getByRole('button', { name: /Create New Room/i })).toBeVisible();

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should allow user to join as participant without PIN', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await adminPage.goto('/');
      await adminPage.locator('[data-testid="name-input"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();

      await expect(adminPage.locator('h2')).toContainText('Set Admin PIN');
      await adminPage.locator('input[type="password"]').fill('1234');
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = getRoomId(adminPage);

      await userPage.goto('/');
      await userPage.locator('[data-testid="name-input"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('[data-testid="room-id-input"]').fill(roomId);
      // Do NOT check "Join as admin"
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage).toHaveURL(/\/room\//);

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(userPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();
      await expect(userPage.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should not join when user cancels PIN dialog', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const adminPage = await context1.newPage();
    const userPage = await context2.newPage();

    try {
      await adminPage.goto('/');
      await adminPage.locator('[data-testid="name-input"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();

      await expect(adminPage.locator('h2')).toContainText('Set Admin PIN');
      await adminPage.locator('input[type="password"]').fill('1234');
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = getRoomId(adminPage);

      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      await userPage.goto('/');
      await userPage.locator('[data-testid="name-input"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('[data-testid="room-id-input"]').fill(roomId);
      await userPage.locator('[data-testid="join-as-admin-checkbox"]').locator('label').click();
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      await expect(userPage.locator('h2')).toContainText('Enter Admin PIN', { timeout: 10000 });
      await userPage.getByRole('button', { name: /Cancel/i }).click();

      await expect(userPage).toHaveURL('/');
      await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (1)', { timeout: 10000 });

      await cleanupTestRoom(roomId);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
