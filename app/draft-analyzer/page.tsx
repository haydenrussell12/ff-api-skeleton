"use client";

import { useState } from 'react';

interface Team {
  teamId: string;
  teamName: string;
  totalProjectedPoints: number;
  totalAdpValue: number;
  averageAdpValue: number;
  totalVorpScore: number;
  averageVorpScore: number;
  optimalLineupPoints: number;
  benchPoints: number;
  players: any[];
  positionGrades: any;
  roster: any[];
}

interface AnalysisResults {
  teams: Team[];
  summary: any;
}

export default function DraftAnalyzerPage() {
  const [draftUrl, setDraftUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const analyzeDraft = async () => {
    if (!draftUrl.trim()) {
      setError('Please enter a draft URL');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setShowResults(false);

    try {
      const response = await fetch('/api/analyze-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ draftUrl: draftUrl.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setResults(result.data);
        setShowResults(true);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollToTeam = (teamId: string) => {
    const element = document.querySelector(`[data-team-id="${teamId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <a href="/" style={{ 
            display: 'inline-block', 
            padding: '10px 20px', 
            background: 'rgba(255,255,255,0.2)', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '5px', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ← Back to Home
          </a>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            🏈 Fantasy Football Draft Analyzer
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            OPTIMAL LINEUP EDITION - Calculate your best possible starting lineup!
          </p>
        </div>

        {/* Input Section */}
        <div style={{ padding: '30px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px', margin: '0 auto' }}>
            <input
              type="text"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="Enter Sleeper draft URL (e.g., https://sleeper.com/draft/nfl/1234567890)"
              style={{
                padding: '15px',
                border: '2px solid #e9ecef',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            <button
              onClick={analyzeDraft}
              disabled={isAnalyzing}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s ease',
                opacity: isAnalyzing ? 0.7 : 1
              }}
              onMouseEnter={(e) => !isAnalyzing && ((e.target as HTMLElement).style.transform = 'scale(1.02)')}
              onMouseLeave={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
            >
              {isAnalyzing ? '🔍 Analyzing Draft...' : '🚀 Analyze Draft & Calculate Optimal Lineups'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ padding: '20px', background: '#f8d7da', color: '#721c24', textAlign: 'center' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Section */}
        {showResults && results && (
          <div style={{ padding: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: '#667eea', marginBottom: '10px' }}>🎯 Optimal Lineup Analysis Complete!</h2>
              <p style={{ color: '#666' }}>See which team has the best starting lineup and get actionable insights!</p>
            </div>

            {/* Rankings Table */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ color: '#667eea', marginBottom: '20px' }}>🏆 Optimal Lineup Rankings (Starting Lineup Projections)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Rank</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Team</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Overall Roster Grade</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Optimal Lineup Points</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Bench Points</th>
                      <th style={{ padding: '15px', textAlign: 'left' }}>Total Roster Points</th>
                      <th style={{ padding: '15px', textAlign: 'left' }} title="(Draft Spot - ADP) - Positive = drafted later than ADP (better value), Negative = drafted earlier than ADP (worse value)">ADP Value</th>
                      <th style={{ padding: '15px', textAlign: 'left' }} title="Average VORP (Value Over Replacement Player) - Higher is better">Avg VORP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.teams || {})
                      .sort((a, b) => (b[1].optimalLineupPoints || 0) - (a[1].optimalLineupPoints || 0))
                      .map(([teamId, team], index) => (
                        <tr key={teamId} style={{ 
                          borderBottom: '1px solid #e9ecef',
                          background: index === 0 ? '#fff3cd' : index < 3 ? '#f8f9fa' : 'white'
                        }}>
                          <td style={{ padding: '15px', fontWeight: 'bold' }}>
                            {index + 1}{index === 0 ? ' 🏆' : index === 1 ? ' 🥈' : index === 2 ? ' 🥉' : ''}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span 
                              onClick={() => scrollToTeam(teamId)}
                              style={{ 
                                cursor: 'pointer', 
                                color: '#667eea',
                                textDecoration: 'underline'
                              }}
                            >
                              {team.teamName || `Team ${teamId}`}
                            </span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            {team.positionGrades && team.positionGrades.overallGrade ? team.positionGrades.overallGrade.grade : 'N/A'}
                          </td>
                          <td style={{ padding: '15px', fontWeight: 'bold' }}>
                            {team.optimalLineupPoints || 0}
                          </td>
                          <td style={{ padding: '15px' }}>
                            {team.benchPoints || 0}
                          </td>
                          <td style={{ padding: '15px' }}>
                            {Math.round((team.totalProjectedPoints || 0) * 10) / 10}
                          </td>
                          <td style={{ padding: '15px' }}>
                            {team.averageAdpValue ? Math.round(team.averageAdpValue * 10) / 10 : 'N/A'}
                          </td>
                          <td style={{ padding: '15px' }}>
                            {team.averageVorpScore ? Math.round(team.averageVorpScore * 10) / 10 : 'N/A'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team Cards */}
            <div>
              <h3 style={{ color: '#667eea', marginBottom: '20px' }}>📊 Team Details & Optimal Lineups</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                {Object.entries(results.teams || {})
                  .sort((a, b) => (b[1].optimalLineupPoints || 0) - (a[1].optimalLineupPoints || 0))
                  .map(([teamId, team], index) => (
                    <div 
                      key={teamId}
                      data-team-id={teamId}
                      style={{
                        border: index === 0 ? '3px solid #ffc107' : index < 3 ? '2px solid #6c757d' : '1px solid #dee2e6',
                        borderRadius: '15px',
                        padding: '20px',
                        background: index === 0 ? '#fff3cd' : 'white',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '20px',
                        paddingBottom: '15px',
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        <div>
                          <h4 style={{ 
                            fontSize: '1.5rem', 
                            color: '#667eea',
                            margin: 0
                          }}>
                            {team.teamName || `Team ${teamId}`}
                          </h4>
                          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
                            Rank #{index + 1} • {team.roster ? team.roster.length : 0} Players
                          </p>
                        </div>
                        {index === 0 && (
                          <div style={{ 
                            background: '#ffc107', 
                            color: '#000', 
                            padding: '8px 16px', 
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '14px'
                          }}>
                            🏆 WINNER
                          </div>
                        )}
                      </div>

                      {/* Team Stats */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: '15px', 
                        marginBottom: '20px' 
                      }}>
                        <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Optimal Lineup Points</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{team.optimalLineupPoints || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Bench Points</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{team.benchPoints || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Total Roster Points</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{Math.round((team.totalProjectedPoints || 0) * 10) / 10}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>ADP Value</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>{team.averageAdpValue ? Math.round(team.averageAdpValue * 10) / 10 : 'N/A'}</div>
                        </div>
                      </div>

                      {/* Roster Breakdown */}
                      {team.roster && team.roster.length > 0 && (
                        <div>
                          <h5 style={{ color: '#667eea', marginBottom: '15px' }}>📋 Roster Breakdown</h5>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                              <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Round</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Player</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Position</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Team</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Projected Points</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>VORP</th>
                                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ADP Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {team.roster.map((player, playerIndex) => (
                                  <tr key={playerIndex} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '8px' }}>{player.round || 'N/A'}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{player.playerName || 'Unknown'}</td>
                                    <td style={{ padding: '8px' }}>{player.position || 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{player.team || 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{player.projectedPoints || 0}</td>
                                    <td style={{ padding: '8px' }}>{player.vorpScore ? Math.round(player.vorpScore * 10) / 10 : 'N/A'}</td>
                                    <td style={{ padding: '8px' }}>{player.adpValue ? Math.round(player.adpValue * 10) / 10 : 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 