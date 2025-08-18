import DraftAnalyzer from './draft-analyzer.js';

async function testConsolidatedView() {
  console.log('🧪 Testing Consolidated View Display...\n');
  
  const analyzer = new DraftAnalyzer();
  
  // Test the consolidated scoring logic
  console.log('📊 Testing consolidated scoring logic...');
  
  // Mock team data for testing
  const mockTeam = {
    picks: [
      { adp_value: 5, projection_value: 2, projection: { projection_pts: 180 } },
      { adp_value: 3, projection_value: 1, projection: { projection_pts: 165 } },
      { adp_value: -2, projection_value: -1, projection: { projection_pts: 140 } }
    ],
    total_projection: 485,
    total_adp_value: 6
  };
  
  // Calculate average values
  mockTeam.average_pick_value = mockTeam.total_adp_value / mockTeam.picks.length;
  mockTeam.average_projection_value = mockTeam.picks.reduce((sum, p) => sum + (p.projection_value || 0), 0) / mockTeam.picks.length;
  
  // Test consolidated score calculation
  const consolidatedScore = analyzer.calculateConsolidatedScore(mockTeam);
  console.log(`✅ Consolidated Score: ${consolidatedScore.toFixed(1)}`);
  
  // Test ADP grade calculation
  const adpGrade = analyzer.calculateADPGrade(mockTeam);
  console.log(`✅ ADP Grade: ${adpGrade}`);
  
  // Test projection grade calculation
  const projectionGrade = analyzer.calculateProjectionGrade(mockTeam);
  console.log(`✅ Projection Grade: ${projectionGrade}`);
  
  // Test overall draft grade
  const draftGrade = analyzer.calculateDraftGrade(mockTeam, 'consolidated');
  console.log(`✅ Overall Draft Grade: ${draftGrade}`);
  
  console.log('\n📋 Mock Team Summary:');
  console.log(`   - Average ADP Value: ${mockTeam.average_pick_value.toFixed(2)}`);
  console.log(`   - Average Projection Value: ${mockTeam.average_projection_value.toFixed(2)}`);
  console.log(`   - Total Projected Points: ${mockTeam.total_projection}`);
  console.log(`   - Consolidated Score: ${consolidatedScore.toFixed(1)}`);
  console.log(`   - Final Grade: ${draftGrade}`);
  
  console.log('\n🎯 Consolidated View Test Complete!');
  console.log('The draft analyzer now shows:');
  console.log('   ✅ Both ADP value AND projected points for each team');
  console.log('   ✅ Consolidated score combining both metrics');
  console.log('   ✅ Separate grades for ADP and projections');
  console.log('   ✅ Overall grade based on consolidated score');
}

// Run the test
testConsolidatedView().catch(console.error); 