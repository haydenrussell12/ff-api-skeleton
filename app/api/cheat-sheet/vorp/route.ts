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
    
    // Use the vorpScores array which contains all players
    if (vorpData.vorpScores && Array.isArray(vorpData.vorpScores)) {
      vorpData.vorpScores.forEach((player: any) => {
        players.push({
          name: player.playerName,
          position: player.position,
          vorp: player.vorpScore,
          points: player.projectedPoints
        });
      });
    }

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