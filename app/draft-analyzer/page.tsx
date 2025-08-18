"use client";

export default function DraftAnalyzerPage() {
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
      
      <h1>🚀 Draft Analyzer</h1>
      <p>This is the Draft Analyzer page. The full functionality will be available once we integrate the existing draft analyzer code.</p>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6',
        marginTop: '20px'
      }}>
        <h3>Coming Soon:</h3>
        <ul>
          <li>Draft analysis with Sleeper API integration</li>
          <li>Team performance evaluation</li>
          <li>VORP calculations and position grades</li>
          <li>Optimal lineup engine</li>
        </ul>
      </div>
    </div>
  );
} 