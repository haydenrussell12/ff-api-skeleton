# VORP (Value Over Replacement Player) System

## Overview

The VORP system calculates **Value Over Replacement Player** scores for fantasy football players using median projections as the replacement level for each position group. This provides a data-driven approach to player valuation that automatically adjusts to the quality of each position group in a given year.

## What is VORP?

**VORP = Player Projected Points - Position Median**

- **Positive VORP**: Player is above replacement level (better than median)
- **Negative VORP**: Player is below replacement level (worse than median)
- **Higher positive VORP**: More valuable relative to position

## Key Features

### 🎯 **Fantasy-Relevant Replacement Level**
Instead of using all players (including those who won't make rosters), we use **fantasy-relevant player pools** to establish meaningful replacement levels:

- **QB**: Top 32 players (starter + some backups)
- **RB**: Top 70 players (RB2 + benches)  
- **WR**: Top 80 players (WR2 + benches)
- **TE**: Top 24 players (starter + some backups)
- **K**: Top 32 players (starter + some backups)
- **DEF**: Top 32 players (starter + some backups)

### 📊 **Data-Driven Approach**
- Automatically adjusts to position group quality each year
- More accurate than fixed replacement levels
- Reflects actual talent distribution among fantasy-relevant players
- Prevents skewing from deep bench players who won't contribute

### 🔄 **Flexible Integration**
- Works with existing consolidated data structure
- Can be easily extended for weekly projections
- Supports multiple scoring formats

## Usage

### 1. Calculate VORP Scores

```bash
npm run calculate-vorp
```

This will:
- Load consolidated player data
- Calculate position medians
- Generate VORP scores for all players
- Save results to `data/consolidated/player-vorp-scores.json`
- Create summary in `data/consolidated/vorp-summary.json`

### 2. Test VORP Calculation

```bash
npm run test-vorp
```

Runs VORP calculation with sample data to verify functionality.

### 3. Upload to Supabase

```bash
npm run upload-vorp
```

Uploads calculated VORP scores to Supabase database.

## Data Structure

### Input: Consolidated Player Data
```json
{
  "players": [
    {
      "player_id": "jamarr chase",
      "full_name": "Ja'Marr Chase", 
      "team": "CIN",
      "position": "WR1",
      "projections": {
        "wr": {
          "fpts": "231.2",
          "rec": "95",
          "yds": "1250"
        }
      }
    }
  ]
}
```

### Output: VORP Scores
```json
{
  "playerId": "jamarr chase",
  "playerName": "Ja'Marr Chase",
  "position": "WR",
  "team": "CIN", 
  "projectedPoints": 231.2,
  "medianPoints": 41.85,
  "vorpScore": 189.35,
  "season": "2025"
}
```

## Position Medians (2025 Example)

| Position | Median | Players |
|----------|--------|---------|
| QB       | 31.90  | 82      |
| RB       | 38.00  | 149     |
| WR       | 41.85  | 216     |
| TE       | 18.90  | 118     |
| K        | 124.60 | 33      |

## Top VORP Players (2025)

### 🏆 Overall Top 10
1. **Jayden Daniels (QB, WAS)** - VORP: 323.90
2. **Josh Allen (QB, BUF)** - VORP: 318.30
3. **Joe Burrow (QB, CIN)** - VORP: 309.70
4. **Lamar Jackson (QB, BAL)** - VORP: 308.90
5. **Jalen Hurts (QB, PHI)** - VORP: 298.20

### 📊 By Position
- **QB**: Jayden Daniels (323.90)
- **RB**: Saquon Barkley (235.10)
- **WR**: Ja'Marr Chase (189.35)
- **TE**: Brock Bowers (130.80)
- **K**: Brandon Aubrey (17.00)

## Supabase Integration

### Table Schema
```sql
CREATE TABLE player_vorp_scores (
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
```

### Views
- **`top_vorp_players`**: Top VORP players by position
- **`