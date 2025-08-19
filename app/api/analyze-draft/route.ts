export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import OptimalLineupEngine from '../../lib/optimal-lineup-engine';
import PositionGradeEngine from '../../lib/position-grade-engine';

// Draft Analyzer class converted for Next.js
class DraftAnalyzer {
    private consolidatedData: any = {};
    private nameLookupIndex: any = {};
    private playerDetails: any = {};
    private vorpData: any = {};
    private adpData: any = {}; // Added adpData property

    async initialize() {
        try {
            console.log('🚀 Initializing Draft Analyzer...');
            
            // Load consolidated player data via imports so Vercel bundles them
            const [masterPlayersModule, nameLookupModule, vorpDataModule, adpDataModule] = await Promise.all([
                import('data/consolidated/master-players.json'),
                import('data/consolidated/name-lookup-index.json'),
                import('data/consolidated/player-vorp-scores.json'),
                import('../../../adp_data.json')
            ]);

            console.log('🔍 Loaded modules:', {
                masterPlayers: !!masterPlayersModule,
                nameLookup: !!nameLookupModule,
                vorpData: !!vorpDataModule,
                adpData: !!adpDataModule
            });

            // Create lookup by player name (case-insensitive)
            const masterPlayers = (masterPlayersModule as any).default.players;
            console.log('🔍 Master players structure:', {
                hasDefault: !!(masterPlayersModule as any).default,
                hasPlayers: !!masterPlayers,
                playerCount: masterPlayers?.length || 0,
                samplePlayer: masterPlayers?.[0]
            });
            
            this.consolidatedData = {};
            
            masterPlayers.forEach((player: any) => {
                if (player.full_name) {
                    // Store by both full_name and player_id for flexibility
                    this.consolidatedData[player.full_name.toLowerCase()] = player;
                    if (player.player_id) {
                        this.consolidatedData[player.player_id.toLowerCase()] = player;
                    }
                }
            });

            this.nameLookupIndex = (nameLookupModule as any).default;
            this.vorpData = (vorpDataModule as any).default.vorpScores || (vorpDataModule as any).default;
            
            // Create ADP lookup by player name - adp_data.json has players array
            this.adpData = {};
            const adpPlayers = (adpDataModule as any).default.players || [];
            console.log('🔍 ADP data structure:', {
                hasDefault: !!(adpDataModule as any).default,
                hasPlayers: !!adpPlayers,
                playerCount: adpPlayers?.length || 0,
                samplePlayer: adpPlayers?.[0]
            });
            
            adpPlayers.forEach((player: any) => {
                if (player.full_name) {
                    this.adpData[player.full_name.toLowerCase()] = player;
                }
            });

            console.log(`✅ Draft Analyzer initialized with ${Object.keys(this.consolidatedData).length} players and ${Object.keys(this.adpData).length} ADP records.`);
            console.log(`🔍 Sample consolidated players:`, Object.keys(this.consolidatedData).slice(0, 5));
            console.log(`🔍 Sample ADP players:`, Object.keys(this.adpData).slice(0, 5));
        } catch (error) {
            console.error('❌ Failed to initialize Draft Analyzer:', error);
            throw new Error('Failed to load necessary data for analysis.');
        }
    }

    private async fetchSleeperApi(url: string) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch from Sleeper API: ${response.statusText}`);
        }
        return response.json();
    }

    private parseSleeperDraftUrl(url: string) {
        // Support both sleeper.com and sleeper.app domains and alphanumeric draft IDs
        const regex = /sleeper\.(?:com|app)\/draft\/nfl\/([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        if (!match || !match[1]) {
            throw new Error('Invalid Sleeper mock draft URL format. Expected format: https://sleeper.app/draft/nfl/{draft_id}');
        }
        return match[1];
    }

    private normalizePlayerName(name: string): string {
        if (!name) return '';
        
        // Remove common suffixes and normalize
        return name
            .toLowerCase()
            .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v|vi|vii|viii|ix|x)\s*$/i, '') // Remove suffixes
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    private findPlayerByName(playerName: string, position: string) {
        if (!playerName) return null;
        
        const normalizedName = this.normalizePlayerName(playerName);
        console.log(`🔍 Looking for player: "${playerName}" -> normalized: "${normalizedName}"`);
        
        // First try exact match with normalized name
        let player = this.consolidatedData[normalizedName];
        if (player) {
            console.log(`✅ Found exact match: ${playerName}`);
            return player;
        }
        
        // Try exact match with original name (case-insensitive)
        player = this.consolidatedData[playerName.toLowerCase()];
        if (player) {
            console.log(`✅ Found exact match with original name: ${playerName}`);
            return player;
        }
        
        // Try fuzzy matching by removing suffixes and checking partial matches
        const nameParts = normalizedName.split(' ');
        if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            console.log(`🔍 Trying fuzzy match: firstName="${firstName}", lastName="${lastName}"`);
            
            // Look for players with matching first and last name
            for (const [key, data] of Object.entries(this.consolidatedData)) {
                const keyParts = key.split(' ');
                if (keyParts.length >= 2) {
                    const keyFirstName = keyParts[0];
                    const keyLastName = keyParts[keyParts.length - 1];
                    
                    if (keyFirstName === firstName && keyLastName === lastName) {
                        console.log(`✅ Found fuzzy match: "${playerName}" -> "${key}"`);
                        return data;
                    }
                }
            }
        }
        
        // Last resort: try to find any player whose name contains the search name
        for (const [key, data] of Object.entries(this.consolidatedData)) {
            if (key.includes(normalizedName) || normalizedName.includes(key)) {
                console.log(`✅ Found partial match: "${playerName}" -> "${key}"`);
                return data;
            }
        }
        
        console.log(`❌ No match found for: ${playerName}`);
        console.log(`🔍 Available players starting with similar names:`, 
            Object.keys(this.consolidatedData)
                .filter(k => k.includes(normalizedName.split(' ')[0]))
                .slice(0, 5)
        );
        return null;
    }

    private getPlayerProjectedPoints(playerName: string, position: string) {
        const player = this.findPlayerByName(playerName, position);
        if (!player || !player.projections) {
            console.log(`⚠️ No player or projections found for: ${playerName} (${position})`);
            return 0;
        }

        const posKey = position?.toLowerCase();
        console.log(`🔍 Looking for projections for ${playerName} at position: ${posKey}`);
        console.log(`🔍 Available projection keys:`, Object.keys(player.projections));
        
        let fpts = 0;
        
        // Handle defense projections - try multiple approaches
        if (posKey === 'def' || posKey === 'defense') {
            console.log(`🛡️ Processing DEFENSE player: ${playerName}`);
            
            // Method 1: Try exact position keys
            const defenseKeys = ['def', 'DEF', 'defense', 'Defense', 'DEFENSE'];
            for (const key of defenseKeys) {
                if (player.projections[key]?.fpts) {
                    fpts = player.projections[key].fpts;
                    console.log(`✅ Found defense projections using key: ${key} = ${fpts}`);
                    break;
                }
            }
            
            // Method 2: Try partial key matching
            if (!fpts) {
                for (const key of Object.keys(player.projections)) {
                    if (key.toLowerCase().includes('def')) {
                        fpts = player.projections[key].fpts;
                        console.log(`✅ Found defense projections using partial key: ${key} = ${fpts}`);
                        break;
                    }
                }
            }
            
            // Method 3: Look for any numeric projection value
            if (!fpts) {
                for (const key of Object.keys(player.projections)) {
                    const projection = player.projections[key];
                    if (projection && typeof projection === 'object' && projection.fpts) {
                        fpts = projection.fpts;
                        console.log(`✅ Found defense projections using generic key: ${key} = ${fpts}`);
                        break;
                    }
                }
            }
            
            // Method 4: Look for any numeric value in projections
            if (!fpts) {
                for (const key of Object.keys(player.projections)) {
                    const value = player.projections[key];
                    if (typeof value === 'number' && value > 0) {
                        fpts = value;
                        console.log(`✅ Found defense projections using numeric key: ${key} = ${fpts}`);
                        break;
                    }
                }
            }
            
            // Method 5: Check if projections is just a number (some defenses have this)
            if (!fpts && typeof player.projections === 'number' && player.projections > 0) {
                fpts = player.projections;
                console.log(`✅ Found defense projections as direct number: ${fpts}`);
            }
        } else {
            // Non-defense players - try standard approach
            fpts = player.projections[posKey]?.fpts;
        }
        
        if (fpts) {
            console.log(`✅ Projected points for ${playerName}: ${fpts}`);
            return typeof fpts === 'number' ? fpts : parseFloat(fpts);
        } else {
            console.log(`❌ No projected points found for ${playerName} at position ${posKey}`);
            console.log(`🔍 Player projections structure:`, player.projections);
            return 0;
        }
    }

    private getPlayerAdp(playerName: string) {
        const player = this.findPlayerByName(playerName, '');
        if (!player) return 0;
        
        // Try to find in ADP data with normalized name
        const normalizedName = this.normalizePlayerName(playerName);
        let adpPlayer = this.adpData[normalizedName];
        
        if (!adpPlayer) {
            // Try fuzzy matching for ADP too
            const nameParts = normalizedName.split(' ');
            if (nameParts.length >= 2) {
                const firstName = nameParts[0];
                const lastName = nameParts[nameParts.length - 1];
                
                for (const [key, data] of Object.entries(this.adpData)) {
                    const keyParts = key.split(' ');
                    if (keyParts.length >= 2) {
                        const keyFirstName = keyParts[0];
                        const keyLastName = keyParts[keyParts.length - 1];
                        
                        if (keyFirstName === firstName && keyLastName === lastName) {
                            adpPlayer = data;
                            break;
                        }
                    }
                }
            }
        }
        
        const adp = adpPlayer?.adp_value;
        return adp ? parseFloat(adp) : 0;
    }

    private getPlayerVorp(playerName: string) {
        const normalizedName = this.normalizePlayerName(playerName);
        if (!normalizedName) return 0;
        
        const direct = Array.isArray(this.vorpData)
            ? (this.vorpData as any[]).find((p: any) => {
                const pName = this.normalizePlayerName(p.playerName || '');
                return pName === normalizedName;
            })
            : undefined;
        return direct?.vorp_score || direct?.vorpScore ? parseFloat(direct.vorp_score || direct.vorpScore) : 0;
    }

    async analyzeDraft(draftUrl: string, leagueType: string = 'standard') {
        await this.initialize();
        
        console.log('🔍 Fetching draft data from Sleeper...');
        const draftId = this.parseSleeperDraftUrl(draftUrl);
        
        // Fetch draft data
        const draftData = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}`);
        const draftPicks = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
        
        console.log('📊 Draft data fetched:', {
            draftName: draftData.name,
            teams: draftData.teams?.length || 0,
            rounds: draftData.settings?.rounds || 0,
            picks: draftPicks?.length || 0
        });
        
        // Process draft picks and build team rosters
        const teams = await this.buildTeamRosters(draftData, draftPicks);
        
        // Calculate optimal lineups and grades
        const result = this.analyzeTeams(teams, leagueType);
        
        return {
            draftInfo: {
                name: draftData.name,
                teams: draftData.teams?.length || 0,
                rounds: draftData.settings?.rounds || 0,
                totalPicks: draftPicks?.length || 0
            },
            ...result
        };
    }

    private analyzeTeams(teams: any, leagueType: string = 'standard') {
        const lineupEngine = new OptimalLineupEngine();
        const gradeEngine = new PositionGradeEngine();
        
        // First calculate optimal lineups for all teams
        const analysisTeams = Object.entries(teams).map(([id, team]: [string, any]) => {
            const lineup = lineupEngine.calculateOptimalLineup(team.roster, { 
                leagueType, 
                scoring: 'ppr',
                teams: Object.keys(teams).length
            });
            
            // Calculate average ADP
            const adpValues = team.roster.map((p: any) => p.adpValue || 0).filter((v: number) => v !== 0);
            const averageAdpValue = adpValues.length > 0 ? adpValues.reduce((s: number, v: number) => s + v, 0) / adpValues.length : 0;
            
            // Calculate average VORP
            const vorpValues = team.roster.map((p: any) => p.vorpScore || 0).filter((v: number) => v !== 0);
            const averageVorpScore = vorpValues.length > 0 ? vorpValues.reduce((s: number, v: number) => s + v, 0) / vorpValues.length : 0;
            
            // Calculate optimal lineup points
            const optimalLineupPoints = lineupEngine.calculateTotalProjectedPoints(lineup);
            
            // Get bench players and points
            const benchPlayers = lineupEngine.getBenchPlayers(team.roster, lineup);
            const benchPoints = lineupEngine.calculateTotalProjectedPoints(benchPlayers);
            
            // Get lineup analysis
            const lineupAnalysis = lineupEngine.analyzeLineup(lineup, { 
                leagueType, 
                scoring: 'ppr',
                teams: Object.keys(teams).length
            });
            
            return {
                teamId: id,
                teamName: team.teamName,
                draftSlot: team.draftSlot,
                roster: team.roster,
                optimalLineup: lineup,
                optimalLineupPoints,
                benchPlayers,
                benchPoints,
                totalProjectedPoints: optimalLineupPoints + benchPoints,
                averageAdpValue,
                averageVorpScore,
                lineupAnalysis
            };
        });

        // Now calculate position grades using the new system that considers all teams
        const gradedTeams = gradeEngine.calculatePositionGrades(analysisTeams, { 
            leagueType, 
            scoring: 'ppr',
            teams: Object.keys(teams).length
        });

        // Map the graded teams back to the expected format for the frontend
        const finalTeams = gradedTeams.map(gradedTeam => {
            // Find the original analysis team data
            const originalTeam = analysisTeams.find(t => t.teamId === gradedTeam.teamId);
            
            return {
                teamId: gradedTeam.teamId,
                teamName: gradedTeam.teamName,
                draftSlot: originalTeam?.draftSlot || 0,
                optimalLineup: originalTeam?.optimalLineup || {},
                optimalLineupPoints: originalTeam?.optimalLineupPoints || 0,
                benchPlayers: originalTeam?.benchPlayers || [],
                benchPoints: originalTeam?.benchPoints || 0,
                positionGrades: gradedTeam.positionGrades || {},
                overallGrade: gradedTeam.overallGrade || { grade: '—', score: 0 },
                totalProjectedPoints: (originalTeam?.optimalLineupPoints || 0) + (originalTeam?.benchPoints || 0),
                averageProjectedPoints: (() => {
                    if (!originalTeam?.roster?.length) return 0;
                    return originalTeam.roster.reduce((sum: number, p: any) => sum + (p.projectedPoints || 0), 0) / originalTeam.roster.length;
                })(),
                averageAdpValue: originalTeam?.averageAdpValue || 0,
                averageVorpScore: originalTeam?.averageVorpScore || 0,
                players: originalTeam?.roster || [],
                roster: originalTeam?.roster || []
            };
        });

        return {
            analysis: {
                teams: finalTeams,
            },
        };
    }

    private async buildTeamRosters(draftData: any, draftPicks: any) {
        const slotToRosterId = draftData.slot_to_roster_id as { [slot: string]: number };
        if (!slotToRosterId) {
            throw new Error('No slot_to_roster_id found in draft data - this may not be a mock draft');
        }

        const slotToName: Record<string, string> = {};
        
        // SMART USERNAME DETECTION - Don't rely on failing endpoints
        if (draftData.metadata?.draft_order_by_roster_id) {
            // Use metadata if available
            Object.entries(draftData.metadata.draft_order_by_roster_id).forEach(([rosterId, slot]: [string, any]) => {
                slotToName[slot] = `Team ${parseInt(rosterId) + 1}`;
            });
        } else {
            // Fallback to slot numbers
            Object.keys(slotToRosterId).forEach(slot => {
                slotToName[slot] = `Team ${parseInt(slot) + 1}`;
            });
        }

        // Fetch NFL players data
        const playersMap: any = await this.fetchSleeperApi(`https://api.sleeper.app/v1/players/nfl`);
        const getSleeperPlayer = (id: string) => playersMap?.[id];

        const teams: { [rosterId: number]: any } = {};

        // Process each pick and build team rosters
        draftPicks.forEach((pick: any) => {
            const slot = pick.pick_no.toString();
            const rosterId = slotToRosterId[slot];
            
            if (!rosterId) {
                console.warn(`No roster ID found for slot ${slot}`);
                return;
            }

            if (!teams[rosterId]) {
                teams[rosterId] = {
                    teamId: rosterId,
                    teamName: slotToName[slot] || `Team ${rosterId}`,
                    draftSlot: parseInt(slot),
                    roster: []
                };
            }

            // Get player data
            const sleeperPlayer = getSleeperPlayer(pick.player_id);
            if (!sleeperPlayer) {
                console.warn(`No player data found for ID ${pick.player_id}`);
                return;
            }

            // Enhance player data with projections and VORP
            const enhancedPlayer = this.enhancePlayerData(sleeperPlayer, pick);
            teams[rosterId].roster.push(enhancedPlayer);
        });

        return teams;
    }

    private enhancePlayerData(sleeperPlayer: any, pick: any) {
        const playerName: string = sleeperPlayer.full_name || `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim();
        const position: string = sleeperPlayer.position || pick.metadata?.position || '';

        const projectedPoints = this.getPlayerProjectedPoints(playerName, position);
        const adpValue = this.getPlayerAdp(playerName);
        const vorpScore = this.getPlayerVorp(playerName);
        
        // Calculate draft value: negative means player was drafted above ADP (good value)
        const draftValue = adpValue > 0 ? (adpValue - pick.draft_slot) : 0;

        return {
            ...pick,
            metadata: sleeperPlayer,
            playerName,
            position,
            projectedPoints,
            adpValue,
            vorpScore,
            draftValue,
            playerId: pick.player_id,
        };
    }
}

export async function POST(request: Request) {
    try {
        const { draftUrl, leagueType = 'standard' } = await request.json();
        
        if (!draftUrl) {
            return NextResponse.json({ success: false, error: 'Draft URL is required' });
        }

        console.log('🚀 Starting draft analysis...');
        console.log('🔍 Draft URL:', draftUrl);
        console.log('🏈 League Type:', leagueType);

        const analyzer = new DraftAnalyzer();
        await analyzer.initialize();
        
        const result = await analyzer.analyzeDraft(draftUrl, leagueType);
        
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error('❌ Error in draft analysis:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
    }
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
} 