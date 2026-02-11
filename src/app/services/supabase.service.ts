import { Injectable, signal, WritableSignal } from '@angular/core';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

export interface Participant {
  id: string;
  name: string;
  vote?: string;
  lastSeen: number;
}

export interface RoomState {
  participants: Record<string, Participant>;
  revealed: boolean;
  votingStarted: boolean;
  roomId: string;
  adminUserId: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private roomState: WritableSignal<RoomState> = signal<RoomState>({
    participants: {},
    revealed: false,
    votingStarted: false,
    roomId: '',
    adminUserId: ''
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

  // Subject for when current user is removed
  private userRemovedSubject = new Subject<void>();
  public readonly onUserRemoved$ = this.userRemovedSubject.asObservable();

  constructor() {
    // Initialize Supabase client without auth persistence
    // We don't use Supabase Auth, so disable it to avoid lock conflicts
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );

    // Handle page unload/refresh to mark user as offline
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        const roomId = this.roomState().roomId;
        if (roomId && this.currentUserId) {
          // Mark user as offline by setting last_seen to 0
          this.supabase
            .from('participants')
            .update({ last_seen: 0 })
            .eq('room_id', roomId)
            .eq('user_id', this.currentUserId)
            .then();
        }
      });
    }
  }

  /**
   * Join a room and start syncing state
   * @param roomId Room ID to join
   * @param userName User's display name
   * @param adminPin Optional admin PIN for room creation or admin access
   */
  async joinRoom(roomId: string, userName: string, adminPin?: string): Promise<void> {
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
    const userIdKey = `planning-poker-userid-${roomId}`;
    const adminIdKey = `planning-poker-admin-${roomId}`;

    // Update room state signal
    this.roomState.update(state => ({
      ...state,
      roomId,
      participants: {} // Clear old participants
    }));

    // Load existing room state first to know who the admin is
    await this.loadRoomState(roomId);

    let storedUserId = localStorage.getItem(userIdKey);

    // For regular users, check if stored userId is recent (within last 24 hours)
    if (storedUserId) {
      const timestamp = storedUserId.split('_')[1];
      const age = Date.now() - parseInt(timestamp);
      if (age > 24 * 60 * 60 * 1000) { // 24 hours
        storedUserId = null;
      }
    }

    // If joining without PIN and stored ID matches admin, generate new ID
    // This prevents accidental admin access when rejoining without PIN
    if (!adminPin && storedUserId === this.roomState().adminUserId) {
      storedUserId = null;
      localStorage.removeItem(adminIdKey);
    }

    // Use stored ID or generate new one
    this.currentUserId = storedUserId || this.generateUserId();
    this.currentUserName = userName;

    // Store the user ID for future refreshes
    localStorage.setItem(userIdKey, this.currentUserId);

    // If room doesn't exist, create it with current user as admin
    if (!this.roomState().adminUserId) {
      await this.createRoomWithAdmin(roomId, adminPin);
      // Store admin ID permanently (no expiry) if PIN was set
      if (adminPin) {
        localStorage.setItem(adminIdKey, this.currentUserId);
      }
    } else if (adminPin) {
      // Verify admin PIN if provided
      const isValidPin = await this.verifyAdminPin(roomId, adminPin);
      if (isValidPin && this.roomState().adminUserId) {
        // User provided correct PIN, become admin with their stored ID
        this.currentUserId = this.roomState().adminUserId;
        localStorage.setItem(adminIdKey, this.currentUserId);
        localStorage.setItem(userIdKey, this.currentUserId);
      } else if (!isValidPin) {
        throw new Error('Invalid admin PIN');
      }
    }

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
        // Only include active participants (last_seen within 10 seconds)
        if (p.last_seen && now - p.last_seen <= 10000) {
          activeParticipants[p.user_id] = {
            id: p.user_id,
            name: p.name,
            vote: p.vote,
            lastSeen: p.last_seen
          };
        }
      });

      this.roomState.update(state => ({
        ...state,
        participants: activeParticipants
      }));
    }

    // Load revealed state, voting_started, and admin user (room might not exist yet, that's OK)
    const { data: rooms } = await this.supabase
      .from('rooms')
      .select('revealed, voting_started, admin_user_id')
      .eq('id', roomId);

    if (rooms && rooms.length > 0) {
      this.roomState.update(state => ({
        ...state,
        revealed: rooms[0].revealed || false,
        votingStarted: rooms[0].voting_started || false,
        adminUserId: rooms[0].admin_user_id || ''
      }));
    } else {
      // Room doesn't exist yet, that's fine - it will be created when someone toggles reveal
      this.roomState.update(state => ({
        ...state,
        revealed: false,
        votingStarted: false,
        adminUserId: ''
      }));
    }
  }

  /**
   * Create a new room with current user as admin
   */
  private async createRoomWithAdmin(roomId: string, adminPin?: string): Promise<void> {
    await this.supabase
      .from('rooms')
      .insert({
        id: roomId,
        revealed: false,
        voting_started: false,
        admin_user_id: this.currentUserId,
        admin_pin: adminPin || null
      });

    // Update local state
    this.roomState.update(state => ({
      ...state,
      votingStarted: false,
      adminUserId: this.currentUserId
    }));
  }

  /**
   * Verify admin PIN for a room
   */
  private async verifyAdminPin(roomId: string, providedPin: string): Promise<boolean> {
    const { data: rooms } = await this.supabase
      .from('rooms')
      .select('admin_pin')
      .eq('id', roomId)
      .single();

    if (!rooms || !rooms.admin_pin) {
      return false;
    }

    return rooms.admin_pin === providedPin;
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
      // Listen to room changes (revealed state and voting_started)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload: any) => {
          if (payload.new) {
            const updates: Partial<RoomState> = {};
            if (typeof payload.new.revealed === 'boolean') {
              updates.revealed = payload.new.revealed;
            }
            if (typeof payload.new.voting_started === 'boolean') {
              updates.votingStarted = payload.new.voting_started;
            }
            if (Object.keys(updates).length > 0) {
              this.roomState.update(state => ({
                ...state,
                ...updates
              }));
            }
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

      // Check if the removed user is the current user
      if (userId === this.currentUserId) {
        // Emit event that current user was removed
        this.userRemovedSubject.next();
      }

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
      const isStale = !participant.last_seen ||
                      participant.last_seen === 0 ||
                      now - participant.last_seen > 10000;

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
            existing.lastSeen === participant.last_seen) {
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
              lastSeen: participant.last_seen
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
      last_seen: Date.now(),
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
        .update({ last_seen: Date.now() })
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
   * Toggle reveal state (admin only)
   */
  async toggleReveal(): Promise<void> {
    const roomId = this.roomState().roomId;
    const currentRevealed = this.roomState().revealed;

    if (!roomId) return;

    // Check if room exists first
    const { data: existingRooms } = await this.supabase
      .from('rooms')
      .select('id, admin_user_id')
      .eq('id', roomId);

    if (!existingRooms || existingRooms.length === 0) {
      // Create room if it doesn't exist, set current user as admin
      await this.supabase
        .from('rooms')
        .insert({
          id: roomId,
          revealed: !currentRevealed,
          voting_started: false,
          admin_user_id: this.currentUserId
        });

      // Update local state with admin
      this.roomState.update(state => ({
        ...state,
        votingStarted: false,
        adminUserId: this.currentUserId
      }));
    } else {
      // Update existing room
      await this.supabase
        .from('rooms')
        .update({ revealed: !currentRevealed })
        .eq('id', roomId);
    }
  }

  /**
   * Reset all votes (admin only)
   */
  async resetVotes(): Promise<void> {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    // Clear all votes for this room
    await this.supabase
      .from('participants')
      .update({ vote: null })
      .eq('room_id', roomId);

    // Set revealed to false and voting_started to false
    await this.supabase
      .from('rooms')
      .update({ revealed: false, voting_started: false })
      .eq('id', roomId);
  }

  /**
   * Start voting session (admin only)
   * Resets all votes and enables voting
   */
  async startVoting(): Promise<void> {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    // Clear all votes for this room
    await this.supabase
      .from('participants')
      .update({ vote: null })
      .eq('room_id', roomId);

    // Set voting_started to true and revealed to false
    await this.supabase
      .from('rooms')
      .update({ voting_started: true, revealed: false })
      .eq('id', roomId);
  }

  /**
   * Remove a participant from the room (admin only)
   */
  async removeParticipant(userId: string): Promise<void> {
    const roomId = this.roomState().roomId;
    if (!roomId) return;

    // Delete the participant from the database
    await this.supabase
      .from('participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  /**
   * Check if current user is the room admin
   */
  isAdmin(): boolean {
    return this.currentUserId === this.roomState().adminUserId;
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
        .update({ last_seen: 0 })
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
      votingStarted: false,
      roomId: '',
      adminUserId: ''
    });

    this.currentUserId = '';
    this.currentUserName = '';
  }
}
