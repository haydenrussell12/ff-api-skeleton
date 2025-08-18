-- Add unique constraint to leagues table
-- This allows us to use onConflict for proper deduplication

-- Add unique constraint on league_id_external + platform combination
-- This prevents duplicate leagues from the same platform
ALTER TABLE leagues 
ADD CONSTRAINT unique_league_external_platform 
UNIQUE (league_id_external, platform);

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'leagues' 
    AND tc.constraint_type = 'UNIQUE';

-- Test the constraint by trying to insert a duplicate (should fail)
-- INSERT INTO leagues (league_id_external, platform, name) 
-- VALUES ('test123', 'sleeper', 'Test League');
-- This should fail with a unique constraint violation 