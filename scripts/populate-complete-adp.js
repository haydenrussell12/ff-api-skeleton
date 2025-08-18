import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

class CompleteADPPopulator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.csvPath = 'data/fantasypros-sample.csv';
  }

  /**
   * Main method to populate complete ADP data
   */
  async populateADPData() {
    try {
      console.log('🚀 Starting complete ADP data population...');
      
      // Step 1: Read the complete FantasyPros CSV file
      const players = await this.readFantasyProsCSV();
      if (!players || players.length === 0) {
        console.log('❌ No FantasyPros ADP data found');
        return;
      }

      console.log(`📊 Found ${players.length} players with ADP data`);

      // Step 2: Sort by ADP rank
      const sortedADPData = players
        .filter(player => player.ADP && player.ADP > 0)
        .sort((a, b) => a.ADP - b.ADP);

      console.log(`✅ Processed ${sortedADPData.length} players with valid ADP`);

      // Step 3: Store ADP data
      await this.storeADPData(sortedADPData);

      // Step 4: Display sample data
      await this.displaySampleADPData();

    } catch (error) {
      console.error('❌ Error in ADP population:', error);
    }
  }

  /**
   * Read FantasyPros CSV file with complete data
   */
  async readFantasyProsCSV() {
    try {
      console.log(`📖 Reading ${this.csvPath}...`);
      const csvContent = await fs.readFile(this.csvPath, 'utf8');
      return this.parseCSV(csvContent);
    } catch (error) {
      console.error('❌ Error reading CSV file:', error);
      return [];
    }
  }

  /**
   * Parse CSV content and extract ADP data
   */
  parseCSV(csvContent) {
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
        
        // Clean up data
        player.ADP = parseFloat(player.ADP) || null;
        player.Rank = parseInt(player.Rank) || null;
        player.FPTS = parseFloat(player.FPTS) || null;
        player.ECR = parseFloat(player.ECR) || null;
        player.Best = parseInt(player.Best) || null;
        player.Worst = parseInt(player.Worst) || null;
        player['Std Dev'] = parseFloat(player['Std Dev']) || null;
        
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
      console.log('💾 Storing complete ADP data...');
      
      const adpData = {
        timestamp: new Date().toISOString(),
        total_players: players.length,
        source: 'FantasyPros Complete Dataset',
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
      console.log('✅ Complete ADP data saved to adp_data.json');
      
    } catch (error) {
      console.error('❌ Error storing ADP data:', error);
    }
  }

  /**
   * Display sample ADP data
   */
  async displaySampleADPData() {
    try {
      console.log('\n📊 Sample Complete ADP Data:');
      console.log('=============================');
      
      const adpData = JSON.parse(await fs.readFile('adp_data.json', 'utf8'));
      const top20 = adpData.players.slice(0, 20);
      
      top20.forEach((player, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${player.full_name.padEnd(20)} ${player.position} ${player.team_code || 'N/A'} - ADP: ${player.adp_rank} (${player.adp_decimal})`);
      });
      
      console.log(`\n📈 Total players with ADP data: ${adpData.total_players}`);
      console.log(`🕐 Data timestamp: ${adpData.timestamp}`);
      console.log(`📊 Data source: ${adpData.source}`);
      
      // Show position breakdown
      const positionCounts = {};
      adpData.players.forEach(player => {
        positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
      });
      
      console.log('\n📊 Position Breakdown:');
      Object.entries(positionCounts).forEach(([pos, count]) => {
        console.log(`   ${pos}: ${count} players`);
      });
      
    } catch (error) {
      console.error('❌ Error displaying sample ADP data:', error);
    }
  }
}

// Run the script
const populator = new CompleteADPPopulator();
populator.populateADPData().then(() => {
  console.log('🎉 Complete ADP population completed!');
}).catch((error) => {
  console.error('❌ Complete ADP population failed:', error);
}); 