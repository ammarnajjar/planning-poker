import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
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

  constructor(private router: Router) {}

  /**
   * Create a new room with a random ID
   */
  createRoom(): void {
    const name = this.userName().trim();
    if (!name) {
      alert('Please enter your name');
      return;
    }

    const newRoomId = this.generateRoomId();
    this.navigateToRoom(newRoomId, name);
  }

  /**
   * Join an existing room
   */
  joinRoom(): void {
    const name = this.userName().trim();
    const room = this.roomId().trim();

    if (!name) {
      alert('Please enter your name');
      return;
    }

    if (!room) {
      alert('Please enter a room ID');
      return;
    }

    this.navigateToRoom(room, name);
  }

  /**
   * Toggle join room form visibility
   */
  toggleJoinForm(): void {
    this.showJoinForm.update(show => !show);
  }

  /**
   * Navigate to room with state
   */
  private navigateToRoom(roomId: string, userName: string): void {
    this.router.navigate(['/room', roomId], {
      state: { userName }
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
