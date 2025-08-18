import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testDataSource() {
    try {
        console.log('🔍 Testing data source...');
        
        // Load consolidated player data
        const masterPlayersPath = join(__dirname, '..', 'data', 'consolidated', 'master-players.json');
        
        if (!fs.existsSync(masterPlayersPath)) {
            console.error('❌ Master players file not found');
            return;
        }
        
        const masterPlayersData = JSON.parse(fs.readFileSync(masterPlayersPath, 'utf8'));
        console.log(`✅ Loaded ${masterPlayersData.players?.length || 0} players from consolidated data`);
        
        // Test a few specific players
        const testPlayers = ['Christian McCaffrey', 'Ja\'Marr Chase', 'Tyreek Hill'];
        
        testPlayers.forEach(playerName => {
            console.log(`\n🔍 Testing player: ${playerName}`);
            
            // Find player in data
            const player = masterPlayersData.players?.find(p => 
                p.full_name === playerName || p.player_id === playerName.toLowerCase()
            );
            
            if (player) {
                console.log(`✅ Found player: ${player.full_name}`);
                console.log(`   Team: ${player.team}`);
                console.log(`   Position: ${player.position}`);
                
                if (player.projections) {
                    console.log(`   Projections:`, Object.keys(player.projections));
                    
                    // Check for fantasy points
                    Object.entries(player.projections).forEach(([pos, data]) => {
                        if (data.fpts) {
                            console.log(`   ${pos.toUpperCase()} FPTS: ${data.fpts}`);
                        }
                    });
                }
                
                if (player.adp_data?.ppr?.avg_adp) {
                    console.log(`   PPR ADP: ${player.adp_data.ppr.avg_adp}`);
                }
            } else {
                console.log(`❌ Player not found: ${playerName}`);
            }
        });
        
        // Check if there are any other projection sources
        console.log('\n🔍 Checking for other projection sources...');
        
        const dataDir = join(__dirname, '..', 'data');
        const files = fs.readdirSync(dataDir);
        
        files.forEach(file => {
            if (file.includes('projection') || file.includes('fantasy')) {
                console.log(`   Found: ${file}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error testing data source:', error);
    }
}

testDataSource(); 