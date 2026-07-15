-- SPFL league — fully separate data domain from the World Cup tables
-- (groups/players/predictions/results/tiebreaks). Nothing here is read or
-- written by any World Cup code path; the reverse is also true.
-- Run once in the Supabase SQL editor.

-- Per-player SPFL access gate + running coin balance + free-powerup flag.
ALTER TABLE players ADD COLUMN IF NOT EXISTS spfl_approved boolean DEFAULT false;

-- Drop first in case an earlier run of this script created them with the
-- wrong group_id/player_id type (bigint) before groups.id/players.id were
-- confirmed to be uuid — safe since no real data has been saved yet.
DROP TABLE IF EXISTS spfl_predictions;
DROP TABLE IF EXISTS spfl_results;
DROP TABLE IF EXISTS spfl_player_state;

-- group_id/player_id are uuid to match groups.id/players.id in this project.
CREATE TABLE IF NOT EXISTS spfl_predictions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id    uuid NOT NULL,
  player_id   uuid NOT NULL,
  match_id    text NOT NULL,
  home_score  int,
  away_score  int,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(group_id, player_id, match_id)
);

CREATE TABLE IF NOT EXISTS spfl_results (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id    uuid NOT NULL,
  match_id    text NOT NULL,
  home_score  int,
  away_score  int,
  full_time   boolean DEFAULT false,
  breakdown_weekend boolean DEFAULT false, -- true if this weekend's round had "The Breakdown" scoring active for the group at settle time (informational)
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(group_id, match_id)
);

-- One row per player: coin balance + ledger of powerup usage + immunity state.
-- powerups_used / immune_until are jsonb so new powerup types don't need new columns.
CREATE TABLE IF NOT EXISTS spfl_player_state (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id         uuid NOT NULL,
  player_id        uuid NOT NULL,
  coins            int DEFAULT 0,
  free_double_used boolean DEFAULT false, -- everyone starts with one free Double Points, weekend 1 only
  powerups         jsonb DEFAULT '[]'::jsonb, -- [{type, weekend, match_id?, target_player_id?, coin_cost, applied_at}]
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(group_id, player_id)
);

ALTER TABLE spfl_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spfl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE spfl_player_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spfl predictions rw" ON spfl_predictions;
DROP POLICY IF EXISTS "spfl results rw" ON spfl_results;
DROP POLICY IF EXISTS "spfl player_state rw" ON spfl_player_state;

CREATE POLICY "spfl predictions rw" ON spfl_predictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "spfl results rw" ON spfl_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "spfl player_state rw" ON spfl_player_state FOR ALL USING (true) WITH CHECK (true);

-- SPFL-only branding overrides (group name/tagline/emoji/accent) so admins
-- can set different branding per league without touching the World Cup
-- side's flat groups.name/tagline/emoji/accent columns. Empty until an
-- admin explicitly saves branding while viewing SPFL — the app falls back
-- to the WC values in the meantime (see getLeagueBranding() in index.html).
ALTER TABLE groups ADD COLUMN IF NOT EXISTS settings_spfl jsonb DEFAULT '{}'::jsonb;
