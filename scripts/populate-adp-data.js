import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class ADPDataPopulator {
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
      console.log('🚀 Starting ADP data population...');
      
      // Step 1: Fetch current Sleeper ADP data
      const sleeperData = await this.fetchSleeperADPData();
      if (!sleeperData || sleeperData.length === 0) {
        console.log('❌ No Sleeper ADP data found');
        return;
      }
      
      console.log(`📊 Found ${sleeperData.length} players with ADP data`);
      
      // Step 2: Match with our database players
      const matchedPlayers = await this.matchPlayersWithDatabase(sleeperData);
      console.log(`✅ Matched ${matchedPlayers.length} players with database`);
      
      // Step 3: Insert/update ADP data
      const result = await this.insertADPData(matchedPlayers);
      console.log(`💾 Successfully processed ${result.inserted} new records and ${result.updated} updates`);
      
      console.log('🎉 ADP data population completed successfully!');
      
    } catch (error) {
      console.error('❌ Error populating ADP data:', error);
    }
  }

  /**
   * Fetch current ADP data from Sleeper
   */
  async fetchSleeperADPData() {
    try {
      console.log('📡 Fetching Sleeper ADP data...');
      
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const playersData = await response.json();
      
      // Filter players with valid search_rank (ADP data)
      const playersWithADP = Object.values(playersData).filter(player => 
        player.search_rank && 
        player.search_rank < 9999999 && 
        player.full_name &&
        player.position &&
        ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(player.position)
      );
      
      // Sort by ADP rank
      playersWithADP.sort((a, b) => a.search_rank - b.search_rank);
      
      console.log(`📊 Found ${playersWithADP.length} fantasy-relevant players with ADP data`);
      
      return playersWithADP;
      
    } catch (error) {
      console.error('❌ Error fetching Sleeper ADP data:', error);
      return [];
    }
  }

  /**
   * Match Sleeper players with our database players
   */
  async matchPlayersWithDatabase(sleeperPlayers) {
    try {
      console.log('🔍 Matching players with database...');
      
      const matchedPlayers = [];
      
      for (const sleeperPlayer of sleeperPlayers) {
        // Try to find exact match first
        let { data: players, error } = await this.supabase
          .from('players')
          .select('player_id, full_name, position, team_code')
          .eq('full_name', sleeperPlayer.full_name)
          .limit(1);
        
        if (error || !players || players.length === 0) {
          // Try fuzzy match
          const fuzzyMatch = await this.findFuzzyMatch(sleeperPlayer.full_name);
          if (fuzzyMatch) {
            matchedPlayers.push({
              ...sleeperPlayer,
              db_player_id: fuzzyMatch.player_id,
              db_name: fuzzyMatch.full_name,
              matched: true
            });
          }
        } else {
          matchedPlayers.push({
            ...sleeperPlayer,
            db_player_id: players[0].player_id,
            db_name: players[0].full_name,
            matched: true
          });
        }
      }
      
      return matchedPlayers;
      
    } catch (error) {
      console.error('❌ Error matching players:', error);
      return [];
    }
  }

  /**
   * Find fuzzy match for player names
   */
  async findFuzzyMatch(playerName) {
    try {
      // Try to find by partial name match
      const { data: players, error } = await this.supabase
        .from('players')
        .select('player_id, full_name, position, team_code')
        .ilike('full_name', `%${playerName.split(' ')[0]}%`)
        .limit(5);
      
      if (error || !players || players.length === 0) {
        return null;
      }
      
      // Find best match
      const normalizedSearch = playerName.toLowerCase().replace(/[^a-z\s]/g, '');
      let bestMatch = null;
      let bestScore = 0;
      
      for (const player of players) {
        const normalizedPlayer = player.full_name.toLowerCase().replace(/[^a-z\s]/g, '');
        
        // Simple similarity scoring
        let score = 0;
        
        if (normalizedPlayer === normalizedSearch) {
          score = 100;
        } else if (normalizedPlayer.includes(normalizedSearch) || normalizedSearch.includes(normalizedPlayer)) {
          score = 80;
        } else {
          // Partial word matching
          const searchWords = normalizedSearch.split(' ');
          const playerWords = normalizedPlayer.split(' ');
          
          for (const searchWord of searchWords) {
            for (const playerWord of playerWords) {
              if (playerWord.includes(searchWord) || searchWord.includes(playerWord)) {
                score += 20;
              }
            }
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = player;
        }
      }
      
      return bestScore > 30 ? bestMatch : null;
      
    } catch (error) {
      console.error('❌ Error in fuzzy match:', error);
      return null;
    }
  }

  /**
   * Insert ADP data into database
   */
  async insertADPData(matchedPlayers) {
    try {
      console.log('💾 Inserting ADP data...');
      
      let inserted = 0;
      let updated = 0;
      const currentDate = new Date().toISOString().split('T')[0];
      
      for (const player of matchedPlayers) {
        if (!player.matched) continue;
        
        // Calculate draft round and pick from ADP rank
        const draftRound = Math.ceil(player.search_rank / 12);
        const draftPick = ((player.search_rank - 1) % 12) + 1;
        
        // Try to insert new record
        const { error: insertError } = await this.supabase
          .from('adp_data')
          .insert({
            player_id: player.db_player_id,
            adp_rank: player.search_rank,
            adp_position: player.search_rank,
            draft_round: draftRound,
            draft_pick: draftPick,
            source: 'sleeper',
            format: 'standard',
            league_size: 12,
            snapshot_date: currentDate
          });
        
        if (insertError) {
          // If insert fails, try to update existing record
          const { error: updateError } = await this.supabase
            .from('adp_data')
            .update({
              adp_rank: player.search_rank,
              adp_position: player.search_rank,
              draft_round: draftRound,
              draft_pick: draftPick,
              snapshot_date: currentDate
            })
            .eq('player_id', player.db_player_id)
            .eq('source', 'sleeper')
            .eq('format', 'standard')
            .eq('league_size', 12);
          
          if (updateError) {
            console.error(`⚠️  Failed to update ADP for ${player.full_name}:`, updateError);
          } else {
            updated++;
          }
        } else {
          inserted++;
        }
      }
      
      return { inserted, updated };
      
    } catch (error) {
      console.error('❌ Error inserting ADP data:', error);
      return { inserted: 0, updated: 0 };
    }
  }

  /**
   * Display sample ADP data
   */
  async displaySampleADPData() {
    try {
      console.log('📊 Sample ADP data from database:');
      
      const { data: adpData, error } = await this.supabase
        .from('adp_data')
        .select(`
          adp_rank,
          adp_position,
          draft_round,
          draft_pick,
          players!inner (
            full_name,
            position,
            team_code
          )
        `)
        .eq('source', 'sleeper')
        .eq('format', 'standard')
        .eq('league_size', 12)
        .order('adp_rank')
        .limit(20);
      
      if (error) {
        console.error('❌ Error fetching sample ADP data:', error);
        return;
      }
      
      console.log('\n🏆 Top 20 Players by ADP:');
      adpData.forEach((adp, index) => {
        const player = adp.players;
        console.log(`   ${index + 1}. ${player.full_name} (${player.position}, ${player.team_code || 'FA'}) - ADP: ${adp.adp_rank} (Round ${adp.draft_round}.${adp.draft_pick.toString().padStart(2, '0')})`);
      });
      
    } catch (error) {
      console.error('❌ Error displaying sample ADP data:', error);
    }
  }
}

// Run the script
const populator = new ADPDataPopulator();
await populator.populateADPData();
await populator.displaySampleADPData(); 