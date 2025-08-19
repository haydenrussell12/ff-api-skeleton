export type LeagueSettings = {
  qb?: number;
  rb?: number;
  wr?: number;
  te?: number;
  flex?: number;
  def?: number;
  k?: number;
  superflex?: boolean;
  scoring?: 'standard' | 'ppr' | 'half-ppr';
};

export default class OptimalLineupEngine {
  private defaultLeagueSettings: LeagueSettings = {
    qb: 1,
    rb: 2,
    wr: 2,
    te: 1,
    flex: 1,
    def: 1,
    k: 1,
    superflex: false,
    scoring: 'ppr',
  };

  calculateOptimalLineup(roster: any[], leagueSettings: LeagueSettings = {}) {
    const settings: Required<LeagueSettings> = { ...this.defaultLeagueSettings, ...leagueSettings } as any;

    const playersByPosition = this.groupPlayersByPosition(roster);
    const optimalLineup = this.findOptimalLineup(playersByPosition, settings);
    const totalProjectedPoints = this.calculateTotalProjectedPoints(optimalLineup);
    const benchPlayers = this.getBenchPlayers(roster, optimalLineup);
    const benchPoints = this.calculateTotalProjectedPoints(benchPlayers);

    return {
      optimalLineup,
      totalProjectedPoints,
      benchPlayers,
      benchPoints,
      analysis: this.analyzeLineup(optimalLineup, settings),
    };
  }

  private groupPlayersByPosition(roster: any[]) {
    const positions: Record<string, any[]> = {};
    roster.forEach((player) => {
      const pos = (player.position || '').toUpperCase();
      if (!pos) return;
      if (!positions[pos]) positions[pos] = [];
      positions[pos].push({ ...player, projectedPoints: player.projectedPoints || 0 });
    });
    Object.keys(positions).forEach((pos) => {
      positions[pos].sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
    });
    return positions;
  }

  private findOptimalLineup(playersByPosition: Record<string, any[]>, settings: Required<LeagueSettings>) {
    const lineup: Record<string, any[]> = { QB: [], RB: [], WR: [], TE: [], FLEX: [], DEF: [], K: [] };
    // Required slots
    if (settings.qb && playersByPosition.QB) lineup.QB = playersByPosition.QB.slice(0, settings.qb);
    if (settings.rb && playersByPosition.RB) lineup.RB = playersByPosition.RB.slice(0, settings.rb);
    if (settings.wr && playersByPosition.WR) lineup.WR = playersByPosition.WR.slice(0, settings.wr);
    if (settings.te && playersByPosition.TE) lineup.TE = playersByPosition.TE.slice(0, settings.te);
    if (settings.def && playersByPosition.DEF) lineup.DEF = playersByPosition.DEF.slice(0, settings.def);
    if (settings.k && playersByPosition.K) lineup.K = playersByPosition.K.slice(0, settings.k);

    // Flex
    if (settings.flex && settings.flex > 0) {
      const used = new Set<string>();
      Object.values(lineup).forEach((arr) => {
        (arr || []).forEach((p: any) => used.add(p.playerId || p.playerName || p.name));
      });
      const candidates: any[] = [];
      ['RB', 'WR', 'TE'].forEach((p) => {
        (playersByPosition[p] || []).forEach((pl) => {
          const id = pl.playerId || pl.playerName || pl.name;
          if (!used.has(id)) candidates.push(pl);
        });
      });
      if (settings.superflex) {
        (playersByPosition.QB || []).forEach((pl) => {
          const id = pl.playerId || pl.playerName || pl.name;
          if (!used.has(id)) candidates.push(pl);
        });
      }
      candidates.sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
      lineup.FLEX = candidates.slice(0, settings.flex);
    }

    return lineup;
  }

  private calculateTotalProjectedPoints(lineupOrArray: any): number {
    let total = 0;
    if (Array.isArray(lineupOrArray)) {
      lineupOrArray.forEach((p) => (total += p.projectedPoints || 0));
    } else {
      Object.values(lineupOrArray).forEach((arr: any) => {
        (arr || []).forEach((p: any) => (total += p.projectedPoints || 0));
      });
    }
    return Math.round(total * 100) / 100;
  }

  private getBenchPlayers(roster: any[], optimalLineup: Record<string, any[]>) {
    const used = new Set<string>();
    Object.values(optimalLineup).forEach((arr) => {
      (arr || []).forEach((p: any) => used.add(p.playerId || p.playerName || p.name));
    });
    return roster.filter((p) => !used.has(p.playerId || p.playerName || p.name));
  }

  private analyzeLineup(lineup: Record<string, any[]>, settings: Required<LeagueSettings>) {
    const positionBreakdown: Record<string, number> = {};
    Object.keys(lineup).forEach((pos) => (positionBreakdown[pos] = (lineup[pos] || []).length));

    const recommendations: Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high' }> = [];
    // Simple recommendations baseline
    if ((lineup.RB || []).length < (settings.rb || 0)) {
      recommendations.push({ type: 'depth', message: 'Consider adding RB depth.', priority: 'medium' });
    }
    if ((lineup.WR || []).length < (settings.wr || 0)) {
      recommendations.push({ type: 'depth', message: 'Consider adding WR depth.', priority: 'medium' });
    }

    return { positionBreakdown, recommendations };
  }
} 