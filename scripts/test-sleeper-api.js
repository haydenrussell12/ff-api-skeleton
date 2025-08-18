import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class SleeperAPITester {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.sleeperBaseUrl = 'https://api.sleeper.app/v1';
  }

  /**
   * Main test method
   */
  async runAllTests() {
    console.log('🧪 Starting comprehensive Sleeper API tests...\n');
    
    try {
      // Test 1: Basic API connectivity
      await this.testBasicConnectivity();
      
      // Test 2: Fetch all NFL players
      await this.testFetchAllPlayers();
      
      // Test 3: Fetch specific player details
      await this.testFetchPlayerDetails();
      
      // Test 4: Fetch player stats
      await this.testFetchPlayerStats();
      
      // Test 5: Test database operations
      await this.testDatabaseOperations();
      
      // Test 6: Test ADP data
      await this.testADPData();
      
      console.log('\n🎉 All tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
    }
  }

  /**
   * Test 1: Basic API connectivity
   */
  async testBasicConnectivity() {
    console.log('🔌 Test 1: Testing basic API connectivity...');
    
    try {
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ Sleeper API is accessible');
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
      
    } catch (error) {
      console.error('❌ Basic connectivity test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 2: Fetch all NFL players
   */
  async testFetchAllPlayers() {
    console.log('\n👥 Test 2: Testing fetch all NFL players...');
    
    try {
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      const players = await response.json();
      
      console.log(`✅ Successfully fetched ${Object.keys(players).length} players from Sleeper`);
      
      // Analyze the data structure
      const samplePlayer = Object.values(players)[0];
      console.log('📊 Sample player data structure:');
      console.log(JSON.stringify(samplePlayer, null, 2));
      
      // Count players by position
      const positionCounts = {};
      Object.values(players).forEach(player => {
        if (player.position) {
          positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
        }
      });
      
      console.log('📊 Players by position:');
      Object.entries(positionCounts).forEach(([pos, count]) => {
        console.log(`   ${pos}: ${count}`);
      });
      
      // Check for key fields
      const hasRequiredFields = Object.values(players).some(player => 
        player.player_id && player.full_name && player.position
      );
      
      if (hasRequiredFields) {
        console.log('✅ Players have required fields (player_id, full_name, position)');
      } else {
        console.log('⚠️  Some players missing required fields');
      }
      
    } catch (error) {
      console.error('❌ Fetch all players test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 3: Fetch specific player details
   */
  async testFetchPlayerDetails() {
    console.log('\n🔍 Test 3: Testing fetch specific player details...');
    
    try {
      // Test with a known player (Christian McCaffrey)
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      const players = await response.json();
      
      // Find a well-known player
      const samplePlayer = Object.values(players).find(player => 
        player.full_name && player.full_name.includes('McCaffrey')
      );
      
      if (samplePlayer) {
        console.log('✅ Found sample player:', samplePlayer.full_name);
        console.log('📊 Player details:');
        console.log(JSON.stringify(samplePlayer, null, 2));
        
        // Test fetching individual player by ID
        const playerResponse = await fetch(`${this.sleeperBaseUrl}/players/nfl/${samplePlayer.player_id}`);
        if (playerResponse.ok) {
          const playerData = await playerResponse.json();
          console.log('✅ Successfully fetched individual player data');
          console.log('📊 Individual player response structure:');
          console.log(JSON.stringify(playerData, null, 2));
        } else {
          console.log('⚠️  Individual player fetch not supported or failed');
        }
      } else {
        console.log('⚠️  Could not find sample player for detailed testing');
      }
      
    } catch (error) {
      console.error('❌ Fetch specific player details test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 4: Fetch player stats
   */
  async testFetchPlayerStats() {
    console.log('\n📈 Test 4: Testing fetch player stats...');
    
    try {
      // Test fetching stats for a specific player
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      const players = await response.json();
      
      // Find a player with stats
      const playerWithStats = Object.values(players).find(player => 
        player.stats && Object.keys(player.stats).length > 0
      );
      
      if (playerWithStats) {
        console.log('✅ Found player with stats:', playerWithStats.full_name);
        console.log('📊 Stats data:');
        console.log(JSON.stringify(playerWithStats.stats, null, 2));
        
        // Check for different stat types
        const statTypes = Object.keys(playerWithStats.stats);
        console.log(`📊 Available stat types: ${statTypes.join(', ')}`);
        
        // Check for recent stats
        const recentStats = statTypes.filter(stat => stat.includes('2024') || stat.includes('2023'));
        if (recentStats.length > 0) {
          console.log(`✅ Found recent stats: ${recentStats.join(', ')}`);
        } else {
          console.log('⚠️  No recent stats found');
        }
      } else {
        console.log('⚠️  No players with stats found in current data');
        
        // Try to fetch stats for a specific player ID
        console.log('🔍 Attempting to fetch stats for a specific player...');
        const testPlayerId = '4362621'; // Example player ID
        
        try {
          const statsResponse = await fetch(`${this.sleeperBaseUrl}/players/nfl/${testPlayerId}`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Successfully fetched stats for test player');
            console.log('📊 Stats data structure:');
            console.log(JSON.stringify(statsData, null, 2));
          } else {
            console.log(`⚠️  Stats fetch failed for player ${testPlayerId}: ${statsResponse.status}`);
          }
        } catch (statsError) {
          console.log('⚠️  Stats fetch not supported or failed');
        }
      }
      
    } catch (error) {
      console.error('❌ Fetch player stats test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 5: Test database operations
   */
  async testDatabaseOperations() {
    console.log('\n💾 Test 5: Testing database operations...');
    
    try {
      // Test database connection
      const { data: testData, error: testError } = await this.supabase
        .from('players')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection failed:', testError.message);
        throw testError;
      }
      
      console.log('✅ Database connection successful');
      
      // Test player count
      const { count: playerCount, error: countError } = await this.supabase
        .from('players')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Player count query failed:', countError.message);
      } else {
        console.log(`📊 Current players in database: ${playerCount}`);
      }
      
      // Test inserting a test player
      const testPlayer = {
        full_name: 'TEST_PLAYER_SLEEPER_API_TEST',
        position: 'QB',
        team_code: 'TEST',
        sleeper_id: '999999999'
      };
      
      const { data: insertData, error: insertError } = await this.supabase
        .from('players')
        .insert(testPlayer)
        .select();
      
      if (insertError) {
        console.log('⚠️  Test player insert failed (may already exist):', insertError.message);
      } else {
        console.log('✅ Test player inserted successfully');
        
        // Clean up test player
        const { error: deleteError } = await this.supabase
          .from('players')
          .delete()
          .eq('full_name', 'TEST_PLAYER_SLEEPER_API_TEST');
        
        if (deleteError) {
          console.log('⚠️  Test player cleanup failed:', deleteError.message);
        } else {
          console.log('✅ Test player cleaned up successfully');
        }
      }
      
    } catch (error) {
      console.error('❌ Database operations test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 6: Test ADP data
   */
  async testADPData() {
    console.log('\n🎯 Test 6: Testing ADP data...');
    
    try {
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      const players = await response.json();
      
      // Look for players with ADP-related data
      const playersWithADP = Object.values(players).filter(player => 
        player.search_rank || player.adp || player.ecr
      );
      
      console.log(`📊 Found ${playersWithADP.length} players with ADP/ranking data`);
      
      if (playersWithADP.length > 0) {
        const sampleADPPlayer = playersWithADP[0];
        console.log('📊 Sample ADP player data:');
        console.log(JSON.stringify(sampleADPPlayer, null, 2));
        
        // Analyze ADP data structure
        const adpFields = [];
        if (sampleADPPlayer.search_rank) adpFields.push('search_rank');
        if (sampleADPPlayer.adp) adpFields.push('adp');
        if (sampleADPPlayer.ecr) adpFields.push('ecr');
        
        console.log(`📊 Available ADP fields: ${adpFields.join(', ')}`);
        
        // Check ADP data quality
        const validADPPlayers = playersWithADP.filter(player => 
          player.search_rank && player.search_rank > 0 && player.search_rank < 1000
        );
        
        console.log(`📊 Players with valid search_rank: ${validADPPlayers.length}`);
        
        if (validADPPlayers.length > 0) {
          const sortedPlayers = validADPPlayers
            .sort((a, b) => a.search_rank - b.search_rank)
            .slice(0, 10);
          
          console.log('🏆 Top 10 players by search_rank:');
          sortedPlayers.forEach((player, index) => {
            console.log(`   ${index + 1}. ${player.full_name} (${player.position}) - Rank: ${player.search_rank}`);
          });
        }
      } else {
        console.log('⚠️  No ADP data found in current player data');
      }
      
    } catch (error) {
      console.error('❌ ADP data test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test specific Sleeper endpoints
   */
  async testSpecificEndpoints() {
    console.log('\n🔗 Test 7: Testing specific Sleeper endpoints...');
    
    const endpoints = [
      '/players/nfl',
      '/players/nfl/4362621', // Example player ID
      '/players/nfl/4362621/stats', // Example player stats
      '/players/nfl/4362621/trending', // Example player trending
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔍 Testing endpoint: ${endpoint}`);
        const response = await fetch(`${this.sleeperBaseUrl}${endpoint}`);
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📊 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Endpoint accessible, data type: ${typeof data}`);
          
          if (typeof data === 'object') {
            console.log(`📊 Data keys: ${Object.keys(data).slice(0, 10).join(', ')}...`);
          }
        } else {
          console.log(`⚠️  Endpoint returned error: ${response.statusText}`);
        }
        
      } catch (error) {
        console.log(`❌ Endpoint test failed: ${error.message}`);
      }
    }
  }
}

// Run the tests
const tester = new SleeperAPITester();
tester.runAllTests().catch(console.error); 