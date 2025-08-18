# 🏈 Data Migration Strategy: Current → Enhanced Schema

## 🎯 **Migration Overview**

We need to upgrade from the current basic schema to the enhanced one that supports:
- ✅ League linking
- ✅ Weekly projections  
- ✅ Player stats & history
- ✅ Injury tracking
- ✅ AI recommendations

## 📊 **Current vs. Enhanced Schema Comparison**

### **Current Schema (Basic)**
```sql
players (player_id, full_name, position, team_code)
rankings_snapshots (snapshot_id, source, format, snapshot_date)
ranking_values (snapshot_id, player_id, rank, tier, projection_pts)
```

### **Enhanced Schema (Advanced)**
```sql
players (enhanced with sleeper_id, age, experience, etc.)
leagues (league management)
league_members (team owners)
league_rosters (current rosters)
weekly_projections (weekly projections)
player_stats (historical performance)
player_status (injury tracking)
depth_chart (team depth)
ai_recommendations (AI insights)
```

## 🚀 **Migration Phases**

### **Phase 1: Schema Enhancement (Week 1)**
- [ ] Create new tables alongside existing ones
- [ ] Migrate existing data to enhanced structure
- [ ] Test data integrity
- [ ] Update existing queries

### **Phase 2: Data Enrichment (Week 2-3)**
- [ ] Add missing player metadata (ages, experience, etc.)
- [ ] Import weekly projections
- [ ] Add historical stats (if available)
- [ ] Set up injury tracking

### **Phase 3: League Integration (Week 4)**
- [ ] Implement league linking
- [ ] Add roster management
- [ ] Test with real leagues

### **Phase 4: AI Features (Week 5-6)**
- [ ] Build recommendation engine
- [ ] Implement start/sit logic
- [ ] Add waiver wire analysis

## 🔧 **Migration Scripts**

### **1. Schema Migration Script**
```sql
-- Run this in Supabase SQL editor
-- This creates new tables without affecting existing ones

-- Step 1: Create enhanced players table
CREATE TABLE IF NOT EXISTS players_enhanced (
    player_id BIGSERIAL PRIMARY KEY,
    sleeper_id TEXT UNIQUE,
    espn_id TEXT UNIQUE,
    yahoo_id TEXT UNIQUE,
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

-- Step 2: Migrate existing player data
INSERT INTO players_enhanced (
    full_name, position, team_code, created_at
)
SELECT 
    full_name, position, team_code, created_at
FROM players
ON CONFLICT (full_name) DO NOTHING;

-- Step 3: Create new tables
-- (Run the full enhanced schema creation)
```

### **2. Data Migration Script**
```bash
#!/bin/bash
# migrate-data.sh

echo "🚀 Starting data migration..."

# Step 1: Backup current data
echo "📦 Backing up current data..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Run schema migration
echo "🔧 Running schema migration..."
psql $DATABASE_URL -f supabase_schema_enhanced.sql

# Step 3: Migrate existing data
echo "📊 Migrating existing data..."
psql $DATABASE_URL -f data_migration.sql

# Step 4: Verify migration
echo "✅ Verifying migration..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM players_enhanced;"

echo "🎉 Migration complete!"
```

## 📥 **Data Sources for Enhancement**

### **1. Player Metadata (Age, Experience, etc.)**
- **Source**: NFL.com, ESPN, Pro Football Reference
- **Method**: Web scraping or API calls
- **Frequency**: Once per season
- **Priority**: Medium

### **2. Weekly Projections**
- **Source**: FantasyPros, ESPN, NumberFire
- **Method**: CSV downloads or API calls
- **Frequency**: Weekly during season
- **Priority**: High

### **3. Historical Stats**
- **Source**: Pro Football Reference, ESPN
- **Method**: API calls or data dumps
- **Frequency**: Once per season
- **Priority**: Medium

### **4. Injury Updates**
- **Source**: ESPN, NFL.com, Rotowire
- **Method**: RSS feeds or API calls
- **Frequency**: Daily during season
- **Priority**: High

## 🔄 **Rollback Strategy**

### **If Migration Fails**
```sql
-- Rollback to original schema
DROP TABLE IF EXISTS players_enhanced CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS weekly_projections CASCADE;
-- ... drop all new tables

-- Restore from backup
-- pg_restore backup_YYYYMMDD_HHMMSS.sql
```

### **Data Validation Checks**
```sql
-- Verify player count
SELECT COUNT(*) FROM players_enhanced;
SELECT COUNT(*) FROM players;

-- Verify data integrity
SELECT 
    COUNT(*) as total_players,
    COUNT(sleeper_id) as players_with_sleeper_id,
    COUNT(age) as players_with_age
FROM players_enhanced;

-- Check for duplicates
SELECT full_name, COUNT(*) 
FROM players_enhanced 
GROUP BY full_name 
HAVING COUNT(*) > 1;
```

## 📈 **Performance Considerations**

### **Indexing Strategy**
- **Primary indexes**: player_id, sleeper_id, league_id
- **Search indexes**: full_name (GIN), position + team_code
- **Time-based indexes**: week + season, status_date

### **Partitioning Strategy**
- **Weekly projections**: Partition by season + week
- **Player stats**: Partition by season
- **Historical data**: Archive old seasons

### **Query Optimization**
- **Use materialized views** for complex aggregations
- **Implement caching** for frequently accessed data
- **Batch operations** for bulk data updates

## 🧪 **Testing Strategy**

### **Unit Tests**
- [ ] Data migration integrity
- [ ] New table constraints
- [ ] Index performance
- [ ] Function correctness

### **Integration Tests**
- [ ] API endpoints with new schema
- [ ] Draft analyzer with enhanced data
- [ ] League linking functionality
- [ ] AI recommendation engine

### **Performance Tests**
- [ ] Query response times
- [ ] Database load under stress
- [ ] Memory usage optimization
- [ ] Concurrent user handling

## 📅 **Timeline & Milestones**

### **Week 1: Foundation**
- [ ] Deploy enhanced schema
- [ ] Migrate existing data
- [ ] Test basic functionality

### **Week 2: Data Enrichment**
- [ ] Import player metadata
- [ ] Set up weekly projections
- [ ] Add injury tracking

### **Week 3: League Features**
- [ ] Implement league linking
- [ ] Add roster management
- [ ] Test with sample leagues

### **Week 4: AI Engine**
- [ ] Build recommendation logic
- [ ] Implement start/sit analysis
- [ ] Add waiver wire insights

### **Week 5: Testing & Polish**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] User feedback integration

## 🚨 **Risk Mitigation**

### **High Risk Items**
1. **Data loss during migration**
   - **Mitigation**: Multiple backups, test migration on copy first

2. **Performance degradation**
   - **Mitigation**: Gradual rollout, performance monitoring

3. **API compatibility issues**
   - **Mitigation**: Maintain backward compatibility, versioned endpoints

### **Medium Risk Items**
1. **Data quality issues**
   - **Mitigation**: Data validation scripts, manual review

2. **Third-party API changes**
   - **Mitigation**: Multiple data sources, fallback options

### **Low Risk Items**
1. **Schema changes**
   - **Mitigation**: Well-tested migration scripts

## 💡 **Success Metrics**

### **Technical Metrics**
- [ ] 100% data migration success
- [ ] <100ms query response times
- [ ] 99.9% uptime during migration
- [ ] Zero data loss

### **Feature Metrics**
- [ ] League linking working for 3+ platforms
- [ ] Weekly projections for 500+ players
- [ ] AI recommendations with 80%+ accuracy
- [ ] User satisfaction >4.5/5

## 🔗 **Useful Resources**

- [Supabase Migration Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance.html)
- [Fantasy Football APIs](https://github.com/topics/fantasy-football-api)

---

**Ready to migrate?** 🚀

Run the migration scripts and let's build the foundation for league linking and AI recommendations! 