import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { cleanupTestRoom } from './cleanup';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomFixture {
  page: Page;
  roomId: string;
}

export interface TwoUserRoomFixture {
  adminPage: Page;
  userPage: Page;
  roomId: string;
  adminContext: BrowserContext;
  userContext: BrowserContext;
}

export interface ThreeUserRoomFixture {
  adminPage: Page;
  user1Page: Page;
  user2Page: Page;
  roomId: string;
  adminContext: BrowserContext;
  user1Context: BrowserContext;
  user2Context: BrowserContext;
}

// ---------------------------------------------------------------------------
// Fixture extensions
// ---------------------------------------------------------------------------

type Fixtures = {
  /** Pre-created room as admin (no participation enabled). Cleaned up after each test. */
  adminRoom: RoomFixture;
  /** Pre-created room with two participants (admin + one user). Cleaned up after each test. */
  twoUserRoom: TwoUserRoomFixture;
  /** Pre-created room with three participants (admin + two users). Cleaned up after each test. */
  threeUserRoom: ThreeUserRoomFixture;
};

export const test = base.extend<Fixtures>({
  adminRoom: async ({ page }, use) => {
    await createRoom(page, 'Admin');
    const roomId = getRoomId(page);
    await use({ page, roomId });
    await cleanupTestRoom(roomId);
  },

  twoUserRoom: async ({ browser }, use) => {
    const adminContext = await browser.newContext();
    const userContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const userPage = await userContext.newPage();

    await createRoom(adminPage, 'Admin');
    const roomId = getRoomId(adminPage);

    await joinRoom(userPage, roomId, 'User');
    await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (2)', { timeout: 10000 });

    await use({ adminPage, userPage, roomId, adminContext, userContext });

    await adminContext.close();
    await userContext.close();
    await cleanupTestRoom(roomId);
  },

  threeUserRoom: async ({ browser }, use) => {
    const adminContext = await browser.newContext();
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    const adminPage = await adminContext.newPage();
    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    await createRoom(adminPage, 'Admin');
    const roomId = getRoomId(adminPage);

    await joinRoom(user1Page, roomId, 'User1');
    await joinRoom(user2Page, roomId, 'User2');
    await expect(adminPage.locator('[data-testid="participants-title"]')).toContainText('Participants (3)', { timeout: 10000 });

    await use({ adminPage, user1Page, user2Page, roomId, adminContext, user1Context, user2Context });

    await adminContext.close();
    await user1Context.close();
    await user2Context.close();
    await cleanupTestRoom(roomId);
  },
});

export { expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared action helpers (used by fixtures and directly in tests)
// ---------------------------------------------------------------------------

/** Navigate to home and create a new room. Page will be on /room/:id after. */
export async function createRoom(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await page.locator('[data-testid="name-input"]').fill(name);
  await page.getByRole('button', { name: /Create New Room/i }).click();
  await page.getByRole('button', { name: /OK/i }).click();
  await expect(page).toHaveURL(/\/room\//);
}

/** Navigate to home and join an existing room by ID. */
export async function joinRoom(page: Page, roomId: string, name: string): Promise<void> {
  await page.goto('/');
  await page.locator('[data-testid="name-input"]').fill(name);
  await page.getByRole('button', { name: /Join Existing Room/i }).click();
  await page.locator('[data-testid="room-id-input"]').fill(roomId);
  await page.getByRole('button', { name: /^Join Room$/i }).click();
  await expect(page).toHaveURL(/\/room\//);
}

/** Extract room ID from current page URL. */
export function getRoomId(page: Page): string {
  return page.url().split('/room/')[1];
}

/** Enable admin participation and start a voting round. Waits for the voting section to appear. */
export async function startVoting(page: Page): Promise<void> {
  await page.locator('[data-testid="admin-participate-checkbox"]').locator('label').click();
  await page.getByRole('button', { name: /Start Voting/i }).click();
  await expect(page.locator('[data-testid="voting-section"]')).toBeVisible({ timeout: 10000 });
}

/** Start a voting round without enabling admin participation. */
export async function startVotingNoParticipation(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Start Voting/i }).click();
  await expect(page.locator('[data-testid="vote-status"]')).toBeVisible({ timeout: 10000 });
}

/**
 * Cast a vote. Clicks the grid card for `value` if visible, otherwise clicks the
 * carousel card. Waits for the current-selection indicator to update.
 */
export async function castVote(page: Page, value?: string): Promise<void> {
  if (value) {
    const gridCard = page.locator(`[data-testid="vote-card-${value}"]`);
    if (await gridCard.isVisible().catch(() => false)) {
      await gridCard.click();
      await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });
      return;
    }
  }
  // Fallback: first visible grid card or carousel card
  const firstGrid = page.locator('[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]').first();
  if (await firstGrid.isVisible().catch(() => false)) {
    await firstGrid.click();
  } else {
    await page.locator('[data-testid="carousel-vote-card"]').click();
  }
  await expect(page.locator('[data-testid="current-selection"]')).toContainText('Your vote:', { timeout: 10000 });
}

/**
 * Reveal votes. Retries clicking the Reveal button until the status confirms
 * "Votes revealed" (works around the 5-second initializationComplete guard).
 */
export async function revealVotes(page: Page): Promise<void> {
  await expect(async () => {
    await page.getByRole('button', { name: /Reveal/i }).click();
    await expect(page.locator('[data-testid="vote-status"]')).toContainText('Votes revealed', { timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

/**
 * Wait for Service Worker to be registered and active.
 * Replaces waitForTimeout(2000) in PWA tests.
 */
export async function waitForServiceWorker(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return true; // skip if not supported
    const reg = await navigator.serviceWorker.getRegistration();
    return reg?.active?.state === 'activated';
  }, { timeout: 10000 });
}

/**
 * Wait for at least one planning-poker cache to exist.
 * Replaces waitForTimeout(2000) after page load in PWA caching tests.
 */
export async function waitForCache(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    const keys = await caches.keys();
    return keys.some(k => k.startsWith('planning-poker-'));
  }, { timeout: 10000 });
}
