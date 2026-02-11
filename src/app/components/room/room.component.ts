import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService, Participant } from '../../services/supabase.service';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, OnDestroy {
  // Fibonacci sequence for voting
  readonly cardValues = ['0', '1', '2', '3', '5', '8', '13', '21', '?'];

  // Room state from Supabase service
  roomState = this.supabaseService.state;
  currentUserId = '';

  // Computed values
  participants = computed(() => {
    return Object.values(this.roomState().participants);
  });

  votedCount = computed(() => {
    return this.participants().filter((p: Participant) => p.vote !== undefined && p.vote !== null).length;
  });

  totalCount = computed(() => {
    return this.participants().length;
  });

  averageVote = computed(() => {
    if (!this.roomState().revealed) return null;

    const participants = this.participants();
    const numericVotes = participants
      .map((p: Participant) => p.vote)
      .filter(v => v && v !== '?')
      .map(v => parseFloat(v!))
      .filter(v => !isNaN(v));

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((acc, val) => acc + val, 0);
    return (sum / numericVotes.length).toFixed(1);
  });

  myVote = computed(() => {
    const participant = this.roomState().participants[this.currentUserId];
    return participant?.vote;
  });

  isAdmin = computed(() => {
    return this.currentUserId === this.roomState().adminUserId;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    // Get room ID from route
    const roomId = this.route.snapshot.paramMap.get('id');
    if (!roomId) {
      this.router.navigate(['/']);
      return;
    }

    // Get user name from navigation state or localStorage
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;
    let userName = state?.['userName'];

    // If no userName in state, try localStorage
    if (!userName) {
      userName = localStorage.getItem('planning-poker-username');
    }

    // If still no userName, redirect to home
    if (!userName) {
      this.router.navigate(['/']);
      return;
    }

    // Store userName in localStorage for future refreshes
    localStorage.setItem('planning-poker-username', userName);

    // Join room
    this.supabaseService.joinRoom(roomId, userName);
    this.currentUserId = this.supabaseService.getCurrentUserId();

    // Subscribe to user removal events
    this.supabaseService.onUserRemoved$.subscribe(() => {
      // User was removed by admin, redirect to home
      alert('You have been removed from the room by the admin.');
      this.router.navigate(['/']);
    });
  }

  ngOnDestroy(): void {
    this.supabaseService.leaveRoom();
  }

  /**
   * Vote for a card value
   */
  vote(value: string): void {
    this.supabaseService.vote(value);
  }

  /**
   * Toggle reveal state
   */
  toggleReveal(): void {
    if (!this.isAdmin()) return;
    this.supabaseService.toggleReveal();
  }

  /**
   * Reset all votes
   */
  resetVotes(): void {
    if (!this.isAdmin()) return;
    this.supabaseService.resetVotes();
  }

  /**
   * Remove a participant from the room (admin only)
   */
  removeParticipant(userId: string): void {
    if (!this.isAdmin()) return;
    if (userId === this.currentUserId) return; // Can't remove yourself
    this.supabaseService.removeParticipant(userId);
  }

  /**
   * Copy room ID to clipboard
   */
  copyRoomId(): void {
    const roomId = this.roomState().roomId;
    navigator.clipboard.writeText(roomId).then(() => {
      // Could add a snackbar notification here
      console.log('Room ID copied to clipboard');
    });
  }

  /**
   * Leave room and go back to home
   */
  leaveRoom(): void {
    this.router.navigate(['/']);
  }

  /**
   * Check if a card is selected
   */
  isCardSelected(value: string): boolean {
    return this.myVote() === value;
  }

  /**
   * Get display value for a participant's vote
   */
  getParticipantVoteDisplay(participant: Participant): string {
    if (!participant.vote) return '';
    if (!this.roomState().revealed) return '✓';
    return participant.vote;
  }

  /**
   * Check if participant has voted
   */
  hasVoted(participant: Participant): boolean {
    return participant.vote !== undefined && participant.vote !== null;
  }
}
