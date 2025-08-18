import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class FantasyProsCSVImporter {
  constructor() {
    this.supabase = supabase;
    this.currentDate = new Date().toISOString().split('T')[0];
  }

  // Parse FantasyPros CSV format
  parseFantasyProsCSV(csvContent) {
    try {
      console.log('📊 Parsing FantasyPros CSV...');
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      console.log('📋 CSV Headers:', headers);
      
      const projections = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = this.parseCSVLine(line);
        
        if (values.length < headers.length) continue;
        
        const projection = {};
        headers.forEach((header, index) => {
          projection[header] = values[index]?.trim().replace(/"/g, '') || '';
        });
        
        // Only include players with valid projections
        if (projection.Player && projection.Pos && projection.FPTS) {
          projections.push({
            name: projection.Player,
            position: projection.Pos,
            team: projection.Team || '',
            projection: parseFloat(projection.FPTS) || 0,
            rank: parseInt(projection.Rank) || 999,
            tier: parseInt(projection.Tier) || 99,
            adp: parseFloat(projection.ADP) || 999,
            source: 'fantasypros',
            raw_data: projection
          });
        }
      }
      
      console.log(`✅ Parsed ${projections.length} player projections`);
      return projections;
      
    } catch (error) {
      console.error('❌ Error parsing CSV:', error);
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
  async saveProjections(projections) {
    try {
      console.log('💾 Saving projections to database...');
      
      // Create snapshot for FantasyPros
      const snapshot = await this.createSnapshot('fantasypros', 'standard', this.currentDate);
      
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
          console.error('Error saving projection for:', proj.name, error.message);
          continue;
        }
      }
      
      console.log(`✅ Saved ${savedCount} projections`);
      console.log(`✅ Created ${newPlayersCount} new players`);
      
    } catch (error) {
      console.error('❌ Error saving projections:', error);
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
            team_code: projection.team,
            updated_at: new Date().toISOString()
          })
          .eq('player_id', nameMatch.player_id);
        
        return nameMatch.player_id;
      }
      
      // Create new player
      const { data: newPlayer, error: insertError } = await this.supabase
        .from('players')
        .insert({
          full_name: projection.name,
          position: projection.position,
          team_code: projection.team
        })
        .select('player_id')
        .single();
      
      if (insertError) {
        console.error('Error creating player:', projection.name, insertError.message);
        return null;
      }
      
      return newPlayer.player_id;
      
    } catch (error) {
      console.error('Error finding/creating player:', projection.name, error.message);
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
  async importFromCSV(filePath) {
    try {
      console.log('🚀 Starting FantasyPros CSV import...');
      console.log(`📁 File: ${filePath}`);
      console.log(`📅 Date: ${this.currentDate}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`CSV file not found: ${filePath}`);
      }
      
      // Read CSV file
      const csvContent = fs.readFileSync(filePath, 'utf8');
      console.log(`📖 Read ${csvContent.length} characters from CSV`);
      
      // Parse CSV
      const projections = this.parseFantasyProsCSV(csvContent);
      
      if (projections.length === 0) {
        throw new Error('No valid projections found in CSV');
      }
      
      // Show sample data
      console.log('\n📊 Sample projections:');
      projections.slice(0, 5).forEach(proj => {
        console.log(`  ${proj.name} (${proj.position}) - ${proj.projection} pts, Rank ${proj.rank}`);
      });
      
      // Save to database
      await this.saveProjections(projections);
      
      console.log('\n🎉 FantasyPros CSV import completed successfully!');
      console.log(`📊 Total projections: ${projections.length}`);
      console.log(`📅 Import date: ${this.currentDate}`);
      
      console.log('\n💡 Next Steps:');
      console.log('1. Use "fantasypros" as source in draft analyzer');
      console.log('2. Download new CSV weekly during preseason');
      console.log('3. Run this script: npm run import-fantasypros-csv data/fantasypros-projections.csv');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.log('❌ Please provide CSV file path');
    console.log('Usage: npm run import-fantasypros-csv data/fantasypros-projections.csv');
    process.exit(1);
  }
  
  const importer = new FantasyProsCSVImporter();
  importer.importFromCSV(filePath);
}

export default FantasyProsCSVImporter; 