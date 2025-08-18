import fetch from 'node-fetch';

async function testConsolidatedEndpoints() {
  console.log('🧪 Testing Consolidated Draft Analysis Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  const testDraftUrl = 'https://sleeper.com/draft/nfl/1258294914731487232';
  
  try {
    // Test 1: Full consolidated analysis
    console.log('📊 Test 1: Full Consolidated Analysis');
    const fullAnalysisResponse = await fetch(`${baseUrl}/api/analyze-draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftUrl: testDraftUrl,
        source: 'fantasypros',
        format: 'standard',
        evaluationMode: 'consolidated'
      })
    });
    
    if (fullAnalysisResponse.ok) {
      const fullAnalysis = await fullAnalysisResponse.json();
      console.log('✅ Full analysis successful');
      console.log(`   - Draft ID: ${fullAnalysis.data.draft_id}`);
      console.log(`   - Teams analyzed: ${Object.keys(fullAnalysis.data.teams).length}`);
      console.log(`   - Has consolidated view: ${!!fullAnalysis.data.consolidated_view}`);
      console.log(`   - Summary message: ${fullAnalysis.data.summary?.message}`);
      
      // Show first team's consolidated metrics
      const firstTeam = Object.values(fullAnalysis.data.teams)[0];
      if (firstTeam) {
        console.log(`   - First team (${firstTeam.team_name}):`);
        console.log(`     * Overall Grade: ${firstTeam.draft_grade}`);
        console.log(`     * ADP Grade: ${firstTeam.adp_grade}`);
        console.log(`     * Projection Grade: ${firstTeam.projection_grade}`);
        console.log(`     * Consolidated Score: ${firstTeam.consolidated_score}`);
        console.log(`     * Total Projected Points: ${firstTeam.total_projection?.toFixed(0)}`);
        console.log(`     * Avg ADP Value: ${firstTeam.average_pick_value?.toFixed(2)}`);
      }
    } else {
      console.log('❌ Full analysis failed:', fullAnalysisResponse.status);
    }
    
    console.log('\n📊 Test 2: Quick Draft Summary');
    const summaryResponse = await fetch(`${baseUrl}/api/draft-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draftUrl: testDraftUrl,
        source: 'fantasypros',
        format: 'standard'
      })
    });
    
    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      console.log('✅ Summary successful');
      console.log(`   - Message: ${summary.message}`);
      console.log(`   - Teams in summary: ${summary.data.teams_summary.length}`);
      console.log(`   - Best team: ${summary.data.overall_stats.best_team}`);
      console.log(`   - Average consolidated score: ${summary.data.overall_stats.average_consolidated_score}`);
      
      // Show first team summary
      const firstTeamSummary = summary.data.teams_summary[0];
      if (firstTeamSummary) {
        console.log(`   - First team summary (${firstTeamSummary.team_name}):`);
        console.log(`     * Grade: ${firstTeamSummary.grade}`);
        console.log(`     * Consolidated Score: ${firstTeamSummary.consolidated_score}`);
        console.log(`     * Key metrics:`, firstTeamSummary.key_metrics);
      }
    } else {
      console.log('❌ Summary failed:', summaryResponse.status);
    }
    
    console.log('\n✅ All endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testConsolidatedEndpoints(); 