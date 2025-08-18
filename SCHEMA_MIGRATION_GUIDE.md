# 🏈 Schema Migration Guide: Draft Analyzer → League Linking

## 🎯 **What We're Doing**

We're upgrading the database schema to support the next phase of features:
- ✅ **Keep**: Draft analyzer (working perfectly)
- 🆕 **Add**: League linking capabilities
- 🆕 **Add**: Weekly projections and stats
- 🆕 **Add**: AI recommendation system

## 📋 **Migration Steps**

### **Step 1: Run Migration Preparation (Already Done)**
```bash
npm run migrate-schema
```
This verified that:
- ✅ Existing data is accessible
- ✅ Draft analyzer functionality works
- ✅ New schema is ready to deploy

### **Step 2: Deploy Schema to Supabase**

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click "SQL Editor" in the left sidebar

2. **Copy the Migration SQL**
   - Open `supabase_migration.sql` in your project
   - Copy the entire contents

3. **Paste and Execute**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" to execute

4. **Verify Success**
   - You should see "Migration completed successfully!"

### **Step 3: Verify Migration**
```bash
npm run verify-migration
```
This will confirm:
- ✅ New tables exist and are accessible
- ✅ Existing tables still work
- ✅ Enhanced players table has new columns
- ✅ All data integrity maintained

### **Step 4: Test Draft Analyzer**
The draft analyzer should work exactly the same:
- ✅ Same URL parsing
- ✅ Same player projections
- ✅ Same team analysis
- ✅ Same grading system

## 🗄️ **New Tables Added**

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `leagues` | League management | Platform, scoring rules, settings |
| `league_members` | Team owners | User IDs, team names, avatars |
| `league_rosters` | Current rosters | Players, positions, starter status |
| `weekly_projections` | Weekly projections | Per-week fantasy point projections |
| `player_stats` | Historical stats | Actual game performance data |
| `player_status` | Injury/status tracking | Active, questionable, out, IR |
| `depth_chart` | Team depth charts | Backup opportunities |
| `ai_recommendations` | AI insights | Waiver wire, start/sit, trades |

## 🔧 **Enhanced Players Table**

New columns added to existing `players` table:
- `sleeper_id`, `espn_id`, `yahoo_id` - Platform IDs
- `first_name`, `last_name` - Split names for better matching
- `age`, `experience_years` - Player metadata
- `college`, `height`, `weight` - Physical attributes
- `updated_at` - Last modification timestamp

## 🚨 **Safety Features**

- **`IF NOT EXISTS`** - Won't overwrite existing tables
- **`ADD COLUMN IF NOT EXISTS`** - Won't duplicate columns
- **Foreign key constraints** - Maintains data integrity
- **No data deletion** - All existing data preserved
- **Rollback safe** - Can undo if needed

## 🧪 **Testing After Migration**

1. **Run verification script**
   ```bash
   npm run verify-migration
   ```

2. **Test draft analyzer**
   - Use the same URLs you've been testing
   - Verify all projections still load
   - Confirm team analysis works

3. **Check new tables**
   - Tables should be empty (ready for data)
   - No errors when querying

## 🎯 **Next Phase: League Linking**

Once migration is verified, we can start building:
- **League connection** - Link user's Sleeper/ESPN leagues
- **Roster sync** - Import current team rosters
- **Weekly updates** - ESPN scraping for live data
- **AI agent** - Waiver wire and start/sit recommendations

## 🆘 **If Something Goes Wrong**

1. **Check Supabase logs** for SQL errors
2. **Verify table structure** in Table Editor
3. **Test draft analyzer** to ensure it still works
4. **Contact support** if needed

## 📊 **Expected Results**

After successful migration:
- ✅ 8 new tables created
- ✅ Players table enhanced with new columns
- ✅ Performance indexes added
- ✅ Draft analyzer works identically
- ✅ Ready for league linking features

---

**Ready to migrate?** Copy the SQL from `supabase_migration.sql` and run it in Supabase! 