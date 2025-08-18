# Fantasy Football API with Supabase

A fast, modern fantasy football rankings API built with Node.js, Express, and Supabase. This project stores fantasy football player rankings and projections in a Supabase database and provides a beautiful frontend to view the data.

## Features

- 🏈 **Real-time Rankings**: Get up-to-date player rankings from multiple sources
- 📊 **Multiple Formats**: Support for Standard, PPR, and Half-PPR scoring
- 🎯 **ADP Knowledge**: AI agent can answer draft position questions like "Who is ADP 15?"
- 🚀 **Fast Performance**: Data served from Supabase for optimal speed
- 📱 **Responsive Design**: Modern, mobile-friendly frontend
- 🔄 **Auto-refresh**: Data automatically updates every 5 minutes
- 📈 **Statistics**: View total players, average projections, and last updated time
- 🤖 **AI Assistant**: Get instant answers to fantasy football questions

## AI Assistant Features

The built-in AI assistant can help you with:

### 🎯 **ADP Questions**
- "Who is ADP 15?"
- "Who goes in round 2?"
- "Show me top 20 players"

### 📊 **Player Analysis**
- "How many points is Gibbs projected to score?"
- "Who should I start: Gibbs vs Swift?"
- "Compare McCaffrey and Ekeler"

### 🔍 **Waiver Wire & Trades**
- "Who should I pick up at RB?"
- "Is this a good trade?"
- "Best streaming options this week"

## Quick Start with AI

1. **Setup ADP Knowledge**:
   ```bash
   npm run populate-adp-data
   ```

2. **Test AI Functionality**:
   ```bash
   npm run test-adp-ai
   ```

3. **Ask Questions**: Use the AI assistant on your site to get instant fantasy football insights!

## Project Structure

```
ff_api_skeleton/
├── public/
│   └── index.html          # Frontend HTML file
├── scripts/
│   ├── load_rankings_csv.js # Data loader script
│   └── server.js           # Express API server
├── data/
│   └── rankings.csv        # Sample CSV data
├── supabase_schema.sql     # Database schema
├── env.example             # Environment variables template
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to the **SQL Editor**
3. Copy and paste the contents of `supabase_schema.sql` and run it
4. Go to **Settings > API** to get your project credentials

### 3. Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 4. Load Sample Data

```bash
npm run load-data
```

This will load the sample CSV data from `data/rankings.csv` into your Supabase database.

### 5. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### GET /api/rankings
Get player rankings with optional filters.

**Query Parameters:**
- `source` (optional): Ranking source (ecr, fantasypros, espn) - defaults to 'ecr'
- `format` (optional): Scoring format (standard, ppr, half-ppr) - defaults to 'standard'
- `limit` (optional): Number of players to return - defaults to 100

**Example:**
```bash
curl "http://localhost:3000/api/rankings?source=ecr&format=ppr&limit=50"
```

### GET /api/players
Get list of players with optional filters.

**Query Parameters:**
- `position` (optional): Player position (QB, RB, WR, TE)
- `team` (optional): Team code (SF, NYJ, MIN, etc.)
- `limit` (optional): Number of players to return - defaults to 100

### GET /api/snapshots
Get list of ranking snapshots (sources, formats, dates).

### GET /health
Health check endpoint.

## Database Schema

The database consists of three main tables:

1. **players**: Stores player information (name, position, team)
2. **rankings_snapshots**: Stores ranking metadata (source, format, date)
3. **ranking_values**: Stores actual rankings and projections

## Adding New Data

To add new rankings data:

1. Create a CSV file with the same structure as `data/rankings.csv`
2. Run the loader script:
   ```bash
   node scripts/load_rankings_csv.js path/to/your/file.csv
   ```

## CSV Format

Your CSV should have these columns:
```csv
source,format,snapshot_date,full_name,position,team,rank,tier,projection_pts
ecr,standard,2025-08-10,Christian McCaffrey,RB,SF,1,1,300
ecr,standard,2025-08-10,Breece Hall,RB,NYJ,2,1,290
```

## Frontend Features

The frontend (`public/index.html`) provides:

- **Filtering**: By source, format, and limit
- **Responsive Table**: Shows rank, player, position, team, tier, and projections
- **Statistics**: Total players, average projections, last updated time
- **Auto-refresh**: Data updates automatically every 5 minutes
- **Mobile-friendly**: Responsive design for all devices

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard

### Other Platforms

The app can be deployed to any Node.js hosting platform (Heroku, Railway, etc.) by setting the appropriate environment variables.

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure you have a `.env` file with the correct credentials
   - Verify your Supabase project URL and keys

2. **"Table does not exist"**
   - Run the SQL schema in your Supabase SQL Editor
   - Check that all tables were created successfully

3. **"Permission denied"**
   - Verify your Supabase RLS policies
   - Check that you're using the correct API keys

4. **Data not loading**
   - Check the browser console for errors
   - Verify your API endpoints are working with `/health`

### Getting Help

- Check the browser console for JavaScript errors
- Verify your Supabase database has data
- Test API endpoints directly with curl or Postman
- Check the server logs for backend errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see package.json for details.

## Support

If you encounter any issues or have questions, please check the troubleshooting section above or create an issue in the repository. 