# Setup Guide

---

## Prerequisites

- Node.js 18+ and npm
- Angular CLI 21+
- A free [Supabase](https://supabase.com) account

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Set up Supabase

### 2a. Create a project

1. Sign in at https://supabase.com and create a new project.
2. Choose a region close to your users.

### 2b. Run the schema SQL

In your Supabase project go to **SQL Editor** and execute:

```sql
-- Tables
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  revealed BOOLEAN DEFAULT false,
  voting_started BOOLEAN DEFAULT false,
  admin_user_id TEXT,
  admin_pin TEXT,
  admin_participates BOOLEAN DEFAULT false,
  discussion_active BOOLEAN DEFAULT false,
  discussion_min_voter TEXT,
  discussion_max_voter TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE participants (
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  vote TEXT,
  last_seen BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- Row Level Security (policies are wide-open — tighten if needed)
ALTER TABLE rooms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on rooms"        ON rooms        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on participants" ON participants FOR ALL USING (true) WITH CHECK (true);

-- Explicit grants required for the Supabase Data API (PostgREST / supabase-js).
-- From May 30 2026 (new projects) / Oct 30 2026 (existing projects) Supabase no
-- longer grants public-schema access to roles by default. This app uses only the
-- anon role (no Supabase Auth), so anon needs full DML on both tables.
-- RLS policies above still control which rows are accessible.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO anon;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;

-- Indexes
CREATE INDEX idx_participants_room_id  ON participants(room_id);
CREATE INDEX idx_participants_last_seen ON participants(last_seen);

-- Optional: server-side cleanup of participants inactive > 1 hour
CREATE OR REPLACE FUNCTION cleanup_old_participants()
RETURNS void AS $$
BEGIN
  DELETE FROM participants
  WHERE last_seen < (EXTRACT(EPOCH FROM NOW()) * 1000 - 3600000);
END;
$$ LANGUAGE plpgsql;

-- Uncomment to schedule cleanup every 15 minutes via pg_cron:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-old-participants', '*/15 * * * *', 'SELECT cleanup_old_participants();');
```

### 2c. Get your API keys

Go to **Settings → API** in your Supabase dashboard and copy:
- **Project URL** → `supabaseUrl`
- **anon / public** key → `supabaseAnonKey`

### 2d. Configure environment files

```bash
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.template.ts src/environments/environment.prod.ts
```

Fill in your credentials in both files:

```typescript
export const environment = {
  production: false,   // true in environment.prod.ts
  version,
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'your-anon-key'
};
```

These files are git-ignored and should never be committed.

---

## 3. Run the development server

```bash
npm start
```

Open http://localhost:4200.

To test real-time sync, open the same room in two browser windows.

---

## 4. Run tests

```bash
# Unit tests (Vitest)
npm test
npm run test:coverage    # with coverage report (80% threshold enforced)
npm run test:ui          # interactive Vitest UI

# E2E tests (Playwright) — auto-starts dev server
npx playwright install   # first time only
npm run test:e2e
npm run test:e2e:smoke   # critical path only (fast)
npm run test:e2e:headed  # visible browser
npm run test:e2e:debug   # step-by-step
```

---

## 5. Build for production

```bash
npm run build:prod
```

Artifacts are placed in `dist/planning-poker/browser/`.

---

## Updating from an earlier version

If you have an existing database, run these migrations in your Supabase SQL Editor:

```sql
-- Add voting_started (if missing)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS voting_started BOOLEAN DEFAULT false;

-- Add admin_pin
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_pin TEXT;

-- Add admin_participates
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS admin_participates BOOLEAN DEFAULT false;

-- Add discussion mode columns (v1.1.0+)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS discussion_active BOOLEAN DEFAULT false;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS discussion_min_voter TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS discussion_max_voter TEXT;

-- Explicit anon grants — required before Oct 30 2026 (Supabase policy change).
-- Without these the Data API returns a 42501 error on all table operations.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO anon;
```

---

## Keeping a free-tier Supabase project alive

Free-tier projects pause after 7 days of inactivity. To prevent this, add a weekly ping workflow:

```yaml
# .github/workflows/keep-alive.yml
name: Keep Supabase Active
on:
  schedule:
    - cron: '0 9 * * 1'   # every Monday 09:00 UTC
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET "${{ secrets.SUPABASE_URL }}/rest/v1/rooms?limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Failed to fetch" / connection errors | Verify API keys; check browser console |
| Data not syncing across browsers | Verify Realtime is enabled for both tables (Database → Replication) |
| Participants not cleaning up | The cleanup is client-side; run `SELECT cleanup_old_participants();` manually if needed |
| Build errors after `npm install` | `rm -rf node_modules package-lock.json .angular/cache && npm install` |
| Deployment 404 on GitHub Pages | Check `--base-href` in `package.json` matches your repo name exactly |
| Supabase project paused | Upgrade to Pro or set up the keep-alive workflow above |
