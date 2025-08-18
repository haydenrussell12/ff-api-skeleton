import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';

class DataConsolidator {
  constructor() {
    this.dataDir = 'data';
    this.outputDir = 'data/consolidated';
    this.masterData = new Map(); // player_id -> player data
    this.nameVariations = new Map(); // normalized_name -> player_id
  }

  async consolidateAllData() {
    console.log('🚀 Starting comprehensive data consolidation...\n');
    
    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();
      
      // Step 1: Load and consolidate 2025 ADP data
      console.log('📊 Step 1: Consolidating 2025 ADP data...');
      await this.consolidate2025ADP();
      
      // Step 2: Load and consolidate historical ADP data
      console.log('📊 Step 2: Consolidating historical ADP data...');
      await this.consolidateHistoricalADP();
      
      // Step 3: Load and consolidate historical player stats
      console.log('📊 Step 3: Consolidating historical player stats...');
      await this.consolidateHistoricalStats();
      
      // Step 4: Load and consolidate projections data
      console.log('📊 Step 4: Consolidating projections data...');
      await this.consolidateProjections();
      
      // Step 5: Create master player lookup system
      console.log('📊 Step 5: Creating master player lookup system...');
      await this.createMasterLookup();
      
      // Step 6: Generate unified data files
      console.log('📊 Step 6: Generating unified data files...');
      await this.generateUnifiedFiles();
      
      console.log('✅ Data consolidation completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during data consolidation:', error);
      throw error;
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async consolidate2025ADP() {
    const pprFile = path.join(this.dataDir, '2025', 'FantasyPros_2025_Overall_ADP_Rankings_PPR.csv');
    const standardFile = path.join(this.dataDir, '2025', 'FantasyPros_2025_Overall_ADP_Rankings_Standard.csv');
    
    const pprData = await this.parseADPCSV(pprFile, 'ppr');
    const standardData = await this.parseADPCSV(standardFile, 'standard');
    
    console.log(`  📈 Loaded ${pprData.length} PPR ADP records`);
    console.log(`  📈 Loaded ${standardData.length} Standard ADP records`);
    
    // Merge PPR and Standard data
    for (const player of pprData) {
      const playerId = this.normalizePlayerName(player.player);
      
      if (!this.masterData.has(playerId)) {
        this.masterData.set(playerId, {
          player_id: playerId,
          full_name: player.player,
          team: player.team,
          position: player.pos,
          bye_week: player.bye,
          adp_data: {},
          historical_stats: {},
          projections: {},
          name_variations: [player.player],
          last_updated: new Date().toISOString()
        });
      }
      
      const masterPlayer = this.masterData.get(playerId);
      masterPlayer.adp_data[player.format] = {
        rank: player.rank,
        avg_adp: player.avg_adp,
        espn_adp: player.espn_adp,
        sleeper_adp: player.sleeper_adp,
        nfl_adp: player.nfl_adp,
        rtsports_adp: player.rtsports_adp,
        ffc_adp: player.ffc_adp,
        fantrax_adp: player.fantrax_adp,
        season: 2025
      };
      
      // Store name variations for fuzzy matching
      this.storeNameVariation(player.player, playerId);
    }
    
    // Add Standard ADP data
    for (const player of standardData) {
      const playerId = this.normalizePlayerName(player.player);
      
      if (this.masterData.has(playerId)) {
        const masterPlayer = this.masterData.get(playerId);
        masterPlayer.adp_data.standard = {
          rank: player.rank,
          avg_adp: player.avg_adp,
          espn_adp: player.espn_adp,
          sleeper_adp: player.sleeper_adp,
          nfl_adp: player.nfl_adp,
          rtsports_adp: player.rtsports_adp,
          ffc_adp: player.ffc_adp,
          fantrax_adp: player.fantrax_adp,
          season: 2025
        };
      }
    }
    
    console.log(`  ✅ Consolidated ${this.masterData.size} unique players for 2025`);
  }

  async consolidateHistoricalADP() {
    const years = [2020, 2021, 2022, 2023, 2024];
    
    for (const year of years) {
      const yearDir = path.join(this.dataDir, 'Historical', year.toString());
      
      try {
        const pprFile = path.join(yearDir, `FantasyPros_${year}_Overall_ADP_Rankings_PPR.csv`);
        const standardFile = path.join(yearDir, `FantasyPros_${year}_Overall_ADP_Rankings_Standard.csv`);
        
        if (await this.fileExists(pprFile)) {
          const pprData = await this.parseADPCSV(pprFile, 'ppr');
          await this.mergeHistoricalADP(pprData, year, 'ppr');
        }
        
        if (await this.fileExists(standardFile)) {
          const standardData = await this.parseADPCSV(standardFile, 'standard');
          await this.mergeHistoricalADP(standardData, year, 'standard');
        }
        
        console.log(`  📅 Processed ${year} ADP data`);
      } catch (error) {
        console.log(`  ⚠️  Skipping ${year} (${error.message})`);
      }
    }
  }

  async consolidateHistoricalStats() {
    const years = [2020, 2021, 2022, 2023, 2024];
    
    for (const year of years) {
      const yearDir = path.join(this.dataDir, 'Historical', year.toString());
      const statsFile = path.join(yearDir, `${year}_Player_Stats.csv`);
      
      try {
        if (await this.fileExists(statsFile)) {
          const statsData = await this.parseStatsCSV(statsFile);
          await this.mergeHistoricalStats(statsData, year);
          console.log(`  📊 Processed ${year} player stats (${statsData.length} players)`);
        }
      } catch (error) {
        console.log(`  ⚠️  Skipping ${year} stats (${error.message})`);
      }
    }
  }

  async consolidateProjections() {
    const positions = ['qb', 'rb', 'wr', 'te', 'k', 'dst'];
    
    for (const position of positions) {
      const posDir = path.join(this.dataDir, 'projections', position);
      
      try {
        const files = await fs.readdir(posDir);
        const csvFiles = files.filter(file => file.endsWith('.csv'));
        
        for (const file of csvFiles) {
          const filePath = path.join(posDir, file);
          const projectionsData = await this.parseProjectionsCSV(filePath, position);
          await this.mergeProjections(projectionsData, position);
        }
        
        console.log(`  🔮 Processed ${position.toUpperCase()} projections`);
      } catch (error) {
        console.log(`  ⚠️  Skipping ${position} projections (${error.message})`);
      }
    }
  }

  async createMasterLookup() {
    console.log('  🔍 Building fuzzy matching index...');
    
    // Create comprehensive name variations index
    for (const [playerId, playerData] of this.masterData) {
      if (playerData.full_name && typeof playerData.full_name === 'string') {
        const variations = this.generateNameVariations(playerData.full_name);
        
        for (const variation of variations) {
          if (!this.nameVariations.has(variation)) {
            this.nameVariations.set(variation, []);
          }
          this.nameVariations.get(variation).push(playerId);
        }
      }
    }
    
    console.log(`  ✅ Created ${this.nameVariations.size} name variation mappings`);
  }

  async generateUnifiedFiles() {
    // Generate master player database
    const masterPlayers = Array.from(this.masterData.values());
    const masterData = {
      metadata: {
        total_players: masterPlayers.length,
        last_updated: new Date().toISOString(),
        data_sources: ['FantasyPros ADP', 'Historical Stats', 'Projections'],
        seasons: [2020, 2021, 2022, 2023, 2024, 2025]
      },
      players: masterPlayers
    };
    
    await fs.writeFile(
      path.join(this.outputDir, 'master-players.json'),
      JSON.stringify(masterData, null, 2)
    );
    
    // Generate name lookup index
    const nameLookup = Object.fromEntries(this.nameVariations);
    await fs.writeFile(
      path.join(this.outputDir, 'name-lookup-index.json'),
      JSON.stringify(nameLookup, null, 2)
    );
    
    // Generate summary statistics
    const summary = this.generateSummaryStats(masterPlayers);
    await fs.writeFile(
      path.join(this.outputDir, 'data-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log(`  💾 Generated unified data files in ${this.outputDir}/`);
    console.log(`  📊 Master database: ${masterPlayers.length} players`);
    console.log(`  🔍 Name variations: ${this.nameVariations.size} mappings`);
  }

  // Helper methods
  async parseADPCSV(filePath, format) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    
    const players = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const player = {};
        headers.forEach((header, index) => {
          player[header.toLowerCase()] = values[index];
        });
        player.format = format;
        player.rank = parseInt(player.rank) || 0;
        player.avg_adp = parseFloat(player.avg) || 0;
        player.espn_adp = parseInt(player.espn) || null;
        player.sleeper_adp = parseInt(player.sleeper) || null;
        player.nfl_adp = parseInt(player.nfl) || null;
        player.rtsports_adp = parseInt(player.rtsports) || null;
        player.ffc_adp = parseInt(player.ffc) || null;
        player.fantrax_adp = parseInt(player.fantrax) || null;
        player.bye_week = parseInt(player.bye) || null;
        players.push(player);
      }
    }
    
    return players;
  }

  async parseStatsCSV(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    const players = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const player = {};
        headers.forEach((header, index) => {
          player[header.toLowerCase()] = values[index];
        });
        players.push(player);
      }
    }
    
    return players;
  }

  async parseProjectionsCSV(filePath, position) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    
    const players = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const player = {};
        headers.forEach((header, index) => {
          player[header.toLowerCase()] = values[index];
        });
        player.position = position.toUpperCase();
        players.push(player);
      }
    }
    
    return players;
  }

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

  normalizePlayerName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  generateNameVariations(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return [];
    }
    
    const variations = [fullName.toLowerCase()];
    const parts = fullName.split(' ');
    
    if (parts.length > 1) {
      // First + Last
      variations.push(`${parts[0]} ${parts[parts.length - 1]}`.toLowerCase());
      
      // First + Last (no suffix)
      const lastName = parts[parts.length - 1];
      if (['jr', 'sr', 'ii', 'iii', 'iv'].includes(lastName.toLowerCase())) {
        if (parts.length > 2) {
          variations.push(`${parts[0]} ${parts[parts.length - 2]}`.toLowerCase());
        }
      }
      
      // Last, First
      variations.push(`${parts[parts.length - 1]}, ${parts[0]}`.toLowerCase());
    }
    
    return variations;
  }

  storeNameVariation(name, playerId) {
    const normalized = this.normalizePlayerName(name);
    if (!this.nameVariations.has(normalized)) {
      this.nameVariations.set(normalized, []);
    }
    
    if (!this.nameVariations.get(normalized).includes(playerId)) {
      this.nameVariations.get(normalized).push(playerId);
    }
  }

  async mergeHistoricalADP(adpData, year, format) {
    for (const player of adpData) {
      const playerId = this.normalizePlayerName(player.player);
      
      if (this.masterData.has(playerId)) {
        const masterPlayer = this.masterData.get(playerId);
        
        if (!masterPlayer.adp_data[format]) {
          masterPlayer.adp_data[format] = {};
        }
        
        masterPlayer.adp_data[format][year] = {
          rank: player.rank,
          avg_adp: player.avg_adp,
          season: year
        };
      }
    }
  }

  async mergeHistoricalStats(statsData, year) {
    for (const player of statsData) {
      const playerId = this.normalizePlayerName(player.player);
      
      if (this.masterData.has(playerId)) {
        const masterPlayer = this.masterData.get(playerId);
        
        if (!masterPlayer.historical_stats[year]) {
          masterPlayer.historical_stats[year] = {};
        }
        
        masterPlayer.historical_stats[year] = {
          team: player.tm,
          position: player.fantpos,
          age: parseInt(player.age) || null,
          games: parseInt(player.g) || 0,
          games_started: parseInt(player.gs) || 0,
          passing: {
            completions: parseInt(player.cmp) || 0,
            attempts: parseInt(player['passing att']) || 0,
            yards: parseInt(player['passing yds']) || 0,
            touchdowns: parseInt(player['passing tds']) || 0,
            interceptions: parseInt(player['passing int']) || 0
          },
          rushing: {
            attempts: parseInt(player['rushing att']) || 0,
            yards: parseInt(player['rushing yds']) || 0,
            yards_per_attempt: parseFloat(player['rushing y/a']) || 0,
            touchdowns: parseInt(player['rushing td']) || 0
          },
          receiving: {
            targets: parseInt(player['receiving tgts']) || 0,
            receptions: parseInt(player.receptions) || 0,
            yards: parseInt(player['receiving yds']) || 0,
            yards_per_reception: parseFloat(player['receiving y/r']) || 0,
            touchdowns: parseInt(player['receiving td']) || 0
          },
          fantasy_points: {
            standard: parseFloat(player.fantpt) || 0,
            ppr: parseFloat(player.ppr) || 0,
            draftkings: parseFloat(player.dkpt) || 0,
            fanduel: parseFloat(player.fdpt) || 0
          },
          rankings: {
            position: parseInt(player.posrank) || null,
            overall: parseInt(player.ovrank) || null
          }
        };
      }
    }
  }

  async mergeProjections(projectionsData, position) {
    for (const player of projectionsData) {
      const playerId = this.normalizePlayerName(player.player);
      
      if (this.masterData.has(playerId)) {
        const masterPlayer = this.masterData.get(playerId);
        
        if (!masterPlayer.projections[position]) {
          masterPlayer.projections[position] = {};
        }
        
        // Store all projection fields
        masterPlayer.projections[position] = player;
      }
    }
  }

  generateSummaryStats(players) {
    const summary = {
      total_players: players.length,
      positions: {},
      teams: {},
      data_coverage: {
        has_2025_adp: 0,
        has_historical_adp: 0,
        has_historical_stats: 0,
        has_projections: 0
      }
    };
    
    for (const player of players) {
      // Position breakdown
      const pos = player.position?.replace(/\d+$/, '') || 'UNK';
      summary.positions[pos] = (summary.positions[pos] || 0) + 1;
      
      // Team breakdown
      const team = player.team || 'UNK';
      summary.teams[team] = (summary.teams[team] || 0) + 1;
      
      // Data coverage
      if (player.adp_data && Object.keys(player.adp_data).length > 0) {
        summary.data_coverage.has_2025_adp++;
      }
      
      if (player.adp_data && Object.keys(player.adp_data).some(format => 
        Object.keys(format).some(year => year !== 'ppr' && year !== 'standard')
      )) {
        summary.data_coverage.has_historical_adp++;
      }
      
      if (player.historical_stats && Object.keys(player.historical_stats).length > 0) {
        summary.data_coverage.has_historical_stats++;
      }
      
      if (player.projections && Object.keys(player.projections).length > 0) {
        summary.data_coverage.has_projections++;
      }
    }
    
    return summary;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Run the consolidation
async function main() {
  const consolidator = new DataConsolidator();
  await consolidator.consolidateAllData();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DataConsolidator; 