import 'dotenv/config';
import MasterPlayerLookup from './master-player-lookup.js';

async function testMasterLookup() {
  console.log('🧪 Testing Master Player Lookup System...\n');
  
  try {
    const lookup = new MasterPlayerLookup();
    
    // Test 1: Basic initialization
    console.log('📊 Test 1: System Initialization');
    const stats = await lookup.initialize();
    console.log(`✅ System initialized with ${stats.total_players} players and ${stats.name_variations} name variations\n`);
    
    // Test 2: Exact player lookup
    console.log('📊 Test 2: Exact Player Lookup');
    const exactPlayer = await lookup.findPlayer('jamarr chase', { exactMatch: true });
    if (exactPlayer) {
      console.log(`✅ Found: ${exactPlayer.full_name} (${exactPlayer.position}, ${exactPlayer.team})`);
      console.log(`   ADP Rank: ${exactPlayer.adp_data?.ppr?.rank || 'N/A'}`);
      console.log(`   Has Historical Stats: ${Object.keys(exactPlayer.historical_stats || {}).length > 0 ? 'Yes' : 'No'}`);
      console.log(`   Has Projections: ${Object.keys(exactPlayer.projections || {}).length > 0 ? 'Yes' : 'No'}\n`);
    } else {
      console.log('❌ Failed to find Ja\'Marr Chase\n');
    }
    
    // Test 3: Fuzzy matching with misspellings
    console.log('📊 Test 3: Fuzzy Matching with Misspellings');
    const fuzzyResults = await lookup.findPlayer('josh allen', { maxResults: 3 });
    if (fuzzyResults) {
      console.log(`✅ Found: ${fuzzyResults.full_name} (${fuzzyResults.position}, ${fuzzyResults.team})`);
      console.log(`   ADP Rank: ${fuzzyResults.adp_data?.ppr?.rank || 'N/A'}\n`);
    } else {
      console.log('❌ Failed to find Josh Allen\n');
    }
    
    // Test 4: Position-based lookup
    console.log('📊 Test 4: Position-Based Lookup');
    const qb1 = await lookup.findPlayer('qb1', { maxResults: 1 });
    if (qb1) {
      console.log(`✅ QB1: ${qb1.full_name} (${qb1.team}) - ADP Rank: ${qb1.adp_data?.ppr?.rank || 'N/A'}\n`);
    } else {
      console.log('❌ Failed to find QB1\n');
    }
    
    // Test 5: ADP rank range lookup
    console.log('📊 Test 5: ADP Rank Range Lookup');
    const top10Players = await lookup.getPlayersByADPRank(1, 10, 'ppr', 2025);
    console.log(`✅ Found ${top10Players.length} players in top 10 ADP:`);
    top10Players.slice(0, 5).forEach((player, index) => {
      const adpData = lookup.getADPData(player.player_id, 'ppr', 2025);
      console.log(`   ${index + 1}. ${player.full_name} (${player.position}, ${player.team}) - ADP: ${adpData?.rank || 'N/A'}`);
    });
    console.log('');
    
    // Test 6: Historical data lookup
    console.log('📊 Test 6: Historical Data Lookup');
    const historicalPlayer = await lookup.findPlayer('christian mccaffrey', { includeHistorical: true, includeProjections: false });
    if (historicalPlayer && historicalPlayer.historical_stats) {
      const years = Object.keys(historicalPlayer.historical_stats);
      console.log(`✅ Found historical data for ${historicalPlayer.full_name} in ${years.length} seasons: ${years.join(', ')}`);
      
      // Show 2024 stats
      if (historicalPlayer.historical_stats[2024]) {
        const stats2024 = historicalPlayer.historical_stats[2024];
        console.log(`   2024 Stats: ${stats2024.games} games, ${stats2024.fantasy_points?.ppr || 0} PPR points`);
        if (stats2024.rushing) {
          console.log(`   Rushing: ${stats2024.rushing.attempts} att, ${stats2024.rushing.yards} yds, ${stats2024.rushing.touchdowns} TDs`);
        }
        if (stats2024.receiving) {
          console.log(`   Receiving: ${stats2024.receiving.receptions} rec, ${stats2024.receiving.yards} yds, ${stats2024.receiving.touchdowns} TDs`);
        }
      }
      console.log('');
    } else {
      console.log('❌ Failed to find historical data for Christian McCaffrey\n');
    }
    
    // Test 7: Projections lookup
    console.log('📊 Test 7: Projections Lookup');
    const projectedPlayer = await lookup.findPlayer('lamar jackson', { includeHistorical: false, includeProjections: true });
    if (projectedPlayer && projectedPlayer.projections) {
      const positions = Object.keys(projectedPlayer.projections);
      console.log(`✅ Found projections for ${projectedPlayer.full_name} in ${positions.length} positions: ${positions.join(', ')}`);
      
      if (projectedPlayer.projections.qb) {
        const qbProj = projectedPlayer.projections.qb;
        console.log(`   QB Projections: ${qbProj.att || 0} pass att, ${qbProj.yards || 0} pass yds, ${qbProj.tds || 0} pass TDs`);
        console.log(`   Rushing: ${qbProj['rushing att'] || 0} att, ${qbProj['rushing yds'] || 0} yds, ${qbProj['rushing tds'] || 0} TDs`);
        console.log(`   Fantasy Points: ${qbProj.fpts || 0}`);
      }
      console.log('');
    } else {
      console.log('❌ Failed to find projections for Lamar Jackson\n');
    }
    
    // Test 8: Search by criteria
    console.log('📊 Test 8: Search by Criteria');
    const searchResults = await lookup.searchPlayers({
      position: 'RB',
      minADPRank: 1,
      maxADPRank: 20,
      format: 'ppr',
      season: 2025
    });
    console.log(`✅ Found ${searchResults.length} RBs in top 20 ADP:`);
    searchResults.slice(0, 5).forEach((player, index) => {
      const adpData = lookup.getADPData(player.player_id, 'ppr', 2025);
      console.log(`   ${index + 1}. ${player.full_name} (${player.team}) - ADP: ${adpData?.rank || 'N/A'}`);
    });
    console.log('');
    
    // Test 9: Name variations and fuzzy matching
    console.log('📊 Test 9: Name Variations and Fuzzy Matching');
    const testNames = ['josh allen', 'josh allen', 'josh allen', 'qb1', 'rb3', 'wr1'];
    
    for (const testName of testNames) {
      const result = await lookup.findPlayer(testName, { maxResults: 1 });
      if (result) {
        const adpData = lookup.getADPData(result.player_id, 'ppr', 2025);
        console.log(`✅ "${testName}" → ${result.full_name} (${result.position}, ${result.team}) - ADP: ${adpData?.rank || 'N/A'}`);
      } else {
        console.log(`❌ "${testName}" → No match found`);
      }
    }
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMasterLookup().catch(console.error); 