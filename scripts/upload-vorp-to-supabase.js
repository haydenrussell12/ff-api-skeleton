import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

class VORPUploader {
    constructor() {
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }
        
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        this.vorpDataPath = path.join(__dirname, '../data/consolidated/player-vorp-scores.json');
    }

    async loadVORPData() {
        try {
            console.log('📊 Loading VORP data...');
            const data = fs.readFileSync(this.vorpDataPath, 'utf8');
            const vorpData = JSON.parse(data);
            console.log(`✅ Loaded VORP data for ${vorpData.vorpScores.length} players`);
            return vorpData;
        } catch (error) {
            console.error('❌ Error loading VORP data:', error);
            throw error;
        }
    }

    async createVORPTable() {
        try {
            console.log('🏗️  Creating VORP table...');
            
            // Since exec_sql function doesn't exist, we need to create the table manually
            console.log('⚠️  Table creation via RPC not available');
            console.log('📝 Please create the VORP table manually in Supabase dashboard:');
            console.log('');
            console.log('1. Go to your Supabase project dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Run the following SQL:');
            console.log('');
            
            const sqlPath = path.join(__dirname, 'create-vorp-table.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            console.log(sql);
            console.log('');
            console.log('4. After creating the table, run this script again');
            console.log('');
            
            // Check if table exists
            const { data: existingData, error: checkError } = await this.supabase
                .from('player_vorp_scores')
                .select('*')
                .limit(1);
            
            if (checkError && checkError.code === '42P01') {
                console.log('❌ VORP table does not exist yet');
                console.log('🛑 Please create the table first, then run this script again');
                process.exit(1);
            } else if (checkError) {
                console.log('❌ Error checking table:', checkError);
                process.exit(1);
            } else {
                console.log('✅ VORP table already exists!');
            }
            
        } catch (error) {
            console.log('⚠️  Table creation check failed:', error.message);
            process.exit(1);
        }
    }

    async uploadVORPScores(vorpScores) {
        console.log('📤 Uploading VORP scores to Supabase...');
        
        // Transform the data to match Supabase column names (snake_case)
        const transformedScores = vorpScores.map(score => ({
            player_id: score.playerId,
            player_name: score.playerName,
            position: score.position,
            team: score.team,
            projected_points: score.projectedPoints,
            median_points: score.medianPoints,
            vorp_score: score.vorpScore,
            season: score.season
        }));
        
        const batchSize = 100;
        let successCount = 0;
        let errorCount = 0;
        
        // Process in batches to avoid overwhelming the database
        for (let i = 0; i < transformedScores.length; i += batchSize) {
            const batch = transformedScores.slice(i, i + batchSize);
            
            try {
                const { data, error } = await this.supabase
                    .from('player_vorp_scores')
                    .upsert(batch, { 
                        onConflict: 'player_id,season',
                        ignoreDuplicates: false 
                    });
                
                if (error) {
                    console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} upload failed:`, error);
                    errorCount += batch.length;
                } else {
                    successCount += batch.length;
                    console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} players uploaded`);
                }
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error);
                errorCount += batch.length;
            }
        }
        
        console.log(`📊 Upload Summary: ${successCount} successful, ${errorCount} failed`);
        return { successCount, errorCount };
    }

    async verifyUpload() {
        console.log('🔍 Verifying upload...');
        
        try {
            // Check total count
            const { count, error: countError } = await this.supabase
                .from('player_vorp_scores')
                .select('*', { count: 'exact', head: true });
            
            if (countError) {
                console.error('❌ Count verification failed:', countError);
                return false;
            }
            
            console.log(`✅ Database contains ${count} VORP records`);
            
            // Check sample records
            const { data: sampleData, error: sampleError } = await this.supabase
                .from('player_vorp_scores')
                .select('*')
                .limit(5);
            
            if (sampleError) {
                console.error('❌ Sample data verification failed:', sampleError);
                return false;
            }
            
            if (sampleData && sampleData.length > 0) {
                console.log('✅ Sample data verification successful:');
                sampleData.forEach(record => {
                    console.log(`   - ${record.player_name} (${record.position}): VORP ${record.vorp_score}`);
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            return false;
        }
    }

    async run() {
        try {
            console.log('🚀 Starting VORP upload to Supabase...');
            console.log('=' * 50);
            
            // Load VORP data
            const vorpData = await this.loadVORPData();
            
            // Create table if needed
            await this.createVORPTable();
            
            // Upload scores
            const uploadResult = await this.uploadVORPScores(vorpData.vorpScores);
            
            // Verify upload
            const verificationSuccess = await this.verifyUpload();
            
            console.log('=' * 50);
            if (verificationSuccess && uploadResult.errorCount === 0) {
                console.log('🎉 VORP upload completed successfully!');
                console.log(`📊 Uploaded ${uploadResult.successCount} player VORP scores`);
            } else {
                console.log('⚠️  VORP upload completed with some issues');
                console.log(`📊 Success: ${uploadResult.successCount}, Errors: ${uploadResult.errorCount}`);
            }
            
        } catch (error) {
            console.error('❌ VORP upload failed:', error);
            throw error;
        }
    }
}

// Run the VORP upload
const vorpUploader = new VORPUploader();
vorpUploader.run().catch(console.error); 