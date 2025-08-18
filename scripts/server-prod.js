import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import DraftAnalyzer from './draft-analyzer-new.js';
import PositionGradeEngine from './position-grade-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Validate Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables. Check your Vercel environment variables.');
  console.error('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  process.exit(1);
}

console.log('✅ Supabase environment variables validated successfully');
console.log('🚀 Starting Fantasy Football API server...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('📁 Working directory:', __dirname);
console.log('🔑 Supabase URL length:', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 'MISSING');
console.log('🔑 Supabase Key length:', process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 'MISSING');
console.log('🚀 Vercel deployment debug - server-prod.js loaded successfully');

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Method validation middleware
const validateMethod = (allowedMethods) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return res.status(405).json({
        error: 'Method Not Allowed',
        allowed: allowedMethods,
        received: req.method,
        path: req.path
      });
    }
    next();
  };
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      url: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      key: process.env.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
    }
  });
});

// Debug routes endpoint
app.get('/api/_debug/routes', (req, res) => {
  const routes = [
    {
      path: '/health',
      method: 'GET',
      description: 'Health check endpoint'
    },
    {
      path: '/api/analyze-draft',
      method: 'POST',
      description: 'Analyze Sleeper draft performance'
    },
    {
      path: '/api/cheat-sheet',
      method: 'GET',
      description: 'Get pre-draft cheat sheet data'
    },
    {
      path: '/api/_debug/routes',
      method: 'GET',
      description: 'List all available API routes'
    }
  ];
  
  res.json({
    routes,
    total: routes.length,
    timestamp: new Date().toISOString()
  });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/draft-analyzer', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'draft-analyzer-new.html'));
});

app.get('/cheat-sheet', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'pre-draft-cheat-sheet.html'));
});

// API Routes
app.post('/api/analyze-draft', validateMethod(['POST']), async (req, res) => {
  try {
    const { draftUrl, source = 'fantasypros', format = 'standard', evaluationMode = 'projections' } = req.body;
    
    if (!draftUrl) {
      return res.status(400).json({ success: false, error: 'Draft URL is required' });
    }

    console.log('🚀 Starting draft analysis...');
    console.log('📋 Input:', { draftUrl, source, format, evaluationMode });

    const analyzer = new DraftAnalyzer();
    await analyzer.initialize();
    
    const analysis = await analyzer.analyzeDraft(draftUrl, source, format, evaluationMode);
    
    if (!analysis) {
      return res.status(500).json({ success: false, error: 'Draft analysis failed' });
    }

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing draft:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cheat Sheet API endpoint
app.get('/api/cheat-sheet', validateMethod(['GET']), async (req, res) => {
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
    } else {
      return res.status(500).json({
        success: false,
        error: 'Master players data not available'
      });
    }

    const players = [];
    const positionVorpScores = {
      QB: [], RB: [], WR: [], TE: [], K: [], DEF: []
    };

    // Iterate through VORP data to build player list and collect VORP scores by position
    if (vorpData.vorpScores && typeof vorpData.vorpScores === 'object') {
      Object.values(vorpData.vorpScores).forEach(player => {
        if (player.playerName && player.position && player.vorpScore !== undefined) {
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
            if (masterPlayer.projections && masterPlayer.projections[player.position.toLowerCase()] && masterPlayer.projections[player.position.toLowerCase()].fpts) {
              projectedPoints = parseFloat(masterPlayer.projections[player.position.toLowerCase()].fpts);
            } else if (masterPlayer.projection_data && masterPlayer.projection_data.points) {
              projectedPoints = masterPlayer.projection_data.points;
            }
            
            // Extract ADP
            if (masterPlayer.adp_data && masterPlayer.adp_data.ppr && masterPlayer.adp_data.ppr.rank) {
              adp = masterPlayer.adp_data.ppr.rank;
            } else if (masterPlayer.adp_data && masterPlayer.adp_data.standard && masterPlayer.adp_data.standard.rank) {
              adp = masterPlayer.adp_data.standard.rank;
            }
            if (masterPlayer.team) {
                team = masterPlayer.team;
            }
          }

          players.push({
            playerName: player.playerName,
            position: player.position,
            team: team,
            vorpScore: player.vorpScore,
            projectedPoints: projectedPoints,
            adp: adp,
            normalizedVorp: player.normalizedVorp // Use pre-calculated normalized VORP
          });

          if (positionVorpScores[player.position]) {
            positionVorpScores[player.position].push(player.vorpScore);
          }
        }
      });
    }

    res.json({ success: true, players: players, count: players.length });

  } catch (error) {
    console.error('Error fetching cheat sheet data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback route for any unmatched API calls
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      '/health',
      '/api/analyze-draft',
      '/api/cheat-sheet',
      '/api/_debug/routes',
      '/draft-analyzer',
      '/cheat-sheet'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Start server (only if not on Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Fantasy Football API server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   POST /api/analyze-draft - Analyze draft performance`);
    console.log(`   GET /api/cheat-sheet - Get player cheat sheet data`);
    console.log(`   GET /health - Health check`);
  });
}

// Export for Vercel
export default app; 