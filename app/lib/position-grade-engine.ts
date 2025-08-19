type LeagueSettings = {
  scoring?: string;
  leagueType?: string;
  superflexSlots?: number;
  teams?: number;
  rounds?: number;
};

export default class PositionGradeEngine {
  private vorpLookup: Record<string, number> = {};
  private leagueAverages: Record<string, number> = {};
  private leagueStdDevs: Record<string, number> = {};

  constructor(vorpArray: Array<{ playerName?: string; vorp_score?: number; vorpScore?: number }> = []) {
    vorpArray.forEach((p) => {
      const name = (p.playerName || '').toLowerCase();
      const val = (p as any).vorpScore ?? p.vorp_score ?? 0;
      if (name) this.vorpLookup[name] = Number(val);
    });
  }

  calculatePositionGrades(teams: any[], settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const actualTeams = settings.teams || 12;
    const actualRounds = settings.rounds || 16;
    
    // Get dynamic position requirements based on actual draft data
    const positionRequirements = this.getPositionRequirements(leagueType, actualTeams, actualRounds);
    
    console.log('📊 Position grade calculation:', {
      leagueType,
      actualTeams,
      actualRounds,
      positionRequirements: {
        ...positionRequirements,
        _metadata: positionRequirements._metadata
      }
    });

    const teamsWithPositionGrades = teams.map(team => {
      const rosterConstructionGrade = this.analyzeRosterConstruction(team, positionRequirements, leagueType);
      return {
        ...team,
        positionGrades: rosterConstructionGrade
      };
    });

    // Calculate overall team grades based on roster construction quality
    const teamsWithOverallGrades = teamsWithPositionGrades.map(team => {
      const overallGrade = this.calculateOverallRosterGrade(team.positionGrades);
      return {
        ...team,
        overallGrade
      };
    });

    return teamsWithOverallGrades;
  }

  private analyzeRosterConstruction(team: any, requirements: any, leagueType: string) {
    const analysis = {
      positionalBalance: this.analyzePositionalBalance(team, requirements, leagueType),
      depthStrategy: this.analyzeDepthStrategy(team, requirements),
      adpValue: this.analyzeADPValue(team),
      keeperValue: this.analyzeKeeperValue(team),
      overallScore: 0,
      grade: 'F'
    };

    // Calculate overall score (weighted average)
    const weights = {
      positionalBalance: 0.35,  // Most important - roster construction
      depthStrategy: 0.30,       // Depth and bench quality
      adpValue: 0.25,           // Draft value and steals
      keeperValue: 0.10          // Keeper advantage (if applicable)
    };

    analysis.overallScore = 
      (analysis.positionalBalance.score * weights.positionalBalance) +
      (analysis.depthStrategy.score * weights.depthStrategy) +
      (analysis.adpValue.score * weights.adpValue) +
      (analysis.keeperValue.score * weights.keeperValue);

    analysis.grade = this.scoreToGrade(analysis.overallScore);
    
    return analysis;
  }

  private analyzePositionalBalance(team: any, requirements: any, leagueType: string) {
    const roster = team.roster || [];
    const positionCounts: Record<string, number> = {};
    const positionValues: Record<string, number[]> = {};
    
    // Count players and collect projected points by position
    roster.forEach((player: any) => {
      const pos = player.position || 'UNK';
      if (!positionCounts[pos]) {
        positionCounts[pos] = 0;
        positionValues[pos] = [];
      }
      positionCounts[pos]++;
      positionValues[pos].push(player.projectedPoints || 0);
    });

    let balanceScore = 100;
    let issues: string[] = [];

    // Analyze each position against requirements
    Object.entries(requirements).forEach(([pos, required]) => {
      if (['flexPositions', 'superflexPositions', 'totalStarters', '_metadata'].includes(pos)) return;
      
      const actual = positionCounts[pos] || 0;
      const requiredNum = required as number;
      
      if (actual < requiredNum) {
        // Position is underfilled
        const deficit = requiredNum - actual;
        balanceScore -= (deficit * 15); // Major penalty for missing starters
        issues.push(`${pos}: Missing ${deficit} starter(s)`);
      } else if (actual > requiredNum + 2) {
        // Position is overloaded (more than 2 extra)
        const excess = actual - requiredNum - 2;
        balanceScore -= (excess * 8); // Penalty for overloading
        issues.push(`${pos}: ${excess} too many players`);
      }
    });

    // Check for critical position gaps
    const criticalPositions = ['QB', 'RB', 'WR', 'TE'];
    criticalPositions.forEach(pos => {
      if (!positionCounts[pos] || positionCounts[pos] === 0) {
        balanceScore -= 25; // Critical penalty for missing entire position
        issues.push(`${pos}: Position completely missing`);
      }
    });

    // Special analysis for league types
    if (leagueType === 'superflex' && (!positionCounts['QB'] || positionCounts['QB'] < 2)) {
      balanceScore -= 20; // Superflex needs QB depth
      issues.push('Superflex: Insufficient QB depth');
    }

    if (leagueType === '2qb' && (!positionCounts['QB'] || positionCounts['QB'] < 2)) {
      balanceScore -= 30; // 2QB needs exactly 2 QBs
      issues.push('2QB: Must have exactly 2 QBs');
    }

    return {
      score: Math.max(0, balanceScore),
      issues,
      positionCounts,
      analysis: `Positional balance analysis: ${issues.length > 0 ? issues.join(', ') : 'Well balanced'}`
    };
  }

  private analyzeDepthStrategy(team: any, requirements: any) {
    const roster = team.roster || [];
    const starters = roster.slice(0, requirements.totalStarters || 9);
    const bench = roster.slice(requirements.totalStarters || 9);
    
    let depthScore = 100;
    let analysis: string[] = [];

    // Analyze bench quality
    if (bench.length === 0) {
      depthScore -= 30;
      analysis.push('No bench players');
    } else {
      // Check if bench has viable starters for bye weeks
      const benchQuality = bench.map((p: any) => p.projectedPoints || 0);
      const avgBenchPoints = benchQuality.reduce((sum: number, pts: number) => sum + pts, 0) / benchQuality.length;
      
      if (avgBenchPoints < 80) {
        depthScore -= 15;
        analysis.push('Weak bench quality');
      } else if (avgBenchPoints > 120) {
        depthScore += 10; // Bonus for strong bench
        analysis.push('Strong bench quality');
      }

      // Check position diversity on bench
      const benchPositions = [...new Set(bench.map((p: any) => p.position))];
      if (benchPositions.length < 3) {
        depthScore -= 10;
        analysis.push('Limited bench position diversity');
      }
    }

    // Check for injury risk (players with low projected points as starters)
    const weakStarters = starters.filter((p: any) => (p.projectedPoints || 0) < 60);
    if (weakStarters.length > 2) {
      depthScore -= 20;
      analysis.push(`${weakStarters.length} weak starters`);
    }

    return {
      score: Math.max(0, depthScore),
      analysis: analysis.length > 0 ? analysis.join(', ') : 'Good depth strategy',
      benchSize: bench.length,
      avgBenchPoints: bench.length > 0 ? bench.map((p: any) => p.projectedPoints || 0).reduce((sum: number, pts: number) => sum + pts, 0) / bench.length : 0
    };
  }

  private analyzeADPValue(team: any) {
    const roster = team.roster || [];
    let adpScore = 100;
    let steals: string[] = [];
    let reaches: string[] = [];
    let analysis: string[] = [];

    roster.forEach((player: any) => {
      const adp = player.adpValue || 0;
      const round = player.round || 0;
      const projectedPoints = player.projectedPoints || 0;
      
      if (adp > 0 && round > 0) {
        const adpRound = Math.ceil(adp / 12); // Convert ADP to approximate round
        const roundDiff = adpRound - round;
        
        if (roundDiff > 2) {
          // Player drafted much earlier than ADP (reach)
          adpScore -= 8;
          reaches.push(`${player.playerName} (Round ${round}, ADP ~${adpRound})`);
        } else if (roundDiff < -2) {
          // Player drafted much later than ADP (steal)
          adpScore += 5;
          steals.push(`${player.playerName} (Round ${round}, ADP ~${adpRound})`);
        }
      }
    });

    // Bonus for overall draft value
    if (steals.length > reaches.length) {
      adpScore += 10;
      analysis.push(`More steals (${steals.length}) than reaches (${reaches.length})`);
    } else if (reaches.length > steals.length) {
      adpScore -= 10;
      analysis.push(`More reaches (${reaches.length}) than steals (${steals.length})`);
    }

    return {
      score: Math.max(0, Math.min(100, adpScore)),
      steals,
      reaches,
      analysis: analysis.length > 0 ? analysis.join(', ') : 'Balanced ADP strategy',
      stealCount: steals.length,
      reachCount: reaches.length
    };
  }

  private analyzeKeeperValue(team: any) {
    // For now, assume no keepers - this can be enhanced later
    // Keeper analysis would look at:
    // - How many keepers they have
    // - What round value those keepers represent
    // - How much of an advantage they provide
    
    return {
      score: 100, // Neutral score for now
      analysis: 'No keeper analysis available',
      keepers: [],
      keeperAdvantage: 0
    };
  }

  private calculateOverallRosterGrade(positionGrades: any) {
    const score = positionGrades.overallScore;
    
    return {
      score: Math.round(score * 100) / 100,
      grade: positionGrades.grade,
      summary: this.generateRosterSummary(positionGrades),
      breakdown: {
        positionalBalance: positionGrades.positionalBalance,
        depthStrategy: positionGrades.depthStrategy,
        adpValue: positionGrades.adpValue,
        keeperValue: positionGrades.keeperValue
      }
    };
  }

  private generateRosterSummary(positionGrades: any) {
    const { positionalBalance, depthStrategy, adpValue } = positionGrades;
    
    let summary = `Overall Roster Grade: ${positionGrades.grade} (${Math.round(positionGrades.overallScore * 100) / 100}/100)\n\n`;
    
    // Positional Balance Summary
    summary += `Positional Balance: ${positionalBalance.score}/100\n`;
    if (positionalBalance.issues.length > 0) {
      summary += `Issues: ${positionalBalance.issues.join(', ')}\n`;
    }
    
    // Depth Strategy Summary
    summary += `\nDepth Strategy: ${depthStrategy.score}/100\n`;
    summary += `Bench Size: ${depthStrategy.benchSize} players\n`;
    summary += `Analysis: ${depthStrategy.analysis}\n`;
    
    // ADP Value Summary
    summary += `\nDraft Value: ${adpValue.score}/100\n`;
    summary += `Steals: ${adpValue.stealCount}, Reaches: ${adpValue.reachCount}\n`;
    summary += `Analysis: ${adpValue.analysis}`;
    
    return summary;
  }

  private scoreToGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    if (score >= 35) return 'D-';
    return 'F';
  }

  private calculateLeagueStats(teams: any[], positionRequirements: string[]) {
    const positionStats: Record<string, { points: number[], vorp: number[] }> = {};
    
    // Initialize position stats
    positionRequirements.forEach(pos => {
      positionStats[pos] = { points: [], vorp: [] };
    });

    // Collect all player stats across teams
    teams.forEach(team => {
      (team.roster || []).forEach((player: any) => {
        const pos = (player.position || '').toUpperCase();
        if (!pos || !positionStats[pos]) return;
        
        const points = player.projectedPoints || 0;
        const vorp = this.getPlayerVorp(player.playerName || player.name || '');
        
        positionStats[pos].points.push(points);
        positionStats[pos].vorp.push(vorp);
      });
    });

    // Calculate averages and standard deviations
    Object.keys(positionStats).forEach(pos => {
      const points = positionStats[pos].points.filter(p => p > 0);
      const vorp = positionStats[pos].vorp.filter(v => v !== 0);
      
      if (points.length > 0) {
        this.leagueAverages[pos] = points.reduce((sum, p) => sum + p, 0) / points.length;
        this.leagueStdDevs[pos] = this.calculateStdDev(points, this.leagueAverages[pos]);
      }
      
      if (vorp.length > 0) {
        this.leagueAverages[`${pos}_VORP`] = vorp.reduce((sum, v) => sum + v, 0) / vorp.length;
        this.leagueStdDevs[`${pos}_VORP`] = this.calculateStdDev(vorp, this.leagueAverages[`${pos}_VORP`]);
      }
    });
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private getPlayerVorp(playerName: string): number {
    if (!playerName) return 0;
    const normalizedName = playerName.toLowerCase();
    return this.vorpLookup[normalizedName] || 0;
  }

  private getPositionRequirements(leagueType: string = 'standard', actualTeams: number = 12, actualRounds: number = 16) {
    // Fixed starter requirements - bench size scales with rounds, not starters
    const baseRequirements = {
      standard: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1, // 9 starters
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      },
      superflex: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1, // 9 starters (QB eligible in flex)
        flexPositions: ['QB', 'RB', 'WR', 'TE'],
        superflexPositions: []
      },
      '2qb': {
        QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1, // 10 starters
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      },
      '2flex': {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DEF: 1, K: 1, // 10 starters
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      },
      'robs-bullshit': {
        QB: 2, RB: 2, WR: 3, TE: 1, FLEX: 2, DEF: 1, K: 1, // 12 starters (THE BEAST!)
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      }
    };

    const requirements = baseRequirements[leagueType as keyof typeof baseRequirements] || baseRequirements.standard;
    
    // Calculate total starters (fixed, doesn't change with rounds)
    const totalStarters = Object.entries(requirements)
      .filter(([key]) => !['flexPositions', 'superflexPositions'].includes(key))
      .reduce((sum, [_, count]) => sum + (typeof count === 'number' ? count : 0), 0);

    return {
      ...requirements,
      totalStarters,
      _metadata: {
        actualTeams,
        actualRounds,
        leagueType,
        calculatedAt: new Date().toISOString()
      }
    };
  }

  // Calculate replacement baselines for VORP calculations
  calculateReplacementBaselines(settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const superflexSlots = settings.superflexSlots || 0;
    const teams = settings.teams || 12;
    
    const baselines = {
      QB: teams * (1 + superflexSlots), // QB demand increases with superflex slots
      RB: teams * 2, // Standard RB demand
      WR: teams * 2, // Standard WR demand  
      TE: teams * 1, // Standard TE demand
      K: teams * 1,
      DEF: teams * 1
    };
    
    return baselines;
  }
} 