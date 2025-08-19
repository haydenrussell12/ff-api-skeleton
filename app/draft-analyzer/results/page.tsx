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
  const posGrades = team?.positionGrades?.positionGrades || {};

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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
      <div>
        <h4 style={{ margin: '0 0 16px', color: '#334155', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span>
          Starters
        </h4>
        <div style={{ display: 'grid', gap: 16 }}>
          {['QB','RB','WR','TE','FLEX','DEF','K'].map((pos) => {
            const players = lineup[pos] || [];
            const grade = posGrades[pos];
            if (players.length === 0) return null;
            
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
                    {grade && <Badge text={grade.grade} color="#16a34a" />}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    {players.reduce((sum: number, p: any) => sum + (p.projectedPoints || 0), 0).toFixed(1)} pts
                  </div>
                </div>
                {renderPlayers(players)}
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

function ResultsContent() {
  const searchParams = useSearchParams();
  const draftUrl = useMemo(() => searchParams.get('draftUrl') || '', [searchParams]);

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
          body: JSON.stringify({ draftUrl })
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
  }, [draftUrl]);

  // Helper: derive sorted teams for scoreboard (rank by optimal lineup projected points)
  const sortedTeams = useMemo(() => {
    const teams = results?.analysis?.teams || [];
    const withRankKey = teams.map((t: any) => {
      const optimalPts = t?.optimalLineupPoints ?? 0;
      return { ...t, __rankScore: optimalPts };
    });
    return withRankKey.sort((a: any, b: any) => (b.__rankScore || 0) - (a.__rankScore || 0));
  }, [results]);

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
        <div style={{ padding: '30px', display: 'grid', gap: 20 }}>
          {/* Overview and Settings at Top */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <SectionCard title="Overview">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Name</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.name}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Teams</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.teams}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Rounds</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.rounds}</div></div>
                <div><div style={{ color: '#64748b', fontSize: 12 }}>Total Picks</div><div style={{ fontWeight: 700 }}>{results?.draftInfo?.totalPicks}</div></div>
              </div>
            </SectionCard>

            <SectionCard title="Settings">
              <div style={{ color: '#64748b', fontSize: 12 }}>Assumed PPR with 1QB/2RB/2WR/1TE/1FLEX/K/DEF</div>
            </SectionCard>
          </div>

          {/* Scoreboard as Table */}
          <SectionCard title="🏆 Scoreboard (Ranked by Optimal Lineup Points)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#334155' }}>Rank</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600, color: '#334155' }}>Team</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Grade</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Optimal Pts</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Bench Pts</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Total Pts</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Avg ADP</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>Avg VORP</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team: any, idx: number) => {
                    const gradeLetter = team?.positionGrades?.overallGrade?.grade ?? '—';
                    const optimalPts = team?.optimalLineupPoints ?? 0;
                    const benchPts = team?.benchPoints ?? 0;
                    const totalPts = team?.totalProjectedPoints ?? 0;
                    const avgVorp = team?.averageVorpScore ?? 0;
                    const avgAdp = team?.averageAdpValue ?? 0;
                    const gradeCol = (gradeLetter && gradeLetter !== '—') ? (gradeLetter.startsWith('A') ? '#16a34a' : gradeLetter.startsWith('B') ? '#22c55e' : gradeLetter.startsWith('C') ? '#f59e0b' : '#ef4444') : '#64748b';
                    
                    return (
                      <tr key={team.teamId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#334155' }}>#{idx + 1}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{team.teamName || `Team ${team.teamId}`}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <Badge text={gradeLetter} color={gradeCol} />
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{optimalPts.toFixed(1)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>{benchPts.toFixed(1)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{totalPts.toFixed(1)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>{avgAdp.toFixed(1)}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>{avgVorp.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Teams Section */}
          <SectionCard title="Teams">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 20 }}>
              {(results?.analysis?.teams || []).map((team: any) => (
                <div key={team.teamId} style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 16, 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden'
                }}>
                  {/* Team Header */}
                  <div style={{ 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
                    color: 'white',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{team.teamName || `Team ${team.teamId}`}</div>
                      <div style={{ opacity: 0.9, fontSize: 14 }}>Draft Slot {team.draftSlot}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Badge text={team?.positionGrades?.overallGrade?.grade ?? '—'} color="rgba(255,255,255,0.9)" style={{ fontSize: '16px', padding: '6px 16px' }} />
                    </div>
                  </div>
                  
                  {/* Team Stats */}
                  <div style={{ 
                    padding: '16px 20px', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', 
                    gap: 12, 
                    fontSize: 13, 
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{team.totalProjectedPoints?.toFixed?.(1) || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Optimal</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{team.optimalLineupPoints?.toFixed?.(1) || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ADP</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{team.averageAdpValue?.toFixed?.(1) || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>VORP</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{team.averageVorpScore?.toFixed?.(2) || 0}</div>
                    </div>
                  </div>
                  
                  {/* Team Lineup */}
                  <div style={{ padding: '20px' }}>
                    <TeamLineup team={team} />
                  </div>
                </div>
              ))}
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
    <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', background: 'transparent', borderRadius: '20px' }}>
        <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}> 
          <ResultsContent />
        </Suspense>
      </div>
    </div>
  );
} 