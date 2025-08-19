type LeagueSettings = {
  teams?: number;
  rosterSpots?: { [key: string]: number };
  isSuperflex?: boolean;
  isTEPremium?: boolean;
  includeK?: boolean;
  includeDST?: boolean;
  scoring?: string;
};

export default class PositionGradeEngine {
  private vorpLookup: Record<string, number> = {};
  private leagueAverages: Record<string, number> = {};
  private leagueStdDevs: Record<string, number> = {};

  constructor(vorpArray: Array<{ playerName?: string; vorp_score?: number; vorpScore?: number }> = []) {
    vorpArray.forEach((p) => {
      const name = (p.playerName || '').toLowerCase();
      const val = (p as any).vorpScore ?? p.vorp_score ?? 0;
      if (name) this.vorpLookup[name] = Number(val) || 0;
    });
  }

  calculatePositionGrades(teams: any[], settings: LeagueSettings = {}) {
    const numTeams = teams.length || 12; // Default to 12-team league
    
    // Calculate league averages and standard deviations for each position
    this.calculateLeagueStats(teams);
    
    const teamGrades = teams.map(team => this.gradeTeam(team, numTeams, settings));
    
    // Normalize grades across all teams
    return this.normalizeGrades(teamGrades);
  }

  private calculateLeagueStats(teams: any[]) {
    const positionStats: Record<string, { points: number[], vorp: number[] }> = {};
    
    // Initialize position stats
    ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].forEach(pos => {
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

  private gradeTeam(team: any, numTeams: number, settings: LeagueSettings) {
    const roster = team.roster || [];
    
    // 1. Baseline Setup - Fill optimal starting lineup
    const starters = this.fillOptimalLineup(roster, settings);
    
    // 2. Calculate VORP and z-scores for starters
    const starterScores = this.calculateStarterScores(starters, numTeams);
    
    // 3. Calculate depth score from bench players
    const depthScore = this.calculateDepthScore(roster, starters);
    
    // 4. Calculate positional balance penalties
    const balancePenalty = this.calculatePositionalBalance(starters, numTeams);
    
    // 5. Combine scores with proper weighting
    const totalScore = this.combineScores(starterScores, depthScore, balancePenalty);
    
    return {
      teamId: team.teamId,
      teamName: team.teamName,
      totalScore,
      starterScores,
      depthScore,
      balancePenalty,
      starters,
      positionGrades: this.calculateIndividualPositionGrades(starters, numTeams)
    };
  }

  private fillOptimalLineup(roster: any[], settings: LeagueSettings) {
    const starters: Record<string, any[]> = {
      QB: [], RB: [], WR: [], TE: [], K: [], DEF: [], FLEX: []
    };
    
    // Sort players by projected points within each position
    const byPosition: Record<string, any[]> = {};
    ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].forEach(pos => {
      byPosition[pos] = roster
        .filter(p => (p.position || '').toUpperCase() === pos)
        .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
    });

    // Fill QB slots (1 or 2 for superflex)
    const qbSlots = settings.isSuperflex ? 2 : 1;
    starters.QB = byPosition.QB.slice(0, qbSlots);
    
    // Fill RB slots (typically 2-3)
    const rbSlots = Math.min(2, byPosition.RB.length);
    starters.RB = byPosition.RB.slice(0, rbSlots);
    
    // Fill WR slots (typically 2-4)
    const wrSlots = Math.min(3, byPosition.WR.length);
    starters.WR = byPosition.WR.slice(0, wrSlots);
    
    // Fill TE slots (1 or 2 for premium)
    const teSlots = settings.isTEPremium ? 2 : 1;
    starters.TE = byPosition.TE.slice(0, teSlots);
    
    // Fill K and DEF (1 each)
    starters.K = byPosition.K.slice(0, 1);
    starters.DEF = byPosition.DEF.slice(0, 1);
    
    // Fill FLEX with best remaining RB/WR/TE
    const flexCandidates = [
      ...byPosition.RB.slice(rbSlots),
      ...byPosition.WR.slice(wrSlots),
      ...byPosition.TE.slice(teSlots)
    ].sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
    
    starters.FLEX = flexCandidates.slice(0, 1);
    
    return starters;
  }

  private calculateStarterScores(starters: Record<string, any[]>, numTeams: number) {
    const scores: Record<string, number> = {};
    
    Object.keys(starters).forEach(pos => {
      const players = starters[pos];
      if (players.length === 0) {
        scores[pos] = 0;
        return;
      }
      
      let totalScore = 0;
      players.forEach(player => {
        const points = player.projectedPoints || 0;
        const vorp = this.getPlayerVorp(player.playerName || player.name || '');
        
        // Calculate z-score for this position
        const avg = this.leagueAverages[pos] || 0;
        const stdDev = this.leagueStdDevs[pos] || 1;
        const zScore = stdDev > 0 ? (points - avg) / stdDev : 0;
        
        // Combine VORP and z-score (VORP gets higher weight)
        const playerScore = (vorp * 0.7) + (zScore * 0.3);
        totalScore += playerScore;
      });
      
      // Apply position-specific weights
      if (pos === 'K' || pos === 'DEF') {
        totalScore *= 0.5; // Reduce weight for high-variance positions
      }
      
      scores[pos] = totalScore;
    });
    
    return scores;
  }

  private calculateDepthScore(roster: any[], starters: Record<string, any[]>): number {
    // Get all players not in starters
    const starterIds = new Set();
    Object.values(starters).flat().forEach(player => {
      starterIds.add(player.playerId || player.player_id);
    });
    
    const benchPlayers = roster.filter(player => 
      !starterIds.has(player.playerId || player.player_id)
    );
    
    // Calculate bench VORP with reduced weight
    let depthScore = 0;
    benchPlayers.forEach(player => {
      const vorp = this.getPlayerVorp(player.playerName || player.name || '');
      depthScore += vorp * 0.25; // 25% weight for bench players
    });
    
    return depthScore;
  }

  private calculatePositionalBalance(starters: Record<string, any[]>, numTeams: number): number {
    let penalty = 0;
    
    // Check each position for extreme weakness
    Object.entries(starters).forEach(([pos, players]) => {
      if (players.length === 0) {
        penalty += 2; // Heavy penalty for missing starters
        return;
      }
      
      const avgPoints = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0) / players.length;
      const leagueAvg = this.leagueAverages[pos] || 0;
      
      // Penalty if significantly below league average
      if (avgPoints < leagueAvg * 0.7) {
        penalty += (leagueAvg * 0.7 - avgPoints) / leagueAvg;
      }
    });
    
    return penalty;
  }

  private combineScores(starterScores: Record<string, number>, depthScore: number, balancePenalty: number): number {
    const starterTotal = Object.values(starterScores).reduce((sum, score) => sum + score, 0);
    const totalScore = starterTotal + depthScore - balancePenalty;
    
    return Math.max(0, totalScore); // Ensure non-negative
  }

  private calculateIndividualPositionGrades(starters: Record<string, any[]>, numTeams: number) {
    const grades: Record<string, any> = {};
    
    Object.entries(starters).forEach(([pos, players]) => {
      if (players.length === 0) {
        grades[pos] = { grade: 'F', score: 0, projectedPoints: 0, playerCount: 0 };
        return;
      }
      
      const totalPoints = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0);
      const avgPoints = totalPoints / players.length;
      
      // Grade based on comparison to league average
      const leagueAvg = this.leagueAverages[pos] || 0;
      const score = leagueAvg > 0 ? (avgPoints / leagueAvg) * 100 : 0;
      
      grades[pos] = {
        grade: this.scoreToGrade(score),
        score: score,
        projectedPoints: totalPoints,
        playerCount: players.length
      };
    });
    
    return grades;
  }

  private normalizeGrades(teamGrades: any[]) {
    if (teamGrades.length === 0) return teamGrades;
    
    // Sort by total score to determine percentiles
    const sorted = [...teamGrades].sort((a, b) => b.totalScore - a.totalScore);
    
    return sorted.map((team, index) => {
      const percentile = (index / sorted.length) * 100;
      const overallGrade = this.percentileToGrade(percentile);
      
      return {
        ...team,
        overallGrade: { grade: overallGrade, score: team.totalScore, percentile }
      };
    });
  }

  private percentileToGrade(percentile: number): string {
    if (percentile >= 90) return 'A+';
    if (percentile >= 80) return 'A';
    if (percentile >= 70) return 'A-';
    if (percentile >= 60) return 'B+';
    if (percentile >= 50) return 'B';
    if (percentile >= 40) return 'B-';
    if (percentile >= 30) return 'C+';
    if (percentile >= 20) return 'C';
    if (percentile >= 10) return 'C-';
    return 'D';
  }

  private scoreToGrade(score: number): string {
    if (score >= 120) return 'A+';
    if (score >= 110) return 'A';
    if (score >= 100) return 'A-';
    if (score >= 90) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 40) return 'C-';
    if (score >= 30) return 'D';
    return 'F';
  }

  private getPlayerVorp(playerName: string): number {
    if (!playerName) return 0;
    const normalizedName = playerName.toLowerCase();
    return this.vorpLookup[normalizedName] || 0;
  }
} 