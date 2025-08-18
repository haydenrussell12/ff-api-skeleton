# 🏈 Fantasy Football Data Sources Guide

## 🎯 **Preseason Data Priorities**

### **1. ADP (Average Draft Position) - CRITICAL**
**Why it matters**: ADP shows where players are actually being drafted, not just expert rankings.

**Best Sources**:
- **FantasyPros** (Premium) - Most accurate, updated daily
- **ESPN** - Free, good for public leagues
- **NFL.com** - Official source, good for casual players
- **Yahoo** - Free, updated regularly

**How to get**:
```bash
# Run our fetcher (uses sample data for now)
npm run fetch-current-data

# With FantasyPros API key (recommended)
# 1. Go to fantasypros.com
# 2. Sign up for premium ($39.99/year)
# 3. Get API access
# 4. Add FANTASYPROS_API_KEY to your .env
```

### **2. Season Projections - CRITICAL**
**Why it matters**: Raw rankings don't tell you how many points to expect.

**Best Sources**:
- **FantasyPros** - Expert consensus projections
- **ESPN** - Staff projections
- **NumberFire** - Analytics-based
- **PFF (Pro Football Focus)** - Premium analytics

### **3. Player News & Updates - IMPORTANT**
**Why it matters**: Injuries, depth chart changes, coaching changes affect value.

**Best Sources**:
- **Rotowire** - Breaking news
- **ESPN** - Official injury reports
- **NFL.com** - Official team updates
- **Twitter/X** - Beat reporters

## 🚀 **Getting Live Data (Recommended)**

### **FantasyPros Premium ($39.99/year)**
- **ADP from 100+ sites**
- **Expert consensus projections**
- **API access** for automation
- **Daily updates**

### **ESPN+ ($9.99/month)**
- **Staff projections**
- **Injury updates**
- **Depth chart changes**

### **PFF Premium ($39.99/year)**
- **Analytics-based projections**
- **Advanced metrics**
- **Historical data**

## 💾 **Our Data Pipeline**

### **What We Store**:
1. **Player Database** - Names, positions, teams, Sleeper IDs
2. **ADP Data** - Current draft positions by format
3. **Projections** - Points, rankings, tiers by source
4. **Snapshots** - Date-stamped data for historical analysis

### **Data Flow**:
```
External APIs → Our Fetcher → Supabase → Draft Analyzer
     ↓              ↓           ↓           ↓
  Live Data → Processed → Stored → Instant Analysis
```

## 🔧 **Setup Instructions**

### **1. Basic Setup (Sample Data)**
```bash
npm run fetch-current-data
```
This will populate your database with current sample data.

### **2. Enhanced Setup (Live Data)**
```bash
# 1. Get FantasyPros API key
# 2. Add to .env file
FANTASYPROS_API_KEY=your_key_here

# 3. Run enhanced fetcher
npm run fetch-current-data
```

### **3. Manual Data Import**
```bash
# Import from CSV files
npm run load-data

# Import projections
npm run fetch-projections
```

## 📊 **Data Quality Metrics**

### **Sample Data (Current)**:
- ✅ **160+ players** from Sleeper
- ✅ **10 top players** with projections
- ✅ **ADP data** for top players
- ⚠️ **Limited coverage** (need more)

### **Live Data (With API Keys)**:
- ✅ **500+ players** with projections
- ✅ **Real-time ADP** from multiple sources
- ✅ **Daily updates** automatically
- ✅ **Historical tracking**

## 🎯 **Preseason Strategy**

### **Week 1-2 (Training Camp)**:
- Focus on **depth chart changes**
- Monitor **injury reports**
- Track **coaching changes**

### **Week 3-4 (Preseason Games)**:
- Update **ADP based on performance**
- Adjust **projections for rookies**
- Monitor **battles for starting spots**

### **Week 5 (Final Week)**:
- **Final ADP adjustments**
- **Last-minute injury updates**
- **Depth chart finalization**

## 🔄 **Maintenance Schedule**

### **Daily**:
- Check for **breaking news**
- Monitor **injury reports**

### **Weekly**:
- Run `npm run fetch-current-data`
- Update **ADP trends**
- Adjust **projections**

### **Monthly**:
- Review **data quality**
- Add **new data sources**
- Optimize **database performance**

## 🚨 **Common Issues & Solutions**

### **"No projections found"**
- Run `npm run fetch-current-data`
- Check your `.env` file
- Verify Supabase connection

### **"Outdated data"**
- Run fetcher scripts regularly
- Check data timestamps
- Update API keys if expired

### **"Missing players"**
- Sleeper API might be down
- Player might be inactive
- Check spelling variations

## 💡 **Pro Tips**

1. **Run data fetcher weekly** during preseason
2. **Use multiple sources** for projections
3. **Track ADP changes** to spot trends
4. **Store historical data** for analysis
5. **Automate updates** with cron jobs

## 🔗 **Useful Links**

- [FantasyPros API Documentation](https://api.fantasypros.com/)
- [ESPN Fantasy Football](https://www.espn.com/fantasy/football/)
- [NFL.com Fantasy](https://fantasy.nfl.com/)
- [Rotowire News](https://www.rotowire.com/football/)

---

**Next Steps**: Run `npm run fetch-current-data` to populate your database with current preseason data! 