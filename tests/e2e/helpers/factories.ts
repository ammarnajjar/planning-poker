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
 * Test selectors - centralized selector strings
 */
export const Selectors = {
  home: {
    nameInput: 'input[placeholder="Enter your name"]',
    createButton: 'button:has-text("Create New Room")',
    joinButton: 'button:has-text("Join Existing Room")',
    roomIdInput: 'input[placeholder="Enter room ID"]',
    joinRoomButton: 'button:has-text("Join Room")',
    adminCheckbox: 'mat-checkbox:has-text("Join as admin")',
  },
  room: {
    roomId: '.room-id',
    participantName: '.participant-name',
    voteCard: '.vote-card-large',
    voteCardGrid: '.vote-cards-grid .vote-card-large',
    voteCardCarousel: '.card-carousel .vote-card-large',
    startVotingButton: 'button:has-text("Start Voting")',
    revealButton: 'button:has-text("Reveal")',
    hideButton: 'button:has-text("Hide")',
    resetButton: 'button:has-text("Reset")',
    shareButton: 'button[mattooltip="Share Room URL"]',
    adminControls: '.admin-controls',
    voteStatus: '.vote-status',
    voteCount: '.vote-count',
    participationCheckbox: 'mat-checkbox:has-text("I want to participate")',
    discussButton: 'button:has-text("Discuss")',
    endDiscussionButton: 'button:has-text("End Discussion")',
    removeParticipantButton: '.remove-participant-btn',
    votingSection: '.voting-section',
    currentSelection: '.current-selection',
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
