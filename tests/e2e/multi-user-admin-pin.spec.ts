import { test, expect } from '@playwright/test';
import { cleanupTestRoom } from './helpers/cleanup';

test.describe('Multi-User Admin PIN Tests', () => {
  test.describe.configure({ mode: 'serial' });

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

  test('should allow user to join as admin with correct PIN and control same admin user', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const admin1Page = await context1.newPage();
    const admin2Page = await context2.newPage();

    try {
      // Admin creates room with PIN
      await admin1Page.goto('/');
      await admin1Page.locator('input[placeholder="Enter your name"]').fill('Admin');
      await admin1Page.getByRole('button', { name: /Create New Room/i }).click();

      // Set admin PIN in dialog
      await expect(admin1Page.locator('h2')).toContainText('Set Admin PIN');
      await admin1Page.locator('input[type="password"]').fill('1234');
      await admin1Page.getByRole('button', { name: /OK/i }).click();

      await expect(admin1Page).toHaveURL(/\/room\//);
      const roomId = captureRoomId(admin1Page);

      // Another user joins with correct PIN (becomes same admin user)
      await admin2Page.goto('/');
      await admin2Page.locator('input[placeholder="Enter your name"]').fill('AdminFromAnotherDevice');
      await admin2Page.getByRole('button', { name: /Join Existing Room/i }).click();
      await admin2Page.locator('input[placeholder="Enter room ID"]').fill(roomId);

      // Check "Join as admin" checkbox
      const joinAsAdminCheckbox = admin2Page.locator('mat-checkbox').filter({ hasText: 'Join as admin' });
      await joinAsAdminCheckbox.click();

      await admin2Page.getByRole('button', { name: /^Join Room$/i }).click();

      // Enter correct PIN in dialog
      await expect(admin2Page.locator('h2')).toContainText('Enter Admin PIN');
      await admin2Page.locator('input[type="password"]').fill('1234');
      await admin2Page.getByRole('button', { name: /OK/i }).click();

      // User should successfully join as admin
      await expect(admin2Page).toHaveURL(/\/room\//);

      // Both pages control the same admin user, so participant count stays (1)
      // The name should be updated to the new name
      await expect(admin2Page.locator('.section-title')).toContainText('Participants (1)', { timeout: 10000 });
      await expect(admin2Page.locator('.participant-name').first()).toContainText('AdminFromAnotherDevice', { timeout: 10000 });

      // Both browser contexts should have admin controls (Start Voting button)
      await expect(admin1Page.getByRole('button', { name: /Start Voting/i })).toBeVisible();
      await expect(admin2Page.getByRole('button', { name: /Start Voting/i })).toBeVisible();

      // Verify they control the same admin by starting voting from admin2
      await admin2Page.getByRole('button', { name: /Start Voting/i }).click();

      // Both pages should see voting has started (Reveal button appears)
      await expect(admin1Page.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });
      await expect(admin2Page.getByRole('button', { name: /Reveal/i })).toBeVisible({ timeout: 10000 });
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
      // Admin creates room with PIN
      await adminPage.goto('/');
      await adminPage.locator('input[placeholder="Enter your name"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();

      // Set admin PIN in dialog
      await expect(adminPage.locator('h2')).toContainText('Set Admin PIN');
      await adminPage.locator('input[type="password"]').fill('1234');
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = captureRoomId(adminPage);

      // User tries to join with incorrect PIN
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);

      // Check "Join as admin" checkbox
      const joinAsAdminCheckbox = userPage.locator('mat-checkbox').filter({ hasText: 'Join as admin' });
      await joinAsAdminCheckbox.click();

      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      // Enter incorrect PIN in dialog
      await expect(userPage.locator('h2')).toContainText('Enter Admin PIN');
      await userPage.locator('input[type="password"]').fill('wrong-pin');
      await userPage.getByRole('button', { name: /OK/i }).click();

      // User should be redirected back to home page (error causes redirect in room component)
      await expect(userPage).toHaveURL('/', { timeout: 5000 });

      // User should be back on home page (can see "Create New Room" button)
      await expect(userPage.getByRole('button', { name: /Create New Room/i })).toBeVisible();

      // Admin should be alone in the room
      await expect(adminPage.locator('.section-title')).toContainText('Participants (1)', { timeout: 10000 });
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
      // Admin creates room with PIN
      await adminPage.goto('/');
      await adminPage.locator('input[placeholder="Enter your name"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();

      // Set admin PIN in dialog
      await expect(adminPage.locator('h2')).toContainText('Set Admin PIN');
      await adminPage.locator('input[type="password"]').fill('1234');
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = captureRoomId(adminPage);

      // User joins WITHOUT checking "Join as admin" checkbox
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);

      // Do NOT check "Join as admin" checkbox
      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      // User should join successfully
      await expect(userPage).toHaveURL(/\/room\//);

      // Both should see each other
      await expect(adminPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });
      await expect(userPage.locator('.section-title')).toContainText('Participants (2)', { timeout: 10000 });

      // Only admin should have admin controls (Start Voting button)
      await expect(adminPage.getByRole('button', { name: /Start Voting/i })).toBeVisible();
      await expect(userPage.getByRole('button', { name: /Start Voting/i })).not.toBeVisible();
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
      // Admin creates room with PIN
      await adminPage.goto('/');
      await adminPage.locator('input[placeholder="Enter your name"]').fill('Admin');
      await adminPage.getByRole('button', { name: /Create New Room/i }).click();

      // Set admin PIN in dialog
      await expect(adminPage.locator('h2')).toContainText('Set Admin PIN');
      await adminPage.locator('input[type="password"]').fill('1234');
      await adminPage.getByRole('button', { name: /OK/i }).click();

      await expect(adminPage).toHaveURL(/\/room\//);
      const roomId = captureRoomId(adminPage);

      // Wait for room to be fully initialized
      await expect(adminPage.locator('.section-title')).toContainText('Participants (1)', { timeout: 10000 });

      // User tries to join as admin but cancels
      await userPage.goto('/');
      await userPage.locator('input[placeholder="Enter your name"]').fill('User');
      await userPage.getByRole('button', { name: /Join Existing Room/i }).click();
      await userPage.locator('input[placeholder="Enter room ID"]').fill(roomId);

      // Check "Join as admin" checkbox
      const joinAsAdminCheckbox = userPage.locator('mat-checkbox').filter({ hasText: 'Join as admin' });
      await joinAsAdminCheckbox.click();

      await userPage.getByRole('button', { name: /^Join Room$/i }).click();

      // PIN dialog should appear
      await expect(userPage.locator('h2')).toContainText('Enter Admin PIN', { timeout: 10000 });

      // Click Cancel button
      await userPage.getByRole('button', { name: /Cancel/i }).click();

      // Wait a moment
      await userPage.waitForTimeout(500);

      // User should still be on home page
      await expect(userPage).toHaveURL('/');

      // Admin should be alone in the room
      await expect(adminPage.locator('.section-title')).toContainText('Participants (1)', { timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
