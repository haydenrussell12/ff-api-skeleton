"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function Badge({ text, color = '#64748b', style }: { text: string; color?: string; style?: React.CSSProperties }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: `${color}20`, color,
      fontSize: 12, fontWeight: 700, border: `1px solid ${color}55`,
      ...style
    }}>{text}</span>
  );
}

function SectionCard({ title, children }: { title: string; children: any }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e9ecef', boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #eef2f7', display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: 18 }}>{title}</h2>
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

function TeamLineup({ team }: { team: any }) {
  const lineup = team?.optimalLineup || {};
  const bench = team?.benchPlayers || [];
  const posGrades = team?.positionGrades || {};

  // Get position order based on league type - use a fixed order for now
  const getPositionOrder = () => {
    // For now, use a standard order - we can make this dynamic later
    // Note: FLEX will show multiple players if it's a 2 FLEX league
    return ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DEF', 'K'];
  };

  const positionOrder = getPositionOrder();

  const renderPlayers = (players: any[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: 8 }}>
      {(players || []).map((p, idx) => (
        <div key={(p.playerId || p.playerName || idx) + '-lineup'} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '12px 16px', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          border: '1px solid #e2e8f0', 
          borderRadius: 10,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge text={p.position || '—'} color="#0ea5e9" />
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{p.playerName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{(p.projectedPoints || 0).toFixed(1)} pts</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
      <div>
        <h4 style={{ margin: '0 0 16px', color: '#334155', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span>
          Starters
        </h4>
        <div style={{ display: 'grid', gap: 16 }}>
          {positionOrder.map((pos) => {
            const players = lineup[pos] || [];
            const grade = posGrades[pos];
            
            // Show all positions, even if empty, for debugging
            return (
              <div key={pos} style={{ 
                border: '1px solid #e2e8f0', 
                borderRadius: 12, 
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ 
                  padding: '12px 16px', 
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Badge text={pos} color="#4f46e5" />
                    {grade && <Badge text={grade.grade} color={getGradeColor(grade.grade)} />}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    {players.length > 0 ? players.reduce((sum: number, p: any) => sum + (p.projectedPoints || 0), 0).toFixed(1) : '0'} pts
                  </div>
                </div>
                {players.length > 0 ? (
                  renderPlayers(players)
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#64748b', 
                    fontSize: '14px',
                    background: '#f8fafc'
                  }}>
                    No players in {pos} position
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h4 style={{ margin: '0 0 16px', color: '#334155', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: '50%' }}></span>
          Bench
        </h4>
        {bench.length === 0 ? (
          <div style={{ 
            fontSize: 12, 
            color: '#64748b', 
            textAlign: 'center', 
            padding: '40px 20px', 
            background: '#f8fafc', 
            border: '2px dashed #e2e8f0', 
            borderRadius: 12 
          }}>
            No bench players
          </div>
        ) : (
          renderPlayers(bench)
        )}
      </div>
    </div>
  );
}

// Helper function to get grade colors
function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#16a34a'; // Green for A grades
  if (grade.startsWith('B')) return '#22c55e'; // Light green for B grades
  if (grade.startsWith('C')) return '#f59e0b'; // Yellow for C grades
  if (grade.startsWith('D')) return '#f97316'; // Orange for D grades
  if (grade.startsWith('F')) return '#ef4444'; // Red for F grades
  return '#64748b'; // Default gray
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const draftUrl = useMemo(() => searchParams.get('draftUrl') || '', [searchParams]);
  const leagueType = useMemo(() => searchParams.get('leagueType') || 'standard', [searchParams]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      if (!draftUrl) {
        setError('Missing draftUrl in query string');
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/analyze-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            draftUrl, 
            leagueType
          })
        });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json?.error || `Request failed with status ${response.status}`);
        }
        setResults(json.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [draftUrl, leagueType]);

  // Helper: derive sorted teams for scoreboard (rank by optimal lineup projected points)
  const sortedTeams = useMemo(() => {
    const teams = results?.analysis?.teams || [];
    const withRankKey = teams.map((t: any) => {
      const optimalPts = t?.optimalLineupPoints ?? 0;
      return { ...t, __rankScore: optimalPts };
    });
    return withRankKey.sort((a: any, b: any) => (b.__rankScore || 0) - (a.__rankScore || 0));
  }, [results]);

  // Helper: get league type display info
  const getLeagueTypeInfo = (type: string) => {
    const leagueTypes = {
      standard: { name: 'Standard (1 QB)', starters: 9, description: 'QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1' },
      superflex: { name: '🦸 Superflex', starters: 9, description: 'QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 (QB/RB/WR/TE), DEF: 1, K: 1' },
      '2qb': { name: '⚖️ 2 QB', starters: 10, description: 'QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1' },
      '2flex': { name: '🔄 2 Flex', starters: 10, description: 'QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DEF: 1, K: 1' },
      'robs-bullshit': { name: '💩 Rob\'s Bullshit', starters: 12, description: 'QB: 2, RB: 2, WR: 3, TE: 1, FLEX: 2, DEF: 1, K: 1' }
    };
    return leagueTypes[type as keyof typeof leagueTypes] || leagueTypes.standard;
  };

  // Helper: get position order based on league type
  const getPositionOrder = () => {
    // For now, use a standard order - we can make this dynamic later
    // Note: FLEX will show multiple players if it's a 2 FLEX league
    return ['QB', 'RB', 'WR', 'TE', 'FLEX', 'DEF', 'K'];
  };

  // Helper: format roster construction grade
  const formatRosterGrade = (grade: any) => {
    if (!grade || !grade.overallGrade) return { grade: '—', score: 0, summary: 'No grade available' };
    
    return {
      grade: grade.overallGrade.grade || '—',
      score: grade.overallGrade.score || 0,
      summary: grade.overallGrade.summary || 'No summary available',
      breakdown: grade.overallGrade.breakdown || {}
    };
  };

  // Helper: get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10B981'; // Green
    if (grade.startsWith('B')) return '#3B82F6'; // Blue
    if (grade.startsWith('C')) return '#F59E0B'; // Yellow
    if (grade.startsWith('D')) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const leagueInfo = getLeagueTypeInfo(leagueType);

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)', color: 'white', padding: '30px', textAlign: 'center' }}>
        <a href="/draft-analyzer" style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>← Back</a>
        <h1 style={{ fontSize: '2.0rem', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>📊 Draft Analysis Results</h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.9, wordBreak: 'break-all' }}>{draftUrl}</p>
      </div>

      {error && (
        <div style={{ padding: '20px', margin: '20px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '10px', textAlign: 'center' }}>❌ {error}</div>
      )}

      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center' }}>🔄 Analyzing draft...</div>
      )}

      {!isLoading && !error && results && (
        <div style={{ 
          padding: '20px', 
          display: 'grid', 
          gap: 20, 
          maxWidth: '100%', 
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          {/* Overview and Settings at Top */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <SectionCard title="Overview">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Name</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.name}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Teams</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.teams}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Rounds</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.rounds}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Total Picks</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.totalPicks}</div></div>
              </div>
            </SectionCard>

            <SectionCard title="Settings">
              <div style={{ color: '#64748b', fontSize: 12 }}>{leagueInfo.description}</div>
            </SectionCard>
          </div>

          {/* Scoreboard as Professional List */}
          <SectionCard title="🏆 Scoreboard (Ranked by Optimal Lineup Points)">
            <div style={{ display: 'grid', gap: 16 }}>
              {sortedTeams.map((team: any, idx: number) => {
                const rosterGrade = formatRosterGrade(team);
                const gradeLetter = rosterGrade.grade;
                const optimalPts = team?.optimalLineupPoints ?? 0;
                const benchPts = team?.benchPoints ?? 0;
                const totalPts = team?.totalProjectedPoints ?? 0;
                const avgVorp = team?.averageVorpScore ?? 0;
                const avgAdp = team?.averageAdpValue ?? 0;
                const gradeCol = (gradeLetter && gradeLetter !== '—') ? (gradeLetter.startsWith('A') ? '#16a34a' : gradeLetter.startsWith('B') ? '#22c55e' : gradeLetter.startsWith('C') ? '#f59e0b' : '#ef4444') : '#64748b';
                
                return (
                  <div key={team.teamId} style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '20px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto',
                    gap: 20,
                    alignItems: 'center',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                  }}>
                    
                    {/* Rank */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 
                                   idx === 1 ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' :
                                   idx === 2 ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' :
                                   'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 16,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {idx + 1}
                      </div>
                      {idx < 3 && (
                        <div style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: idx === 0 ? '#92400e' : idx === 1 ? '#475569' : '#92400e',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>

                    {/* Team Info & Metrics */}
                    <div style={{ display: 'grid', gap: 12 }}>
                      {/* Team Name & Grade */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#0f172a'
                        }}>
                          {team.teamName || `Team ${team.teamId}`}
                        </h3>
                        <Badge text={gradeLetter} color={gradeCol} />
                      </div>

                      {/* Metrics Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: 16
                      }}>
                        {/* Optimal Points */}
                        <div style={{
                          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                          border: '1px solid #0ea5e9',
                          borderRadius: 12,
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 12, color: '#0c4a6e', fontWeight: 600, marginBottom: 4 }}>
                            ⚡ Optimal Points
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9' }}>
                            {optimalPts.toFixed(1)}
                          </div>
                        </div>

                        {/* Bench Points */}
                        <div style={{
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          border: '1px solid #f59e0b',
                          borderRadius: 12,
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>
                            🏗️ Bench Points
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                            {benchPts.toFixed(1)}
                          </div>
                        </div>

                        {/* Total Points */}
                        <div style={{
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                          border: '1px solid #10b981',
                          borderRadius: 12,
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 12, color: '#065f46', fontWeight: 600, marginBottom: 4 }}>
                            🎯 Total Points
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                            {totalPts.toFixed(1)}
                          </div>
                        </div>

                        {/* Avg ADP */}
                        <div style={{
                          background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                          border: '1px solid #8b5cf6',
                          borderRadius: 12,
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 12, color: '#581c87', fontWeight: 600, marginBottom: 4 }}>
                            💎 Avg ADP
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>
                            {avgAdp.toFixed(1)}
                          </div>
                        </div>

                        {/* Avg VORP */}
                        <div style={{
                          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                          border: '1px solid #ef4444',
                          borderRadius: 12,
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 600, marginBottom: 4 }}>
                            📊 Avg VORP
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>
                            {avgVorp.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 8,
                      minWidth: '120px'
                    }}>
                      <div style={{
                        fontSize: 12,
                        color: '#64748b',
                        textAlign: 'right'
                      }}>
                        {team.roster?.length || 0} players
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#64748b',
                        textAlign: 'right'
                      }}>
                        Round {Math.max(...(team.roster?.map((p: any) => p.round) || [0]))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Teams Section */}
          <SectionCard title="Teams">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
              {(results?.analysis?.teams || []).map((team: any) => {
                const rosterGrade = formatRosterGrade(team);
                const gradeColor = getGradeColor(rosterGrade.grade);
                
                return (
                  <div key={team.teamId} style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 16, 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden'
                  }}>
                    {/* Team Header with Roster Grade */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                      paddingBottom: '15px',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                          {team.teamName || `Team ${team.teamId}`}
                        </h3>
                        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                          {team.roster?.length || 0} players • {Math.round((team.optimalLineupPoints || 0) * 10) / 10} projected points
                        </p>
                      </div>
                      
                      {/* Roster Construction Grade */}
                      <div style={{
                        textAlign: 'center',
                        padding: '15px',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        border: `2px solid ${gradeColor}`,
                        minWidth: '80px'
                      }}>
                        <div style={{
                          fontSize: '32px',
                          fontWeight: 'bold',
                          color: gradeColor,
                          marginBottom: '5px'
                        }}>
                          {rosterGrade.grade}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          fontWeight: '500'
                        }}>
                          {rosterGrade.score}/100
                        </div>
                      </div>
                    </div>

                    {/* Roster Construction Analysis */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '15px',
                      marginBottom: '20px'
                    }}>
                      {/* Positional Balance */}
                      <div style={{
                        padding: '15px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>
                          📊 Positional Balance
                        </h4>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: getGradeColor(rosterGrade.breakdown?.positionalBalance?.score >= 80 ? 'A' : 
                                           rosterGrade.breakdown?.positionalBalance?.score >= 60 ? 'C' : 'D'),
                          marginBottom: '5px'
                        }}>
                          {rosterGrade.breakdown?.positionalBalance?.score || 0}/100
                        </div>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                          {rosterGrade.breakdown?.positionalBalance?.analysis || 'No analysis available'}
                        </p>
                      </div>

                      {/* Depth Strategy */}
                      <div style={{
                        padding: '15px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>
                          🏗️ Depth Strategy
                        </h4>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: getGradeColor(rosterGrade.breakdown?.depthStrategy?.score >= 80 ? 'A' : 
                                           rosterGrade.breakdown?.depthStrategy?.score >= 60 ? 'C' : 'D'),
                          marginBottom: '5px'
                        }}>
                          {rosterGrade.breakdown?.depthStrategy?.score || 0}/100
                        </div>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                          {rosterGrade.breakdown?.depthStrategy?.analysis || 'No analysis available'}
                        </p>
                      </div>

                      {/* ADP Value */}
                      <div style={{
                        padding: '15px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '600' }}>
                          💎 Draft Value
                        </h4>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: getGradeColor(rosterGrade.breakdown?.adpValue?.score >= 80 ? 'A' : 
                                           rosterGrade.breakdown?.adpValue?.score >= 60 ? 'C' : 'D'),
                          marginBottom: '5px'
                        }}>
                          {rosterGrade.breakdown?.adpValue?.score || 0}/100
                        </div>
                        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                          {rosterGrade.breakdown?.adpValue?.analysis || 'No analysis available'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Team Lineup */}
                    <div style={{ padding: '20px' }}>
                      <TeamLineup team={team} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Raw Results */}
          <SectionCard title="Raw Results">
            <pre style={{ background: '#0b1220', color: '#e2e8f0', padding: '16px', borderRadius: 12, overflow: 'auto', fontSize: '12px', lineHeight: 1.5 }}>{JSON.stringify(results, null, 2)}</pre>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export default function DraftAnalyzerResultsPage() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)', 
      minHeight: '100vh', 
      padding: '20px',
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        background: 'transparent', 
        borderRadius: '20px',
        overflow: 'hidden'
      }}>
        <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}> 
          <ResultsContent />
        </Suspense>
      </div>
    </div>
  );
} 