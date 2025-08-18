# 🏈 Fantasy Football League Linking & Keeper Analysis

## 🚀 **What's New**

We've added **League Linking** functionality to connect to your **Sleeper** and **ESPN** leagues and analyze keeper decisions! This feature allows you to:

- **Connect to Sleeper leagues** using your league ID
- **Connect to ESPN leagues** using your league ID and season
- **Import team rosters** from last season
- **Get keeper recommendations** based on current ADP vs. draft position
- **Analyze team value** for the upcoming season

## 🔗 **How to Connect Your League**

### **Step 1: Find Your League ID**

#### **Sleeper Leagues:**
1. Go to your Sleeper league in a web browser
2. Look at the URL: `https://sleeper.com/league/YOUR_LEAGUE_ID`
3. Copy the `YOUR_LEAGUE_ID` part

#### **ESPN Leagues:**
1. Go to your ESPN league in a web browser
2. Look at the URL: `https://fantasy.espn.com/league/YOUR_LEAGUE_ID`
3. Copy the `YOUR_LEAGUE_ID` part
4. Note the season (e.g., 2023, 2024)

### **Step 2: Connect to League**
1. Navigate to **League Manager** (new tab in the navigation)
2. Select your platform (**Sleeper** or **ESPN**)
3. **For ESPN**: Select the season (2022, 2023, or 2024)
4. Paste your league ID
5. Click **"Connect to League"**

### **Step 3: Import Rosters**
1. After connecting, click **"Import Team Rosters"**
2. This will pull all teams and players from the selected season
3. Wait for the import to complete

### **Step 4: Analyze Keepers**
1. Select a team from the dropdown
2. View keeper recommendations based on:
   - **Current ADP** (from Sleeper)
   - **Position value** (RB > WR > TE > QB > K/DST)
   - **Keeper value score** (0-100)

## 📊 **Keeper Recommendation Logic**

The system analyzes each player and provides recommendations:

- **DEFINITE KEEPER** (Score 80-100): Elite players with high ADP
- **STRONG KEEPER** (Score 60-79): Valuable players worth keeping
- **CONSIDER KEEPING** (Score 40-59): Borderline cases
- **WEAK KEEPER** (Score 20-39): Probably not worth keeping
- **DON'T KEEP** (Score 0-19): Low-value players

### **Position Multipliers**
- **RB**: 1.2x (Most valuable as keepers)
- **WR**: 1.1x (Very valuable)
- **TE**: 1.0x (Neutral)
- **QB**: 0.8x (Less valuable)
- **K/DST**: 0.3-0.5x (Least valuable)

## 🛠 **Technical Details**

### **API Endpoints**
- `POST /api/leagues/connect` - Connect to a league (Sleeper or ESPN)
- `POST /api/leagues/:id/import-rosters` - Import team rosters
- `GET /api/leagues/:id/teams/:teamId/keepers` - Get keeper recommendations
- `GET /api/leagues` - List connected leagues

### **Database Tables Used**
- `leagues` - League information
- `league_members` - Team owners
- `league_rosters` - Player rosters
- `players` - Player information
- `rankings_snapshots` - ADP data

## 🔧 **Testing the Feature**

### **Command Line Test**
```bash
# Test Sleeper league connection (update leagueId first)
npm run test-league

# Test ESPN league connection (update leagueId and season first)
npm run test-espn
```

### **Manual Testing**
1. Start your server: `npm run dev`
2. Go to `http://localhost:3000/league-manager.html`
3. Follow the connection steps above

## 🎯 **Use Cases**

### **Keeper League Analysis**
- **Before the draft**: See which players are worth keeping
- **Trade evaluation**: Identify undervalued players on other teams
- **Draft strategy**: Know which positions to target early

### **League Management**
- **Team comparison**: See how your team stacks up
- **Value tracking**: Monitor player value changes
- **Historical data**: Keep records of past seasons

## 🚧 **Coming Soon**

- **Yahoo League Support** - Connect to Yahoo leagues
- **Weekly Projections** - Get weekly player projections
- **AI Agent Features** - Waiver wire recommendations, start/sit advice
- **Trade Analysis** - Evaluate potential trades

## ❓ **Troubleshooting**

### **Common Issues**

**"League not found"**
- Double-check your league ID
- Ensure the league is public or you have access
- **For ESPN**: Verify the season is correct

**"No players imported"**
- Make sure you have Sleeper ADP data loaded
- Check that the league has completed rosters
- **For ESPN**: Ensure the season has completed rosters

**"Keeper analysis fails"**
- Verify rosters were imported successfully
- Check that current ADP data is available

### **ESPN-Specific Notes**
- ESPN requires season selection (2022, 2023, 2024)
- ESPN leagues must be public or you must have access
- Some ESPN leagues may have different roster structures

### **Getting Help**
1. Check the browser console for error messages
2. Verify your `.env` file has correct Supabase credentials
3. Ensure the database schema migration was completed

## 🎉 **Ready to Get Started?**

1. **Navigate to League Manager** from the main navigation
2. **Select your platform** (Sleeper or ESPN)
3. **For ESPN**: Choose the season
4. **Connect your league** using your league ID
5. **Import rosters** from the selected season
6. **Analyze keeper decisions** for each team
7. **Make informed decisions** for your upcoming draft!

---

**Need help?** Check the console logs and ensure all database tables are properly set up from the schema migration. 