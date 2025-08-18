export default function TestStaticPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Static File Test</h1>
      <p>This page tests if static files are accessible.</p>
      
      <h2>Test Links:</h2>
      <ul>
        <li><a href="/draft-analyzer-new.html">Draft Analyzer (Static HTML)</a></li>
        <li><a href="/pre-draft-cheat-sheet.html">Cheat Sheet (Static HTML)</a></li>
        <li><a href="/">Back to Home</a></li>
      </ul>
      
      <h2>Direct File Access:</h2>
      <p>Try these URLs directly in your browser:</p>
      <ul>
        <li><code>/draft-analyzer-new.html</code></li>
        <li><code>/pre-draft-cheat-sheet.html</code></li>
      </ul>
    </div>
  );
} 