export default function CheatSheetPage() {
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
        <h1>Pre Draft Cheat Sheet</h1>
        <p>This page is being loaded from the existing HTML file. The full functionality will be available once we integrate the existing cheat sheet code.</p>
        <div id="cheat-sheet-content">
          {/* Content will be loaded here */}
        </div>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `
          // Load the existing cheat sheet HTML
          fetch('/pre-draft-cheat-sheet.html')
              .then(response => response.text())
              .then(html => {
                  document.getElementById('cheat-sheet-content').innerHTML = html;
              })
              .catch(error => {
                  console.error('Error loading cheat sheet:', error);
                  document.getElementById('cheat-sheet-content').innerHTML = '<p>Error loading cheat sheet. Please try again.</p>';
              });
        `
      }} />
    </div>
  );
} 