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
import { GunService, Participant } from '../../services/gun.service';

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

  // Room state from Gun service
  roomState = this.gunService.state;
  currentUserId = '';

  // Computed values
  participants = computed(() => {
    return Object.values(this.roomState().participants);
  });

  votedCount = computed(() => {
    return this.participants().filter(p => p.vote !== undefined && p.vote !== null).length;
  });

  totalCount = computed(() => {
    return this.participants().length;
  });

  averageVote = computed(() => {
    if (!this.roomState().revealed) return null;

    const participants = this.participants();
    const numericVotes = participants
      .map(p => p.vote)
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gunService: GunService
  ) {}

  ngOnInit(): void {
    // Get room ID from route
    const roomId = this.route.snapshot.paramMap.get('id');
    if (!roomId) {
      this.router.navigate(['/']);
      return;
    }

    // Get user name from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;
    const userName = state?.['userName'];

    if (!userName) {
      this.router.navigate(['/']);
      return;
    }

    // Join room
    this.gunService.joinRoom(roomId, userName);
    this.currentUserId = this.gunService.getCurrentUserId();
  }

  ngOnDestroy(): void {
    this.gunService.leaveRoom();
  }

  /**
   * Vote for a card value
   */
  vote(value: string): void {
    this.gunService.vote(value);
  }

  /**
   * Toggle reveal state
   */
  toggleReveal(): void {
    this.gunService.toggleReveal();
  }

  /**
   * Reset all votes
   */
  resetVotes(): void {
    this.gunService.resetVotes();
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
