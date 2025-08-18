# 🏈 Fantasy Football Draft Analyzer Guide

## 🎯 What This Tool Does

The Draft Analyzer is a powerful tool that analyzes your Sleeper mock drafts against expert player projections to:

- **Grade each team's draft performance** (A+ to F)
- **Compare your picks against expert rankings**
- **Identify your best and worst picks**
- **Show how you stack up against your competition**
- **Provide detailed analytics for every pick**

## 🚀 How to Use

### 1. **Get Your Sleeper Mock Draft URL**
- Complete a mock draft on Sleeper
- Copy the URL from your browser (looks like: `https://sleeper.app/draft/nfl/1234567890abcdef`)

### 2. **Access the Draft Analyzer**
- Go to your main site: `http://localhost:3000`
- Click the **"📊 Analyze Mock Drafts"** button
- Or go directly to: `http://localhost:3000/draft-analyzer`

### 3. **Input Your Draft URL**
- Paste your Sleeper mock draft URL
- Select your preferred projection source (ECR, FantasyPros, ESPN)
- Choose scoring format (Standard, PPR, Half-PPR)
- Click **"🚀 Analyze Draft"**

### 4. **Review Your Results**
The analyzer will show you:

#### **Draft Overview**
- Total teams and rounds
- Average team projection
- Best and worst team projections

#### **Grade Distribution**
- Visual chart showing how all teams performed
- See the spread of A+, A, B, C, D, and F grades

#### **Individual Team Analysis**
Each team gets a detailed card showing:
- **Draft Grade** (A+ to F)
- **Total Projection Points**
- **Average Pick Value**
- **All Picks** with expert rankings
- **🏆 Best Picks** (top 3 value picks)
- **⚠️ Worst Picks** (bottom 3 value picks)

## 📊 Understanding the Grades

### **Grade Scale**
- **A+ (90-100)**: Exceptional draft, consistently picked high-value players
- **A (85-89)**: Excellent draft, great value throughout
- **A- (80-84)**: Very good draft, solid value picks
- **B+ (75-79)**: Good draft, above average value
- **B (70-74)**: Solid draft, average value
- **B- (65-69)**: Decent draft, slightly below average
- **C+ (60-64)**: Average draft, mixed value
- **C (55-59)**: Below average draft
- **C- (50-54)**: Poor draft, many reaches
- **D+ (45-49)**: Bad draft, mostly reaches
- **D (40-44)**: Very bad draft
- **F (0-39)**: Terrible draft, consistently poor value

### **How Grades Are Calculated**
Grades are based on the **average expert ranking** of all your picks:
- Lower average rank = Better grade
- Higher average rank = Worse grade

## 🔍 Reading Your Results

### **Best Picks (🏆)**
These are players you drafted **later** than their expert ranking suggests:
- **Example**: Drafting a player ranked #25 in the 4th round
- **Why it's good**: You got a 2nd-round talent in the 4th round

### **Worst Picks (⚠️)**
These are players you drafted **earlier** than their expert ranking suggests:
- **Example**: Drafting a player ranked #50 in the 2nd round
- **Why it's bad**: You used a 2nd-round pick on 4th-round talent

### **Total Projection**
The sum of all your players' projected fantasy points for the season.

### **Average Pick Value**
Your total projection divided by number of picks - shows how much value you got per pick.

## 🎯 Strategy Tips

### **For Better Draft Grades**
1. **Don't reach too early** - Let value come to you
2. **Target players falling** - If a top-20 player is available in round 3, take them
3. **Balance positions** - Don't overload on one position early
4. **Consider ADP vs. Expert Rankings** - Sometimes experts rank players differently than ADP

### **Understanding Value**
- **Value Pick**: Player ranked #20 available in round 3
- **Reach**: Taking a player ranked #40 in round 2
- **Steal**: Getting a top-10 player in round 2

## 🛠️ Technical Details

### **How It Works**
1. **URL Parsing**: Extracts draft ID from Sleeper URL
2. **Data Fetching**: Gets draft data from Sleeper API
3. **Projection Matching**: Compares your picks against expert rankings
4. **Analysis**: Calculates grades, value, and statistics
5. **Display**: Shows comprehensive results with visual charts

### **Data Sources**
- **Sleeper API**: For draft data and picks
- **Your Database**: For expert projections and rankings
- **Real-time Analysis**: Every analysis uses current data

### **Supported Formats**
- **Standard Scoring**: Traditional fantasy scoring
- **PPR**: Point per reception scoring
- **Half-PPR**: 0.5 points per reception

## 🔧 Troubleshooting

### **Common Issues**

#### **"Invalid Sleeper URL"**
- Make sure you're using a **mock draft** URL, not a league URL
- URL should look like: `https://sleeper.app/draft/nfl/...`
- Not: `https://sleeper.app/league/...`

#### **"No projections found"**
- Run `npm run fetch-projections` to get current data
- Check that your database has projection data
- Verify the source/format combination exists

#### **"Analysis failed"**
- Check your internet connection
- Verify the Sleeper API is accessible
- Check the browser console for detailed errors

### **Getting Help**
1. **Check browser console** for JavaScript errors
2. **Verify your database** has projection data
3. **Test API endpoints** with `/health`
4. **Check server logs** for backend errors

## 📈 Advanced Features

### **Multiple Analysis**
- Analyze multiple drafts to compare performance
- Track improvement over time
- Compare different draft strategies

### **Position Analysis**
- See how you drafted each position
- Identify position strengths/weaknesses
- Plan future draft strategies

### **Competition Analysis**
- See how you rank against other teams
- Identify the toughest competition
- Learn from other successful drafters

## 🚀 Next Steps

### **Immediate Actions**
1. **Test with a mock draft** - Try the tool with a recent draft
2. **Analyze your strategy** - See where you can improve
3. **Compare sources** - Try different projection sources

### **Future Enhancements**
- **Historical tracking** - Save and compare multiple drafts
- **Strategy recommendations** - Get AI-powered draft advice
- **League integration** - Analyze real league drafts
- **Mobile app** - Draft analysis on the go

## 💡 Pro Tips

1. **Use multiple sources** - Compare ECR vs. FantasyPros vs. ESPN
2. **Analyze early and often** - Don't wait until the end of draft season
3. **Learn from mistakes** - Use worst picks to improve future drafts
4. **Track trends** - See how your drafting improves over time
5. **Share results** - Compare with friends to learn together

---

**Ready to analyze your draft?** 🚀

Head to `http://localhost:3000/draft-analyzer` and start improving your fantasy football game! 