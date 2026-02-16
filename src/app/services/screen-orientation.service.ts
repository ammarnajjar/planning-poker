import { Injectable, signal } from '@angular/core';

export type OrientationType = 'portrait' | 'landscape' | 'unknown';

/**
 * Service to manage screen orientation using Screen Orientation API
 * Useful for poker table view on mobile devices
 */
@Injectable({
  providedIn: 'root'
})
export class ScreenOrientationService {
  // Signals for reactive state
  currentOrientation = signal<OrientationType>('unknown');
  isLocked = signal<boolean>(false);
  isSupported = signal<boolean>(false);

  private orientationChangeHandler?: () => void;

  constructor() {
    this.checkSupport();
    this.updateCurrentOrientation();
    this.setupOrientationMonitoring();
  }

  /**
   * Check if Screen Orientation API is supported
   */
  private checkSupport(): void {
    this.isSupported.set(
      'screen' in window &&
      'orientation' in screen &&
      screen.orientation !== null &&
      screen.orientation !== undefined &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'lock' in (screen.orientation as any)
    );
  }

  /**
   * Update current orientation from screen
   */
  private updateCurrentOrientation(): void {
    if (!('screen' in window && 'orientation' in screen) ||
        !screen.orientation ||
        !screen.orientation.type) {
      this.currentOrientation.set('unknown');
      return;
    }

    const type = screen.orientation.type;

    if (type.includes('portrait')) {
      this.currentOrientation.set('portrait');
    } else if (type.includes('landscape')) {
      this.currentOrientation.set('landscape');
    } else {
      this.currentOrientation.set('unknown');
    }
  }

  /**
   * Setup monitoring for orientation changes
   */
  private setupOrientationMonitoring(): void {
    if (!('screen' in window && 'orientation' in screen) || !screen.orientation) return;

    this.orientationChangeHandler = () => {
      this.updateCurrentOrientation();
      console.log(`[ScreenOrientation] Orientation changed to ${this.currentOrientation()}`);
    };

    screen.orientation.addEventListener('change', this.orientationChangeHandler);
  }

  /**
   * Lock screen to landscape orientation
   * Useful for poker table view on mobile
   */
  async lockToLandscape(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('[ScreenOrientation] Screen Orientation API not supported');
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (screen.orientation as any).lock('landscape');
      this.isLocked.set(true);
      console.log('[ScreenOrientation] Locked to landscape');
      return true;
    } catch (err) {
      console.error('[ScreenOrientation] Failed to lock orientation:', err);
      return false;
    }
  }

  /**
   * Lock screen to portrait orientation
   */
  async lockToPortrait(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('[ScreenOrientation] Screen Orientation API not supported');
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (screen.orientation as any).lock('portrait');
      this.isLocked.set(true);
      console.log('[ScreenOrientation] Locked to portrait');
      return true;
    } catch (err) {
      console.error('[ScreenOrientation] Failed to lock orientation:', err);
      return false;
    }
  }

  /**
   * Unlock screen orientation (allow auto-rotation)
   */
  unlock(): void {
    if (!this.isSupported()) {
      return;
    }

    try {
      screen.orientation.unlock();
      this.isLocked.set(false);
      console.log('[ScreenOrientation] Orientation unlocked');
    } catch (err) {
      console.error('[ScreenOrientation] Failed to unlock orientation:', err);
    }
  }

  /**
   * Check if device is in landscape mode
   */
  isLandscape(): boolean {
    return this.currentOrientation() === 'landscape';
  }

  /**
   * Check if device is in portrait mode
   */
  isPortrait(): boolean {
    return this.currentOrientation() === 'portrait';
  }

  /**
   * Check if device is mobile (small screen)
   */
  isMobileDevice(): boolean {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Automatically lock to landscape on mobile devices
   * Call this when showing poker table view
   */
  async autoLockForPokerTable(): Promise<boolean> {
    // Only lock on mobile devices
    if (!this.isMobileDevice()) {
      return false;
    }

    // Only lock if currently in portrait
    if (this.isPortrait()) {
      return await this.lockToLandscape();
    }

    return false;
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    if (this.orientationChangeHandler && 'screen' in window && 'orientation' in screen) {
      screen.orientation.removeEventListener('change', this.orientationChangeHandler);
    }

    // Unlock on cleanup
    if (this.isLocked()) {
      this.unlock();
    }
  }
}
