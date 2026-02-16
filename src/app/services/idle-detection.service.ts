import { Injectable, signal } from '@angular/core';

export type IdleState = 'active' | 'idle';

/**
 * Service to detect user idle state using Idle Detection API
 * Shows when user is away from keyboard/screen
 */
@Injectable({
  providedIn: 'root'
})
export class IdleDetectionService {
  // Signals for reactive state
  idleState = signal<IdleState>('active');
  isSupported = signal<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private idleDetector?: any; // IdleDetector type not yet in TypeScript lib
  private abortController?: AbortController;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if Idle Detection API is supported
   */
  private checkSupport(): void {
    this.isSupported.set('IdleDetector' in window);
  }

  /**
   * Start monitoring idle state
   * @param threshold Idle threshold in seconds (default: 60 seconds)
   */
  async startMonitoring(threshold = 60): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('[IdleDetection] Idle Detection API not supported');
      return false;
    }

    try {
      // Request permission (required in Chrome)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permission = await (navigator.permissions as any).query({ name: 'idle-detection' });

      if (permission.state === 'denied') {
        console.log('[IdleDetection] Permission denied');
        return false;
      }

      // Create idle detector
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IdleDetectorClass = (window as any).IdleDetector;
      this.idleDetector = new IdleDetectorClass();
      this.abortController = new AbortController();

      // Listen for state changes
      this.idleDetector.addEventListener('change', () => {
        const userState = this.idleDetector.userState;
        const screenState = this.idleDetector.screenState;

        console.log(`[IdleDetection] State changed - User: ${userState}, Screen: ${screenState}`);

        // User is idle if either they're inactive or screen is locked
        if (userState === 'idle' || screenState === 'locked') {
          this.idleState.set('idle');
        } else {
          this.idleState.set('active');
        }
      }, { signal: this.abortController.signal });

      // Start monitoring with threshold
      await this.idleDetector.start({
        threshold: threshold * 1000, // Convert to milliseconds
        signal: this.abortController.signal
      });

      console.log(`[IdleDetection] Started monitoring with ${threshold}s threshold`);
      return true;
    } catch (err) {
      console.error('[IdleDetection] Failed to start monitoring:', err);
      return false;
    }
  }

  /**
   * Stop monitoring idle state
   */
  stopMonitoring(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    this.idleDetector = undefined;
    this.idleState.set('active');
    console.log('[IdleDetection] Stopped monitoring');
  }

  /**
   * Get user-friendly description of idle state
   */
  getStateDescription(): string {
    return this.idleState() === 'idle' ? 'Away' : 'Active';
  }
}
