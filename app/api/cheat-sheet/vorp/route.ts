import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the VORP scores JSON file
    const vorpPath = path.join(process.cwd(), 'data', 'consolidated', 'player-vorp-scores.json');
    const vorpContent = await fs.readFile(vorpPath, 'utf-8');
    const vorpData = JSON.parse(vorpContent);
    
    // Extract player data from the VORP file
    const players: Array<{
      name: string;
      position: string;
      vorp: number;
      points: number;
    }> = [];
    
    // Add top players from each position
    Object.entries(vorpData.positionStats).forEach(([position, stats]: [string, any]) => {
      if (stats.topPlayers && Array.isArray(stats.topPlayers)) {
        stats.topPlayers.forEach((player: any) => {
          players.push({
            name: player.name,
            position: position,
            vorp: player.vorp,
            points: player.points
          });
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    console.error('Error reading VORP data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load VORP data' },
      { status: 500 }
    );
  }
} 