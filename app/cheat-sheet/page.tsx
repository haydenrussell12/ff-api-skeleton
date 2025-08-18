"use client";

export default function CheatSheetPage() {
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
      
      <h1>📋 Pre Draft Cheat Sheet</h1>
      <p>This is the Pre Draft Cheat Sheet page. The full functionality will be available once we integrate the existing cheat sheet code.</p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        marginTop: '20px'
      }}>
        <h3>Coming Soon:</h3>
        <ul>
          <li>Player rankings with VORP scores</li>
          <li>Season projections and ADP values</li>
          <li>Position-specific analysis</li>
          <li>Filtering and sorting capabilities</li>
        </ul>
      </div>
    </div>
  );
} 