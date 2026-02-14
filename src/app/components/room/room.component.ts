import { CommonModule } from "@angular/common";
import { Component, computed, effect, linkedSignal, OnDestroy, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ActivatedRoute, Router } from "@angular/router";
import { Participant, SupabaseService } from "../../services/supabase.service";

@Component({
  selector: "app-room",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: "./room.component.html",
  styleUrls: ["./room.component.scss"],
})
export class RoomComponent implements OnInit, OnDestroy {
  // Constants
  private readonly DEFAULT_CARD_INDEX = 5; // Index of "5" in cardValues
  private readonly SWIPE_THRESHOLD = 50; // Minimum distance in pixels for a swipe

  // Extended Fibonacci sequence for voting
  readonly cardValues = [
    "0",
    "1",
    "2",
    "3",
    "5",
    "8",
    "13",
    "20",
    "35",
    "50",
    "100",
    "?",
  ];

  // Room state from Supabase service
  roomState = this.supabaseService.state;
  currentUserId = "";

  // Tinder-style card navigation using Angular 21 linkedSignal
  // Automatically syncs with myVote but can be manually overridden
  currentCardIndex = linkedSignal<number>(() => {
    const vote = this.myVote();
    if (vote) {
      const index = this.cardValues.indexOf(vote);
      return index !== -1 ? index : this.DEFAULT_CARD_INDEX;
    }
    return this.DEFAULT_CARD_INDEX;
  });

  // Touch swipe tracking
  private touchStartX = 0;
  private touchEndX = 0;

  // Computed values
  participants = computed(() => {
    return Object.values(this.roomState().participants);
  });

  // Helper computed for filtering participating users (excludes non-participating admin)
  participatingUsers = computed(() => {
    const adminId = this.roomState().adminUserId;
    const adminParticipates = this.roomState().adminParticipates;

    return this.participants().filter((p: Participant) => {
      // Exclude admin if they're not participating
      return !(p.id === adminId && !adminParticipates);
    });
  });

  votedCount = computed(() => {
    return this.participatingUsers().filter(p => p.vote != null).length;
  });

  totalCount = computed(() => this.participatingUsers().length);

  averageVote = computed(() => {
    if (!this.roomState().revealed) return null;

    const numericVotes = this.participatingUsers()
      .filter(p => p.vote && p.vote !== "?")
      .map(p => parseFloat(p.vote!))
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
    const adminId = this.roomState().adminUserId;
    // Only show admin controls if adminUserId is set and matches current user
    return adminId !== "" && this.currentUserId === adminId;
  });

  shouldShowVotingCards = computed(() => {
    const adminId = this.roomState().adminUserId;
    // Wait until room is loaded (adminUserId is set) to prevent flash
    if (adminId === "") return false;

    // If not admin, show voting cards
    if (!this.isAdmin()) return true;

    // If admin, only show if they want to participate
    return this.roomState().adminParticipates;
  });

  isVotingEnabled = computed(() => {
    // Voting is enabled only when voting has started AND votes are not revealed
    return this.roomState().votingStarted && !this.roomState().revealed;
  });

  // Get candidates for min and max voters
  getMinMaxCandidates = computed(() => {
    if (!this.roomState().revealed) return { minCandidates: [], maxCandidates: [] };

    const numericVotes = this.participatingUsers()
      .map((p: Participant) => ({
        participant: p,
        numericVote: p.vote && p.vote !== "?" ? parseFloat(p.vote) : null,
      }))
      .filter((v) => v.numericVote !== null && !isNaN(v.numericVote!));

    if (numericVotes.length === 0) return { minCandidates: [], maxCandidates: [] };

    const minVote = Math.min(...numericVotes.map((v) => v.numericVote!));
    const maxVote = Math.max(...numericVotes.map((v) => v.numericVote!));

    // If all votes are the same, return empty arrays
    if (minVote === maxVote) return { minCandidates: [], maxCandidates: [] };

    const minCandidates = numericVotes
      .filter((v) => v.numericVote === minVote)
      .map((v) => v.participant.id);
    const maxCandidates = numericVotes
      .filter((v) => v.numericVote === maxVote)
      .map((v) => v.participant.id);

    return { minCandidates, maxCandidates };
  });

  canStartDiscussion = computed(() => {
    const { minCandidates, maxCandidates } = this.getMinMaxCandidates();
    return this.roomState().revealed && (minCandidates.length > 0 || maxCandidates.length > 0);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly supabaseService: SupabaseService,
  ) {
    // Handle user removal with effect (100% signal-based, no RxJS)
    effect(() => {
      if (this.supabaseService.userRemoved()) {
        // User was removed by admin, redirect to home silently
        this.router.navigate(["/"]);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      // Get room ID from route
      const roomId = this.route.snapshot.paramMap.get("id");
      if (!roomId) {
        this.router.navigate(["/"]);
        return;
      }

      // Get user name, admin PIN, and isCreating flag from navigation state or localStorage
      const state = history.state;
      let userName = state?.["userName"];
      const adminPin = state?.["adminPin"];
      const isCreating = state?.["isCreating"];

      // If no userName in state, try localStorage
      if (!userName) {
        userName = localStorage.getItem("planning-poker-username");
      }

      // If still no userName, redirect to home
      if (!userName) {
        this.router.navigate(["/"]);
        return;
      }

      // Store userName in localStorage for future refreshes
      localStorage.setItem("planning-poker-username", userName);

      // Create or join room based on isCreating flag
      if (isCreating) {
        await this.supabaseService.createRoom(roomId, userName, adminPin);
      } else {
        await this.supabaseService.joinRoom(roomId, userName, adminPin);
      }
      this.currentUserId = this.supabaseService.getCurrentUserId();
    } catch (error) {
      console.error('Failed to initialize room:', error);
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    this.supabaseService.leaveRoom();
  }

  /**
   * Vote for a card value
   */
  vote(value: string): void {
    // Only allow voting if session has started AND votes are not revealed
    if (!this.roomState().votingStarted || this.roomState().revealed) return;
    this.supabaseService.vote(value);

    // Update carousel to show the selected card
    const index = this.cardValues.indexOf(value);
    if (index !== -1) {
      this.currentCardIndex.set(index);
    }
  }

  /**
   * Toggle reveal state
   */
  toggleReveal(): void {
    if (!this.isAdmin()) return;

    // If hiding votes and discussion mode is active, stop discussion mode
    if (this.roomState().revealed && this.roomState().discussionActive) {
      this.supabaseService.toggleDiscussion(null, null);
    }

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
   * Start voting session (admin only)
   */
  startVoting(): void {
    if (!this.isAdmin()) return;
    this.supabaseService.startVoting();
  }

  /**
   * Toggle admin participation in voting
   */
  toggleAdminParticipation(): void {
    if (!this.isAdmin()) return;
    this.supabaseService.toggleAdminParticipation();
  }

  /**
   * Toggle discussion mode to highlight min/max voters
   */
  toggleDiscussion(): void {
    if (!this.isAdmin()) return;

    if (!this.roomState().discussionActive) {
      // Entering discussion mode - randomly select one from each group
      const { minCandidates, maxCandidates } = this.getMinMaxCandidates();

      const selectedMinVoter = minCandidates.length > 0
        ? minCandidates[Math.floor(Math.random() * minCandidates.length)]
        : null;
      const selectedMaxVoter = maxCandidates.length > 0
        ? maxCandidates[Math.floor(Math.random() * maxCandidates.length)]
        : null;

      this.supabaseService.toggleDiscussion(selectedMinVoter, selectedMaxVoter);
    } else {
      // Exiting discussion mode
      this.supabaseService.toggleDiscussion(null, null);
    }
  }

  /**
   * Check if participant is a min voter in discussion mode
   */
  isMinVoter(participantId: string): boolean {
    if (!this.roomState().discussionActive) return false;
    return this.roomState().discussionMinVoter === participantId;
  }

  /**
   * Check if participant is a max voter in discussion mode
   */
  isMaxVoter(participantId: string): boolean {
    if (!this.roomState().discussionActive) return false;
    return this.roomState().discussionMaxVoter === participantId;
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
  async copyRoomId(): Promise<void> {
    const roomId = this.roomState().roomId;
    try {
      await navigator.clipboard.writeText(roomId);
      console.log("Room ID copied to clipboard");
    } catch (err) {
      console.error('Failed to copy room ID:', err);
      // Fallback: Could show error message or use alternative method
    }
  }

  /**
   * Share room URL (copy full URL to clipboard)
   */
  async shareRoom(): Promise<void> {
    const roomId = this.roomState().roomId;
    const baseHref = document.querySelector('base')?.getAttribute('href') ?? '/';
    const origin = window.location.origin;
    const roomUrl = `${origin}${baseHref}room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      console.log("Room URL copied to clipboard");
    } catch (err) {
      console.error('Failed to copy room URL:', err);
      // Fallback: Could show error message or use alternative method
    }
  }

  /**
   * Leave room and go back to home
   */
  leaveRoom(): void {
    this.router.navigate(["/"]);
  }

  /**
   * Check if a card is selected
   */
  isCardSelected(value: string): boolean {
    const currentVote = this.myVote();
    // If no vote yet, default to "?" being selected
    if (currentVote === undefined || currentVote === null) {
      return value === "?";
    }
    return currentVote === value;
  }

  /**
   * Get display value for a participant's vote
   */
  getParticipantVoteDisplay(participant: Participant): string {
    if (!participant.vote) return "";
    if (!this.roomState().revealed) return "✓";
    return participant.vote;
  }

  /**
   * Check if participant has voted
   */
  hasVoted(participant: Participant): boolean {
    return participant.vote !== undefined && participant.vote !== null;
  }

  /**
   * Get position around the table for a participant
   */
  getParticipantPosition(index: number): number {
    const total = this.participants().length;
    // Distribute participants evenly around the table
    return Math.floor((index / total) * 12); // 12 positions around the table
  }

  /**
   * Navigate to previous card
   */
  previousCard(): void {
    if (this.currentCardIndex() > 0) {
      this.currentCardIndex.set(this.currentCardIndex() - 1);
    }
  }

  /**
   * Navigate to next card
   */
  nextCard(): void {
    if (this.currentCardIndex() < this.cardValues.length - 1) {
      this.currentCardIndex.set(this.currentCardIndex() + 1);
    }
  }

  /**
   * Go to specific card index
   */
  goToCard(index: number): void {
    this.currentCardIndex.set(index);
  }

  /**
   * Handle touch start for swipe gestures
   */
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  /**
   * Handle touch end for swipe gestures
   */
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  /**
   * Detect swipe direction and navigate cards
   */
  private handleSwipe(): void {
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > this.SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swiped left - go to next card
        this.nextCard();
      } else {
        // Swiped right - go to previous card
        this.previousCard();
      }
    }
  }
}
