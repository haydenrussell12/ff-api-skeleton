import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the 2025 PPR ADP CSV file
    const csvPath = path.join(process.cwd(), 'data', '2025', 'FantasyPros_2025_Overall_ADP_Rankings_PPR.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV content
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    
    const players = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, ''));
      const player: any = {};
      
      headers.forEach((header, index) => {
        player[header] = values[index] || '';
      });
      
      return player;
    });

    return NextResponse.json({
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    console.error('Error reading ADP data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load ADP data' },
      { status: 500 }
    );
  }
} 