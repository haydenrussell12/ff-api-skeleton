# 🏈 Position-Specific CSV Import Guide

## 🎯 **Why Position-Specific CSVs Are Brilliant**

### **Advantages Over Single CSV:**
- ✅ **Easier Management** - Update just QB projections without re-importing everything
- ✅ **Better Organization** - Keep historical data by position group
- ✅ **Faster Imports** - Smaller files process quicker
- ✅ **Position-Specific Analysis** - Can analyze draft strategies by position
- ✅ **Easier Troubleshooting** - If one position has issues, others still work
- ✅ **Flexible Updates** - Update RB projections weekly, QB monthly, etc.
- ✅ **Better Validation** - Position-specific quality checks and player count validation

### **Real-World Workflow Example:**
- **Week 1**: Download new RB projections (injuries, depth chart changes)
- **Week 2**: Download new WR projections (trade rumors, camp reports)
- **Week 3**: Download new QB projections (starter decisions)
- **Week 4**: Download new TE/K/DST projections (final preseason)

## 📁 **File Structure & Organization**

### **Recommended Directory Structure:**
```
ff_api_skeleton/
├── data/
│   ├── projections/
│   │   ├── qb/
│   │   │   ├── fantasypros-qb-2025-08-11.csv
│   │   │   ├── fantasypros-qb-2025-08-18.csv
│   │   │   └── fantasypros-qb-2025-08-25.csv
│   │   ├── rb/
│   │   │   ├── fantasypros-rb-2025-08-11.csv
│   │   │   ├── fantasypros-rb-2025-08-18.csv
│   │   │   └── fantasypros-rb-2025-08-25.csv
│   │   ├── wr/
│   │   │   ├── fantasypros-wr-2025-08-11.csv
│   │   │   └── fantasypros-wr-2025-08-18.csv
│   │   ├── te/
│   │   │   └── fantasypros-te-2025-08-11.csv
│   │   ├── k/
│   │   │   └── fantasypros-k-2025-08-11.csv
│   │   └── dst/
│   │       └── fantasypros-dst-2025-08-11.csv
│   ├── fantasypros-sample.csv
│   └── rankings.csv
├── scripts/
└── ...
```

### **File Naming Convention:**
```
fantasypros-{position}-{date}.csv

Examples:
- fantasypros-qb-2025-08-11.csv
- fantasypros-rb-2025-08-18.csv
- fantasypros-wr-2025-08-25.csv
- fantasypros-te-2025-09-01.csv
```

## 🔧 **How to Use Position-Specific Imports**

### **1. Import Single Position:**
```bash
# Import QB projections
npm run import-position-csv QB data/projections/qb/fantasypros-qb-2025-08-11.csv

# Import RB projections
npm run import-position-csv RB data/projections/rb/fantasypros-rb-2025-08-18.csv

# Import WR projections
npm run import-position-csv WR data/projections/wr/fantasypros-wr-2025-08-25.csv
```

### **2. Bulk Import All Positions:**
```bash
# Import all positions from their respective directories
npm run import-position-csv -- --bulk
```

### **3. What Happens During Import:**
1. **Position Validation** - Ensures file matches expected position
2. **CSV Parsing** - Reads and validates your file
3. **Quality Checks** - Validates player count and required fields
4. **Player Matching** - Finds existing players or creates new ones
5. **Data Import** - Saves projections, rankings, and ADP
6. **Snapshot Creation** - Timestamps your data for tracking

## 📊 **Position-Specific Requirements & Validation**

### **QB (Quarterbacks):**
- **Expected Players**: 20-50
- **Required Fields**: Player, Pos, Team, FPTS
- **Sample File**: `data/projections/qb/fantasypros-qb-2025-08-11.csv`

### **RB (Running Backs):**
- **Expected Players**: 40-80
- **Required Fields**: Player, Pos, Team, FPTS
- **Sample File**: `data/projections/rb/fantasypros-rb-2025-08-11.csv`

### **WR (Wide Receivers):**
- **Expected Players**: 50-100
- **Required Fields**: Player, Pos, Team, FPTS
- **Sample File**: `data/projections/wr/fantasypros-wr-2025-08-11.csv`

### **TE (Tight Ends):**
- **Expected Players**: 20-40
- **Required Fields**: Player, Pos, Team, FPTS
- **Sample File**: `data/projections/te/fantasypros-te-2025-08-11.csv`

### **K (Kickers):**
- **Expected Players**: 15-35
- **Required Fields**: Player, Pos, Team, FPTS
- **Sample File**: `data/projections/k/fantasypros-k-2025-08-11.csv`

### **DST (Defense/Special Teams):**
- **Expected Players**: 15-35
- **Required Fields**: Player, Pos, Team, FPTS
- **Sample File**: `data/projections/dst/fantasypros-dst-2025-08-11.csv`

## 📥 **Downloading Position-Specific CSVs from FantasyPros**

### **Step 1: Go to FantasyPros**
1. Visit [fantasypros.com](https://fantasypros.com)
2. Navigate to **NFL > Rankings** or **NFL > Projections**

### **Step 2: Filter by Position**
1. Look for **position filter** (usually dropdown or tabs)
2. Select specific position (QB, RB, WR, TE, K, DST)
3. Choose your format (Standard, PPR, Half-PPR)

### **Step 3: Download CSV**
1. Look for **"Export to CSV"** or **"Download"** button
2. Save with position-specific naming: `fantasypros-qb-2025-08-11.csv`
3. Place in appropriate directory: `data/projections/qb/`

### **Step 4: Repeat for Each Position**
- Download QB projections → `data/projections/qb/`
- Download RB projections → `data/projections/rb/`
- Download WR projections → `data/projections/wr/`
- Download TE projections → `data/projections/te/`
- Download K projections → `data/projections/k/`
- Download DST projections → `data/projections/dst/`

## 🚀 **Using Position-Specific Data in Draft Analyzer**

### **In Draft Analyzer:**
1. **Source**: Select `fantasypros`
2. **Format**: Choose position-specific format (e.g., `qb`, `rb`, `wr`)
3. **Evaluation Mode**: 
   - **ADP Only** - Uses ADP vs. draft position
   - **Projections Only** - Uses projected fantasy points
   - **Combo** - Balanced evaluation (recommended)

### **API Usage with Position-Specific Data:**
```bash
# Test with QB-specific data
curl -X POST http://localhost:3000/api/analyze-draft \
  -H "Content-Type: application/json" \
  -d '{
    "draftUrl": "https://sleeper.com/draft/nfl/1234567890abcdef",
    "source": "fantasypros",
    "format": "qb",
    "evaluationMode": "combo"
  }'

# Test with RB-specific data
curl -X POST http://localhost:3000/api/analyze-draft \
  -H "Content-Type: application/json" \
  -d '{
    "draftUrl": "https://sleeper.com/draft/nfl/1234567890abcdef",
    "source": "fantasypros",
    "format": "rb",
    "evaluationMode": "projections"
  }'
```

## 🔄 **Maintenance Schedule & Workflow**

### **Preseason (July-August):**
- **Weekly**: Download new position-specific CSVs
- **After download**: Run import for updated positions
- **Verify**: Check projections in draft analyzer

### **Recommended Update Frequency:**
- **QB**: Every 2 weeks (starter decisions, injuries)
- **RB**: Weekly (depth chart changes, injuries)
- **WR**: Weekly (trade rumors, camp reports)
- **TE**: Every 2 weeks (starter decisions)
- **K**: Monthly (starter decisions)
- **DST**: Monthly (depth chart changes)

### **Example Weekly Workflow:**
```bash
# Monday: Download new RB projections
# Place in data/projections/rb/fantasypros-rb-2025-08-18.csv
npm run import-position-csv RB data/projections/rb/fantasypros-rb-2025-08-18.csv

# Wednesday: Download new WR projections
# Place in data/projections/wr/fantasypros-wr-2025-08-20.csv
npm run import-position-csv WR data/projections/wr/fantasypros-wr-2025-08-20.csv

# Friday: Bulk import all positions (optional)
npm run import-position-csv -- --bulk
```

## 🚨 **Common Issues & Solutions**

### **"Position mismatch" Warning**
- **Cause**: CSV contains players from different positions
- **Solution**: Filter FantasyPros export to show only the specific position

### **"Low player count" Warning**
- **Cause**: CSV has fewer players than expected
- **Solution**: Check if FantasyPros filtered out some players, or if it's a partial export

### **"Missing required fields" Error**
- **Cause**: CSV doesn't have Player, Pos, Team, FPTS columns
- **Solution**: Ensure you're downloading the full projection export, not just rankings

### **"File not found" Error**
- **Cause**: Incorrect file path or missing directory
- **Solution**: Create position directories first: `mkdir -p data/projections/{qb,rb,wr,te,k,dst}`

## 💡 **Pro Tips for Position-Specific Management**

### **1. Consistent Naming**
- Use same date format: `YYYY-MM-DD`
- Include source: `fantasypros-{position}-{date}.csv`
- Keep historical versions for comparison

### **2. Quality Control**
- Validate player counts match expectations
- Check for position mismatches
- Monitor import success rates

### **3. Backup Strategy**
- Keep CSV backups in separate folder
- Document any data quality issues
- Track projection changes over time

### **4. Performance Optimization**
- Import only changed positions
- Use bulk import for full updates
- Schedule imports during off-peak hours

## 🔗 **Useful Commands Reference**

### **Directory Management:**
```bash
# Create position directories
mkdir -p data/projections/{qb,rb,wr,te,k,dst}

# List all projection files
find data/projections -name "*.csv" -type f

# Check file sizes
du -sh data/projections/*/
```

### **Import Commands:**
```bash
# Single position import
npm run import-position-csv QB data/projections/qb/fantasypros-qb-2025-08-11.csv

# Bulk import all positions
npm run import-position-csv -- --bulk

# Check available sources
curl http://localhost:3000/api/projection-sources
```

## 🎉 **Next Steps**

1. **Create position directories**: `mkdir -p data/projections/{qb,rb,wr,te,k,dst}`
2. **Download position-specific CSVs** from FantasyPros
3. **Import each position**: `npm run import-position-csv {POSITION} {FILEPATH}`
4. **Test in draft analyzer** with position-specific formats
5. **Set up weekly update workflow** for your most important positions

**This position-specific approach gives you professional-grade data management with the flexibility to update only what you need!** 🏈✨ 