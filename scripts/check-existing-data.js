import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class ExistingDataChecker {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Check existing data in the database
   */
  async checkExistingData() {
    try {
      console.log('🔍 Checking existing data in database...');
      
      // Check adp_data table
      await this.checkADPData();
      
      // Check rankings table
      await this.checkRankings();
      
      // Check projections table
      await this.checkProjections();
      
      // Check snapshots table
      await this.checkSnapshots();
      
    } catch (error) {
      console.error('❌ Error checking existing data:', error);
    }
  }

  /**
   * Check ADP data table
   */
  async checkADPData() {
    try {
      console.log('\n📊 Checking adp_data table...');
      
      const { data, error, count } = await this.supabase
        .from('adp_data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Error:`, error.message);
        return;
      }
      
      console.log(`  📈 Total records: ${count}`);
      
      if (count > 0) {
        const { data: sampleData } = await this.supabase
          .from('adp_data')
          .select('*')
          .limit(3);
        
        console.log('  📝 Sample records:');
        sampleData.forEach((record, index) => {
          console.log(`    ${index + 1}. ${record.full_name || record.player_name || 'Unknown'} - ${record.position || 'N/A'} - ADP: ${record.adp_rank || record.adp_value || 'N/A'}`);
        });
        
        // Check table structure
        if (sampleData.length > 0) {
          console.log('  🔧 Table structure:');
          console.log(`    Columns: ${Object.keys(sampleData[0]).join(', ')}`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Check failed:`, error.message);
    }
  }

  /**
   * Check rankings table
   */
  async checkRankings() {
    try {
      console.log('\n📊 Checking rankings table...');
      
      const { data, error, count } = await this.supabase
        .from('rankings')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Error:`, error.message);
        return;
      }
      
      console.log(`  📈 Total records: ${count}`);
      
      if (count > 0) {
        const { data: sampleData } = await this.supabase
          .from('rankings')
          .select('*')
          .limit(3);
        
        console.log('  📝 Sample records:');
        sampleData.forEach((record, index) => {
          console.log(`    ${index + 1}. ${record.player_name || 'Unknown'} - ${record.position || 'N/A'} - Rank: ${record.rank || 'N/A'}`);
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Check failed:`, error.message);
    }
  }

  /**
   * Check projections table
   */
  async checkProjections() {
    try {
      console.log('\n📊 Checking projections table...');
      
      const { data, error, count } = await this.supabase
        .from('projections')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Error:`, error.message);
        return;
      }
      
      console.log(`  📈 Total records: ${count}`);
      
      if (count > 0) {
        const { data: sampleData } = await this.supabase
          .from('projections')
          .select('*')
          .limit(3);
        
        console.log('  📝 Sample records:');
        sampleData.forEach((record, index) => {
          console.log(`    ${index + 1}. ${record.player_name || 'Unknown'} - ${record.position || 'N/A'} - Points: ${record.fantasy_points || 'N/A'}`);
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Check failed:`, error.message);
    }
  }

  /**
   * Check snapshots table
   */
  async checkSnapshots() {
    try {
      console.log('\n📊 Checking snapshots table...');
      
      const { data, error, count } = await this.supabase
        .from('snapshots')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Error:`, error.message);
        return;
      }
      
      console.log(`  📈 Total records: ${count}`);
      
      if (count > 0) {
        const { data: sampleData } = await this.supabase
          .from('snapshots')
          .select('*')
          .limit(3);
        
        console.log('  📝 Sample records:');
        sampleData.forEach((record, index) => {
          console.log(`    ${index + 1}. ID: ${record.id} - Created: ${record.created_at || 'N/A'}`);
        });
      }
      
    } catch (error) {
      console.log(`  ❌ Check failed:`, error.message);
    }
  }
}

// Run the checker
const checker = new ExistingDataChecker();
checker.checkExistingData().then(() => {
  console.log('\n🎉 Existing data check complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
}); 