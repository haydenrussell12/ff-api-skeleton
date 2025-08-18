import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class SleeperIDPopulator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.sleeperBaseUrl = 'https://api.sleeper.app/v1';
  }

  /**
   * Main method to populate Sleeper IDs
   */
  async populateSleeperIDs() {
    try {
      console.log('🚀 Starting Sleeper ID population...');
      
      // Step 1: Get all players from our database
      const players = await this.getAllPlayers();
      console.log(`📊 Found ${players.length} players in database`);
      
      // Step 2: Fetch all NFL players from Sleeper
      const sleeperPlayers = await this.fetchSleeperPlayers();
      console.log(`📡 Fetched ${sleeperPlayers.length} players from Sleeper`);
      
      // Step 3: Match players and update database
      const updatedCount = await this.matchAndUpdatePlayers(players, sleeperPlayers);
      console.log(`✅ Updated ${updatedCount} players with Sleeper IDs`);
      
      return {
        success: true,
        playersProcessed: players.length,
        sleeperPlayersFetched: sleeperPlayers.length,
        updatedCount: updatedCount
      };
      
    } catch (error) {
      console.error('❌ Error populating Sleeper IDs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all players from our database
   */
  async getAllPlayers() {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('player_id, full_name, position, team_code')
        .order('full_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }

  /**
   * Fetch all NFL players from Sleeper
   */
  async fetchSleeperPlayers() {
    try {
      console.log('📡 Fetching all NFL players from Sleeper...');
      
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const playersData = await response.json();
      
      // Sleeper API returns an object with player IDs as keys, not an array
      if (typeof playersData !== 'object' || playersData === null) {
        throw new Error('Invalid response from Sleeper API');
      }
      
      // Convert object to array and filter
      const players = Object.values(playersData).filter(player => 
        player.player_id && 
        player.full_name && 
        player.position && 
        player.position !== 'DEF' // Skip team defenses for now
      );
      
      console.log(`📊 Filtered to ${players.length} valid players`);
      return players;
      
    } catch (error) {
      console.error('Error fetching Sleeper players:', error);
      throw error;
    }
  }

  /**
   * Match players and update database
   */
  async matchAndUpdatePlayers(dbPlayers, sleeperPlayers) {
    let updatedCount = 0;
    const batchSize = 100;
    const updates = [];
    
    console.log('🔍 Matching players...');
    
    for (const dbPlayer of dbPlayers) {
      try {
        const sleeperPlayer = this.findBestMatch(dbPlayer, sleeperPlayers);
        
        if (sleeperPlayer) {
          updates.push({
            player_id: dbPlayer.player_id,
            sleeper_id: sleeperPlayer.player_id
          });
        }
        
        // Progress indicator
        if (dbPlayers.indexOf(dbPlayer) % 100 === 0) {
          console.log(`📊 Processed ${dbPlayers.indexOf(dbPlayer)}/${dbPlayers.length} players`);
        }
        
      } catch (error) {
        console.error(`Error processing ${dbPlayer.full_name}:`, error.message);
        continue;
      }
    }
    
    console.log(`📝 Found ${updates.length} matches to update`);
    
    // Update database in batches
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      try {
        // Update each player individually
        for (const update of batch) {
          const { error } = await this.supabase
            .from('players')
            .update({ sleeper_id: update.sleeper_id })
            .eq('player_id', update.player_id);
          
          if (error) {
            console.error(`Error updating player ${update.player_id}:`, error);
          } else {
            updatedCount++;
          }
        }
        
        console.log(`✅ Updated batch ${Math.floor(i/batchSize) + 1} (${batch.length} records)`);
        
      } catch (error) {
        console.error(`Error updating batch ${Math.floor(i/batchSize) + 1}:`, error);
      }
    }
    
    return updatedCount;
  }

  /**
   * Find best match between database player and Sleeper players
   */
  findBestMatch(dbPlayer, sleeperPlayers) {
    const normalizedDbName = this.normalizeName(dbPlayer.full_name);
    const normalizedDbPosition = dbPlayer.position;
    const normalizedDbTeam = this.normalizeTeam(dbPlayer.team_code);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const sleeperPlayer of sleeperPlayers) {
      const normalizedSleeperName = this.normalizeName(sleeperPlayer.full_name);
      const normalizedSleeperPosition = sleeperPlayer.position;
      const normalizedSleeperTeam = this.normalizeTeam(sleeperPlayer.team);
      
      let score = 0;
      
      // Name matching (highest weight)
      if (normalizedDbName === normalizedSleeperName) {
        score += 100;
      } else if (normalizedDbName.includes(normalizedSleeperName) || normalizedSleeperName.includes(normalizedDbName)) {
        score += 80;
      } else {
        // Partial word matching
        const dbWords = normalizedDbName.split(' ');
        const sleeperWords = normalizedSleeperName.split(' ');
        
        for (const dbWord of dbWords) {
          for (const sleeperWord of sleeperWords) {
            if (dbWord.length > 2 && sleeperWord.length > 2) {
              if (dbWord === sleeperWord) {
                score += 30;
              } else if (dbWord.includes(sleeperWord) || sleeperWord.includes(dbWord)) {
                score += 20;
              }
            }
          }
        }
      }
      
      // Position matching
      if (normalizedDbPosition === normalizedSleeperPosition) {
        score += 20;
      }
      
      // Team matching
      if (normalizedDbTeam === normalizedSleeperTeam) {
        score += 15;
      }
      
      // Update best match if this score is higher
      if (score > bestScore) {
        bestScore = score;
        bestMatch = sleeperPlayer;
      }
    }
    
    // Only return match if score is above threshold
    return bestScore >= 50 ? bestMatch : null;
  }

  /**
   * Normalize player name for comparison
   */
  normalizeName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Normalize team code for comparison
   */
  normalizeTeam(team) {
    if (!team) return '';
    
    // Handle common team code variations
    const teamMap = {
      'JAC': 'JAX',
      'LA': 'LAR',
      'LV': 'OAK', // Historical reference
      'WAS': 'WSH'
    };
    
    const normalized = team.toUpperCase().trim();
    return teamMap[normalized] || normalized;
  }
}

// Main execution
async function main() {
  const populator = new SleeperIDPopulator();
  const result = await populator.populateSleeperIDs();
  
  if (result.success) {
    console.log('🎉 Sleeper ID population completed successfully!');
    console.log(`📊 Players processed: ${result.playersProcessed}`);
    console.log(`📡 Sleeper players fetched: ${result.sleeperPlayersFetched}`);
    console.log(`✅ Updated: ${result.updatedCount} players`);
  } else {
    console.error('❌ Sleeper ID population failed:', result.error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SleeperIDPopulator; 