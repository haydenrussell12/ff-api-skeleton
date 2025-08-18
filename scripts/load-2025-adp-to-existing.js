import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

class ADP2025Loader {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.currentDir = 'data/2025';
  }

  /**
   * Load 2025 ADP data into existing adp_data table
   */
  async load2025ADPData() {
    try {
      console.log('🚀 Loading 2025 ADP data into existing adp_data table...');
      
      // Load PPR ADP data
      const pprFile = path.join(this.currentDir, 'FantasyPros_2025_Overall_ADP_Rankings_PPR.csv');
      if (await this.fileExists(pprFile)) {
        console.log('  📈 Loading 2025 PPR ADP data...');
        const pprData = await this.parseADPCSV(pprFile, 'ppr');
        await this.insertADPData(pprData, 'ppr');
      }
      
      // Load Standard ADP data
      const standardFile = path.join(this.currentDir, 'FantasyPros_2025_Overall_ADP_Rankings_Standard.csv');
      if (await this.fileExists(standardFile)) {
        console.log('  📈 Loading 2025 Standard ADP data...');
        const standardData = await this.parseADPCSV(standardFile, 'standard');
        await this.insertADPData(standardData, 'standard');
      }
      
      console.log('✅ 2025 ADP data loading complete!');
      
    } catch (error) {
      console.error('❌ Error loading 2025 ADP data:', error);
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
   * Insert ADP data into adp_data table
   */
  async insertADPData(adpData, format) {
    if (adpData.length === 0) return;
    
    console.log(`  📊 Inserting ${adpData.length} ${format.toUpperCase()} ADP records...`);
    
    // Transform data to match existing adp_data table structure
    const transformedData = adpData.map(player => ({
      full_name: player.player_name,
      position: player.position,
      team_code: player.team,
      adp_rank: player.rank,
      adp_value: player.average_adp,
      draft_year: 2025,
      snapshot_date: new Date().toISOString().split('T')[0],
      format: player.format,
      // Add additional fields if they exist in the table
      espn_adp: player.espn_adp,
      sleeper_adp: player.sleeper_adp,
      nfl_adp: player.nfl_adp,
      rtsports_adp: player.rtsports_adp,
      ffc_adp: player.ffc_adp,
      fantrax_adp: player.fantrax_adp,
      cbs_adp: player.cbs_adp
    }));
    
    const batchSize = 100;
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      const { error } = await this.supabase
        .from('adp_data')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting ${format} batch ${i/batchSize + 1}:`, error);
      }
    }
    
    console.log(`  ✅ Successfully inserted ${adpData.length} ${format.toUpperCase()} ADP records`);
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

// Run the loader
const loader = new ADP2025Loader();
loader.load2025ADPData(); 