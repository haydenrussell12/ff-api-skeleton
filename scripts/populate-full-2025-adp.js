import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';

class Full2025ADPPopulator {
  constructor() {
    this.currentDir = 'data/2025';
    this.outputFile = 'adp_data.json';
  }

  /**
   * Populate full 2025 ADP data into local JSON file
   */
  async populateFull2025ADP() {
    try {
      console.log('🚀 Populating full 2025 ADP data into local JSON...');
      
      // Load PPR ADP data
      const pprFile = path.join(this.currentDir, 'FantasyPros_2025_Overall_ADP_Rankings_PPR.csv');
      const pprData = await this.parseADPCSV(pprFile, 'ppr');
      console.log(`  📈 Loaded ${pprData.length} PPR ADP records`);
      
      // Load Standard ADP data
      const standardFile = path.join(this.currentDir, 'FantasyPros_2025_Overall_ADP_Rankings_Standard.csv');
      const standardData = await this.parseADPCSV(standardFile, 'standard');
      console.log(`  📈 Loaded ${standardData.length} Standard ADP records`);
      
      // Combine and deduplicate data (prioritize PPR for players in both)
      const combinedData = this.combineAndDeduplicate(pprData, standardData);
      console.log(`  🔗 Combined into ${combinedData.length} unique players`);
      
      // Sort by ADP rank
      const sortedData = combinedData.sort((a, b) => a.adp_rank - b.adp_rank);
      
      // Create the final structure
      const finalData = {
        total_players: sortedData.length,
        last_updated: new Date().toISOString(),
        data_source: 'FantasyPros 2025 Overall Rankings',
        format: 'combined_ppr_standard',
        players: sortedData
      };
      
      // Write to file
      await fs.writeFile(this.outputFile, JSON.stringify(finalData, null, 2), 'utf8');
      console.log(`✅ Successfully populated ${this.outputFile} with ${finalData.total_players} players`);
      
      // Show sample data
      console.log('\n📊 Sample of top 20 players:');
      sortedData.slice(0, 20).forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.full_name} (${player.position}, ${player.team_code}) - ADP: ${player.adp_value}`);
      });
      
    } catch (error) {
      console.error('❌ Error populating 2025 ADP data:', error);
    }
  }

  /**
   * Parse ADP CSV file
   */
  async parseADPCSV(filePath, format) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    const adpData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        
        if (values.length >= headers.length) {
          const adp = {
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
   * Combine PPR and Standard data, deduplicating by player name
   */
  combineAndDeduplicate(pprData, standardData) {
    const playerMap = new Map();
    
    // Process PPR data first (higher priority)
    pprData.forEach(player => {
      const key = player.player_name.toLowerCase().trim();
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          player_id: player.player_name, // Use name as ID for now
          full_name: player.player_name,
          position: player.position,
          team_code: player.team,
          adp_rank: player.rank,
          adp_value: player.average_adp,
          draft_year: 2025,
          snapshot_date: new Date().toISOString().split('T')[0],
          format: 'ppr',
          bye_week: player.bye_week,
          espn_adp: player.espn_adp,
          sleeper_adp: player.sleeper_adp,
          nfl_adp: player.nfl_adp,
          rtsports_adp: player.rtsports_adp,
          ffc_adp: player.ffc_adp,
          fantrax_adp: player.fantrax_adp,
          cbs_adp: player.cbs_adp
        });
      }
    });
    
    // Process Standard data, only add if not already present
    standardData.forEach(player => {
      const key = player.player_name.toLowerCase().trim();
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          player_id: player.player_name,
          full_name: player.player_name,
          position: player.position,
          team_code: player.team,
          adp_rank: player.rank,
          adp_value: player.average_adp,
          draft_year: 2025,
          snapshot_date: new Date().toISOString().split('T')[0],
          format: 'standard',
          bye_week: player.bye_week,
          espn_adp: player.espn_adp,
          sleeper_adp: player.sleeper_adp,
          nfl_adp: player.nfl_adp,
          rtsports_adp: player.rtsports_adp,
          ffc_adp: player.ffc_adp,
          fantrax_adp: player.fantrax_adp,
          cbs_adp: player.cbs_adp
        });
      }
    });
    
    return Array.from(playerMap.values());
  }
}

// Run the populator
const populator = new Full2025ADPPopulator();
populator.populateFull2025ADP(); 