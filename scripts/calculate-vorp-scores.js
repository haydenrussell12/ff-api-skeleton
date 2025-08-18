import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VORPCalculator {
    constructor() {
        this.consolidatedDataPath = path.join(__dirname, '../data/consolidated/master-players.json');
        this.vorpOutputPath = path.join(__dirname, '../data/consolidated/player-vorp-scores.json');
        this.season = '2025';
    }

    async loadConsolidatedData() {
        try {
            console.log('📊 Loading consolidated player data...');
            const data = fs.readFileSync(this.consolidatedDataPath, 'utf8');
            const jsonData = JSON.parse(data);
            
            // Handle the correct structure: { metadata: {...}, players: [...] }
            const players = jsonData.players || jsonData;
            
            console.log(`✅ Loaded ${players.length} players from consolidated data`);
            console.log(`📊 Data structure: ${Array.isArray(players) ? 'Array' : 'Object'}`);
            
            if (!Array.isArray(players)) {
                throw new Error('Expected players array in consolidated data');
            }
            
            return players;
        } catch (error) {
            console.error('❌ Error loading consolidated data:', error);
            throw error;
        }
    }

    calculatePositionMedians(players) {
        console.log('🔢 Calculating position medians using fantasy-relevant player pools...');
        
        const positionGroups = {
            QB: [],
            RB: [],
            WR: [],
            TE: [],
            DEF: [],
            K: []
        };

        // Group players by position and collect projected points
        players.forEach(player => {
            // Check for projections in the consolidated data structure
            let projectedPoints = null;
            
            // Look for projections in the projections object
            if (player.projections) {
                // Check QB projections
                if (player.projections.qb && player.projections.qb.fpts) {
                    projectedPoints = parseFloat(player.projections.qb.fpts);
                }
                // Check RB projections
                else if (player.projections.rb && player.projections.rb.fpts) {
                    projectedPoints = parseFloat(player.projections.rb.fpts);
                }
                // Check WR projections
                else if (player.projections.wr && player.projections.wr.fpts) {
                    projectedPoints = parseFloat(player.projections.wr.fpts);
                }
                // Check TE projections
                else if (player.projections.te && player.projections.te.fpts) {
                    projectedPoints = parseFloat(player.projections.te.fpts);
                }
                // Check K projections
                else if (player.projections.k && player.projections.k.fpts) {
                    projectedPoints = parseFloat(player.projections.k.fpts);
                }
                // Check DST projections
                else if (player.projections.dst && player.projections.dst.fpts) {
                    projectedPoints = parseFloat(player.projections.dst.fpts);
                }
            }
            
            if (player.position && projectedPoints && projectedPoints > 0) {
                // Clean position (remove numbers like WR1 -> WR)
                const cleanPosition = player.position.replace(/\d+$/, '').toUpperCase();
                if (positionGroups[cleanPosition]) {
                    positionGroups[cleanPosition].push(projectedPoints);
                }
            }
        });

        // Calculate median for each position using fantasy-relevant player pools
        const medians = {};
        
        // QB: Top 32 (starter + some backups)
        if (positionGroups.QB.length > 0) {
            const top32QBs = positionGroups.QB
                .sort((a, b) => b - a)
                .slice(0, 32);
            const mid = Math.floor(top32QBs.length / 2);
            const median = top32QBs.length % 2 === 0 
                ? (top32QBs[mid - 1] + top32QBs[mid]) / 2 
                : top32QBs[mid];
            medians.QB = median;
            console.log(`📊 QB Median (Top 32): ${median.toFixed(2)} (${top32QBs.length} players)`);
        } else {
            medians.QB = 0;
            console.log(`⚠️  QB: No players with projections`);
        }

        // RB: Top 70 (RB2 + benches)
        if (positionGroups.RB.length > 0) {
            const top70RBs = positionGroups.RB
                .sort((a, b) => b - a)
                .slice(0, 70);
            const mid = Math.floor(top70RBs.length / 2);
            const median = top70RBs.length % 2 === 0 
                ? (top70RBs[mid - 1] + top70RBs[mid]) / 2 
                : top70RBs[mid];
            medians.RB = median;
            console.log(`📊 RB Median (Top 70): ${median.toFixed(2)} (${top70RBs.length} players)`);
        } else {
            medians.RB = 0;
            console.log(`⚠️  RB: No players with projections`);
        }

        // WR: Top 80 (WR2 + benches)
        if (positionGroups.WR.length > 0) {
            const top80WRs = positionGroups.WR
                .sort((a, b) => b - a)
                .slice(0, 80);
            const mid = Math.floor(top80WRs.length / 2);
            const median = top80WRs.length % 2 === 0 
                ? (top80WRs[mid - 1] + top80WRs[mid]) / 2 
                : top80WRs[mid];
            medians.WR = median;
            console.log(`📊 WR Median (Top 80): ${median.toFixed(2)} (${top80WRs.length} players)`);
        } else {
            medians.WR = 0;
            console.log(`⚠️  WR: No players with projections`);
        }

        // TE: Top 24 (starter + some backups)
        if (positionGroups.TE.length > 0) {
            const top24TEs = positionGroups.TE
                .sort((a, b) => b - a)
                .slice(0, 24);
            const mid = Math.floor(top24TEs.length / 2);
            const median = top24TEs.length % 2 === 0 
                ? (top24TEs[mid - 1] + top24TEs[mid]) / 2 
                : top24TEs[mid];
            medians.TE = median;
            console.log(`📊 TE Median (Top 24): ${median.toFixed(2)} (${top24TEs.length} players)`);
        } else {
            medians.TE = 0;
            console.log(`⚠️  TE: No players with projections`);
        }

        // DEF: Top 32 (starter + some backups)
        if (positionGroups.DEF.length > 0) {
            const top32DEFs = positionGroups.DEF
                .sort((a, b) => b - a)
                .slice(0, 32);
            const mid = Math.floor(top32DEFs.length / 2);
            const median = top32DEFs.length % 2 === 0 
                ? (top32DEFs[mid - 1] + top32DEFs[mid]) / 2 
                : top32DEFs[mid];
            medians.DEF = median;
            console.log(`📊 DEF Median (Top 32): ${median.toFixed(2)} (${top32DEFs.length} players)`);
        } else {
            medians.DEF = 0;
            console.log(`⚠️  DEF: No players with projections`);
        }

        // K: Top 32 (starter + some backups)
        if (positionGroups.K.length > 0) {
            const top32Ks = positionGroups.K
                .sort((a, b) => b - a)
                .slice(0, 32);
            const mid = Math.floor(top32Ks.length / 2);
            const median = top32Ks.length % 2 === 0 
                ? (top32Ks[mid - 1] + top32Ks[mid]) / 2 
                : top32Ks[mid];
            medians.K = median;
            console.log(`📊 K Median (Top 32): ${median.toFixed(2)} (${top32Ks.length} players)`);
        } else {
            medians.K = 0;
            console.log(`⚠️  K: No players with projections`);
        }

        return medians;
    }

    calculateVORPScores(players, positionMedians) {
        console.log('🎯 Calculating VORP scores...');
        
        const vorpScores = [];
        let processedCount = 0;
        let skippedCount = 0;

        // First pass: collect all VORP scores for league-wide normalization
        const allVorpScores = [];

        players.forEach(player => {
            // Check for projections in the consolidated data structure
            let projectedPoints = null;
            let position = null;
            
            // Look for projections in the projections object
            if (player.projections) {
                // Check QB projections
                if (player.projections.qb && player.projections.qb.fpts) {
                    projectedPoints = parseFloat(player.projections.qb.fpts);
                    position = 'QB';
                }
                // Check RB projections
                else if (player.projections.rb && player.projections.rb.fpts) {
                    projectedPoints = parseFloat(player.projections.rb.fpts);
                    position = 'RB';
                }
                // Check WR projections
                else if (player.projections.wr && player.projections.wr.fpts) {
                    projectedPoints = parseFloat(player.projections.wr.fpts);
                    position = 'WR';
                }
                // Check TE projections
                else if (player.projections.te && player.projections.te.fpts) {
                    projectedPoints = parseFloat(player.projections.te.fpts);
                    position = 'TE';
                }
                // Check DEF projections
                else if (player.projections.def && player.projections.def.fpts) {
                    projectedPoints = parseFloat(player.projections.def.fpts);
                    position = 'DEF';
                }
                // Check K projections
                else if (player.projections.k && player.projections.k.fpts) {
                    projectedPoints = parseFloat(player.projections.k.fpts);
                    position = 'K';
                }
            }
            
            // Fallback: check projection_data
            if (!projectedPoints && player.projection_data && player.projection_data.points) {
                projectedPoints = parseFloat(player.projection_data.points);
                position = player.position || 'UNK';
            }

            if (projectedPoints && position && positionMedians[position]) {
                const vorpScore = projectedPoints - positionMedians[position];
                allVorpScores.push(vorpScore);
                
                vorpScores.push({
                    playerName: player.full_name || player.playerName || player.name || 'Unknown Player',
                    position: position,
                    team: player.team || 'N/A',
                    projectedPoints: projectedPoints,
                    medianPoints: positionMedians[position],
                    vorpScore: vorpScore,
                    normalizedVorp: 0 // Will be calculated after collecting all VORP scores
                });
                
                processedCount++;
            } else {
                skippedCount++;
            }
        });

        console.log(`✅ Processed ${processedCount} players, skipped ${skippedCount} players`);

        // Calculate league-wide normalized VORP (0-100 scale across ALL positions)
        if (allVorpScores.length > 0) {
            const minVorp = Math.min(...allVorpScores);
            const maxVorp = Math.max(...allVorpScores);
            
            console.log(`📊 League-wide VORP range: ${minVorp.toFixed(2)} to ${maxVorp.toFixed(2)}`);
            
            vorpScores.forEach(player => {
                if (maxVorp === minVorp) {
                    player.normalizedVorp = 50; // Avoid division by zero, assign neutral score
                } else {
                    // League-wide normalization: 0-100 scale across all positions
                    player.normalizedVorp = ((player.vorpScore - minVorp) / (maxVorp - minVorp)) * 100;
                }
            });
        }

        return vorpScores;
    }

    generatePositionInsights(vorpScores) {
        console.log('📈 Generating position insights...');
        
        const positionStats = {};
        
        ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].forEach(position => {
            const positionPlayers = vorpScores.filter(p => p.position === position);
            
            if (positionPlayers.length > 0) {
                const scores = positionPlayers.map(p => p.vorpScore);
                const avgVORP = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                const maxVORP = Math.max(...scores);
                const minVORP = Math.min(...scores);
                
                positionStats[position] = {
                    playerCount: positionPlayers.length,
                    averageVORP: avgVORP,
                    maxVORP: maxVORP,
                    minVORP: minVORP,
                    topPlayers: positionPlayers
                        .sort((a, b) => b.vorpScore - a.vorpScore)
                        .slice(0, 5)
                        .map(p => ({ name: p.playerName, vorp: p.vorpScore, points: p.projectedPoints }))
                };
                
                console.log(`📊 ${position}: ${positionPlayers.length} players, Avg VORP: ${avgVORP.toFixed(2)}`);
                console.log(`   Top: ${positionStats[position].topPlayers[0]?.name} (${positionStats[position].topPlayers[0]?.vorp.toFixed(2)})`);
            }
        });
        
        return positionStats;
    }

    saveVORPData(vorpScores, positionStats) {
        console.log('💾 Saving VORP data...');
        
        const outputData = {
            metadata: {
                season: this.season,
                generatedAt: new Date().toISOString(),
                totalPlayers: vorpScores.length,
                positionStats: positionStats,
                normalizationInfo: {
                    description: "League-Wide Normalized VORP scores (0-100%) - Higher = better relative to ALL players across ALL positions",
                    method: "Min-Max normalization across the entire league (all positions combined)",
                    scale: "0-100 (0% = worst VORP in league, 100% = best VORP in league, 50% = middle of pack)",
                    note: "This allows true cross-position comparison - a 95% QB vs 93% RB means the QB is more valuable league-wide"
                }
            },
            vorpScores: vorpScores
        };

        try {
            fs.writeFileSync(this.vorpOutputPath, JSON.stringify(outputData, null, 2));
            console.log(`✅ VORP data saved to ${this.vorpOutputPath}`);
            
            // Also save a summary file
            const summaryPath = path.join(__dirname, '../data/consolidated/vorp-summary.json');
            const summary = {
                season: this.season,
                generatedAt: new Date().toISOString(),
                totalPlayers: vorpScores.length,
                positionStats: positionStats,
                normalizationInfo: outputData.metadata.normalizationInfo,
                topVORPPlayers: vorpScores
                    .sort((a, b) => b.vorpScore - a.vorpScore)
                    .slice(0, 20)
                    .map(p => ({
                        name: p.playerName,
                        position: p.position,
                        team: p.team,
                        vorp: p.vorpScore,
                        normalizedVorp: p.normalizedVorp,
                        projectedPoints: p.projectedPoints
                    })),
                topNormalizedVORPPlayers: vorpScores
                    .sort((a, b) => b.normalizedVorp - a.normalizedVorp)
                    .slice(0, 20)
                    .map(p => ({
                        name: p.playerName,
                        position: p.position,
                        team: p.team,
                        normalizedVorp: p.normalizedVorp,
                        vorp: p.vorpScore,
                        projectedPoints: p.projectedPoints
                    }))
            };
            
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
            console.log(`✅ VORP summary saved to ${summaryPath}`);
            
        } catch (error) {
            console.error('❌ Error saving VORP data:', error);
            throw error;
        }
    }

    async run() {
        try {
            console.log('🚀 Starting VORP calculation...');
            console.log(`📅 Season: ${this.season}`);
            console.log('=' * 50);
            
            // Load consolidated player data
            const players = await this.loadConsolidatedData();
            
            // Calculate position medians
            const positionMedians = this.calculatePositionMedians(players);
            
            // Calculate VORP scores
            const vorpScores = this.calculateVORPScores(players, positionMedians);
            
            // Generate insights
            const positionStats = this.generatePositionInsights(vorpScores);
            
            // Save data
            this.saveVORPData(vorpScores, positionStats);
            
            console.log('=' * 50);
            console.log('🎉 VORP calculation completed successfully!');
            console.log(`📊 Generated VORP scores for ${vorpScores.length} players`);
            
            // Display top VORP players
            console.log('\n🏆 Top 10 VORP Players:');
            vorpScores
                .sort((a, b) => b.vorpScore - a.vorpScore)
                .slice(0, 10)
                .forEach((player, index) => {
                    console.log(`${index + 1}. ${player.playerName} (${player.position}, ${player.team}) - VORP: ${player.vorpScore.toFixed(2)}, League Rank: ${player.normalizedVorp.toFixed(1)}%`);
                });

            // Display top league-wide normalized VORP players
            console.log('\n📊 Top 10 League-Wide Normalized VORP Players:');
            vorpScores
                .sort((a, b) => b.normalizedVorp - a.normalizedVorp)
                .slice(0, 10)
                .forEach((player, index) => {
                    console.log(`${index + 1}. ${player.playerName} (${player.position}, ${player.team}) - League Rank: ${player.normalizedVorp.toFixed(1)}%, VORP: ${player.vorpScore.toFixed(2)}`);
                });
                
        } catch (error) {
            console.error('❌ VORP calculation failed:', error);
            throw error;
        }
    }
}

// Run the VORP calculation
const vorpCalculator = new VORPCalculator();
vorpCalculator.run().catch(console.error); 