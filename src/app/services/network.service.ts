import { Injectable, signal } from '@angular/core';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';
export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | undefined;

interface NetworkInformation extends EventTarget {
  effectiveType?: EffectiveConnectionType;
  downlink?: number; // Mbps
  rtt?: number; // ms
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Service to monitor network connection quality using Network Information API
 * Provides connection status and recommended polling intervals
 */
@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  // Signals for reactive state
  connectionQuality = signal<ConnectionQuality>('good');
  effectiveType = signal<EffectiveConnectionType>(undefined);
  isOnline = signal<boolean>(true);
  saveData = signal<boolean>(false);
  downlink = signal<number | undefined>(undefined); // Mbps
  rtt = signal<number | undefined>(undefined); // Round-trip time in ms

  private connection?: NetworkInformation;
  private handleConnectionChange?: () => void;
  private handleOnline?: () => void;
  private handleOffline?: () => void;

  constructor() {
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize Network Information API monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Check for Network Information API support
    const nav = navigator as NavigatorWithConnection;
    this.connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (this.connection) {
      // Initial state
      this.updateConnectionInfo();

      // Listen for connection changes
      this.handleConnectionChange = () => this.updateConnectionInfo();
      this.connection.addEventListener('change', this.handleConnectionChange);
    }

    // Always listen to online/offline events (widely supported)
    this.isOnline.set(navigator.onLine);

    this.handleOnline = () => {
      this.isOnline.set(true);
      this.updateConnectionQuality();
      console.log('[Network] Connection restored');
    };

    this.handleOffline = () => {
      this.isOnline.set(false);
      this.connectionQuality.set('offline');
      console.log('[Network] Connection lost');
    };

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Update connection information from Network Information API
   */
  private updateConnectionInfo(): void {
    if (!this.connection) return;

    this.effectiveType.set(this.connection.effectiveType);
    this.downlink.set(this.connection.downlink);
    this.rtt.set(this.connection.rtt);
    this.saveData.set(this.connection.saveData || false);

    this.updateConnectionQuality();

    console.log('[Network] Connection updated:', {
      effectiveType: this.effectiveType(),
      downlink: this.downlink(),
      rtt: this.rtt(),
      saveData: this.saveData(),
      quality: this.connectionQuality()
    });
  }

  /**
   * Determine connection quality based on available metrics
   */
  private updateConnectionQuality(): void {
    if (!this.isOnline()) {
      this.connectionQuality.set('offline');
      return;
    }

    const effectiveType = this.effectiveType();
    const rtt = this.rtt();
    const downlink = this.downlink();

    // Determine quality based on effective connection type
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.connectionQuality.set('poor');
    } else if (effectiveType === '3g') {
      // Check RTT for more accurate 3g classification
      if (rtt !== undefined && rtt > 300) {
        this.connectionQuality.set('poor');
      } else {
        this.connectionQuality.set('good');
      }
    } else if (effectiveType === '4g') {
      // 4g with good metrics
      if (downlink !== undefined && downlink > 5) {
        this.connectionQuality.set('excellent');
      } else {
        this.connectionQuality.set('good');
      }
    } else {
      // No Network Information API, assume good connection if online
      this.connectionQuality.set('good');
    }
  }

  /**
   * Get recommended polling interval in milliseconds based on connection quality
   */
  getRecommendedPollingInterval(): number {
    const quality = this.connectionQuality();
    const saveData = this.saveData();

    // If user has data saver enabled, use longer intervals
    if (saveData) {
      return 5000; // 5 seconds
    }

    switch (quality) {
      case 'excellent':
        return 1000; // 1 second - fast updates
      case 'good':
        return 2000; // 2 seconds - normal updates
      case 'poor':
        return 5000; // 5 seconds - reduced polling to save bandwidth
      case 'offline':
        return 10000; // 10 seconds - minimal polling for reconnection attempts
      default:
        return 2000; // Default to 2 seconds
    }
  }

  /**
   * Get a user-friendly description of the connection
   */
  getConnectionDescription(): string {
    const quality = this.connectionQuality();
    const effectiveType = this.effectiveType();

    if (quality === 'offline') {
      return 'No connection';
    }

    if (this.saveData()) {
      return 'Data saver mode';
    }

    if (effectiveType) {
      return `${effectiveType.toUpperCase()} connection`;
    }

    return quality.charAt(0).toUpperCase() + quality.slice(1) + ' connection';
  }

  /**
   * Check if we should show a connection warning
   */
  shouldShowWarning(): boolean {
    return this.connectionQuality() === 'poor' || this.connectionQuality() === 'offline';
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    if (this.connection && this.handleConnectionChange) {
      this.connection.removeEventListener('change', this.handleConnectionChange);
    }
    if (this.handleOnline) {
      window.removeEventListener('online', this.handleOnline);
    }
    if (this.handleOffline) {
      window.removeEventListener('offline', this.handleOffline);
    }
  }
}
