import { Injectable, signal, WritableSignal } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

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
export class SupabaseService {
  private supabase: SupabaseClient;
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

  // Track current channel for cleanup
  private currentChannel: RealtimeChannel | null = null;

  // Heartbeat and cleanup intervals
  private heartbeatInterval?: any;
  private cleanupInterval?: any;

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    // Handle page unload/refresh to mark user as offline
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        const roomId = this.roomState().roomId;
        if (roomId && this.currentUserId) {
          // Mark user as offline by setting lastSeen to 0
          this.supabase
            .from('participants')
            .update({ lastSeen: 0 })
            .eq('room_id', roomId)
            .eq('user_id', this.currentUserId)
            .then();
        }
      });
    }
  }

  /**
   * Join a room and start syncing state
   */
  async joinRoom(roomId: string, userName: string): Promise<void> {
    // Clean up previous room
    if (this.currentChannel) {
      await this.supabase.removeChannel(this.currentChannel);
      this.currentChannel = null;
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

    // Update room state signal
    this.roomState.update(state => ({
      ...state,
      roomId,
      participants: {} // Clear old participants
    }));

    // Load existing room state
    await this.loadRoomState(roomId);

    // Add current user to participants
    await this.addParticipant(roomId, userName);

    // Subscribe to real-time updates
    this.subscribeToRoom(roomId);

    // Send heartbeat every 2 seconds
    this.startHeartbeat(roomId);
  }

  /**
   * Load existing room state from Supabase
   */
  private async loadRoomState(roomId: string): Promise<void> {
    // Load participants
    const { data: participants } = await this.supabase
      .from('participants')
      .select('*')
      .eq('room_id', roomId);

    if (participants) {
      const now = Date.now();
      const activeParticipants: Record<string, Participant> = {};

      participants.forEach((p: any) => {
        // Only include active participants (lastSeen within 10 seconds)
        if (p.lastSeen && now - p.lastSeen <= 10000) {
          activeParticipants[p.user_id] = {
            id: p.user_id,
            name: p.name,
            vote: p.vote,
            lastSeen: p.lastSeen
          };
        }
      });

      this.roomState.update(state => ({
        ...state,
        participants: activeParticipants
      }));
    }

    // Load revealed state
    const { data: room } = await this.supabase
      .from('rooms')
      .select('revealed')
      .eq('id', roomId)
      .single();

    if (room) {
      this.roomState.update(state => ({
        ...state,
        revealed: room.revealed || false
      }));
    }
  }

  /**
   * Subscribe to real-time updates for the room
   */
  private subscribeToRoom(roomId: string): void {
    // Create a channel for this room
    this.currentChannel = this.supabase.channel(`room:${roomId}`);

    // Listen to participant changes
    this.currentChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          this.handleParticipantChange(payload);
        }
      )
      // Listen to room changes (revealed state)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.revealed === 'boolean') {
            this.roomState.update(state => ({
              ...state,
              revealed: payload.new.revealed
            }));
          }
        }
      )
      .subscribe();
  }

  /**
   * Handle participant change events
   */
  private handleParticipantChange(payload: any): void {
    const { eventType, new: newData, old: oldData } = payload;

    if (eventType === 'DELETE') {
      // Remove participant from state
      const userId = oldData.user_id;
      this.roomState.update(state => {
        const newParticipants = { ...state.participants };
        delete newParticipants[userId];
        return { ...state, participants: newParticipants };
      });
      return;
    }

    if (newData) {
      const now = Date.now();
      const participant = newData;

      // Check if participant is stale or marked as offline
      const isStale = !participant.lastSeen ||
                      participant.lastSeen === 0 ||
                      now - participant.lastSeen > 10000;

      if (isStale) {
        // Remove from state
        this.roomState.update(state => {
          const newParticipants = { ...state.participants };
          delete newParticipants[participant.user_id];
          return { ...state, participants: newParticipants };
        });
        return;
      }

      // Update or add participant
      this.roomState.update(state => {
        const existing = state.participants[participant.user_id];
        if (existing &&
            existing.name === participant.name &&
            existing.vote === participant.vote &&
            existing.lastSeen === participant.lastSeen) {
          return state; // No change
        }

        return {
          ...state,
          participants: {
            ...state.participants,
            [participant.user_id]: {
              id: participant.user_id,
              name: participant.name,
              vote: participant.vote,
              lastSeen: participant.lastSeen
            }
          }
        };
      });
    }
  }

  /**
   * Add or update current user in participants
   */
  private async addParticipant(roomId: string, userName: string): Promise<void> {
    const participant = {
      room_id: roomId,
      user_id: this.currentUserId,
      name: userName,
      lastSeen: Date.now(),
      vote: null
    };

    await this.supabase
      .from('participants')
      .upsert(participant, {
        onConflict: 'room_id,user_id'
      });
  }

  /**
   * Send periodic heartbeat to show user is still active
   */
  private startHeartbeat(roomId: string): void {
    const sendHeartbeat = async () => {
      await this.supabase
        .from('participants')
        .update({ lastSeen: Date.now() })
        .eq('room_id', roomId)
        .eq('user_id', this.currentUserId);
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
  async vote(value: string): Promise<void> {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    await this.supabase
      .from('participants')
      .update({ vote: value })
      .eq('room_id', roomId)
      .eq('user_id', this.currentUserId);
  }

  /**
   * Toggle reveal state
   */
  async toggleReveal(): Promise<void> {
    const roomId = this.roomState().roomId;
    const currentRevealed = this.roomState().revealed;

    if (!roomId) return;

    // Ensure room exists first
    const { data: existingRoom } = await this.supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .single();

    if (!existingRoom) {
      // Create room if it doesn't exist
      await this.supabase
        .from('rooms')
        .insert({ id: roomId, revealed: !currentRevealed });
    } else {
      // Update existing room
      await this.supabase
        .from('rooms')
        .update({ revealed: !currentRevealed })
        .eq('id', roomId);
    }
  }

  /**
   * Reset all votes
   */
  async resetVotes(): Promise<void> {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    // Clear all votes for this room
    await this.supabase
      .from('participants')
      .update({ vote: null })
      .eq('room_id', roomId);

    // Set revealed to false
    await this.supabase
      .from('rooms')
      .update({ revealed: false })
      .eq('id', roomId);
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
  async leaveRoom(): Promise<void> {
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
      // Mark user as offline
      await this.supabase
        .from('participants')
        .update({ lastSeen: 0 })
        .eq('room_id', roomId)
        .eq('user_id', this.currentUserId);
    }

    // Unsubscribe from channel
    if (this.currentChannel) {
      await this.supabase.removeChannel(this.currentChannel);
      this.currentChannel = null;
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
