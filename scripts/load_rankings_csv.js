// Usage: node scripts/load_rankings_csv.js data/rankings.csv
import 'dotenv/config'; // load .env variables
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Validate env variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables. Check your .env file.');
  process.exit(1);
}

// Create the Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const [, , csvPath] = process.argv;
if (!csvPath) {
  console.error('Usage: node scripts/load_rankings_csv.js data/rankings.csv');
  process.exit(1);
}


function parseCSV(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.map(line => {
    const cols = line.split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => row[h] = cols[i] ?? '');
    return row;
  });
}

async function getOrCreateSnapshot(source, format, snapshot_date) {
  const { data: existing, error: e1 } = await supabase
    .from('rankings_snapshots')
    .select('snapshot_id')
    .eq('source', source).eq('format', format).eq('snapshot_date', snapshot_date)
    .maybeSingle();
  if (e1) throw e1;
  if (existing) return existing.snapshot_id;

  const { data: inserted, error: e2 } = await supabase
    .from('rankings_snapshots')
    .insert([{ source, format, snapshot_date }])
    .select('snapshot_id').single();
  if (e2) throw e2;
  return inserted.snapshot_id;
}

async function getOrCreatePlayer({ full_name, position, team }) {
  // Try exact match first
  let { data: player, error: e1 } = await supabase
    .from('players').select('player_id')
    .eq('full_name', full_name).maybeSingle();
  if (e1) throw e1;
  if (player) return player.player_id;

  // Create minimal player
  const { data: created, error: e2 } = await supabase
    .from('players')
    .insert([{ full_name, position, team_code: team }])
    .select('player_id').single();
  if (e2) throw e2;
  return created.player_id;
}

async function main() {
  const csv = fs.readFileSync(path.resolve(csvPath), 'utf8');
  const rows = parseCSV(csv);

  if (rows.length === 0) {
    console.log('No rows in CSV.');
    return;
  }
  const { source, format, snapshot_date } = rows[0];
  const snapshotId = await getOrCreateSnapshot(source, format, snapshot_date);

  const values = [];
  for (const r of rows) {
    const player_id = await getOrCreatePlayer(r);
    values.push({
      snapshot_id: snapshotId,
      player_id,
      rank: r.rank ? Number(r.rank) : null,
      tier: r.tier ? Number(r.tier) : null,
      projection_pts: r.projection_pts ? Number(r.projection_pts) : null
    });
  }

  // Upsert into ranking_values
  // (supabase upsert requires a conflict target; our PK is (snapshot_id, player_id))
  const chunk = 500;
  for (let i = 0; i < values.length; i += chunk) {
    const slice = values.slice(i, i + chunk);
    const { error } = await supabase
      .from('ranking_values')
      .upsert(slice, { onConflict: 'snapshot_id,player_id' });
    if (error) throw error;
  }

  console.log(`Loaded ${values.length} ranking rows into snapshot ${snapshotId}`);
}

main().catch(err => {
  console.error('❌ Error loading rankings:', err);
  process.exit(1);
});
console.log('✅ Done loading rankings');
