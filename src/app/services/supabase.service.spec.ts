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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).currentUserId = 'user123';

      // Act
      const result = service.getCurrentUserId();

      // Assert
      expect(result).toBe('user123');
    });

    it('should return empty string when no user ID is set', () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    it('should provide readonly state signal', () => {
      // Act
      const state = service.state();

      // Assert - state() should return RoomState object
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('should have correct state structure', () => {
      // Act
      const state = service.state();

      // Assert - verify all required properties exist
      expect(state).toHaveProperty('roomId');
      expect(state).toHaveProperty('adminUserId');
      expect(state).toHaveProperty('revealed');
      expect(state).toHaveProperty('votingStarted');
      expect(state).toHaveProperty('adminParticipates');
      expect(state).toHaveProperty('participants');
    });
  });

  describe('Room ID Validation', () => {
    it('should query database with correct room ID', async () => {
      // Arrange
      const roomId = 'ABC12345';
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: roomId } })
        })
      });
      mockSupabase.from.mockReturnValue({
        select: selectMock
      });

      // Act
      await service.roomExists(roomId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('rooms');
      expect(selectMock).toHaveBeenCalledWith('id');
    });

    it('should handle special characters in room ID', async () => {
      // Arrange
      const roomId = 'TEST-123';
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      // Act
      const result = await service.roomExists(roomId);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle empty room ID', async () => {
      // Arrange
      const roomId = '';
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      // Act
      const result = await service.roomExists(roomId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors in roomExists', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      });

      // Act & Assert
      await expect(service.roomExists('TEST123')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors in roomExists', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Request timeout'))
          })
        })
      });

      // Act & Assert
      await expect(service.roomExists('TEST123')).rejects.toThrow('Request timeout');
    });

    it('should handle database connection errors in createRoom', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Connection failed'))
          })
        })
      });

      // Act & Assert
      await expect(service.createRoom('TEST123', 'User')).rejects.toThrow('Connection failed');
    });

    it('should handle database connection errors in joinRoom', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Connection failed'))
          })
        })
      });

      // Act & Assert
      // joinRoom calls loadRoomState which will fail with Connection failed
      await expect(service.joinRoom('TEST123', 'User')).rejects.toThrow();
    });
  });

  describe('Boolean Conversion', () => {
    it('should convert truthy database response to true', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'TEST' } })
          })
        })
      });

      // Act
      const result = await service.roomExists('TEST');

      // Assert
      expect(result).toBe(true);
      expect(typeof result).toBe('boolean');
    });

    it('should convert null database response to false', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      // Act
      const result = await service.roomExists('TEST');

      // Assert
      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    });

    it('should convert undefined database response to false', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: undefined })
          })
        })
      });

      // Act
      const result = await service.roomExists('TEST');

      // Assert
      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    });
  });
});
