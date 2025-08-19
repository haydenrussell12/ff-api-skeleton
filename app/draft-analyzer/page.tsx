"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftAnalyzerPage() {
  const [draftUrl, setDraftUrl] = useState('');
  const [leagueType, setLeagueType] = useState('standard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const leagueTypes = [
    {
      id: 'standard',
      name: 'Standard (1 QB)',
      description: 'QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1 (9 starters)',
      icon: '🏈'
    },
    {
      id: 'superflex',
      name: '🦸 Superflex',
      description: 'QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1, K: 1, DEF: 1 (10 starters)',
      icon: '🦸'
    },
    {
      id: '2qb',
      name: '⚖️ 2 QB',
      description: 'QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1 (10 starters)',
      icon: '⚖️'
    }
  ];

  const analyzeDraft = async () => {
    if (!draftUrl.trim()) {
      alert('Please enter a Sleeper draft URL');
      return;
    }

    setIsAnalyzing(true);
    try {
      const encoded = encodeURIComponent(draftUrl.trim());
      const leagueTypeParam = encodeURIComponent(leagueType);
      router.push(`/draft-analyzer/results?draftUrl=${encoded}&leagueType=${leagueTypeParam}`);
    } catch (error) {
      console.error('Error navigating to results:', error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        background: 'white', 
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 16px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            🏈 Draft Analyzer
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, margin: 0 }}>
            Analyze your Sleeper fantasy football draft with AI-powered insights
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '40px' }}>
          {/* League Type Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e293b', 
              marginBottom: '16px' 
            }}>
              Select League Type:
            </label>
            <div style={{ display: 'grid', gap: '12px' }}>
              {leagueTypes.map((type) => (
                <label key={type.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '16px', 
                  border: `2px solid ${leagueType === type.id ? '#0ea5e9' : '#e2e8f0'}`, 
                  borderRadius: '12px', 
                  background: leagueType === type.id ? '#f0f9ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="leagueType"
                    value={type.id}
                    checked={leagueType === type.id}
                    onChange={(e) => setLeagueType(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
                      {type.icon} {type.name}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Draft URL Input */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1e293b', 
              marginBottom: '12px' 
            }}>
              Sleeper Draft URL:
            </label>
            <input
              type="url"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://sleeper.com/draft/nfl/..."
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeDraft}
            disabled={isAnalyzing || !draftUrl.trim()}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              fontWeight: '600',
              background: isAnalyzing || !draftUrl.trim() ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isAnalyzing || !draftUrl.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isAnalyzing || !draftUrl.trim() ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🚀 Analyze Draft'}
          </button>

          {/* Instructions */}
          <div style={{ 
            marginTop: '24px', 
            padding: '20px', 
            background: '#f8fafc', 
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: '16px' }}>📋 How to use:</h3>
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', lineHeight: 1.6 }}>
              <li>Select your league type above</li>
              <li>Paste your Sleeper draft URL</li>
              <li>Click "Analyze Draft" to get detailed insights</li>
              <li>View team grades, optimal lineups, and position analysis</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 