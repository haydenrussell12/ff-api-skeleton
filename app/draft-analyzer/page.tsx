export default function DraftAnalyzerPage() {
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
        <h1>Draft Analyzer</h1>
        <p>This page is being loaded from the existing HTML file. The full functionality will be available once we integrate the existing draft analyzer code.</p>
        <div id="draft-analyzer-content">
          {/* Content will be loaded here */}
        </div>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `
          // Load the existing draft analyzer HTML
          fetch('/draft-analyzer-new.html')
              .then(response => response.text())
              .then(html => {
                  document.getElementById('draft-analyzer-content').innerHTML = html;
              })
              .catch(error => {
                  console.error('Error loading draft analyzer:', error);
                  document.getElementById('draft-analyzer-content').innerHTML = '<p>Error loading draft analyzer. Please try again.</p>';
              });
        `
      }} />
    </div>
  );
} 