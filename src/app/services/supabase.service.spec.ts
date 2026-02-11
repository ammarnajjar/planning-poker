import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseService } from './supabase.service';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  removeChannel: vi.fn(),
  channel: vi.fn(),
};

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create service instance
    service = new SupabaseService();

    // Replace the supabase client with our mock
    (service as any).supabase = mockSupabase;
  });

  describe('roomExists', () => {
    it('should return true when room exists', async () => {
      // Arrange
      const mockData = { id: 'TEST123' };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockData })
          })
        })
      });

      // Act
      const result = await service.roomExists('TEST123');

      // Assert
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('rooms');
    });

    it('should return false when room does not exist', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      // Act
      const result = await service.roomExists('NONEXISTENT');

      // Assert
      expect(result).toBe(false);
      expect(mockSupabase.from).toHaveBeenCalledWith('rooms');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      // Act & Assert
      await expect(service.roomExists('ERROR123')).rejects.toThrow('Database error');
    });
  });

  describe('createRoom', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      } as Storage;
    });

    it('should throw error when room already exists', async () => {
      // Arrange
      const roomId = 'EXISTING';
      const userName = 'John Doe';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: roomId } })
          })
        })
      });

      // Act & Assert
      await expect(service.createRoom(roomId, userName)).rejects.toThrow('Room already exists');
    });
  });

  describe('joinRoom', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      } as Storage;
    });

    it('should throw error when room does not exist', async () => {
      // Arrange
      const roomId = 'NONEXISTENT';
      const userName = 'Participant';

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      // Act & Assert
      await expect(service.joinRoom(roomId, userName)).rejects.toThrow('Room does not exist');
    });

    // Note: admin PIN validation test would require more complex mocking
    // to properly simulate the full joinRoom flow including loadRoomState,
    // participant loading, and PIN verification. This is tested via integration tests.
  });

  describe('getCurrentUserId', () => {
    it('should return the current user ID', () => {
      // Arrange
      (service as any).currentUserId = 'user123';

      // Act
      const result = service.getCurrentUserId();

      // Assert
      expect(result).toBe('user123');
    });

    it('should return empty string when no user ID is set', () => {
      // Arrange
      (service as any).currentUserId = '';

      // Act
      const result = service.getCurrentUserId();

      // Assert
      expect(result).toBe('');
    });
  });

  describe('State Management', () => {
    it('should initialize with default state', () => {
      // Act
      const state = service.state();

      // Assert
      expect(state.roomId).toBe('');
      expect(state.adminUserId).toBe('');
      expect(state.revealed).toBe(false);
      expect(state.votingStarted).toBe(false);
      expect(state.adminParticipates).toBe(false);
      expect(state.participants).toEqual({});
    });
  });
});
