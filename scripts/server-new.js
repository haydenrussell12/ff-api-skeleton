import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import DraftAnalyzer from './draft-analyzer-new.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Initialize draft analyzer
const draftAnalyzer = new DraftAnalyzer();
let analyzerInitialized = false;

// Initialize the analyzer
async function initializeAnalyzer() {
    try {
        await draftAnalyzer.initialize();
        analyzerInitialized = true;
        console.log('✅ Draft Analyzer initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Draft Analyzer:', error);
        analyzerInitialized = false;
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        analyzerInitialized: analyzerInitialized
    });
});

// Draft analyzer endpoint
app.post('/api/analyze-draft', async (req, res) => {
    try {
        if (!analyzerInitialized) {
            return res.status(500).json({
                success: false,
                error: 'Draft analyzer not initialized'
            });
        }

        const { draftUrl } = req.body;
        
        if (!draftUrl) {
            return res.status(400).json({
                success: false,
                error: 'Draft URL is required'
            });
        }

        console.log('🚀 Starting draft analysis for:', draftUrl);
        
        const result = await draftAnalyzer.analyzeDraft(draftUrl);
        
        console.log('✅ Draft analysis completed successfully');
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('❌ Draft analysis failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve the draft analyzer page
app.get('/draft-analyzer', (req, res) => {
    res.sendFile(join(__dirname, '../public/draft-analyzer-new.html'));
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Fantasy Football API server running on http://localhost:${PORT}`);
    console.log('📊 API endpoints:');
    console.log(`   POST /api/analyze-draft - Analyze draft and calculate optimal lineups`);
    console.log(`   GET /draft-analyzer - Draft analyzer page`);
    console.log(`   GET /health - Health check`);
    
    // Initialize the analyzer after server starts
    await initializeAnalyzer();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Server shutting down gracefully...');
    process.exit(0);
}); 