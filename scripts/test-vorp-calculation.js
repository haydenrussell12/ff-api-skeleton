import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VORPTestCalculator {
    constructor() {
        this.season = '2025';
    }

    createSampleData() {
        console.log('🧪 Creating sample player data for testing...');
        
        // Sample players with realistic projections
        const samplePlayers = [
            // QBs
            { playerId: 'qb1', playerName: 'Patrick Mahomes', position: 'QB', team: 'KC', projectedPoints: 350.5 },
            { playerId: 'qb2', playerName: 'Josh Allen', position: 'QB', team: 'BUF', projectedPoints: 325.0 },
            { playerId: 'qb3', playerName: 'Jalen Hurts', position: 'QB', team: 'PHI', projectedPoints: 310.0 },
            { playerId: 'qb4', playerName: 'Lamar Jackson', position: 'QB', team: 'BAL', projectedPoints: 295.0 },
            { playerId: 'qb5', playerName: 'Justin Herbert', position: 'QB', team: 'LAC', projectedPoints: 280.0 },
            { playerId: 'qb6', playerName: 'Joe Burrow', position: 'QB', team: 'CIN', projectedPoints: 265.0 },
            { playerId: 'qb7', playerName: 'Dak Prescott', position: 'QB', team: 'DAL', projectedPoints: 250.0 },
            { playerId: 'qb8', playerName: 'Kirk Cousins', position: 'QB', team: 'ATL', projectedPoints: 235.0 },
            { playerId: 'qb9', playerName: 'Tua Tagovailoa', position: 'QB', team: 'MIA', projectedPoints: 220.0 },
            { playerId: 'qb10', playerName: 'Geno Smith', position: 'QB', team: 'SEA', projectedPoints: 205.0 },
            
            // RBs
            { playerId: 'rb1', playerName: 'Christian McCaffrey', position: 'RB', team: 'SF', projectedPoints: 280.0 },
            { playerId: 'rb2', playerName: 'Breece Hall', position: 'RB', team: 'NYJ', projectedPoints: 265.0 },
            { playerId: 'rb3', playerName: 'Bijan Robinson', position: 'RB', team: 'ATL', projectedPoints: 250.0 },
            { playerId: 'rb4', playerName: 'Saquon Barkley', position: 'RB', team: 'PHI', projectedPoints: 235.0 },
            { playerId: 'rb5', playerName: 'Derrick Henry', position: 'RB', team: 'BAL', projectedPoints: 220.0 },
            { playerId: 'rb6', playerName: 'Alvin Kamara', position: 'RB', team: 'NO', projectedPoints: 205.0 },
            { playerId: 'rb7', playerName: 'Travis Etienne', position: 'RB', team: 'JAX', projectedPoints: 190.0 },
            { playerId: 'rb8', playerName: 'Rachaad White', position: 'RB', team: 'TB', projectedPoints: 175.0 },
            { playerId: 'rb9', playerName: 'James Cook', position: 'RB', team: 'BUF', projectedPoints: 160.0 },
            { playerId: 'rb10', playerName: 'Zach Charbonnet', position: 'RB', team: 'SEA', projectedPoints: 145.0 },
            
            // WRs
            { playerId: 'wr1', playerName: 'Tyreek Hill', position: 'WR', team: 'MIA', projectedPoints: 250.0 },
            { playerId: 'wr2', playerName: 'CeeDee Lamb', position: 'WR', team: 'DAL', projectedPoints: 235.0 },
            { playerId: 'wr3', playerName: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', projectedPoints: 220.0 },
            { playerId: 'wr4', playerName: 'Justin Jefferson', position: 'WR', team: 'MIN', projectedPoints: 205.0 },
            { playerId: 'wr5', playerName: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', projectedPoints: 190.0 },
            { playerId: 'wr6', playerName: 'Stefon Diggs', position: 'WR', team: 'HOU', projectedPoints: 175.0 },
            { playerId: 'wr7', playerName: 'Mike Evans', position: 'WR', team: 'TB', projectedPoints: 160.0 },
            { playerId: 'wr8', playerName: 'DeVonta Smith', position: 'WR', team: 'PHI', projectedPoints: 145.0 },
            { playerId: 'wr9', playerName: 'Chris Olave', position: 'WR', team: 'NO', projectedPoints: 130.0 },
            { playerId: 'wr10', playerName: 'Drake London', position: 'WR', team: 'ATL', projectedPoints: 115.0 },
            
            // TEs
            { playerId: 'te1', playerName: 'Travis Kelce', position: 'TE', team: 'KC', projectedPoints: 180.0 },
            { playerId: 'te2', playerName: 'Sam LaPorta', position: 'TE', team: 'DET', projectedPoints: 165.0 },
            { playerId: 'te3', playerName: 'T.J. Hockenson', position: 'TE', team: 'MIN', projectedPoints: 150.0 },
            { playerId: 'te4', playerName: 'Mark Andrews', position: 'TE', team: 'BAL', projectedPoints: 135.0 },
            { playerId: 'te5', playerName: 'George Kittle', position: 'TE', team: 'SF', projectedPoints: 120.0 },
            { playerId: 'te6', playerName: 'Evan Engram', position: 'TE', team: 'JAX', projectedPoints: 105.0 },
            { playerId: 'te7', playerName: 'Jake Ferguson', position: 'TE', team: 'DAL', projectedPoints: 90.0 },
            { playerId: 'te8', playerName: 'Dalton Kincaid', position: 'TE', team: 'BUF', projectedPoints: 75.0 },
            { playerId: 'te9', playerName: 'Trey McBride', position: 'TE', team: 'ARI', projectedPoints: 60.0 },
            { playerId: 'te10', playerName: 'Kyle Pitts', position: 'TE', team: 'ATL', projectedPoints: 45.0 },
            
            // DEFs
            { playerId: 'def1', playerName: 'San Francisco 49ers', position: 'DEF', team: 'SF', projectedPoints: 150.0 },
            { playerId: 'def2', playerName: 'Dallas Cowboys', position: 'DEF', team: 'DAL', projectedPoints: 135.0 },
            { playerId: 'def3', playerName: 'Baltimore Ravens', position: 'DEF', team: 'BAL', projectedPoints: 120.0 },
            { playerId: 'def4', playerName: 'Buffalo Bills', position: 'DEF', team: 'BUF', projectedPoints: 105.0 },
            { playerId: 'def5', playerName: 'New York Jets', position: 'DEF', team: 'NYJ', projectedPoints: 90.0 },
            { playerId: 'def6', playerName: 'Philadelphia Eagles', position: 'DEF', team: 'PHI', projectedPoints: 75.0 },
            { playerId: 'def7', playerName: 'Kansas City Chiefs', position: 'DEF', team: 'KC', projectedPoints: 60.0 },
            { playerId: 'def8', playerName: 'New England Patriots', position: 'DEF', team: 'NE', projectedPoints: 45.0 },
            { playerId: 'def9', playerName: 'Green Bay Packers', position: 'DEF', team: 'GB', projectedPoints: 30.0 },
            { playerId: 'def10', playerName: 'Detroit Lions', position: 'DEF', team: 'DET', projectedPoints: 15.0 },
            
            // Ks
            { playerId: 'k1', playerName: 'Justin Tucker', position: 'K', team: 'BAL', projectedPoints: 150.0 },
            { playerId: 'k2', playerName: 'Harrison Butker', position: 'K', team: 'KC', projectedPoints: 135.0 },
            { playerId: 'k3', playerName: 'Evan McPherson', position: 'K', team: 'CIN', projectedPoints: 120.0 },
            { playerId: 'k4', playerName: 'Tyler Bass', position: 'K', team: 'BUF', projectedPoints: 105.0 },
            { playerId: 'k5', playerName: 'Younghoe Koo', position: 'K', team: 'ATL', projectedPoints: 90.0 },
            { playerId: 'k6', playerName: 'Brandon Aubrey', position: 'K', team: 'DAL', projectedPoints: 75.0 },
            { playerId: 'k7', playerName: 'Ka\'imi Fairbairn', position: 'K', team: 'HOU', projectedPoints: 60.0 },
            { playerId: 'k8', playerName: 'Cameron Dicker', position: 'K', team: 'LAC', projectedPoints: 45.0 },
            { playerId: 'k9', playerName: 'Jake Bates', position: 'K', team: 'DET', projectedPoints: 30.0 },
            { playerId: 'k10', playerName: 'Chase McLaughlin', position: 'K', team: 'TB', projectedPoints: 15.0 }
        ];
        
        console.log(`✅ Created ${samplePlayers.length} sample players`);
        return samplePlayers;
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
            if (player.position && player.projectedPoints && player.projectedPoints > 0) {
                const position = player.position.toUpperCase();
                if (positionGroups[position]) {
                    positionGroups[position].push(player.projectedPoints);
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

        players.forEach(player => {
            if (!player.position || !player.projectedPoints || player.projectedPoints <= 0) {
                skippedCount++;
                return;
            }

            const position = player.position.toUpperCase();
            const median = positionMedians[position];
            
            if (median === undefined || median === 0) {
                skippedCount++;
                return;
            }

            const vorpScore = player.projectedPoints - median;
            
            vorpScores.push({
                playerId: player.playerId,
                playerName: player.playerName,
                position: position,
                team: player.team,
                projectedPoints: player.projectedPoints,
                medianPoints: median,
                vorpScore: vorpScore,
                season: this.season
            });

            processedCount++;
        });

        console.log(`✅ Processed ${processedCount} players with VORP scores`);
        console.log(`⚠️  Skipped ${skippedCount} players (missing data or position)`);
        
        return vorpScores;
    }

    displayResults(vorpScores, positionMedians) {
        console.log('\n📊 VORP Calculation Results:');
        console.log('=' * 60);
        
        // Display position medians
        console.log('🎯 Position Medians (Replacement Level):');
        Object.keys(positionMedians).forEach(position => {
            console.log(`   ${position}: ${positionMedians[position].toFixed(2)} points`);
        });
        
        console.log('\n🏆 Top VORP Players by Position:');
        ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'].forEach(position => {
            const positionPlayers = vorpScores.filter(p => p.position === position);
            if (positionPlayers.length > 0) {
                const topPlayer = positionPlayers.sort((a, b) => b.vorpScore - a.vorpScore)[0];
                console.log(`   ${position}: ${topPlayer.playerName} (${topPlayer.team}) - VORP: ${topPlayer.vorpScore.toFixed(2)}`);
            }
        });
        
        console.log('\n🔥 Overall Top 10 VORP Players:');
        vorpScores
            .sort((a, b) => b.vorpScore - a.vorpScore)
            .slice(0, 10)
            .forEach((player, index) => {
                console.log(`${index + 1}. ${player.playerName} (${player.position}, ${player.team}) - VORP: ${player.vorpScore.toFixed(2)}`);
            });
        
        console.log('\n📈 VORP Score Interpretation:');
        console.log('   Positive VORP = Above replacement level (better than median)');
        console.log('   Negative VORP = Below replacement level (worse than median)');
        console.log('   Higher positive VORP = More valuable relative to position');
    }

    async run() {
        try {
            console.log('🧪 Starting VORP calculation test...');
            console.log('=' * 50);
            
            // Create sample data
            const players = this.createSampleData();
            
            // Calculate position medians
            const positionMedians = this.calculatePositionMedians(players);
            
            // Calculate VORP scores
            const vorpScores = this.calculateVORPScores(players, positionMedians);
            
            // Display results
            this.displayResults(vorpScores, positionMedians);
            
            console.log('\n=' * 50);
            console.log('🎉 VORP calculation test completed successfully!');
            
        } catch (error) {
            console.error('❌ VORP calculation test failed:', error);
            throw error;
        }
    }
}

// Run the VORP test
const vorpTest = new VORPTestCalculator();
vorpTest.run().catch(console.error); 