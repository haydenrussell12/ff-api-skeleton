-- Create VORP scores table for storing player Value Over Replacement Player calculations
CREATE TABLE IF NOT EXISTS player_vorp_scores (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,
    player_name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    team VARCHAR(10),
    projected_points DECIMAL(8,2) NOT NULL,
    median_points DECIMAL(8,2) NOT NULL,
    vorp_score DECIMAL(8,2) NOT NULL,
    season VARCHAR(4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vorp_player_id ON player_vorp_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_vorp_position ON player_vorp_scores(position);
CREATE INDEX IF NOT EXISTS idx_vorp_season ON player_vorp_scores(season);
CREATE INDEX IF NOT EXISTS idx_vorp_score ON player_vorp_scores(vorp_score DESC);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_vorp_unique_player_season 
ON player_vorp_scores(player_id, season);

-- Add comments for documentation
COMMENT ON TABLE player_vorp_scores IS 'Player VORP (Value Over Replacement Player) scores calculated using median projections as replacement level';
COMMENT ON COLUMN player_vorp_scores.vorp_score IS 'VORP score: projected_points - median_points (positive = above replacement, negative = below replacement)';
COMMENT ON COLUMN player_vorp_scores.median_points IS 'Median projected points for the player''s position group (replacement level)';

-- Create a view for easy access to top VORP players by position
CREATE OR REPLACE VIEW top_vorp_players AS
SELECT 
    position,
    player_name,
    team,
    vorp_score,
    projected_points,
    median_points,
    ROW_NUMBER() OVER (PARTITION BY position ORDER BY vorp_score DESC) as position_rank
FROM player_vorp_scores 
WHERE season = '2025'
ORDER BY position, vorp_score DESC;

-- Create a view for overall top VORP players
CREATE OR REPLACE VIEW overall_top_vorp AS
SELECT 
    player_name,
    position,
    team,
    vorp_score,
    projected_points,
    median_points,
    ROW_NUMBER() OVER (ORDER BY vorp_score DESC) as overall_rank
FROM player_vorp_scores 
WHERE season = '2025'
ORDER BY vorp_score DESC; 