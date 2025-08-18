-- Enhanced Fantasy Football Database Schema
-- Run this in Supabase SQL Editor
-- This will add new tables for league linking and AI features
-- WITHOUT affecting existing draft analyzer functionality

-- Step 1: Enhance existing players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS sleeper_id TEXT,
ADD COLUMN IF NOT EXISTS espn_id TEXT,
ADD COLUMN IF NOT EXISTS yahoo_id TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS college TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight INTEGER,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Create new tables for league linking
CREATE TABLE IF NOT EXISTS leagues (
  league_id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('sleeper', 'espn', 'yahoo')),
  league_id_external TEXT,
  scoring_rules JSONB,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS league_members (
  member_id BIGSERIAL PRIMARY KEY,
  league_id BIGINT REFERENCES leagues(league_id) ON DELETE CASCADE,
  user_id_external TEXT NOT NULL,
  team_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id_external)
);

CREATE TABLE IF NOT EXISTS league_rosters (
  roster_id BIGSERIAL PRIMARY KEY,
  league_id BIGINT REFERENCES leagues(league_id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES league_members(member_id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
  roster_position TEXT,
  is_starter BOOLEAN DEFAULT false,
  week INTEGER,
  season INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, member_id, player_id, week, season)
);

-- Step 3: Create tables for weekly data and AI features
CREATE TABLE IF NOT EXISTS weekly_projections (
  projection_id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  source TEXT NOT NULL,
  projection_pts DECIMAL(6,2),
  projection_rush_yds INTEGER,
  projection_rush_td INTEGER,
  projection_pass_yds INTEGER,
  projection_pass_td INTEGER,
  projection_int INTEGER,
  projection_rec_yds INTEGER,
  projection_rec_td INTEGER,
  projection_rec INTEGER,
  confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, week, season, source)
);

CREATE TABLE IF NOT EXISTS player_stats (
  stat_id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  opponent_team TEXT,
  is_home BOOLEAN,
  actual_pts DECIMAL(6,2),
  rush_attempts INTEGER,
  rush_yds INTEGER,
  rush_td INTEGER,
  pass_attempts INTEGER,
  pass_completions INTEGER,
  pass_yds INTEGER,
  pass_td INTEGER,
  interceptions INTEGER,
  receptions INTEGER,
  rec_yds INTEGER,
  rec_td INTEGER,
  fumbles INTEGER,
  fumbles_lost INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, week, season)
);

CREATE TABLE IF NOT EXISTS player_status (
  status_id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
  status_type TEXT NOT NULL CHECK (status_type IN ('active', 'questionable', 'doubtful', 'out', 'ir', 'suspended')),
  status_details TEXT,
  status_date DATE NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS depth_chart (
  depth_id BIGSERIAL PRIMARY KEY,
  team_code TEXT NOT NULL,
  position TEXT NOT NULL,
  player_id UUID REFERENCES players(player_id) ON DELETE CASCADE,
  depth_position INTEGER NOT NULL,
  week INTEGER,
  season INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_code, position, depth_position, week, season)
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
  recommendation_id BIGSERIAL PRIMARY KEY,
  league_id BIGINT REFERENCES leagues(league_id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES league_members(member_id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('waiver_wire', 'start_sit', 'trade', 'roster_optimization')),
  priority_level INTEGER CHECK (priority_level >= 1 AND priority_level <= 5),
  reasoning TEXT,
  suggested_actions JSONB,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_players_sleeper_id ON players(sleeper_id);
CREATE INDEX IF NOT EXISTS idx_players_position_team ON players(position, team_code);
CREATE INDEX IF NOT EXISTS idx_league_rosters_league ON league_rosters(league_id);
CREATE INDEX IF NOT EXISTS idx_league_rosters_member ON league_rosters(member_id);
CREATE INDEX IF NOT EXISTS idx_weekly_projections_player_week ON weekly_projections(player_id, week, season);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_week ON player_stats(player_id, week, season);
CREATE INDEX IF NOT EXISTS idx_player_status_player_date ON player_status(player_id, status_date);

-- Step 5: Verify migration
SELECT 'Migration completed successfully!' as status; 