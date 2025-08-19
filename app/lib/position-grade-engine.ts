type LeagueSettings = {
  teams?: number;
  rosterSpots?: { [key: string]: number };
  isSuperflex?: boolean;
  isTEPremium?: boolean;
  includeK?: boolean;
  includeDST?: boolean;
  scoring?: string;
  leagueType?: string;
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
    const positionRequirements = this.getPositionRequirements(leagueType);
    
    // Calculate position grades for each team first
    const teamsWithPositionGrades = teams.map(team => {
      const positionGrades = this.calculateTeamPositionGrades(team, positionRequirements);
      return {
        ...team,
        positionGrades
      };
    });
    
    // Calculate overall grades based on actual performance, not forced percentiles
    const teamsWithOverallScores = teamsWithPositionGrades.map(team => {
      // Calculate overall score based on optimal lineup points
      const overallScore = team.optimalLineupPoints || 0;
      
      // Convert to letter grade based on actual performance thresholds
      const overallGrade = this.scoreToGrade(overallScore);
      
      return {
        ...team,
        overallGrade: {
          grade: overallGrade,
          score: overallScore,
          rawScore: overallScore
        }
      };
    });
    
    return teamsWithOverallScores;
  }

  private calculateTeamPositionGrades(team: any, positionRequirements: string[]) {
    const positionGrades: Record<string, any> = {};
    
    positionRequirements.forEach(pos => {
      if (pos === 'FLEX' || pos === 'SUPERFLEX') {
        // Handle flex positions specially
        const flexPlayers = this.getFlexPlayers(team, pos);
        if (flexPlayers.length > 0) {
          const grade = this.gradePositionSimple(flexPlayers, pos);
          positionGrades[pos] = grade;
        }
      } else {
        // Handle regular positions
        const players = this.getPositionPlayers(team, pos);
        if (players.length > 0) {
          const grade = this.gradePositionSimple(players, pos);
          positionGrades[pos] = grade;
        }
      }
    });
    
    return positionGrades;
  }

  private gradePositionSimple(players: any[], position: string) {
    if (players.length === 0) return { grade: '—', score: 0, reason: 'No players' };
    
    const totalPoints = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0);
    
    // Simple grading based on projected points thresholds for different positions
    let grade = 'C';
    let gradeScore = totalPoints;
    
    // Position-specific scoring thresholds (approximate)
    const thresholds: Record<string, { excellent: number, good: number, average: number, poor: number }> = {
      'QB': { excellent: 25, good: 22, average: 18, poor: 15 },
      'RB': { excellent: 40, good: 30, average: 22, poor: 15 }, // 2 RBs
      'WR': { excellent: 40, good: 30, average: 22, poor: 15 }, // 2 WRs  
      'TE': { excellent: 15, good: 12, average: 9, poor: 6 },
      'FLEX': { excellent: 20, good: 15, average: 12, poor: 8 },
      'SUPERFLEX': { excellent: 25, good: 20, average: 15, poor: 10 },
      'K': { excellent: 10, good: 8, average: 6, poor: 4 },
      'DEF': { excellent: 12, good: 9, average: 7, poor: 5 }
    };
    
    const threshold = thresholds[position] || thresholds['FLEX'];
    
    if (totalPoints >= threshold.excellent) grade = 'A+';
    else if (totalPoints >= threshold.good) grade = 'A';
    else if (totalPoints >= threshold.average) grade = 'B';
    else if (totalPoints >= threshold.poor) grade = 'C';
    else grade = 'D';
    
    return {
      grade,
      score: totalPoints,
      reason: this.generatePositionReason(grade, 0, position)
    };
  }

  private getFlexPlayers(team: any, flexType: string) {
    const flexPositions = flexType === 'SUPERFLEX' ? ['QB', 'RB', 'WR', 'TE'] : ['RB', 'WR', 'TE'];
    const allFlexPlayers: any[] = [];
    
    flexPositions.forEach(pos => {
      const players = this.getPositionPlayers(team, pos);
      allFlexPlayers.push(...players);
    });
    
    // Sort by projected points and take top players
    return allFlexPlayers
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
      .slice(0, 3); // Top 3 for flex grading
  }

  private getPositionPlayers(team: any, position: string) {
    if (!team.optimalLineup || !team.optimalLineup[position]) return [];
    return team.optimalLineup[position] || [];
  }

  private gradePosition(players: any[], position: string) {
    if (players.length === 0) return { grade: '—', score: 0, reason: 'No players' };
    
    const totalPoints = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0);
    const avgVorp = players.reduce((sum, p) => sum + (p.vorpScore || 0), 0) / players.length;
    
    // Get league average for this position
    const leagueAvg = this.leagueAverages[position] || 0;
    const leagueStdDev = this.leagueStdDevs[position] || 1;
    
    // Calculate z-score
    const zScore = leagueStdDev > 0 ? (totalPoints - leagueAvg) / leagueStdDev : 0;
    
    // Convert to grade
    const grade = this.zScoreToGrade(zScore);
    
    return {
      grade,
      score: totalPoints,
      zScore,
      avgVorp,
      reason: this.generatePositionReason(grade, zScore, position)
    };
  }

  private calculateOverallGrade(team: any, positionGrades: Record<string, any>) {
    // Calculate weighted overall score based on position grades
    const positionWeights: Record<string, number> = {
      'QB': 1.2,    // QB gets slight premium
      'RB': 1.0,    // RB is baseline
      'WR': 1.0,    // WR is baseline
      'TE': 0.9,    // TE slightly less important
      'FLEX': 0.8,  // Flex is bonus
      'SUPERFLEX': 1.1, // Superflex is premium
      'K': 0.3,     // Kicker much less important
      'DEF': 0.4    // Defense less important
    };
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    Object.entries(positionGrades).forEach(([pos, grade]) => {
      if (grade && grade.grade !== '—') {
        const weight = positionWeights[pos] || 1.0;
        const gradeScore = this.gradeToScore(grade.grade);
        totalWeightedScore += gradeScore * weight;
        totalWeight += weight;
      }
    });
    
    if (totalWeight === 0) return { grade: '—', score: 0 };
    
    const overallScore = totalWeightedScore / totalWeight;
    const overallGrade = this.scoreToGrade(overallScore);
    
    return {
      grade: overallGrade,
      score: overallScore,
      totalWeightedScore,
      totalWeight
    };
  }

  private zScoreToGrade(zScore: number): string {
    if (zScore >= 1.5) return 'A+';
    if (zScore >= 1.0) return 'A';
    if (zScore >= 0.5) return 'B+';
    if (zScore >= 0.0) return 'B';
    if (zScore >= -0.5) return 'C+';
    if (zScore >= -1.0) return 'C';
    if (zScore >= -1.5) return 'D+';
    if (zScore >= -2.0) return 'D';
    return 'F';
  }

  private gradeToScore(grade: string): number {
    const gradeScores: Record<string, number> = {
      'A+': 95, 'A': 90, 'A-': 85,
      'B+': 80, 'B': 75, 'B-': 70,
      'C+': 65, 'C': 60, 'C-': 55,
      'D+': 50, 'D': 45, 'D-': 40,
      'F': 30
    };
    return gradeScores[grade] || 50;
  }

  private scoreToGrade(score: number): string {
    // Realistic scoring thresholds based on actual fantasy football performance
    // These thresholds allow for genuine grade distribution based on team quality
    
    if (score >= 200) return 'A+';      // Exceptional team
    if (score >= 185) return 'A';       // Excellent team  
    if (score >= 170) return 'A-';      // Very good team
    if (score >= 155) return 'B+';      // Good team
    if (score >= 140) return 'B';       // Above average team
    if (score >= 125) return 'B-';      // Slightly above average
    if (score >= 110) return 'C+';      // Average team
    if (score >= 95) return 'C';        // Below average team
    if (score >= 80) return 'C-';       // Poor team
    if (score >= 65) return 'D+';       // Very poor team
    if (score >= 50) return 'D';        // Terrible team
    return 'F';                          // Complete failure
  }

  private generatePositionReason(grade: string, zScore: number, position: string): string {
    if (grade.startsWith('A')) return `Excellent ${position} performance`;
    if (grade.startsWith('B')) return `Good ${position} performance`;
    if (grade.startsWith('C')) return `Average ${position} performance`;
    if (grade.startsWith('D')) return `Below average ${position} performance`;
    return `Poor ${position} performance`;
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

  private getPositionRequirements(leagueType: string = 'standard') {
    const requirements = {
      standard: ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'],
      superflex: ['QB', 'RB', 'WR', 'TE', 'FLEX', 'SUPERFLEX', 'K', 'DEF'],
      '2qb': ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF']
    };
    
    return requirements[leagueType as keyof typeof requirements] || requirements.standard;
  }
} 