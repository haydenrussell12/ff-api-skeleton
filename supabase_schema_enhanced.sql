-- Enhanced Fantasy Football Database Schema
-- Supports league linking, weekly projections, and AI recommendations

-- ========================================
-- CORE PLAYER DATA
-- ========================================

-- Enhanced players table with more metadata
CREATE TABLE IF NOT EXISTS players (
    player_id BIGSERIAL PRIMARY KEY,
    sleeper_id TEXT UNIQUE, -- Sleeper's unique identifier
    espn_id TEXT UNIQUE,    -- ESPN's unique identifier
    yahoo_id TEXT UNIQUE,   -- Yahoo's unique identifier
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    position TEXT NOT NULL CHECK (position IN ('QB', 'RB', 'WR', 'TE', 'K', 'DST')),
    team_code TEXT,
    age INTEGER,
    experience_years INTEGER,
    college TEXT,
    height TEXT,
    weight INTEGER,
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- LEAGUE MANAGEMENT
-- ========================================

-- Leagues table for linking user leagues
CREATE TABLE IF NOT EXISTS leagues (
    league_id BIGSERIAL PRIMARY KEY,
    sleeper_league_id TEXT UNIQUE,
    espn_league_id TEXT UNIQUE,
    yahoo_league_id TEXT UNIQUE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('sleeper', 'espn', 'yahoo')),
    scoring_type TEXT NOT NULL CHECK (scoring_type IN ('standard', 'ppr', 'half-ppr', 'custom')),
    teams_count INTEGER NOT NULL,
    roster_positions JSONB, -- Flexible roster structure
    scoring_rules JSONB,    -- Custom scoring rules
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League members/owners
CREATE TABLE IF NOT EXISTS league_members (
    member_id BIGSERIAL PRIMARY KEY,
    league_id BIGINT REFERENCES leagues(league_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Your system's user ID
    sleeper_user_id TEXT,
    espn_user_id TEXT,
    yahoo_user_id TEXT,
    display_name TEXT NOT NULL,
    is_commissioner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- League rosters (current team composition)
CREATE TABLE IF NOT EXISTS league_rosters (
    roster_id BIGSERIAL PRIMARY KEY,
    league_id BIGINT REFERENCES leagues(league_id) ON DELETE CASCADE,
    member_id BIGINT REFERENCES league_members(member_id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    roster_position TEXT NOT NULL, -- 'QB', 'RB', 'WR', 'TE', 'K', 'DST', 'BN', 'IR'
    added_date DATE NOT NULL,
    UNIQUE(league_id, member_id, player_id)
);

-- ========================================
-- ENHANCED PROJECTIONS & RANKINGS
-- ========================================

-- Rankings snapshots (existing, but enhanced)
CREATE TABLE IF NOT EXISTS rankings_snapshots (
    snapshot_id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL, -- 'ecr', 'fantasypros', 'espn', 'sleeper'
    format TEXT NOT NULL, -- 'standard', 'ppr', 'half-ppr', 'adp'
    snapshot_date DATE NOT NULL,
    week INTEGER, -- NULL for season-long, 1-18 for weekly
    season INTEGER NOT NULL DEFAULT 2025,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, format, snapshot_date, week)
);

-- Enhanced ranking values with weekly support
CREATE TABLE IF NOT EXISTS ranking_values (
    snapshot_id BIGINT REFERENCES rankings_snapshots(snapshot_id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    rank INTEGER,
    tier INTEGER,
    projection_pts NUMERIC(6,2),
    adp_rank INTEGER, -- Average draft position
    expert_consensus_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (snapshot_id, player_id)
);

-- Weekly projections (NEW - critical for start/sit decisions)
CREATE TABLE IF NOT EXISTS weekly_projections (
    projection_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL CHECK (week >= 1 AND week <= 18),
    source TEXT NOT NULL, -- 'fantasypros', 'espn', 'numberfire'
    projection_pts NUMERIC(6,2),
    confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
    opponent_team TEXT,
    home_away TEXT CHECK (home_away IN ('home', 'away')),
    weather_conditions JSONB, -- Wind, temperature, etc.
    injury_status TEXT,
    snap_count_projection INTEGER,
    target_share_projection NUMERIC(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, season, week, source)
);

-- ========================================
-- PLAYER PERFORMANCE & STATS
-- ========================================

-- Historical player stats (for trend analysis)
CREATE TABLE IF NOT EXISTS player_stats (
    stat_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL CHECK (week >= 1 AND week <= 18),
    opponent_team TEXT,
    home_away TEXT CHECK (home_away IN ('home', 'away')),
    fantasy_pts NUMERIC(6,2),
    passing_yards INTEGER,
    passing_tds INTEGER,
    passing_ints INTEGER,
    rushing_yards INTEGER,
    rushing_tds INTEGER,
    receiving_yards INTEGER,
    receiving_tds INTEGER,
    receptions INTEGER,
    targets INTEGER,
    fumbles_lost INTEGER,
    field_goals_made INTEGER,
    field_goals_attempted INTEGER,
    extra_points_made INTEGER,
    extra_points_attempted INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, season, week)
);

-- ========================================
-- INJURY & STATUS TRACKING
-- ========================================

-- Player injury and status updates
CREATE TABLE IF NOT EXISTS player_status (
    status_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    status_date DATE NOT NULL,
    status_type TEXT NOT NULL CHECK (status_type IN ('active', 'questionable', 'doubtful', 'out', 'ir', 'pup')),
    injury_description TEXT,
    practice_status TEXT CHECK (practice_status IN ('full', 'limited', 'none')),
    game_status TEXT CHECK (game_status IN ('active', 'inactive', 'questionable')),
    source TEXT NOT NULL, -- 'official', 'practice_report', 'news'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- DEPTH CHART & TEAM CHANGES
-- ========================================

-- Team depth chart positions
CREATE TABLE IF NOT EXISTS depth_chart (
    depth_id BIGSERIAL PRIMARY KEY,
    team_code TEXT NOT NULL,
    position TEXT NOT NULL,
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    depth_position INTEGER NOT NULL, -- 1 = starter, 2 = backup, etc.
    season INTEGER NOT NULL,
    week INTEGER NOT NULL CHECK (week >= 1 AND week <= 18),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_code, position, season, week, depth_position)
);

-- ========================================
-- AI RECOMMENDATIONS & INSIGHTS
-- ========================================

-- AI-generated recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    recommendation_id BIGSERIAL PRIMARY KEY,
    league_id BIGINT REFERENCES leagues(league_id) ON DELETE CASCADE,
    member_id BIGINT REFERENCES league_members(member_id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('start', 'sit', 'add', 'drop', 'trade')),
    player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
    priority_score NUMERIC(4,2), -- 0.0 to 10.0
    reasoning TEXT,
    confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
    week INTEGER,
    season INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Core performance indexes
CREATE INDEX IF NOT EXISTS idx_players_sleeper_id ON players(sleeper_id);
CREATE INDEX IF NOT EXISTS idx_players_position_team ON players(position, team_code);
CREATE INDEX IF NOT EXISTS idx_players_name_search ON players USING gin(to_tsvector('english', full_name));

-- League performance indexes
CREATE INDEX IF NOT EXISTS idx_league_rosters_league ON league_rosters(league_id);
CREATE INDEX IF NOT EXISTS idx_league_rosters_member ON league_rosters(member_id);
CREATE INDEX IF NOT EXISTS idx_league_rosters_player ON league_rosters(player_id);

-- Projection performance indexes
CREATE INDEX IF NOT EXISTS idx_weekly_projections_player_week ON weekly_projections(player_id, week, season);
CREATE INDEX IF NOT EXISTS idx_weekly_projections_source_week ON weekly_projections(source, week, season);

-- Stats performance indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_player_week ON player_stats(player_id, week, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_team_week ON player_stats(opponent_team, week, season);

-- Status performance indexes
CREATE INDEX IF NOT EXISTS idx_player_status_player_date ON player_status(player_id, status_date);
CREATE INDEX IF NOT EXISTS idx_player_status_type_date ON player_status(status_type, status_date);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE depth_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Basic policies (customize for production)
CREATE POLICY "Allow all operations" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON leagues FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON league_members FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON league_rosters FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON rankings_snapshots FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ranking_values FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON weekly_projections FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON player_stats FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON player_status FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON depth_chart FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ai_recommendations FOR ALL USING (true);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get player's current status
CREATE OR REPLACE FUNCTION get_player_current_status(p_player_id BIGINT)
RETURNS TABLE(
    status_type TEXT,
    injury_description TEXT,
    practice_status TEXT,
    game_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT ps.status_type, ps.injury_description, ps.practice_status, ps.game_status
    FROM player_status ps
    WHERE ps.player_id = p_player_id
    ORDER BY ps.status_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get player's weekly projection
CREATE OR REPLACE FUNCTION get_player_weekly_projection(p_player_id BIGINT, p_week INTEGER, p_season INTEGER)
RETURNS TABLE(
    projection_pts NUMERIC,
    confidence_level TEXT,
    opponent_team TEXT,
    home_away TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT wp.projection_pts, wp.confidence_level, wp.opponent_team, wp.home_away
    FROM weekly_projections wp
    WHERE wp.player_id = p_player_id 
      AND wp.week = p_week 
      AND wp.season = p_season
    ORDER BY wp.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql; 