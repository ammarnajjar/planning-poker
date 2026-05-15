-- Explicit grants required for Supabase Data API access after May 30 / Oct 30 2026.
-- This app uses only the anon role (no Supabase Auth). Every operation that
-- supabase-js performs goes through the anon role, so it needs full DML access
-- on both tables. RLS policies already restrict what rows can be read/written.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO anon;
