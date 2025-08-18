import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import DraftAnalyzer from './draft-analyzer-new.js';
import LeagueConnector from './league-connector.js';
import AIHelper from './ai-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// API Routes
app.get('/api/rankings', async (req, res) => {
  try {
    const { source = 'ecr', format = 'standard', limit = 100 } = req.query;
    
    const { data, error } = await supabase
      .from('ranking_values')
      .select(`
        rank,
        tier,
        projection_pts,
        players!inner (
          full_name,
          position,
          team_code
        ),
        rankings_snapshots!inner (
          source,
          format,
          snapshot_date
        )
      `)
      .eq('rankings_snapshots.source', source)
      .eq('rankings_snapshots.format', format)
      .order('rank')
      .limit(parseInt(limit));

    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rankings'
    });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const { position, team, limit = 100 } = req.query;
    
    let query = supabase
      .from('players')
      .select('*')
      .order('full_name')
      .limit(parseInt(limit));
    
    if (position) query = query.eq('position', position);
    if (team) query = query.eq('team_code', team);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players'
    });
  }
});

app.get('/api/snapshots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rankings_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch snapshots'
    });
  }
});

// Draft Analysis Endpoint
app.post('/api/analyze-draft', async (req, res) => {
  try {
    const { draftUrl, source = 'ecr', format = 'standard', evaluationMode = 'consolidated' } = req.body;
    if (!draftUrl) {
      return res.status(400).json({
        success: false,
        error: 'Draft URL is required'
      });
    }
    
    // Validate evaluation mode - now includes 'consolidated' as the default
    const validModes = ['adp', 'projections', 'combo', 'consolidated'];
    if (!validModes.includes(evaluationMode)) {
      return res.status(400).json({
        success: false,
        error: `Invalid evaluation mode. Must be one of: ${validModes.join(', ')}`
      });
    }
    
    const analyzer = new DraftAnalyzer();
    await analyzer.initialize();
    const analysis = await analyzer.analyzeDraft(draftUrl);
    
    console.log('🔍 Server received analysis:', JSON.stringify({
        teamsCount: Object.keys(analysis.teams || {}).length,
        sampleTeam: Object.values(analysis.teams || {})[0] ? {
            teamId: Object.values(analysis.teams || {})[0].teamId,
            hasPositionGrades: !!Object.values(analysis.teams || {})[0].positionGrades,
            positionGradesKeys: Object.values(analysis.teams || {})[0].positionGrades ? Object.keys(Object.values(analysis.teams || {})[0].positionGrades) : 'N/A'
        } : 'No teams'
    }, null, 2));
    
    // Create a simplified summary focused on key metrics
    if (analysis.consolidated_view) {
      analysis.summary = {
        message: "🎯 Consolidated Draft Analysis Complete!",
        explanation: "This analysis shows both ADP-based draft value AND projected fantasy points for each team.",
        key_metrics: {
          adp_value: "How well you drafted vs. ADP (positive = good value, negative = reached)",
          projected_points: "Total fantasy points your roster is projected to score",
          consolidated_score: "Overall grade combining both metrics (0-100 scale)"
        }
      };
    }
    
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Error analyzing draft:', error);
    res.status(500).json({ success: false, error: `Draft analysis failed: ${error.message}` });
  }
});

// Get available projection sources and formats
app.get('/api/projection-sources', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rankings_snapshots')
      .select('source, format, snapshot_date')
      .order('snapshot_date', { ascending: false });
    
    if (error) throw error;
    
    // Group by source and format
    const sources = {};
    data.forEach(item => {
      if (!sources[item.source]) {
        sources[item.source] = new Set();
      }
      sources[item.source].add(item.format);
    });
    
    // Convert to array format
    const result = Object.entries(sources).map(([source, formats]) => ({
      source,
      formats: Array.from(formats),
      latest_date: data.find(d => d.source === source)?.snapshot_date
    }));
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching projection sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projection sources'
    });
  }
});

// Quick Consolidated Draft Summary Endpoint
app.post('/api/draft-summary', async (req, res) => {
  try {
    const { draftUrl, source = 'fantasypros', format = 'standard' } = req.body;
    if (!draftUrl) {
      return res.status(400).json({
        success: false,
        error: 'Draft URL is required'
      });
    }
    
    const analyzer = new DraftAnalyzer();
    const analysis = await analyzer.analyzeDraft(draftUrl, source, format, 'consolidated');
    
    // Create a simplified summary focused on key metrics
    const summary = {
      draft_id: analysis.draftInfo?.name || 'N/A',
      draft_info: analysis.draftInfo || {},
      teams_summary: Object.values(analysis.teams || {}).map(team => ({
        team_name: team.teamName || `Team ${team.teamId}`,
        total_projected_points: team.totalProjectedPoints?.toFixed(0) || 'N/A',
        optimal_lineup_points: team.optimalLineupPoints?.toFixed(0) || 'N/A',
        bench_points: team.benchPoints?.toFixed(0) || 'N/A',
        average_adp_value: team.averageAdpValue?.toFixed(1) || 'N/A',
        average_vorp_score: team.averageVorpScore?.toFixed(1) || 'N/A',
        valid_picks: team.roster?.length || 0,
        position_grades: team.positionGrades || {
          overallGrade: { grade: 'N/A', score: 0 },
          positionGrades: {},
          recommendations: []
        }
      })),
      analysis_summary: {
        total_teams: analysis.draftInfo?.teams || 0,
        total_picks: analysis.draftInfo?.totalPicks || 0,
        rounds: analysis.draftInfo?.rounds || 0
      }
    };
    
    res.json({ 
      success: true, 
      data: summary,
      message: "🎯 Consolidated Draft Summary - Shows both ADP value and projected points!"
    });
    
  } catch (error) {
    console.error('Error generating draft summary:', error);
    res.status(500).json({ success: false, error: `Draft summary failed: ${error.message}` });
  }
});

// Test endpoint for name normalization
app.get('/api/test-names', (req, res) => {
  const testNames = [
    'Brian Thomas Jr.',
    'Brian Thomas Jr',
    'Marvin Harrison Jr.',
    'Marvin Harrison Jr',
    'John Smith III',
    'John Smith 3rd',
    'Mike Johnson Sr.',
    'Mike Johnson Sr'
  ];
  
  const analyzer = new DraftAnalyzer();
  const normalized = testNames.map(name => ({
    original: name,
    normalized: analyzer.normalizePlayerName(name)
  }));
  
  res.json({
    success: true,
    data: normalized
  });
});

// League management endpoints
app.post('/api/leagues/connect', async (req, res) => {
  try {
    const { leagueId, platform, season = 2024 } = req.body;
    
    if (!leagueId || !platform) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing leagueId or platform' 
      });
    }
    
    if (!['sleeper', 'espn'].includes(platform.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only Sleeper and ESPN platforms are supported currently' 
      });
    }
    
    const connector = new LeagueConnector();
    const leagueInfo = await connector.connectLeague(leagueId, platform, season);
    
    res.json({
      success: true,
      data: leagueInfo
    });
    
  } catch (error) {
    console.error('Error connecting to league:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/leagues/:leagueId/import-rosters', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { platform, season = 2024 } = req.body;
    
    if (!platform) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required for roster import'
      });
    }
    
    const connector = new LeagueConnector();
    const rosterInfo = await connector.importRosters(leagueId, platform, season);
    
    res.json({
      success: true,
      data: rosterInfo
    });
    
  } catch (error) {
    console.error('Error importing rosters:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/leagues/:leagueId/teams/:teamId/keepers', async (req, res) => {
  try {
    const { leagueId, teamId } = req.params;
    
    const connector = new LeagueConnector();
    const recommendations = await connector.getKeeperRecommendations(leagueId, teamId);
    
    res.json({
      success: true,
      data: recommendations
    });
    
  } catch (error) {
    console.error('Error getting keeper recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/leagues', async (req, res) => {
  try {
    const { data: leagues, error } = await supabase
      .from('leagues')
      .select(`
        *,
        league_members (count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: leagues
    });
    
  } catch (error) {
    console.error('Error fetching leagues:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/leagues/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    
    // Delete league members first (due to foreign key constraints)
    const { error: membersError } = await supabase
      .from('league_members')
      .delete()
      .eq('league_id', leagueId);
    
    if (membersError) throw membersError;
    
    // Delete league rosters
    const { error: rostersError } = await supabase
      .from('league_rosters')
      .delete()
      .eq('league_id', leagueId);
    
    if (rostersError) throw rostersError;
    
    // Delete the league
    const { error: leagueError } = await supabase
      .from('leagues')
      .delete()
      .eq('league_id', leagueId);
    
    if (leagueError) throw leagueError;
    
    res.json({
      success: true,
      message: 'League deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting league:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Helper endpoint
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, userId, leagueId } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }
    
    const aiHelper = new AIHelper();
    const result = await aiHelper.processQuestion(question, userId, leagueId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error processing AI question:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cheat Sheet API endpoint
app.get('/api/cheat-sheet', async (req, res) => {
  try {
    // Load VORP data
    const fs = await import('fs');
    const vorpDataPath = path.join(__dirname, '..', 'data', 'consolidated', 'player-vorp-scores.json');
    
    if (!fs.existsSync(vorpDataPath)) {
      return res.status(500).json({
        success: false,
        error: 'VORP data not available'
      });
    }

    const vorpData = JSON.parse(fs.readFileSync(vorpDataPath, 'utf8'));
    
    // Load master players data (contains projections and ADP)
    const masterPlayersPath = path.join(__dirname, '..', 'data', 'consolidated', 'master-players.json');
    let masterPlayers = {};
    
    if (fs.existsSync(masterPlayersPath)) {
      masterPlayers = JSON.parse(fs.readFileSync(masterPlayersPath, 'utf8'));
    }

    // Process VORP data and calculate normalized VORP
    const players = [];
    const positionStats = {};

    // First pass: calculate position statistics for normalization
    if (vorpData.vorpScores) {
      Object.values(vorpData.vorpScores).forEach(player => {
        if (player.position && player.vorpScore !== undefined) {
          if (!positionStats[player.position]) {
            positionStats[player.position] = { min: Infinity, max: -Infinity };
          }
          positionStats[player.position].min = Math.min(positionStats[player.position].min, player.vorpScore);
          positionStats[player.position].max = Math.max(positionStats[player.position].max, player.vorpScore);
        }
      });
    }

    // Second pass: create player objects with normalized VORP
    if (vorpData.vorpScores) {
      Object.values(vorpData.vorpScores).forEach(player => {
        if (player.playerName && player.position && player.vorpScore !== undefined) {
          // Use pre-calculated normalized VORP if available, otherwise calculate it
          let normalizedVorp = player.normalizedVorp;
          if (normalizedVorp === undefined || normalizedVorp === null) {
            // Fallback calculation if not pre-calculated
            if (positionStats[player.position] && 
                positionStats[player.position].max !== positionStats[player.position].min) {
              normalizedVorp = ((player.vorpScore - positionStats[player.position].min) / 
                               (positionStats[player.position].max - positionStats[player.position].min)) * 100;
            }
          }

          // Find player in master data for projections and ADP
          let projectedPoints = null;
          let adp = null;
          let team = player.team || 'N/A';

          // Search for player in master data (case-insensitive)
          const playerNameLower = player.playerName.toLowerCase();
          const masterPlayer = masterPlayers.players && masterPlayers.players.find(mp => 
            mp.full_name && mp.full_name.toLowerCase() === playerNameLower
          );

          if (masterPlayer) {
            // Extract projected points from the player data
            if (masterPlayer.projections && masterPlayer.projections.wr && masterPlayer.projections.wr.fpts) {
              projectedPoints = parseFloat(masterPlayer.projections.wr.fpts);
            } else if (masterPlayer.projections && masterPlayer.projections.rb && masterPlayer.projections.rb.fpts) {
              projectedPoints = parseFloat(masterPlayer.projections.rb.fpts);
            } else if (masterPlayer.projections && masterPlayer.projections.qb && masterPlayer.projections.qb.fpts) {
              projectedPoints = parseFloat(masterPlayer.projections.qb.fpts);
            } else if (masterPlayer.projections && masterPlayer.projections.te && masterPlayer.projections.te.fpts) {
              projectedPoints = parseFloat(masterPlayer.projections.te.fpts);
            } else if (masterPlayer.projections && masterPlayer.projections.k && masterPlayer.projections.k.fpts) {
              projectedPoints = parseFloat(masterPlayer.projections.k.fpts);
            } else if (masterPlayer.projections && masterPlayer.projections.dst && masterPlayer.projections.dst.fpts) {
              projectedPoints = parseFloat(masterPlayer.projections.dst.fpts);
            }
            
            // Extract ADP from the player data
            if (masterPlayer.adp_data && masterPlayer.adp_data.ppr && masterPlayer.adp_data.ppr.rank) {
              adp = masterPlayer.adp_data.ppr.rank;
            }
            
            team = masterPlayer.team || team;
          }

          players.push({
            playerName: player.playerName,
            position: player.position,
            team: team,
            projectedPoints: projectedPoints,
            vorpScore: player.vorpScore,
            normalizedVorp: normalizedVorp,
            adp: adp
          });
        }
      });
    }

    // Sort by normalized VORP (highest first) as default
    players.sort((a, b) => {
      if (a.normalizedVorp === null && b.normalizedVorp === null) return 0;
      if (a.normalizedVorp === null) return 1;
      if (b.normalizedVorp === null) return -1;
      return b.normalizedVorp - a.normalizedVorp;
    });

    res.json({
      success: true,
      players: players,
      count: players.length,
      positionStats: positionStats
    });

  } catch (error) {
    console.error('Error generating cheat sheet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cheat sheet'
    });
  }
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Serve the draft analyzer page
app.get('/draft-analyzer', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'draft-analyzer-new.html'));
});

// Serve the cheat sheet page
app.get('/cheat-sheet', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pre-draft-cheat-sheet.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Static file serving (must come after API routes)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Fantasy Football API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET /api/rankings - Get player rankings`);
  console.log(`   GET /api/players - Get player list`);
  console.log(`   GET /api/snapshots - Get ranking snapshots`);
  console.log(`   GET /health - Health check`);
}); 