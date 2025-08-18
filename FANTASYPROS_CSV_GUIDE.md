# 🏈 FantasyPros CSV Import Guide

## 🎯 **Why FantasyPros CSV Downloads Are Perfect**

### **Advantages:**
- ✅ **Complete coverage** - 300+ players with projections
- ✅ **Professional quality** - Same data premium users get
- ✅ **Updated weekly** - Fresh projections during preseason
- ✅ **No API complexity** - Just download and import
- ✅ **Multiple formats** - Standard, PPR, Half-PPR, etc.
- ✅ **Includes ADP** - Draft position data built-in

### **What You Get:**
- **Player projections** (fantasy points)
- **Expert rankings** (ECR - Expert Consensus Rankings)
- **ADP data** (Average Draft Position)
- **Tier information** (player grouping)
- **Team assignments** (current NFL teams)

## 📥 **How to Download FantasyPros Projections**

### **Step 1: Go to FantasyPros**
1. Visit [fantasypros.com](https://fantasypros.com)
2. Navigate to **NFL > Rankings** or **NFL > Projections**

### **Step 2: Choose Your Format**
- **Standard Scoring** - Traditional fantasy points
- **PPR** - Points Per Reception
- **Half-PPR** - 0.5 points per reception
- **Custom** - Your league's scoring system

### **Step 3: Download CSV**
1. Look for **"Export to CSV"** or **"Download"** button
2. Usually near the top of the rankings table
3. Save file as `fantasypros-projections.csv`

### **Step 4: Place in Data Folder**
```
ff_api_skeleton/
├── data/
│   ├── fantasypros-projections.csv  ← Put your CSV here
│   ├── fantasypros-sample.csv       ← Sample format
│   └── rankings.csv
├── scripts/
└── ...
```

## 🔧 **Importing Your CSV**

### **Basic Import:**
```bash
# Import your downloaded CSV
npm run import-fantasypros-csv data/fantasypros-projections.csv
```

### **What Happens During Import:**
1. **CSV Parsing** - Reads and validates your file
2. **Player Matching** - Finds existing players or creates new ones
3. **Data Import** - Saves projections, rankings, and ADP
4. **Snapshot Creation** - Timestamps your data for tracking

### **Expected Output:**
```
🚀 Starting FantasyPros CSV import...
📁 File: data/fantasypros-projections.csv
📅 Date: 2025-08-11
📖 Read 15420 characters from CSV
📊 Parsing FantasyPros CSV...
📋 CSV Headers: ['Player', 'Pos', 'Team', 'FPTS', 'Rank', 'Tier', 'ADP', 'ECR', 'Best', 'Worst', 'Std Dev']
✅ Parsed 245 player projections

📊 Sample projections:
  Christian McCaffrey (RB) - 320.5 pts, Rank 1
  Breece Hall (RB) - 310.2 pts, Rank 2
  Justin Jefferson (WR) - 305.8 pts, Rank 3
  Tyreek Hill (WR) - 300.1 pts, Rank 4
  CeeDee Lamb (WR) - 295.3 pts, Rank 5

💾 Saving projections to database...
✅ Saved 245 projections
✅ Created 12 new players

🎉 FantasyPros CSV import completed successfully!
📊 Total projections: 245
📅 Import date: 2025-08-11
```

## 📊 **CSV Format Requirements**

### **Required Columns:**
- **Player** - Full player name (e.g., "Christian McCaffrey")
- **Pos** - Position (QB, RB, WR, TE, K, DEF)
- **FPTS** - Projected fantasy points (e.g., 320.5)

### **Optional Columns:**
- **Team** - NFL team abbreviation (e.g., "SF")
- **Rank** - Expert ranking (e.g., 1)
- **Tier** - Player tier grouping (e.g., 1)
- **ADP** - Average draft position (e.g., 1.2)
- **ECR** - Expert consensus ranking (e.g., 1.0)

### **Sample CSV Structure:**
```csv
Player,Pos,Team,FPTS,Rank,Tier,ADP,ECR
Christian McCaffrey,RB,SF,320.5,1,1,1.2,1.0
Breece Hall,RB,NYJ,310.2,2,1,2.1,2.0
Justin Jefferson,WR,MIN,305.8,3,1,3.5,3.0
```

## 🚀 **Using Imported Data**

### **In Draft Analyzer:**
1. **Source**: Select `fantasypros`
2. **Format**: Choose `standard` (or your CSV format)
3. **Evaluation Mode**: 
   - **ADP Only** - Uses ADP vs. draft position
   - **Projections Only** - Uses projected fantasy points
   - **Combo** - Balanced evaluation (recommended)

### **API Usage:**
```bash
# Test with FantasyPros data
curl -X POST http://localhost:3000/api/analyze-draft \
  -H "Content-Type: application/json" \
  -d '{
    "draftUrl": "https://sleeper.com/draft/nfl/1234567890abcdef",
    "source": "fantasypros",
    "format": "standard",
    "evaluationMode": "combo"
  }'
```

## 🔄 **Maintenance Schedule**

### **Preseason (July-August):**
- **Weekly**: Download new CSV from FantasyPros
- **After download**: Run import script
- **Verify**: Check projections in draft analyzer

### **Regular Season (September-December):**
- **Monthly**: Update projections based on performance
- **Weekly**: Monitor injury reports and depth chart changes

### **Offseason (January-June):**
- **Quarterly**: Review data quality
- **Prepare**: Get ready for next season

## 🚨 **Common Issues & Solutions**

### **"CSV file not found"**
- Check file path: `data/fantasypros-projections.csv`
- Ensure file is in the `data/` folder
- Verify filename spelling

### **"No valid projections found"**
- Check CSV format matches sample
- Ensure required columns exist: Player, Pos, FPTS
- Verify CSV isn't corrupted

### **"Error creating player"**
- Check database connection
- Verify Supabase credentials
- Check for duplicate player names

### **"Projections not showing in analyzer"**
- Use `fantasypros` as source
- Select correct format (standard, ppr, etc.)
- Run import script first

## 💡 **Pro Tips**

1. **Download weekly** during preseason for fresh data
2. **Use consistent naming** for CSV files (e.g., `fantasypros-2025-08-11.csv`)
3. **Backup your CSVs** - they're valuable historical data
4. **Compare formats** - Standard vs. PPR can show different strategies
5. **Track changes** - Monitor how projections evolve during preseason

## 🔗 **Useful Links**

- [FantasyPros NFL Rankings](https://www.fantasypros.com/nfl/rankings/)
- [FantasyPros NFL Projections](https://www.fantasypros.com/nfl/projections/)
- [FantasyPros CSV Export Guide](https://www.fantasypros.com/help/export-rankings/)

## 🎉 **Next Steps**

1. **Download** FantasyPros CSV projections
2. **Place file** in `data/` folder
3. **Run import**: `npm run import-fantasypros-csv data/fantasypros-projections.csv`
4. **Test analyzer** with `fantasypros` source
5. **Enjoy** professional-grade draft analysis!

**This approach gives you the same data quality as premium FantasyPros users without the API complexity!** 🏈✨ 