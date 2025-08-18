import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class LeagueConnector {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Connect to a Sleeper league and import basic info
   */
  async connectSleeperLeague(leagueId) {
    try {
      console.log(`🔗 Connecting to Sleeper league: ${leagueId}`);
      
      // Fetch league info from Sleeper API
      const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
      if (!leagueResponse.ok) {
        throw new Error(`Failed to fetch league: ${leagueResponse.status}`);
      }
      
      const leagueData = await leagueResponse.json();
      console.log(`✅ League found: ${leagueData.name}`);
      
      // Fetch league users (team owners)
      const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }
      
      const usersData = await usersResponse.json();
      console.log(`✅ Found ${usersData.length} teams`);
      
      // Store league in database
      let { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .upsert({
          league_id_external: leagueId,
          name: leagueData.name,
          platform: 'sleeper',
          scoring_rules: leagueData.scoring_settings,
          settings: {
            season: leagueData.season,
            total_rosters: leagueData.total_rosters,
            roster_positions: leagueData.roster_positions,
            draft_id: leagueData.draft_id
          }
        }, {
          onConflict: 'league_id_external,platform'
        })
        .select()
        .single();
      
      if (leagueError) {
        // If upsert fails, try to find existing league
        console.log(`⚠️  Upsert failed, trying to find existing league...`);
        const { data: existingLeague, error: findError } = await this.supabase
          .from('leagues')
          .select('*')
          .eq('league_id_external', leagueId)
          .eq('platform', 'sleeper')
          .single();
        
        if (findError) throw findError;
        if (existingLeague) {
          console.log(`✅ Found existing league: ${existingLeague.name}`);
          // Update the existing league with new data
          const { data: updatedLeague, error: updateError } = await this.supabase
            .from('leagues')
            .update({
              name: leagueData.name,
              scoring_rules: leagueData.scoring_settings,
              settings: {
                season: leagueData.season,
                total_rosters: leagueData.total_rosters,
                roster_positions: leagueData.roster_positions,
                draft_id: leagueData.draft_id
              },
              updated_at: new Date().toISOString()
            })
            .eq('league_id', existingLeague.league_id)
            .select()
            .single();
          
          if (updateError) throw updateError;
          league = updatedLeague;
        } else {
          throw new Error(`Failed to create or find league: ${leagueError.message}`);
        }
      }
      
      console.log(`💾 League stored with ID: ${league.league_id}`);
      
      // Store team members
      const membersToInsert = usersData.map(user => ({
        league_id: league.league_id,
        user_id_external: user.user_id,
        team_name: user.metadata?.team_name || `Team ${user.display_name}`,
        display_name: user.display_name,
        avatar_url: user.avatar
      }));
      
      const { error: membersError } = await this.supabase
        .from('league_members')
        .upsert(membersToInsert, {
          onConflict: 'league_id,user_id_external'
        });
      
      if (membersError) throw membersError;
      console.log(`💾 Stored ${membersToInsert.length} team members`);
      
      return {
        league_id: league.league_id,
        league_name: leagueData.name,
        teams_count: usersData.length,
        season: leagueData.season,
        draft_id: leagueData.draft_id
      };
      
    } catch (error) {
      console.error(`❌ Failed to connect to Sleeper league: ${error.message}`);
      throw error;
    }
  }

  /**
   * Connect to an ESPN league and import basic info
   */
  async connectESPNLeague(leagueId, season = 2024) {
    try {
      console.log(`🔗 Connecting to ESPN league: ${leagueId} for season ${season}`);
      
      // ESPN's public API endpoints are no longer working reliably
      // We'll use a fallback approach to create the league entry
      console.log(`⚠️  ESPN API endpoints returning HTML, using fallback approach`);
      
      // Try to get basic league info from the web page
      let leagueName = `ESPN League ${leagueId}`;
      let teamCount = 10; // Default size
      
      try {
        const webResponse = await fetch(`https://fantasy.espn.com/league/${leagueId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (webResponse.ok) {
          const htmlContent = await webResponse.text();
          console.log(`📄 Got HTML response, length: ${htmlContent.length}`);
          
          // Try to extract league name from HTML
          const nameMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (nameMatch && nameMatch[1]) {
            leagueName = nameMatch[1].replace(' - ESPN Fantasy Football', '').trim();
            console.log(`📝 Extracted league name: ${leagueName}`);
          }
          
          // Try to extract team count from HTML
          const teamMatch = htmlContent.match(/teams?/gi);
          if (teamMatch) {
            // Look for common team counts in the HTML
            const teamCountMatch = htmlContent.match(/(\d+)\s*teams?/i);
            if (teamCountMatch) {
              teamCount = parseInt(teamCountMatch[1]);
              console.log(`📊 Extracted team count: ${teamCount}`);
            }
          }
        }
      } catch (webError) {
        console.log(`⚠️  Web page approach failed: ${webError.message}`);
        console.log(`📝 Using default values for league`);
      }
      
      // Create fallback league data
      const leagueData = {
        settings: {
          name: leagueName,
          size: teamCount
        },
        teams: []
      };
      
      console.log(`✅ ESPN League found: ${leagueData.settings.name} (${leagueData.settings.size} teams)`);
      
      // Extract league settings
      const leagueSettings = {
        season: season,
        total_rosters: leagueData.settings.size,
        roster_positions: [],
        scoring_rules: {},
        trade_deadline: null,
        playoff_teams: 0,
        playoff_start_week: 0
      };
      
      // Store league in database
      let { data: league, error: upsertError } = await this.supabase
        .from('leagues')
        .upsert({
          league_id_external: leagueId,
          name: leagueSettings.name,
          platform: 'espn',
          scoring_rules: {}, // Placeholder
          settings: leagueSettings
        }, {
          onConflict: 'league_id_external,platform'
        })
        .select()
        .single();
      
      if (upsertError) {
        // If upsert fails, try to find existing league
        console.log(`⚠️  Upsert failed, trying to find existing league...`);
        const { data: existingLeague, error: findError } = await this.supabase
          .from('leagues')
          .select('*')
          .eq('league_id_external', leagueId)
          .eq('platform', 'espn')
          .single();
        
        if (findError) throw findError;
        if (existingLeague) {
          console.log(`✅ Found existing league: ${existingLeague.name}`);
          return existingLeague;
        } else {
          throw new Error(`Failed to create or find league: ${upsertError.message}`);
        }
      }
      
      // Create league members (teams)
      const { data: members, error: membersError } = await this.supabase
        .from('league_members')
        .upsert(
          Array.from({ length: leagueData.settings.size }, (_, i) => ({
            league_id: league.league_id,
            user_id_external: `espn_team_${i + 1}`,
            team_name: `Team ${i + 1}`,
            display_name: `Team ${i + 1}`
          })),
          { onConflict: 'league_id,user_id_external' }
        )
        .select();
      
      if (membersError) throw membersError;
      
      console.log(`✅ Created ${members.length} league members`);
      
      return {
        league_id: league.league_id,
        league_name: league.name,
        teams_count: members.length,
        season: season,
        platform: 'espn'
      };
      
    } catch (error) {
      console.error(`❌ ESPN League connection failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enhanced connect method that handles both platforms
   */
  async connectLeague(leagueId, platform, season = 2024) {
    switch (platform.toLowerCase()) {
      case 'sleeper':
        return await this.connectSleeperLeague(leagueId);
      case 'espn':
        return await this.connectESPNLeague(leagueId, season);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Import rosters from a Sleeper league
   */
  async importSleeperRosters(leagueId, season = 2024) {
    try {
      console.log(`📥 Importing rosters for Sleeper league: ${leagueId}`);
      
      // Get league from database
      const { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .select('league_id')
        .eq('league_id_external', leagueId)
        .single();
      
      if (leagueError) throw leagueError;
      
      // Fetch rosters from Sleeper API
      const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      if (!rostersResponse.ok) {
        throw new Error(`Failed to fetch rosters: ${rostersResponse.status}`);
      }
      
      const rostersData = await rostersResponse.json();
      console.log(`✅ Found ${rostersData.length} rosters`);
      
      // Get league members for mapping
      const { data: members, error: membersError } = await this.supabase
        .from('league_members')
        .select('member_id, user_id_external')
        .eq('league_id', league.league_id);
      
      if (membersError) throw membersError;
      
      const memberMap = new Map(members.map(m => [m.user_id_external, m.member_id]));
      
      // Process each roster
      let totalPlayers = 0;
      for (const roster of rostersData) {
        let memberId = memberMap.get(roster.owner_id);
        
        // Handle CPU teams (no owner_id)
        if (!memberId && roster.owner_id === null) {
          // Create a placeholder member for CPU teams
          const cpuTeamName = `CPU Team ${roster.roster_id}`;
          const { data: cpuMember, error: cpuMemberError } = await this.supabase
            .from('league_members')
            .upsert({
              league_id: league.league_id,
              user_id_external: `cpu_${roster.roster_id}`,
              team_name: cpuTeamName,
              display_name: cpuTeamName
            }, {
              onConflict: 'league_id,user_id_external'
            })
            .select()
            .single();
          
          if (cpuMemberError) {
            console.warn(`⚠️  Failed to create CPU team member: ${cpuMemberError.message}`);
            continue;
          }
          
          memberId = cpuMember.member_id;
          console.log(`🤖 Created CPU team member: ${cpuTeamName} (ID: ${memberId})`);
        }
        
        if (!memberId) {
          console.warn(`⚠️  No member found for owner: ${roster.owner_id}`);
          continue;
        }
        
        // Process starters
        if (roster.starters && roster.starters.length > 0) {
          for (let i = 0; i < roster.starters.length; i++) {
            const playerId = roster.starters[i];
            if (playerId && playerId !== '0') {
              await this.addPlayerToRoster(league.league_id, memberId, playerId, i, true, season);
              totalPlayers++;
            }
          }
        }
        
        // Process bench players
        if (roster.players && roster.players.length > 0) {
          for (const playerId of roster.players) {
            if (playerId && playerId !== '0' && !roster.starters.includes(playerId)) {
              await this.addPlayerToRoster(league.league_id, memberId, playerId, null, false, season);
              totalPlayers++;
            }
          }
        }
      }
      
      console.log(`💾 Imported ${totalPlayers} players across ${rostersData.length} rosters`);
      return { total_players: totalPlayers, total_rosters: rostersData.length };
      
    } catch (error) {
      console.error(`❌ Failed to import rosters: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import rosters from an ESPN league
   */
  async importESPNRosters(leagueId, season = 2024) {
    try {
      console.log(`📥 Importing ESPN rosters for league: ${leagueId}, season: ${season}`);
      
      // Get league from database
      const { data: league, error: leagueError } = await this.supabase
        .from('leagues')
        .select('league_id')
        .eq('league_id_external', leagueId)
        .eq('platform', 'espn')
        .limit(1)
        .single();
      
      if (leagueError) throw leagueError;
      if (!league) throw new Error(`League not found: ${leagueId}`);
      
      // ESPN's public API endpoints are no longer working reliably
      // We'll create placeholder rosters for now
      console.log(`⚠️  ESPN roster API endpoints returning HTML, creating placeholder rosters`);
      
      // Get league members to create placeholder rosters
      const { data: members, error: membersError } = await this.supabase
        .from('league_members')
        .select('member_id, user_id_external')
        .eq('league_id', league.league_id);
      
      if (membersError) throw membersError;
      
      console.log(`📝 Creating placeholder rosters for ${members.length} teams`);
      
      // Create placeholder roster entries for each member
      for (const member of members) {
        // Add some placeholder players (this is just for testing)
        const placeholderPlayers = [
          { playerId: `espn_placeholder_${member.member_id}_1`, lineupSlotId: 0, isStarter: true },
          { playerId: `espn_placeholder_${member.member_id}_2`, lineupSlotId: 1, isStarter: true },
          { playerId: `espn_placeholder_${member.member_id}_3`, lineupSlotId: 20, isStarter: false }
        ];
        
        for (const player of placeholderPlayers) {
          const rosterPosition = this.mapESPNPosition(player.lineupSlotId);
          await this.addESPNPlayerToRoster(league.league_id, member.member_id, player.playerId, rosterPosition, player.isStarter, season);
        }
      }
      
      console.log(`✅ Created placeholder rosters for ${members.length} teams`);
      return { total_players: members.length * 3, total_rosters: members.length };
      
    } catch (error) {
      console.error(`❌ ESPN roster import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enhanced roster import method that handles both platforms
   */
  async importRosters(leagueId, platform, season = 2024) {
    switch (platform.toLowerCase()) {
      case 'sleeper':
        return await this.importSleeperRosters(leagueId, season);
      case 'espn':
        return await this.importESPNRosters(leagueId, season);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Add a player to a team's roster (Sleeper)
   */
  async addPlayerToRoster(leagueId, memberId, sleeperPlayerId, rosterPosition, isStarter, season) {
    try {
      // Get or create player record
      const { data: player, error: playerError } = await this.supabase
        .from('players')
        .select('player_id')
        .eq('sleeper_id', sleeperPlayerId)
        .single();
      
      if (playerError) {
        // Player doesn't exist, we'll need to create them later
        console.warn(`⚠️  Player not found in database: ${sleeperPlayerId}`);
        return;
      }
      
      // Add to roster
      const { error: rosterError } = await this.supabase
        .from('league_rosters')
        .upsert({
          league_id: leagueId,
          member_id: memberId,
          player_id: player.player_id,
          roster_position: rosterPosition?.toString() || 'BN',
          is_starter: isStarter,
          week: null, // Season-long roster
          season: season
        }, { onConflict: 'league_id,member_id,player_id,week,season' });
      
      if (rosterError) throw rosterError;
      
    } catch (error) {
      console.error(`❌ Failed to add player to roster: ${error.message}`);
    }
  }

  /**
   * Add an ESPN player to a team's roster
   */
  async addESPNPlayerToRoster(leagueId, memberId, espnPlayerId, rosterPosition, isStarter, season) {
    try {
      // Get or create player record
      const { data: player, error: playerError } = await this.supabase
        .from('players')
        .select('player_id')
        .eq('espn_id', espnPlayerId.toString())
        .single();
      
      if (playerError) {
        // Player doesn't exist, we'll need to create them later
        console.warn(`⚠️  ESPN Player not found in database: ${espnPlayerId}`);
        return;
      }
      
      // Add to roster
      const { error: rosterError } = await this.supabase
        .from('league_rosters')
        .upsert({
          league_id: leagueId,
          member_id: memberId,
          player_id: player.player_id,
          roster_position: rosterPosition,
          is_starter: isStarter,
          week: null, // Season-long roster
          season: season
        }, { onConflict: 'league_id,member_id,player_id,week,season' });
      
      if (rosterError) throw rosterError;
      
    } catch (error) {
      console.error(`❌ Failed to add ESPN player to roster: ${error.message}`);
    }
  }

  /**
   * Map ESPN lineup slot IDs to readable positions
   */
  mapESPNPosition(lineupSlotId) {
    const positionMap = {
      0: 'QB',      // Quarterback
      1: 'TQB',     // Team Quarterback
      2: 'RB',      // Running Back
      3: 'RB/WR',   // Running Back/Wide Receiver
      4: 'WR',      // Wide Receiver
      5: 'WR/TE',   // Wide Receiver/Tight End
      6: 'TE',      // Tight End
      7: 'OP',      // Offensive Player
      8: 'DT',      // Defensive Tackle
      9: 'DE',      // Defensive End
      10: 'LB',     // Linebacker
      11: 'DL',     // Defensive Lineman
      12: 'CB',     // Cornerback
      13: 'S',      // Safety
      14: 'DB',     // Defensive Back
      15: 'DP',     // Defensive Player
      16: 'D/ST',   // Defense/Special Teams
      17: 'K',      // Kicker
      18: 'P',      // Punter
      19: 'HC',     // Head Coach
      20: 'BE',     // Bench
      21: 'IR',     // Injured Reserve
      22: 'NA',     // Not Active
      23: 'FA'      // Free Agent
    };
    
    return positionMap[lineupSlotId] || 'UNK';
  }

  /**
   * Get keeper recommendations for a team based on draft position vs ADP
   */
  async getKeeperRecommendations(leagueId, memberId) {
    try {
      console.log(`🔍 Analyzing keeper recommendations for team ${memberId}`);
      
      // Get team's roster
      const { data: roster, error: rosterError } = await this.supabase
        .from('league_rosters')
        .select(`
          *,
          players (
            full_name,
            position,
            team_code,
            sleeper_id
          )
        `)
        .eq('league_id', leagueId)
        .eq('member_id', memberId)
        .eq('season', 2025);
      
      if (rosterError) throw rosterError;
      
      console.log(`📊 Found ${roster?.length || 0} roster items for team ${memberId}`);
      if (roster && roster.length > 0) {
        console.log(`📋 Sample roster item:`, roster[0]);
      }
      
      // Get current ADP data
      const { data: adpData, error: adpError } = await this.supabase
        .from('rankings_snapshots')
        .select(`
          snapshot_id,
          ranking_values (
            player_id,
            rank
          )
        `)
        .eq('source', 'sleeper')
        .eq('format', 'adp')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (adpError) throw adpError;
      
      const adpMap = new Map();
      if (adpData.ranking_values) {
        adpData.ranking_values.forEach(rv => {
          adpMap.set(rv.player_id, rv.rank);
        });
      }
      
      // Analyze each player
      const recommendations = [];
      for (const rosterItem of roster) {
        const player = rosterItem.players;
        if (!player) continue;
        
        const currentAdp = adpMap.get(rosterItem.player_id);
        if (!currentAdp) continue;
        
        // Calculate keeper value (lower ADP = higher value)
        const keeperValue = this.calculateKeeperValue(currentAdp, player.position);
        
        recommendations.push({
          player_name: player.full_name,
          position: player.position,
          team: player.team_code,
          current_adp: currentAdp,
          keeper_value: keeperValue,
          recommendation: this.getKeeperRecommendation(keeperValue, player.position)
        });
      }
      
      // Sort by keeper value (highest first)
      recommendations.sort((a, b) => b.keeper_value - a.keeper_value);
      
      console.log(`✅ Generated ${recommendations.length} keeper recommendations`);
      return recommendations;
      
    } catch (error) {
      console.error(`❌ Failed to get keeper recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate keeper value based on ADP and position
   */
  calculateKeeperValue(adp, position) {
    // Base value: lower ADP = higher value
    let baseValue = 100 - Math.min(adp, 100);
    
    // Position multipliers
    const positionMultipliers = {
      'QB': 0.8,    // QBs are less valuable as keepers
      'RB': 1.2,    // RBs are most valuable
      'WR': 1.1,    // WRs are valuable
      'TE': 1.0,    // TEs are neutral
      'K': 0.3,     // Kickers are least valuable
      'DST': 0.5    // Defenses are low value
    };
    
    const multiplier = positionMultipliers[position] || 1.0;
    return Math.round(baseValue * multiplier);
  }

  /**
   * Get keeper recommendation based on value
   */
  getKeeperRecommendation(value, position) {
    if (value >= 80) return 'DEFINITE KEEPER';
    if (value >= 60) return 'STRONG KEEPER';
    if (value >= 40) return 'CONSIDER KEEPING';
    if (value >= 20) return 'WEAK KEEPER';
    return 'DON\'T KEEP';
  }
}

export default LeagueConnector; 