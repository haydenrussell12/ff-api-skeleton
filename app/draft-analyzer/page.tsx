"use client";

import { useEffect, useState } from 'react';

export default function DraftAnalyzerPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load the actual working draft analyzer HTML
    fetch('/draft-analyzer-new.html')
      .then(response => response.text())
      .then(html => {
        setHtmlContent(html);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load draft analyzer');
        setLoading(false);
        console.error('Error loading draft analyzer:', err);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Loading Draft Analyzer...</h2>
        <p>Please wait while we load the full functionality...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <a href="/" style={{ 
          display: 'inline-block', 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          ← Back to Home
        </a>
        <h1>Error Loading Draft Analyzer</h1>
        <p>{error}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <a href="/" style={{ 
          display: 'inline-block', 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          ← Back to Home
        </a>
      </div>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
} 