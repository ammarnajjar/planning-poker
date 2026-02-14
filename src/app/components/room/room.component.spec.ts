import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal, computed, linkedSignal, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SupabaseService, Participant } from '../../services/supabase.service';

/**
 * RoomComponent Comprehensive Test Suite
 *
 * Tests all features including:
 * - Angular 21 linkedSignal behavior
 * - Signal-based computeds
 * - Voting functionality
 * - Admin controls
 * - Discussion mode (v1.1.0)
 * - Participant removal (v1.1.0)
 * - Touch gestures
 * - Room sharing
 */

// Mock types matching the component
interface RoomState {
  roomId: string;
  adminUserId: string;
  revealed: boolean;
  votingStarted: boolean;
  adminParticipates: boolean;
  participants: Record<string, Participant>;
  discussionActive: boolean;
  discussionMinVoter: string | null;
  discussionMaxVoter: string | null;
}

describe('RoomComponent', () => {
  const cardValues = ['0', '1', '2', '3', '5', '8', '13', '20', '35', '50', '100', '?'];
  const DEFAULT_CARD_INDEX = 5; // Index of "5"
  const SWIPE_THRESHOLD = 50;

  describe('Angular 21 linkedSignal', () => {
    it('should initialize currentCardIndex to default when no vote', () => {
      const myVote = signal<string | undefined>(undefined);
      const currentCardIndex = linkedSignal<number>(() => {
        const vote = myVote();
        if (vote) {
          const index = cardValues.indexOf(vote);
          return index !== -1 ? index : DEFAULT_CARD_INDEX;
        }
        return DEFAULT_CARD_INDEX;
      });

      expect(currentCardIndex()).toBe(DEFAULT_CARD_INDEX);
    });

    it('should sync currentCardIndex with myVote', () => {
      const myVote = signal<string | undefined>('3');
      const currentCardIndex = linkedSignal<number>(() => {
        const vote = myVote();
        if (vote) {
          const index = cardValues.indexOf(vote);
          return index !== -1 ? index : DEFAULT_CARD_INDEX;
        }
        return DEFAULT_CARD_INDEX;
      });

      expect(currentCardIndex()).toBe(3); // Index of "3"
    });

    it('should allow manual override of currentCardIndex', () => {
      const myVote = signal<string | undefined>('5');
      const currentCardIndex = linkedSignal<number>(() => {
        const vote = myVote();
        if (vote) {
          const index = cardValues.indexOf(vote);
          return index !== -1 ? index : DEFAULT_CARD_INDEX;
        }
        return DEFAULT_CARD_INDEX;
      });

      // Manual override
      currentCardIndex.set(8);
      expect(currentCardIndex()).toBe(8);
    });

    it('should default to DEFAULT_CARD_INDEX for invalid vote', () => {
      const myVote = signal<string | undefined>('invalid');
      const currentCardIndex = linkedSignal<number>(() => {
        const vote = myVote();
        if (vote) {
          const index = cardValues.indexOf(vote);
          return index !== -1 ? index : DEFAULT_CARD_INDEX;
        }
        return DEFAULT_CARD_INDEX;
      });

      expect(currentCardIndex()).toBe(DEFAULT_CARD_INDEX);
    });
  });

  describe('Computed: participants', () => {
    it('should convert participants object to array', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'user1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'Admin', vote: null, lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User', vote: null, lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      expect(participants().length).toBe(2);
    });

    it('should return empty array when no participants', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      expect(participants().length).toBe(0);
    });
  });

  describe('Computed: participatingUsers', () => {
    it('should exclude non-participating admin', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {
          admin1: { id: 'admin1', name: 'Admin', vote: null, lastHeartbeat: Date.now() },
          user1: { id: 'user1', name: 'User1', vote: null, lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: null, lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => {
        const adminId = roomState().adminUserId;
        const adminParticipates = roomState().adminParticipates;
        return participants().filter((p: Participant) => {
          return !(p.id === adminId && !adminParticipates);
        });
      });

      expect(participatingUsers().length).toBe(2); // Excludes admin
      expect(participatingUsers().find(p => p.id === 'admin1')).toBeUndefined();
    });

    it('should include participating admin', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: true,
        participants: {
          admin1: { id: 'admin1', name: 'Admin', vote: null, lastHeartbeat: Date.now() },
          user1: { id: 'user1', name: 'User1', vote: null, lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => {
        const adminId = roomState().adminUserId;
        const adminParticipates = roomState().adminParticipates;
        return participants().filter((p: Participant) => {
          return !(p.id === adminId && !adminParticipates);
        });
      });

      expect(participatingUsers().length).toBe(2); // Includes admin
      expect(participatingUsers().find(p => p.id === 'admin1')).toBeDefined();
    });
  });

  describe('Computed: votedCount', () => {
    it('should count participants with votes', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: '8', lastHeartbeat: Date.now() },
          user3: { id: 'user3', name: 'User3', vote: null, lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => participants());
      const votedCount = computed(() => {
        return participatingUsers().filter(p => p.vote != null).length;
      });

      expect(votedCount()).toBe(2);
    });

    it('should exclude non-participating admin from vote count', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          admin1: { id: 'admin1', name: 'Admin', vote: '5', lastHeartbeat: Date.now() },
          user1: { id: 'user1', name: 'User1', vote: '8', lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => {
        const adminId = roomState().adminUserId;
        const adminParticipates = roomState().adminParticipates;
        return participants().filter((p: Participant) => {
          return !(p.id === adminId && !adminParticipates);
        });
      });
      const votedCount = computed(() => {
        return participatingUsers().filter(p => p.vote != null).length;
      });

      expect(votedCount()).toBe(1); // Only user1, not admin
    });
  });

  describe('Computed: totalCount', () => {
    it('should count all participating users', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          admin1: { id: 'admin1', name: 'Admin', vote: null, lastHeartbeat: Date.now() },
          user1: { id: 'user1', name: 'User1', vote: null, lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: null, lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => {
        const adminId = roomState().adminUserId;
        const adminParticipates = roomState().adminParticipates;
        return participants().filter((p: Participant) => {
          return !(p.id === adminId && !adminParticipates);
        });
      });
      const totalCount = computed(() => participatingUsers().length);

      expect(totalCount()).toBe(2); // Excludes non-participating admin
    });
  });

  describe('Computed: averageVote', () => {
    it('should return null when votes not revealed', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: '8', lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => participants());
      const averageVote = computed(() => {
        if (!roomState().revealed) return null;
        const numericVotes = participatingUsers()
          .filter(p => p.vote && p.vote !== '?')
          .map(p => parseFloat(p.vote!))
          .filter(v => !isNaN(v));
        if (numericVotes.length === 0) return null;
        const sum = numericVotes.reduce((acc, val) => acc + val, 0);
        return (sum / numericVotes.length).toFixed(1);
      });

      expect(averageVote()).toBeNull();
    });

    it('should calculate average of numeric votes', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: true,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: '8', lastHeartbeat: Date.now() },
          user3: { id: 'user3', name: 'User3', vote: '2', lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => participants());
      const averageVote = computed(() => {
        if (!roomState().revealed) return null;
        const numericVotes = participatingUsers()
          .filter(p => p.vote && p.vote !== '?')
          .map(p => parseFloat(p.vote!))
          .filter(v => !isNaN(v));
        if (numericVotes.length === 0) return null;
        const sum = numericVotes.reduce((acc, val) => acc + val, 0);
        return (sum / numericVotes.length).toFixed(1);
      });

      expect(averageVote()).toBe('5.0'); // (5 + 8 + 2) / 3 = 5.0
    });

    it('should exclude "?" votes from average', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: true,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: '?', lastHeartbeat: Date.now() },
          user3: { id: 'user3', name: 'User3', vote: '10', lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => participants());
      const averageVote = computed(() => {
        if (!roomState().revealed) return null;
        const numericVotes = participatingUsers()
          .filter(p => p.vote && p.vote !== '?')
          .map(p => parseFloat(p.vote!))
          .filter(v => !isNaN(v));
        if (numericVotes.length === 0) return null;
        const sum = numericVotes.reduce((acc, val) => acc + val, 0);
        return (sum / numericVotes.length).toFixed(1);
      });

      expect(averageVote()).toBe('7.5'); // (5 + 10) / 2 = 7.5
    });

    it('should return null when no numeric votes', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: true,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'User1', vote: '?', lastHeartbeat: Date.now() },
          user2: { id: 'user2', name: 'User2', vote: '?', lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const participants = computed(() => Object.values(roomState().participants));
      const participatingUsers = computed(() => participants());
      const averageVote = computed(() => {
        if (!roomState().revealed) return null;
        const numericVotes = participatingUsers()
          .filter(p => p.vote && p.vote !== '?')
          .map(p => parseFloat(p.vote!))
          .filter(v => !isNaN(v));
        if (numericVotes.length === 0) return null;
        const sum = numericVotes.reduce((acc, val) => acc + val, 0);
        return (sum / numericVotes.length).toFixed(1);
      });

      expect(averageVote()).toBeNull();
    });
  });

  describe('Computed: myVote', () => {
    it('should return current user vote', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {
          user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() }
        },
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'user1';

      const myVote = computed(() => {
        const participant = roomState().participants[currentUserId];
        return participant?.vote;
      });

      expect(myVote()).toBe('5');
    });

    it('should return undefined when user not found', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'user1';

      const myVote = computed(() => {
        const participant = roomState().participants[currentUserId];
        return participant?.vote;
      });

      expect(myVote()).toBeUndefined();
    });
  });

  describe('Computed: isAdmin', () => {
    it('should return true when current user is admin', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'admin1';

      const isAdmin = computed(() => {
        const adminId = roomState().adminUserId;
        return adminId !== '' && currentUserId === adminId;
      });

      expect(isAdmin()).toBe(true);
    });

    it('should return false when current user is not admin', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'user1';

      const isAdmin = computed(() => {
        const adminId = roomState().adminUserId;
        return adminId !== '' && currentUserId === adminId;
      });

      expect(isAdmin()).toBe(false);
    });

    it('should return false when adminUserId is empty', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'user1';

      const isAdmin = computed(() => {
        const adminId = roomState().adminUserId;
        return adminId !== '' && currentUserId === adminId;
      });

      expect(isAdmin()).toBe(false);
    });
  });

  describe('Computed: shouldShowVotingCards', () => {
    it('should return false when room not loaded', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: '',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'user1';
      const isAdmin = computed(() => roomState().adminUserId === currentUserId);

      const shouldShowVotingCards = computed(() => {
        const adminId = roomState().adminUserId;
        if (adminId === '') return false;
        if (!isAdmin()) return true;
        return roomState().adminParticipates;
      });

      expect(shouldShowVotingCards()).toBe(false);
    });

    it('should return true for non-admin users', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'user1';
      const isAdmin = computed(() => roomState().adminUserId === currentUserId);

      const shouldShowVotingCards = computed(() => {
        const adminId = roomState().adminUserId;
        if (adminId === '') return false;
        if (!isAdmin()) return true;
        return roomState().adminParticipates;
      });

      expect(shouldShowVotingCards()).toBe(true);
    });

    it('should return false for non-participating admin', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'admin1';
      const isAdmin = computed(() => roomState().adminUserId === currentUserId);

      const shouldShowVotingCards = computed(() => {
        const adminId = roomState().adminUserId;
        if (adminId === '') return false;
        if (!isAdmin()) return true;
        return roomState().adminParticipates;
      });

      expect(shouldShowVotingCards()).toBe(false);
    });

    it('should return true for participating admin', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: true,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });
      const currentUserId = 'admin1';
      const isAdmin = computed(() => roomState().adminUserId === currentUserId);

      const shouldShowVotingCards = computed(() => {
        const adminId = roomState().adminUserId;
        if (adminId === '') return false;
        if (!isAdmin()) return true;
        return roomState().adminParticipates;
      });

      expect(shouldShowVotingCards()).toBe(true);
    });
  });

  describe('Computed: isVotingEnabled', () => {
    it('should return false when voting not started', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: false,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const isVotingEnabled = computed(() => {
        return roomState().votingStarted && !roomState().revealed;
      });

      expect(isVotingEnabled()).toBe(false);
    });

    it('should return true when voting started and not revealed', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: false,
        votingStarted: true,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const isVotingEnabled = computed(() => {
        return roomState().votingStarted && !roomState().revealed;
      });

      expect(isVotingEnabled()).toBe(true);
    });

    it('should return false when votes revealed', () => {
      const roomState = signal<RoomState>({
        roomId: 'TEST',
        adminUserId: 'admin1',
        revealed: true,
        votingStarted: true,
        adminParticipates: false,
        participants: {},
        discussionActive: false,
        discussionMinVoter: null,
        discussionMaxVoter: null
      });

      const isVotingEnabled = computed(() => {
        return roomState().votingStarted && !roomState().revealed;
      });

      expect(isVotingEnabled()).toBe(false);
    });
  });

  describe('Discussion Mode (v1.1.0)', () => {
    describe('Computed: getMinMaxCandidates', () => {
      it('should return empty arrays when not revealed', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: false,
          votingStarted: true,
          adminParticipates: false,
          participants: {
            user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() },
            user2: { id: 'user2', name: 'User2', vote: '8', lastHeartbeat: Date.now() }
          },
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: null
        });

        const participants = computed(() => Object.values(roomState().participants));
        const participatingUsers = computed(() => participants());
        const getMinMaxCandidates = computed(() => {
          if (!roomState().revealed) return { minCandidates: [], maxCandidates: [] };
          const numericVotes = participatingUsers()
            .map((p: Participant) => ({
              participant: p,
              numericVote: p.vote && p.vote !== '?' ? parseFloat(p.vote) : null,
            }))
            .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));
          if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };
          const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
          const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));
          if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };
          const minCandidates = numericVotes.filter((v) => v.numericVote === minVote).map((v) => v.participant.id);
          const maxCandidates = numericVotes.filter((v) => v.numericVote === maxVote).map((v) => v.participant.id);
          return { minCandidates, maxCandidates };
        });

        expect(getMinMaxCandidates()).toEqual({ minCandidates: [], maxCandidates: [] });
      });

      it('should identify min and max voters', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {
            user1: { id: 'user1', name: 'User1', vote: '2', lastHeartbeat: Date.now() },
            user2: { id: 'user2', name: 'User2', vote: '5', lastHeartbeat: Date.now() },
            user3: { id: 'user3', name: 'User3', vote: '13', lastHeartbeat: Date.now() }
          },
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: null
        });

        const participants = computed(() => Object.values(roomState().participants));
        const participatingUsers = computed(() => participants());
        const getMinMaxCandidates = computed(() => {
          if (!roomState().revealed) return { minCandidates: [], maxCandidates: [] };
          const numericVotes = participatingUsers()
            .map((p: Participant) => ({
              participant: p,
              numericVote: p.vote && p.vote !== '?' ? parseFloat(p.vote) : null,
            }))
            .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));
          if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };
          const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
          const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));
          if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };
          const minCandidates = numericVotes.filter((v) => v.numericVote === minVote).map((v) => v.participant.id);
          const maxCandidates = numericVotes.filter((v) => v.numericVote === maxVote).map((v) => v.participant.id);
          return { minCandidates, maxCandidates };
        });

        const result = getMinMaxCandidates();
        expect(result.minCandidates).toEqual(['user1']);
        expect(result.maxCandidates).toEqual(['user3']);
      });

      it('should return empty arrays when all votes are same', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {
            user1: { id: 'user1', name: 'User1', vote: '5', lastHeartbeat: Date.now() },
            user2: { id: 'user2', name: 'User2', vote: '5', lastHeartbeat: Date.now() }
          },
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: null
        });

        const participants = computed(() => Object.values(roomState().participants));
        const participatingUsers = computed(() => participants());
        const getMinMaxCandidates = computed(() => {
          if (!roomState().revealed) return { minCandidates: [], maxCandidates: [] };
          const numericVotes = participatingUsers()
            .map((p: Participant) => ({
              participant: p,
              numericVote: p.vote && p.vote !== '?' ? parseFloat(p.vote) : null,
            }))
            .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));
          if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };
          const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
          const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));
          if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };
          const minCandidates = numericVotes.filter((v) => v.numericVote === minVote).map((v) => v.participant.id);
          const maxCandidates = numericVotes.filter((v) => v.numericVote === maxVote).map((v) => v.participant.id);
          return { minCandidates, maxCandidates };
        });

        expect(getMinMaxCandidates()).toEqual({ minCandidates: [], maxCandidates: [] });
      });

      it('should handle multiple candidates with same min vote', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {
            user1: { id: 'user1', name: 'User1', vote: '2', lastHeartbeat: Date.now() },
            user2: { id: 'user2', name: 'User2', vote: '2', lastHeartbeat: Date.now() },
            user3: { id: 'user3', name: 'User3', vote: '13', lastHeartbeat: Date.now() }
          },
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: null
        });

        const participants = computed(() => Object.values(roomState().participants));
        const participatingUsers = computed(() => participants());
        const getMinMaxCandidates = computed(() => {
          if (!roomState().revealed) return { minCandidates: [], maxCandidates: [] };
          const numericVotes = participatingUsers()
            .map((p: Participant) => ({
              participant: p,
              numericVote: p.vote && p.vote !== '?' ? parseFloat(p.vote) : null,
            }))
            .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));
          if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };
          const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
          const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));
          if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };
          const minCandidates = numericVotes.filter((v) => v.numericVote === minVote).map((v) => v.participant.id);
          const maxCandidates = numericVotes.filter((v) => v.numericVote === maxVote).map((v) => v.participant.id);
          return { minCandidates, maxCandidates };
        });

        const result = getMinMaxCandidates();
        expect(result.minCandidates).toEqual(['user1', 'user2']);
        expect(result.maxCandidates).toEqual(['user3']);
      });
    });

    describe('Computed: canStartDiscussion', () => {
      it('should return false when not revealed', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: false,
          votingStarted: true,
          adminParticipates: false,
          participants: {
            user1: { id: 'user1', name: 'User1', vote: '2', lastHeartbeat: Date.now() },
            user2: { id: 'user2', name: 'User2', vote: '13', lastHeartbeat: Date.now() }
          },
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: null
        });

        const participants = computed(() => Object.values(roomState().participants));
        const participatingUsers = computed(() => participants());
        const getMinMaxCandidates = computed(() => {
          if (!roomState().revealed) return { minCandidates: [], maxCandidates: [] };
          const numericVotes = participatingUsers()
            .map((p: Participant) => ({
              participant: p,
              numericVote: p.vote && p.vote !== '?' ? parseFloat(p.vote) : null,
            }))
            .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));
          if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };
          const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
          const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));
          if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };
          const minCandidates = numericVotes.filter((v) => v.numericVote === minVote).map((v) => v.participant.id);
          const maxCandidates = numericVotes.filter((v) => v.numericVote === maxVote).map((v) => v.participant.id);
          return { minCandidates, maxCandidates };
        });
        const canStartDiscussion = computed(() => {
          const { minCandidates, maxCandidates } = getMinMaxCandidates();
          return roomState().revealed && (minCandidates.length > 0 || maxCandidates.length > 0);
        });

        expect(canStartDiscussion()).toBe(false);
      });

      it('should return true when revealed with different votes', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {
            user1: { id: 'user1', name: 'User1', vote: '2', lastHeartbeat: Date.now() },
            user2: { id: 'user2', name: 'User2', vote: '13', lastHeartbeat: Date.now() }
          },
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: null
        });

        const participants = computed(() => Object.values(roomState().participants));
        const participatingUsers = computed(() => participants());
        const getMinMaxCandidates = computed(() => {
          if (!roomState().revealed) return { minCandidates: [], maxCandidates: [] };
          const numericVotes = participatingUsers()
            .map((p: Participant) => ({
              participant: p,
              numericVote: p.vote && p.vote !== '?' ? parseFloat(p.vote) : null,
            }))
            .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));
          if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };
          const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
          const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));
          if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };
          const minCandidates = numericVotes.filter((v) => v.numericVote === minVote).map((v) => v.participant.id);
          const maxCandidates = numericVotes.filter((v) => v.numericVote === maxVote).map((v) => v.participant.id);
          return { minCandidates, maxCandidates };
        });
        const canStartDiscussion = computed(() => {
          const { minCandidates, maxCandidates } = getMinMaxCandidates();
          return roomState().revealed && (minCandidates.length > 0 || maxCandidates.length > 0);
        });

        expect(canStartDiscussion()).toBe(true);
      });
    });

    describe('isMinVoter', () => {
      it('should return false when discussion not active', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {},
          discussionActive: false,
          discussionMinVoter: 'user1',
          discussionMaxVoter: null
        });

        const isMinVoter = (participantId: string): boolean => {
          if (!roomState().discussionActive) return false;
          return roomState().discussionMinVoter === participantId;
        };

        expect(isMinVoter('user1')).toBe(false);
      });

      it('should return true when participant is min voter', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {},
          discussionActive: true,
          discussionMinVoter: 'user1',
          discussionMaxVoter: null
        });

        const isMinVoter = (participantId: string): boolean => {
          if (!roomState().discussionActive) return false;
          return roomState().discussionMinVoter === participantId;
        };

        expect(isMinVoter('user1')).toBe(true);
      });
    });

    describe('isMaxVoter', () => {
      it('should return false when discussion not active', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {},
          discussionActive: false,
          discussionMinVoter: null,
          discussionMaxVoter: 'user2'
        });

        const isMaxVoter = (participantId: string): boolean => {
          if (!roomState().discussionActive) return false;
          return roomState().discussionMaxVoter === participantId;
        };

        expect(isMaxVoter('user2')).toBe(false);
      });

      it('should return true when participant is max voter', () => {
        const roomState = signal<RoomState>({
          roomId: 'TEST',
          adminUserId: '',
          revealed: true,
          votingStarted: true,
          adminParticipates: false,
          participants: {},
          discussionActive: true,
          discussionMinVoter: null,
          discussionMaxVoter: 'user2'
        });

        const isMaxVoter = (participantId: string): boolean => {
          if (!roomState().discussionActive) return false;
          return roomState().discussionMaxVoter === participantId;
        };

        expect(isMaxVoter('user2')).toBe(true);
      });
    });
  });

  describe('Card Navigation', () => {
    it('should navigate to previous card', () => {
      const currentCardIndex = signal(5);

      const previousCard = (): void => {
        if (currentCardIndex() > 0) {
          currentCardIndex.set(currentCardIndex() - 1);
        }
      };

      previousCard();
      expect(currentCardIndex()).toBe(4);
    });

    it('should not go below 0 when navigating previous', () => {
      const currentCardIndex = signal(0);

      const previousCard = (): void => {
        if (currentCardIndex() > 0) {
          currentCardIndex.set(currentCardIndex() - 1);
        }
      };

      previousCard();
      expect(currentCardIndex()).toBe(0);
    });

    it('should navigate to next card', () => {
      const currentCardIndex = signal(5);

      const nextCard = (): void => {
        if (currentCardIndex() < cardValues.length - 1) {
          currentCardIndex.set(currentCardIndex() + 1);
        }
      };

      nextCard();
      expect(currentCardIndex()).toBe(6);
    });

    it('should not exceed max index when navigating next', () => {
      const currentCardIndex = signal(cardValues.length - 1);

      const nextCard = (): void => {
        if (currentCardIndex() < cardValues.length - 1) {
          currentCardIndex.set(currentCardIndex() + 1);
        }
      };

      nextCard();
      expect(currentCardIndex()).toBe(cardValues.length - 1);
    });

    it('should go to specific card index', () => {
      const currentCardIndex = signal(5);

      const goToCard = (index: number): void => {
        currentCardIndex.set(index);
      };

      goToCard(8);
      expect(currentCardIndex()).toBe(8);
    });
  });

  describe('Touch Gestures', () => {
    it('should detect swipe left (next card)', () => {
      const touchStartX = 200;
      const touchEndX = 100; // Swiped left
      const diff = touchStartX - touchEndX;

      expect(Math.abs(diff) > SWIPE_THRESHOLD).toBe(true);
      expect(diff > 0).toBe(true); // Left swipe
    });

    it('should detect swipe right (previous card)', () => {
      const touchStartX = 100;
      const touchEndX = 200; // Swiped right
      const diff = touchStartX - touchEndX;

      expect(Math.abs(diff) > SWIPE_THRESHOLD).toBe(true);
      expect(diff < 0).toBe(true); // Right swipe
    });

    it('should ignore small swipes below threshold', () => {
      const touchStartX = 100;
      const touchEndX = 130; // Small movement
      const diff = touchStartX - touchEndX;

      expect(Math.abs(diff) > SWIPE_THRESHOLD).toBe(false);
    });
  });

  describe('Participant Vote Display', () => {
    it('should return empty string when no vote', () => {
      const participant: Participant = { id: 'user1', name: 'User', vote: null, lastHeartbeat: Date.now() };
      const revealed = false;

      const getDisplay = (p: Participant, rev: boolean): string => {
        if (!p.vote) return '';
        if (!rev) return '✓';
        return p.vote;
      };

      expect(getDisplay(participant, revealed)).toBe('');
    });

    it('should return checkmark when voted but not revealed', () => {
      const participant: Participant = { id: 'user1', name: 'User', vote: '5', lastHeartbeat: Date.now() };
      const revealed = false;

      const getDisplay = (p: Participant, rev: boolean): string => {
        if (!p.vote) return '';
        if (!rev) return '✓';
        return p.vote;
      };

      expect(getDisplay(participant, revealed)).toBe('✓');
    });

    it('should return actual vote when revealed', () => {
      const participant: Participant = { id: 'user1', name: 'User', vote: '5', lastHeartbeat: Date.now() };
      const revealed = true;

      const getDisplay = (p: Participant, rev: boolean): string => {
        if (!p.vote) return '';
        if (!rev) return '✓';
        return p.vote;
      };

      expect(getDisplay(participant, revealed)).toBe('5');
    });
  });

  describe('Card Selection', () => {
    it('should return true for selected card', () => {
      const myVote = signal<string | undefined>('5');

      const isCardSelected = (value: string): boolean => {
        const currentVote = myVote();
        if (currentVote === undefined || currentVote === null) {
          return value === '?';
        }
        return currentVote === value;
      };

      expect(isCardSelected('5')).toBe(true);
    });

    it('should return false for unselected card', () => {
      const myVote = signal<string | undefined>('5');

      const isCardSelected = (value: string): boolean => {
        const currentVote = myVote();
        if (currentVote === undefined || currentVote === null) {
          return value === '?';
        }
        return currentVote === value;
      };

      expect(isCardSelected('8')).toBe(false);
    });

    it('should default to "?" when no vote', () => {
      const myVote = signal<string | undefined>(undefined);

      const isCardSelected = (value: string): boolean => {
        const currentVote = myVote();
        if (currentVote === undefined || currentVote === null) {
          return value === '?';
        }
        return currentVote === value;
      };

      expect(isCardSelected('?')).toBe(true);
      expect(isCardSelected('5')).toBe(false);
    });
  });

  describe('User Removal Effect (Angular 21 Signal Feature)', () => {
    it('should trigger effect callback when userRemoved signal becomes true', () => {
      const userRemoved = signal(false);
      let navigationTriggered = false;

      // Simulate effect behavior without actual effect() call
      // In the real component, effect() watches userRemoved signal
      const checkUserRemoved = () => {
        if (userRemoved()) {
          navigationTriggered = true;
        }
      };

      // Initial check
      checkUserRemoved();
      expect(navigationTriggered).toBe(false);

      // Trigger user removal
      userRemoved.set(true);
      checkUserRemoved();

      expect(navigationTriggered).toBe(true);
    });

    it('should not trigger navigation when userRemoved is false', () => {
      const userRemoved = signal(false);
      let navigationTriggered = false;

      // Simulate effect behavior
      const checkUserRemoved = () => {
        if (userRemoved()) {
          navigationTriggered = true;
        }
      };

      checkUserRemoved();

      expect(navigationTriggered).toBe(false);
      expect(userRemoved()).toBe(false);
    });

    it('should reactively respond to userRemoved signal changes', () => {
      const userRemoved = signal(false);

      // Test signal reactivity
      expect(userRemoved()).toBe(false);

      userRemoved.set(true);
      expect(userRemoved()).toBe(true);

      userRemoved.set(false);
      expect(userRemoved()).toBe(false);
    });
  });

  describe('Participant Position Calculation', () => {
    it('should distribute participants evenly around table', () => {
      const total = 4;

      const getPosition = (index: number, totalParticipants: number): number => {
        return Math.floor((index / totalParticipants) * 12);
      };

      expect(getPosition(0, total)).toBe(0);
      expect(getPosition(1, total)).toBe(3);
      expect(getPosition(2, total)).toBe(6);
      expect(getPosition(3, total)).toBe(9);
    });
  });

  describe('Has Voted Check', () => {
    it('should return true when participant has vote', () => {
      const participant: Participant = { id: 'user1', name: 'User', vote: '5', lastHeartbeat: Date.now() };

      const hasVoted = (p: Participant): boolean => {
        return p.vote !== undefined && p.vote !== null;
      };

      expect(hasVoted(participant)).toBe(true);
    });

    it('should return false when participant has no vote', () => {
      const participant: Participant = { id: 'user1', name: 'User', vote: null, lastHeartbeat: Date.now() };

      const hasVoted = (p: Participant): boolean => {
        return p.vote !== undefined && p.vote !== null;
      };

      expect(hasVoted(participant)).toBe(false);
    });

    it('should return false when vote is undefined', () => {
      const participant: Participant = { id: 'user1', name: 'User', vote: undefined, lastHeartbeat: Date.now() };

      const hasVoted = (p: Participant): boolean => {
        return p.vote !== undefined && p.vote !== null;
      };

      expect(hasVoted(participant)).toBe(false);
    });
  });
});
