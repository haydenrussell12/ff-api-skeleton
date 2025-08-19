type LeagueSettings = {
  scoring?: string;
  leagueType?: string;
  superflexSlots?: number;
  teams?: number;
};

export default class OptimalLineupEngine {
  private getRosterRequirements(leagueType: string = 'standard', superflexSlots: number = 0) {
    const requirements = {
      standard: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1,
        totalStarters: 9,
        flexPositions: ['RB', 'WR', 'TE'],
        superflexSlots: 0
      },
      superflex: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: superflexSlots || 1, K: 1, DEF: 1,
        totalStarters: 9 + (superflexSlots || 1),
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: ['QB', 'RB', 'WR', 'TE'],
        superflexSlots: superflexSlots || 1
      },
      '2qb': {
        QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1,
        totalStarters: 10,
        flexPositions: ['RB', 'WR', 'TE'],
        superflexSlots: 0
      }
    };
    
    return requirements[leagueType as keyof typeof requirements] || requirements.standard;
  }

  calculateOptimalLineup(roster: any[], settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const superflexSlots = settings.superflexSlots || 0;
    const requirements = this.getRosterRequirements(leagueType, superflexSlots);
    
    // Group players by position
    const positionGroups = this.groupPlayersByPosition(roster);
    
    // Start building optimal lineup
    const optimalLineup: Record<string, any[]> = {};
    const usedPlayers = new Set();
    
    // Fill required positions first (excluding special positions)
    Object.entries(requirements).forEach(([position, count]) => {
      if (position === 'totalStarters' || position === 'flexPositions' || position === 'superflexPositions' || position === 'superflexSlots') return;
      
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
    
    // Handle SUPERFLEX positions (if applicable)
    if (leagueType === 'superflex' && requirements.superflexSlots && requirements.superflexSlots > 0) {
      optimalLineup.SUPERFLEX = [];
      
      // Fill each superflex slot
      for (let slot = 0; slot < requirements.superflexSlots; slot++) {
        const bestSuperflexPlayer = this.findBestSuperflexPlayer(positionGroups, usedPlayers);
        
        if (bestSuperflexPlayer) {
          optimalLineup.SUPERFLEX.push(bestSuperflexPlayer);
          usedPlayers.add(bestSuperflexPlayer.playerId || bestSuperflexPlayer.playerName);
          
          console.log(`🦸 SUPERFLEX Slot ${slot + 1}: Selected ${bestSuperflexPlayer.position} ${bestSuperflexPlayer.playerName} with ${bestSuperflexPlayer.projectedPoints} points`);
        }
      }
    }
    
    return optimalLineup;
  }

  private findBestSuperflexPlayer(positionGroups: Record<string, any[]>, usedPlayers: Set<string | unknown>) {
    // Get all available superflex eligible players
    const availableQBs = (positionGroups['QB'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    const availableRBs = (positionGroups['RB'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    const availableWRs = (positionGroups['WR'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    const availableTEs = (positionGroups['TE'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    
    // In superflex, QBs are extremely valuable - give them priority
    let bestSuperflexPlayer = null;
    
    // First priority: Best available QB (QBs score much higher than other positions)
    if (availableQBs.length > 0) {
      const bestQB = availableQBs.sort((a: any, b: any) => (b.projectedPoints || 0) - (a.projectedPoints || 0))[0];
      bestSuperflexPlayer = bestQB;
    }
    
    // If no QBs available, select best RB/WR/TE
    if (!bestSuperflexPlayer) {
      const otherPlayers = [...availableRBs, ...availableWRs, ...availableTEs];
      if (otherPlayers.length > 0) {
        bestSuperflexPlayer = otherPlayers.sort((a: any, b: any) => (b.projectedPoints || 0) - (a.projectedPoints || 0))[0];
      }
    }
    
    return bestSuperflexPlayer;
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
    const superflexSlots = settings.superflexSlots || 0;
    const requirements = this.getRosterRequirements(leagueType, superflexSlots);
    
    return {
      totalStarters: requirements.totalStarters,
      leagueType,
      superflexSlots: requirements.superflexSlots || 0,
      requirements,
      positionCounts: Object.entries(requirements)
        .filter(([key]) => !['totalStarters', 'flexPositions', 'superflexPositions', 'superflexSlots'].includes(key))
        .reduce((acc, [pos, count]) => ({ ...acc, [pos]: count }), {})
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