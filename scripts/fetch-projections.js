import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const SOURCES = [
  {
    name: 'ecr',
    url: 'https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php',
    format: 'standard'
  },
  {
    name: 'fantasypros',
    url: 'https://www.fantasypros.com/nfl/rankings/ppr-cheatsheets.php',
    format: 'ppr'
  }
];

class ProjectionFetcher {
  constructor() {
    this.supabase = supabase;
  }

  // Fetch projections from FantasyPros (example)
  async fetchFantasyProsProjections() {
    try {
      console.log('📊 Fetching FantasyPros projections...');
      
      // Note: This is a simplified example. In practice, you'd need to:
      // 1. Handle authentication if required
      // 2. Parse the HTML/JSON response
      // 3. Extract player data
      
      // For now, we'll create sample data structure
      const sampleProjections = [
        {
          source: 'fantasypros',
          format: 'ppr',
          snapshot_date: new Date().toISOString().split('T')[0],
          players: [
            { full_name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1, tier: 1, projection_pts: 320.5 },
            { full_name: 'Tyreek Hill', position: 'WR', team: 'MIA', rank: 2, tier: 1, projection_pts: 315.2 },
            { full_name: 'CeeDee Lamb', position: 'WR', team: 'DAL', rank: 3, tier: 1, projection_pts: 310.8 },
            { full_name: 'Breece Hall', position: 'RB', team: 'NYJ', rank: 4, tier: 1, projection_pts: 305.4 },
            { full_name: 'Justin Jefferson', position: 'WR', team: 'MIN', rank: 5, tier: 1, projection_pts: 300.1 }
          ]
        }
      ];
      
      return sampleProjections;
    } catch (error) {
      console.error('❌ Error fetching FantasyPros projections:', error);
      throw error;
    }
  }

  // Fetch projections from ESPN (example)
  async fetchESPNProjections() {
    try {
      console.log('📊 Fetching ESPN projections...');
      
      // Similar structure for ESPN data
      const sampleProjections = [
        {
          source: 'espn',
          format: 'standard',
          snapshot_date: new Date().toISOString().split('T')[0],
          players: [
            { full_name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1, tier: 1, projection_pts: 325.0 },
            { full_name: 'Breece Hall', position: 'RB', team: 'NYJ', rank: 2, tier: 1, projection_pts: 318.5 },
            { full_name: 'Tyreek Hill', position: 'WR', team: 'MIA', rank: 3, tier: 1, projection_pts: 312.0 },
            { full_name: 'CeeDee Lamb', position: 'WR', team: 'DAL', rank: 4, tier: 1, projection_pts: 308.2 },
            { full_name: 'Justin Jefferson', position: 'WR', team: 'MIN', rank: 5, tier: 1, projection_pts: 305.8 }
          ]
        }
      ];
      
      return sampleProjections;
    } catch (error) {
      console.error('❌ Error fetching ESPN projections:', error);
      throw error;
    }
  }

  // Fetch projections from multiple sources
  async fetchAllProjections() {
    const allProjections = [];
    
    try {
      // Fetch from different sources
      const fantasyProsData = await this.fetchFantasyProsProjections();
      const espnData = await this.fetchESPNProjections();
      
      allProjections.push(...fantasyProsData, ...espnData);
      
      console.log(`✅ Fetched projections from ${allProjections.length} sources`);
      return allProjections;
      
    } catch (error) {
      console.error('❌ Error fetching projections:', error);
      throw error;
    }
  }

  // Save projections to database
  async saveProjections(projections) {
    try {
      console.log('💾 Saving projections to database...');
      
      for (const projectionSet of projections) {
        const { source, format, snapshot_date, players } = projectionSet;
        
        // Create or get snapshot
        const snapshotId = await this.getOrCreateSnapshot(source, format, snapshot_date);
        
        // Process each player
        for (const player of players) {
          const playerId = await this.getOrCreatePlayer(player);
          
          // Insert ranking value
          await this.insertRankingValue(snapshotId, playerId, player);
        }
      }
      
      console.log('✅ All projections saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving projections:', error);
      throw error;
    }
  }

  // Get or create snapshot
  async getOrCreateSnapshot(source, format, snapshot_date) {
    const { data: existing, error: e1 } = await this.supabase
      .from('rankings_snapshots')
      .select('snapshot_id')
      .eq('source', source)
      .eq('format', format)
      .eq('snapshot_date', snapshot_date)
      .maybeSingle();
    
    if (e1) throw e1;
    if (existing) return existing.snapshot_id;

    const { data: inserted, error: e2 } = await this.supabase
      .from('rankings_snapshots')
      .insert([{ source, format, snapshot_date }])
      .select('snapshot_id')
      .single();
    
    if (e2) throw e2;
    return inserted.snapshot_id;
  }

  // Get or create player
  async getOrCreatePlayer({ full_name, position, team }) {
    let { data: player, error: e1 } = await this.supabase
      .from('players')
      .select('player_id')
      .eq('full_name', full_name)
      .maybeSingle();
    
    if (e1) throw e1;
    if (player) return player.player_id;

    const { data: created, error: e2 } = await this.supabase
      .from('players')
      .insert([{ full_name, position, team_code: team }])
      .select('player_id')
      .single();
    
    if (e2) throw e2;
    return created.player_id;
  }

  // Insert ranking value
  async insertRankingValue(snapshotId, playerId, player) {
    const { error } = await this.supabase
      .from('ranking_values')
      .upsert([{
        snapshot_id: snapshotId,
        player_id: playerId,
        rank: player.rank,
        tier: player.tier,
        projection_pts: player.projection_pts
      }], { onConflict: 'snapshot_id,player_id' });
    
    if (error) throw error;
  }

  // Main function to run the fetcher
  async run() {
    try {
      console.log('🚀 Starting projection fetch...');
      
      // Fetch projections from all sources
      const projections = await this.fetchAllProjections();
      
      // Save to database
      await this.saveProjections(projections);
      
      console.log('✅ Projection fetch completed successfully!');
      
    } catch (error) {
      console.error('❌ Projection fetch failed:', error);
      process.exit(1);
    }
  }
}

// Run the fetcher if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new ProjectionFetcher();
  fetcher.run();
}

export default ProjectionFetcher; 