import 'dotenv/config';

console.log('🔍 Testing Supabase Configuration...\n');

// Check environment variables
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY'
];

console.log('📋 Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') ? 
      `${value.substring(0, 20)}...` : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n🔧 Next Steps:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to Settings > API');
console.log('3. Copy the "anon public key" to SUPABASE_ANON_KEY');
console.log('4. Copy the complete "service_role secret key" to SUPABASE_SERVICE_ROLE_KEY');
console.log('5. Make sure your .env file has all three variables');

// Test Supabase connection if we have the keys
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  console.log('\n🧪 Testing Supabase connection...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    // Test a simple query
    const { data, error } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      if (error.message.includes('relation "players" does not exist')) {
        console.log('💡 You need to run the SQL schema first!');
        console.log('   Copy supabase_schema.sql content to your Supabase SQL Editor');
      }
    } else {
      console.log('✅ Supabase connection successful!');
    }
  } catch (err) {
    console.log('❌ Error testing connection:', err.message);
  }
} else {
  console.log('\n❌ Cannot test connection - missing environment variables');
} 