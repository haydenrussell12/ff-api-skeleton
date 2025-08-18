# Roster Grading Math Documentation

This document explains the complete mathematical framework behind the roster grading system used in the Fantasy Football Draft Analyzer.

## Overview

The roster grading system evaluates each team's performance across all positions and provides an overall team grade from F to A+. The system uses a weighted scoring approach that considers both starter quality and depth at each position.

## Position Weights

Each position contributes differently to the overall team grade:

| Position | Weight | Contribution |
|----------|--------|--------------|
| QB       | 15%    | 15% of total grade |
| RB       | 25%    | 25% of total grade |
| WR       | 25%    | 25% of total grade |
| TE       | 15%    | 15% of total grade |
| K        | 5%     | 5% of total grade |
| DEF      | 15%    | 15% of total grade |

**Total Weight: 100%**

## Grade Thresholds

Grades are assigned based on numerical scores:

| Grade | Score Range | Description |
|-------|-------------|-------------|
| A+    | 95-100      | Elite performance |
| A     | 90-94       | Excellent performance |
| A-    | 85-89       | Very good performance |
| B+    | 80-84       | Good performance |
| B     | 75-79       | Above average performance |
| B-    | 70-74       | Average performance |
| C+    | 65-69       | Below average performance |
| C     | 60-64       | Poor performance |
| C-    | 55-59       | Very poor performance |
| D+    | 50-54       | Very weak performance |
| D     | 45-49       | Extremely weak performance |
| D-    | 40-44       | Minimal performance |
| F     | 0-39        | No meaningful performance |

## Position Benchmarks

Each position has defined projection thresholds that determine player quality:

### Quarterback (QB)
- **Elite**: ≥300 projected points → 95 points
- **Good**: ≥250 projected points → 85 points  
- **Average**: ≥200 projected points → 70 points
- **Below Average**: ≥150 projected points → 50 points
- **Poor**: <150 projected points → 30 points

### Running Back (RB)
- **Elite**: ≥250 projected points → 95 points
- **Good**: ≥200 projected points → 85 points
- **Average**: ≥150 projected points → 70 points
- **Below Average**: ≥100 projected points → 50 points
- **Poor**: <100 projected points → 30 points

### Wide Receiver (WR)
- **Elite**: ≥200 projected points → 95 points
- **Good**: ≥160 projected points → 85 points
- **Average**: ≥120 projected points → 70 points
- **Below Average**: ≥80 projected points → 50 points
- **Poor**: <80 projected points → 30 points

### Tight End (TE)
- **Elite**: ≥150 projected points → 95 points
- **Good**: ≥120 projected points → 85 points
- **Average**: ≥90 projected points → 70 points
- **Below Average**: ≥60 projected points → 50 points
- **Poor**: <60 projected points → 30 points

### Kicker (K)
- **Elite**: ≥140 projected points → 95 points
- **Good**: ≥120 projected points → 85 points
- **Average**: ≥100 projected points → 70 points
- **Below Average**: ≥80 projected points → 50 points
- **Poor**: <80 projected points → 30 points

### Defense (DEF)
- **Elite**: ≥120 projected points → 95 points
- **Good**: ≥100 projected points → 85 points
- **Average**: ≥80 projected points → 70 points
- **Below Average**: ≥60 projected points → 50 points
- **Poor**: <60 projected points → 30 points

## Position Grade Calculation

### Step 1: Starter Evaluation (60% of position grade)
- **Formula**: `starterScore = evaluatePlayerQuality(position, starter.projectedPoints, benchmarks)`
- **Weight**: 60% of total position score

### Step 2: Depth Evaluation (40% of position grade)
- **Formula**: `depthScore = Σ(playerScore × weight)`
- **Weight Distribution**:
  - 1st depth player: 40% weight
  - 2nd depth player: 30% weight  
  - 3rd depth player: 20% weight
  - 4th+ depth player: 10% weight (minimum)
- **Total Weight**: 40% of total position score

### Step 3: Quality Player Bonus
- **Formula**: `bonus = Math.min(10, qualityPlayers × 2)`
- **Condition**: Players with projections ≥ position average
- **Maximum Bonus**: 10 points

### Step 4: Depth Penalty
- **Penalty**: -15 points
- **Condition**: <2 players at QB, RB, WR, or TE positions

### Final Position Score Formula
```
positionScore = (starterScore × 0.6) + (depthScore × 0.4) + bonus - penalty
```

## Overall Team Grade Calculation

### Step 1: Weighted Position Scores
```
weightedScore = Σ(positionScore × positionWeight)
```

### Step 2: Normalization
```
overallScore = weightedScore / totalWeight
```

### Example Calculation
```
Team Example:
- QB: 85 points × 0.15 = 12.75
- RB: 90 points × 0.25 = 22.5
- WR: 80 points × 0.25 = 20.0
- TE: 75 points × 0.15 = 11.25
- K: 70 points × 0.05 = 3.5
- DEF: 85 points × 0.15 = 12.75

Total Weighted Score: 82.75
Overall Score: 82.75 / 1.0 = 82.75 → Grade: B+
```

## Advanced Features

### Position Balance Analysis
- **Variance Threshold**: 400 points
- **Formula**: `variance = Σ((score - mean)²) / n`
- **Imbalance Detection**: variance > 400 indicates position imbalance

### Depth Quality Assessment
- **Minimum Players**: 2+ for QB, RB, WR, TE
- **Optimal Depth**: 3-4 RBs, 4-5 WRs, 2+ TEs
- **Injury Risk Consideration**: Higher risk positions get depth recommendations

### Strategic Recommendations
- **Weakness Priority**: Focus on positions scoring <60
- **Strength Trading**: Consider trading from positions scoring >80
- **Balance Focus**: Address position imbalances first

## Example Team Analysis

### Team Roster
```
QB: Patrick Mahomes (320 pts) - Elite
RB: Christian McCaffrey (280 pts) - Elite, Breece Hall (220 pts) - Good
WR: Tyreek Hill (180 pts) - Good, Stefon Diggs (140 pts) - Average
TE: Travis Kelce (160 pts) - Elite
K: Justin Tucker (130 pts) - Good
DEF: San Francisco 49ers (110 pts) - Good
```

### Position Grades
```
QB: (95 × 0.6) + (0 × 0.4) + 0 = 57 + 0 + 0 = 57 → Grade: C-
RB: (95 × 0.6) + (85 × 0.4) + 10 = 57 + 34 + 10 = 101 → Grade: A+
WR: (85 × 0.6) + (70 × 0.4) + 0 = 51 + 28 + 0 = 79 → Grade: B
TE: (95 × 0.6) + (0 × 0.4) + 0 = 57 + 0 + 0 = 57 → Grade: C-
K: (85 × 0.6) + (0 × 0.4) + 0 = 51 + 0 + 0 = 51 → Grade: D+
DEF: (85 × 0.6) + (0 × 0.4) + 0 = 51 + 0 + 0 = 51 → Grade: D+
```

### Overall Grade
```
Overall Score = (57 × 0.15) + (101 × 0.25) + (79 × 0.25) + (57 × 0.15) + (51 × 0.05) + (51 × 0.15)
             = 8.55 + 25.25 + 19.75 + 8.55 + 2.55 + 7.65
             = 72.3 → Grade: B-
```

## Key Insights

1. **Starter Quality Dominates**: 60% of position grade comes from the best player
2. **Depth Matters**: 40% comes from backup players, encouraging roster depth
3. **Position Balance**: Weights ensure no single position dominates the overall grade
4. **Benchmark-Based**: All scoring is relative to established fantasy football projections
5. **Strategic Focus**: System identifies both immediate needs and trading opportunities

## Limitations

- **Projection Dependency**: Grades heavily depend on accuracy of projected points
- **Historical Bias**: Benchmarks based on typical fantasy football scoring patterns
- **League Context**: Doesn't account for league-specific scoring or roster requirements
- **Injury Risk**: While considered, doesn't fully quantify injury probability impact

## Future Enhancements

- **Dynamic Benchmarks**: Adjust thresholds based on league scoring settings
- **Injury Risk Scoring**: Incorporate historical injury data into player evaluations
- **League Context**: Consider league size and roster requirements in grading
- **Trend Analysis**: Factor in recent performance trends and offseason changes 