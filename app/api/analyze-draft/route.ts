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

        // SMART USERNAME DETECTION - Don't rely on failing endpoints
        console.log('🧠 Using smart username detection...');
        console.log('🔍 Draft type:', draftData.type);
        console.log('🔍 Draft status:', draftData.status);
        console.log('🔍 Draft metadata keys:', Object.keys(draftData.metadata || {}));
        console.log('🔍 Draft settings keys:', Object.keys(draftData.settings || {}));
        
        // Method 1: Check if this is a mock draft with user info in picks
        if (draftData.type === 'mock' || draftData.status === 'complete') {
            console.log('🔍 This appears to be a mock draft, extracting usernames from picks...');
            
            // Look through all draft picks for user metadata
            for (const pick of draftPicks || []) {
                if (pick.metadata && Object.keys(pick.metadata).length > 0) {
                    const slotKey = String(pick.draft_slot);
                    
                    console.log(`🔍 Pick ${pick.draft_slot} metadata:`, pick.metadata);
                    
                    // Check for any user identifier in metadata
                    const potentialUsername = pick.metadata.user_id || 
                                           pick.metadata.username || 
                                           pick.metadata.display_name ||
                                           pick.metadata.name ||
                                           pick.metadata.user;
                    
                    if (potentialUsername && !slotToName[slotKey]) {
                        slotToName[slotKey] = potentialUsername;
                        console.log(`✅ Found username for slot ${slotKey}: ${potentialUsername}`);
                    }
                }
            }
        }
        
        // Method 2: Check draft metadata for user order
        if (Object.keys(slotToName).length === 0 && draftData.metadata?.draft_order) {
            console.log('🔍 Checking draft metadata for user order...');
            const draftOrder = draftData.metadata.draft_order;
            console.log('🔍 Draft order from metadata:', draftOrder);
            
            if (Array.isArray(draftOrder)) {
                draftOrder.forEach((name: string, index: number) => {
                    if (name && typeof name === 'string' && name.trim()) {
                        const slotKey = String(index);
                        slotToName[slotKey] = name.trim();
                        console.log(`✅ Metadata mapped slot ${slotKey} to: ${name.trim()}`);
                    }
                });
            }
        }
        
        // Method 3: Check if there are team names in metadata
        if (Object.keys(slotToName).length === 0 && draftData.metadata?.team_names) {
            console.log('🔍 Checking for team names in metadata...');
            const teamNames = draftData.metadata.team_names;
            console.log('🔍 Team names from metadata:', teamNames);
            
            if (Array.isArray(teamNames)) {
                teamNames.forEach((name: string, index: number) => {
                    if (name && typeof name === 'string' && name.trim()) {
                        const slotKey = String(index);
                        slotToName[slotKey] = name.trim();
                        console.log(`✅ Team names mapped slot ${slotKey} to: ${name.trim()}`);
                    }
                });
            }
        }
        
        // Method 4: Try to extract from draft settings
        if (Object.keys(slotToName).length === 0 && draftData.settings) {
            console.log('🔍 Checking draft settings for user info...');
            
            // Look for any field that might contain user information
            const settingsKeys = Object.keys(draftData.settings);
            for (const key of settingsKeys) {
                const value = draftData.settings[key];
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                    console.log(`🔍 Found potential user array in settings.${key}:`, value);
                    
                    // If this looks like a user list, map it to slots
                    if (value.length === Object.keys(slotToRosterId).length) {
                        value.forEach((name: string, index: number) => {
                            if (name && typeof name === 'string' && name.trim()) {
                                const slotKey = String(index);
                                slotToName[slotKey] = name.trim();
                                console.log(`✅ Settings mapped slot ${slotKey} to: ${name.trim()}`);
                            }
                        });
                        break;
                    }
                }
            }
        }
        
        // Method 5: Check for any other metadata fields that might contain usernames
        if (Object.keys(slotToName).length === 0 && draftData.metadata) {
            console.log('🔍 Checking all metadata fields for potential usernames...');
            
            for (const [key, value] of Object.entries(draftData.metadata)) {
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                    console.log(`🔍 Found array in metadata.${key}:`, value);
                    
                    // Check if this array has the right length and contains username-like strings
                    if (value.length === Object.keys(slotToRosterId).length) {
                        const looksLikeUsernames = value.every(v => 
                            typeof v === 'string' && v.trim().length > 0 && 
                            (v.includes('@') || v.length > 3) // Username-like characteristics
                        );
                        
                        if (looksLikeUsernames) {
                            value.forEach((name: string, index: number) => {
                                const slotKey = String(index);
                                slotToName[slotKey] = name.trim();
                                console.log(`✅ Metadata.${key} mapped slot ${slotKey} to: ${name.trim()}`);
                            });
                            break;
                        }
                    }
                }
            }
        }
        
        // Method 6: Check if there are any other fields that might contain usernames
        if (Object.keys(slotToName).length === 0) {
            console.log('🔍 Checking for any other potential username sources...');
            
            // Check if there are any fields in the draft data that might contain usernames
            const allFields = Object.keys(draftData);
            for (const field of allFields) {
                const value = draftData[field];
                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                    console.log(`🔍 Found array in draft.${field}:`, value);
                    
                    // If this array has the right length, it might be usernames
                    if (value.length === Object.keys(slotToRosterId).length) {
                        value.forEach((name: string, index: number) => {
                            if (name && typeof name === 'string' && name.trim()) {
                                const slotKey = String(index);
                                slotToName[slotKey] = name.trim();
                                console.log(`✅ Draft.${field} mapped slot ${slotKey} to: ${name.trim()}`);
                            }
                        });
                        break;
                    }
                }
            }
        }
        
        // Method 7: Generate mock usernames if nothing else works
        if (Object.keys(slotToName).length === 0) {
            console.log('🔍 No usernames found, generating mock usernames...');
            
            // Create mock usernames based on draft slot
            Object.keys(slotToRosterId).forEach((slot) => {
                const slotNum = parseInt(slot, 10);
                slotToName[slot] = `DraftSlot${slotNum + 1}`;
                console.log(`🎭 Generated mock username for slot ${slot}: DraftSlot${slotNum + 1}`);
            });
        }
        
        console.log('🔍 Final slot to name mapping:', slotToName);
        console.log('🔍 Slot to roster mapping:', slotToRosterId);
        
        // Summary of username detection results
        console.log('📊 USERNAME DETECTION SUMMARY:');
        console.log(`   Total slots: ${Object.keys(slotToRosterId).length}`);
        console.log(`   Slots with names: ${Object.keys(slotToName).length}`);
        console.log(`   Slots without names: ${Object.keys(slotToRosterId).length - Object.keys(slotToName).length}`);
        
        if (Object.keys(slotToName).length === 0) {
            console.log('❌ NO USERNAMES FOUND - All strategies failed');
            console.log('🔍 This suggests this may be a mock draft without user information');
        } else {
            console.log('✅ Usernames found:');
            Object.entries(slotToName).forEach(([slot, name]) => {
                console.log(`   Slot ${slot}: ${name}`);
            });
        }

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

            // Debug defense players specifically
            if (position?.toLowerCase() === 'def' || position?.toLowerCase() === 'defense') {
                console.log(`🛡️ Processing DEFENSE player: ${playerName} at position: ${position}`);
            }

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

        // First calculate optimal lineups for all teams
        const analysisTeams = Object.entries(teams).map(([id, team]) => {
            const lineup = lineupEngine.calculateOptimalLineup(team.roster, { scoring: 'ppr' });
            
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
                totalProjectedPoints: lineup.totalProjectedPoints + lineup.benchPoints,
                averageProjectedPoints: team.roster.length > 0 ? (team.roster.reduce((s: number, p: any) => s + (p.projectedPoints || 0), 0) / team.roster.length) : 0,
                averageAdpValue: averageAdpValue,
                averageVorpScore: team.roster.length > 0 ? (team.roster.reduce((s: number, p: any) => s + (p.vorpScore || 0), 0) / team.roster.length) : 0,
                players: team.roster,
                roster: team.roster, // Add roster for grading engine
            };
        });

        // Now calculate position grades using the new system that considers all teams
        const gradedTeams = gradeEngine.calculatePositionGrades(analysisTeams, { scoring: 'ppr' });

        return {
            draftInfo,
            analysis: {
                teams: gradedTeams,
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