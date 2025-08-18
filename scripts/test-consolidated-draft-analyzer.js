import DraftAnalyzer from './draft-analyzer.js';

async function testConsolidatedDraftAnalyzer() {
  console.log('🧪 Testing Consolidated Draft Analyzer...\n');
  
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
  
  console.log('Mock Team Data:');
  console.log(`  - Average ADP Value: ${mockTeam.average_pick_value.toFixed(2)}`);
  console.log(`  - Average Projection Value: ${mockTeam.average_projection_value.toFixed(2)}`);
  console.log(`  - Total Projected Points: ${mockTeam.total_projection}`);
  
  // Test consolidated score calculation
  const consolidatedScore = analyzer.calculateConsolidatedScore(mockTeam);
  console.log(`  - Consolidated Score: ${consolidatedScore}`);
  
  // Test individual grades
  const adpGrade = analyzer.calculateADPGrade(mockTeam);
  const projectionGrade = analyzer.calculateProjectionGrade(mockTeam);
  console.log(`  - ADP Grade: ${adpGrade}`);
  console.log(`  - Projection Grade: ${projectionGrade}`);
  
  // Test overall grade
  const overallGrade = analyzer.calculateDraftGrade(mockTeam, 'consolidated');
  console.log(`  - Overall Grade: ${overallGrade}`);
  
  console.log('\n✅ Consolidated Draft Analyzer test completed!');
}

// Run the test
testConsolidatedDraftAnalyzer().catch(console.error); 