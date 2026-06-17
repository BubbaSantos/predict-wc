-- Tournament-wide top scorers, populated by sync.js from football-data.org.
-- Run once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS tournament_scorers (
  rank        int PRIMARY KEY,
  player_id   bigint,
  player_name text NOT NULL,
  team_id     bigint,
  team_name   text,
  goals       int DEFAULT 0,
  assists     int,
  penalties   int,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE tournament_scorers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read scorers"  ON tournament_scorers;
DROP POLICY IF EXISTS "write scorers" ON tournament_scorers;

CREATE POLICY "read scorers"  ON tournament_scorers FOR SELECT USING (true);
CREATE POLICY "write scorers" ON tournament_scorers FOR ALL    USING (true) WITH CHECK (true);
