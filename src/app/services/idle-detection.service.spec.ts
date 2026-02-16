import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IdleDetectionService } from './idle-detection.service';

// Mock IdleDetector API
interface MockIdleDetector {
  userState: 'active' | 'idle';
  screenState: 'unlocked' | 'locked';
  start: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
}

interface MockPermissionStatus {
  state: 'granted' | 'denied' | 'prompt';
}

describe('IdleDetectionService', () => {
  let service: IdleDetectionService;
  let mockIdleDetector: MockIdleDetector;
  let mockPermissionStatus: MockPermissionStatus;
  let changeHandler: (() => void) | undefined;
  let detectorInstance: MockIdleDetector | null;

  beforeEach(() => {
    vi.clearAllMocks();
    detectorInstance = null;

    // Mock IdleDetector
    mockIdleDetector = {
      userState: 'active',
      screenState: 'unlocked',
      start: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') changeHandler = handler;
      }),
    };

    // Mock Permission API
    mockPermissionStatus = {
      state: 'granted',
    };

    // Mock navigator.permissions
    Object.defineProperty(navigator, 'permissions', {
      value: {
        query: vi.fn().mockResolvedValue(mockPermissionStatus),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.IdleDetector as a class constructor
    Object.defineProperty(window, 'IdleDetector', {
      value: class MockIdleDetectorClass {
        userState = 'active';
        screenState = 'unlocked';
        start = mockIdleDetector.start;
        addEventListener = mockIdleDetector.addEventListener;
        constructor() {
          // Store instance so tests can modify it
          detectorInstance = this as unknown as MockIdleDetector;
        }
      },
      writable: true,
      configurable: true,
    });

    // Create service instance
    service = new IdleDetectionService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    changeHandler = undefined;
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize idleState signal to active', () => {
      expect(service.idleState()).toBe('active');
    });

    it('should detect API support', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should detect when API is not supported', () => {
      // Store original
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalIdleDetector = (window as any).IdleDetector;

      // Remove IdleDetector
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).IdleDetector;

      const newService = new IdleDetectionService();
      expect(newService.isSupported()).toBe(false);

      // Restore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).IdleDetector = originalIdleDetector;
    });
  });

  describe('Signals', () => {
    it('should expose idleState signal', () => {
      expect(service.idleState()).toBe('active');
    });

    it('should expose isSupported signal', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should allow updating idleState', () => {
      service.idleState.set('idle');
      expect(service.idleState()).toBe('idle');
    });
  });

  describe('startMonitoring()', () => {
    it('should return false when API is not supported', async () => {
      Object.defineProperty(window, 'IdleDetector', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new IdleDetectionService();
      const result = await newService.startMonitoring();

      expect(result).toBe(false);
    });

    it('should request permission', async () => {
      await service.startMonitoring(60);

      expect(navigator.permissions.query).toHaveBeenCalledWith({ name: 'idle-detection' });
    });

    it('should return false when permission is denied', async () => {
      mockPermissionStatus.state = 'denied';

      const result = await service.startMonitoring(60);

      expect(result).toBe(false);
    });

    it('should create IdleDetector instance', async () => {
      await service.startMonitoring(60);

      // Verify that the detector instance was created
      expect(detectorInstance).toBeTruthy();
    });

    it('should start monitoring with threshold in milliseconds', async () => {
      await service.startMonitoring(120);

      expect(mockIdleDetector.start).toHaveBeenCalledWith({
        threshold: 120000, // 120 seconds * 1000
        signal: expect.any(AbortSignal),
      });
    });

    it('should use default threshold of 60 seconds', async () => {
      await service.startMonitoring();

      expect(mockIdleDetector.start).toHaveBeenCalledWith({
        threshold: 60000,
        signal: expect.any(AbortSignal),
      });
    });

    it('should listen for state changes', async () => {
      await service.startMonitoring(60);

      expect(mockIdleDetector.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function),
        { signal: expect.any(AbortSignal) }
      );
    });

    it('should return true on successful start', async () => {
      const result = await service.startMonitoring(60);

      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      mockIdleDetector.start.mockRejectedValue(new Error('Failed to start'));

      const result = await service.startMonitoring(60);

      expect(result).toBe(false);
    });
  });

  describe('State Change Handling', () => {
    beforeEach(async () => {
      await service.startMonitoring(60);
    });

    it('should set idle state when user becomes idle', () => {
      if (detectorInstance) {
        detectorInstance.userState = 'idle';
        detectorInstance.screenState = 'unlocked';
      }

      changeHandler?.();

      expect(service.idleState()).toBe('idle');
    });

    it('should set idle state when screen is locked', () => {
      if (detectorInstance) {
        detectorInstance.userState = 'active';
        detectorInstance.screenState = 'locked';
      }

      changeHandler?.();

      expect(service.idleState()).toBe('idle');
    });

    it('should set idle state when both user idle and screen locked', () => {
      if (detectorInstance) {
        detectorInstance.userState = 'idle';
        detectorInstance.screenState = 'locked';
      }

      changeHandler?.();

      expect(service.idleState()).toBe('idle');
    });

    it('should set active state when user is active and screen unlocked', () => {
      // First set to idle
      service.idleState.set('idle');

      // Then become active
      if (detectorInstance) {
        detectorInstance.userState = 'active';
        detectorInstance.screenState = 'unlocked';
      }

      changeHandler?.();

      expect(service.idleState()).toBe('active');
    });

    it('should transition from idle to active correctly', () => {
      // Go idle
      if (detectorInstance) {
        detectorInstance.userState = 'idle';
      }
      changeHandler?.();
      expect(service.idleState()).toBe('idle');

      // Become active
      if (detectorInstance) {
        detectorInstance.userState = 'active';
        detectorInstance.screenState = 'unlocked';
      }
      changeHandler?.();
      expect(service.idleState()).toBe('active');
    });
  });

  describe('stopMonitoring()', () => {
    it('should abort the controller', async () => {
      await service.startMonitoring(60);

      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
      service.stopMonitoring();

      expect(abortSpy).toHaveBeenCalled();
    });

    it('should reset idleState to active', async () => {
      await service.startMonitoring(60);
      service.idleState.set('idle');

      service.stopMonitoring();

      expect(service.idleState()).toBe('active');
    });

    it('should handle being called without startMonitoring', () => {
      expect(() => service.stopMonitoring()).not.toThrow();
    });

    it('should allow restarting after stopping', async () => {
      await service.startMonitoring(60);
      service.stopMonitoring();

      const result = await service.startMonitoring(60);

      expect(result).toBe(true);
    });
  });

  describe('getStateDescription()', () => {
    it('should return "Away" when idle', () => {
      service.idleState.set('idle');
      expect(service.getStateDescription()).toBe('Away');
    });

    it('should return "Active" when not idle', () => {
      service.idleState.set('active');
      expect(service.getStateDescription()).toBe('Active');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple startMonitoring calls', async () => {
      await service.startMonitoring(60);
      await service.startMonitoring(120);

      // Should work without errors
      expect(mockIdleDetector.start).toHaveBeenCalledTimes(2);
    });

    it('should handle permission state "prompt"', async () => {
      mockPermissionStatus.state = 'prompt';

      // Should attempt to start (browser will show prompt)
      const result = await service.startMonitoring(60);

      expect(result).toBe(true);
    });

    it('should handle zero threshold gracefully', async () => {
      await service.startMonitoring(0);

      expect(mockIdleDetector.start).toHaveBeenCalledWith({
        threshold: 0,
        signal: expect.any(AbortSignal),
      });
    });

    it('should handle negative threshold gracefully', async () => {
      await service.startMonitoring(-60);

      expect(mockIdleDetector.start).toHaveBeenCalledWith({
        threshold: -60000,
        signal: expect.any(AbortSignal),
      });
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing permissions API', async () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new IdleDetectionService();

      const result = await newService.startMonitoring(60);
      expect(result).toBe(false);
    });

    it('should handle IdleDetector constructor failure', async () => {
      Object.defineProperty(window, 'IdleDetector', {
        value: vi.fn(() => {
          throw new Error('Constructor failed');
        }),
        writable: true,
        configurable: true,
      });

      const newService = new IdleDetectionService();
      const result = await newService.startMonitoring(60);

      expect(result).toBe(false);
    });
  });
});
