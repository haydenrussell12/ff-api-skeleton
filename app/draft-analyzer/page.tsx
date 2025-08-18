export default function DraftAnalyzerPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Draft Analyzer - Fantasy Football</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                .back-button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 20px; }
                .back-button:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-button">← Back to Home</a>
                <h1>Draft Analyzer</h1>
                <p>This page is being loaded from the existing HTML file. The full functionality will be available once we integrate the existing draft analyzer code.</p>
                <div id="draft-analyzer-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
            <script>
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
            </script>
        </body>
        </html>
      `
    }} />
  );
} 