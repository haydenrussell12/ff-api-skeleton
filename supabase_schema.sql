-- Fantasy Football Rankings Database Schema
-- Run this in your Supabase SQL editor to create the required tables

-- Players table to store player information
CREATE TABLE IF NOT EXISTS players (
    player_id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    team_code TEXT,
    sleeper_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADP (Average Draft Position) table to store current draft rankings
CREATE TABLE IF NOT EXISTS adp_data (
    adp_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    adp_rank INTEGER NOT NULL,
    adp_position INTEGER, -- Draft round and pick (e.g., 1.05 = round 1, pick 5)
    draft_round INTEGER,
    draft_pick INTEGER,
    source TEXT DEFAULT 'sleeper', -- Source of ADP data
    format TEXT DEFAULT 'standard', -- Scoring format
    league_size INTEGER DEFAULT 12, -- League size for ADP context
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, source, format, league_size, snapshot_date)
);

-- Rankings snapshots table to store different ranking sources and dates
CREATE TABLE IF NOT EXISTS rankings_snapshots (
    snapshot_id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL, -- e.g., 'ecr', 'fantasypros', 'espn'
    format TEXT NOT NULL, -- e.g., 'standard', 'ppr', 'half-ppr'
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, format, snapshot_date)
);

-- Ranking values table to store actual rankings and projections
CREATE TABLE IF NOT EXISTS ranking_values (
    snapshot_id BIGINT REFERENCES rankings_snapshots(snapshot_id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    rank INTEGER,
    tier INTEGER,
    projection_pts NUMERIC(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (snapshot_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_name ON players(full_name);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_code);
CREATE INDEX IF NOT EXISTS idx_players_sleeper_id ON players(sleeper_id);
CREATE INDEX IF NOT EXISTS idx_adp_rank ON adp_data(adp_rank);
CREATE INDEX IF NOT EXISTS idx_adp_position ON adp_data(adp_position);
CREATE INDEX IF NOT EXISTS idx_adp_source_format ON adp_data(source, format);
CREATE INDEX IF NOT EXISTS idx_adp_date ON adp_data(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_rankings_source_format ON rankings_snapshots(source, format);
CREATE INDEX IF NOT EXISTS idx_rankings_date ON rankings_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_ranking_values_rank ON ranking_values(rank);
CREATE INDEX IF NOT EXISTS idx_ranking_values_tier ON ranking_values(tier);

-- Enable Row Level Security (RLS) - you can customize this based on your needs
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE adp_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_values ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development - customize for production)
CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON adp_data FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON rankings_snapshots FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ranking_values FOR ALL USING (true); 