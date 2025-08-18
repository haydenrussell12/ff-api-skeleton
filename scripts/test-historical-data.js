import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class HistoricalDataTester {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Test all loaded historical data
   */
  async testAllData() {
    try {
      console.log('🧪 Testing historical data loading...');
      
      // Test historical player stats
      await this.testHistoricalPlayerStats();
      
      // Test historical ADP data
      await this.testHistoricalADPData();
      
      // Test current season ADP data
      await this.testCurrentSeasonADPData();
      
      console.log('✅ All historical data tests completed!');
      
    } catch (error) {
      console.error('❌ Error testing historical data:', error);
    }
  }

  /**
   * Test historical player stats data
   */
  async testHistoricalPlayerStats() {
    console.log('\n📊 Testing Historical Player Stats...');
    
    try {
      // Get total count
      const { count, error: countError } = await this.supabase
        .from('historical_player_stats')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Error counting historical stats:', countError);
        return;
      }
      
      console.log(`  📈 Total historical stats records: ${count}`);
      
      // Test data by season
      const { data: seasonData, error: seasonError } = await this.supabase
        .from('historical_player_stats')
        .select('season, count')
        .group('season')
        .order('season');
      
      if (seasonError) {
        console.error('❌ Error getting season breakdown:', seasonError);
      } else {
        console.log('  📅 Records by season:');
        seasonData.forEach(row => {
          console.log(`    ${row.season}: ${row.count} records`);
        });
      }
      
      // Test sample data
      const { data: sampleData, error: sampleError } = await this.supabase
        .from('historical_player_stats')
        .select('*')
        .eq('season', 2024)
        .eq('position', 'RB')
        .order('overall_rank')
        .limit(5);
      
      if (sampleError) {
        console.error('❌ Error getting sample data:', sampleError);
      } else {
        console.log('  🏃 Sample 2024 RB data:');
        sampleData.forEach(player => {
          console.log(`    ${player.overall_rank}. ${player.player_name} (${player.team}) - ${player.fantasy_points_ppr} PPR pts`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing historical stats:', error);
    }
  }

  /**
   * Test historical ADP data
   */
  async testHistoricalADPData() {
    console.log('\n📊 Testing Historical ADP Data...');
    
    try {
      // Get total count
      const { count, error: countError } = await this.supabase
        .from('historical_adp_data')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Error counting historical ADP:', countError);
        return;
      }
      
      console.log(`  📈 Total historical ADP records: ${count}`);
      
      // Test data by season and format
      const { data: formatData, error: formatError } = await this.supabase
        .from('historical_adp_data')
        .select('season, format, count')
        .group('season, format')
        .order('season, format');
      
      if (formatError) {
        console.error('❌ Error getting format breakdown:', formatError);
      } else {
        console.log('  📅 Records by season and format:');
        formatData.forEach(row => {
          console.log(`    ${row.season} ${row.format.toUpperCase()}: ${row.count} records`);
        });
      }
      
      // Test sample ADP data
      const { data: sampleData, error: sampleError } = await this.supabase
        .from('historical_adp_data')
        .select('*')
        .eq('season', 2024)
        .eq('format', 'ppr')
        .order('rank')
        .limit(5);
      
      if (sampleError) {
        console.error('❌ Error getting sample ADP data:', sampleError);
      } else {
        console.log('  🏆 Sample 2024 PPR ADP data:');
        sampleData.forEach(player => {
          console.log(`    ${player.rank}. ${player.player_name} (${player.position}, ${player.team}) - ADP: ${player.average_adp}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing historical ADP:', error);
    }
  }

  /**
   * Test current season ADP data
   */
  async testCurrentSeasonADPData() {
    console.log('\n📊 Testing 2025 Current Season ADP Data...');
    
    try {
      // Get total count
      const { count, error: countError } = await this.supabase
        .from('current_season_adp')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Error counting current season ADP:', countError);
        return;
      }
      
      console.log(`  📈 Total 2025 ADP records: ${count}`);
      
      // Test data by format
      const { data: formatData, error: formatError } = await this.supabase
        .from('current_season_adp')
        .select('format, count')
        .group('format')
        .order('format');
      
      if (formatError) {
        console.error('❌ Error getting format breakdown:', formatError);
      } else {
        console.log('  📅 Records by format:');
        formatData.forEach(row => {
          console.log(`    ${row.format.toUpperCase()}: ${row.count} records`);
        });
      }
      
      // Test sample current ADP data
      const { data: sampleData, error: sampleError } = await this.supabase
        .from('current_season_adp')
        .select('*')
        .eq('format', 'ppr')
        .order('rank')
        .limit(10);
      
      if (sampleError) {
        console.error('❌ Error getting sample current ADP data:', sampleError);
      } else {
        console.log('  🏆 Sample 2025 PPR ADP data:');
        sampleData.forEach(player => {
          console.log(`    ${player.rank}. ${player.player_name} (${player.position}, ${player.team}) - ADP: ${player.average_adp}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error testing current season ADP:', error);
    }
  }

  /**
   * Test data relationships and queries
   */
  async testDataRelationships() {
    console.log('\n🔗 Testing Data Relationships...');
    
    try {
      // Test finding a player across multiple tables
      const playerName = 'Christian McCaffrey';
      
      console.log(`  🔍 Testing data for: ${playerName}`);
      
      // Get historical stats
      const { data: statsData, error: statsError } = await this.supabase
        .from('historical_player_stats')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .order('season');
      
      if (statsError) {
        console.error('❌ Error getting historical stats:', statsError);
      } else {
        console.log(`    📊 Historical stats found: ${statsData.length} seasons`);
        statsData.forEach(stat => {
          console.log(`      ${stat.season}: ${stat.fantasy_points_ppr} PPR pts, Rank: ${stat.overall_rank}`);
        });
      }
      
      // Get historical ADP
      const { data: adpData, error: adpError } = await this.supabase
        .from('historical_adp_data')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .eq('format', 'ppr')
        .order('season');
      
      if (adpError) {
        console.error('❌ Error getting historical ADP:', adpError);
      } else {
        console.log(`    📊 Historical ADP found: ${adpData.length} seasons`);
        adpData.forEach(adp => {
          console.log(`      ${adp.season}: Rank ${adp.rank}, ADP ${adp.average_adp}`);
        });
      }
      
      // Get current season ADP
      const { data: currentADP, error: currentError } = await this.supabase
        .from('current_season_adp')
        .select('*')
        .ilike('player_name', `%${playerName}%`)
        .eq('format', 'ppr');
      
      if (currentError) {
        console.error('❌ Error getting current ADP:', currentError);
      } else if (currentADP.length > 0) {
        console.log(`    📊 2025 ADP: Rank ${currentADP[0].rank}, ADP ${currentADP[0].average_adp}`);
      } else {
        console.log('    📊 2025 ADP: Not found');
      }
      
    } catch (error) {
      console.error('❌ Error testing data relationships:', error);
    }
  }
}

// Run the tester
const tester = new HistoricalDataTester();
tester.testAllData().then(() => {
  console.log('\n🎉 Historical data testing complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Testing failed:', error);
  process.exit(1);
}); 