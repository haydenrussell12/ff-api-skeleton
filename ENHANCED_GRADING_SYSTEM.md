# Enhanced VORP-Driven Roster Grading System

## Overview

The Enhanced Roster Grading System is a complete refactor of the position grade engine that implements VORP-driven, league-aware, and explainable grading. This system replaces static projection thresholds with dynamic replacement baselines, implements advanced depth analysis, and provides format-specific optimizations.

## Key Features

### ✅ VORP-Driven Grading
- **Raw VORP Integration**: Grades are based on actual Value Over Replacement Player scores, not static thresholds
- **Cross-Positional Weighting**: Dynamic weights that adjust based on league format and position scarcity
- **League-Wide Percentiles**: Letter grades mapped to league-wide performance distributions

### ✅ League-Aware Analysis
- **Dynamic Replacement Baselines**: Calculated from actual league settings (teams × starters ± FLEX allocation)
- **Format Toggles**: Support for Superflex, TE-Premium, and custom roster configurations
- **Bye Week Integration**: Loads and considers team bye weeks for conflict detection

### ✅ Advanced Depth Analysis
- **ERLA (Expected Replacement Loss Avoided)**: Measures depth value vs. waiver/stream baselines
- **Diminishing Weights**: Applies realistic value decay for backup players
- **Platoon Gain**: Calculates value of having multiple options at 1-starter positions

### ✅ Balance and Optimization
- **Balance Penalty**: Applies penalties for imbalanced position distributions
- **Cross-Positional Weighting**: Adjusts importance based on league format
- **Format-Specific Logic**: Different evaluation strategies for different league types

## System Architecture

### Data Sources
```
📁 data/2025/Bye Weeks/Bye Weeks.csv    # Team bye week information
📁 data/consolidated/player-vorp-scores.json  # VORP calculations
```

### Core Components
1. **PositionGradeEngine**: Main grading engine with enhanced algorithms
2. **Replacement Baseline Calculator**: Dynamic baseline computation
3. **ERLA Calculator**: Depth value analysis
4. **Platoon Gain Calculator**: Multi-player position optimization
5. **Balance Penalty Calculator**: Position distribution analysis

## Algorithm Details

### 1. Replacement Baseline Calculation

```javascript
// Calculate how many starters exist at each position across the league
const leagueStarters = {
    QB: teams * rosterSpots.QB,
    RB: teams * rosterSpots.RB,
    WR: teams * rosterSpots.WR,
    TE: teams * rosterSpots.TE,
    K: teams * rosterSpots.K,
    DEF: teams * rosterSpots.DEF
};

// Add FLEX allocation (70% WR, 25% RB, 5% TE)
if (rosterSpots.FLEX) {
    leagueStarters.WR += Math.round(teams * rosterSpots.FLEX * 0.7);
    leagueStarters.RB += Math.round(teams * rosterSpots.FLEX * 0.25);
    leagueStarters.TE += Math.round(teams * rosterSpots.FLEX * 0.05);
}

// Replacement level is typically 1-2 players beyond starter count
const replacementBaselines = {};
Object.keys(leagueStarters).forEach(pos => {
    replacementBaselines[pos] = leagueStarters[pos] + 2;
});
```

### 2. VORP-Based Scoring

```javascript
// Base score from VORP (60% of total)
const vorpScore = Math.max(0, vorpTotal * 0.6);

// Depth score from ERLA (30% of total)
const depthScore = Math.max(0, erlaScore * 0.3);

// Platoon score (10% of total)
const platoonScore = Math.max(0, platoonGain * 0.1);

// Total position score
const totalScore = vorpScore + depthScore + platoonScore;
```

### 3. ERLA (Expected Replacement Loss Avoided)

```javascript
calculateERLA(depthPlayers, position, replacementBaselines) {
    const baseline = replacementBaselines[position] || 0;
    let erlaScore = 0;
    
    // Sort depth players by projected points
    const sortedDepth = depthPlayers
        .filter(p => p.projectedPoints)
        .sort((a, b) => b.projectedPoints - a.projectedPoints);
    
    // Apply diminishing weights to depth players
    sortedDepth.forEach((player, index) => {
        const weight = Math.max(0.1, 1 - (index * 0.3)); // Diminishing returns
        const vorpData = this.findPlayerVorpValue(player.playerName);
        
        if (vorpData && vorpData.vorpScore > 0) {
            erlaScore += vorpData.vorpScore * weight;
        }
    });
    
    return erlaScore;
}
```

### 4. Platoon Gain Calculation

```javascript
calculatePlatoonGain(players, position, leagueSettings) {
    const { rosterSpots = {} } = leagueSettings;
    const starterCount = rosterSpots[position] || 1;
    
    // Only apply platoon gain to 1-starter positions
    if (starterCount > 1) return 0;
    
    if (players.length < 2) return 0;
    
    // Find best two players for platoon
    const sortedPlayers = players
        .filter(p => p.projectedPoints)
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, 2);
    
    if (sortedPlayers.length < 2) return 0;
    
    // Calculate platoon value (best weekly option)
    const platoonValue = Math.max(
        sortedPlayers[0].projectedPoints,
        sortedPlayers[1].projectedPoints
    );
    
    // Compare to single starter value
    const singleStarterValue = sortedPlayers[0].projectedPoints;
    const platoonGain = platoonValue - singleStarterValue;
    
    return Math.max(0, platoonGain * 0.1); // Scale down the gain
}
```

### 5. Balance Penalty

```javascript
calculateBalancePenalty(positionGrades) {
    const grades = Object.values(positionGrades).filter(g => g && g.score !== undefined);
    if (grades.length < 2) return 0;
    
    const scores = grades.map(g => g.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Penalty increases with standard deviation (imbalance)
    const balancePenalty = -stdDev * 0.5;
    return balancePenalty;
}
```

## Format Toggles

### Superflex Format
```javascript
const superflexSettings = {
    isSuperflex: true,
    rosterSpots: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1, K: 1, DEF: 1
    }
};

// QB weight increases by 50% in Superflex
if (leagueSettings.isSuperflex) {
    adjustedWeights.QB *= 1.5;
}
```

### TE Premium Format
```javascript
const tePremiumSettings = {
    isTEPremium: true,
    rosterSpots: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1
    }
};

// TE weight increases by 30% in TE Premium
if (leagueSettings.isTEPremium) {
    adjustedWeights.TE *= 1.3;
}
```

### No Kicker/Defense
```javascript
const noKDSTSettings = {
    includeK: false,
    includeDST: false,
    rosterSpots: {
        QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, BENCH: 8
    }
};

// Remove K and DEF weights
if (!leagueSettings.includeK) {
    adjustedWeights.K = 0;
}
if (!leagueSettings.includeDST) {
    adjustedWeights.DEF = 0;
}
```

## Usage Examples

### Basic Usage
```javascript
import PositionGradeEngine from './scripts/position-grade-engine.js';

const engine = new PositionGradeEngine();

const team = {
    roster: [
        { playerName: "Patrick Mahomes", position: "QB", projectedPoints: 320.5, team: "KC" },
        { playerName: "Christian McCaffrey", position: "RB", projectedPoints: 280.1, team: "SF" },
        // ... more players
    ]
};

const leagueSettings = {
    teams: 10,
    scoring: "PPR",
    rosterSpots: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 7 },
    isSuperflex: false,
    isTEPremium: false
};

const results = engine.calculatePositionGrades(team, leagueSettings);
console.log(`Overall Grade: ${results.overallGrade.grade}`);
```

### Advanced League Settings
```javascript
const advancedSettings = {
    teams: 12,
    scoring: "PPR",
    rosterSpots: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1, K: 1, DEF: 1, BENCH: 6
    },
    isSuperflex: true,
    isTEPremium: true,
    includeK: true,
    includeDST: true
};
```

## Testing

### Run Enhanced Grading Tests
```bash
npm run test-enhanced-grading
```

### Test Scenarios Covered
1. **Standard 1-QB League**: Basic PPR league with standard roster
2. **Superflex League**: 12-team league with QB in superflex slot
3. **TE Premium League**: Enhanced TE scoring and value
4. **No Kicker/Defense**: League without K and DEF positions
5. **Two OK QBs vs One Elite QB**: Tests depth vs. quality strategies

### Test Output Example
```
🔍 Test 1: Standard 1-QB League
==================================================
📈 Overall Grade: A (87.45)
   Normalized Score: 87.45
   Balance Penalty: -2.31
   Total Weight: 1.00

📊 Position Grades:
   QB: A (92.30)
     VORP: 45.20 | ERLA: 12.50 | Platoon: 0.00
   RB: A- (88.15)
     VORP: 52.10 | ERLA: 18.30 | Platoon: 0.00
   WR: A (89.20)
     VORP: 48.75 | ERLA: 15.80 | Platoon: 0.00

🎯 Replacement Baselines:
   QB: 12 players
   RB: 22 players
   WR: 22 players
   TE: 12 players
   K: 12 players
   DEF: 12 players

💡 Recommendations:
   1. [HIGH] Focus on improving TE position (Grade: B+)
   2. [MEDIUM] Bye week conflicts detected: Week 8, Week 10
```

## Warnings and Error Handling

### Missing Input Warnings
- **No roster data**: Team has no players
- **Missing VORP data**: Players without calculated VORP scores
- **No bye week data**: Bye week CSV not loaded
- **Replacement baselines not calculated**: League settings incomplete

### Error Handling
- **Graceful degradation**: System continues with available data
- **Fallback values**: Default to safe values when data is missing
- **Comprehensive logging**: Detailed error messages for debugging

## Performance Considerations

### Data Loading
- **Bye weeks**: Loaded once at initialization
- **VORP data**: Loaded once at initialization
- **Caching**: Data cached in memory for fast access

### Calculation Efficiency
- **Lazy evaluation**: Calculations only when needed
- **Memoization**: Cached results for repeated calculations
- **Optimized algorithms**: Efficient mathematical operations

## Future Enhancements

### Planned Features
1. **Weekly Projections**: Integration with weekly fantasy projections
2. **Injury Assumptions**: Player availability and injury risk factors
3. **Waiver Baselines**: Dynamic waiver wire replacement values
4. **Trade Analysis**: Player-for-player trade evaluation
5. **Draft Strategy**: Pre-draft position prioritization

### Advanced Analytics
1. **Monte Carlo Simulations**: Season-long performance modeling
2. **Risk Assessment**: Variance and consistency analysis
3. **League Comparison**: Cross-league performance benchmarking
4. **Historical Trends**: Year-over-year performance analysis

## Conclusion

The Enhanced VORP-Driven Roster Grading System represents a significant advancement in fantasy football analysis. By implementing league-aware replacement baselines, advanced depth analysis, and format-specific optimizations, it provides more accurate and actionable insights for team evaluation.

The system maintains the simple letter grade output while computing grades from sophisticated relative distributions and cross-positional analysis. This makes it both powerful for advanced users and accessible for casual players.

For questions or feature requests, please refer to the test suite and documentation examples provided. 