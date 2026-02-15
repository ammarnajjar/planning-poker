import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client for test cleanup
 */
function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    // Read environment variables that the app uses
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  return supabaseClient;
}

/**
 * Clean up test room and all associated participants
 * @param roomId The room ID to clean up
 */
export async function cleanupTestRoom(roomId: string): Promise<void> {
  if (!roomId) return;

  const supabase = getSupabaseClient();

  try {
    // Delete all participants in the room first (foreign key constraint)
    await supabase
      .from('participants')
      .delete()
      .eq('room_id', roomId);

    // Delete the room
    await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    console.log(`✓ Cleaned up test room: ${roomId}`);
  } catch (error) {
    console.warn(`Warning: Failed to clean up test room ${roomId}:`, error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Clean up multiple test rooms
 * @param roomIds Array of room IDs to clean up
 */
export async function cleanupTestRooms(roomIds: string[]): Promise<void> {
  await Promise.all(roomIds.map(cleanupTestRoom));
}
