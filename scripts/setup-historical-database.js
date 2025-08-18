import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

class HistoricalDataLoader {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.historicalDir = 'data/Historical';
    this.currentDir = 'data/2025';
  }

  /**
   * Main method to set up and load all historical data
   */
  async setupAndLoadAllData() {
    try {
      console.log('🚀 Starting comprehensive historical data setup...');
      
      // Step 1: Create database tables
      await this.createDatabaseTables();
      
      // Step 2: Load historical player stats (2020-2024)
      await this.loadHistoricalPlayerStats();
      
      // Step 3: Load historical ADP data (2020-2024)
      await this.loadHistoricalADPData();
      
      // Step 4: Load 2025 current season ADP data
      await this.loadCurrentSeasonADPData();
      
      // Step 5: Create indexes for performance
      await this.createDatabaseIndexes();
      
      console.log('✅ All historical data loaded successfully!');
      
    } catch (error) {
      console.error('❌ Error setting up historical data:', error);
    }
  }

  /**
   * Create all necessary database tables
   */
  async createDatabaseTables() {
    console.log('📊 Creating database tables...');
    
    // Historical Player Stats table
    const createStatsTable = `
      CREATE TABLE IF NOT EXISTS historical_player_stats (
        id SERIAL PRIMARY KEY,
        season INTEGER NOT NULL,
        player_id VARCHAR(20),
        player_name VARCHAR(100) NOT NULL,
        team VARCHAR(10),
        position VARCHAR(10),
        age INTEGER,
        games_played INTEGER,
        games_started INTEGER,
        passing_attempts INTEGER,
        passing_yards INTEGER,
        passing_tds INTEGER,
        passing_ints INTEGER,
        rushing_attempts INTEGER,
        rushing_yards INTEGER,
        rushing_yards_per_attempt DECIMAL(4,2),
        rushing_tds INTEGER,
        receiving_targets INTEGER,
        receptions INTEGER,
        receiving_yards INTEGER,
        receiving_yards_per_reception DECIMAL(4,2),
        receiving_tds INTEGER,
        fumbles INTEGER,
        fumbles_lost INTEGER,
        total_tds INTEGER,
        two_point_conversions INTEGER,
        fantasy_points_standard DECIMAL(6,2),
        fantasy_points_ppr DECIMAL(6,2),
        fantasy_points_draftkings DECIMAL(6,2),
        fantasy_points_fanduel DECIMAL(6,2),
        vbd DECIMAL(6,2),
        position_rank INTEGER,
        overall_rank INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Historical ADP table
    const createADPTable = `
      CREATE TABLE IF NOT EXISTS historical_adp_data (
        id SERIAL PRIMARY KEY,
        season INTEGER NOT NULL,
        format VARCHAR(20) NOT NULL, -- 'ppr' or 'standard'
        rank INTEGER NOT NULL,
        player_name VARCHAR(100) NOT NULL,
        team VARCHAR(10),
        bye_week INTEGER,
        position VARCHAR(10),
        espn_adp DECIMAL(4,1),
        sleeper_adp DECIMAL(4,1),
        nfl_adp DECIMAL(4,1),
        rtsports_adp DECIMAL(4,1),
        ffc_adp DECIMAL(4,1),
        fantrax_adp DECIMAL(4,1),
        cbs_adp DECIMAL(4,1),
        average_adp DECIMAL(4,1),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 2025 Current Season ADP table
    const createCurrentADPTable = `
      CREATE TABLE IF NOT EXISTS current_season_adp (
        id SERIAL PRIMARY KEY,
        format VARCHAR(20) NOT NULL, -- 'ppr' or 'standard'
        rank INTEGER NOT NULL,
        player_name VARCHAR(100) NOT NULL,
        team VARCHAR(10),
        bye_week INTEGER,
        position VARCHAR(10),
        espn_adp DECIMAL(4,1),
        sleeper_adp DECIMAL(4,1),
        nfl_adp DECIMAL(4,1),
        rtsports_adp DECIMAL(4,1),
        ffc_adp DECIMAL(4,1),
        fantrax_adp DECIMAL(4,1),
        cbs_adp DECIMAL(4,1),
        average_adp DECIMAL(4,1),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    try {
      await this.supabase.rpc('exec_sql', { sql: createStatsTable });
      await this.supabase.rpc('exec_sql', { sql: createADPTable });
      await this.supabase.rpc('exec_sql', { sql: createCurrentADPTable });
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.log('⚠️  Using direct SQL execution...');
      // Fallback: try direct SQL execution
      try {
        await this.supabase.from('historical_player_stats').select('id').limit(1);
        console.log('✅ Tables already exist');
      } catch (tableError) {
        console.log('❌ Cannot create tables via RPC, tables may need manual creation');
      }
    }
  }

  /**
   * Load all historical player stats (2020-2024)
   */
  async loadHistoricalPlayerStats() {
    console.log('📊 Loading historical player stats...');
    
    const years = ['2020', '2021', '2022', '2023', '2024'];
    
    for (const year of years) {
      const statsFile = path.join(this.historicalDir, year, `${year}_Player_Stats.csv`);
      
      try {
        if (await this.fileExists(statsFile)) {
          console.log(`  📈 Loading ${year} player stats...`);
          const stats = await this.parsePlayerStatsCSV(statsFile, parseInt(year));
          
          // Insert data in batches
          const batchSize = 100;
          for (let i = 0; i < stats.length; i += batchSize) {
            const batch = stats.slice(i, i + batchSize);
            const { error } = await this.supabase
              .from('historical_player_stats')
              .insert(batch);
            
            if (error) {
              console.error(`❌ Error inserting ${year} stats batch ${i/batchSize + 1}:`, error);
            }
          }
          
          console.log(`  ✅ Loaded ${stats.length} ${year} player stats`);
        }
      } catch (error) {
        console.error(`❌ Error loading ${year} stats:`, error);
      }
    }
  }

  /**
   * Load all historical ADP data (2020-2024)
   */
  async loadHistoricalADPData() {
    console.log('📊 Loading historical ADP data...');
    
    const years = ['2020', '2021', '2022', '2023', '2024'];
    
    for (const year of years) {
      const pprFile = path.join(this.historicalDir, year, `FantasyPros_${year}_Overall_ADP_Rankings_PPR.csv`);
      const standardFile = path.join(this.historicalDir, year, `FantasyPros_${year}_Overall_ADP_Rankings_Standard.csv`);
      
      try {
        // Load PPR ADP data
        if (await this.fileExists(pprFile)) {
          console.log(`  📈 Loading ${year} PPR ADP data...`);
          const pprData = await this.parseADPCSV(pprFile, parseInt(year), 'ppr');
          await this.insertADPData(pprData, 'historical_adp_data');
        }
        
        // Load Standard ADP data
        if (await this.fileExists(standardFile)) {
          console.log(`  📈 Loading ${year} Standard ADP data...`);
          const standardData = await this.parseADPCSV(standardFile, parseInt(year), 'standard');
          await this.insertADPData(standardData, 'historical_adp_data');
        }
        
      } catch (error) {
        console.error(`❌ Error loading ${year} ADP data:`, error);
      }
    }
  }

  /**
   * Load 2025 current season ADP data
   */
  async loadCurrentSeasonADPData() {
    console.log('📊 Loading 2025 current season ADP data...');
    
    try {
      // Load PPR ADP data
      const pprFile = path.join(this.currentDir, 'FantasyPros_2025_Overall_ADP_Rankings_PPR.csv');
      if (await this.fileExists(pprFile)) {
        console.log('  📈 Loading 2025 PPR ADP data...');
        const pprData = await this.parseADPCSV(pprFile, 2025, 'ppr');
        await this.insertADPData(pprData, 'current_season_adp');
      }
      
      // Load Standard ADP data
      const standardFile = path.join(this.currentDir, 'FantasyPros_2025_Overall_ADP_Rankings_Standard.csv');
      if (await this.fileExists(standardFile)) {
        console.log('  📈 Loading 2025 Standard ADP data...');
        const standardData = await this.parseADPCSV(standardFile, 2025, 'standard');
        await this.insertADPData(standardData, 'current_season_adp');
      }
      
    } catch (error) {
      console.error('❌ Error loading 2025 ADP data:', error);
    }
  }

  /**
   * Parse player stats CSV file
   */
  async parsePlayerStatsCSV(filePath, season) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    const stats = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        
        if (values.length >= headers.length) {
          const stat = {
            season,
            player_id: values[values.length - 1] || null, // Last column is player ID
            player_name: values[1] || '',
            team: values[2] || '',
            position: values[3] || '',
            age: parseInt(values[4]) || null,
            games_played: parseInt(values[5]) || null,
            games_started: parseInt(values[6]) || null,
            passing_attempts: parseInt(values[8]) || null,
            passing_yards: parseInt(values[9]) || null,
            passing_tds: parseInt(values[10]) || null,
            passing_ints: parseInt(values[11]) || null,
            rushing_attempts: parseInt(values[12]) || null,
            rushing_yards: parseInt(values[13]) || null,
            rushing_yards_per_attempt: parseFloat(values[14]) || null,
            rushing_tds: parseInt(values[15]) || null,
            receiving_targets: parseInt(values[16]) || null,
            receptions: parseInt(values[17]) || null,
            receiving_yards: parseInt(values[18]) || null,
            receiving_yards_per_reception: parseFloat(values[19]) || null,
            receiving_tds: parseInt(values[20]) || null,
            fumbles: parseInt(values[21]) || null,
            fumbles_lost: parseInt(values[22]) || null,
            total_tds: parseInt(values[23]) || null,
            two_point_conversions: parseInt(values[24]) || null,
            fantasy_points_standard: parseFloat(values[25]) || null,
            fantasy_points_ppr: parseFloat(values[26]) || null,
            fantasy_points_draftkings: parseFloat(values[27]) || null,
            fantasy_points_fanduel: parseFloat(values[28]) || null,
            vbd: parseFloat(values[29]) || null,
            position_rank: parseInt(values[30]) || null,
            overall_rank: parseInt(values[31]) || null
          };
          
          stats.push(stat);
        }
      }
    }
    
    return stats;
  }

  /**
   * Parse ADP CSV file
   */
  async parseADPCSV(filePath, season, format) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    const adpData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        
        if (values.length >= headers.length) {
          const adp = {
            season: format === 'historical' ? season : null,
            format,
            rank: parseInt(values[0]) || null,
            player_name: values[1] || '',
            team: values[2] || '',
            bye_week: parseInt(values[3]) || null,
            position: values[4] || '',
            espn_adp: this.parseADPValue(values[5]),
            sleeper_adp: this.parseADPValue(values[6]),
            nfl_adp: this.parseADPValue(values[7]),
            rtsports_adp: this.parseADPValue(values[8]),
            ffc_adp: this.parseADPValue(values[9]),
            fantrax_adp: this.parseADPValue(values[10]),
            cbs_adp: this.parseADPValue(values[11]),
            average_adp: this.parseADPValue(values[values.length - 1]) // Last column is usually average
          };
          
          adpData.push(adp);
        }
      }
    }
    
    return adpData;
  }

  /**
   * Parse ADP value, handling empty strings and converting to decimal
   */
  parseADPValue(value) {
    if (!value || value === '' || value === '""') return null;
    const cleanValue = value.replace(/"/g, '');
    return parseFloat(cleanValue) || null;
  }

  /**
   * Parse CSV line, handling quoted fields with commas
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Insert ADP data into specified table
   */
  async insertADPData(adpData, tableName) {
    if (adpData.length === 0) return;
    
    const batchSize = 100;
    for (let i = 0; i < adpData.length; i += batchSize) {
      const batch = adpData.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting ADP batch ${i/batchSize + 1}:`, error);
      }
    }
    
    console.log(`  ✅ Inserted ${adpData.length} ADP records into ${tableName}`);
  }

  /**
   * Create database indexes for performance
   */
  async createDatabaseIndexes() {
    console.log('📊 Creating database indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_historical_stats_season ON historical_player_stats(season);',
      'CREATE INDEX IF NOT EXISTS idx_historical_stats_player ON historical_player_stats(player_name);',
      'CREATE INDEX IF NOT EXISTS idx_historical_stats_position ON historical_player_stats(position);',
      'CREATE INDEX IF NOT EXISTS idx_historical_adp_season ON historical_adp_data(season);',
      'CREATE INDEX IF NOT EXISTS idx_historical_adp_format ON historical_adp_data(format);',
      'CREATE INDEX IF NOT EXISTS idx_historical_adp_player ON historical_adp_data(player_name);',
      'CREATE INDEX IF NOT EXISTS idx_current_adp_format ON current_season_adp(format);',
      'CREATE INDEX IF NOT EXISTS idx_current_adp_player ON current_season_adp(player_name);'
    ];
    
    for (const index of indexes) {
      try {
        await this.supabase.rpc('exec_sql', { sql: index });
      } catch (error) {
        console.log('⚠️  Index creation may need manual execution');
      }
    }
    
    console.log('✅ Database indexes created');
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Run the data loader
const loader = new HistoricalDataLoader();
loader.setupAndLoadAllData(); 