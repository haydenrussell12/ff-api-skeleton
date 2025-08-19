type LeagueSettings = {
  scoring?: string;
  leagueType?: string;
};

export default class OptimalLineupEngine {
  private getRosterRequirements(leagueType: string = 'standard') {
    const requirements = {
      standard: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1,
        totalStarters: 9,
        flexPositions: ['RB', 'WR', 'TE']
      },
      superflex: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1, K: 1, DEF: 1,
        totalStarters: 10,
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: ['QB', 'RB', 'WR', 'TE']
      },
      '2qb': {
        QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1,
        totalStarters: 10,
        flexPositions: ['RB', 'WR', 'TE']
      }
    };
    
    return requirements[leagueType as keyof typeof requirements] || requirements.standard;
  }

  calculateOptimalLineup(roster: any[], settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const requirements = this.getRosterRequirements(leagueType);
    
    // Group players by position
    const positionGroups = this.groupPlayersByPosition(roster);
    
    // Start building optimal lineup
    const optimalLineup: Record<string, any[]> = {};
    const usedPlayers = new Set();
    
    // Fill required positions first (excluding special positions)
    Object.entries(requirements).forEach(([position, count]) => {
      if (position === 'totalStarters' || position === 'flexPositions' || position === 'superflexPositions') return;
      
      if (typeof count === 'number' && count > 0) {
        optimalLineup[position] = [];
        
        // Get best players for this position
        const availablePlayers = positionGroups[position] || [];
        const sortedPlayers = availablePlayers
          .filter((p: any) => !usedPlayers.has(p.playerId || p.playerName))
          .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
          .slice(0, count);
        
        optimalLineup[position] = sortedPlayers;
        sortedPlayers.forEach((p: any) => usedPlayers.add(p.playerId || p.playerName));
      }
    });
    
    // Handle FLEX position
    if (requirements.flexPositions) {
      const flexPlayers = requirements.flexPositions.flatMap(pos => 
        (positionGroups[pos] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName))
      );
      
      if (flexPlayers.length > 0) {
        const bestFlexPlayer = flexPlayers
          .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))[0];
        
        if (bestFlexPlayer) {
          optimalLineup.FLEX = [bestFlexPlayer];
          usedPlayers.add(bestFlexPlayer.playerId || bestFlexPlayer.playerName);
        }
      }
    }
    
    // Handle SUPERFLEX position (if applicable)
    if (leagueType === 'superflex' && 'superflexPositions' in requirements && requirements.superflexPositions) {
      const superflexPlayers = requirements.superflexPositions.flatMap((pos: string) => 
        (positionGroups[pos] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName))
      );
      
      if (superflexPlayers.length > 0) {
        const bestSuperflexPlayer = superflexPlayers
          .sort((a: any, b: any) => (b.projectedPoints || 0) - (a.projectedPoints || 0))[0];
        
        if (bestSuperflexPlayer) {
          optimalLineup.SUPERFLEX = [bestSuperflexPlayer];
          usedPlayers.add(bestSuperflexPlayer.playerId || bestSuperflexPlayer.playerName);
        }
      }
    }
    
    return optimalLineup;
  }

  private groupPlayersByPosition(roster: any[]) {
    const groups: Record<string, any[]> = {};
    
    roster.forEach((player) => {
      const position = (player.position || '').toUpperCase();
      if (!position) return;
      
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(player);
    });
    
    return groups;
  }

  getBenchPlayers(roster: any[], optimalLineup: Record<string, any[]>): any[] {
    const usedPlayers = new Set();
    
    // Collect all players used in optimal lineup
    Object.values(optimalLineup).forEach((players: any[]) => {
      if (Array.isArray(players)) {
        players.forEach((p: any) => {
          usedPlayers.add(p.playerId || p.playerName);
        });
      }
    });
    
    // Return players not used in optimal lineup
    return roster.filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
  }

  calculateTotalProjectedPoints(players: any[] | Record<string, any[]>): number {
    if (Array.isArray(players)) {
      return players.reduce((total, player) => total + (player.projectedPoints || 0), 0);
    }
    
    // Handle object format
    let total = 0;
    Object.values(players).forEach((positionPlayers: any) => {
      if (Array.isArray(positionPlayers)) {
        total += positionPlayers.reduce((sum: number, p: any) => sum + (p.projectedPoints || 0), 0);
      }
    });
    
    return total;
  }

  analyzeLineup(optimalLineup: Record<string, any[]>, settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const requirements = this.getRosterRequirements(leagueType);
    
    return {
      totalStarters: requirements.totalStarters,
      leagueType,
      requirements,
      positionCounts: Object.entries(requirements)
        .filter(([key]) => !['totalStarters', 'flexPositions', 'superflexPositions'].includes(key))
        .reduce((acc, [pos, count]) => ({ ...acc, [pos]: count }), {})
    };
  }
} 