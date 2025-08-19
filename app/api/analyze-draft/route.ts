export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
// Removed path and fs usage in favor of JSON imports bundled by Next.js

// Draft Analyzer class converted for Next.js
class DraftAnalyzer {
    private consolidatedData: any = {};
    private nameLookupIndex: any = {};
    private playerDetails: any = {};
    private vorpData: any = {};

    async initialize() {
        try {
            console.log('🚀 Initializing Draft Analyzer...');
            
            // Load consolidated player data via imports so Vercel bundles them
            const [masterPlayersModule, nameLookupModule, vorpDataModule] = await Promise.all([
                import('data/consolidated/master-players.json'),
                import('data/consolidated/name-lookup-index.json'),
                import('data/consolidated/player-vorp-scores.json')
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
            this.vorpData = (vorpDataModule as any).default.vorpScores;

            console.log(`✅ Draft Analyzer initialized with ${Object.keys(this.consolidatedData).length} players.`);
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
        const player = this.consolidatedData[playerName.toLowerCase()];
        const adp = player?.adp_data?.ppr?.["2025"]?.avg_adp;
        return adp ? parseFloat(adp) : 0;
    }

    private getPlayerVorp(playerName: string) {
        const entry = Array.isArray(this.vorpData)
            ? this.vorpData.find((p: any) => p.playerName?.toLowerCase() === playerName.toLowerCase())
            : undefined;
        return entry?.vorp_score ? parseFloat(entry.vorp_score) : 0;
    }

    async analyzeDraft(draftUrl: string) {
        await this.initialize();

        const draftId = this.parseSleeperDraftUrl(draftUrl);
        console.log(`Analyzing draft ID: ${draftId}`);

        const draftData = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}`);
        console.log('Draft data keys:', Object.keys(draftData));

        const draftPicks: any[] = await this.fetchSleeperApi(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
        console.log('Draft picks count:', draftPicks?.length || 0);

        // Mock drafts expose slot_to_roster_id mapping
        const slotToRosterId = draftData.slot_to_roster_id as { [slot: string]: number };
        if (!slotToRosterId) {
            throw new Error('No slot_to_roster_id found in draft data - this may not be a mock draft');
        }

        // Fetch the entire Sleeper players map once
        const playersMap: any = await this.fetchSleeperApi(`https://api.sleeper.app/v1/players/nfl`);
        const getSleeperPlayer = (id: string) => playersMap?.[id];

        const draftInfo = {
            name: draftData.metadata?.name || `Draft ${draftId}`,
            teams: Object.keys(slotToRosterId).length,
            rounds: draftData.settings?.rounds || 0,
            totalPicks: draftPicks?.length || 0,
        };

        // Initialize teams keyed by roster_id
        const teams: { [rosterId: number]: any } = {};
        Object.entries(slotToRosterId).forEach(([slot, rosterId]) => {
            teams[rosterId] = {
                teamId: rosterId,
                ownerName: `Team ${rosterId}`,
                draftSlot: parseInt(slot, 10),
                players: [] as any[],
                totalProjectedPoints: 0,
                totalAdpValue: 0,
                totalVorpScore: 0,
            };
        });

        console.log(`Processing ${draftPicks?.length || 0} picks...`);

        for (const pick of draftPicks || []) {
            try {
                const sleeperPlayer = getSleeperPlayer(String(pick.player_id));
                if (!sleeperPlayer) {
                    // Skip unknown player IDs
                    continue;
                }
                const playerName: string = sleeperPlayer.full_name || `${sleeperPlayer.first_name || ''} ${sleeperPlayer.last_name || ''}`.trim();
                const position: string = sleeperPlayer.position || pick.metadata?.position || '';

                const projectedPoints = this.getPlayerProjectedPoints(playerName, position);
                const adpValue = this.getPlayerAdp(playerName);
                const vorpScore = this.getPlayerVorp(playerName);

                const player = {
                    ...pick,
                    metadata: sleeperPlayer,
                    playerName,
                    position,
                    projectedPoints,
                    adpValue,
                    vorpScore,
                };

                const targetRosterId = slotToRosterId[String(pick.draft_slot)];
                if (targetRosterId && teams[targetRosterId]) {
                    teams[targetRosterId].players.push(player);
                    teams[targetRosterId].totalProjectedPoints += projectedPoints;
                    teams[targetRosterId].totalAdpValue += adpValue;
                    teams[targetRosterId].totalVorpScore += vorpScore;
                }
            } catch (err) {
                console.error('Error processing pick:', err);
            }
        }

        const analysisTeams = Object.values(teams).map((team: any) => {
            const count = team.players.length || 0;
            team.averageProjectedPoints = count > 0 ? team.totalProjectedPoints / count : 0;
            team.averageAdpValue = count > 0 ? team.totalAdpValue / count : 0;
            team.averageVorpScore = count > 0 ? team.totalVorpScore / count : 0;
            return team;
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