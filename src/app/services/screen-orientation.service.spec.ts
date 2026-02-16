import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenOrientationService } from './screen-orientation.service';

// Mock Screen Orientation API
interface MockScreenOrientation {
  type: string;
  lock: ReturnType<typeof vi.fn>;
  unlock: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

describe('ScreenOrientationService', () => {
  let service: ScreenOrientationService;
  let mockOrientation: MockScreenOrientation;
  let orientationChangeHandler: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock screen.orientation
    mockOrientation = {
      type: 'portrait-primary',
      lock: vi.fn().mockResolvedValue(undefined),
      unlock: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') orientationChangeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(screen, 'orientation', {
      value: mockOrientation,
      writable: true,
      configurable: true,
    });

    // Mock window.matchMedia for mobile detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    // Create service instance
    service = new ScreenOrientationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    orientationChangeHandler = undefined;
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize currentOrientation to portrait', () => {
      expect(service.currentOrientation()).toBe('portrait');
    });

    it('should initialize isLocked to false', () => {
      expect(service.isLocked()).toBe(false);
    });

    it('should detect API support', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should detect when API is not supported', () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();
      expect(newService.isSupported()).toBe(false);
    });

    it('should set up orientation change listener', () => {
      expect(mockOrientation.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Signals', () => {
    it('should expose currentOrientation signal', () => {
      expect(service.currentOrientation()).toBe('portrait');
    });

    it('should expose isLocked signal', () => {
      expect(service.isLocked()).toBe(false);
    });

    it('should expose isSupported signal', () => {
      expect(service.isSupported()).toBe(true);
    });
  });

  describe('Orientation Detection', () => {
    it('should detect portrait orientation', () => {
      mockOrientation.type = 'portrait-primary';
      const newService = new ScreenOrientationService();
      expect(newService.currentOrientation()).toBe('portrait');
    });

    it('should detect portrait-secondary orientation', () => {
      mockOrientation.type = 'portrait-secondary';
      const newService = new ScreenOrientationService();
      expect(newService.currentOrientation()).toBe('portrait');
    });

    it('should detect landscape orientation', () => {
      mockOrientation.type = 'landscape-primary';
      const newService = new ScreenOrientationService();
      expect(newService.currentOrientation()).toBe('landscape');
    });

    it('should detect landscape-secondary orientation', () => {
      mockOrientation.type = 'landscape-secondary';
      const newService = new ScreenOrientationService();
      expect(newService.currentOrientation()).toBe('landscape');
    });

    it('should default to unknown for unsupported orientation', () => {
      mockOrientation.type = 'unknown-type';
      const newService = new ScreenOrientationService();
      expect(newService.currentOrientation()).toBe('unknown');
    });

    it('should set unknown when orientation API not available', () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();
      expect(newService.currentOrientation()).toBe('unknown');
    });
  });

  describe('Orientation Change Events', () => {
    it('should update orientation on change event', () => {
      mockOrientation.type = 'landscape-primary';
      orientationChangeHandler?.();

      expect(service.currentOrientation()).toBe('landscape');
    });

    it('should handle multiple orientation changes', () => {
      mockOrientation.type = 'landscape-primary';
      orientationChangeHandler?.();
      expect(service.currentOrientation()).toBe('landscape');

      mockOrientation.type = 'portrait-primary';
      orientationChangeHandler?.();
      expect(service.currentOrientation()).toBe('portrait');
    });
  });

  describe('lockToLandscape()', () => {
    it('should return false when API is not supported', async () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();
      const result = await newService.lockToLandscape();

      expect(result).toBe(false);
    });

    it('should call screen.orientation.lock with landscape', async () => {
      await service.lockToLandscape();

      expect(mockOrientation.lock).toHaveBeenCalledWith('landscape');
    });

    it('should set isLocked to true on success', async () => {
      await service.lockToLandscape();

      expect(service.isLocked()).toBe(true);
    });

    it('should return true on success', async () => {
      const result = await service.lockToLandscape();

      expect(result).toBe(true);
    });

    it('should handle lock failure gracefully', async () => {
      mockOrientation.lock.mockRejectedValue(new Error('Lock failed'));

      const result = await service.lockToLandscape();

      expect(result).toBe(false);
      expect(service.isLocked()).toBe(false);
    });

    it('should not throw on lock failure', async () => {
      mockOrientation.lock.mockRejectedValue(new Error('Lock failed'));

      await expect(service.lockToLandscape()).resolves.toBe(false);
    });
  });

  describe('lockToPortrait()', () => {
    it('should return false when API is not supported', async () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();
      const result = await newService.lockToPortrait();

      expect(result).toBe(false);
    });

    it('should call screen.orientation.lock with portrait', async () => {
      await service.lockToPortrait();

      expect(mockOrientation.lock).toHaveBeenCalledWith('portrait');
    });

    it('should set isLocked to true on success', async () => {
      await service.lockToPortrait();

      expect(service.isLocked()).toBe(true);
    });

    it('should return true on success', async () => {
      const result = await service.lockToPortrait();

      expect(result).toBe(true);
    });

    it('should handle lock failure gracefully', async () => {
      mockOrientation.lock.mockRejectedValue(new Error('Lock failed'));

      const result = await service.lockToPortrait();

      expect(result).toBe(false);
      expect(service.isLocked()).toBe(false);
    });
  });

  describe('unlock()', () => {
    it('should do nothing when API is not supported', () => {
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();
      expect(() => newService.unlock()).not.toThrow();
    });

    it('should call screen.orientation.unlock', () => {
      service.unlock();

      expect(mockOrientation.unlock).toHaveBeenCalled();
    });

    it('should set isLocked to false', async () => {
      await service.lockToLandscape();
      expect(service.isLocked()).toBe(true);

      service.unlock();
      expect(service.isLocked()).toBe(false);
    });

    it('should handle unlock errors gracefully', () => {
      mockOrientation.unlock.mockImplementation(() => {
        throw new Error('Unlock failed');
      });

      expect(() => service.unlock()).not.toThrow();
    });
  });

  describe('isLandscape()', () => {
    it('should return true when orientation is landscape', () => {
      mockOrientation.type = 'landscape-primary';
      const newService = new ScreenOrientationService();

      expect(newService.isLandscape()).toBe(true);
    });

    it('should return false when orientation is portrait', () => {
      mockOrientation.type = 'portrait-primary';
      const newService = new ScreenOrientationService();

      expect(newService.isLandscape()).toBe(false);
    });

    it('should return false when orientation is unknown', () => {
      service.currentOrientation.set('unknown');

      expect(service.isLandscape()).toBe(false);
    });
  });

  describe('isPortrait()', () => {
    it('should return true when orientation is portrait', () => {
      mockOrientation.type = 'portrait-primary';
      const newService = new ScreenOrientationService();

      expect(newService.isPortrait()).toBe(true);
    });

    it('should return false when orientation is landscape', () => {
      mockOrientation.type = 'landscape-primary';
      const newService = new ScreenOrientationService();

      expect(newService.isPortrait()).toBe(false);
    });

    it('should return false when orientation is unknown', () => {
      service.currentOrientation.set('unknown');

      expect(service.isPortrait()).toBe(false);
    });
  });

  describe('isMobileDevice()', () => {
    it('should return true for screens <= 768px', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
        })),
      });

      expect(service.isMobileDevice()).toBe(true);
    });

    it('should return false for screens > 768px', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: '(max-width: 768px)',
        })),
      });

      const newService = new ScreenOrientationService();
      expect(newService.isMobileDevice()).toBe(false);
    });
  });

  describe('autoLockForPokerTable()', () => {
    it('should return false on desktop devices', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
          media: '(max-width: 768px)',
        })),
      });

      const newService = new ScreenOrientationService();
      const result = await newService.autoLockForPokerTable();

      expect(result).toBe(false);
    });

    it('should lock to landscape when on mobile in portrait', async () => {
      mockOrientation.type = 'portrait-primary';
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
        })),
      });

      const newService = new ScreenOrientationService();
      const result = await newService.autoLockForPokerTable();

      expect(result).toBe(true);
      expect(mockOrientation.lock).toHaveBeenCalledWith('landscape');
    });

    it('should return false when already in landscape on mobile', async () => {
      mockOrientation.type = 'landscape-primary';
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
        })),
      });

      const newService = new ScreenOrientationService();
      const result = await newService.autoLockForPokerTable();

      expect(result).toBe(false);
      expect(mockOrientation.lock).not.toHaveBeenCalled();
    });

    it('should handle lock failure in auto-lock', async () => {
      mockOrientation.type = 'portrait-primary';
      mockOrientation.lock.mockRejectedValue(new Error('Lock failed'));
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
        })),
      });

      const newService = new ScreenOrientationService();
      const result = await newService.autoLockForPokerTable();

      expect(result).toBe(false);
    });
  });

  describe('cleanup()', () => {
    it('should remove orientation change listener', () => {
      service.cleanup();

      expect(mockOrientation.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should unlock orientation if locked', async () => {
      await service.lockToLandscape();
      expect(service.isLocked()).toBe(true);

      service.cleanup();

      expect(mockOrientation.unlock).toHaveBeenCalled();
      expect(service.isLocked()).toBe(false);
    });

    it('should not throw when orientation API not available', () => {
      // Set isSupported to false to simulate API not available
      service.isSupported.set(false);

      expect(() => service.cleanup()).not.toThrow();
    });

    it('should handle cleanup being called multiple times', () => {
      service.cleanup();
      expect(() => service.cleanup()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle lock called twice', async () => {
      await service.lockToLandscape();
      await service.lockToLandscape();

      expect(mockOrientation.lock).toHaveBeenCalledTimes(2);
      expect(service.isLocked()).toBe(true);
    });

    it('should handle unlock called without lock', () => {
      expect(() => service.unlock()).not.toThrow();
      expect(service.isLocked()).toBe(false);
    });

    it('should transition between lock states correctly', async () => {
      await service.lockToPortrait();
      expect(service.isLocked()).toBe(true);

      await service.lockToLandscape();
      expect(service.isLocked()).toBe(true);

      service.unlock();
      expect(service.isLocked()).toBe(false);
    });

    it('should handle orientation change while locked', async () => {
      await service.lockToLandscape();

      mockOrientation.type = 'landscape-primary';
      orientationChangeHandler?.();

      expect(service.currentOrientation()).toBe('landscape');
      expect(service.isLocked()).toBe(true);
    });
  });

  describe('Browser Compatibility', () => {
    it('should handle missing screen object', () => {
      const originalScreen = global.screen;
      // @ts-expect-error - Testing runtime error
      delete global.screen;

      expect(() => new ScreenOrientationService()).not.toThrow();

      global.screen = originalScreen;
    });

    it('should handle screen without orientation property', () => {
      // Create a service where orientation API returns undefined
      const tempOrientation = screen.orientation;
      Object.defineProperty(screen, 'orientation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();

      expect(newService.isSupported()).toBe(false);
      expect(newService.currentOrientation()).toBe('unknown');

      // Restore
      Object.defineProperty(screen, 'orientation', {
        value: tempOrientation,
        writable: true,
        configurable: true,
      });
    });

    it('should handle lock method not available', async () => {
      Object.defineProperty(screen, 'orientation', {
        value: {
          type: 'portrait-primary',
          unlock: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const newService = new ScreenOrientationService();
      const result = await newService.lockToLandscape();

      expect(result).toBe(false);
    });
  });
});
