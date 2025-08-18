-- Create Historical Player Stats table
CREATE TABLE IF NOT EXISTS historical_player_stats (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  player_id VARCHAR(20),
  player_name VARCHAR(100) NOT NULL,
  team VARCHAR(10),
  position VARCHAR(10),
  age INTEGER,
  games_played INTEGER,
  games_started INTEGER,
  passing_attempts INTEGER,
  passing_yards INTEGER,
  passing_tds INTEGER,
  passing_ints INTEGER,
  rushing_attempts INTEGER,
  rushing_yards INTEGER,
  rushing_yards_per_attempt DECIMAL(4,2),
  rushing_tds INTEGER,
  receiving_targets INTEGER,
  receptions INTEGER,
  receiving_yards INTEGER,
  receiving_yards_per_reception DECIMAL(4,2),
  receiving_tds INTEGER,
  fumbles INTEGER,
  fumbles_lost INTEGER,
  total_tds INTEGER,
  two_point_conversions INTEGER,
  fantasy_points_standard DECIMAL(6,2),
  fantasy_points_ppr DECIMAL(6,2),
  fantasy_points_draftkings DECIMAL(6,2),
  fantasy_points_fanduel DECIMAL(6,2),
  vbd DECIMAL(6,2),
  position_rank INTEGER,
  overall_rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Historical ADP table
CREATE TABLE IF NOT EXISTS historical_adp_data (
  id SERIAL PRIMARY KEY,
  season INTEGER NOT NULL,
  format VARCHAR(20) NOT NULL, -- 'ppr' or 'standard'
  rank INTEGER NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  team VARCHAR(10),
  bye_week INTEGER,
  position VARCHAR(10),
  espn_adp DECIMAL(4,1),
  sleeper_adp DECIMAL(4,1),
  nfl_adp DECIMAL(4,1),
  rtsports_adp DECIMAL(4,1),
  ffc_adp DECIMAL(4,1),
  fantrax_adp DECIMAL(4,1),
  cbs_adp DECIMAL(4,1),
  average_adp DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create 2025 Current Season ADP table
CREATE TABLE IF NOT EXISTS current_season_adp (
  id SERIAL PRIMARY KEY,
  format VARCHAR(20) NOT NULL, -- 'ppr' or 'standard'
  rank INTEGER NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  team VARCHAR(10),
  bye_week INTEGER,
  position VARCHAR(10),
  espn_adp DECIMAL(4,1),
  sleeper_adp DECIMAL(4,1),
  nfl_adp DECIMAL(4,1),
  rtsports_adp DECIMAL(4,1),
  ffc_adp DECIMAL(4,1),
  fantrax_adp DECIMAL(4,1),
  cbs_adp DECIMAL(4,1),
  average_adp DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_historical_stats_season ON historical_player_stats(season);
CREATE INDEX IF NOT EXISTS idx_historical_stats_player ON historical_player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_historical_stats_position ON historical_player_stats(position);
CREATE INDEX IF NOT EXISTS idx_historical_adp_season ON historical_adp_data(season);
CREATE INDEX IF NOT EXISTS idx_historical_adp_format ON historical_adp_data(format);
CREATE INDEX IF NOT EXISTS idx_historical_adp_player ON historical_adp_data(player_name);
CREATE INDEX IF NOT EXISTS idx_current_adp_format ON current_season_adp(format);
CREATE INDEX IF NOT EXISTS idx_current_adp_player ON current_season_adp(player_name); 