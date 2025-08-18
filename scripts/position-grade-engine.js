import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class PositionGradeEngine {
    constructor() {
        this.byeWeeks = {};
        this.vorpData = {};
        this.leagueBaselines = {};
        this.warnings = [];
        
        this.loadByeWeeks();
        this.loadVorpData();
        
        // Format toggles
        this.formatSettings = {
            isSuperflex: false,
            isTEPremium: false,
            includeK: true,
            includeDST: true
        };
        
        // Cross-positional weighting (VORP-based)
        this.positionWeights = {
            QB: 0.20,    // Higher weight in VORP-driven system
            RB: 0.25,    // 25% of total grade
            WR: 0.25,    // 25% of total grade
            TE: 0.15,    // 15% of total grade
            K: 0.05,     // 5% of total grade
            DEF: 0.10    // 10% of total grade
        };
        
        // Grade thresholds based on league-wide percentiles
        this.gradeThresholds = {
            'A+': 95,    // Top 5%
            'A': 90,     // Top 10%
            'A-': 80,    // Top 20%
            'B+': 70,    // Top 30%
            'B': 60,     // Top 40%
            'B-': 50,    // Top 50%
            'C+': 40,    // Top 60%
            'C': 30,     // Top 70%
            'C-': 20,    // Top 80%
            'D+': 15,    // Top 85%
            'D': 10,     // Top 90%
            'D-': 5,     // Top 95%
            'F': 0       // Bottom 5%
        };
    }

    /**
     * Load bye weeks data
     */
    loadByeWeeks() {
        try {
            const byeWeeksPath = path.join(__dirname, '..', 'data', '2025', 'Bye Weeks', 'Bye Weeks.csv');
            console.log(`🔍 Looking for bye weeks at: ${byeWeeksPath}`);
            console.log(`🔍 Current directory: ${__dirname}`);
            console.log(`🔍 Project root: ${path.join(__dirname, '..')}`);
            
            if (fs.existsSync(byeWeeksPath)) {
                const csvData = fs.readFileSync(byeWeeksPath, 'utf8');
                const lines = csvData.split('\n').slice(1); // Skip header
                
                lines.forEach(line => {
                    if (line.trim()) {
                        const [team, bye] = line.split(',');
                        if (team && bye) {
                            this.byeWeeks[team.trim()] = parseInt(bye.trim());
                        }
                    }
                });
                console.log(`✅ Loaded bye weeks for ${Object.keys(this.byeWeeks).length} teams`);
            } else {
                console.warn(`⚠️ Bye weeks file not found at: ${byeWeeksPath}`);
            }
        } catch (error) {
            console.warn(`⚠️ Could not load bye weeks: ${error.message}`);
        }
    }

    /**
     * Load VORP data
     */
    loadVorpData() {
        try {
            const vorpDataPath = path.join(__dirname, '..', 'data', 'consolidated', 'player-vorp-scores.json');
            console.log(`🔍 Looking for VORP data at: ${vorpDataPath}`);
            
            if (fs.existsSync(vorpDataPath)) {
                const vorpData = JSON.parse(fs.readFileSync(vorpDataPath, 'utf8'));
                if (vorpData.vorpScores && Array.isArray(vorpData.vorpScores)) {
                    vorpData.vorpScores.forEach(player => {
                        if (player.playerName) {
                            this.vorpData[player.playerName.toLowerCase()] = player;
                        }
                    });
                    console.log(`✅ Loaded VORP data for ${Object.keys(this.vorpData).length} players`);
                } else {
                    console.warn(`⚠️ VORP data structure unexpected: vorpScores is not an array`);
                }
            } else {
                console.warn(`⚠️ VORP data file not found at: ${vorpDataPath}`);
            }
        } catch (error) {
            console.warn(`⚠️ Could not load VORP data: ${error.message}`);
        }
    }

    /**
     * Calculate replacement baselines based on league settings
     * @param {Object} leagueSettings - League configuration
     * @returns {Object} Replacement baselines for each position
     */
    calculateReplacementBaselines(leagueSettings) {
        const { teams = 10, rosterSpots = {} } = leagueSettings;
        
        // Calculate how many starters exist at each position across the league
        const leagueStarters = {
            QB: teams * (rosterSpots.QB || 1),
            RB: teams * (rosterSpots.RB || 2),
            WR: teams * (rosterSpots.WR || 2),
            TE: teams * (rosterSpots.TE || 1),
            K: teams * (rosterSpots.K || 1),
            DEF: teams * (rosterSpots.DEF || 1)
        };

        // Add FLEX allocation (assume 70% WR, 25% RB, 5% TE)
        if (rosterSpots.FLEX) {
            leagueStarters.WR += Math.round(teams * rosterSpots.FLEX * 0.7);
            leagueStarters.RB += Math.round(teams * rosterSpots.FLEX * 0.25);
            leagueStarters.TE += Math.round(teams * rosterSpots.FLEX * 0.05);
        }

        // Calculate replacement baselines (players just outside starter range)
        const replacementBaselines = {};
        Object.keys(leagueStarters).forEach(pos => {
            const starterCount = leagueStarters[pos];
            // Replacement level is typically 1-2 players beyond starter count
            replacementBaselines[pos] = starterCount + 2;
        });

        this.leagueBaselines = replacementBaselines;
        return replacementBaselines;
    }

    /**
     * Find player VORP value with fuzzy matching
     * @param {string} playerName - Player name to search for
     * @returns {Object|null} VORP data or null if not found
     */
    findPlayerVorpValue(playerName) {
        if (!playerName || !this.vorpData) return null;

        const playerNameLower = playerName.toLowerCase();
        
        // Try exact match first
        if (this.vorpData[playerNameLower]) {
            return this.vorpData[playerNameLower];
        }

        // Try variations with common suffixes
        const suffixVariations = [
            playerNameLower.replace(/\s+jr\.?$/i, ''),
            playerNameLower.replace(/\s+sr\.?$/i, ''),
            playerNameLower.replace(/\s+iii$/i, ''),
            playerNameLower.replace(/\s+ii$/i, ''),
            playerNameLower.replace(/\s+iv$/i, ''),
            playerNameLower.replace(/\s+v$/i, ''),
            `${playerNameLower} jr.`,
            `${playerNameLower} sr.`,
            `${playerNameLower} iii`,
            `${playerNameLower} ii`,
            `${playerNameLower} iv`,
            `${playerNameLower} v`,
        ].filter(Boolean);

        for (const variation of suffixVariations) {
            if (this.vorpData[variation]) {
                return this.vorpData[variation];
            }
        }

        return null;
    }

    /**
     * Calculate ERLA (Expected Replacement Loss Avoided) for depth
     * @param {Array} depthPlayers - Backup players at a position
     * @param {string} position - Position being evaluated
     * @param {Object} replacementBaselines - League replacement baselines
     * @returns {number} ERLA score
     */
    calculateERLA(depthPlayers, position, replacementBaselines) {
        if (!depthPlayers || depthPlayers.length === 0) return 0;
        
        const baseline = replacementBaselines[position] || 0;
        let erlaScore = 0;
        
        // Sort depth players by projected points
        const sortedDepth = depthPlayers
            .filter(p => p.projectedPoints)
            .sort((a, b) => b.projectedPoints - a.projectedPoints);
        
        // Apply diminishing weights to depth players
        sortedDepth.forEach((player, index) => {
            const weight = Math.max(0.1, 1 - (index * 0.3)); // Diminishing returns
            const vorpData = this.findPlayerVorpValue(player.playerName);
            
            if (vorpData && vorpData.vorpScore > 0) {
                erlaScore += vorpData.vorpScore * weight;
            }
        });
        
        return erlaScore;
    }

    /**
     * Calculate platoon gain for 1-starter positions
     * @param {Array} players - Players at a position
     * @param {string} position - Position being evaluated
     * @param {Object} leagueSettings - League settings
     * @returns {number} Platoon gain score
     */
    calculatePlatoonGain(players, position, leagueSettings) {
        const { rosterSpots = {} } = leagueSettings;
        const starterCount = rosterSpots[position] || 1;
        
        // Only apply platoon gain to 1-starter positions
        if (starterCount > 1) return 0;
        
        if (players.length < 2) return 0;
        
        // Find best two players for platoon
        const sortedPlayers = players
            .filter(p => p.projectedPoints)
            .sort((a, b) => b.projectedPoints - a.projectedPoints)
            .slice(0, 2);
        
        if (sortedPlayers.length < 2) return 0;
        
        // Calculate platoon value (best weekly option)
        const platoonValue = Math.max(
            sortedPlayers[0].projectedPoints,
            sortedPlayers[1].projectedPoints
        );
        
        // Compare to single starter value
        const singleStarterValue = sortedPlayers[0].projectedPoints;
        const platoonGain = platoonValue - singleStarterValue;
        
        return Math.max(0, platoonGain * 0.1); // Scale down the gain
    }

    /**
     * Calculate balance penalty for position distribution
     * @param {Object} positionGrades - Grades for each position
     * @returns {number} Balance penalty (0 = balanced, negative = imbalanced)
     */
    calculateBalancePenalty(positionGrades) {
        const grades = Object.values(positionGrades).filter(g => g && g.score !== undefined);
        if (grades.length < 2) return 0;
        
        const scores = grades.map(g => g.score);
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        
        // Penalty increases with standard deviation (imbalance)
        const balancePenalty = -stdDev * 0.5;
        return balancePenalty;
    }

    /**
     * Calculate position grade using VORP and league baselines
     * @param {string} position - Position being graded
     * @param {Array} players - Players at the position
     * @param {Object} leagueSettings - League settings
     * @param {Object} replacementBaselines - League replacement baselines
     * @returns {Object} Position grade and analysis
     */
    calculatePositionGrade(position, players, leagueSettings, replacementBaselines) {
        if (!players || players.length === 0) {
            return {
                grade: 'F',
                score: 0,
                analysis: 'No players at this position',
                vorpTotal: 0,
                erlaScore: 0,
                platoonGain: 0
            };
        }

        // Calculate VORP-based scoring
        let vorpTotal = 0;
        let projectedPointsTotal = 0;
        const validPlayers = [];

        players.forEach(player => {
            if (player.projectedPoints) {
                projectedPointsTotal += player.projectedPoints;
                validPlayers.push(player);
                
                const vorpData = this.findPlayerVorpValue(player.playerName);
                if (vorpData) {
                    vorpTotal += vorpData.vorpScore;
                }
            }
        });

        if (validPlayers.length === 0) {
            return {
                grade: 'F',
                score: 0,
                analysis: 'No valid projections',
                vorpTotal: 0,
                erlaScore: 0,
                platoonGain: 0
            };
        }

        // Calculate ERLA for depth
        const erlaScore = this.calculateERLA(validPlayers, position, replacementBaselines);
        
        // Calculate platoon gain
        const platoonGain = this.calculatePlatoonGain(validPlayers, position, leagueSettings);
        
        // Base score from VORP (60% of total)
        const vorpScore = Math.max(0, vorpTotal * 0.6);
        
        // Depth score from ERLA (30% of total)
        const depthScore = Math.max(0, erlaScore * 0.3);
        
        // Platoon score (10% of total)
        const platoonScore = Math.max(0, platoonGain * 0.1);
        
        // Total position score
        const totalScore = vorpScore + depthScore + platoonScore;
        
        // Convert to letter grade
        const grade = this.scoreToGrade(totalScore);
        
        // Generate analysis
        const analysis = this.analyzePosition(position, validPlayers, grade, leagueSettings);
        
        return {
            grade,
            score: totalScore,
            analysis,
            vorpTotal,
            erlaScore,
            platoonGain,
            projectedPoints: projectedPointsTotal,
            playerCount: validPlayers.length
        };
    }

    /**
     * Calculate overall team grade with balance penalty
     * @param {Object} positionGrades - Grades for each position
     * @param {Object} leagueSettings - League settings
     * @returns {Object} Overall grade and analysis
     */
    calculateOverallGrade(positionGrades, leagueSettings) {
        let totalScore = 0;
        let totalWeight = 0;
        
        // Apply format-specific adjustments
        const adjustedWeights = { ...this.positionWeights };
        
        if (leagueSettings.isSuperflex) {
            adjustedWeights.QB *= 1.5; // Increase QB importance
        }
        
        if (leagueSettings.isTEPremium) {
            adjustedWeights.TE *= 1.3; // Increase TE importance
        }
        
        if (!leagueSettings.includeK) {
            adjustedWeights.K = 0;
        }
        
        if (!leagueSettings.includeDST) {
            adjustedWeights.DEF = 0;
        }
        
        // Calculate weighted score
        Object.keys(positionGrades).forEach(position => {
            const grade = positionGrades[position];
            const weight = adjustedWeights[position] || 0;
            
            if (grade && grade.score !== undefined && weight > 0) {
                totalScore += grade.score * weight;
                totalWeight += weight;
            }
        });
        
        // Normalize score
        const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        // Apply balance penalty
        const balancePenalty = this.calculateBalancePenalty(positionGrades);
        const finalScore = Math.max(0, normalizedScore + balancePenalty);
        
        // Convert to letter grade
        const finalGrade = this.scoreToGrade(finalScore);
        
        return {
            grade: finalGrade,
            score: finalScore,
            normalizedScore,
            balancePenalty,
            totalWeight
        };
    }

    /**
     * Main method to calculate position grades for a team
     * @param {Object} team - Team object with roster
     * @param {Object} leagueSettings - League settings
     * @returns {Object} Complete position grades and analysis
     */
    calculatePositionGrades(team, leagueSettings = {}) {
        // Reset warnings
        this.warnings = [];
        
        // Default league settings
        const settings = {
            teams: 10,
            scoring: 'PPR',
            rosterSpots: {
                QB: 1,
                RB: 2,
                WR: 2,
                TE: 1,
                FLEX: 1,
                K: 1,
                DEF: 1,
                BENCH: 7
            },
            isSuperflex: false,
            isTEPremium: false,
            includeK: true,
            includeDST: true,
            ...leagueSettings
        };
        
        // Update format settings
        this.formatSettings = {
            isSuperflex: settings.isSuperflex,
            isTEPremium: settings.isTEPremium,
            includeK: settings.includeK,
            includeDST: settings.includeDST
        };
        
        // Calculate replacement baselines
        const replacementBaselines = this.calculateReplacementBaselines(settings);
        
        // Group players by position
        const positionGroups = this.groupPlayersByPosition(team.roster || []);
        
        // Calculate grades for each position
        const positionGrades = {};
        const positionAnalysis = {};
        
        Object.keys(positionGroups).forEach(position => {
            if (positionGroups[position].length > 0) {
                const grade = this.calculatePositionGrade(
                    position, 
                    positionGroups[position], 
                    settings, 
                    replacementBaselines
                );
                positionGrades[position] = grade;
                positionAnalysis[position] = grade.analysis;
            }
        });
        
        // Calculate overall grade
        const overallGrade = this.calculateOverallGrade(positionGrades, settings);
        
        // Generate team recommendations
        const recommendations = this.generateTeamRecommendations(positionGrades, positionAnalysis, settings);
        
        // Check for missing inputs and generate warnings
        this.generateWarnings(team, settings, replacementBaselines);
        
        return {
            overallGrade,
            positionGrades,
            positionAnalysis,
            recommendations,
            warnings: this.warnings,
            replacementBaselines,
            leagueSettings: settings
        };
    }

    /**
     * Group players by position
     * @param {Array} roster - Team roster
     * @returns {Object} Players grouped by position
     */
    groupPlayersByPosition(roster) {
        const groups = {
            QB: [],
            RB: [],
            WR: [],
            TE: [],
            K: [],
            DEF: []
        };
        
        roster.forEach(player => {
            if (player.position && groups[player.position]) {
                groups[player.position].push(player);
            }
        });
        
        return groups;
    }

    /**
     * Convert score to letter grade
     * @param {number} score - Numerical score
     * @returns {string} Letter grade
     */
    scoreToGrade(score) {
        for (const [grade, threshold] of Object.entries(this.gradeThresholds)) {
            if (score >= threshold) {
                return grade;
            }
        }
        return 'F';
    }

    /**
     * Analyze position performance
     * @param {string} position - Position being analyzed
     * @param {Array} players - Players at the position
     * @param {string} grade - Position grade
     * @param {Object} settings - League settings
     * @returns {string} Analysis text
     */
    analyzePosition(position, players, grade, settings) {
        const playerCount = players.length;
        const totalPoints = players.reduce((sum, p) => sum + (p.projectedPoints || 0), 0);
        
        let analysis = `${position} Grade: ${grade}. `;
        
        if (grade.startsWith('A')) {
            analysis += `Excellent ${position} group with ${playerCount} players projected for ${totalPoints.toFixed(1)} points. `;
        } else if (grade.startsWith('B')) {
            analysis += `Good ${position} depth with ${playerCount} players projected for ${totalPoints.toFixed(1)} points. `;
        } else if (grade.startsWith('C')) {
            analysis += `Average ${position} group with ${playerCount} players projected for ${totalPoints.toFixed(1)} points. `;
        } else {
            analysis += `Weak ${position} group with ${playerCount} players projected for ${totalPoints.toFixed(1)} points. `;
        }
        
        // Add specific insights
        if (position === 'QB' && settings.isSuperflex && playerCount < 3) {
            analysis += `Consider adding QB depth for Superflex format. `;
        }
        
        if (position === 'TE' && settings.isTEPremium && playerCount < 2) {
            analysis += `TE premium format increases value - consider adding depth. `;
        }
        
        return analysis;
    }

    /**
     * Generate team recommendations
     * @param {Object} positionGrades - Position grades
     * @param {Object} positionAnalysis - Position analysis
     * @param {Object} settings - League settings
     * @returns {Array} Array of recommendations
     */
    generateTeamRecommendations(positionGrades, positionAnalysis, settings) {
        const recommendations = [];
        
        // Find weakest position
        let weakestPosition = null;
        let lowestScore = Infinity;
        
        Object.keys(positionGrades).forEach(position => {
            const grade = positionGrades[position];
            if (grade && grade.score < lowestScore) {
                lowestScore = grade.score;
                weakestPosition = position;
            }
        });
        
        if (weakestPosition) {
            recommendations.push({
                type: 'weakness',
                priority: 'high',
                message: `Focus on improving ${weakestPosition} position (Grade: ${positionGrades[weakestPosition].grade})`
            });
        }
        
        // Check for bye week conflicts
        const byeWeekConflicts = this.checkByeWeekConflicts(positionGrades, settings);
        if (byeWeekConflicts.length > 0) {
            recommendations.push({
                type: 'bye_week',
                priority: 'medium',
                message: `Bye week conflicts detected: ${byeWeekConflicts.join(', ')}`
            });
        }
        
        // Format-specific recommendations
        if (settings.isSuperflex && positionGrades.QB && positionGrades.QB.playerCount < 3) {
            recommendations.push({
                type: 'format',
                priority: 'high',
                message: 'Superflex format requires 3+ QBs for optimal performance'
            });
        }
        
        if (settings.isTEPremium && positionGrades.TE && positionGrades.TE.playerCount < 2) {
            recommendations.push({
                type: 'format',
                priority: 'medium',
                message: 'TE premium format increases TE value - consider adding depth'
            });
        }
        
        return recommendations;
    }

    /**
     * Check for bye week conflicts
     * @param {Object} positionGrades - Position grades
     * @param {Object} settings - League settings
     * @returns {Array} Array of bye week conflicts
     */
    checkByeWeekConflicts(positionGrades, settings) {
        const conflicts = [];
        
        // This would require weekly projections to fully implement
        // For now, return empty array
        return conflicts;
    }

    /**
     * Generate warnings for missing inputs
     * @param {Object} team - Team object
     * @param {Object} settings - League settings
     * @param {Object} replacementBaselines - Replacement baselines
     */
    generateWarnings(team, settings, replacementBaselines) {
        if (!team.roster || team.roster.length === 0) {
            this.warnings.push('No roster data available');
        }
        
        if (!replacementBaselines || Object.keys(replacementBaselines).length === 0) {
            this.warnings.push('Replacement baselines not calculated');
        }
        
        // Check for missing VORP data
        const playersWithoutVorp = (team.roster || []).filter(player => {
            if (!player.projectedPoints) return true;
            const vorpData = this.findPlayerVorpValue(player.playerName);
            return !vorpData;
        });
        
        if (playersWithoutVorp.length > 0) {
            this.warnings.push(`${playersWithoutVorp.length} players missing VORP data`);
        }
        
        if (Object.keys(this.byeWeeks).length === 0) {
            this.warnings.push('Bye week data not loaded');
        }
    }
} 