import { CommonModule } from "@angular/common";
import { Component, computed, OnDestroy, OnInit } from "@angular/core";
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

  // Tinder-style card navigation
  currentCardIndex = 5; // Start at "5" (index 4 in cardValues)

  // Touch swipe tracking
  private touchStartX = 0;
  private touchEndX = 0;

  // Computed values
  participants = computed(() => {
    return Object.values(this.roomState().participants);
  });

  votedCount = computed(() => {
    const adminId = this.roomState().adminUserId;
    const adminParticipates = this.roomState().adminParticipates;

    return this.participants().filter((p: Participant) => {
      // Exclude admin if they're not participating
      if (p.id === adminId && !adminParticipates) {
        return false;
      }
      return p.vote !== undefined && p.vote !== null;
    }).length;
  });

  totalCount = computed(() => {
    const adminId = this.roomState().adminUserId;
    const adminParticipates = this.roomState().adminParticipates;

    return this.participants().filter((p: Participant) => {
      // Exclude admin if they're not participating
      if (p.id === adminId && !adminParticipates) {
        return false;
      }
      return true;
    }).length;
  });

  averageVote = computed(() => {
    if (!this.roomState().revealed) return null;

    const participants = this.participants();
    const numericVotes = participants
      .map((p: Participant) => p.vote)
      .filter(v => v && v !== "?")
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

  // Sync carousel index with selected vote
  private syncCarouselWithVote(): void {
    const vote = this.myVote();
    if (vote) {
      const index = this.cardValues.indexOf(vote);
      if (index !== -1) {
        this.currentCardIndex = index;
      }
    }
  }

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

    const participatingUsers = this.participants().filter((p: Participant) => {
      const adminId = this.roomState().adminUserId;
      const adminParticipates = this.roomState().adminParticipates;
      // Exclude non-participating admin
      if (p.id === adminId && !adminParticipates) return false;
      return true;
    });

    const numericVotes = participatingUsers
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
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Get room ID from route
    const roomId = this.route.snapshot.paramMap.get("id");
    if (!roomId) {
      this.router.navigate(["/"]);
      return;
    }

    // Get user name, admin PIN, and isCreating flag from navigation state or localStorage
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;
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

    // Sync carousel with current vote
    this.syncCarouselWithVote();

    // Subscribe to user removal events
    this.supabaseService.onUserRemoved$.subscribe(() => {
      // User was removed by admin, redirect to home silently
      this.router.navigate(["/"]);
    });
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
      this.currentCardIndex = index;
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
  copyRoomId(): void {
    const roomId = this.roomState().roomId;
    navigator.clipboard.writeText(roomId).then(() => {
      // Could add a snackbar notification here
      console.log("Room ID copied to clipboard");
    });
  }

  /**
   * Share room URL (copy full URL to clipboard)
   */
  shareRoom(): void {
    const roomId = this.roomState().roomId;
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    const origin = window.location.origin;
    const roomUrl = `${origin}${baseHref}room/${roomId}`;
    navigator.clipboard.writeText(roomUrl).then(() => {
      // Could add a snackbar notification here
      console.log("Room URL copied to clipboard");
    });
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
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
    }
  }

  /**
   * Navigate to next card
   */
  nextCard(): void {
    if (this.currentCardIndex < this.cardValues.length - 1) {
      this.currentCardIndex++;
    }
  }

  /**
   * Go to specific card index
   */
  goToCard(index: number): void {
    this.currentCardIndex = index;
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
    const swipeThreshold = 50; // Minimum distance for a swipe
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
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
