# 🏈 Immediate Action Plan: Next 2-4 Weeks

## 🎯 **Week 1: Foundation & Schema Migration**

### **Day 1-2: Schema Deployment**
- [ ] **Deploy enhanced schema** to Supabase
  ```bash
  # Run in Supabase SQL editor
  # Copy contents of supabase_schema_enhanced.sql
  ```
- [ ] **Test schema creation** - verify all tables exist
- [ ] **Create indexes** for performance
- [ ] **Set up RLS policies** (basic for now)

### **Day 3-4: Data Migration**
- [ ] **Backup current data** 
  ```bash
  # Export current data from Supabase
  # Keep as safety net
  ```
- [ ] **Migrate existing players** to enhanced structure
- [ ] **Verify data integrity** - no players lost
- [ ] **Test existing functionality** still works

### **Day 5-7: Testing & Validation**
- [ ] **Run draft analyzer** with new schema
- [ ] **Test all API endpoints** still functional
- [ ] **Performance testing** - ensure no degradation
- [ ] **Fix any issues** found during testing

## 🚀 **Week 2: Data Enrichment**

### **Priority 1: Weekly Projections**
- [ ] **Download FantasyPros weekly projections** (CSV)
- [ ] **Create import script** for weekly data
- [ ] **Import Week 1-4 projections** for top 200 players
- [ ] **Test weekly projection queries**

### **Priority 2: Player Metadata**
- [ ] **Research data sources** for player ages, experience
- [ ] **Create player enrichment script**
- [ ] **Add metadata for top 100 players**
- [ ] **Test enhanced player queries**

### **Priority 3: Injury Tracking Setup**
- [ ] **Research injury data sources** (ESPN, NFL.com)
- [ ] **Create injury tracking script**
- [ ] **Set up daily data collection** (manual for now)
- [ ] **Test injury status queries**

## 🔗 **Week 3: League Integration Foundation**

### **League Linking Setup**
- [ ] **Create league management API endpoints**
  ```javascript
  // New endpoints needed:
  POST /api/leagues/link-sleeper
  POST /api/leagues/link-espn  
  GET /api/leagues/:id/rosters
  GET /api/leagues/:id/members
  ```
- [ ] **Implement Sleeper league linking** (start with this)
- [ ] **Test with sample league** data
- [ ] **Create league dashboard** UI

### **Roster Management**
- [ ] **Create roster sync functionality**
- [ ] **Store current team rosters** in database
- [ ] **Test roster queries** and updates
- [ ] **Create roster visualization** in UI

## 🤖 **Week 4: AI Recommendation Engine**

### **Core Recommendation Logic**
- [ ] **Start/Sit recommendations** based on weekly projections
- [ ] **Waiver wire analysis** using projections + roster data
- [ ] **Trade suggestions** based on team needs
- [ ] **Priority scoring system** (0-10 scale)

### **Basic AI Features**
- [ ] **Weekly start/sit recommendations**
- [ ] **Top waiver wire pickups**
- [ ] **Team strength analysis**
- [ ] **Matchup insights**

## 📊 **Immediate Data Sources (This Week)**

### **1. FantasyPros Weekly Projections**
```bash
# Download these CSVs this week:
# - fantasypros-week1-projections.csv
# - fantasypros-week2-projections.csv  
# - fantasypros-week3-projections.csv
# - fantasypros-week4-projections.csv
```

### **2. Player Metadata Sources**
- **NFL.com** - Player profiles, ages, experience
- **ESPN** - Player stats, team changes
- **Pro Football Reference** - Historical data

### **3. Injury Data Sources**
- **ESPN Injury Report** - Official injury status
- **NFL.com** - Practice reports
- **Rotowire** - Breaking news

## 🔧 **Technical Implementation Steps**

### **Step 1: Schema Migration (Today)**
```sql
-- Run this in Supabase SQL editor
-- This creates the foundation for all new features

-- 1. Create enhanced players table
CREATE TABLE IF NOT EXISTS players_enhanced (
    player_id BIGSERIAL PRIMARY KEY,
    sleeper_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    team_code TEXT,
    age INTEGER,
    experience_years INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migrate existing data
INSERT INTO players_enhanced (full_name, position, team_code, created_at)
SELECT full_name, position, team_code, created_at 
FROM players;

-- 3. Create weekly projections table
CREATE TABLE IF NOT EXISTS weekly_projections (
    projection_id BIGSERIAL PRIMARY KEY,
    player_id BIGINT REFERENCES players_enhanced(player_id),
    season INTEGER NOT NULL DEFAULT 2025,
    week INTEGER NOT NULL CHECK (week >= 1 AND week <= 18),
    source TEXT NOT NULL,
    projection_pts NUMERIC(6,2),
    opponent_team TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
    league_id BIGSERIAL PRIMARY KEY,
    sleeper_league_id TEXT UNIQUE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'sleeper',
    scoring_type TEXT NOT NULL DEFAULT 'standard',
    teams_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Step 2: Data Import Scripts (This Week)**
```bash
# Create these scripts:
# - import-weekly-projections.js
# - import-player-metadata.js  
# - import-injury-data.js
# - link-league.js
```

### **Step 3: API Endpoints (Next Week)**
```javascript
// New endpoints to add to server.js:
app.post('/api/leagues/link', linkLeague);
app.get('/api/leagues/:id', getLeague);
app.get('/api/leagues/:id/rosters', getLeagueRosters);
app.get('/api/recommendations/:leagueId', getRecommendations);
```

## 📈 **Success Metrics for Week 1**

### **Technical Goals**
- [ ] Enhanced schema deployed successfully
- [ ] Zero data loss during migration
- [ ] All existing functionality still works
- [ ] Query performance maintained or improved

### **Data Goals**
- [ ] 100% of existing players migrated
- [ ] Weekly projections for top 200 players
- [ ] Player metadata for top 100 players
- [ ] Injury tracking for active players

### **Feature Goals**
- [ ] League linking working for Sleeper
- [ ] Basic roster management functional
- [ ] Weekly projections accessible via API
- [ ] Enhanced player data in draft analyzer

## 🚨 **Risk Mitigation This Week**

### **High Risk: Data Loss**
- **Mitigation**: Multiple backups before migration
- **Test**: Run migration on copy first
- **Rollback**: Keep original tables until verified

### **Medium Risk: Performance Issues**
- **Mitigation**: Test queries with new schema
- **Monitor**: Watch response times closely
- **Optimize**: Add indexes if needed

### **Low Risk: Feature Regression**
- **Mitigation**: Comprehensive testing
- **Verify**: All existing endpoints work
- **Document**: Any changes needed

## 💡 **Quick Wins This Week**

### **Day 1: Schema Foundation**
- Deploy enhanced schema
- Create basic tables
- Test basic functionality

### **Day 2: Data Migration**
- Migrate existing players
- Verify data integrity
- Test existing features

### **Day 3: Weekly Projections**
- Download FantasyPros data
- Create import script
- Import first few weeks

### **Day 4: Testing & Validation**
- End-to-end testing
- Performance validation
- Bug fixes

## 🔗 **Resources & References**

### **Immediate Reading**
- [Supabase Migration Guide](https://supabase.com/docs/guides/database/migrations)
- [FantasyPros CSV Format](https://www.fantasypros.com/help/export-rankings/)
- [Sleeper API Documentation](https://docs.sleeper.com/)

### **Code Examples**
- Check existing scripts for patterns
- Use similar structure for new imports
- Follow existing error handling patterns

---

## 🎯 **This Week's Goal**

**Get the enhanced data foundation in place** so we can build league linking and AI recommendations next week.

**Success looks like:**
- ✅ Enhanced schema deployed
- ✅ Existing data migrated safely  
- ✅ Weekly projections imported
- ✅ League linking foundation ready
- ✅ All existing features still work

**Ready to start?** 🚀

Let's begin with the schema migration today and build the foundation for the next phase of features! 