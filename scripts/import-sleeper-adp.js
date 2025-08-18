import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SleeperADPImporter {
  constructor() {
    this.supabase = supabase;
    this.currentDate = new Date().toISOString().split('T')[0];
  }

  async importSleeperADP() {
    try {
      console.log('🚀 Starting Sleeper ADP import...');
      
      // Fetch all players from Sleeper API
      console.log('📡 Fetching players from Sleeper API...');
      const response = await fetch('https://api.sleeper.app/v1/players/nfl');
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      
      const players = await response.json();
      console.log(`✅ Fetched ${Object.keys(players).length} players from Sleeper`);
      
      // Filter for fantasy-relevant players with search_rank
      const fantasyPlayers = Object.values(players).filter(player => {
        return player.search_rank && 
               player.position && 
               ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(player.position) &&
               player.full_name;
      });
      
      console.log(`📊 Found ${fantasyPlayers.length} fantasy-relevant players with search_rank`);
      
      // Sort by search_rank (lower = better ADP)
      fantasyPlayers.sort((a, b) => a.search_rank - b.search_rank);
      
      // Create snapshot for ADP data
      console.log('💾 Creating ADP snapshot...');
      let snapshot;
      try {
        const { data: newSnapshot, error: snapshotError } = await this.supabase
          .from('rankings_snapshots')
          .insert({
            source: 'sleeper',
            format: 'adp',
            snapshot_date: this.currentDate
          })
          .select('snapshot_id')
          .single();
        
        if (snapshotError) {
          if (snapshotError.message.includes('duplicate key')) {
            console.log('📝 ADP snapshot already exists for today, using existing one');
            const { data: existingSnapshot, error: findError } = await this.supabase
              .from('rankings_snapshots')
              .select('snapshot_id')
              .eq('source', 'sleeper')
              .eq('format', 'adp')
              .eq('snapshot_date', this.currentDate)
              .single();
            
            if (findError) {
              throw new Error(`Failed to find existing snapshot: ${findError.message}`);
            }
            
            snapshot = existingSnapshot;
          } else {
            throw snapshotError;
          }
        } else {
          snapshot = newSnapshot;
        }
      } catch (error) {
        throw new Error(`Failed to create/find snapshot: ${error.message}`);
      }
      
      if (!snapshot || !snapshot.snapshot_id) {
        throw new Error('Failed to get valid snapshot ID');
      }
      
      console.log(`✅ Created snapshot: ${snapshot.snapshot_id}`);
      
      // Process players in batches
      const batchSize = 100;
      let processed = 0;
      
      for (let i = 0; i < fantasyPlayers.length; i += batchSize) {
        const batch = fantasyPlayers.slice(i, i + batchSize);
        await this.processPlayerBatch(batch, snapshot.snapshot_id, i + 1);
        processed += batch.length;
        console.log(`📈 Processed ${processed}/${fantasyPlayers.length} players`);
      }
      
      console.log('🎉 Sleeper ADP import completed successfully!');
      console.log(`📊 Total players imported: ${fantasyPlayers.length}`);
      
    } catch (error) {
      console.error('❌ Error importing Sleeper ADP:', error);
      throw error;
    }
  }

  async processPlayerBatch(players, snapshotId, startRank) {
    const playerData = [];
    const processedPlayers = new Set(); // Track processed players to avoid duplicates
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const rank = startRank + i;
      
      // Find or create player in database
      const playerId = await this.findOrCreatePlayer(player);
      if (!playerId) {
        console.warn(`⚠️  Skipping player ${player.full_name} - could not create/find in database`);
        continue;
      }
      
      // Check if we've already processed this player in this batch
      if (processedPlayers.has(playerId)) {
        console.warn(`⚠️  Skipping duplicate player ${player.full_name} (ID: ${playerId}) in batch`);
        continue;
      }
      
      processedPlayers.add(playerId);
      
      playerData.push({
        snapshot_id: snapshotId,
        player_id: playerId,
        rank: rank,
        tier: this.calculateTier(rank),
        projection_pts: null // ADP doesn't have projections
      });
    }
    
    if (playerData.length > 0) {
      try {
        const { error } = await this.supabase
          .from('ranking_values')
          .upsert(playerData, { 
            onConflict: 'snapshot_id,player_id',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error('❌ Error inserting ranking values:', error);
          throw error;
        }
        
        console.log(`✅ Successfully inserted ${playerData.length} ranking values`);
      } catch (error) {
        console.error('❌ Batch insert failed:', error);
        throw error;
      }
    } else {
      console.log('⚠️  No valid players in batch to insert');
    }
  }

  async findOrCreatePlayer(player) {
    try {
      // Try to find existing player
      const { data: existingPlayer, error: findError } = await this.supabase
        .from('players')
        .select('player_id')
        .eq('full_name', player.full_name)
        .single();
      
      if (existingPlayer) {
        return existingPlayer.player_id;
      }
      
      // Create new player
      const { data: newPlayer, error: createError } = await this.supabase
        .from('players')
        .insert({
          full_name: player.full_name,
          position: player.position,
          team_code: player.team || null
        })
        .select('player_id')
        .single();
      
      if (createError) {
        console.warn(`⚠️  Could not create player ${player.full_name}:`, createError.message);
        return null;
      }
      
      return newPlayer.player_id;
      
    } catch (error) {
      if (error.message.includes('PGRST116')) {
        // No player found, create new one
        try {
          const { data: newPlayer, error: createError } = await this.supabase
            .from('players')
            .insert({
              full_name: player.full_name,
              position: player.position,
              team_code: player.team || null
            })
            .select('player_id')
            .single();
          
          if (createError) {
            console.warn(`⚠️  Could not create player ${player.full_name}:`, createError.message);
            return null;
          }
          
          return newPlayer.player_id;
        } catch (createError) {
          console.warn(`⚠️  Could not create player ${player.full_name}:`, createError.message);
          return null;
        }
      }
      
      console.warn(`⚠️  Error processing player ${player.full_name}:`, error.message);
      return null;
    }
  }

  calculateTier(rank) {
    if (rank <= 12) return 1;      // Round 1
    if (rank <= 24) return 2;      // Round 2
    if (rank <= 36) return 3;      // Round 3
    if (rank <= 48) return 4;      // Round 4
    if (rank <= 60) return 5;      // Round 5
    if (rank <= 72) return 6;      // Round 6
    if (rank <= 84) return 7;      // Round 7
    if (rank <= 96) return 8;      // Round 8
    if (rank <= 108) return 9;     // Round 9
    if (rank <= 120) return 10;    // Round 10
    if (rank <= 132) return 11;    // Round 11
    if (rank <= 144) return 12;    // Round 12
    if (rank <= 156) return 13;    // Round 13
    if (rank <= 168) return 14;    // Round 14
    if (rank <= 180) return 15;    // Round 15
    return 16;                     // Round 16+
  }
}

// Run the import
const importer = new SleeperADPImporter();
importer.importSleeperADP()
  .then(() => {
    console.log('✅ Sleeper ADP import completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Sleeper ADP import failed:', error);
    process.exit(1);
  }); 