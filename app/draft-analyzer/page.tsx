"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DraftAnalyzerPage() {
  const [draftUrl, setDraftUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const analyzeDraft = async () => {
    if (!draftUrl.trim()) {
      setError('Please enter a draft URL');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Navigate to results page where the API call will be executed
      const encoded = encodeURIComponent(draftUrl.trim());
      router.push(`/draft-analyzer/results?draftUrl=${encoded}`);
    } catch (error) {
      console.error('Error preparing analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Navigation failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
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
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '10px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🏈 Fantasy Football Draft Analyzer
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Analyze your Sleeper draft and see team performance metrics!
          </p>
        </div>

        {/* Input Section */}
        <div style={{
          padding: '30px',
          background: '#f8f9fa',
          borderBottom: '1px solid #e9ecef'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <input
              type="text"
              placeholder="Enter Sleeper draft URL (e.g., https://sleeper.app/draft/nfl/1234567890abcdef)"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              style={{
                padding: '15px',
                border: '2px solid #e9ecef',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
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
            >
              {isAnalyzing ? '🔄 Analyzing Draft...' : '🚀 Analyze Draft'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '20px',
            margin: '20px',
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
} 