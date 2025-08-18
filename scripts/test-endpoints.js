#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(path, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.text();
    
    console.log(`✅ ${method} ${path} - Status: ${response.status}`);
    if (response.status !== 200) {
      console.log(`   Response: ${data.substring(0, 200)}...`);
    }
    
    return response.status;
  } catch (error) {
    console.log(`❌ ${method} ${path} - Error: ${error.message}`);
    return 0;
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  
  // Test health endpoint
  await testEndpoint('/health');
  
  // Test debug routes endpoint
  await testEndpoint('/api/_debug/routes');
  
  // Test method validation - GET on POST-only endpoint
  await testEndpoint('/api/analyze-draft');
  
  // Test method validation - POST on GET-only endpoint
  await testEndpoint('/api/cheat-sheet', 'POST');
  
  // Test 404 handling
  await testEndpoint('/nonexistent');
  
  // Test static file serving
  await testEndpoint('/');
  await testEndpoint('/draft-analyzer');
  await testEndpoint('/cheat-sheet');
  
  console.log('\n🎯 Endpoint testing completed!');
}

runTests().catch(console.error); 