type LeagueSettings = {
  scoring?: string;
  leagueType?: string;
  superflexSlots?: number;
  teams?: number;
  rounds?: number;
};

export default class OptimalLineupEngine {
  private getRosterRequirements(leagueType: string = 'standard', actualTeams: number = 12, actualRounds: number = 16) {
    // Fixed starter requirements - bench size scales with rounds, not starters
    const baseRequirements = {
      standard: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1, // 9 starters
        flexPositions: ['RB', 'WR', 'TE'],
        superflexPositions: []
      },
      superflex: {
        QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1, // 9 starters (QB eligible in flex)
        flexPositions: ['QB', 'RB', 'WR', 'TE'], // QB eligible in flex
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
      // Add metadata about the dynamic calculation
      _metadata: {
        actualTeams,
        actualRounds,
        leagueType,
        calculatedAt: new Date().toISOString()
      }
    };
  }

  calculateOptimalLineup(roster: any[], settings: LeagueSettings = {}) {
    const leagueType = settings.leagueType || 'standard';
    const actualTeams = settings.teams || 12;
    const actualRounds = settings.rounds || 16; // Get actual rounds from settings
    
    // Calculate roster requirements based on actual draft data
    const requirements = this.getRosterRequirements(leagueType, actualTeams, actualRounds);
    
    console.log('🔍 Calculating optimal lineup:', { 
      leagueType, 
      actualTeams, 
      actualRounds, 
      requirements: {
        ...requirements,
        _metadata: requirements._metadata
      }
    });
    
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
    if ((leagueType === '2flex' || leagueType === 'robs-bullshit') && requirements.FLEX === 2) {
      optimalLineup.FLEX = [];
      const bestFlexPlayer1 = this.findBestFlexPlayer(positionGroups, usedPlayers);
      if (bestFlexPlayer1) {
        optimalLineup.FLEX.push(bestFlexPlayer1);
        usedPlayers.add(bestFlexPlayer1.playerId || bestFlexPlayer1.playerName);
        console.log(`🔄 FLEX 1: Selected ${bestFlexPlayer1.position} ${bestFlexPlayer1.playerName} with ${bestFlexPlayer1.projectedPoints} points`);
      }
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
    const actualTeams = settings.teams || 12;
    const actualRounds = 16; // Default to 16 rounds for dynamic calculation
    const requirements = this.getRosterRequirements(leagueType, actualTeams, actualRounds);
    
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
    const actualTeams = settings.teams || 12;
    const actualRounds = 16; // Default to 16 rounds for dynamic calculation
    
    const baselines = {
      QB: actualTeams * (1 + superflexSlots), // QB demand increases with superflex slots
      RB: actualTeams * 2, // Standard RB demand
      WR: actualTeams * 2, // Standard WR demand  
      TE: actualTeams * 1, // Standard TE demand
      K: actualTeams * 1,
      DEF: actualTeams * 1
    };
    
    return baselines;
  }
} 