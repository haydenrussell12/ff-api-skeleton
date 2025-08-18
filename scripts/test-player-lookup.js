import { promises as fs } from 'fs';

async function testPlayerLookup() {
  try {
    // Load consolidated data
    const consolidatedData = await fs.readFile('data/consolidated/master-players.json', 'utf8');
    const parsedData = JSON.parse(consolidatedData);
    
    // The data structure has metadata and players array
    const consolidatedDataObj = {};
    if (parsedData.players && Array.isArray(parsedData.players)) {
      // Convert array to object with player_id as key for faster lookup
      parsedData.players.forEach(player => {
        if (player.player_id) {
          consolidatedDataObj[player.player_id] = player;
        }
      });
    }

    // Load name lookup index
    const nameLookupIndex = await fs.readFile('data/consolidated/name-lookup-index.json', 'utf8');
    const nameLookupIndexObj = JSON.parse(nameLookupIndex);

    console.log(`✅ Loaded ${Object.keys(consolidatedDataObj).length} consolidated player records`);
    console.log(`✅ Loaded ${Object.keys(nameLookupIndexObj).length} name lookup entries`);

    // Test player lookup
    const testPlayer = "baltimore ravens"; // Test with a defensive team
    const normalizedName = testPlayer.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    
    console.log(`\n🔍 Testing player lookup for: "${testPlayer}"`);
    console.log(`🔍 Normalized name: "${normalizedName}"`);

    // Check if player exists in lookup index
    if (nameLookupIndexObj[normalizedName]) {
      const exactMatches = nameLookupIndexObj[normalizedName];
      console.log(`✅ Found exact match in lookup index: ${exactMatches.length} matches`);
      
      for (const match of exactMatches) {
        console.log(`🔍 Looking for match: "${match}"`);
        if (consolidatedDataObj[match]) {
          console.log(`✅ Found player data for: ${match}`);
          
          // Check for projections
          if (consolidatedDataObj[match].projections) {
            console.log(`📊 Projections found:`, consolidatedDataObj[match].projections);
            for (const pos of ['wr', 'rb', 'qb', 'te', 'k', 'dst']) {
              if (consolidatedDataObj[match].projections[pos] && consolidatedDataObj[match].projections[pos].fpts) {
                console.log(`🎯 Fantasy points for ${pos}: ${consolidatedDataObj[match].projections[pos].fpts}`);
              }
            }
          } else {
            console.log(`❌ No projections found`);
          }

          // Check for ADP data
          if (consolidatedDataObj[match].adp_data) {
            console.log(`📈 ADP data found:`, consolidatedDataObj[match].adp_data);
            if (consolidatedDataObj[match].adp_data.ppr && consolidatedDataObj[match].adp_data.ppr['2025']) {
              console.log(`🎯 2025 PPR ADP: ${consolidatedDataObj[match].adp_data.ppr['2025'].avg_adp}`);
            } else {
              console.log(`❌ No 2025 PPR ADP found`);
            }
          } else {
            console.log(`❌ No ADP data found`);
          }

          return;
        } else {
          console.log(`❌ No player data found for match: ${match}`);
        }
      }
    } else {
      console.log(`❌ No exact match found in lookup index`);
      
      // Try fuzzy match
      for (const [lookupName, matches] of Object.entries(nameLookupIndexObj)) {
        if (lookupName.includes(normalizedName) || normalizedName.includes(lookupName)) {
          console.log(`🔍 Fuzzy match: "${testPlayer}" -> "${lookupName}"`);
          // ... handle fuzzy match
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPlayerLookup(); 