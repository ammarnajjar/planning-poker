import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AdminPinDialogComponent } from '../admin-pin-dialog/admin-pin-dialog.component';
import { SupabaseService } from '../../services/supabase.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  userName = signal('');
  roomId = signal('');
  showJoinForm = signal(false);
  joinAsAdmin = signal(false);
  joinError = signal(false);

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private supabaseService: SupabaseService
  ) {}

  /**
   * Create a new room with a random ID
   */
  async createRoom(): Promise<void> {
    const name = this.userName().trim();
    if (!name) {
      alert('Please enter your name');
      return;
    }

    // Prompt for admin PIN (optional but recommended)
    const dialogRef = this.dialog.open(AdminPinDialogComponent, {
      width: '400px',
      disableClose: false,
      data: {
        title: 'Set Admin PIN',
        message: 'Set an admin PIN (optional but recommended). This PIN will allow you to regain admin access if you return later.',
        mode: 'create',
        pinRequired: false
      }
    });

    const adminPin = await firstValueFrom(dialogRef.afterClosed());

    // User can cancel or skip PIN
    if (adminPin === null) {
      return; // User cancelled
    }

    const newRoomId = this.generateRoomId();
    this.navigateToRoom(newRoomId, name, adminPin || undefined, true);
  }

  /**
   * Join an existing room
   */
  async joinRoom(): Promise<void> {
    const name = this.userName().trim();
    const room = this.roomId().trim();

    // Clear previous error
    this.joinError.set(false);

    if (!name) {
      alert('Please enter your name');
      return;
    }

    if (!room) {
      alert('Please enter a room ID');
      return;
    }

    // Check if room exists before proceeding
    const exists = await this.supabaseService.roomExists(room);
    if (!exists) {
      this.joinError.set(true);
      return;
    }

    let adminPin: string | undefined = undefined;

    // Only show PIN dialog if user wants to join as admin
    if (this.joinAsAdmin()) {
      const dialogRef = this.dialog.open(AdminPinDialogComponent, {
        width: '400px',
        disableClose: false,
        data: {
          title: 'Enter Admin PIN',
          message: 'Enter the admin PIN to join as admin.',
          mode: 'join',
          pinRequired: true
        }
      });

      const result = await firstValueFrom(dialogRef.afterClosed());

      // User cancelled the dialog
      if (result === null) {
        return;
      }

      adminPin = result || undefined;
    }

    this.navigateToRoom(room, name, adminPin);
  }

  /**
   * Toggle join room form visibility
   */
  toggleJoinForm(): void {
    this.showJoinForm.update(show => !show);
    this.joinError.set(false); // Clear error when toggling form
  }

  /**
   * Navigate to room with state
   */
  private navigateToRoom(roomId: string, userName: string, adminPin?: string, isCreating = false): void {
    this.router.navigate(['/room', roomId], {
      state: { userName, adminPin, isCreating }
    });
  }

  /**
   * Generate a random alphanumeric room ID
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
