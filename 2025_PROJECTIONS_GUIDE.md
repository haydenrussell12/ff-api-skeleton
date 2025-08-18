# 🏈 2025 Season Projections Guide

## 🎯 **What We've Built**

Your draft analyzer now supports **3 evaluation modes**:

### **1. ADP Only (Draft Value)** 🎯
- **What it does**: Evaluates picks based on draft position vs. expected ADP
- **Best for**: Traditional draft analysis, identifying steals and reaches
- **Example**: Jahmyr Gibbs drafted at pick 35 when he should go at pick 12 = **+23 value** (steal!)

### **2. Projections Only (Fantasy Points)** 📊
- **What it does**: Evaluates picks based on projected fantasy points
- **Best for**: Points-based analysis, identifying high-scoring players
- **Example**: Player projected for 300 points drafted in round 3 = **+15 value** (great value!)

### **3. Combo Mode (60% ADP + 40% Projections)** ⚖️
- **What it does**: Balanced evaluation using both metrics
- **Best for**: Most accurate overall assessment
- **Formula**: `(ADP Value × 0.6) + (Projection Value × 0.4)`

## 🚀 **Getting 2025 Season Projections**

### **Option 1: FantasyPros Premium (Recommended)**
- **Cost**: $39.99/year
- **Coverage**: Expert consensus projections, updated weekly
- **API Access**: Full access to projections, rankings, ADP
- **Setup**:
  1. Go to [fantasypros.com](https://fantasypros.com)
  2. Sign up for premium ($39.99/year)
  3. Get API access from your account
  4. Add `FANTASYPROS_API_KEY=your_key_here` to `.env`

### **Option 2: ESPN+**
- **Cost**: $9.99/month
- **Coverage**: Staff projections, good for casual players
- **Challenge**: No official API (would need to scrape)
- **Setup**: Manual data entry or web scraping

### **Option 3: NumberFire (Free)**
- **Cost**: Free with registration
- **Coverage**: Analytics-based projections
- **API**: Limited but available
- **Setup**: Register at [numberfire.com](https://numberfire.com)

### **Option 4: PFF Premium**
- **Cost**: $39.99/year
- **Coverage**: Advanced analytics, historical data
- **API**: Full access
- **Setup**: Premium subscription at [pff.com](https://pff.com)

## 🔧 **Setup Instructions**

### **1. Basic Setup (Sample Data)**
```bash
# Run our 2025 projections fetcher
npm run fetch-2025-projections

# This will populate your database with current sample projections
```

### **2. Enhanced Setup (Live Data)**
```bash
# 1. Get FantasyPros API key
# 2. Add to .env file
FANTASYPROS_API_KEY=your_key_here

# 3. Run enhanced fetcher
npm run fetch-2025-projections
```

### **3. Manual Data Import**
```bash
# Import from CSV files
npm run load-data

# Import current projections
npm run fetch-projections
```

## 📊 **Data Quality Comparison**

### **Sample Data (Current)**:
- ✅ **22 players** with 2025 projections
- ✅ **FantasyPros + ESPN** sample data
- ✅ **Realistic projections** (McCaffrey: 320 pts, Gibbs: 265 pts)
- ⚠️ **Limited coverage** (need more players)

### **Live Data (With API Keys)**:
- ✅ **500+ players** with projections
- ✅ **Real-time updates** weekly
- ✅ **Expert consensus** from multiple sources
- ✅ **Historical tracking** and trends

## 🎯 **Using the New Evaluation Modes**

### **Frontend Usage**:
1. **Go to** `/draft-analyzer` in your browser
2. **Enter** your Sleeper mock draft URL
3. **Select** projection source (FantasyPros, ESPN, etc.)
4. **Choose** evaluation mode:
   - **ADP Only**: Traditional draft value analysis
   - **Projections Only**: Fantasy points analysis
   - **Combo**: Best of both worlds
5. **Click** "Analyze Draft"

### **API Usage**:
```bash
# ADP Only mode
curl -X POST http://localhost:3000/api/analyze-draft \
  -H "Content-Type: application/json" \
  -d '{
    "draftUrl": "https://sleeper.com/draft/nfl/1234567890abcdef",
    "source": "fantasypros",
    "format": "standard",
    "evaluationMode": "adp"
  }'

# Projections Only mode
curl -X POST http://localhost:3000/api/analyze-draft \
  -H "Content-Type: application/json" \
  -d '{
    "draftUrl": "https://sleeper.com/draft/nfl/1234567890abcdef",
    "source": "fantasypros",
    "format": "standard",
    "evaluationMode": "projections"
  }'

# Combo mode
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

### **Preseason (July-August)**:
- **Weekly**: Run `npm run fetch-2025-projections`
- **Daily**: Check for breaking news and injuries
- **Focus**: Depth chart changes, rookie updates

### **Regular Season (September-December)**:
- **Monthly**: Update projections based on performance
- **Weekly**: Monitor injury reports
- **Focus**: Performance trends, breakout players

### **Offseason (January-June)**:
- **Quarterly**: Review data quality and sources
- **Monthly**: Add new data sources
- **Focus**: Historical analysis, next season prep

## 💡 **Pro Tips**

1. **Use Combo Mode** for most accurate analysis
2. **Run projections fetcher weekly** during preseason
3. **Compare multiple sources** for consensus
4. **Track ADP changes** to spot trends
5. **Store historical data** for analysis

## 🚨 **Common Issues & Solutions**

### **"No projections found"**
- Run `npm run fetch-2025-projections`
- Check your `.env` file for API keys
- Verify Supabase connection

### **"Outdated projections"**
- Run fetcher scripts regularly
- Check data timestamps
- Update API keys if expired

### **"Missing players"**
- Player might be inactive
- Check spelling variations
- Verify player is in database

## 🔗 **Useful Links**

- [FantasyPros API Documentation](https://api.fantasypros.com/)
- [ESPN Fantasy Football](https://www.espn.com/fantasy/football/)
- [NumberFire Projections](https://www.numberfire.com/nfl/fantasy)
- [PFF Premium](https://www.pff.com/premium)

---

## 🎉 **Next Steps**

1. **Run the projections fetcher**: `npm run fetch-2025-projections`
2. **Test the new evaluation modes** in your draft analyzer
3. **Get FantasyPros API key** for live data (recommended)
4. **Use Combo mode** for best draft analysis results

**Your draft analyzer is now a powerful tool that can evaluate picks using multiple strategies!** 🏈✨ 