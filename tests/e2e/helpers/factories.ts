/**
 * Test Data Factories
 *
 * Helper functions to generate test data consistently across tests.
 * This improves test maintainability and reduces duplication.
 */

/**
 * Generate a unique test username
 * @param prefix - Optional prefix for the username
 * @returns A unique username with timestamp
 */
export function createTestUser(prefix = 'TestUser'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate multiple unique test usernames
 * @param count - Number of usernames to generate
 * @param prefix - Optional prefix for the usernames
 * @returns Array of unique usernames
 */
export function createTestUsers(count: number, prefix = 'User'): string[] {
  return Array.from({ length: count }, (_, i) =>
    createTestUser(`${prefix}${i + 1}`)
  );
}

/**
 * Generate a test room configuration
 * @returns Test room configuration object
 */
export function createTestRoom() {
  return {
    adminName: createTestUser('Admin'),
    pin: generateTestPIN(),
  };
}

/**
 * Generate a test admin PIN
 * @returns 4-digit PIN string
 */
export function generateTestPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Standard wait times for common operations
 */
export const WaitTimes = {
  SHORT: 500,
  MEDIUM: 1000,
  LONG: 2000,
  REALTIME_SYNC: 1500, // Time for Supabase real-time to propagate
  ROOM_LOAD: 3000,
  ANIMATION: 600,
} as const;

/**
 * Common Fibonacci voting values
 */
export const VotingCards = {
  VALUES: ['0', '1', '2', '3', '5', '8', '13', '20', '35', '50', '100', '?'],
  UNKNOWN: '?',
  MIN: '0',
  MAX: '100',
  TYPICAL: ['2', '3', '5', '8'],
} as const;

/**
 * Test data validation helpers
 */
export const Validators = {
  isValidRoomId: (roomId: string): boolean => {
    return /^[A-Z0-9]{6,10}$/.test(roomId);
  },

  isValidVote: (vote: string): boolean => {
    return VotingCards.VALUES.includes(vote);
  },

  isValidPIN: (pin: string): boolean => {
    return /^\d{4}$/.test(pin);
  },
} as const;

/**
 * Test selectors - centralized selector strings using data-testid attributes
 */
export const Selectors = {
  home: {
    nameInput: '[data-testid="name-input"]',
    createButton: '[data-testid="create-room-button"]',
    joinButton: '[data-testid="show-join-form-button"]',
    roomIdInput: '[data-testid="room-id-input"]',
    joinRoomButton: '[data-testid="join-room-button"]',
    adminCheckbox: '[data-testid="join-as-admin-checkbox"]',
  },
  room: {
    roomId: '[data-testid="room-id"]',
    participantName: '[data-testid="participant-name"]',
    voteCard: '[data-testid^="vote-card-"], [data-testid="carousel-vote-card"]',
    voteCardGrid: '[data-testid="vote-cards-grid"] [data-testid^="vote-card-"]',
    voteCardCarousel: '[data-testid="carousel-vote-card"]',
    startVotingButton: '[data-testid="start-voting-button"]',
    revealButton: '[data-testid="reveal-button"]',
    hideButton: '[data-testid="reveal-button"]',
    resetButton: '[data-testid="reset-button"]',
    shareButton: '[data-testid="share-room-button"]',
    adminControls: '[data-testid="admin-controls"]',
    voteStatus: '[data-testid="vote-status"]',
    voteCount: '.vote-count',
    participationCheckbox: '[data-testid="admin-participate-checkbox"]',
    discussButton: '[data-testid="discuss-button"]',
    endDiscussionButton: '[data-testid="discuss-button"]',
    removeParticipantButton: '[data-testid="remove-participant-button"]',
    votingSection: '[data-testid="voting-section"]',
    currentSelection: '[data-testid="current-selection"]',
  },
  dialog: {
    pinInput: 'input[type="password"]',
    okButton: 'button:has-text("OK")',
    cancelButton: 'button:has-text("Cancel")',
  },
} as const;

/**
 * Performance budget constants (in milliseconds)
 */
export const PerformanceBudgets = {
  PAGE_LOAD: 3000,
  NAVIGATION: 1000,
  INTERACTION: 500,
  ANIMATION: 600,
  API_CALL: 2000,
} as const;
