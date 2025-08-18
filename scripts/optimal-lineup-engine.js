/**
 * Optimal Lineup Engine
 * 
 * This engine calculates the optimal starting lineup for any fantasy football roster
 * based on league settings and scoring rules. It can be used across the entire site
 * for draft analysis, league insights, trade analysis, etc.
 */

class OptimalLineupEngine {
    constructor() {
        this.defaultLeagueSettings = {
            qb: 1,
            rb: 2,
            wr: 2,
            te: 1,
            flex: 1, // Can be RB, WR, or TE
            def: 1,
            k: 1,
            superflex: false, // Can start QB in flex
            scoring: 'ppr' // 'standard', 'ppr', 'half-ppr'
        };
        
        this.scoringRules = {
            standard: {
                passing_td: 4,
                passing_yd: 0.04,
                rushing_td: 6,
                rushing_yd: 0.1,
                receiving_td: 6,
                receiving_yd: 0.1,
                reception: 0,
                fumble_lost: -2,
                interception: -2
            },
            ppr: {
                passing_td: 4,
                passing_yd: 0.04,
                rushing_td: 6,
                rushing_yd: 0.1,
                receiving_td: 6,
                receiving_yd: 0.1,
                reception: 1,
                fumble_lost: -2,
                interception: -2
            },
            'half-ppr': {
                passing_td: 4,
                passing_yd: 0.04,
                rushing_td: 6,
                rushing_yd: 0.1,
                receiving_td: 6,
                receiving_yd: 0.1,
                reception: 0.5,
                fumble_lost: -2,
                interception: -2
            }
        };
    }

    /**
     * Calculate optimal starting lineup for a given roster
     * @param {Array} roster - Array of player objects with projections
     * @param {Object} leagueSettings - League configuration
     * @param {Object} scoringRules - Custom scoring rules (optional)
     * @returns {Object} Optimal lineup and projected points
     */
    calculateOptimalLineup(roster, leagueSettings = {}, scoringRules = null) {
        const settings = { ...this.defaultLeagueSettings, ...leagueSettings };
        const scoring = scoringRules || this.scoringRules[settings.scoring];
        
        if (!scoring) {
            throw new Error(`Invalid scoring format: ${settings.scoring}`);
        }

        // Filter players by position and get their projected points
        const playersByPosition = this.groupPlayersByPosition(roster, scoring);
        
        // Calculate optimal lineup using dynamic programming approach
        const optimalLineup = this.findOptimalLineup(playersByPosition, settings);
        
        // Calculate total projected points for optimal lineup
        const totalProjectedPoints = this.calculateTotalProjectedPoints(optimalLineup);
        
        // Calculate bench points (players not in optimal lineup)
        const benchPlayers = this.getBenchPlayers(roster, optimalLineup);
        const benchPoints = this.calculateTotalProjectedPoints(benchPlayers);
        
        return {
            optimalLineup,
            totalProjectedPoints,
            benchPlayers,
            benchPoints,
            settings,
            scoring,
            analysis: this.analyzeLineup(optimalLineup, settings)
        };
    }

    /**
     * Group players by position and calculate projected points
     */
    groupPlayersByPosition(roster, scoring) {
        const positions = {};
        
        roster.forEach(player => {
            const pos = player.position?.toUpperCase();
            if (!pos) return;
            
            if (!positions[pos]) {
                positions[pos] = [];
            }
            
            // Calculate projected points based on scoring rules
            const projectedPoints = this.calculatePlayerProjectedPoints(player, scoring);
            
            positions[pos].push({
                ...player,
                projectedPoints,
                originalProjection: player.projectedPoints || 0
            });
        });
        
        // Sort each position by projected points (descending)
        Object.keys(positions).forEach(pos => {
            positions[pos].sort((a, b) => b.projectedPoints - a.projectedPoints);
        });
        
        return positions;
    }

    /**
     * Calculate projected points for a player based on scoring rules
     */
    calculatePlayerProjectedPoints(player, scoring) {
        // If player already has projected points, use those
        if (player.projectedPoints !== undefined) {
            return player.projectedPoints;
        }
        
        // If player has detailed projections, calculate from scratch
        if (player.projections) {
            return this.calculateDetailedProjections(player.projections, scoring);
        }
        
        // Fallback to 0 if no projections available
        return 0;
    }

    /**
     * Calculate detailed projections from player stats
     */
    calculateDetailedProjections(projections, scoring) {
        let total = 0;
        
        // Passing stats
        if (projections.passing_yd) {
            total += projections.passing_yd * scoring.passing_yd;
        }
        if (projections.passing_td) {
            total += projections.passing_td * scoring.passing_td;
        }
        if (projections.interceptions) {
            total += projections.interceptions * scoring.interception;
        }
        
        // Rushing stats
        if (projections.rushing_yd) {
            total += projections.rushing_yd * scoring.rushing_yd;
        }
        if (projections.rushing_td) {
            total += projections.rushing_td * scoring.rushing_td;
        }
        
        // Receiving stats
        if (projections.receiving_yd) {
            total += projections.receiving_yd * scoring.receiving_yd;
        }
        if (projections.receiving_td) {
            total += projections.receiving_td * scoring.receiving_td;
        }
        if (projections.receptions) {
            total += projections.receptions * scoring.reception;
        }
        
        // Fumbles
        if (projections.fumbles_lost) {
            total += projections.fumbles_lost * scoring.fumble_lost;
        }
        
        return Math.round(total * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Find optimal lineup using greedy algorithm with position constraints
     */
    findOptimalLineup(playersByPosition, settings) {
        const lineup = {
            QB: [],
            RB: [],
            WR: [],
            TE: [],
            FLEX: [],
            DEF: [],
            K: []
        };
        
        // Fill required positions first
        this.fillRequiredPositions(lineup, playersByPosition, settings);
        
        // Fill flex positions with best remaining players
        this.fillFlexPositions(lineup, playersByPosition, settings);
        
        return lineup;
    }

    /**
     * Fill required positions with best available players
     */
    fillRequiredPositions(lineup, playersByPosition, settings) {
        // Fill QB
        if (settings.qb > 0 && playersByPosition.QB) {
            lineup.QB = playersByPosition.QB.slice(0, settings.qb);
        }
        
        // Fill RB
        if (settings.rb > 0 && playersByPosition.RB) {
            lineup.RB = playersByPosition.RB.slice(0, settings.rb);
        }
        
        // Fill WR
        if (settings.wr > 0 && playersByPosition.WR) {
            lineup.WR = playersByPosition.WR.slice(0, settings.wr);
        }
        
        // Fill TE
        if (settings.te > 0 && playersByPosition.TE) {
            lineup.TE = playersByPosition.TE.slice(0, settings.te);
        }
        
        // Fill DEF
        if (settings.def > 0 && playersByPosition.DEF) {
            lineup.DEF = playersByPosition.DEF.slice(0, settings.def);
        }
        
        // Fill K
        if (settings.k > 0 && playersByPosition.K) {
            lineup.K = playersByPosition.K.slice(0, settings.k);
        }
    }

    /**
     * Fill flex positions with best remaining players
     */
    fillFlexPositions(lineup, playersByPosition, settings) {
        if (settings.flex === 0) return;
        
        // Get all players that can be flexed
        const flexEligible = [];
        
        // Add remaining RBs, WRs, and TEs
        if (playersByPosition.RB) {
            const usedRBs = new Set(lineup.RB.map(p => p.playerName || p.name));
            const remainingRBs = playersByPosition.RB.filter(p => !usedRBs.has(p.playerName || p.name));
            flexEligible.push(...remainingRBs);
        }
        
        if (playersByPosition.WR) {
            const usedWRs = new Set(lineup.WR.map(p => p.playerName || p.name));
            const remainingWRs = playersByPosition.WR.filter(p => !usedWRs.has(p.playerName || p.name));
            flexEligible.push(...remainingWRs);
        }
        
        if (playersByPosition.TE) {
            const usedTEs = new Set(lineup.TE.map(p => p.playerName || p.name));
            const remainingTEs = playersByPosition.TE.filter(p => !usedTEs.has(p.playerName || p.name));
            flexEligible.push(...remainingTEs);
        }
        
        // Add QBs to flex if superflex is enabled
        if (settings.superflex && playersByPosition.QB) {
            const usedQBs = new Set(lineup.QB.map(p => p.playerName || p.name));
            const remainingQBs = playersByPosition.QB.filter(p => !usedQBs.has(p.playerName || p.name));
            flexEligible.push(...remainingQBs);
        }
        
        // Sort by projected points and take the best
        flexEligible.sort((a, b) => b.projectedPoints - a.projectedPoints);
        lineup.FLEX = flexEligible.slice(0, settings.flex);
    }

    /**
     * Calculate total projected points for a lineup
     */
    calculateTotalProjectedPoints(lineup) {
        let total = 0;
        
        // Handle both object (lineup) and array (bench players) inputs
        if (Array.isArray(lineup)) {
            // If it's an array (like bench players), sum directly
            lineup.forEach(player => {
                total += player.projectedPoints || 0;
            });
        } else {
            // If it's an object (like optimal lineup), iterate over position arrays
            Object.values(lineup).forEach(players => {
                if (Array.isArray(players)) {
                    players.forEach(player => {
                        total += player.projectedPoints || 0;
                    });
                }
            });
        }
        
        return Math.round(total * 100) / 100;
    }

    /**
     * Get players not in the optimal lineup
     */
    getBenchPlayers(roster, optimalLineup) {
        const usedPlayerIds = new Set();
        
        Object.values(optimalLineup).forEach(players => {
            if (Array.isArray(players)) {
                players.forEach(player => {
                    // Use playerId or playerName as fallback for identification
                    const playerIdentifier = player.playerId || player.player_id || player.id || player.playerName || player.name;
                    if (playerIdentifier) {
                        usedPlayerIds.add(playerIdentifier);
                    }
                });
            }
        });
        
        return roster.filter(player => {
            // Use playerId or playerName as fallback for identification
            const playerIdentifier = player.playerId || player.player_id || player.id || player.playerName || player.name;
            return !usedPlayerIds.has(playerIdentifier);
        });
    }

    /**
     * Analyze the optimal lineup for insights
     */
    analyzeLineup(lineup, settings) {
        const analysis = {
            totalStarters: 0,
            positionBreakdown: {},
            strengthByPosition: {},
            flexUtilization: 0,
            recommendations: []
        };
        
        // Count total starters
        Object.values(lineup).forEach(players => {
            if (Array.isArray(players)) {
                analysis.totalStarters += players.length;
            }
        });
        
        // Analyze position breakdown
        Object.keys(lineup).forEach(pos => {
            const players = lineup[pos];
            if (Array.isArray(players)) {
                analysis.positionBreakdown[pos] = players.length;
                
                if (players.length > 0) {
                    const avgPoints = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0) / players.length;
                    analysis.strengthByPosition[pos] = {
                        count: players.length,
                        avgPoints: Math.round(avgPoints * 100) / 100,
                        totalPoints: Math.round(players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0) * 100) / 100
                    };
                }
            }
        });
        
        // Analyze flex utilization
        if (lineup.FLEX && lineup.FLEX.length > 0) {
            const flexPlayers = lineup.FLEX;
            const flexPositions = flexPlayers.map(p => p.position);
            analysis.flexUtilization = {
                count: flexPlayers.length,
                positions: flexPositions,
                avgPoints: Math.round(flexPlayers.reduce((sum, p) => sum + (p.projectedPoints || 0), 0) / flexPlayers.length * 100) / 100
            };
        }
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(lineup, settings, analysis);
        
        return analysis;
    }

    /**
     * Generate actionable recommendations based on lineup analysis
     */
    generateRecommendations(lineup, settings, analysis) {
        const recommendations = [];
        
        // Check for weak positions
        Object.keys(analysis.strengthByPosition).forEach(pos => {
            const strength = analysis.strengthByPosition[pos];
            if (strength.avgPoints < 10 && pos !== 'K' && pos !== 'DEF') {
                recommendations.push({
                    type: 'weak_position',
                    position: pos,
                    message: `${pos} position is averaging only ${strength.avgPoints} points. Consider upgrading this position.`,
                    priority: 'medium'
                });
            }
        });
        
        // Check for strong bench players
        if (lineup.FLEX && lineup.FLEX.length > 0) {
            const flexAvg = analysis.flexUtilization.avgPoints;
            const benchAvg = analysis.benchPoints / (analysis.totalStarters - settings.qb - settings.rb - settings.wr - settings.te - settings.def - settings.k);
            
            if (benchAvg > flexAvg * 1.2) {
                recommendations.push({
                    type: 'bench_strength',
                    message: 'Your bench players are significantly stronger than your flex starters. Consider adjusting your lineup.',
                    priority: 'high'
                });
            }
        }
        
        // Check for position scarcity
        const rbCount = (lineup.RB?.length || 0) + (lineup.FLEX?.filter(p => p.position === 'RB').length || 0);
        const wrCount = (lineup.WR?.length || 0) + (lineup.FLEX?.filter(p => p.position === 'WR').length || 0);
        
        if (rbCount < 3) {
            recommendations.push({
                type: 'position_scarcity',
                position: 'RB',
                message: 'You only have 3 RBs in your starting lineup. Consider adding more RB depth.',
                priority: 'medium'
            });
        }
        
        if (wrCount < 4) {
            recommendations.push({
                type: 'position_scarcity',
                position: 'WR',
                message: 'You only have 4 WRs in your starting lineup. Consider adding more WR depth.',
                priority: 'medium'
            });
        }

        // VORP-based analysis
        const vorpInsights = this.generateVorpRecommendations(lineup);
        recommendations.push(...vorpInsights);
        
        return recommendations;
    }

    /**
     * Generate VORP-based recommendations
     */
    generateVorpRecommendations(lineup) {
        const recommendations = [];
        
        // Collect all players from the lineup
        const allPlayers = [];
        Object.values(lineup).forEach(players => {
            if (Array.isArray(players)) {
                allPlayers.push(...players);
            }
        });
        
        // Find highest VORP players
        const playersWithVorp = allPlayers.filter(p => p.vorpScore !== null && p.vorpScore !== undefined);
        if (playersWithVorp.length > 0) {
            const sortedByVorp = playersWithVorp.sort((a, b) => (b.vorpScore || 0) - (a.vorpScore || 0));
            const topVorp = sortedByVorp[0];
            
            if (topVorp.vorpScore > 50) {
                recommendations.push({
                    type: 'vorp_strength',
                    message: `🎯 ${topVorp.playerName || topVorp.name} has an exceptional VORP of ${topVorp.vorpScore.toFixed(1)}, indicating they're significantly outperforming their position's replacement level.`,
                    priority: 'high'
                });
            } else if (topVorp.vorpScore > 20) {
                recommendations.push({
                    type: 'vorp_strength',
                    message: `✅ ${topVorp.playerName || topVorp.name} has a strong VORP of ${topVorp.vorpScore.toFixed(1)}, showing good value above replacement level.`,
                    priority: 'medium'
                });
            }
        }
        
        // Check for low VORP players in starting lineup
        const lowVorpStarters = playersWithVorp.filter(p => p.vorpScore < -50);
        if (lowVorpStarters.length > 0) {
            const worstPlayer = lowVorpStarters.sort((a, b) => (a.vorpScore || 0) - (b.vorpScore || 0))[0];
            recommendations.push({
                type: 'vorp_weakness',
                message: `⚠️ ${worstPlayer.playerName || worstPlayer.name} has a low VORP of ${worstPlayer.vorpScore.toFixed(1)}, indicating they're performing below replacement level. Consider benching or replacing.`,
                priority: 'high'
            });
        }
        
        // Calculate average VORP for the lineup
        if (playersWithVorp.length > 0) {
            const avgVorp = playersWithVorp.reduce((sum, p) => sum + (p.vorpScore || 0), 0) / playersWithVorp.length;
            if (avgVorp > 0) {
                recommendations.push({
                    type: 'vorp_overall',
                    message: `📊 Your starting lineup has an average VORP of ${avgVorp.toFixed(1)}, indicating strong overall value above replacement level.`,
                    priority: 'low'
                });
            } else {
                recommendations.push({
                    type: 'vorp_overall',
                    message: `📊 Your starting lineup has an average VORP of ${avgVorp.toFixed(1)}, indicating room for improvement above replacement level.`,
                    priority: 'medium'
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Compare two lineups and provide analysis
     */
    compareLineups(lineup1, lineup2, settings) {
        const analysis1 = this.analyzeLineup(lineup1, settings);
        const analysis2 = this.analyzeLineup(lineup2, settings);
        
        return {
            lineup1: {
                projectedPoints: this.calculateTotalProjectedPoints(lineup1),
                analysis: analysis1
            },
            lineup2: {
                projectedPoints: this.calculateTotalProjectedPoints(lineup2),
                analysis: analysis2
            },
            difference: {
                pointsDiff: Math.round((this.calculateTotalProjectedPoints(lineup1) - this.calculateTotalProjectedPoints(lineup2)) * 100) / 100,
                percentageDiff: Math.round(((this.calculateTotalProjectedPoints(lineup1) / this.calculateTotalProjectedPoints(lineup2)) - 1) * 10000) / 100
            },
            recommendations: this.generateComparisonRecommendations(lineup1, lineup2, settings)
        };
    }

    /**
     * Generate recommendations for lineup comparison
     */
    generateComparisonRecommendations(lineup1, lineup2, settings) {
        const recommendations = [];
        const points1 = this.calculateTotalProjectedPoints(lineup1);
        const points2 = this.calculateTotalProjectedPoints(lineup2);
        
        if (points1 > points2) {
            recommendations.push({
                type: 'lineup_choice',
                message: `Lineup 1 is projected to score ${Math.round((points1 - points2) * 100) / 100} more points than Lineup 2.`,
                recommendation: 'Choose Lineup 1',
                priority: 'high'
            });
        } else if (points2 > points1) {
            recommendations.push({
                type: 'lineup_choice',
                message: `Lineup 2 is projected to score ${Math.round((points2 - points1) * 100) / 100} more points than Lineup 1.`,
                recommendation: 'Choose Lineup 2',
                priority: 'high'
            });
        } else {
            recommendations.push({
                type: 'lineup_choice',
                message: 'Both lineups are projected to score the same points.',
                recommendation: 'Choose based on risk tolerance and matchup',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
}

export default OptimalLineupEngine; 