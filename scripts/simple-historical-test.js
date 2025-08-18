import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class SimpleHistoricalTester {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Simple test to see what's in the database
   */
  async testDatabase() {
    try {
      console.log('🧪 Simple historical data test...');
      
      // Test 1: Check if tables exist by trying to query them
      await this.testTable('historical_player_stats');
      await this.testTable('historical_adp_data');
      await this.testTable('current_season_adp');
      
      // Test 2: Check existing tables
      await this.listExistingTables();
      
    } catch (error) {
      console.error('❌ Error testing database:', error);
    }
  }

  /**
   * Test if a specific table exists and has data
   */
  async testTable(tableName) {
    try {
      console.log(`\n📊 Testing table: ${tableName}`);
      
      const { data, error, count } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Table ${tableName} error:`, error.message);
        return;
      }
      
      console.log(`  ✅ Table ${tableName} exists`);
      console.log(`  📈 Record count: ${count}`);
      
      // Try to get a sample record
      const { data: sampleData, error: sampleError } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log(`  ❌ Sample query error:`, sampleError.message);
      } else if (sampleData && sampleData.length > 0) {
        console.log(`  📝 Sample record keys:`, Object.keys(sampleData[0]));
      }
      
    } catch (error) {
      console.log(`  ❌ Table ${tableName} test failed:`, error.message);
    }
  }

  /**
   * List existing tables by trying common ones
   */
  async listExistingTables() {
    console.log('\n🔍 Checking for existing tables...');
    
    const commonTables = [
      'players',
      'adp_data',
      'player_stats',
      'rankings',
      'projections',
      'snapshots',
      'leagues',
      'teams'
    ];
    
    for (const tableName of commonTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`  ✅ Table ${tableName} exists`);
        }
      } catch (error) {
        // Table doesn't exist
      }
    }
  }
}

// Run the simple tester
const tester = new SimpleHistoricalTester();
tester.testDatabase().then(() => {
  console.log('\n🎉 Simple database test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Testing failed:', error);
  process.exit(1);
}); 