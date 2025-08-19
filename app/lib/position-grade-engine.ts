type LeagueSettings = {
  teams?: number;
  rosterSpots?: { [key: string]: number };
  isSuperflex?: boolean;
  isTEPremium?: boolean;
  includeK?: boolean;
  includeDST?: boolean;
};

export default class PositionGradeEngine {
  private vorpLookup: Record<string, number> = {};

  constructor(vorpArray: Array<{ playerName?: string; vorp_score?: number; vorpScore?: number }> = []) {
    vorpArray.forEach((p) => {
      const name = (p.playerName || '').toLowerCase();
      const val = (p as any).vorpScore ?? p.vorp_score ?? 0;
      if (name) this.vorpLookup[name] = Number(val) || 0;
    });
  }

  calculatePositionGrades(team: any, settings: LeagueSettings = {}) {
    const groups: Record<string, any[]> = {};
    (team.roster || []).forEach((p: any) => {
      const pos = (p.position || '').toUpperCase();
      if (!pos) return;
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(p);
    });

    const positionGrades: Record<string, any> = {};
    Object.keys(groups).forEach((pos) => {
      const players = groups[pos];
      let vorpTotal = 0;
      let projectedTotal = 0;
      players.forEach((pl) => {
        projectedTotal += pl.projectedPoints || 0;
        const key = (pl.playerName || pl.name || '').toLowerCase();
        vorpTotal += this.vorpLookup[key] || 0;
      });
      const score = Math.max(0, vorpTotal * 0.6 + projectedTotal * 0.02);
      positionGrades[pos] = { score, grade: this.scoreToGrade(score), projectedPoints: projectedTotal, playerCount: players.length };
    });

    const overallScore = Object.values(positionGrades).reduce((sum: number, g: any) => sum + (g.score || 0), 0) / Math.max(1, Object.keys(positionGrades).length);
    const overallGrade = this.scoreToGrade(overallScore);

    return {
      overallGrade: { grade: overallGrade, score: overallScore },
      positionGrades,
      recommendations: this.generateRecommendations(positionGrades),
    };
  }

  private scoreToGrade(score: number) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'B-';
    if (score >= 40) return 'C+';
    if (score >= 30) return 'C';
    if (score >= 20) return 'C-';
    if (score >= 10) return 'D';
    return 'F';
  }

  private generateRecommendations(positionGrades: Record<string, any>) {
    const recs: any[] = [];
    // Find weakest position
    let weakest: string | null = null;
    let min = Infinity;
    Object.entries(positionGrades).forEach(([pos, g]) => {
      if ((g as any).score < min) {
        min = (g as any).score;
        weakest = pos;
      }
    });
    if (weakest) {
      recs.push({ type: 'weakness', priority: 'high', message: `Focus on improving ${weakest}` });
    }
    return recs;
  }
} 