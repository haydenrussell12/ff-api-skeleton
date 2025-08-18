import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the 2025 PPR ADP CSV file
    const csvPath = path.join(process.cwd(), 'data', '2025', 'FantasyPros_2025_Overall_ADP_Rankings_PPR.csv');
    console.log('📁 Reading CSV from:', csvPath);
    
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    console.log('📄 CSV content length:', csvContent.length);
    
    // Parse CSV content
    const lines = csvContent.trim().split('\n');
    console.log('📊 Total lines in CSV:', lines.length);
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').replace(/\r/g, ''));
    console.log('📋 Headers:', headers);
    
    const players = lines.slice(1)
      .map((line, index) => {
        if (!line.trim()) {
          console.log(`⚠️ Line ${index + 1} is empty, skipping`);
          return null;
        }
        
        // Split by comma, but handle quoted values properly
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add the last value
        
        console.log(`🔍 Line ${index + 1} values count: ${values.length}, expected: ${headers.length}`);
        
        // Skip rows that don't have enough values
        if (values.length < headers.length) {
          console.log(`⚠️ Line ${index + 1} has ${values.length} values, expected ${headers.length}, skipping`);
          return null;
        }
        
        const player: any = {};
        headers.forEach((header, index) => {
          player[header] = values[index] || '';
        });
        
        // Only include players with valid data (must have Player, Team, POS, and AVG)
        if (!player.Player || !player.Team || !player.POS || !player.AVG) {
          console.log(`⚠️ Line ${index + 1} missing required fields:`, { Player: player.Player, Team: player.Team, POS: player.POS, AVG: player.AVG });
          return null;
        }
        
        // Clean up position format (remove numbers like "WR1" -> "WR")
        player.POS = player.POS.replace(/\d+$/, '');
        
        // Ensure numeric fields are properly parsed
        player.Rank = parseInt(player.Rank) || 0;
        player.AVG = parseFloat(player.AVG) || 0;
        player.Bye = parseInt(player.Bye) || 0;
        
        return player;
      })
      .filter(player => player !== null);

    console.log(`📊 ADP API: Loaded ${players.length} valid players from CSV`);
    if (players.length > 0) {
      console.log('📋 Sample player:', players[0]);
    }

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