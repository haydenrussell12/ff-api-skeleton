# 🚀 Quick Reference: Common Queries & API Calls

## 📊 **Essential Queries for Data Engineers**

### **1. Get Current ADP Rankings**
```sql
-- Top 50 players by ADP
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as adp_rank,
    p.sleeper_id
FROM players p
WHERE p.search_rank IS NOT NULL
  AND p.position IN ('QB', 'RB', 'WR', 'TE')
ORDER BY p.search_rank
LIMIT 50;
```

### **2. Find Specific ADP Position**
```sql
-- Who is ADP15?
SELECT 
    full_name,
    position,
    team_code,
    search_rank as adp_rank
FROM players 
WHERE search_rank = 15
  AND position IN ('QB', 'RB', 'WR', 'TE');
```

### **3. Compare Rankings vs ADP**
```sql
-- Players with biggest ranking differences
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as adp_rank,
    rv.rank as projection_rank,
    rv.projection_pts,
    (rv.rank - p.search_rank) as rank_difference,
    rs.source,
    rs.format
FROM players p
JOIN ranking_values rv ON p.player_id = rv.player_id
JOIN rankings_snapshots rs ON rv.snapshot_id = rs.snapshot_id
WHERE rs.source = 'fantasypros'
  AND rs.format = 'standard'
  AND p.search_rank IS NOT NULL
ORDER BY ABS(rv.rank - p.search_rank) DESC
LIMIT 20;
```

### **4. Position Breakdown Analysis**
```sql
-- How many players per position have ADP data?
SELECT 
    position,
    COUNT(*) as total_players,
    COUNT(search_rank) as adp_players,
    COUNT(CASE WHEN search_rank <= 50 THEN 1 END) as top_50,
    COUNT(CASE WHEN search_rank <= 100 THEN 1 END) as top_100,
    ROUND(
        COUNT(search_rank) * 100.0 / COUNT(*), 2
    ) as adp_coverage_percent
FROM players
WHERE position IN ('QB', 'RB', 'WR', 'TE')
GROUP BY position
ORDER BY position;
```

### **5. Data Source Coverage**
```sql
-- What data sources do we have for each player?
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as sleeper_adp,
    COUNT(DISTINCT rs.source) as sources_count,
    STRING_AGG(DISTINCT rs.source, ', ') as sources
FROM players p
LEFT JOIN ranking_values rv ON p.player_id = rv.player_id
LEFT JOIN rankings_snapshots rs ON rv.snapshot_id = rs.snapshot_id
WHERE p.search_rank IS NOT NULL
  AND p.search_rank <= 100
GROUP BY p.player_id, p.full_name, p.position, p.team_code, p.search_rank
ORDER BY p.search_rank;
```

### **6. Historical Data Analysis**
```sql
-- How has a player's ranking changed over time?
SELECT 
    p.full_name,
    p.position,
    rs.snapshot_date,
    rs.source,
    rs.format,
    rv.rank,
    rv.tier,
    rv.projection_pts
FROM players p
JOIN ranking_values rv ON p.player_id = rv.player_id
JOIN rankings_snapshots rs ON rv.snapshot_id = rs.snapshot_id
WHERE p.full_name ILIKE '%McCaffrey%'
  AND rs.source = 'fantasypros'
ORDER BY rs.snapshot_date DESC, rs.source;
```

### **7. Team Analysis**
```sql
-- Which teams have the most fantasy-relevant players?
SELECT 
    p.team_code,
    COUNT(*) as total_players,
    COUNT(p.search_rank) as adp_players,
    COUNT(CASE WHEN p.search_rank <= 50 THEN 1 END) as top_50,
    COUNT(CASE WHEN p.search_rank <= 100 THEN 1 END) as top_100,
    ROUND(AVG(p.search_rank), 1) as avg_adp_rank
FROM players p
WHERE p.position IN ('QB', 'RB', 'WR', 'TE')
  AND p.team_code IS NOT NULL
GROUP BY p.team_code
HAVING COUNT(p.search_rank) > 0
ORDER BY COUNT(p.search_rank) DESC;
```

### **8. Data Quality Check**
```sql
-- Find players with missing or inconsistent data
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as sleeper_adp,
    CASE 
        WHEN p.search_rank IS NULL THEN 'No ADP'
        WHEN p.search_rank > 1000 THEN 'Very Low ADP'
        ELSE 'Valid ADP'
    END as adp_status,
    COUNT(rv.snapshot_id) as projections_count
FROM players p
LEFT JOIN ranking_values rv ON p.player_id = rv.player_id
WHERE p.position IN ('QB', 'RB', 'WR', 'TE')
GROUP BY p.player_id, p.full_name, p.position, p.team_code, p.search_rank
HAVING COUNT(rv.snapshot_id) = 0
ORDER BY p.search_rank NULLS LAST
LIMIT 20;
```

## 🔌 **API Endpoints Quick Reference**

### **Core Data Endpoints**
```bash
# Get top 50 players by ranking
GET /api/rankings?source=fantasypros&format=standard&limit=50

# Get all RBs from a specific team
GET /api/players?position=RB&team=SF&limit=100

# Get available data snapshots
GET /api/snapshots

# Health check
GET /health
```

### **Draft Analysis Endpoint**
```bash
POST /api/analyze-draft
Content-Type: application/json

{
  "draftUrl": "https://sleeper.com/draft/nfl/1234567890",
  "source": "fantasypros",
  "format": "standard",
  "evaluationMode": "adp"
}
```

## 📈 **Performance Monitoring Queries**

### **Database Performance**
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename IN ('players', 'ranking_values', 'rankings_snapshots')
ORDER BY tablename, attname;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('players', 'ranking_values', 'rankings_snapshots')
ORDER BY idx_scan DESC;
```

### **Data Freshness Check**
```sql
-- When was data last updated?
SELECT 
    'players' as table_name,
    MAX(updated_at) as last_updated,
    NOW() - MAX(updated_at) as age
FROM players
UNION ALL
SELECT 
    'rankings_snapshots' as table_name,
    MAX(created_at) as last_updated,
    NOW() - MAX(created_at) as age
FROM rankings_snapshots
UNION ALL
SELECT 
    'ranking_values' as table_name,
    MAX(created_at) as last_updated,
    NOW() - MAX(created_at) as age
FROM ranking_values;
```

## 🎯 **Common Use Cases**

### **Use Case 1: Draft Preparation**
```sql
-- Get top 100 players with projections
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as adp_rank,
    rv.rank as expert_rank,
    rv.projection_pts,
    rv.tier
FROM players p
LEFT JOIN ranking_values rv ON p.player_id = rv.player_id
LEFT JOIN rankings_snapshots rs ON rv.snapshot_id = rs.snapshot_id
WHERE p.search_rank <= 100
  AND (rs.source = 'fantasypros' OR rs.source IS NULL)
  AND (rs.format = 'standard' OR rs.format IS NULL)
ORDER BY p.search_rank;
```

### **Use Case 2: Value Analysis**
```sql
-- Find players ranked much lower than their ADP
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as adp_rank,
    rv.rank as expert_rank,
    (p.search_rank - rv.rank) as value_difference
FROM players p
JOIN ranking_values rv ON p.player_id = rv.player_id
JOIN rankings_snapshots rs ON rv.snapshot_id = rs.snapshot_id
WHERE rs.source = 'fantasypros'
  AND rs.format = 'standard'
  AND p.search_rank IS NOT NULL
  AND (p.search_rank - rv.rank) >= 20  -- 20+ spots difference
ORDER BY (p.search_rank - rv.rank) DESC;
```

### **Use Case 3: Position Scarcity**
```sql
-- Analyze position depth
SELECT 
    position,
    COUNT(*) as total_players,
    COUNT(CASE WHEN search_rank <= 50 THEN 1 END) as top_50,
    COUNT(CASE WHEN search_rank <= 100 THEN 1 END) as top_100,
    ROUND(
        COUNT(CASE WHEN search_rank <= 100 THEN 1 END) * 100.0 / 
        COUNT(*), 2
    ) as top_100_percentage
FROM players
WHERE position IN ('QB', 'RB', 'WR', 'TE')
GROUP BY position
ORDER BY 
    COUNT(CASE WHEN search_rank <= 100 THEN 1 END) DESC;
```

## 🚨 **Troubleshooting Queries**

### **Find Data Inconsistencies**
```sql
-- Players with multiple rankings from same source
SELECT 
    p.full_name,
    p.position,
    rs.source,
    rs.format,
    COUNT(*) as ranking_count,
    MIN(rv.rank) as min_rank,
    MAX(rv.rank) as max_rank
FROM players p
JOIN ranking_values rv ON p.player_id = rv.player_id
JOIN rankings_snapshots rs ON rv.snapshot_id = rs.snapshot_id
GROUP BY p.player_id, p.full_name, p.position, rs.source, rs.format
HAVING COUNT(*) > 1
ORDER BY ranking_count DESC;
```

### **Check for Missing Data**
```sql
-- Players in top 100 ADP but no projections
SELECT 
    p.full_name,
    p.position,
    p.team_code,
    p.search_rank as adp_rank
FROM players p
LEFT JOIN ranking_values rv ON p.player_id = rv.player_id
WHERE p.search_rank <= 100
  AND p.position IN ('QB', 'RB', 'WR', 'TE')
  AND rv.snapshot_id IS NULL
ORDER BY p.search_rank;
```

This quick reference covers the most common queries and use cases. For more complex analysis, refer to the main documentation. 