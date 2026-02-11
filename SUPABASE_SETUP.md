# Supabase Setup Guide for Planning Poker

This guide will help you set up Supabase for your Planning Poker application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: planning-poker (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Create Database Tables

Once your project is ready, go to the SQL Editor and run the following SQL:

```sql
-- Create rooms table
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  revealed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create participants table
CREATE TABLE participants (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  vote TEXT,
  lastSeen BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table (allow all operations for now)
CREATE POLICY "Allow all operations on rooms" ON rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for participants table (allow all operations for now)
CREATE POLICY "Allow all operations on participants" ON participants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Create indexes for better query performance
CREATE INDEX idx_participants_room_id ON participants(room_id);
CREATE INDEX idx_participants_lastseen ON participants(lastSeen);

-- Create a function to automatically clean up old participants (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_participants()
RETURNS void AS $$
BEGIN
  DELETE FROM participants
  WHERE lastSeen < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000);
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule automatic cleanup (requires pg_cron extension)
-- Uncomment if you want automatic cleanup:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-old-participants', '*/15 * * * *', 'SELECT cleanup_old_participants();');
```

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Find the following values:
   - **Project URL**: This is your `supabaseUrl`
   - **anon public**: This is your `supabaseAnonKey`

## Step 4: Configure Environment Files

1. Open `src/environments/environment.ts` and replace the placeholders:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL', // Replace with your Project URL
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon public key
};
```

2. Open `src/environments/environment.prod.ts` and do the same:

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'YOUR_SUPABASE_URL', // Replace with your Project URL
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon public key
};
```

**Important**: These files are in `.gitignore` to prevent accidentally committing your API keys to version control.

## Step 5: Test Locally

1. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open http://localhost:4200 in your browser
4. Create a room and test the functionality
5. Open the same room in a different browser or incognito window to test cross-browser sync

## Step 6: Deploy to GitHub Pages

1. Build the production version:
   ```bash
   npm run build:prod
   ```

2. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Migrate to Supabase for real-time sync"
   git push
   ```

3. Your GitHub Actions workflow will automatically deploy the app

## Optional: Keep Your Supabase Project Active

Supabase free tier projects pause after 7 days of inactivity. To prevent this, you can:

### Option 1: Use GitHub Actions to Ping Weekly

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Supabase Active

on:
  schedule:
    # Run every Monday at 9 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET "YOUR_SUPABASE_URL/rest/v1/rooms?limit=1" \
            -H "apikey: YOUR_SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

### Option 2: Upgrade to Supabase Pro

If your team uses the app regularly and you want guaranteed uptime, consider upgrading to Supabase Pro ($25/month).

## Troubleshooting

### Issue: "Failed to fetch" or connection errors

**Solution**:
- Check that your API keys are correct
- Verify the tables exist in your Supabase project
- Check the browser console for specific error messages

### Issue: Data not syncing across browsers

**Solution**:
- Verify Realtime is enabled for both tables (check Step 2)
- Open the Supabase dashboard and go to Database > Replication
- Make sure `rooms` and `participants` are in the publication

### Issue: Participants not cleaning up

**Solution**:
- The cleanup happens client-side every 3 seconds
- For server-side cleanup, uncomment the pg_cron lines in Step 2
- Or manually run: `SELECT cleanup_old_participants();` in SQL Editor

## Database Schema Reference

### `rooms` table
- `id` (TEXT, PRIMARY KEY): Room identifier
- `revealed` (BOOLEAN): Whether votes are revealed
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

### `participants` table
- `room_id` (TEXT, PRIMARY KEY): Room identifier
- `user_id` (TEXT, PRIMARY KEY): Unique user identifier
- `name` (TEXT): User's display name
- `vote` (TEXT): User's vote (nullable)
- `lastSeen` (BIGINT): Unix timestamp in milliseconds
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

## Benefits of Supabase Migration

✅ **Reliable cross-browser sync** - No dependency on unreliable public relay servers
✅ **Better performance** - Real-time subscriptions with PostgreSQL backing
✅ **Scalable** - Handles many concurrent users
✅ **Free tier** - Generous limits for small teams
✅ **Data persistence** - PostgreSQL database with proper backups
✅ **Security** - Row Level Security policies

## Support

If you encounter issues:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the browser console for errors
3. Check your Supabase project logs in the dashboard
