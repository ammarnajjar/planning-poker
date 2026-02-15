import { Component, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatButtonModule, MatIconModule],
  template: `
    <router-outlet></router-outlet>

    @if (pwaService.updateAvailable()) {
      <div class="update-banner">
        <div class="update-content">
          <mat-icon>update</mat-icon>
          <span>A new version is available!</span>
        </div>
        <div class="update-actions">
          <button mat-button (click)="dismissUpdate()">Later</button>
          <button mat-raised-button color="primary" (click)="updateApp()">
            Update Now
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .update-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #3f51b5;
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .update-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .update-content mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .update-actions {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .update-banner {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .update-actions {
        justify-content: stretch;
      }

      .update-actions button {
        flex: 1;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'planning-poker';

  constructor(public pwaService: PwaService) {
    // Log when PWA is installed
    effect(() => {
      if (this.pwaService.isInstalled()) {
        console.log('[App] Running as installed PWA');
      }
    });
  }

  ngOnInit() {
    // Register the Service Worker
    this.pwaService.register();
  }

  updateApp() {
    this.pwaService.applyUpdate();
  }

  dismissUpdate() {
    this.pwaService.updateAvailable.set(false);
  }
}
