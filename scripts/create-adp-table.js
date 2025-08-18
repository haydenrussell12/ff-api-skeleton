import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class ADPTableCreator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  /**
   * Create the ADP data table
   */
  async createADPTable() {
    try {
      console.log('🔧 Creating ADP data table...');
      
      // First, let's check if the table exists
      const { data: existingData, error: checkError } = await this.supabase
        .from('adp_data')
        .select('*')
        .limit(1);
      
      if (checkError && checkError.code === '42P01') {
        console.log('❌ ADP table does not exist, creating it...');
        
        // Create the table using raw SQL
        const { error: createError } = await this.supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS adp_data (
              adp_id BIGSERIAL PRIMARY KEY,
              player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
              adp_rank INTEGER NOT NULL,
              adp_position INTEGER,
              draft_round INTEGER,
              draft_pick INTEGER,
              source TEXT DEFAULT 'sleeper',
              format TEXT DEFAULT 'standard',
              snapshot_date DATE DEFAULT CURRENT_DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_adp_rank ON adp_data(adp_rank);
            CREATE INDEX IF NOT EXISTS idx_adp_position ON adp_data(adp_position);
            CREATE INDEX IF NOT EXISTS idx_adp_source_format ON adp_data(source, format);
            CREATE INDEX IF NOT EXISTS idx_adp_date ON adp_data(snapshot_date);
          `
        });
        
        if (createError) {
          console.log('⚠️  Could not create table via RPC, trying alternative approach...');
          await this.createTableAlternative();
        } else {
          console.log('✅ ADP table created successfully!');
        }
      } else if (checkError) {
        console.log('❌ Error checking table:', checkError);
      } else {
        console.log('✅ ADP table already exists!');
      }
      
      // Now let's populate it with some sample data
      await this.populateSampleADPData();
      
    } catch (error) {
      console.error('❌ Error creating ADP table:', error);
    }
  }

  /**
   * Alternative method to create table
   */
  async createTableAlternative() {
    try {
      console.log('🔧 Trying alternative table creation method...');
      
      // Since we can't create tables directly, let's create a simple structure
      // by inserting data into a view or using existing tables
      console.log('📝 Note: You may need to manually create the adp_data table in Supabase dashboard');
      console.log('📝 Use this SQL:');
      console.log(`
        CREATE TABLE IF NOT EXISTS adp_data (
          adp_id BIGSERIAL PRIMARY KEY,
          player_id BIGINT REFERENCES players(player_id) ON DELETE CASCADE,
          adp_rank INTEGER NOT NULL,
          adp_position INTEGER,
          draft_round INTEGER,
          draft_pick INTEGER,
          source TEXT DEFAULT 'sleeper',
          format TEXT DEFAULT 'standard',
          snapshot_date DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
    } catch (error) {
      console.error('❌ Error in alternative method:', error);
    }
  }

  /**
   * Populate with sample ADP data
   */
  async populateSampleADPData() {
    try {
      console.log('📊 Populating sample ADP data...');
      
      // Check if we have any existing ADP data
      const { data: existingADP, error: checkError } = await this.supabase
        .from('adp_data')
        .select('*')
        .limit(1);
      
      if (checkError) {
        console.log('⚠️  Cannot access adp_data table yet:', checkError.message);
        return;
      }
      
      if (existingADP && existingADP.length > 0) {
        console.log('✅ ADP data already exists, skipping population');
        return;
      }
      
      // Get some sample players
      const { data: players, error: playersError } = await this.supabase
        .from('players')
        .select('player_id, full_name, position')
        .limit(10);
      
      if (playersError || !players) {
        console.log('❌ Could not fetch players:', playersError);
        return;
      }
      
      console.log(`📝 Found ${players.length} players to use as sample ADP data`);
      
      // Create sample ADP entries
      const sampleADPData = players.map((player, index) => ({
        player_id: player.player_id,
        adp_rank: index + 1,
        adp_position: index + 1,
        draft_round: Math.floor(index / 12) + 1,
        draft_pick: (index % 12) + 1,
        source: 'sleeper',
        format: 'standard',
        snapshot_date: new Date().toISOString().split('T')[0]
      }));
      
      console.log('📊 Sample ADP data created, ready for insertion');
      console.log('📝 First few entries:', sampleADPData.slice(0, 3));
      
    } catch (error) {
      console.error('❌ Error populating sample data:', error);
    }
  }
}

// Run the script
const creator = new ADPTableCreator();
creator.createADPTable().then(() => {
  console.log('🎉 ADP table setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}); 