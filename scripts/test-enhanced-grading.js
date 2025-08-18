import PositionGradeEngine from './position-grade-engine.js';

// Test data
const mockTeam = {
    roster: [
        {
            playerName: "Patrick Mahomes",
            position: "QB",
            projectedPoints: 320.5,
            team: "KC"
        },
        {
            playerName: "Josh Allen",
            position: "QB",
            projectedPoints: 310.2,
            team: "BUF"
        },
        {
            playerName: "Christian McCaffrey",
            position: "RB",
            projectedPoints: 280.1,
            team: "SF"
        },
        {
            playerName: "Saquon Barkley",
            position: "RB",
            projectedPoints: 220.3,
            team: "PHI"
        },
        {
            playerName: "Tyreek Hill",
            position: "WR",
            projectedPoints: 250.8,
            team: "MIA"
        },
        {
            playerName: "Stefon Diggs",
            position: "WR",
            projectedPoints: 200.5,
            team: "HOU"
        },
        {
            playerName: "Travis Kelce",
            position: "TE",
            projectedPoints: 180.2,
            team: "KC"
        },
        {
            playerName: "Justin Tucker",
            position: "K",
            projectedPoints: 140.0,
            team: "BAL"
        },
        {
            playerName: "San Francisco 49ers",
            position: "DEF",
            projectedPoints: 120.5,
            team: "SF"
        }
    ]
};

// Test scenarios
const testScenarios = [
    {
        name: "Standard 1-QB League",
        settings: {
            teams: 10,
            scoring: "PPR",
            rosterSpots: {
                QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 7
            },
            isSuperflex: false,
            isTEPremium: false,
            includeK: true,
            includeDST: true
        }
    },
    {
        name: "Superflex League",
        settings: {
            teams: 12,
            scoring: "PPR",
            rosterSpots: {
                QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1, K: 1, DEF: 1, BENCH: 6
            },
            isSuperflex: true,
            isTEPremium: false,
            includeK: true,
            includeDST: true
        }
    },
    {
        name: "TE Premium League",
        settings: {
            teams: 10,
            scoring: "PPR",
            rosterSpots: {
                QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 7
            },
            isSuperflex: false,
            isTEPremium: true,
            includeK: true,
            includeDST: true
        }
    },
    {
        name: "No Kicker/Defense League",
        settings: {
            teams: 10,
            scoring: "PPR",
            rosterSpots: {
                QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, BENCH: 8
            },
            isSuperflex: false,
            isTEPremium: false,
            includeK: false,
            includeDST: false
        }
    }
];

async function runTests() {
    console.log("🧪 Testing Enhanced VORP-Driven Grading System\n");
    
    const engine = new PositionGradeEngine();
    
    // Wait for data loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("📊 Loaded Data:");
    console.log(`   Bye Weeks: ${Object.keys(engine.byeWeeks).length} teams`);
    console.log(`   VORP Data: ${Object.keys(engine.vorpData).length} players\n`);
    
    // Test each scenario
    testScenarios.forEach((scenario, index) => {
        console.log(`🔍 Test ${index + 1}: ${scenario.name}`);
        console.log("=" * 50);
        
        try {
            const results = engine.calculatePositionGrades(mockTeam, scenario.settings);
            
            console.log(`📈 Overall Grade: ${results.overallGrade.grade} (${results.overallGrade.score.toFixed(2)})`);
            console.log(`   Normalized Score: ${results.overallGrade.normalizedScore.toFixed(2)}`);
            console.log(`   Balance Penalty: ${results.overallGrade.balancePenalty.toFixed(2)}`);
            console.log(`   Total Weight: ${results.overallGrade.totalWeight.toFixed(2)}`);
            
            console.log("\n📊 Position Grades:");
            Object.keys(results.positionGrades).forEach(position => {
                const grade = results.positionGrades[position];
                console.log(`   ${position}: ${grade.grade} (${grade.score.toFixed(2)})`);
                console.log(`     VORP: ${grade.vorpTotal.toFixed(2)} | ERLA: ${grade.erlaScore.toFixed(2)} | Platoon: ${grade.platoonGain.toFixed(2)}`);
            });
            
            console.log("\n🎯 Replacement Baselines:");
            Object.keys(results.replacementBaselines).forEach(position => {
                console.log(`   ${position}: ${results.replacementBaselines[position]} players`);
            });
            
            console.log("\n💡 Recommendations:");
            results.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
            });
            
            if (results.warnings.length > 0) {
                console.log("\n⚠️ Warnings:");
                results.warnings.forEach((warning, i) => {
                    console.log(`   ${i + 1}. ${warning}`);
                });
            }
            
        } catch (error) {
            console.error(`❌ Error in ${scenario.name}:`, error.message);
        }
        
        console.log("\n" + "=" * 50 + "\n");
    });
    
    // Test specific scenarios
    console.log("🧪 Testing Specific Scenarios:");
    
    // Test "two OK QBs vs one elite QB" scenario
    console.log("\n🔍 Two OK QBs vs One Elite QB:");
    const twoOKQBs = {
        roster: [
            { playerName: "Kirk Cousins", position: "QB", projectedPoints: 250.0, team: "ATL" },
            { playerName: "Baker Mayfield", position: "QB", projectedPoints: 240.0, team: "TB" }
        ]
    };
    
    const oneEliteQB = {
        roster: [
            { playerName: "Patrick Mahomes", position: "QB", projectedPoints: 320.0, team: "KC" }
        ]
    };
    
    const standardSettings = testScenarios[0].settings;
    
    try {
        const twoOKResults = engine.calculatePositionGrades(twoOKQBs, standardSettings);
        const oneEliteResults = engine.calculatePositionGrades(oneEliteQB, standardSettings);
        
        console.log(`   Two OK QBs: ${twoOKResults.positionGrades.QB?.grade} (${twoOKResults.positionGrades.QB?.score.toFixed(2)})`);
        console.log(`   One Elite QB: ${oneEliteResults.positionGrades.QB?.grade} (${oneEliteResults.positionGrades.QB?.score.toFixed(2)})`);
        
        if (twoOKResults.positionGrades.QB?.score > oneEliteResults.positionGrades.QB?.score) {
            console.log("   ✅ Two OK QBs strategy wins (depth advantage)");
        } else {
            console.log("   ✅ One Elite QB strategy wins (quality advantage)");
        }
        
    } catch (error) {
        console.error("❌ Error in QB comparison:", error.message);
    }
    
    console.log("\n🎉 Testing Complete!");
}

// Run tests
runTests().catch(console.error); 