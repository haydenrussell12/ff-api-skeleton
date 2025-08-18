import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class PositionCSVImporter {
  constructor() {
    this.supabase = supabase;
    this.currentDate = new Date().toISOString().split('T')[0];
    
    // Position validation
    this.validPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    this.positionFormats = {
      'QB': { 
        minPlayers: 20, 
        maxPlayers: 50, 
        expectedFields: ['Player', 'Team', 'FPTS'],
        optionalFields: ['ATT', 'CMP', 'YDS', 'TDS', 'INTS']
      },
      'RB': { 
        minPlayers: 40, 
        maxPlayers: 80, 
        expectedFields: ['Player', 'Team', 'FPTS'],
        optionalFields: ['ATT', 'YDS', 'TDS', 'REC', 'YDS', 'TDS', 'FL']
      },
      'WR': { 
        minPlayers: 50, 
        maxPlayers: 100, 
        expectedFields: ['Player', 'Team', 'FPTS'],
        optionalFields: ['REC', 'YDS', 'TDS', 'ATT', 'YDS', 'TDS', 'FL']
      },
      'TE': { 
        minPlayers: 20, 
        maxPlayers: 40, 
        expectedFields: ['Player', 'Team', 'FPTS'],
        optionalFields: ['REC', 'YDS', 'TDS', 'ATT', 'YDS', 'TDS', 'FL']
      },
      'K': { 
        minPlayers: 15, 
        maxPlayers: 35, 
        expectedFields: ['Player', 'Team', 'FPTS'],
        optionalFields: ['ATT', 'CMP', 'YDS', 'TDS']
      },
      'DST': { 
        minPlayers: 15, 
        maxPlayers: 35, 
        expectedFields: ['Player', 'Team', 'FPTS'],
        optionalFields: ['SACK', 'INT', 'FR', 'TD', 'PA']
      }
    };
  }

  // Validate position and file
  validatePositionAndFile(position, filePath) {
    // Validate position
    if (!this.validPositions.includes(position.toUpperCase())) {
      throw new Error(`Invalid position: ${position}. Must be one of: ${this.validPositions.join(', ')}`);
    }
    
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Validate file extension
    if (!filePath.endsWith('.csv')) {
      throw new Error(`File must be a CSV: ${filePath}`);
    }
    
    return position.toUpperCase();
  }

  // Parse position-specific CSV
  parsePositionCSV(csvContent, position) {
    try {
      console.log(`📊 Parsing ${position} CSV...`);
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log(`📋 CSV Headers: [${headers.join(', ')}]`);
      
      // Validate headers - check for required fields
      const expectedFields = this.positionFormats[position].expectedFields;
      const missingFields = expectedFields.filter(field => !headers.includes(field));
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      const projections = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = this.parseCSVLine(line);
        
        if (values.length < headers.length) continue;
        
        const projection = {};
        headers.forEach((header, index) => {
          projection[header] = values[index]?.trim().replace(/"/g, '') || '';
        });
        
        // Skip empty rows (FantasyPros sometimes has empty lines)
        if (!projection.Player || projection.Player.trim() === '') continue;
        
        // Only include players with valid projections
        if (projection.Player && projection.FPTS) {
          const fantasyPoints = parseFloat(projection.FPTS);
          if (isNaN(fantasyPoints)) continue; // Skip if FPTS is not a valid number
          
          projections.push({
            name: projection.Player,
            position: position,
            team: projection.Team || '',
            projection: fantasyPoints,
            rank: 999, // FantasyPros files don't include rank, will be calculated
            tier: 99,  // FantasyPros files don't include tier, will be calculated
            adp: 999,  // FantasyPros files don't include ADP, will be calculated
            source: 'fantasypros',
            raw_data: projection
          });
        }
      }
      
      // Sort by fantasy points (descending) and assign ranks
      projections.sort((a, b) => b.projection - a.projection);
      projections.forEach((proj, index) => {
        proj.rank = index + 1;
        // Assign tiers based on rank
        if (proj.rank <= 5) proj.tier = 1;
        else if (proj.rank <= 12) proj.tier = 2;
        else if (proj.rank <= 24) proj.tier = 3;
        else if (proj.rank <= 36) proj.tier = 4;
        else proj.tier = 5;
      });
      
      // Validate player count
      const expectedRange = this.positionFormats[position];
      if (projections.length < expectedRange.minPlayers) {
        console.warn(`⚠️  Low player count: ${projections.length} ${position}s (expected ${expectedRange.minPlayers}+)`);
      }
      if (projections.length > expectedRange.maxPlayers) {
        console.warn(`⚠️  High player count: ${projections.length} ${position}s (expected ${expectedRange.maxPlayers}-)`);
      }
      
      console.log(`✅ Parsed ${projections.length} ${position} projections`);
      return projections;
      
    } catch (error) {
      console.error(`❌ Error parsing ${position} CSV:`, error);
      throw error;
    }
  }

  // Handle CSV lines with commas in quoted fields
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }

  // Save projections to database
  async saveProjections(projections, position) {
    try {
      console.log(`💾 Saving ${position} projections to database...`);
      
      // Create snapshot for FantasyPros with position
      const snapshot = await this.createSnapshot('fantasypros', position.toLowerCase(), this.currentDate);
      
      let savedCount = 0;
      let newPlayersCount = 0;
      
      for (const proj of projections) {
        try {
          // Find or create player
          let playerId = await this.findOrCreatePlayer(proj);
          
          if (playerId) {
            // Save projection
            await this.supabase
              .from('ranking_values')
              .upsert({
                snapshot_id: snapshot.snapshot_id,
                player_id: playerId,
                rank: proj.rank,
                tier: proj.tier,
                projection_pts: proj.projection
              }, { onConflict: 'snapshot_id,player_id' });
            
            savedCount++;
          }
        } catch (error) {
          console.error(`Error saving ${position} projection for:`, proj.name, error.message);
          continue;
        }
      }
      
      console.log(`✅ Saved ${savedCount} ${position} projections`);
      console.log(`✅ Created ${newPlayersCount} new ${position} players`);
      
    } catch (error) {
      console.error(`❌ Error saving ${position} projections:`, error);
      throw error;
    }
  }

  // Find existing player or create new one
  async findOrCreatePlayer(projection) {
    try {
      // Try to find by exact name match
      let { data: player, error } = await this.supabase
        .from('players')
        .select('player_id')
        .eq('full_name', projection.name)
        .eq('position', projection.position)
        .single();
      
      if (player) {
        return player.player_id;
      }
      
      // Try to find by name only (position might be different)
      const { data: nameMatch } = await this.supabase
        .from('players')
        .select('player_id, position')
        .eq('full_name', projection.name)
        .single();
      
      if (nameMatch) {
        // Update position if it changed
        await this.supabase
          .from('players')
          .update({ 
            position: projection.position,
            team_code: projection.team || null, // Set to null if team code is invalid
            updated_at: new Date().toISOString()
          })
          .eq('player_id', nameMatch.player_id);
        
        return nameMatch.player_id;
      }
      
      // Create new player - handle invalid team codes gracefully
      const playerData = {
        full_name: projection.name,
        position: projection.position
      };
      
      // Only add team_code if it's not empty
      if (projection.team && projection.team.trim() !== '') {
        playerData.team_code = projection.team;
      }
      
      const { data: newPlayer, error: insertError } = await this.supabase
        .from('players')
        .insert(playerData)
        .select('player_id')
        .single();
      
      if (insertError) {
        // If insert fails due to team code constraint, try without team code
        if (insertError.message.includes('team_code_fkey')) {
          console.warn(`⚠️  Invalid team code "${projection.team}" for ${projection.name}, creating without team code`);
          
          const { data: retryPlayer, error: retryError } = await this.supabase
            .from('players')
            .insert({
              full_name: projection.name,
              position: projection.position
              // No team_code - will be null
            })
            .select('player_id')
            .single();
          
          if (retryError) {
            console.error(`Error creating ${projection.position} player (retry):`, projection.name, retryError.message);
            return null;
          }
          
          return retryPlayer.player_id;
        } else {
          console.error(`Error creating ${projection.position} player:`, projection.name, insertError.message);
          return null;
        }
      }
      
      return newPlayer.player_id;
      
    } catch (error) {
      console.error(`Error finding/creating ${projection.position} player:`, projection.name, error.message);
      return null;
    }
  }

  // Create a new snapshot
  async createSnapshot(source, format, date) {
    const { data, error } = await this.supabase
      .from('rankings_snapshots')
      .upsert({
        source,
        format,
        snapshot_date: date
      }, { onConflict: 'source,format,snapshot_date' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Main import method
  async importPositionCSV(position, filePath) {
    try {
      console.log(`🚀 Starting ${position} CSV import...`);
      console.log(`📁 File: ${filePath}`);
      console.log(`📅 Date: ${this.currentDate}`);
      
      // Validate position and file
      const validatedPosition = this.validatePositionAndFile(position, filePath);
      
      // Read CSV file
      const csvContent = fs.readFileSync(filePath, 'utf8');
      console.log(`📖 Read ${csvContent.length} characters from CSV`);
      
      // Parse CSV
      const projections = this.parsePositionCSV(csvContent, validatedPosition);
      
      if (projections.length === 0) {
        throw new Error(`No valid ${validatedPosition} projections found in CSV`);
      }
      
      // Show sample data
      console.log(`\n📊 Sample ${validatedPosition} projections:`);
      projections.slice(0, 5).forEach(proj => {
        console.log(`  ${proj.name} - ${proj.projection} pts, Rank ${proj.rank}`);
      });
      
      // Save to database
      await this.saveProjections(projections, validatedPosition);
      
      console.log(`\n🎉 ${validatedPosition} CSV import completed successfully!`);
      console.log(`📊 Total ${validatedPosition} projections: ${projections.length}`);
      console.log(`📅 Import date: ${this.currentDate}`);
      
      console.log(`\n💡 Next Steps:`);
      console.log(`1. Use "fantasypros" as source in draft analyzer`);
      console.log(`2. Download new ${validatedPosition} CSV weekly during preseason`);
      console.log(`3. Run this script: npm run import-position-csv ${validatedPosition} data/projections/${validatedPosition.toLowerCase()}/fantasypros-${validatedPosition.toLowerCase()}-2025-08-11.csv`);
      
    } catch (error) {
      console.error(`❌ ${position} import failed:`, error);
      process.exit(1);
    }
  }

  // Import all positions from a directory
  async importAllPositions(projectionsDir = 'data/projections') {
    try {
      console.log('🚀 Starting bulk position import...');
      console.log(`📁 Directory: ${projectionsDir}`);
      
      if (!fs.existsSync(projectionsDir)) {
        throw new Error(`Projections directory not found: ${projectionsDir}`);
      }
      
      const positions = fs.readdirSync(projectionsDir).filter(dir => 
        fs.statSync(path.join(projectionsDir, dir)).isDirectory()
      );
      
      console.log(`📂 Found position directories: ${positions.join(', ')}`);
      
      for (const pos of positions) {
        const posDir = path.join(projectionsDir, pos);
        const csvFiles = fs.readdirSync(posDir).filter(file => file.endsWith('.csv'));
        
        if (csvFiles.length === 0) {
          console.log(`⚠️  No CSV files found in ${pos}/`);
          continue;
        }
        
        // Use most recent CSV file
        const latestCSV = csvFiles.sort().reverse()[0];
        const csvPath = path.join(posDir, latestCSV);
        
        console.log(`\n📊 Importing ${pos.toUpperCase()} from ${latestCSV}...`);
        await this.importPositionCSV(pos.toUpperCase(), csvPath);
      }
      
      console.log('\n🎉 Bulk position import completed successfully!');
      
    } catch (error) {
      console.error('❌ Bulk import failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ Please provide position and CSV file path');
    console.log('Usage: npm run import-position-csv QB data/projections/qb/fantasypros-qb-2025-08-11.csv');
    console.log('Or: npm run import-position-csv --bulk (to import all positions)');
    process.exit(1);
  }
  
  const importer = new PositionCSVImporter();
  
  if (args[0] === '--bulk') {
    importer.importAllPositions();
  } else if (args.length === 2) {
    const [position, filePath] = args;
    importer.importPositionCSV(position, filePath);
  } else {
    console.log('❌ Invalid arguments');
    console.log('Usage: npm run import-position-csv QB data/projections/qb/fantasypros-qb-2025-08-11.csv');
    process.exit(1);
  }
}

export default PositionCSVImporter; 