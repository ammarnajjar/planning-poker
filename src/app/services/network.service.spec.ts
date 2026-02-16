import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkService, EffectiveConnectionType } from './network.service';

// Type for Network Information API
interface MockNetworkInformation {
  effectiveType?: EffectiveConnectionType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

describe('NetworkService', () => {
  let service: NetworkService;
  let mockConnection: MockNetworkInformation;
  let onlineHandler: (() => void) | undefined;
  let offlineHandler: (() => void) | undefined;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Mock Network Information API
    mockConnection = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true,
    });

    // Mock online/offline state
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Mock window event listeners
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = vi.fn((event, handler) => {
      if (event === 'online') onlineHandler = handler as () => void;
      if (event === 'offline') offlineHandler = handler as () => void;
      return originalAddEventListener.call(window, event, handler);
    });

    // Create service instance
    service = new NetworkService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with online state', () => {
      expect(service.isOnline()).toBe(true);
    });

    it('should initialize connection quality based on network info', () => {
      expect(service.connectionQuality()).toBeDefined();
    });

    it('should set up connection change listener', () => {
      expect(mockConnection.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should set up online/offline listeners', () => {
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('Signals', () => {
    it('should expose connectionQuality signal', () => {
      expect(service.connectionQuality()).toBeDefined();
    });

    it('should expose effectiveType signal', () => {
      expect(service.effectiveType()).toBe('4g');
    });

    it('should expose isOnline signal', () => {
      expect(service.isOnline()).toBe(true);
    });

    it('should expose saveData signal', () => {
      expect(service.saveData()).toBe(false);
    });

    it('should expose downlink signal', () => {
      expect(service.downlink()).toBe(10);
    });

    it('should expose rtt signal', () => {
      expect(service.rtt()).toBe(50);
    });
  });

  describe('Connection Quality Detection', () => {
    it('should detect excellent connection (4G, high downlink)', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('excellent');
    });

    it('should detect good connection (4G, lower downlink)', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 3;
      mockConnection.rtt = 50;

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('good');
    });

    it('should detect good connection (3G, low RTT)', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.rtt = 200;

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('good');
    });

    it('should detect poor connection (3G, high RTT)', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.rtt = 350;

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('poor');
    });

    it('should detect poor connection (2G)', () => {
      mockConnection.effectiveType = '2g';

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('poor');
    });

    it('should detect poor connection (slow-2g)', () => {
      mockConnection.effectiveType = 'slow-2g';

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('poor');
    });

    it('should default to good connection when Network API not available', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('good');
    });
  });

  describe('getRecommendedPollingInterval()', () => {
    it('should return 1000ms for excellent connection', () => {
      service.connectionQuality.set('excellent');
      expect(service.getRecommendedPollingInterval()).toBe(1000);
    });

    it('should return 2000ms for good connection', () => {
      service.connectionQuality.set('good');
      expect(service.getRecommendedPollingInterval()).toBe(2000);
    });

    it('should return 5000ms for poor connection', () => {
      service.connectionQuality.set('poor');
      expect(service.getRecommendedPollingInterval()).toBe(5000);
    });

    it('should return 10000ms for offline connection', () => {
      service.connectionQuality.set('offline');
      expect(service.getRecommendedPollingInterval()).toBe(10000);
    });

    it('should return 5000ms when save data is enabled', () => {
      service.saveData.set(true);
      service.connectionQuality.set('excellent');
      expect(service.getRecommendedPollingInterval()).toBe(5000);
    });

    it('should prioritize save data over connection quality', () => {
      service.saveData.set(true);
      service.connectionQuality.set('excellent');
      expect(service.getRecommendedPollingInterval()).toBe(5000);
    });
  });

  describe('getConnectionDescription()', () => {
    it('should return "No connection" when offline', () => {
      service.connectionQuality.set('offline');
      expect(service.getConnectionDescription()).toBe('No connection');
    });

    it('should return "Data saver mode" when save data is enabled', () => {
      service.saveData.set(true);
      expect(service.getConnectionDescription()).toBe('Data saver mode');
    });

    it('should return effective type description when available', () => {
      service.effectiveType.set('4g');
      expect(service.getConnectionDescription()).toBe('4G connection');
    });

    it('should return quality description when effective type not available', () => {
      service.effectiveType.set(undefined);
      service.connectionQuality.set('excellent');
      expect(service.getConnectionDescription()).toBe('Excellent connection');
    });

    it('should capitalize connection quality properly', () => {
      service.effectiveType.set(undefined);
      service.connectionQuality.set('good');
      expect(service.getConnectionDescription()).toBe('Good connection');
    });
  });

  describe('shouldShowWarning()', () => {
    it('should return true for poor connection', () => {
      service.connectionQuality.set('poor');
      expect(service.shouldShowWarning()).toBe(true);
    });

    it('should return true for offline connection', () => {
      service.connectionQuality.set('offline');
      expect(service.shouldShowWarning()).toBe(true);
    });

    it('should return false for excellent connection', () => {
      service.connectionQuality.set('excellent');
      expect(service.shouldShowWarning()).toBe(false);
    });

    it('should return false for good connection', () => {
      service.connectionQuality.set('good');
      expect(service.shouldShowWarning()).toBe(false);
    });
  });

  describe('Online/Offline Events', () => {
    it('should update state when going offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });

      offlineHandler?.();

      expect(service.isOnline()).toBe(false);
      expect(service.connectionQuality()).toBe('offline');
    });

    it('should update state when coming back online', () => {
      // First go offline
      service.isOnline.set(false);
      service.connectionQuality.set('offline');

      // Then come back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });

      onlineHandler?.();

      expect(service.isOnline()).toBe(true);
      // Quality should be updated based on connection info
      expect(service.connectionQuality()).not.toBe('offline');
    });
  });

  describe('cleanup()', () => {
    it('should remove connection change listener', () => {
      service.cleanup();

      expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should not throw when connection is not available', () => {
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new NetworkService();
      expect(() => newService.cleanup()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing downlink metric', () => {
      mockConnection.downlink = undefined;
      mockConnection.effectiveType = '4g';

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('good');
    });

    it('should handle missing rtt metric', () => {
      mockConnection.rtt = undefined;
      mockConnection.effectiveType = '3g';

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('good');
    });

    it('should handle undefined effectiveType', () => {
      mockConnection.effectiveType = undefined;

      const newService = new NetworkService();
      expect(newService.connectionQuality()).toBe('good');
    });

    it('should handle save data being undefined', () => {
      mockConnection.saveData = undefined;

      const newService = new NetworkService();
      expect(newService.saveData()).toBe(false);
    });
  });
});
