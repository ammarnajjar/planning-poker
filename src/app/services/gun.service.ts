import { Injectable, signal, WritableSignal } from '@angular/core';
import Gun from 'gun';

export interface Participant {
  id: string;
  name: string;
  vote?: string;
  lastSeen: number;
}

export interface RoomState {
  participants: Record<string, Participant>;
  revealed: boolean;
  roomId: string;
}

@Injectable({
  providedIn: 'root'
})
export class GunService {
  private gun: any;
  private roomState: WritableSignal<RoomState> = signal<RoomState>({
    participants: {},
    revealed: false,
    roomId: ''
  });

  // Public readonly signal
  public readonly state = this.roomState.asReadonly();

  // Current user info
  private currentUserId = '';
  private currentUserName = '';

  // Track current room node for cleanup
  private currentRoomNode: any = null;

  // BroadcastChannel for reliable tab-to-tab sync
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // Initialize Gun with multiple relay peers
    // BroadcastChannel handles same-browser tab sync
    // Gun relay peers handle cross-browser and cross-machine sync
    this.gun = Gun({
      peers: [
        // Primary public relay peers
        'https://gun-manhattan.herokuapp.com/gun',
        'https://relay.peer.ooo/gun',
        'https://gun-us.herokuapp.com/gun',
        'https://gunjs.herokuapp.com/gun',
        // Additional community relay peers (may have varying reliability)
        'https://peer.wallie.io/gun',
        'https://gundb.herokuapp.com/gun'
      ],
      localStorage: true,   // Enable localStorage for data persistence
      radisk: true,         // Enable radisk for better multi-tab sync
      axe: false,           // Disable logging to reduce console noise
      retry: Infinity,      // Keep retrying connections to peers
      // Enable multicast for better peer discovery
      multicast: true
    });

    // Log peer connection status for debugging
    if (typeof window !== 'undefined') {
      (this.gun as any).on('hi', (peer: any) => {
        console.log('[Gun] Connected to peer:', peer.url || 'local');
      });
      (this.gun as any).on('bye', (peer: any) => {
        console.log('[Gun] Disconnected from peer:', peer.url || 'local');
      });
    }

    // Setup BroadcastChannel for cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel('planning-poker-sync');
      this.broadcastChannel.onmessage = (event) => {
        const { type, roomId, participantId } = event.data;

        // Only process messages for the current room
        if (roomId === this.roomState().roomId) {
          if (type === 'participant-update' && participantId) {
            // Reload this specific participant from Gun
            this.gun
              .get(`poker-room/${roomId}`)
              .get('participants')
              .get(participantId)
              .once((participant: any) => {
                if (participant && participantId !== '_') {
                  this.updateParticipantInState(participant, participantId);
                }
              });
          } else if (type === 'revealed-update') {
            // Reload revealed state from Gun
            this.gun
              .get(`poker-room/${roomId}`)
              .get('revealed')
              .once((revealed: boolean) => {
                if (typeof revealed === 'boolean') {
                  this.roomState.update(state => ({
                    ...state,
                    revealed
                  }));
                }
              });
          }
        }
      };
    }

    // Handle page unload/refresh to mark user as offline
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        const roomId = this.roomState().roomId;
        if (roomId && this.currentUserId) {
          // Mark user as offline by setting lastSeen to 0
          // Use sendBeacon for reliability during page unload
          const data = JSON.stringify({
            roomId,
            userId: this.currentUserId,
            lastSeen: 0
          });

          // Try to update Gun immediately (may not complete)
          this.gun
            .get(`poker-room/${roomId}`)
            .get('participants')
            .get(this.currentUserId)
            .get('lastSeen')
            .put(0);
        }
      });
    }
  }

  /**
   * Join a room and start syncing state
   */
  joinRoom(roomId: string, userName: string): void {
    // Always clean up previous connections to avoid duplicate listeners
    if (this.currentRoomNode) {
      this.currentRoomNode.get('participants').map().off();
      this.currentRoomNode.get('revealed').off();
    }

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Reuse existing user ID from localStorage if available for this room
    // This prevents duplicate participants on page refresh
    const storageKey = `planning-poker-userid-${roomId}`;
    let storedUserId = localStorage.getItem(storageKey);

    // Check if stored userId is recent (within last 24 hours)
    // If too old, generate a new one to avoid issues with stale data
    if (storedUserId) {
      const timestamp = storedUserId.split('_')[1];
      const age = Date.now() - parseInt(timestamp);
      if (age > 24 * 60 * 60 * 1000) { // 24 hours
        storedUserId = null;
      }
    }

    // Use stored ID or generate new one
    this.currentUserId = storedUserId || this.generateUserId();
    this.currentUserName = userName;

    // Store the user ID for future refreshes
    localStorage.setItem(storageKey, this.currentUserId);

    this.currentRoomNode = this.gun.get(`poker-room/${roomId}`);

    // Update room state signal
    this.roomState.update(state => ({
      ...state,
      roomId,
      participants: {} // Clear old participants
    }));

    // Process participant updates (both existing and new)
    const processParticipant = (participant: any, participantId: string) => {
      // Skip Gun metadata
      if (participantId === '_' || !participant) {
        return;
      }

      const now = Date.now();

      // Check if participant is stale (more strict check)
      const isStale = !participant.lastSeen ||
                      participant.lastSeen === 0 ||
                      participant.lastSeen === null ||
                      now - participant.lastSeen > 10000; // Reduced to 10 seconds

      if (isStale) {
        // Remove stale participants from local state
        this.roomState.update(state => {
          const newParticipants = { ...state.participants };
          delete newParticipants[participantId];
          return { ...state, participants: newParticipants };
        });
        return;
      }

      // Only add/update active participants
      this.roomState.update(state => {
        // Avoid unnecessary updates
        const existing = state.participants[participantId];
        if (existing &&
            existing.name === participant.name &&
            existing.vote === participant.vote &&
            existing.lastSeen === participant.lastSeen) {
          return state;
        }

        return {
          ...state,
          participants: {
            ...state.participants,
            [participantId]: {
              id: participant.id || participantId,
              name: participant.name || 'Unknown',
              vote: participant.vote,
              lastSeen: participant.lastSeen
            }
          }
        };
      });
    };

    // Listen to real-time updates for each participant
    // Using .on() will also deliver existing data first, then continue listening
    this.currentRoomNode.get('participants').map().on(processParticipant);

    // Listen to revealed state
    this.currentRoomNode.get('revealed').on((revealed: boolean) => {
      if (typeof revealed === 'boolean') {
        this.roomState.update(state => ({
          ...state,
          revealed
        }));
      }
    });

    // Add current user to participants
    this.addParticipant(roomId, userName);

    // Send heartbeat every 2 seconds (more frequent)
    this.startHeartbeat(roomId);
  }

  /**
   * Add or update current user in participants
   */
  private addParticipant(roomId: string, userName: string): void {
    const participant: Participant = {
      id: this.currentUserId,
      name: userName,
      lastSeen: Date.now()
    };

    this.gun
      .get(`poker-room/${roomId}`)
      .get('participants')
      .get(this.currentUserId)
      .put(participant);

    // Notify other tabs via BroadcastChannel
    this.broadcastToOtherTabs({
      type: 'participant-update',
      roomId,
      participantId: this.currentUserId
    });
  }

  /**
   * Update a participant in the local state
   */
  private updateParticipantInState(participant: any, participantId: string): void {
    const now = Date.now();

    // Check if participant is stale
    const isStale = !participant.lastSeen ||
                    participant.lastSeen === 0 ||
                    participant.lastSeen === null ||
                    now - participant.lastSeen > 10000;

    if (isStale) {
      // Remove stale participants from local state
      this.roomState.update(state => {
        const newParticipants = { ...state.participants };
        delete newParticipants[participantId];
        return { ...state, participants: newParticipants };
      });
      return;
    }

    // Update participant in state
    this.roomState.update(state => {
      const existing = state.participants[participantId];
      if (existing &&
          existing.name === participant.name &&
          existing.vote === participant.vote &&
          existing.lastSeen === participant.lastSeen) {
        return state;
      }

      return {
        ...state,
        participants: {
          ...state.participants,
          [participantId]: {
            id: participant.id || participantId,
            name: participant.name || 'Unknown',
            vote: participant.vote,
            lastSeen: participant.lastSeen
          }
        }
      };
    });
  }

  /**
   * Broadcast message to other tabs
   */
  private broadcastToOtherTabs(message: any): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
  }

  /**
   * Send periodic heartbeat to show user is still active
   */
  private heartbeatInterval?: any;
  private cleanupInterval?: any;

  private startHeartbeat(roomId: string): void {
    // Send heartbeat immediately and then every 2 seconds
    const sendHeartbeat = () => {
      this.gun
        .get(`poker-room/${roomId}`)
        .get('participants')
        .get(this.currentUserId)
        .get('lastSeen')
        .put(Date.now());
    };

    sendHeartbeat(); // Send immediately
    this.heartbeatInterval = setInterval(sendHeartbeat, 2000);

    // Clean up stale participants every 3 seconds
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const participants = this.roomState().participants;

      Object.keys(participants).forEach(userId => {
        const participant = participants[userId];
        if (!participant || !participant.lastSeen || now - participant.lastSeen > 10000) {
          // Remove from local state
          this.roomState.update(state => {
            const newParticipants = { ...state.participants };
            delete newParticipants[userId];
            return { ...state, participants: newParticipants };
          });
        }
      });
    }, 3000);
  }

  /**
   * Submit a vote for the current user
   */
  vote(value: string): void {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    this.gun
      .get(`poker-room/${roomId}`)
      .get('participants')
      .get(this.currentUserId)
      .get('vote')
      .put(value);

    // Notify other tabs
    this.broadcastToOtherTabs({
      type: 'participant-update',
      roomId,
      participantId: this.currentUserId
    });
  }

  /**
   * Toggle reveal state
   */
  toggleReveal(): void {
    const roomId = this.roomState().roomId;
    const currentRevealed = this.roomState().revealed;

    if (!roomId) return;

    this.gun
      .get(`poker-room/${roomId}`)
      .get('revealed')
      .put(!currentRevealed);

    // Notify other tabs
    this.broadcastToOtherTabs({
      type: 'revealed-update',
      roomId
    });
  }

  /**
   * Reset all votes
   */
  resetVotes(): void {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    const participants = this.roomState().participants;

    // Clear votes for all participants
    Object.keys(participants).forEach(userId => {
      this.gun
        .get(`poker-room/${roomId}`)
        .get('participants')
        .get(userId)
        .get('vote')
        .put(null);

      // Notify other tabs for each participant
      this.broadcastToOtherTabs({
        type: 'participant-update',
        roomId,
        participantId: userId
      });
    });

    // Set revealed to false
    this.gun
      .get(`poker-room/${roomId}`)
      .get('revealed')
      .put(false);

    // Notify other tabs
    this.broadcastToOtherTabs({
      type: 'revealed-update',
      roomId
    });
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  /**
   * Generate a unique user ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up when leaving room
   */
  leaveRoom(): void {
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    const roomId = this.roomState().roomId;
    if (roomId && this.currentUserId) {
      // Remove current user from participants by setting lastSeen to 0
      // This allows other users to clean them up immediately
      this.gun
        .get(`poker-room/${roomId}`)
        .get('participants')
        .get(this.currentUserId)
        .get('lastSeen')
        .put(0);

      // Notify other tabs
      this.broadcastToOtherTabs({
        type: 'participant-update',
        roomId,
        participantId: this.currentUserId
      });
    }

    // Unsubscribe from Gun listeners
    if (this.currentRoomNode) {
      this.currentRoomNode.get('participants').map().off();
      this.currentRoomNode.get('revealed').off();
      this.currentRoomNode = null;
    }

    // Reset state
    this.roomState.set({
      participants: {},
      revealed: false,
      roomId: ''
    });

    this.currentUserId = '';
    this.currentUserName = '';
  }
}
