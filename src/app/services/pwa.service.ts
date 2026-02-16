import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  // Signal to track if an update is available
  updateAvailable = signal(false);

  // Signal to track if the app is installed as PWA
  isInstalled = signal(false);

  // Signal to track notification permission
  notificationPermission = signal<NotificationPermission>('default');

  private swRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    // Check if already running as PWA
    this.checkIfInstalled();

    // Listen for install prompt
    this.setupInstallPrompt();

    // Check notification permission
    this.checkNotificationPermission();
  }

  /**
   * Register the Service Worker
   */
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA Service] Service Workers not supported');
      return;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[PWA Service] Service Worker registered:', this.swRegistration);

      // Check for updates on page load
      this.swRegistration.update();

      // Listen for updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration?.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA Service] New version available!');
              this.updateAvailable.set(true);

              // Show update notification
              if (confirm('A new version of Planning Poker is available. Reload to update?')) {
                this.applyUpdate();
              }
            }
          });
        }
      });

      // Check for updates periodically (every 1 hour)
      setInterval(() => {
        this.swRegistration?.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[PWA Service] Service Worker registration failed:', error);
    }
  }

  /**
   * Apply the pending update
   */
  applyUpdate(): void {
    if (!this.swRegistration?.waiting) {
      return;
    }

    // Tell the waiting service worker to activate
    this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page once the new service worker activates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Check for updates manually
   */
  checkForUpdate(): void {
    this.swRegistration?.update();
  }

  /**
   * Check if the app is running as installed PWA
   */
  private checkIfInstalled(): void {
    // Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    this.isInstalled.set(isStandalone || isIosStandalone);
  }

  /**
   * Setup the install prompt handler
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent the default prompt
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e as BeforeInstallPromptEvent;

      console.log('[PWA Service] Install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA Service] App installed');
      this.isInstalled.set(true);
      this.deferredPrompt = null;
    });
  }

  /**
   * Show the install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[PWA Service] Install prompt not available');
      return false;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user's response
    const choiceResult = await this.deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA Service] User accepted the install prompt');
      this.deferredPrompt = null;
      return true;
    } else {
      console.log('[PWA Service] User dismissed the install prompt');
      return false;
    }
  }

  /**
   * Check if the install prompt is available
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Check current notification permission status
   */
  private checkNotificationPermission(): void {
    if ('Notification' in window) {
      this.notificationPermission.set(Notification.permission);
    }
  }

  /**
   * Request notification permission from user
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[PWA Service] Notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission.set(permission);
      console.log('[PWA Service] Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('[PWA Service] Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a desktop notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('[PWA Service] Notifications not supported');
      return;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.warn('[PWA Service] Notification permission not granted');
      return;
    }

    // If service worker is available, show notification through it
    if (this.swRegistration) {
      try {
        await this.swRegistration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });
        console.log('[PWA Service] Notification shown:', title);
      } catch (error) {
        console.error('[PWA Service] Failed to show notification:', error);
      }
    } else {
      // Fallback to direct notification
      try {
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options,
        });
        console.log('[PWA Service] Notification shown (fallback):', title);
      } catch (error) {
        console.error('[PWA Service] Failed to show notification (fallback):', error);
      }
    }
  }

  /**
   * Check if notifications are supported and enabled
   */
  canShowNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }
}

// TypeScript interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}
