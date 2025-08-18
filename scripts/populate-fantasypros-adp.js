import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

class FantasyProsADPPopulator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.projectionsDir = 'data/projections';
  }

  /**
   * Main method to populate ADP data from FantasyPros
   */
  async populateADPData() {
    try {
      console.log('🚀 Starting FantasyPros ADP data population...');
      
      // Step 1: Read all FantasyPros CSV files
      const allADPData = await this.readAllFantasyProsADP();
      if (!allADPData || allADPData.length === 0) {
        console.log('❌ No FantasyPros ADP data found');
        return;
      }
      
      console.log(`📊 Found ${allADPData.length} players with ADP data`);
      
      // Step 2: Sort by ADP rank
      const sortedADPData = allADPData
        .filter(player => player.ADP && player.ADP > 0)
        .sort((a, b) => a.ADP - b.ADP);
      
      console.log(`✅ Successfully sorted ${sortedADPData.length} players by ADP`);
      
      // Step 3: Store ADP data
      await this.storeADPData(sortedADPData);
      
      // Step 4: Display sample data
      await this.displaySampleADPData();
      
      console.log('🎉 FantasyPros ADP data population completed successfully!');
      
    } catch (error) {
      console.error('❌ Error populating ADP data:', error);
    }
  }

  /**
   * Read ADP data from all FantasyPros CSV files
   */
  async readAllFantasyProsADP() {
    try {
      console.log('📖 Reading FantasyPros ADP data from CSV files...');
      
      const positions = ['qb', 'rb', 'wr', 'te'];
      const allPlayers = [];
      
      for (const position of positions) {
        const csvPath = path.join(this.projectionsDir, position, `fantasypros-${position}-2025-08-11.csv`);
        
        try {
          const csvContent = await fs.readFile(csvPath, 'utf8');
          const players = this.parseCSV(csvContent, position.toUpperCase());
          allPlayers.push(...players);
          console.log(`📊 Read ${players.length} ${position.toUpperCase()} players`);
        } catch (error) {
          console.log(`⚠️  Could not read ${position} CSV: ${error.message}`);
        }
      }
      
      return allPlayers;
      
    } catch (error) {
      console.error('❌ Error reading FantasyPros data:', error);
      return [];
    }
  }

  /**
   * Parse CSV content and extract ADP data
   */
  parseCSV(csvContent, position) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const players = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = this.parseCSVLine(line);
      
      if (values.length >= headers.length) {
        const player = {};
        headers.forEach((header, index) => {
          player[header] = values[index];
        });
        
        // Add position and clean up data
        player.Pos = position;
        player.ADP = parseFloat(player.ADP) || null;
        player.Rank = parseInt(player.Rank) || null;
        player.FPTS = parseFloat(player.FPTS) || null;
        
        // Only include players with valid ADP
        if (player.ADP && player.ADP > 0) {
          players.push(player);
        }
      }
    }
    
    return players;
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  /**
   * Store ADP data in JSON format
   */
  async storeADPData(players) {
    try {
      console.log('💾 Storing ADP data...');
      
      const adpData = {
        timestamp: new Date().toISOString(),
        total_players: players.length,
        source: 'FantasyPros',
        players: players.map((player, index) => ({
          player_id: `fp_${index + 1}`,
          full_name: player.Player,
          position: player.Pos,
          team_code: player.Team,
          adp_rank: Math.round(player.ADP),
          adp_decimal: player.ADP,
          rank: player.Rank,
          tier: player.Tier,
          projected_points: player.FPTS,
          ecr: player.ECR,
          best_rank: player.Best,
          worst_rank: player.Worst,
          std_dev: player['Std Dev'],
          draft_round: Math.ceil(player.ADP / 12),
          draft_pick: ((Math.ceil(player.ADP) - 1) % 12) + 1
        }))
      };
      
      // Save to JSON file
      await fs.writeFile('adp_data.json', JSON.stringify(adpData, null, 2));
      console.log('✅ ADP data saved to adp_data.json');
      
      // Try to update database if possible
      await this.updateDatabaseWithADP(adpData.players);
      
    } catch (error) {
      console.error('❌ Error storing ADP data:', error);
    }
  }

  /**
   * Update database with ADP information
   */
  async updateDatabaseWithADP(players) {
    try {
      console.log('🔄 Updating database with ADP info...');
      
      // Try to update existing players table
      for (const player of players.slice(0, 10)) { // Limit to first 10 for testing
        try {
          const { error } = await this.supabase
            .from('players')
            .update({ 
              adp_rank: player.adp_rank,
              adp_decimal: player.adp_decimal,
              projected_points: player.projected_points
            })
            .eq('full_name', player.full_name)
            .eq('position', player.position);
          
          if (error) {
            console.log(`⚠️  Could not update ${player.full_name}: ${error.message}`);
          }
        } catch (error) {
          console.log(`⚠️  Error updating ${player.full_name}: ${error.message}`);
        }
      }
      
      console.log('✅ Database update completed');
      
    } catch (error) {
      console.log('⚠️  Database update failed:', error.message);
    }
  }

  /**
   * Display sample ADP data
   */
  async displaySampleADPData() {
    try {
      console.log('\n📊 Sample ADP Data:');
      console.log('===================');
      
      const adpData = JSON.parse(await fs.readFile('adp_data.json', 'utf8'));
      const top20 = adpData.players.slice(0, 20);
      
      top20.forEach((player, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${player.full_name.padEnd(20)} ${player.position} ${player.team_code || 'N/A'} - ADP: ${player.adp_rank}`);
      });
      
      console.log(`\n📈 Total players with ADP data: ${adpData.total_players}`);
      console.log(`🕐 Data timestamp: ${adpData.timestamp}`);
      console.log(`📊 Data source: ${adpData.source}`);
      
    } catch (error) {
      console.error('❌ Error displaying sample ADP data:', error);
    }
  }
}

// Run the script
const populator = new FantasyProsADPPopulator();
populator.populateADPData().then(() => {
  console.log('🎉 FantasyPros ADP population completed!');
}).catch((error) => {
  console.error('❌ FantasyPros ADP population failed:', error);
}); 