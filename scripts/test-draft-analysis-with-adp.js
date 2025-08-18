import 'dotenv/config';
import DraftAnalyzer from './draft-analyzer.js';

async function testDraftAnalysisWithADP() {
  console.log('🧪 Testing Draft Analysis with 2025 FantasyPros ADP Data...\n');
  
  try {
    const analyzer = new DraftAnalyzer();
    
    // Test loading 2025 ADP data
    console.log('📊 Loading 2025 ADP data...');
    const adpData = await analyzer.load2025ADPData();
    
    if (!adpData || adpData.length === 0) {
      console.log('❌ Failed to load 2025 ADP data');
      return;
    }
    
    console.log(`✅ Successfully loaded ${adpData.length} players with 2025 ADP data`);
    
    // Test ADP rank lookups for different formats
    console.log('\n🔍 Testing ADP rank lookups for different formats...');
    
    const testPlayers = [
      { name: 'Ja\'Marr Chase', expectedPPR: 1, expectedStandard: 1 },
      { name: 'Bijan Robinson', expectedPPR: 2, expectedStandard: 2 },
      { name: 'Saquon Barkley', expectedPPR: 3, expectedStandard: 3 },
      { name: 'Justin Jefferson', expectedPPR: 4, expectedStandard: 4 },
      { name: 'Jahmyr Gibbs', expectedPPR: 5, expectedStandard: 5 }
    ];
    
    let allTestsPassed = true;
    
    for (const test of testPlayers) {
      const pprRank = analyzer.getADPRank(test.name, 'ppr');
      const standardRank = analyzer.getADPRank(test.name, 'standard');
      
      const pprPass = pprRank === test.expectedPPR;
      const standardPass = standardRank === test.expectedStandard;
      
      console.log(`${test.name}:`);
      console.log(`  PPR: ${pprRank} (${pprPass ? '✅' : '❌'} expected ${test.expectedPPR})`);
      console.log(`  Standard: ${standardRank} (${standardPass ? '✅' : '❌'} expected ${test.expectedStandard})`);
      
      if (!pprPass || !standardPass) {
        allTestsPassed = false;
      }
    }
    
    // Test fuzzy matching for players with suffixes
    console.log('\n🔍 Testing fuzzy name matching...');
    
    const fuzzyTests = [
      { name: 'Marvin Harrison', expectedRank: 41 },
      { name: 'Kenneth Walker', expectedRank: 42 },
      { name: 'Aaron Jones', expectedRank: 65 },
      { name: 'Brian Robinson', expectedRank: 79 }
    ];
    
    for (const test of fuzzyTests) {
      const rank = analyzer.getADPRank(test.name, 'ppr');
      const passed = rank === test.expectedRank;
      
      console.log(`${test.name} -> PPR Rank: ${rank} (${passed ? '✅' : '❌'} expected ${test.expectedRank})`);
      
      if (!passed) {
        allTestsPassed = false;
      }
    }
    
    // Test ADP value calculations
    console.log('\n💰 Testing ADP value calculations...');
    
    const mockPick = { pick_no: 15 };
    const mockProjection = { adp_rank: 10 };
    
    const adpValue = analyzer.calculateADPValue(mockPick, mockProjection);
    const expectedValue = 15 - 10; // 5 (good pick - drafted later than expected)
    
    console.log(`Pick 15 vs ADP 10: Value = ${adpValue} (${adpValue === expectedValue ? '✅' : '❌'} expected ${expectedValue})`);
    
    if (adpValue !== expectedValue) {
      allTestsPassed = false;
    }
    
    // Test projections data integration
    console.log('\n📊 Testing projections data integration...');
    
    try {
      const projections = await analyzer.getPlayerProjections('fantasypros', 'ppr');
      
      if (projections && Object.keys(projections).length > 0) {
        console.log(`✅ Successfully loaded projections for ${Object.keys(projections).length} players`);
        
        // Check if ADP data is properly integrated
        const samplePlayer = Object.values(projections)[0];
        if (samplePlayer && samplePlayer.adp_rank) {
          console.log(`✅ ADP data properly integrated - Sample player has ADP rank: ${samplePlayer.adp_rank}`);
        } else {
          console.log('❌ ADP data not properly integrated into projections');
          allTestsPassed = false;
        }
      } else {
        console.log('❌ Failed to load projections data');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`❌ Error loading projections: ${error.message}`);
      allTestsPassed = false;
    }
    
    // Summary
    console.log('\n📋 Test Summary:');
    if (allTestsPassed) {
      console.log('🎉 All tests passed! The draft analyzer is properly integrated with 2025 FantasyPros ADP data.');
      console.log('\n✅ Features working:');
      console.log('  - 2025 ADP data loading (PPR + Standard)');
      console.log('  - Format-specific ADP rank lookups');
      console.log('  - Fuzzy name matching for Jr./Sr./III suffixes');
      console.log('  - ADP value calculations');
      console.log('  - Projections data integration');
    } else {
      console.log('❌ Some tests failed. Please check the output above for details.');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testDraftAnalysisWithADP(); 