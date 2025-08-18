import 'dotenv/config';
import DraftAnalyzer from './draft-analyzer.js';

async function testDraftAnalyzerADP() {
  console.log('🧪 Testing Draft Analyzer 2025 ADP Integration...\n');
  
  try {
    const analyzer = new DraftAnalyzer();
    
    // Test loading 2025 ADP data
    console.log('📊 Testing 2025 ADP data loading...');
    const adpData = await analyzer.load2025ADPData();
    
    if (adpData && adpData.length > 0) {
      console.log(`✅ Successfully loaded ${adpData.length} players with 2025 ADP data`);
      
      // Show some sample data
      console.log('\n📋 Sample 2025 ADP data:');
      adpData.slice(0, 10).forEach((player, index) => {
        console.log(`${index + 1}. ${player.player_name} (${player.position}, ${player.team}) - Rank: ${player.rank}`);
        if (player.ppr_rank && player.standard_rank) {
          console.log(`   PPR: ${player.ppr_rank}, Standard: ${player.standard_rank}`);
        }
      });
      
      // Test ADP rank lookup for different formats
      console.log('\n🔍 Testing ADP rank lookups...');
      
      const testPlayers = ['Ja\'Marr Chase', 'Bijan Robinson', 'Saquon Barkley'];
      
      for (const player of testPlayers) {
        const pprRank = analyzer.getADPRank(player, 'ppr');
        const standardRank = analyzer.getADPRank(player, 'standard');
        
        console.log(`${player}:`);
        console.log(`  PPR Rank: ${pprRank || 'Not found'}`);
        console.log(`  Standard Rank: ${standardRank || 'Not found'}`);
      }
      
      // Test fuzzy matching
      console.log('\n🔍 Testing fuzzy name matching...');
      const fuzzyTests = [
        'Marvin Harrison',
        'Kenneth Walker', 
        'Aaron Jones',
        'Brian Robinson'
      ];
      
      for (const player of fuzzyTests) {
        const rank = analyzer.getADPRank(player, 'ppr');
        console.log(`${player} -> PPR Rank: ${rank || 'Not found'}`);
      }
      
    } else {
      console.log('❌ Failed to load 2025 ADP data');
    }
    
  } catch (error) {
    console.error('❌ Error testing draft analyzer ADP:', error);
  }
}

// Run the test
testDraftAnalyzerADP(); 