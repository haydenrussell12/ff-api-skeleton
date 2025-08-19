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

    private getPlayerProjectedPoints(playerName: string, position: string) {
        const player = this.consolidatedData[playerName.toLowerCase()];
        if (!player || !player.projections) {
            return 0;
        }

        const posKey = position?.toLowerCase();
        const fpts = player.projections[posKey]?.fpts;
        return fpts ? parseFloat(fpts) : 0;
    }

    private getPlayerAdp(playerName: string) {
        const player = this.adpData[playerName.toLowerCase()];
        const adp = player?.adp_value;
        return adp ? parseFloat(adp) : 0;
    }

    private getPlayerVorp(playerName: string) {
        const key = playerName?.toLowerCase();
        if (!key) return 0;
        const direct = Array.isArray(this.vorpData)
            ? (this.vorpData as any[]).find((p: any) => (p.playerName || '').toLowerCase() === key)
            : undefined;
        return direct?.vorp_score || direct?.vorpScore ? parseFloat(direct.vorp_score || direct.vorpScore) : 0;
    }

    async analyzeDraft(draftUrl: string) {
        await this.initialize();

        const draftId = this.parseSleeperDraftUrl(draftUrl);
        console.log(`Analyzing draft ID: ${draftId}`);

        const draftData = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}`);
        const draftPicks: any[] = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
        // Try to fetch participants to get display names for each draft slot
        let participants: any[] = [];
        try {
            participants = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}/participants`);
            console.log('🔍 Participants data:', JSON.stringify(participants, null, 2));
            console.log('🔍 Participants count:', participants.length);
            
            // Log each participant's data structure
            participants.forEach((p, idx) => {
                console.log(`🔍 Participant ${idx}:`, {
                    slot: p?.slot,
                    name: p?.name,
                    display_name: p?.display_name,
                    username: p?.username,
                    user_name: p?.user_name,
                    metadata: p?.metadata
                });
            });
        } catch (e) {
            console.warn('Could not fetch participants; will fall back to generic team names');
        }

        const slotToRosterId = draftData.slot_to_roster_id as { [slot: string]: number };
        if (!slotToRosterId) {
            throw new Error('No slot_to_roster_id found in draft data - this may not be a mock draft');
        }

        const playersMap: any = await this.fetchSleeperApi(`https://api.sleeper.app/v1/players/nfl`);
        const getSleeperPlayer = (id: string) => playersMap?.[id];

        // Map slot -> participant display name if available
        const slotToName: Record<string, string> = {};
        (participants || []).forEach((p: any) => {
            const slotKey = String(p?.slot ?? '');
            if (!slotKey) return;
            const name = p?.name || p?.display_name || p?.username || p?.user_name;
            if (name) {
                slotToName[slotKey] = name;
                console.log(`📝 Mapped slot ${slotKey} to name: ${name}`);
            }
        });
        console.log('🔍 Final slot to name mapping:', slotToName);

        const draftInfo = {
            name: draftData.metadata?.name || `Draft ${draftId}`,
            teams: Object.keys(slotToRosterId).length,
            rounds: draftData.settings?.rounds || 0,
            totalPicks: draftPicks?.length || 0,
        };

        const teams: { [rosterId: number]: any } = {};
        Object.entries(slotToRosterId).forEach(([slot, rosterId]) => {
            teams[rosterId] = {
                teamId: rosterId,
                teamName: slotToName[String(slot)] || `Team ${rosterId}`,
                draftSlot: parseInt(slot, 10),
                roster: [] as any[],
            };
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