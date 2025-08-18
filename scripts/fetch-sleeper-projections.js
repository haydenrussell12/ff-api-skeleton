import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

class SleeperProjectionFetcher {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    this.sleeperBaseUrl = 'https://api.sleeper.app/v1';
  }

  /**
   * Main method to fetch and store Sleeper projections
   */
  async fetchAndStoreProjections() {
    try {
      console.log('🚀 Starting Sleeper projection fetch...');
      
      // Step 1: Get all players from our database
      const players = await this.getAllPlayers();
      console.log(`📊 Found ${players.length} players in database`);
      
      // Step 2: Fetch Sleeper projections for each player
      const projections = await this.fetchSleeperProjections(players);
      console.log(`📈 Fetched ${projections.length} projections from Sleeper`);
      
      // Step 3: Store projections in database
      await this.storeProjections(projections);
      console.log('✅ Projections stored successfully!');
      
      return {
        success: true,
        playersProcessed: players.length,
        projectionsFetched: projections.length
      };
      
    } catch (error) {
      console.error('❌ Error fetching Sleeper projections:', error);
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
        .select('player_id, full_name, sleeper_id, position, team_code')
        .not('sleeper_id', 'is', null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting players:', error);
      return [];
    }
  }

  /**
   * Fetch Sleeper projections for players
   */
  async fetchSleeperProjections(players) {
    const projections = [];
    const batchSize = 50; // Process in batches to avoid rate limiting
    
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      console.log(`📡 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(players.length/batchSize)}`);
      
      const batchProjections = await this.processBatch(batch);
      projections.push(...batchProjections);
      
      // Rate limiting - wait between batches
      if (i + batchSize < players.length) {
        await this.sleep(1000); // Wait 1 second between batches
      }
    }
    
    return projections;
  }

  /**
   * Process a batch of players
   */
  async processBatch(players) {
    const projections = [];
    
    for (const player of players) {
      try {
        if (!player.sleeper_id) continue;
        
        // Fetch player stats from Sleeper
        const stats = await this.fetchPlayerStats(player.sleeper_id);
        
        if (stats) {
          const projection = this.createProjection(player, stats);
          if (projection) {
            projections.push(projection);
          }
        }
        
        // Small delay between individual requests
        await this.sleep(100);
        
      } catch (error) {
        console.error(`Error processing ${player.full_name}:`, error.message);
        continue;
      }
    }
    
    return projections;
  }

  /**
   * Fetch player stats from Sleeper API
   */
  async fetchPlayerStats(sleeperId) {
    try {
      // Try to get player stats from Sleeper
      const response = await fetch(`${this.sleeperBaseUrl}/players/nfl/${sleeperId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const playerData = await response.json();
      
      if (!playerData || !playerData.stats) {
        return null;
      }
      
      return playerData;
      
    } catch (error) {
      console.error(`Error fetching stats for player ${sleeperId}:`, error.message);
      return null;
    }
  }

  /**
   * Create projection object from Sleeper data
   */
  createProjection(player, sleeperData) {
    try {
      const stats = sleeperData.stats || {};
      const searchRank = sleeperData.search_rank || null;
      
      // Calculate projected points based on position and stats
      let projectedPoints = this.calculateProjectedPoints(player.position, stats);
      
      if (projectedPoints === null) {
        return null;
      }
      
      return {
        player_id: player.player_id,
        season: 2025, // Current season
        source: 'sleeper',
        projection_pts: projectedPoints,
        sleeper_rank: searchRank,
        sleeper_stats: stats,
        created_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error creating projection for ${player.full_name}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate projected points based on position and stats
   */
  calculateProjectedPoints(position, stats) {
    try {
      // This is a simplified calculation - in practice, you'd want more sophisticated logic
      // based on historical performance, age, team changes, etc.
      
      let projectedPoints = 0;
      let passYards, passTDs, interceptions, rushYards, rushTDs, receptions, recYards, recTDs;
      
      switch (position) {
        case 'QB':
          // QB scoring: 4 pts per TD pass, 1 pt per 25 yards, -2 per INT
          passYards = stats.pass_yds || 0;
          passTDs = stats.pass_td || 0;
          interceptions = stats.int || 0;
          rushYards = stats.rush_yds || 0;
          rushTDs = stats.rush_td || 0;
          
          projectedPoints = (passYards / 25) + (passTDs * 4) - (interceptions * 2) + (rushYards / 10) + (rushTDs * 6);
          break;
          
        case 'RB':
          // RB scoring: 1 pt per 10 yards, 6 pts per TD
          rushYards = stats.rush_yds || 0;
          rushTDs = stats.rush_td || 0;
          receptions = stats.rec || 0;
          recYards = stats.rec_yds || 0;
          recTDs = stats.rec_td || 0;
          
          projectedPoints = (rushYards / 10) + (rushTDs * 6) + (receptions * 1) + (recYards / 10) + (recTDs * 6);
          break;
          
        case 'WR':
        case 'TE':
          // WR/TE scoring: 1 pt per 10 yards, 6 pts per TD, 1 pt per reception
          recYards = stats.rec_yds || 0;
          recTDs = stats.rec_td || 0;
          receptions = stats.rec || 0;
          
          projectedPoints = (recYards / 10) + (recTDs * 6) + (receptions * 1);
          break;
          
        case 'K':
          // Kicker scoring: 3 pts per FG, 1 pt per XP
          const fieldGoals = stats.fgm || 0;
          const extraPoints = stats.xpm || 0;
          
          projectedPoints = (fieldGoals * 3) + extraPoints;
          break;
          
        case 'DEF':
        case 'DST':
          // Defense scoring: based on points allowed, sacks, turnovers, etc.
          // This is simplified - real defense scoring is more complex
          const sacks = stats.sack || 0;
          const interceptions = stats.int || 0;
          const fumbleRecoveries = stats.fum_rec || 0;
          const defensiveTDs = stats.def_td || 0;
          
          projectedPoints = (sacks * 1) + (interceptions * 2) + (fumbleRecoveries * 2) + (defensiveTDs * 6);
          break;
          
        default:
          return null;
      }
      
      // Round to 2 decimal places
      return Math.round(projectedPoints * 100) / 100;
      
    } catch (error) {
      console.error('Error calculating projected points:', error.message);
      return null;
    }
  }

  /**
   * Store projections in database
   */
  async storeProjections(projections) {
    try {
      if (projections.length === 0) {
        console.log('No projections to store');
        return;
      }
      
      // First, delete existing Sleeper projections for this season
      const { error: deleteError } = await this.supabase
        .from('ranking_values')
        .delete()
        .eq('source', 'sleeper')
        .eq('season', 2025);
      
      if (deleteError) {
        console.error('Error deleting existing projections:', deleteError);
      }
      
      // Create a new snapshot for Sleeper projections
      const { data: snapshot, error: snapshotError } = await this.supabase
        .from('rankings_snapshots')
        .insert({
          source: 'sleeper',
          format: 'standard',
          season: 2025,
          snapshot_date: new Date().toISOString(),
          description: 'Sleeper API projections'
        })
        .select()
        .single();
      
      if (snapshotError) {
        throw new Error(`Failed to create snapshot: ${snapshotError.message}`);
      }
      
      console.log(`📸 Created snapshot ${snapshot.snapshot_id}`);
      
      // Store projections in ranking_values table
      const rankingValues = projections.map((proj, index) => ({
        snapshot_id: snapshot.snapshot_id,
        player_id: proj.player_id,
        rank: index + 1, // Simple ranking based on order
        projection_pts: proj.projection_pts,
        source: 'sleeper',
        season: 2025,
        created_at: new Date().toISOString()
      }));
      
      // Insert in batches to avoid payload size limits
      const batchSize = 100;
      for (let i = 0; i < rankingValues.length; i += batchSize) {
        const batch = rankingValues.slice(i, i + batchSize);
        
        const { error: insertError } = await this.supabase
          .from('ranking_values')
          .insert(batch);
        
        if (insertError) {
          console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        } else {
          console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} records)`);
        }
      }
      
      console.log('✅ All projections stored successfully!');
      
    } catch (error) {
      console.error('Error storing projections:', error);
      throw error;
    }
  }

  /**
   * Utility function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const fetcher = new SleeperProjectionFetcher();
  const result = await fetcher.fetchAndStoreProjections();
  
  if (result.success) {
    console.log('🎉 Sleeper projection fetch completed successfully!');
    console.log(`📊 Players processed: ${result.playersProcessed}`);
    console.log(`📈 Projections fetched: ${result.projectionsFetched}`);
  } else {
    console.error('❌ Sleeper projection fetch failed:', result.error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SleeperProjectionFetcher; 