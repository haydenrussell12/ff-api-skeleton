import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class SimpleADPPopulator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.sleeperBaseUrl = 'https://api.sleeper.app/v1';
  }

  /**
   * Main method to populate ADP data
   */
  async populateADPData() {
    try {
      console.log('🚀 Starting simplified ADP data population...');
      
      // Step 1: Fetch current Sleeper ADP data
      const sleeperData = await this.fetchSleeperADPData();
      if (!sleeperData || sleeperData.length === 0) {
        console.log('❌ No Sleeper ADP data found');
        return;
      }
      
      console.log(`📊 Found ${sleeperData.length} players with ADP data`);
      
      // Step 2: Match players with our database
      const matchedPlayers = await this.matchPlayersWithDatabase(sleeperData);
      if (matchedPlayers.length === 0) {
        console.log('❌ No players could be matched with database');
        return;
      }
      
      console.log(`✅ Successfully matched ${matchedPlayers.length} players`);
      
      // Step 3: Store ADP data in a simple format
      await this.storeADPData(matchedPlayers);
      
      // Step 4: Display sample data
      await this.displaySampleADPData();
      
      console.log('🎉 ADP data population completed successfully!');
      
    } catch (error) {
      console.error('❌ Error populating ADP data:', error);
    }
  }

  /**
   * Fetch current Sleeper ADP data
   */
  async fetchSleeperADPData() {
    try {
      console.log('📡 Fetching Sleeper ADP data...');
      
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const playersData = await response.json();
      
      // Filter players with search_rank (ADP data)
      const playersWithADP = Object.values(playersData)
        .filter(player => 
          player.search_rank && 
          player.search_rank > 0 && 
          player.position && 
          ['QB', 'RB', 'WR', 'TE'].includes(player.position)
        )
        .map(player => ({
          sleeper_id: player.player_id,
          full_name: player.full_name,
          position: player.position,
          team_code: player.team,
          search_rank: player.search_rank,
          draft_round: Math.ceil(player.search_rank / 12),
          draft_pick: ((player.search_rank - 1) % 12) + 1
        }))
        .sort((a, b) => a.search_rank - b.search_rank);
      
      console.log(`📊 Found ${playersWithADP.length} fantasy-relevant players with ADP data`);
      
      return playersWithADP;
      
    } catch (error) {
      console.error('❌ Error fetching Sleeper data:', error);
      return [];
    }
  }

  /**
   * Match Sleeper players with our database
   */
  async matchPlayersWithDatabase(sleeperPlayers) {
    try {
      console.log('🔍 Matching players with database...');
      
      const matchedPlayers = [];
      
      for (const sleeperPlayer of sleeperPlayers) {
        try {
          // Try to find player by name and position
          const { data: dbPlayer, error } = await this.supabase
            .from('players')
            .select('player_id, full_name, position, team_code')
            .eq('position', sleeperPlayer.position)
            .ilike('full_name', `%${sleeperPlayer.full_name.split(' ').slice(-1)[0]}%`)
            .limit(1);
          
          if (error) {
            console.error(`Error querying for ${sleeperPlayer.full_name}:`, error);
            continue;
          }
          
          if (dbPlayer && dbPlayer.length > 0) {
            const player = dbPlayer[0];
            matchedPlayers.push({
              ...sleeperPlayer,
              player_id: player.player_id,
              db_name: player.full_name,
              sleeper_name: sleeperPlayer.full_name
            });
          } else {
            // Try fuzzy matching
            const fuzzyMatch = await this.findFuzzyMatch(sleeperPlayer.full_name);
            if (fuzzyMatch) {
              matchedPlayers.push({
                ...sleeperPlayer,
                player_id: fuzzyMatch.player_id,
                db_name: fuzzyMatch.full_name,
                sleeper_name: sleeperPlayer.full_name
              });
            }
          }
          
        } catch (error) {
          console.error(`Error processing ${sleeperPlayer.full_name}:`, error);
        }
      }
      
      return matchedPlayers;
      
    } catch (error) {
      console.error('❌ Error matching players:', error);
      return [];
    }
  }

  /**
   * Find fuzzy match for player name
   */
  async findFuzzyMatch(playerName) {
    try {
      // Try different name variations
      const nameVariations = [
        playerName,
        playerName.replace(/\./g, ''),
        playerName.replace(/ Jr\.?$/, ''),
        playerName.replace(/ Sr\.?$/, ''),
        playerName.replace(/ III$/, ''),
        playerName.replace(/ IV$/, ''),
        playerName.replace(/ V$/, '')
      ];
      
      for (const variation of nameVariations) {
        const { data: players, error } = await this.supabase
          .from('players')
          .select('player_id, full_name, position')
          .ilike('full_name', `%${variation}%`)
          .limit(5);
        
        if (error || !players || players.length === 0) continue;
        
        // Find best match
        const bestMatch = players.find(p => 
          p.full_name.toLowerCase().includes(variation.toLowerCase()) ||
          variation.toLowerCase().includes(p.full_name.toLowerCase())
        );
        
        if (bestMatch) {
          return bestMatch;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error in fuzzy matching:', error);
      return null;
    }
  }

  /**
   * Store ADP data in a simple format
   */
  async storeADPData(matchedPlayers) {
    try {
      console.log('💾 Storing ADP data...');
      
      // Since we can't create new tables, let's store this in a simple format
      // We'll create a JSON file with the ADP data for now
      const adpData = {
        timestamp: new Date().toISOString(),
        total_players: matchedPlayers.length,
        players: matchedPlayers.map(player => ({
          player_id: player.player_id,
          full_name: player.db_name || player.full_name,
          position: player.position,
          team_code: player.team_code,
          adp_rank: player.search_rank,
          draft_round: player.draft_round,
          draft_pick: player.draft_pick,
          sleeper_id: player.sleeper_id
        }))
      };
      
      // Save to a local file for now
      const fs = await import('fs/promises');
      await fs.writeFile('adp_data.json', JSON.stringify(adpData, null, 2));
      
      console.log('✅ ADP data saved to adp_data.json');
      
      // Also try to update the players table with ADP info if possible
      await this.updatePlayersWithADP(matchedPlayers);
      
    } catch (error) {
      console.error('❌ Error storing ADP data:', error);
    }
  }

  /**
   * Update players table with ADP information
   */
  async updatePlayersWithADP(matchedPlayers) {
    try {
      console.log('🔄 Updating players table with ADP info...');
      
      let updatedCount = 0;
      
      for (const player of matchedPlayers) {
        try {
          // Update the player with sleeper_id if not already set
          const { error } = await this.supabase
            .from('players')
            .update({ 
              sleeper_id: player.sleeper_id,
              updated_at: new Date().toISOString()
            })
            .eq('player_id', player.player_id);
          
          if (error) {
            console.error(`Error updating player ${player.player_id}:`, error);
          } else {
            updatedCount++;
          }
          
        } catch (error) {
          console.error(`Error updating player ${player.player_id}:`, error);
        }
      }
      
      console.log(`✅ Updated ${updatedCount} players with Sleeper IDs`);
      
    } catch (error) {
      console.error('❌ Error updating players table:', error);
    }
  }

  /**
   * Display sample ADP data
   */
  async displaySampleADPData() {
    try {
      console.log('\n📊 Sample ADP Data:');
      console.log('===================');
      
      const fs = await import('fs/promises');
      const adpData = JSON.parse(await fs.readFile('adp_data.json', 'utf8'));
      
      // Show top 20 players
      const top20 = adpData.players.slice(0, 20);
      
      top20.forEach((player, index) => {
        console.log(`${(index + 1).toString().padStart(2, ' ')}. ${player.full_name.padEnd(20)} ${player.position} ${player.team_code || 'N/A'} - ADP: ${player.adp_rank}`);
      });
      
      console.log(`\n📈 Total players with ADP data: ${adpData.total_players}`);
      console.log(`🕐 Data timestamp: ${adpData.timestamp}`);
      
    } catch (error) {
      console.error('❌ Error displaying sample data:', error);
    }
  }
}

// Run the script
const populator = new SimpleADPPopulator();
populator.populateADPData().then(() => {
  console.log('🎉 Simplified ADP population completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 