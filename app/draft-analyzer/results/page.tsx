"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px', textAlign: 'center' }}>
        <a href="/draft-analyzer" style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>← Back</a>
        <h1 style={{ fontSize: '2.0rem', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>📊 Draft Analysis Results</h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.9, wordBreak: 'break-all' }}>{draftUrl}</p>
      </div>

      {error && (
        <div style={{ padding: '20px', margin: '20px', background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '5px', textAlign: 'center' }}>❌ {error}</div>
      )}

      {isLoading && (
        <div style={{ padding: '30px', textAlign: 'center' }}>🔄 Analyzing draft...</div>
      )}

      {!isLoading && !error && results && (
        <div style={{ padding: '30px' }}>
          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: '#667eea', marginBottom: '8px' }}>Overview</h2>
            <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px' }}>
              <div><strong>Name:</strong> {results?.draftInfo?.name}</div>
              <div><strong>Teams:</strong> {results?.draftInfo?.teams}</div>
              <div><strong>Rounds:</strong> {results?.draftInfo?.rounds}</div>
              <div><strong>Total Picks:</strong> {results?.draftInfo?.totalPicks}</div>
            </div>
          </section>

          <section>
            <h2 style={{ color: '#667eea', marginBottom: '8px' }}>Teams</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {(results?.analysis?.teams || []).map((team: any) => (
                <div key={team.teamId} style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>Team {team.teamId} (Slot {team.draftSlot})</div>
                  <div style={{ fontSize: '14px' }}>
                    <div>Players: {team.players?.length || 0}</div>
                    <div>Avg Projected: {team.averageProjectedPoints?.toFixed?.(2) || 0}</div>
                    <div>Avg ADP: {team.averageAdpValue?.toFixed?.(2) || 0}</div>
                    <div>Avg VORP: {team.averageVorpScore?.toFixed?.(2) || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: '24px' }}>
            <h3 style={{ color: '#764ba2', marginBottom: '8px' }}>Raw Results</h3>
            <pre style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', overflow: 'auto', fontSize: '14px' }}>{JSON.stringify(results, null, 2)}</pre>
          </section>
        </div>
      )}
    </div>
  );
}

export default function DraftAnalyzerResultsPage() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', background: 'white', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <Suspense fallback={<div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>}>
          <ResultsContent />
        </Suspense>
      </div>
    </div>
  );
} 