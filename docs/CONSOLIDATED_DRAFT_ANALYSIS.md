# Consolidated Draft Analysis

## Overview

The draft analyzer now provides a **consolidated view** that shows both ADP-based draft value AND projected fantasy points for each team in one comprehensive analysis. This gives users a complete picture of their draft performance.

## What You Get

### 1. **ADP Value Analysis**
- **Positive values** = Good picks (players drafted later than their ADP)
- **Negative values** = Reached picks (players drafted earlier than their ADP)
- **Example**: +5 means you got a player 5 picks later than expected (good value)

### 2. **Projected Fantasy Points**
- Total projected points your roster will score
- Based on current fantasy projections from FantasyPros/ESPN
- Helps assess roster strength and potential

### 3. **Consolidated Score (0-100)**
- Combines both metrics: **60% ADP value, 40% projected points**
- Provides an overall grade that balances draft efficiency and roster potential
- **90-100**: Exceptional draft
- **80-89**: Excellent draft  
- **70-79**: Very good draft
- **60-69**: Good draft
- **50-59**: Average draft
- **Below 50**: Below average draft

## API Endpoints

### Full Analysis: `POST /api/analyze-draft`
```json
{
  "draftUrl": "https://sleeper.com/draft/nfl/1234567890",
  "source": "fantasypros",
  "format": "standard",
  "evaluationMode": "consolidated"
}
```

### Quick Summary: `POST /api/draft-summary`
```json
{
  "draftUrl": "https://sleeper.com/draft/nfl/1234567890",
  "source": "fantasypros", 
  "format": "standard"
}
```

## Team Analysis Output

Each team now shows:

```json
{
  "team_name": "Team 1",
  "draft_grade": "A",
  "adp_grade": "A+",
  "projection_grade": "B+",
  "consolidated_score": 85,
  "key_metrics": {
    "avg_adp_value": "2.50",
    "total_projected_points": "2450",
    "draft_efficiency": "68.8%"
  },
  "best_pick": "Christian McCaffrey",
  "worst_pick": "Tyler Lockett"
}
```

## Key Benefits

1. **No More Switching**: See both metrics in one view
2. **Better Decision Making**: Understand if you got value AND built a strong roster
3. **Comprehensive Grading**: Separate grades for ADP performance and projection potential
4. **Actionable Insights**: Identify your best and worst picks with context

## Example Use Cases

- **Draft Review**: "Did I get good value AND build a strong roster?"
- **Trade Analysis**: "Is this trade worth it based on ADP value and projected points?"
- **Roster Management**: "Which positions need attention based on projections?"
- **League Comparison**: "How does my draft stack up against others in both value and potential?"

## Technical Details

- **ADP Data**: Uses 2025 FantasyPros ADP rankings (PPR + Standard)
- **Projections**: Combines FantasyPros and ESPN projections
- **Scoring**: Weighted average with ADP value prioritized (60%) over projections (40%)
- **Normalization**: Both metrics converted to 0-100 scale before combining

## Getting Started

1. Use `evaluationMode: 'consolidated'` in your draft analysis requests
2. The system automatically calculates both metrics for every pick
3. Review the consolidated score and individual grades
4. Use the detailed breakdown to identify areas for improvement

This consolidated approach gives you the complete picture of your draft performance in one easy-to-understand view! 