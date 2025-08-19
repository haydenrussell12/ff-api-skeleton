type LeagueSettings = {
  scoring?: string;
  leagueType?: string;
  superflexSlots?: number;
  teams?: number;
};

export default class OptimalLineupEngine {
  private getRosterRequirements(leagueType: string = 'standard') {
    const requirements = {
      standard: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1,
        totalStarters: 9,
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      },
      superflex: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1,
        totalStarters: 9,
        flexPositions: ['QB', 'RB', 'WR', 'TE'], // QB eligible in flex
        superflexPositions: []
      },
      '2qb': {
        QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1,
        totalStarters: 10,
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      },
      '2flex': {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DEF: 1, K: 1,
        totalStarters: 10,
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      }
    };
    
    return requirements[leagueType as keyof typeof requirements] || requirements.standard;
  }

  calculateOptimalLineup(roster: any[], settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const superflexSlots = settings.superflexSlots || 0;
    const requirements = this.getRosterRequirements(leagueType);
    
    console.log('🔍 Calculating optimal lineup:', { leagueType, superflexSlots, requirements });
    
    // Group players by position
    const positionGroups = this.groupPlayersByPosition(roster);
    
    // Start building optimal lineup
    const optimalLineup: Record<string, any[]> = {};
    const usedPlayers = new Set();
    
    console.log('🔍 Filling required positions...');
    
    // Fill required positions first (excluding special positions)
    Object.entries(requirements).forEach(([position, count]) => {
      if (position === 'totalStarters' || position === 'flexPositions' || position === 'superflexPositions') return;
      
      console.log(`🔍 Processing position: ${position}, count: ${count}`);
      
      if (typeof count === 'number' && count > 0) {
        optimalLineup[position] = [];
        
        // Get best players for this position
        const availablePlayers = positionGroups[position] || [];
        console.log(`🔍 Available players for ${position}:`, availablePlayers);
        
        const sortedPlayers = availablePlayers
          .filter((p: any) => !usedPlayers.has(p.playerId || p.playerName))
          .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
          .slice(0, count);
        
        console.log(`🔍 Selected players for ${position}:`, sortedPlayers);
        
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
          
          // Log which type of flex this is
          if (leagueType === 'superflex') {
            console.log(`🦸 Superflex FLEX: Selected ${bestFlexPlayer.position} ${bestFlexPlayer.playerName} with ${bestFlexPlayer.projectedPoints} points`);
          } else {
            console.log(`🔄 Standard FLEX: Selected ${bestFlexPlayer.position} ${bestFlexPlayer.playerName} with ${bestFlexPlayer.projectedPoints} points`);
          }
        }
      }
    }
    
    // Handle 2 FLEX positions (if applicable)
    if (leagueType === '2flex' && requirements.FLEX === 2) {
      optimalLineup.FLEX = [];
      
      // Fill first flex spot
      const bestFlexPlayer1 = this.findBestFlexPlayer(positionGroups, usedPlayers);
      if (bestFlexPlayer1) {
        optimalLineup.FLEX.push(bestFlexPlayer1);
        usedPlayers.add(bestFlexPlayer1.playerId || bestFlexPlayer1.playerName);
        console.log(`🔄 FLEX 1: Selected ${bestFlexPlayer1.position} ${bestFlexPlayer1.playerName} with ${bestFlexPlayer1.projectedPoints} points`);
      }
      
      // Fill second flex spot
      const bestFlexPlayer2 = this.findBestFlexPlayer(positionGroups, usedPlayers);
      if (bestFlexPlayer2) {
        optimalLineup.FLEX.push(bestFlexPlayer2);
        usedPlayers.add(bestFlexPlayer2.playerId || bestFlexPlayer2.playerName);
        console.log(`🔄 FLEX 2: Selected ${bestFlexPlayer2.position} ${bestFlexPlayer2.playerName} with ${bestFlexPlayer2.projectedPoints} points`);
      }
    }
    
    // Ensure all required positions have at least an empty array
    Object.entries(requirements).forEach(([position, count]) => {
      if (position === 'totalStarters' || position === 'flexPositions' || position === 'superflexPositions') return;
      
      if (typeof count === 'number' && count > 0 && !optimalLineup[position]) {
        optimalLineup[position] = [];
      }
    });
    
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

  private findBestFlexPlayer(positionGroups: Record<string, any[]>, usedPlayers: Set<string | unknown>) {
    // Get all available flex eligible players
    const availableRBs = (positionGroups['RB'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    const availableWRs = (positionGroups['WR'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    const availableTEs = (positionGroups['TE'] || []).filter((p: any) => !usedPlayers.has(p.playerId || p.playerName));
    
    // In flex, RB/WR/TE are all valuable - give them priority
    let bestFlexPlayer = null;
    
    // First priority: Best available RB
    if (availableRBs.length > 0) {
      const bestRB = availableRBs.sort((a: any, b: any) => (b.projectedPoints || 0) - (a.projectedPoints || 0))[0];
      bestFlexPlayer = bestRB;
    }
    
    // If no RBs available, select best WR/TE
    if (!bestFlexPlayer) {
      const otherPlayers = [...availableWRs, ...availableTEs];
      if (otherPlayers.length > 0) {
        bestFlexPlayer = otherPlayers.sort((a: any, b: any) => (b.projectedPoints || 0) - (a.projectedPoints || 0))[0];
      }
    }
    
    return bestFlexPlayer;
  }

  private groupPlayersByPosition(roster: any[]) {
    const groups: Record<string, any[]> = {};
    
    console.log('🔍 Grouping players by position. Roster:', roster);
    
    roster.forEach((player) => {
      const position = (player.position || '').toUpperCase();
      console.log(`🔍 Player: ${player.playerName}, Position: ${position}, Raw position: ${player.position}`);
      
      if (!position) {
        console.log(`⚠️ Skipping player ${player.playerName} - no position`);
        return;
      }
      
      if (!groups[position]) {
        groups[position] = [];
      }
      groups[position].push(player);
    });
    
    console.log('🔍 Grouped players:', groups);
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
    const requirements = this.getRosterRequirements(leagueType);
    
    return {
      totalStarters: requirements.totalStarters,
      leagueType,
      superflexSlots: requirements.superflexPositions ? requirements.superflexPositions.length : 0,
      requirements,
      positionCounts: Object.entries(requirements)
        .filter(([key]) => !['totalStarters', 'flexPositions', 'superflexPositions'].includes(key))
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