import LeagueConnector from './league-connector.js';

async function testLeagueConnection() {
  try {
    const connector = new LeagueConnector();
    
    // Replace with your actual Sleeper league ID
    const leagueId = '1261110724306948096';
    
    console.log('🚀 Testing Sleeper League Connection...\n');
    
    // Step 1: Connect to league
    console.log('📋 Step 1: Connecting to league...');
    const leagueInfo = await connector.connectSleeperLeague(leagueId);
    console.log(`✅ Connected to: ${leagueInfo.league_name}`);
    console.log(`   Teams: ${leagueInfo.teams_count}`);
    console.log(`   Season: ${leagueInfo.season}\n`);
    
    // Step 2: Import rosters
    console.log('📋 Step 2: Importing rosters...');
    const rosterInfo = await connector.importSleeperRosters(leagueId, 2024);
    console.log(`✅ Imported ${rosterInfo.total_players} players`);
    console.log(`   Rosters: ${rosterInfo.total_rosters}\n`);
    
    // Step 3: Get keeper recommendations for first team
    console.log('📋 Step 3: Getting keeper recommendations...');
    
    // Get first team member
    const { data: firstMember } = await connector.supabase
      .from('league_members')
      .select('member_id, team_name')
      .eq('league_id', leagueInfo.league_id)
      .limit(1)
      .single();
    
    if (firstMember) {
      console.log(`🔍 Analyzing keepers for: ${firstMember.team_name}`);
      const recommendations = await connector.getKeeperRecommendations(leagueInfo.league_id, firstMember.member_id);
      
      console.log('\n📊 Keeper Recommendations:');
      console.log('='.repeat(80));
      
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.player_name} (${rec.position} - ${rec.team})`);
        console.log(`   Current ADP: ${rec.current_adp} | Keeper Value: ${rec.keeper_value}`);
        console.log(`   Recommendation: ${rec.recommendation}`);
        console.log('');
      });
    }
    
    console.log('🎉 League connection test completed successfully!');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the test
testLeagueConnection(); 