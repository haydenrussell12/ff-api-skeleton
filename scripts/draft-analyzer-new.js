import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import OptimalLineupEngine from './optimal-lineup-engine.js';
import PositionGradeEngine from './position-grade-engine.js';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DraftAnalyzer {
    constructor() {
        this.consolidatedData = {};
        this.nameLookupIndex = {};
        this.playerDetails = {};
        this.optimalLineupEngine = new OptimalLineupEngine();
        this.positionGradeEngine = new PositionGradeEngine();
        this.vorpData = {};
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Draft Analyzer...');
            
            // Load consolidated player data
            const masterPlayersPath = join(__dirname, '..', 'data', 'consolidated', 'master-players.json');
            const nameLookupPath = join(__dirname, '..', 'data', 'consolidated', 'name-lookup-index.json');
            const vorpDataPath = join(__dirname, '..', 'data', 'consolidated', 'player-vorp-scores.json');
            
            if (!fs.existsSync(masterPlayersPath)) {
                throw new Error(`Master players file not found: ${masterPlayersPath}`);
            }
            
            const masterPlayersData = JSON.parse(fs.readFileSync(masterPlayersPath, 'utf8'));
            
            // Convert players array to object keyed by player_id for faster lookup
            this.consolidatedData = {};
            if (masterPlayersData.players && Array.isArray(masterPlayersData.players)) {
                masterPlayersData.players.forEach(player => {
                    if (player.player_id) {
                        this.consolidatedData[player.player_id] = player;
                    }
                });
            }
            
            console.log(`✅ Loaded ${Object.keys(this.consolidatedData).length} consolidated players`);
            
            // Load name lookup index
            if (fs.existsSync(nameLookupPath)) {
                this.nameLookupIndex = JSON.parse(fs.readFileSync(nameLookupPath, 'utf8'));
                console.log(`✅ Loaded name lookup index with ${Object.keys(this.nameLookupIndex).length} entries`);
            }
            
            // Load VORP data
            if (fs.existsSync(vorpDataPath)) {
                const vorpData = JSON.parse(fs.readFileSync(vorpDataPath, 'utf8'));
                // Convert VORP data to lookup by player name for easier access
                this.vorpData = {};
                if (vorpData.vorpScores && typeof vorpData.vorpScores === 'object') {
                    Object.values(vorpData.vorpScores).forEach(player => {
                        if (player.playerName) {
                            this.vorpData[player.playerName.toLowerCase()] = player;
                        }
                    });
                }
                console.log(`✅ Loaded VORP data with ${Object.keys(this.vorpData).length} players`);
                console.log(`🔍 Sample VORP data:`, Object.keys(this.vorpData).slice(0, 5));
            } else {
                console.log(`⚠️ VORP data file not found at: ${vorpDataPath}`);
            }
            
            console.log('✅ Draft Analyzer initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Draft Analyzer:', error);
            throw error;
        }
    }

    async analyzeDraft(draftUrl) {
        try {
            console.log('🚀 Starting draft analysis...');
            
            // Parse the draft URL to extract the draft ID
            const draftId = this.parseSleeperUrl(draftUrl);
            if (!draftId) {
                throw new Error('Failed to parse Sleeper URL');
            }
            
            console.log(`🎯 Draft ID extracted: ${draftId}`);
            
            // Fetch draft data from Sleeper
            const draftData = await this.fetchDraftData(draftId);
            const picks = await this.fetchDraftPicks(draftId);
            
            console.log(`✅ Draft data fetched: { draftName: ${draftData.name || 'undefined'}, teams: ${draftData.settings.teams}, rounds: ${draftData.settings.rounds}, picksCount: ${picks.length} }`);
            
            // Fetch player details and team names
            await this.fetchPlayerDetails(picks);
            const teamNames = await this.fetchTeamNames(Object.keys(draftData.slot_to_roster_id || {}), draftId);
            
            // Build teams from picks
            const teams = await this.buildTeamsFromPicks(picks, draftData.settings.teams, draftId);
            
            // Calculate optimal lineups for each team
            const teamsWithOptimalLineups = await this.calculateOptimalLineupsForTeams(teams);
            
            // Analyze draft performance
            const analysis = this.analyzeDraftPerformance(teamsWithOptimalLineups);
            
            // Use the updated teams from the analysis
            const updatedTeams = {};
            
            // Safety check: ensure analysis.teams exists and is an array
            if (analysis && analysis.teams && Array.isArray(analysis.teams)) {
                analysis.teams.forEach(team => {
                    if (team && team.teamId && teamsWithOptimalLineups[team.teamId]) {
                        updatedTeams[team.teamId] = {
                            ...teamsWithOptimalLineups[team.teamId],
                            totalProjectedPoints: team.totalProjectedPoints,
                            totalAdpValue: team.totalAdpValue,
                            averageAdpValue: team.averageAdpValue,
                            totalVorpScore: team.totalVorpScore,
                            averageVorpScore: team.averageVorpScore,
                            positionGrades: teamsWithOptimalLineups[team.teamId].positionGrades
                        };
                    }
                });
            } else {
                console.warn('⚠️ No teams found in analysis, using fallback');
                // Fallback: use the teamsWithOptimalLineups directly
                Object.keys(teamsWithOptimalLineups).forEach(teamId => {
                    updatedTeams[teamId] = teamsWithOptimalLineups[teamId];
                });
            }
            
            console.log('🎉 Draft analysis completed successfully!');
            
            return {
                draftInfo: {
                    name: draftData.name,
                    teams: draftData.settings.teams,
                    rounds: draftData.settings.rounds,
                    totalPicks: picks.length
                },
                teams: updatedTeams,
                analysis: analysis,
                teamNames: teamNames
            };
            
        } catch (error) {
            console.error('❌ Draft analysis failed:', error);
            throw new Error(`Draft analysis failed: ${error.message}`);
        }
    }

    parseSleeperUrl(url) {
        // Handle various Sleeper URL formats
        const patterns = [
            /sleeper\.app\/draft\/nfl\/([a-zA-Z0-9]+)/,
            /sleeper\.com\/draft\/nfl\/([a-zA-Z0-9]+)/,
            /draft\/([a-zA-Z0-9]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    async fetchDraftData(draftId) {
        const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch draft data: ${response.status}`);
        }
        return await response.json();
    }

    async fetchDraftPicks(draftId) {
        const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
        if (!response.ok) {
            throw new Error(`Failed to fetch draft picks: ${response.status}`);
        }
        return await response.json();
    }

    async buildTeamsFromPicks(picks, teamCount, draftId) {
        const teams = {};

        // Get unique player IDs
        const uniquePlayerIds = [...new Set(picks.map(pick => pick.player_id))];
        console.log(`👥 Found ${uniquePlayerIds.length} unique players in draft`);

        // Fetch player details from Sleeper
        const playerDetails = await this.fetchPlayerDetails(uniquePlayerIds);
        console.log(`✅ Fetched player details for ${Object.keys(playerDetails).length} players`);
        
        // Debug: Check what we got for defensive teams
        const defensiveTeams = uniquePlayerIds.filter(id => ['SEA', 'PIT', 'SF', 'BAL', 'DEN', 'TB', 'DET', 'PHI', 'WAS', 'BUF', 'CLE', 'CIN', 'HOU', 'IND', 'JAX', 'TEN', 'KC', 'LV', 'LAC', 'DAL', 'NYG', 'ARI', 'LAR', 'MIN', 'GB', 'CHI', 'ATL', 'CAR', 'NO', 'NYJ', 'NE'].includes(id));
        if (defensiveTeams.length > 0) {
            console.log(`🛡️ Found defensive team IDs: ${defensiveTeams.join(', ')}`);
        }

        // Check if we have valid roster_id values
        const hasValidRosterIds = picks.some(pick => pick.roster_id !== null);
        
        if (hasValidRosterIds) {
            // Use roster_id for team assignment (normal case)
            console.log(`🏈 Using roster_id for team assignment`);
            
            picks.forEach(pick => {
                const rosterId = pick.roster_id;
                if (!teams[rosterId]) {
                    teams[rosterId] = {
                        teamId: rosterId,
                        teamName: `Team ${rosterId}`,
                        userId: null,
                        roster: []
                    };
                }
                
                // Extract player name from pick metadata (more reliable than playerDetails)
                let playerName;
                if (pick.metadata && pick.metadata.first_name && pick.metadata.last_name) {
                    playerName = `${pick.metadata.first_name} ${pick.metadata.last_name}`;
                } else {
                    playerName = playerDetails[pick.player_id]?.name || `Player ${pick.player_id}`;
                }
                
                const playerPosition = pick.metadata?.position || playerDetails[pick.player_id]?.position || 'UNKNOWN';
                
                // Handle defensive teams
                let finalPlayerName = playerName;
                if (['SEA', 'PIT', 'SF', 'BAL', 'DEN', 'TB', 'DET', 'PHI', 'WAS', 'BUF', 'CLE', 'CIN', 'HOU', 'IND', 'JAX', 'TEN', 'KC', 'LV', 'LAC', 'DAL', 'NYG', 'ARI', 'LAR', 'MIN', 'GB', 'CHI', 'ATL', 'CAR', 'NO', 'NYJ', 'NE'].includes(pick.player_id)) {
                    const teamNames = {
                        'SEA': 'Seattle Seahawks', 'PIT': 'Pittsburgh Steelers', 'SF': 'San Francisco 49ers',
                        'BAL': 'Baltimore Ravens', 'DEN': 'Denver Broncos', 'TB': 'Tampa Bay Buccaneers',
                        'DET': 'Detroit Lions', 'PHI': 'Philadelphia Eagles', 'WAS': 'Washington Commanders',
                        'BUF': 'Buffalo Bills', 'CLE': 'Cleveland Browns', 'CIN': 'Cincinnati Bengals',
                        'HOU': 'Houston Texans', 'IND': 'Indianapolis Colts', 'JAX': 'Jacksonville Jaguars',
                        'TEN': 'Tennessee Titans', 'KC': 'Kansas City Chiefs', 'LV': 'Las Vegas Raiders',
                        'LAC': 'Los Angeles Chargers', 'DAL': 'Dallas Cowboys', 'NYG': 'New York Giants',
                        'ARI': 'Arizona Cardinals', 'LAR': 'Los Angeles Rams', 'MIN': 'Minnesota Vikings',
                        'GB': 'Green Bay Packers', 'CHI': 'Chicago Bears', 'ATL': 'Atlanta Falcons',
                        'CAR': 'Carolina Panthers', 'NO': 'New Orleans Saints', 'NYJ': 'New York Jets',
                        'NE': 'New England Patriots'
                    };
                    finalPlayerName = teamNames[pick.player_id] || playerName;
                }
                
                const player = {
                    playerId: pick.player_id,
                    playerName: finalPlayerName,
                    position: playerPosition,
                    pickNumber: pick.pick_no,
                    round: pick.round,
                    pickValue: pick.pick_no,
                    projectedPoints: this.findPlayerProjection(finalPlayerName),
                    adpValue: this.calculateAdpValue(pick.pick_no, this.findPlayerAdpValue(finalPlayerName)),
                    vorpScore: this.findPlayerVorpValue(finalPlayerName)
                };
                
                teams[rosterId].roster.push(player);
            });
            
            // Try to fetch team names from draft data
            const teamNames = await this.fetchTeamNames(Object.keys(teams), draftId);
            
            // Update team names and user IDs
            for (const rosterId of Object.keys(teams)) {
                if (teamNames[rosterId]) {
                    teams[rosterId].teamName = teamNames[rosterId];
                    // Check if we have a stored user ID for this team
                    if (teamNames[`${rosterId}_userId`]) {
                        teams[rosterId].userId = teamNames[`${rosterId}_userId`];
                        console.log(`🏈 Set user ID for team ${rosterId}: ${teamNames[`${rosterId}_userId`]}`);
                    } else {
                        // Fallback: try to extract user ID from team name
                        teams[rosterId].userId = await this.extractUserIdFromTeamName(teamNames[rosterId], draftId);
                    }
                }
            }
            
        } else {
            // Fallback: use pick order for team assignment (when roster_id is null)
            console.log(`🏈 roster_id is null, using draft slot mapping for team assignment`);
            
            // Get the draft data to access slot_to_roster_id mapping
            const draftResponse = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
            if (!draftResponse.ok) {
                throw new Error('Failed to fetch draft data for slot mapping');
            }
            
            const draftData = await draftResponse.json();
            
            if (!draftData.slot_to_roster_id) {
                throw new Error('No slot_to_roster_id mapping found in draft data');
            }
            
            console.log(`🏈 Found slot_to_roster_id mapping:`, draftData.slot_to_roster_id);
            
            // Create teams with IDs that correspond to roster IDs from slot mapping
            const rosterIds = Object.values(draftData.slot_to_roster_id);
            rosterIds.forEach(rosterId => {
                teams[rosterId] = {
                    teamId: rosterId.toString(),
                    teamName: `Team ${rosterId}`,
                    userId: null,
                    roster: []
                };
            });
            
            // Create mapping of pick number to roster ID using slot_to_roster_id
            const pickToRosterId = {};
            
            // Use the draft_slot directly from the Sleeper API instead of calculating it
            picks.forEach(pick => {
                const pickNumber = pick.pick_no;
                const slot = pick.draft_slot; // Use the actual draft_slot from Sleeper
                
                // Map slot to roster ID
                const rosterId = draftData.slot_to_roster_id[slot];
                if (rosterId) {
                    pickToRosterId[pickNumber] = rosterId;
                    console.log(`🏈 Pick ${pickNumber} (slot ${slot}) -> roster ${rosterId}`);
                } else {
                    console.warn(`⚠️ No roster ID found for slot ${slot} in pick ${pickNumber}`);
                }
            });
            
            console.log(`🏈 Created pick to roster ID mapping:`, pickToRosterId);
            
            // Assign players to teams based on their pick number
            picks.forEach((pick, index) => {
                const rosterId = pickToRosterId[pick.pick_no];
                
                if (!rosterId) {
                    console.warn(`⚠️ No roster ID found for pick ${pick.pick_no}, skipping`);
                    return;
                }
                
                if (!teams[rosterId]) {
                    console.warn(`⚠️ No team found for roster ID ${rosterId}, creating one`);
                    teams[rosterId] = {
                        teamId: rosterId.toString(),
                        teamName: `Team ${rosterId}`,
                        userId: null,
                        roster: []
                    };
                }
                
                // Extract player name from pick metadata (more reliable than playerDetails)
                let playerName;
                if (pick.metadata && pick.metadata.first_name && pick.metadata.last_name) {
                    playerName = `${pick.metadata.first_name} ${pick.metadata.last_name}`;
                } else {
                    playerName = playerDetails[pick.player_id]?.name || `Player ${pick.player_id}`;
                }
                
                const playerPosition = pick.metadata?.position || playerDetails[pick.player_id]?.position || 'UNKNOWN';
                
                // Handle defensive teams
                let finalPlayerName = playerName;
                if (['SEA', 'PIT', 'SF', 'BAL', 'DEN', 'TB', 'DET', 'PHI', 'WAS', 'BUF', 'CLE', 'CIN', 'HOU', 'IND', 'JAX', 'TEN', 'KC', 'LV', 'LAC', 'DAL', 'NYG', 'ARI', 'LAR', 'MIN', 'GB', 'CHI', 'ATL', 'CAR', 'NO', 'NYJ', 'NE'].includes(pick.player_id)) {
                    const teamNames = {
                        'SEA': 'Seattle Seahawks', 'PIT': 'Pittsburgh Steelers', 'SF': 'San Francisco 49ers',
                        'BAL': 'Baltimore Ravens', 'DEN': 'Denver Broncos', 'TB': 'Tampa Bay Buccaneers',
                        'DET': 'Detroit Lions', 'PHI': 'Philadelphia Eagles', 'WAS': 'Washington Commanders',
                        'BUF': 'Buffalo Bills', 'CLE': 'Cleveland Browns', 'CIN': 'Cincinnati Bengals',
                        'HOU': 'Houston Texans', 'IND': 'Indianapolis Colts', 'JAX': 'Jacksonville Jaguars',
                        'TEN': 'Tennessee Titans', 'KC': 'Kansas City Chiefs', 'LV': 'Las Vegas Raiders',
                        'LAC': 'Los Angeles Chargers', 'DAL': 'Dallas Cowboys', 'NYG': 'New York Giants',
                        'ARI': 'Arizona Cardinals', 'LAR': 'Los Angeles Rams', 'MIN': 'Minnesota Vikings',
                        'GB': 'Green Bay Packers', 'CHI': 'Chicago Bears', 'ATL': 'Atlanta Falcons',
                        'CAR': 'Carolina Panthers', 'NO': 'New Orleans Saints', 'NYJ': 'New York Jets',
                        'NE': 'New England Patriots'
                    };
                    finalPlayerName = teamNames[pick.player_id] || playerName;
                }
                
                const player = {
                    playerId: pick.player_id,
                    playerName: finalPlayerName,
                    position: playerPosition,
                    pickNumber: pick.pick_no,
                    round: pick.round,
                    pickValue: pick.pick_no,
                    projectedPoints: this.findPlayerProjection(finalPlayerName),
                    adpValue: this.calculateAdpValue(pick.pick_no, this.findPlayerAdpValue(finalPlayerName)),
                    vorpScore: this.findPlayerVorpValue(finalPlayerName)
                };
                
                teams[rosterId].roster.push(player);
                console.log(`🏈 Assigned ${finalPlayerName} (pick ${pick.pick_no}) to team ${rosterId}`);
            });
            
            // Try to fetch team names from draft data
            const teamNames = await this.fetchTeamNames(Object.keys(teams), draftId);
            
            // Update team names and user IDs
            for (const rosterId of Object.keys(teams)) {
                if (teamNames[rosterId]) {
                    teams[rosterId].teamName = teamNames[rosterId];
                    // Check if we have a stored user ID for this team
                    if (teamNames[`${rosterId}_userId`]) {
                        teams[rosterId].userId = teamNames[`${rosterId}_userId`];
                        console.log(`🏈 Set user ID for team ${rosterId}: ${teamNames[`${rosterId}_userId`]}`);
                    } else {
                        // Fallback: try to extract user ID from team name
                        teams[rosterId].userId = await this.extractUserIdFromTeamName(teamNames[rosterId], draftId);
                    }
                }
            }
        }

        console.log(`✅ Built ${Object.keys(teams).length} teams from picks`);
        return teams;
    }

    async fetchPlayerDetails(playerIds) {
        const playerDetails = {};
        
        // Team abbreviation to full name mapping
        const teamAbbreviations = {
          'SEA': 'Seattle Seahawks',
          'PIT': 'Pittsburgh Steelers', 
          'SF': 'San Francisco 49ers',
          'BAL': 'Baltimore Ravens',
          'DEN': 'Denver Broncos',
          'TB': 'Tampa Bay Buccaneers',
          'DET': 'Detroit Lions',
          'PHI': 'Philadelphia Eagles',
          'WAS': 'Washington Commanders',
          'MIN': 'Minnesota Vikings',
          'CIN': 'Cincinnati Bengals',
          'BUF': 'Buffalo Bills',
          'KC': 'Kansas City Chiefs',
          'LV': 'Las Vegas Raiders',
          'IND': 'Indianapolis Colts',
          'CHI': 'Chicago Bears',
          'NYG': 'New York Giants',
          'NYJ': 'New York Jets',
          'NE': 'New England Patriots',
          'DAL': 'Dallas Cowboys',
          'ATL': 'Atlanta Falcons',
          'ARI': 'Arizona Cardinals',
          'CAR': 'Carolina Panthers',
          'CLE': 'Cleveland Browns',
          'GB': 'Green Bay Packers',
          'HOU': 'Houston Texans',
          'JAX': 'Jacksonville Jaguars',
          'LAC': 'Los Angeles Chargers',
          'LAR': 'Los Angeles Rams',
          'MIA': 'Miami Dolphins',
          'NO': 'New Orleans Saints',
          'TEN': 'Tennessee Titans'
        };
        
        // Fetch all players from Sleeper API
        try {
          const response = await fetch('https://api.sleeper.app/v1/players/nfl');
          if (response.ok) {
            const allPlayers = await response.json();
            
            // Map player IDs to names and positions
            playerIds.forEach(playerId => {
              if (allPlayers[playerId]) {
                playerDetails[playerId] = {
                  full_name: allPlayers[playerId].full_name || allPlayers[playerId].name,
                  position: allPlayers[playerId].position
                };
              } else if (teamAbbreviations[playerId]) {
                // Handle defensive team abbreviations
                playerDetails[playerId] = {
                  full_name: teamAbbreviations[playerId],
                  position: 'DEF'
                };
              }
            });
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch player details:', error.message);
        }

        return playerDetails;
    }

    async fetchTeamNames(rosterIds, draftId) {
        const teamNames = {};
        try {
          // First, get the draft data to extract league ID
          const draftResponse = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
          if (draftResponse.ok) {
            const draftData = await draftResponse.json();
            console.log(`🏈 Draft data received:`, {
              name: draftData.name,
              status: draftData.status,
              settings: draftData.settings
            });
            
            // Check if this is a league draft (has league_id)
            if (draftData.league_id) {
              console.log(`🏈 Found league ID: ${draftData.league_id}`);
              
              try {
                // Fetch league information to get team names
                const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${draftData.league_id}`);
                if (leagueResponse.ok) {
                  const leagueData = await leagueResponse.json();
                  console.log(`🏈 League data received:`, {
                    name: leagueData.name,
                    season: leagueData.season,
                    status: leagueData.status
                  });
                  
                  // Fetch league users to get team names
                  const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${draftData.league_id}/users`);
                  if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    console.log(`�� Found ${usersData.length} league users`);
                    
                    // Create mapping of user_id to display_name
                    const userIdToName = {};
                    usersData.forEach(user => {
                      userIdToName[user.user_id] = user.display_name || user.metadata?.team_name || `Team ${user.display_name}`;
                    });
                    
                    // Now map roster IDs to team names using draft_order
                    if (draftData.draft_order && draftData.slot_to_roster_id) {
                      const slotToRosterId = draftData.slot_to_roster_id;
                      const rosterIdToSlot = {};
                      
                      // Create reverse mapping
                      Object.entries(slotToRosterId).forEach(([slot, rosterId]) => {
                        rosterIdToSlot[rosterId] = parseInt(slot);
                      });
                      
                      // Map roster IDs to team names using draft order
                      rosterIds.forEach(rosterId => {
                        const slot = rosterIdToSlot[rosterId];
                        if (slot !== undefined) {
                          // Check if this slot has a user assigned
                          const hasUser = Object.values(draftData.draft_order).includes(slot);
                          if (hasUser) {
                            // Find the user_id for this slot
                            const userId = Object.keys(draftData.draft_order).find(key => draftData.draft_order[key] === slot);
                            if (userId) {
                              const teamName = userIdToName[userId];
                              if (teamName) {
                                teamNames[rosterId] = teamName;
                                console.log(`🏈 Mapped roster ${rosterId} (slot ${slot}) to user team: ${teamName}`);
                              } else {
                                teamNames[rosterId] = `Team ${slot + 1}`;
                                console.log(`⚠️ No team name found for user ${userId}, using fallback: Team ${slot + 1}`);
                              }
                            } else {
                              teamNames[rosterId] = `Team ${slot + 1}`;
                              console.log(`⚠️ Could not find user_id for slot ${slot}`);
                            }
                          } else {
                            // This is likely a CPU team in a mock draft
                            teamNames[rosterId] = `CPU Team ${slot + 1}`;
                            console.log(`🤖 Mapped roster ${rosterId} (slot ${slot}) to CPU team: CPU Team ${slot + 1}`);
                          }
                        } else {
                          teamNames[rosterId] = `Team ${rosterId}`;
                          console.log(`⚠️ No slot mapping found for roster ${rosterId}, using fallback: Team ${rosterId}`);
                        }
                      });
                      
                      console.log(`🏈 Successfully mapped roster IDs to league team names:`, teamNames);
                      return teamNames;
                    }
                  } else {
                    console.warn(`⚠️ Could not fetch league users: ${usersResponse.status}`);
                  }
                } else {
                  console.warn(`⚠️ Could not fetch league data: ${leagueResponse.status}`);
                }
              } catch (leagueError) {
                console.warn(`⚠️ Error fetching league data:`, leagueError.message);
              }
            } else {
              console.log(`🏈 No league ID found, this appears to be a mock draft`);
            }
            
            // Fallback: use draft slots for team names
            if (draftData.draft_order && draftData.slot_to_roster_id) {
              console.log(`🏈 Using draft slots for team naming`);
              
              const slotToRosterId = draftData.slot_to_roster_id;
              const rosterIdToSlot = {};
              
              // Create reverse mapping
              Object.entries(slotToRosterId).forEach(([slot, rosterId]) => {
                rosterIdToSlot[rosterId] = parseInt(slot);
              });
              
              // Check if this is a mock draft (fewer users than teams)
              const userCount = Object.keys(draftData.draft_order).length;
              const teamCount = Object.keys(draftData.slot_to_roster_id).length;
              
              if (userCount < teamCount) {
                console.log(`🏈 This appears to be a mock draft: ${userCount} users, ${teamCount} teams`);
                
                // For mock drafts, try to fetch user display names
                try {
                  const userIds = Object.keys(draftData.draft_order);
                  const userDetails = {};
                  
                  // Fetch user details for each user ID
                  for (const userId of userIds) {
                    try {
                      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${userId}`);
                      if (userResponse.ok) {
                        const userData = await userResponse.json();
                        userDetails[userId] = userData.display_name || userData.username || `User ${userId}`;
                        console.log(`🏈 Fetched user details for ${userId}: ${userDetails[userId]}`);
                      }
                    } catch (userError) {
                      console.warn(`⚠️ Could not fetch user details for ${userId}:`, userError.message);
                      userDetails[userId] = `User ${userId}`;
                    }
                  }
                  
                  // Assign team names based on slot order, using actual user names when available
                  rosterIds.forEach(rosterId => {
                    const slot = rosterIdToSlot[rosterId];
                    if (slot !== undefined) {
                      // Check if any user is assigned to this slot
                      const hasUser = Object.values(draftData.draft_order).includes(slot);
                      if (hasUser) {
                        // This is a user team - find the user ID for this slot
                        const userId = Object.keys(draftData.draft_order).find(key => draftData.draft_order[key] === slot);
                        if (userId && userDetails[userId]) {
                          teamNames[rosterId] = userDetails[userId];
                          // Also store the user ID for later use
                          teamNames[`${rosterId}_userId`] = userId;
                          console.log(`🏈 Mapped roster ${rosterId} (slot ${slot}) to user team: ${userDetails[userId]} (ID: ${userId})`);
                        } else {
                          teamNames[rosterId] = `Team ${slot}`;
                          console.log(`⚠️ Could not get user name for slot ${slot}, using fallback: Team ${slot}`);
                        }
                      } else {
                        // This is a CPU team
                        teamNames[rosterId] = `CPU Team ${slot}`;
                        console.log(`🤖 Mapped roster ${rosterId} (slot ${slot}) to CPU team: CPU Team ${slot}`);
                      }
                    } else {
                      teamNames[rosterId] = `Team ${rosterId}`;
                    }
                  });
                } catch (userFetchError) {
                  console.warn(`⚠️ Error fetching user details for mock draft:`, userFetchError.message);
                  
                  // Fallback to generic names if user fetch fails
                  rosterIds.forEach(rosterId => {
                    const slot = rosterIdToSlot[rosterId];
                    if (slot !== undefined) {
                      const hasUser = Object.values(draftData.draft_order).includes(slot);
                      if (hasUser) {
                        teamNames[rosterId] = `Team ${slot}`;
                      } else {
                        teamNames[rosterId] = `CPU Team ${slot}`;
                      }
                    } else {
                      teamNames[rosterId] = `Team ${rosterId}`;
                    }
                  });
                }
              } else {
                // Regular draft, assign sequential team names
                rosterIds.forEach(rosterId => {
                  const slot = rosterIdToSlot[rosterId];
                  if (slot !== undefined) {
                    teamNames[rosterId] = `Team ${slot + 1}`; // Slot 0 = Team 1, Slot 1 = Team 2, etc.
                  } else {
                    teamNames[rosterId] = `Team ${rosterId}`;
                  }
                });
              }
              
              console.log(`🏈 Mapped roster IDs to team names using draft slots:`, teamNames);
              return teamNames;
            }
          }
          
          // Final fallback: map roster IDs to sequential team names
          console.log(`🏈 Using final fallback team naming for roster IDs:`, rosterIds);
          rosterIds.forEach((rosterId, index) => {
            teamNames[rosterId] = `Team ${index + 1}`;
          });
          
        } catch (error) {
          console.warn('⚠️ Could not fetch team names:', error.message);
          // Fallback to generic names
          rosterIds.forEach((rosterId, index) => {
            teamNames[rosterId] = `Team ${index + 1}`;
          });
        }
        
        console.log(`🏈 Final team names mapping:`, teamNames);
        return teamNames;
    }

    async extractUserIdFromTeamName(teamName, draftId) {
        try {
            console.log(`🏈 extractUserIdFromTeamName called for team "${teamName}" in draft ${draftId}`);
            
            // Fetch draft data to get draft_order and slot_to_roster_id
            const draftResponse = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
            if (!draftResponse.ok) {
                console.warn(`⚠️ Could not fetch draft data for user ID extraction`);
                return null;
            }
            
            const draftData = await draftResponse.json();
            console.log(`🏈 Draft data received:`, {
                league_id: draftData.league_id,
                draft_order: draftData.draft_order,
                slot_to_roster_id: draftData.slot_to_roster_id
            });
            
            // If this is a league draft, try to get user ID from league users
            if (draftData.league_id) {
                try {
                    const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${draftData.league_id}/users`);
                    if (usersResponse.ok) {
                        const usersData = await usersResponse.json();
                        
                        // Find user by display name
                        const user = usersData.find(u => 
                            u.display_name === teamName || 
                            u.metadata?.team_name === teamName ||
                            u.display_name?.toLowerCase().includes(teamName.toLowerCase()) ||
                            teamName.toLowerCase().includes(u.display_name?.toLowerCase())
                        );
                        
                        if (user) {
                            console.log(`🏈 Found user ID for team "${teamName}": ${user.user_id}`);
                            return user.user_id;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Error fetching league users for user ID extraction:`, error.message);
                }
            }
            
            // For mock drafts (no league_id), use draft_order and slot_to_roster_id mapping
            if (draftData.draft_order && draftData.slot_to_roster_id) {
                console.log(`🏈 Mock draft detected, analyzing draft_order and slot mapping...`);
                
                // Create reverse mapping: slot -> user_id
                const slotToUserId = {};
                Object.entries(draftData.draft_order).forEach(([userId, slot]) => {
                    slotToUserId[slot] = userId;
                });
                
                console.log(`🏈 Slot to User ID mapping:`, slotToUserId);
                console.log(`🏈 Looking for team name: "${teamName}"`);
                
                // For generic team names like "Team 7", map to slots
                if (teamName.startsWith('Team ')) {
                    const teamNumber = parseInt(teamName.split(' ')[1]);
                    if (!isNaN(teamNumber)) {
                        console.log(`🏈 Parsed team number: ${teamNumber}`);
                        // Map team number to slot (team 7 = slot 7)
                        const slot = teamNumber;
                        const userId = slotToUserId[slot];
                        
                        if (userId) {
                            console.log(`🏈 Mapped "${teamName}" (team ${teamNumber}) to slot ${slot}, user ID: ${userId}`);
                            return userId;
                        } else {
                            console.log(`🏈 No user found for slot ${slot} in team "${teamName}"`);
                        }
                    }
                }
                
                // For CPU team names like "CPU Team 2", "CPU Team 3", etc.
                if (teamName.startsWith('CPU Team ')) {
                    const cpuNumber = parseInt(teamName.split(' ')[2]);
                    if (!isNaN(cpuNumber)) {
                        const slot = cpuNumber;
                        const userId = slotToUserId[slot];
                        
                        if (userId) {
                            console.log(`🏈 Mapped "${teamName}" (CPU ${cpuNumber}) to slot ${slot}, user ID: ${userId}`);
                            return userId;
                        } else {
                            console.log(`🏈 No user found for slot ${slot} in CPU team "${teamName}"`);
                        }
                    }
                }
            }
            
            console.warn(`⚠️ Could not extract user ID for team "${teamName}"`);
            return null;
            
        } catch (error) {
            console.warn(`⚠️ Error in extractUserIdFromTeamName:`, error.message);
            return null;
        }
    }

    async calculateOptimalLineupsForTeams(teams) {
        console.log('🔍 Calculating optimal lineups for all teams...');
        
        const teamsWithLineups = {};
        
        for (const [teamId, team] of Object.entries(teams)) {
            try {
                // Calculate optimal lineup for this team with proper league settings
                const optimalLineupResult = this.optimalLineupEngine.calculateOptimalLineup(
                    team.roster,
                    {
                        qb: 1,
                        rb: 2,
                        wr: 2,
                        te: 1,
                        flex: 1, // This ensures the FLEX position gets filled
                        def: 1,
                        k: 1,
                        superflex: false,
                        scoring: 'ppr'
                    }
                );
                
                // Calculate position grades for this team
                console.log(`🔍 Team data structure for ${teamId}:`, JSON.stringify({
                    roster: team.roster?.length || 0,
                    hasProjections: team.roster?.some(p => p.projectedPoints) || false,
                    samplePlayer: team.roster?.[0] || 'No players'
                }, null, 2));
                
                const positionGrades = this.positionGradeEngine.calculatePositionGrades(team, {
                    scoring: 'PPR',
                    rosterSpots: {
                        QB: 1,
                        RB: 2,
                        WR: 2,
                        TE: 1,
                        FLEX: 1,
                        K: 1,
                        DEF: 1,
                        BENCH: 7
                    }
                });
                
                console.log(`📊 Position grades calculated for team ${teamId}:`, JSON.stringify(positionGrades, null, 2));
                
                teamsWithLineups[teamId] = {
                    ...team,
                    optimalLineup: optimalLineupResult.optimalLineup,
                    optimalLineupPoints: optimalLineupResult.totalProjectedPoints,
                    benchPoints: optimalLineupResult.benchPoints,
                    lineupAnalysis: optimalLineupResult.analysis,
                    positionGrades: positionGrades,
                    // Keep the old totalProjectedPoints for backward compatibility
                    totalProjectedPoints: optimalLineupResult.totalProjectedPoints
                };
                
                console.log(`✅ Team ${teamId}: Optimal lineup = ${optimalLineupResult.totalProjectedPoints} points, Bench = ${optimalLineupResult.benchPoints} points`);
                console.log(`📊 Team ${teamId}: Overall Grade = ${positionGrades.overallGrade.grade} (${positionGrades.overallGrade.score}/100)`);
                
            } catch (error) {
                console.error(`❌ Failed to calculate optimal lineup for team ${teamId}:`, error);
                // Fallback to old method
                teamsWithLineups[teamId] = {
                    ...team,
                    optimalLineupPoints: team.totalProjectedPoints,
                    benchPoints: 0,
                    lineupAnalysis: { recommendations: [] },
                    positionGrades: {
                        overallGrade: { grade: 'N/A', score: 0 },
                        positionGrades: {},
                        recommendations: []
                    }
                };
            }
        }
        
        return teamsWithLineups;
    }

    analyzeDraftPerformance(teams) {
        console.log('🔍 Analyzing draft performance...');
        
        // Safety check: ensure teams parameter is valid
        if (!teams || typeof teams !== 'object' || Object.keys(teams).length === 0) {
            console.warn('⚠️ No teams provided to analyzeDraftPerformance, returning empty analysis');
            return {
                totalPicks: 0,
                totalTeams: 0,
                rounds: 0,
                teams: []
            };
        }
        
        const analysis = {
            totalPicks: 0,
            totalTeams: 0,
            rounds: 0,
            teams: []
        };

        for (const [teamId, team] of Object.entries(teams)) {
            analysis.totalPicks += team.optimalLineupPoints; // Use optimalLineupPoints
            analysis.totalTeams++;
            analysis.rounds = team.optimalLineupPoints; // Assuming optimalLineupPoints is the total points for a round
            
            // Calculate total roster points as optimal lineup + bench
            const totalRosterPoints = (team.optimalLineupPoints || 0) + (team.benchPoints || 0);
            
            // Calculate ADP values from the roster
            let totalAdpValue = 0;
            let validAdpPicks = 0;
            
            // Calculate VORP values from the roster
            let totalVorpScore = 0;
            let validVorpPicks = 0;
            
            if (team.roster && team.roster.length > 0) {
                team.roster.forEach(player => {
                    if (player.adpValue !== undefined && player.adpValue !== null) {
                        totalAdpValue += player.adpValue;
                        validAdpPicks++;
                    }
                    if (player.vorpScore !== undefined && player.vorpScore !== null) {
                        totalVorpScore += player.vorpScore;
                        validVorpPicks++;
                        console.log(`📊 Player ${player.playerName || player.name} has VORP: ${player.vorpScore}`);
                    } else {
                        console.log(`⚠️ Player ${player.playerName || player.name} has no VORP score`);
                    }
                });
            }
            
            const averageAdpValue = validAdpPicks > 0 ? totalAdpValue / validAdpPicks : 0;
            const averageVorpScore = validVorpPicks > 0 ? totalVorpScore / validVorpPicks : 0;
            
            console.log(`📊 Team ${teamId} VORP summary: total=${totalVorpScore}, valid=${validVorpPicks}, average=${averageVorpScore}`);
            
            analysis.teams.push({
                teamId: teamId,
                teamName: team.teamName,
                totalProjectedPoints: totalRosterPoints, // Fixed: optimal + bench
                totalAdpValue: totalAdpValue,
                averageAdpValue: averageAdpValue,
                totalVorpScore: totalVorpScore,
                averageVorpScore: averageVorpScore,
                validPicks: team.roster.length, // Assuming roster length is valid picks
                optimalLineup: team.optimalLineup,
                optimalLineupPoints: team.optimalLineupPoints,
                benchPoints: team.benchPoints,
                lineupAnalysis: team.lineupAnalysis,
                positionGrades: team.positionGrades || {
                    overallGrade: { grade: 'N/A', score: 0 },
                    positionGrades: {},
                    recommendations: []
                }
            });
        }

        console.log('🎉 Draft performance analysis complete!');
        return analysis;
    }

    findPlayerProjection(playerName) {
        if (!this.consolidatedData) return null;

        // Try to find player in consolidated data
        const playerData = this.findPlayerInConsolidatedData(playerName);
        if (playerData && playerData.projections) {
          console.log(`📊 Found projections for ${playerName}:`, Object.keys(playerData.projections));
          
          // Look for fantasy points in projections
          for (const pos of ['wr', 'rb', 'qb', 'te', 'k', 'dst']) {
            if (playerData.projections[pos] && playerData.projections[pos].fpts) {
              const fpts = parseFloat(playerData.projections[pos].fpts);
              console.log(`✅ Found ${pos.toUpperCase()} projection for ${playerName}: ${fpts} points`);
              return fpts;
            }
          }
          
          console.log(`⚠️  No fantasy points found in projections for ${playerName}`);
        } else {
          console.log(`⚠️  No projection data found for ${playerName}`);
        }

        return null;
    }

    findPlayerAdpValue(playerName) {
        if (!this.consolidatedData) return null;

        // Try to find player in consolidated data
        const playerData = this.findPlayerInConsolidatedData(playerName);
        if (playerData && playerData.adp_data && playerData.adp_data.ppr) {
          // The 2025 ADP is stored at the top level of the ppr object
          if (playerData.adp_data.ppr.avg_adp) {
            return parseFloat(playerData.adp_data.ppr.avg_adp);
          }
        }

        return null;
    }

    findPlayerVorpValue(playerName) {
        if (!this.vorpData) {
            console.log(`❌ VORP data not loaded for ${playerName}`);
            return null;
        }

        // Try to find player in VORP data
        const playerNameLower = playerName.toLowerCase();
        console.log(`🔍 Looking for VORP for: "${playerName}" (normalized: "${playerNameLower}")`);
        
        // First try exact match
        if (this.vorpData[playerNameLower]) {
            const vorpScore = this.vorpData[playerNameLower].vorpScore;
            console.log(`✅ Found VORP for ${playerName}: ${vorpScore}`);
            return vorpScore;
        }

        // Try variations with common suffixes
        const suffixVariations = [
            // Remove suffixes and try base name
            playerNameLower.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, ''),
            // Add Jr. suffix
            playerNameLower + ' jr',
            playerNameLower + ' jr.',
            // Add Sr. suffix
            playerNameLower + ' sr',
            playerNameLower + ' sr.',
            // Add III suffix
            playerNameLower + ' iii',
            // Add II suffix
            playerNameLower + ' ii',
            // Add IV suffix
            playerNameLower + ' iv',
            // Add V suffix
            playerNameLower + ' v'
        ];

        // Try each variation
        for (const variation of suffixVariations) {
            if (this.vorpData[variation]) {
                const vorpScore = this.vorpData[variation].vorpScore;
                console.log(`✅ Found VORP for ${playerName} via variation "${variation}": ${vorpScore}`);
                return vorpScore;
            }
        }

        // Try fuzzy matching for similar names
        const similarNames = Object.keys(this.vorpData).filter(vorpName => {
            // Check if names are similar (same base name, different suffixes)
            const baseName1 = playerNameLower.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '');
            const baseName2 = vorpName.replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '');
            
            if (baseName1 === baseName2) {
                console.log(`🔍 Fuzzy match: "${playerName}" -> "${vorpName}"`);
                return true;
            }
            
            // Check for partial matches
            if (vorpName.includes(baseName1) || baseName1.includes(vorpName)) {
                console.log(`🔍 Partial match: "${playerName}" -> "${vorpName}"`);
                return true;
            }
            
            return false;
        });

        if (similarNames.length > 0) {
            // Use the first similar name found
            const bestMatch = similarNames[0];
            const vorpScore = this.vorpData[bestMatch].vorpScore;
            console.log(`✅ Found VORP for ${playerName} via fuzzy match "${bestMatch}": ${vorpScore}`);
            return vorpScore;
        }

        console.log(`❌ No VORP found for ${playerName}`);
        return null;
    }

    // New method to calculate ADP value as (Draft Spot - ADP)
    calculateAdpValue(pickNumber, adp) {
        if (adp === null || adp === undefined || adp === 0) {
            return null;
        }
        return pickNumber - adp;
    }

    findPlayerInConsolidatedData(playerName) {
        if (!this.consolidatedData || !this.nameLookupIndex) return null;

        // Normalize player name for lookup
        const normalizedName = playerName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        console.log(`🔍 Looking for player: "${playerName}" (normalized: "${normalizedName}")`);

        // Try exact match first
        if (this.nameLookupIndex[normalizedName]) {
          const exactMatches = this.nameLookupIndex[normalizedName];
          console.log(`✅ Found exact match in lookup index: ${exactMatches.length} matches`);
          for (const match of exactMatches) {
            if (this.consolidatedData[match]) {
              console.log(`✅ Found player data for: ${match}`);
              return this.consolidatedData[match];
            }
          }
        }

        // Try fuzzy match with improved logic
        for (const [lookupName, matches] of Object.entries(this.nameLookupIndex)) {
          // Check if names are similar (handle Jr., Sr., III variations)
          if (this.namesAreSimilar(normalizedName, lookupName)) {
            console.log(`🔍 Fuzzy match: "${playerName}" -> "${lookupName}"`);
            for (const match of matches) {
              if (this.consolidatedData[match]) {
                console.log(`✅ Found player data via fuzzy match: ${match}`);
                return this.consolidatedData[match];
              }
            }
          }
        }

        console.log(`❌ No player data found for: ${playerName}`);
        return null;
    }

    namesAreSimilar(name1, name2) {
        // Remove common suffixes for comparison
        const cleanName1 = name1.replace(/\b(jr|sr|ii|iii|iv)\b/g, '').trim();
        const cleanName2 = name2.replace(/\b(jr|sr|ii|iii|iv)\b/g, '').trim();
        
        // Check if one name contains the other (after cleaning)
        if (cleanName1.includes(cleanName2) || cleanName2.includes(cleanName1)) {
            return true;
        }
        
        // Check if names are very similar (handle minor variations)
        const words1 = cleanName1.split(' ');
        const words2 = cleanName2.split(' ');
        
        // If both names have the same number of words, check if most words match
        if (words1.length === words2.length && words1.length > 1) {
            let matchingWords = 0;
            for (let i = 0; i < words1.length; i++) {
                if (words1[i] === words2[i] || 
                    words1[i].includes(words2[i]) || 
                    words2[i].includes(words1[i])) {
                    matchingWords++;
                }
            }
            // If 80% of words match, consider them similar
            return (matchingWords / words1.length) >= 0.8;
        }
        
        return false;
    }

    calculateRankings(teams) {
        // Safety check: ensure teams parameter is valid
        if (!teams || typeof teams !== 'object' || Object.keys(teams).length === 0) {
            console.warn('⚠️ No teams provided to calculateRankings, returning empty rankings');
            return {
                byProjectedPoints: [],
                byAdpValue: [],
                final: []
            };
        }
        
        // Convert to array for sorting
        const teamsArray = Object.values(teams);

        // Rank by projected points
        const pointsRanking = [...teamsArray].sort((a, b) =>
          b.totalProjectedPoints - a.totalProjectedPoints
        );

        // Rank by ADP value (lower ADP = better)
        const adpRanking = [...teamsArray].sort((a, b) =>
          a.averageAdpValue - b.averageAdpValue
        );

        // Calculate combined score
        teamsArray.forEach(team => {
          const pointsRank = pointsRanking.findIndex(t => t.teamId === team.teamId) + 1;
          const adpRank = adpRanking.findIndex(t => t.teamId === team.teamId) + 1;

          // Combined score: lower is better (1st place = 1 point, 2nd place = 2 points, etc.)
          team.combinedScore = pointsRank + adpRank;
          team.pointsRank = pointsRank;
          team.adpRank = adpRank;
        });

        // Final ranking by combined score
        const finalRanking = [...teamsArray].sort((a, b) =>
          a.combinedScore - b.combinedScore
        );

        return {
          byProjectedPoints: pointsRanking.map((team, index) => ({
            rank: index + 1,
            teamId: team.teamId,
            projectedPoints: team.totalProjectedPoints
          })),
          byAdpValue: adpRanking.map((team, index) => ({
            rank: index + 1,
            teamId: team.teamId,
            averageAdp: team.averageAdpValue
          })),
          final: finalRanking.map((team, index) => ({
            rank: index + 1,
            teamId: team.teamId,
            combinedScore: team.combinedScore,
            projectedPoints: team.totalProjectedPoints,
            averageAdp: team.averageAdpValue
          }))
        };
    }
}

export default DraftAnalyzer; 