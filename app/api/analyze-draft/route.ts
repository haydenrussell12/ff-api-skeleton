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

            // Create lookup by player name (case-insensitive)
            const masterPlayers = (masterPlayersModule as any).default.players;
            this.consolidatedData = {};
            
            masterPlayers.forEach((player: any) => {
                if (player.full_name) {
                    this.consolidatedData[player.full_name.toLowerCase()] = player;
                }
            });

            this.nameLookupIndex = (nameLookupModule as any).default;
            this.vorpData = (vorpDataModule as any).default.vorpScores || (vorpDataModule as any).default;
            
            // Create ADP lookup by player name
            this.adpData = {};
            const adpPlayers = (adpDataModule as any).default.players || [];
            adpPlayers.forEach((player: any) => {
                if (player.full_name) {
                    this.adpData[player.full_name.toLowerCase()] = player;
                }
            });

            console.log(`✅ Draft Analyzer initialized with ${Object.keys(this.consolidatedData).length} players and ${Object.keys(this.adpData).length} ADP records.`);
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
        
        // Try fuzzy matching by removing suffixes and checking partial matches
        const nameParts = normalizedName.split(' ');
        if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
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
        
        console.log(`❌ No match found for: ${playerName}`);
        return null;
    }

    private getPlayerProjectedPoints(playerName: string, position: string) {
        const player = this.findPlayerByName(playerName, position);
        if (!player || !player.projections) {
            return 0;
        }

        const posKey = position?.toLowerCase();
        let fpts = player.projections[posKey]?.fpts;
        
        // Handle defense projections - try different position keys
        if (!fpts && posKey === 'def') {
            fpts = player.projections['def']?.fpts || 
                   player.projections['DEF']?.fpts || 
                   player.projections['defense']?.fpts;
        }
        
        return fpts ? parseFloat(fpts) : 0;
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

    async analyzeDraft(draftUrl: string) {
        await this.initialize();

        const draftId = this.parseSleeperDraftUrl(draftUrl);
        console.log(`Analyzing draft ID: ${draftId}`);

        const draftData = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}`);
        const draftPicks: any[] = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
        
        // Log draft data to understand the draft type
        console.log('🔍 Draft data:', {
            id: draftData.id,
            type: draftData.type,
            status: draftData.status,
            metadata: draftData.metadata,
            settings: draftData.settings,
            league_id: draftData.league_id,
            slot_to_roster_id: draftData.slot_to_roster_id
        });
        
        // Try to fetch participants to get display names for each draft slot
        let participants: any[] = [];
        let slotToName: Record<string, string> = {};
        
        // Get slot to roster mapping first
        const slotToRosterId = draftData.slot_to_roster_id as { [slot: string]: number };
        if (!slotToRosterId) {
            throw new Error('No slot_to_roster_id found in draft data - this may not be a mock draft');
        }
        
        // Strategy 1: Try participants endpoint
        try {
            console.log('🔄 Strategy 1: Trying participants endpoint...');
            participants = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}/participants`);
            console.log('🔍 Participants data:', JSON.stringify(participants, null, 2));
            console.log('🔍 Participants count:', participants.length);
            
            // Map slot -> participant display name if available
            (participants || []).forEach((p: any) => {
                const slotKey = String(p?.slot ?? '');
                if (!slotKey) return;
                
                // Try multiple fields for username
                const name = p?.name || p?.display_name || p?.username || p?.user_name || p?.metadata?.name || p?.metadata?.display_name;
                
                if (name) {
                    slotToName[slotKey] = name;
                    console.log(`📝 Participants mapped slot ${slotKey} to name: ${name}`);
                } else {
                    console.log(`⚠️ No name found for slot ${slotKey}, participant data:`, p);
                }
            });
            
        } catch (e) {
            console.error('❌ Strategy 1 (participants) failed:', e);
        }
        
        // Strategy 2: Check if this is a league draft and try league users
        if (Object.keys(slotToName).length === 0 && draftData.league_id) {
            try {
                console.log('🔄 Strategy 2: Trying league users endpoint...');
                const leagueData = await this.fetchSleeperApi(`https://api.sleeper.app/v1/league/${draftData.league_id}/users`);
                console.log('🔍 League users data:', JSON.stringify(leagueData, null, 2));
                
                // Map roster IDs to user names from league
                if (Array.isArray(leagueData)) {
                    leagueData.forEach((user: any) => {
                        const rosterId = user?.roster_id;
                        if (rosterId !== undefined && rosterId !== null) {
                            const name = user?.display_name || user?.username || user?.name;
                            if (name) {
                                // Find which slot this roster corresponds to
                                Object.entries(slotToRosterId).forEach(([slot, rid]) => {
                                    if (rid === rosterId) {
                                        slotToName[slot] = name;
                                        console.log(`📝 League fallback mapped slot ${slot} (roster ${rosterId}) to name: ${name}`);
                                    }
                                });
                            }
                        }
                    });
                }
            } catch (leagueError) {
                console.error('❌ Strategy 2 (league users) failed:', leagueError);
            }
        }
        
        // Strategy 3: Check draft picks metadata for user info
        if (Object.keys(slotToName).length === 0) {
            try {
                console.log('🔄 Strategy 3: Checking draft picks metadata...');
                console.log('🔍 Draft picks data:', JSON.stringify(draftPicks?.slice(0, 3), null, 2)); // Log first 3 picks
                
                // Look for user info in draft picks
                for (const pick of draftPicks || []) {
                    if (pick.metadata?.user_id || pick.metadata?.username || pick.metadata?.display_name) {
                        const slotKey = String(pick.draft_slot);
                        const name = pick.metadata?.display_name || pick.metadata?.username || pick.metadata?.user_id;
                        if (name && !slotToName[slotKey]) {
                            slotToName[slotKey] = name;
                            console.log(`📝 Draft picks metadata mapped slot ${slotKey} to name: ${name}`);
                        }
                    }
                }
            } catch (metadataError) {
                console.error('❌ Strategy 3 (draft picks metadata) failed:', metadataError);
            }
        }
        
        // Strategy 4: Check draft metadata for draft order
        if (Object.keys(slotToName).length === 0 && draftData.metadata?.draft_order) {
            try {
                console.log('🔄 Strategy 4: Checking draft metadata...');
                const draftOrder = draftData.metadata.draft_order;
                console.log('🔍 Draft order from metadata:', draftOrder);
                
                if (Array.isArray(draftOrder)) {
                    draftOrder.forEach((name: string, index: number) => {
                        if (name && typeof name === 'string') {
                            const slotKey = String(index);
                            slotToName[slotKey] = name;
                            console.log(`📝 Metadata fallback mapped slot ${slotKey} to name: ${name}`);
                        }
                    });
                }
            } catch (metadataError) {
                console.error('❌ Strategy 4 (draft metadata) failed:', metadataError);
            }
        }
        
        // Strategy 5: Try to extract from draft settings or other fields
        if (Object.keys(slotToName).length === 0) {
            try {
                console.log('🔄 Strategy 5: Checking draft settings and other fields...');
                console.log('🔍 Full draft data structure:', Object.keys(draftData));
                console.log('🔍 Draft settings:', draftData.settings);
                console.log('🔍 Draft metadata keys:', Object.keys(draftData.metadata || {}));
                
                // Check if there are any other fields that might contain user info
                if (draftData.metadata?.draft_order_names) {
                    console.log('🔍 Found draft_order_names:', draftData.metadata.draft_order_names);
                }
                if (draftData.metadata?.team_names) {
                    console.log('🔍 Found team_names:', draftData.metadata.team_names);
                }
            } catch (error) {
                console.error('❌ Strategy 5 (draft exploration) failed:', error);
            }
        }
        
        console.log('🔍 Final slot to name mapping:', slotToName);
        console.log('🔍 Slot to roster mapping:', slotToRosterId);

        const playersMap: any = await this.fetchSleeperApi(`https://api.sleeper.app/v1/players/nfl`);
        const getSleeperPlayer = (id: string) => playersMap?.[id];

        const draftInfo = {
            name: draftData.metadata?.name || `Draft ${draftId}`,
            teams: Object.keys(slotToRosterId).length,
            rounds: draftData.settings?.rounds || 0,
            totalPicks: draftPicks?.length || 0,
        };

        const teams: { [rosterId: number]: any } = {};
        Object.entries(slotToRosterId).forEach(([slot, rosterId]) => {
            const teamName = slotToName[String(slot)] || `Team ${rosterId}`;
            teams[rosterId] = {
                teamId: rosterId,
                teamName: teamName,
                draftSlot: parseInt(slot, 10),
                roster: [] as any[],
            };
            console.log(`🏈 Created team ${rosterId} for slot ${slot} with name: "${teamName}"`);
        });

        for (const pick of draftPicks || []) {
            const sleeperPlayer = getSleeperPlayer(String(pick.player_id));
            if (!sleeperPlayer) continue;
            const playerName: string = sleeperPlayer.full_name || `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim();
            const position: string = sleeperPlayer.position || pick.metadata?.position || '';

            const projectedPoints = this.getPlayerProjectedPoints(playerName, position);
            const adpValue = this.getPlayerAdp(playerName);
            const vorpScore = this.getPlayerVorp(playerName);
            
            // Calculate draft value: negative means player was drafted above ADP (good value)
            const draftValue = adpValue > 0 ? (adpValue - pick.draft_slot) : 0;

            const player = {
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

            const targetRosterId = slotToRosterId[String(pick.draft_slot)];
            if (targetRosterId && teams[targetRosterId]) {
                teams[targetRosterId].roster.push(player);
            }
        }

        // Compute optimal lineups and grades
        const lineupEngine = new OptimalLineupEngine();
        const gradeEngine = new PositionGradeEngine(Array.isArray(this.vorpData) ? this.vorpData : []);

        const analysisTeams = Object.entries(teams).map(([id, team]) => {
            const lineup = lineupEngine.calculateOptimalLineup(team.roster, { scoring: 'ppr' });
            const grades = gradeEngine.calculatePositionGrades({ roster: team.roster });
            
            // Calculate average ADP
            const adpValues = team.roster.map((p: any) => p.adpValue || 0).filter((v: number) => v !== 0);
            const averageAdpValue = adpValues.length > 0 ? adpValues.reduce((s: number, v: number) => s + v, 0) / adpValues.length : 0;
            
            return {
                teamId: Number(id),
                teamName: team.teamName,
                draftSlot: team.draftSlot,
                optimalLineup: lineup.optimalLineup,
                optimalLineupPoints: lineup.totalProjectedPoints,
                benchPlayers: lineup.benchPlayers,
                benchPoints: lineup.benchPoints,
                lineupAnalysis: lineup.analysis,
                positionGrades: grades,
                totalProjectedPoints: lineup.totalProjectedPoints + lineup.benchPoints,
                averageProjectedPoints: team.roster.length > 0 ? (team.roster.reduce((s: number, p: any) => s + (p.projectedPoints || 0), 0) / team.roster.length) : 0,
                averageAdpValue: averageAdpValue,
                averageVorpScore: team.roster.length > 0 ? (team.roster.reduce((s: number, p: any) => s + (p.vorpScore || 0), 0) / team.roster.length) : 0,
                players: team.roster,
            };
        });

        return {
            draftInfo,
            analysis: {
                teams: analysisTeams,
            },
        };
    }
}

export async function POST(request: NextRequest) {
  try {
    const { draftUrl } = await request.json();
    if (!draftUrl) {
      return NextResponse.json(
        { success: false, error: 'Draft URL is required' },
        { status: 400 }
      );
    }
    console.log('🚀 Starting draft analysis for URL:', draftUrl);

    const analyzer = new DraftAnalyzer();
    const results = await analyzer.analyzeDraft(draftUrl);

    return NextResponse.json({
      success: true,
      message: 'Draft analysis completed successfully',
      draftUrl: draftUrl,
      status: 'completed',
      data: results
    });
  } catch (error) {
    console.error('❌ Draft analysis failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: `Draft analysis failed: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
} 