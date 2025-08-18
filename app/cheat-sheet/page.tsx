export default function CheatSheetPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pre Draft Cheat Sheet - Fantasy Football</title>
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
                <h1>Pre Draft Cheat Sheet</h1>
                <p>This page is being loaded from the existing HTML file. The full functionality will be available once we integrate the existing cheat sheet code.</p>
                <div id="cheat-sheet-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
            <script>
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
            </script>
        </body>
        </html>
      `
    }} />
  );
} 