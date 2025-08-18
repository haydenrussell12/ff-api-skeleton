import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CurrentDataFetcher {
  constructor() {
    this.supabase = supabase;
    this.currentDate = new Date().toISOString().split('T')[0];
  }

  // Fetch FantasyPros ADP data
  async fetchFantasyProsADP() {
    try {
      console.log('📊 Fetching FantasyPros ADP data...');
      
      // FantasyPros ADP endpoint (you'll need to get an API key)
      const response = await fetch('https://api.fantasypros.com/v2/nfl/adp', {
        headers: {
          'Authorization': `Bearer ${process.env.FANTASYPROS_API_KEY || 'demo'}`,
          'User-Agent': 'FantasyFootballApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.log('⚠️ FantasyPros API not accessible, using sample ADP data');
        return this.getSampleADPData();
      }
      
      const data = await response.json();
      return this.parseFantasyProsADP(data);
      
    } catch (error) {
      console.log('⚠️ Using sample ADP data due to error:', error.message);
      return this.getSampleADPData();
    }
  }

  // Get sample ADP data for development
  getSampleADPData() {
    return [
      { name: 'Christian McCaffrey', position: 'RB', team: 'SF', adp: 1.2, format: 'standard' },
      { name: 'Breece Hall', position: 'RB', team: 'NYJ', adp: 2.1, format: 'standard' },
      { name: 'Justin Jefferson', position: 'WR', team: 'MIN', adp: 3.5, format: 'standard' },
      { name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 4.2, format: 'standard' },
      { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 5.8, format: 'standard' },
      { name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 6.1, format: 'standard' },
      { name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 7.3, format: 'standard' },
      { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', adp: 8.4, format: 'standard' },
      { name: 'Derrick Henry', position: 'RB', team: 'BAL', adp: 9.7, format: 'standard' },
      { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 10.2, format: 'standard' }
    ];
  }

  // Parse FantasyPros ADP data
  parseFantasyProsADP(data) {
    // This would parse the actual FantasyPros response
    // For now, return sample data
    return this.getSampleADPData();
  }

  // Fetch ESPN projections
  async fetchESPNProjections() {
    try {
      console.log('📊 Fetching ESPN projections...');
      
      // ESPN doesn't have a public API, so we'll use sample data
      // In production, you might scrape their site or use a service
      return this.getSampleESPNProjections();
      
    } catch (error) {
      console.log('⚠️ Using sample ESPN projections due to error:', error.message);
      return this.getSampleESPNProjections();
    }
  }

  // Get sample ESPN projections
  getSampleESPNProjections() {
    return [
      { name: 'Christian McCaffrey', position: 'RB', team: 'SF', projection: 300, rank: 1, tier: 1 },
      { name: 'Breece Hall', position: 'RB', team: 'NYJ', projection: 290, rank: 2, tier: 1 },
      { name: 'Justin Jefferson', position: 'WR', team: 'MIN', projection: 280, rank: 3, tier: 1 },
      { name: 'Tyreek Hill', position: 'WR', team: 'MIA', projection: 275, rank: 4, tier: 1 },
      { name: 'CeeDee Lamb', position: 'WR', team: 'DAL', projection: 270, rank: 5, tier: 1 },
      { name: 'Bijan Robinson', position: 'RB', team: 'ATL', projection: 265, rank: 6, tier: 1 },
      { name: 'Saquon Barkley', position: 'RB', team: 'PHI', projection: 260, rank: 7, tier: 1 },
      { name: 'Ja\'Marr Chase', position: 'WR', team: 'CIN', projection: 255, rank: 8, tier: 1 },
      { name: 'Derrick Henry', position: 'RB', team: 'BAL', projection: 250, rank: 9, tier: 1 },
      { name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', projection: 245, rank: 10, tier: 1 }
    ];
  }

  // Fetch Sleeper player data for comprehensive coverage
  async fetchSleeperPlayers() {
    try {
      console.log('📊 Fetching Sleeper player data...');
      
      const response = await fetch('https://api.sleeper.app/v1/players/nfl');
      if (!response.ok) {
        throw new Error(`Sleeper API error: ${response.status}`);
      }
      
      const players = await response.json();
      console.log(`✅ Fetched ${Object.keys(players).length} players from Sleeper`);
      
      return this.parseSleeperPlayers(players);
      
    } catch (error) {
      console.error('❌ Error fetching Sleeper players:', error);
      throw error;
    }
  }

  // Parse Sleeper player data
  parseSleeperPlayers(players) {
    const parsedPlayers = [];
    const fantasyPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
    
    Object.values(players).forEach(player => {
      // Only include active players with fantasy-relevant positions
      if (player.active && 
          player.position && 
          fantasyPositions.includes(player.position) &&
          player.position !== 'DEF') { // Skip team defenses for now
        
        // Skip players without names
        if (!player.full_name && (!player.first_name || !player.last_name)) {
          return;
        }
        
        parsedPlayers.push({
          name: player.full_name || `${player.first_name} ${player.last_name}`,
          position: player.position,
          team: player.team,
          sleeper_id: player.player_id,
          search_rank: player.search_rank,
          fantasy_positions: player.fantasy_positions
        });
      }
    });
    
    console.log(`📊 Filtered to ${parsedPlayers.length} fantasy-relevant players`);
    console.log(`📊 Position breakdown:`, this.getPositionBreakdown(parsedPlayers));
    
    return parsedPlayers;
  }

  // Get position breakdown for logging
  getPositionBreakdown(players) {
    const breakdown = {};
    players.forEach(player => {
      breakdown[player.position] = (breakdown[player.position] || 0) + 1;
    });
    return breakdown;
  }

  // Save all data to Supabase
  async saveDataToSupabase(adpData, projections, sleeperPlayers) {
    try {
      console.log('💾 Saving data to Supabase...');
      
      // 1. Save/update players
      const playerSnapshot = await this.createSnapshot('sleeper', 'comprehensive', this.currentDate);
      await this.savePlayers(sleeperPlayers, playerSnapshot.snapshot_id);
      
      // 2. Save ADP data
      const adpSnapshot = await this.createSnapshot('fantasypros', 'adp', this.currentDate);
      await this.saveADPData(adpData, adpSnapshot.snapshot_id);
      
      // 3. Save projections
      const projectionSnapshot = await this.createSnapshot('espn', 'standard', this.currentDate);
      await this.saveProjections(projections, projectionSnapshot.snapshot_id);
      
      console.log('✅ All data saved successfully!');
      
    } catch (error) {
      console.error('❌ Error saving data:', error);
      throw error;
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

  // Save players to database
  async savePlayers(players, snapshotId) {
    let savedCount = 0;
    
    for (const player of players) {
      try {
        // Get or create player
        const { data: existingPlayer, error: selectError } = await this.supabase
          .from('players')
          .select('player_id')
          .eq('full_name', player.name)
          .eq('position', player.position)
          .single();
        
        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Error selecting player:', selectError);
          continue;
        }
        
        let playerId;
        if (existingPlayer) {
          playerId = existingPlayer.player_id;
          // Update player info
          await this.supabase
            .from('players')
            .update({ 
              team_code: player.team,
              updated_at: new Date().toISOString()
            })
            .eq('player_id', playerId);
        } else {
          // Create new player
          const { data: newPlayer, error: insertError } = await this.supabase
            .from('players')
            .insert({
              full_name: player.name,
              position: player.position,
              team_code: player.team
            })
            .select('player_id')
            .single();
          
          if (insertError) {
            console.error('Error inserting player:', insertError, player.name);
            continue;
          }
          
          playerId = newPlayer.player_id;
        }
        
        // Save ranking value
        const { error: rankingError } = await this.supabase
          .from('ranking_values')
          .upsert({
            snapshot_id: snapshotId,
            player_id: playerId,
            rank: player.search_rank || 999,
            tier: Math.ceil((player.search_rank || 999) / 50)
          }, { onConflict: 'snapshot_id,player_id' });
        
        if (rankingError) {
          console.error('Error saving ranking:', rankingError);
          continue;
        }
        
        savedCount++;
        
      } catch (error) {
        console.error('Error processing player:', player.name, error.message);
        continue;
      }
    }
    
    console.log(`✅ Saved ${savedCount} players`);
  }

  // Save ADP data
  async saveADPData(adpData, snapshotId) {
    for (const adp of adpData) {
      // Find player
      const { data: player } = await this.supabase
        .from('players')
        .select('player_id')
        .eq('full_name', adp.name)
        .eq('position', adp.position)
        .single();
      
      if (player) {
        // Save ADP as a special ranking value
        await this.supabase
          .from('ranking_values')
          .upsert({
            snapshot_id: snapshotId,
            player_id: player.player_id,
            rank: Math.round(adp.adp * 10), // Convert ADP to rank-like number
            tier: Math.ceil(adp.adp / 2)
          }, { onConflict: 'snapshot_id,player_id' });
      }
    }
    
    console.log(`✅ Saved ${adpData.length} ADP records`);
  }

  // Save projections
  async saveProjections(projections, snapshotId) {
    for (const proj of projections) {
      // Find player
      const { data: player } = await this.supabase
        .from('players')
        .select('player_id')
        .eq('full_name', proj.name)
        .eq('position', proj.position)
        .single();
      
      if (player) {
        // Save projection
        await this.supabase
          .from('ranking_values')
          .upsert({
            snapshot_id: snapshotId,
            player_id: player.player_id,
            rank: proj.rank,
            tier: proj.tier,
            projection_pts: proj.projection
          }, { onConflict: 'snapshot_id,player_id' });
      }
    }
    
    console.log(`✅ Saved ${projections.length} projections`);
  }

  // Main execution method
  async run() {
    try {
      console.log('🚀 Starting comprehensive data fetch...');
      console.log(`📅 Date: ${this.currentDate}`);
      
      // Fetch all data sources
      const [adpData, projections, sleeperPlayers] = await Promise.all([
        this.fetchFantasyProsADP(),
        this.fetchESPNProjections(),
        this.fetchSleeperPlayers()
      ]);
      
      // Save everything to Supabase
      await this.saveDataToSupabase(adpData, projections, sleeperPlayers);
      
      console.log('🎉 Data fetch completed successfully!');
      console.log(`📊 Total players: ${sleeperPlayers.length}`);
      console.log(`📊 ADP records: ${adpData.length}`);
      console.log(`📊 Projections: ${projections.length}`);
      
    } catch (error) {
      console.error('❌ Data fetch failed:', error);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fetcher = new CurrentDataFetcher();
  fetcher.run();
}

export default CurrentDataFetcher; 