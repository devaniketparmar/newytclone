// Simple test script to verify liked videos functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testLikedVideosAPI() {
  console.log('Testing Liked Videos API...\n');

  try {
    // Test 1: Access liked videos without authentication
    console.log('Test 1: Access liked videos without authentication');
    const response1 = await fetch(`${BASE_URL}/api/liked-videos`);
    console.log('Status:', response1.status);
    console.log('Expected: 401 (Unauthorized)');
    console.log('Result:', response1.status === 401 ? '✅ PASS' : '❌ FAIL');
    console.log();

    // Test 2: Access liked videos page without authentication
    console.log('Test 2: Access liked videos page without authentication');
    const response2 = await fetch(`${BASE_URL}/liked`);
    console.log('Status:', response2.status);
    console.log('Expected: 200 (redirects to auth)');
    console.log('Result:', response2.status === 200 ? '✅ PASS' : '❌ FAIL');
    console.log();

    console.log('✅ Basic API tests completed!');
    console.log('Note: Full functionality testing requires authentication.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the development server is running on port 3000');
  }
}

testLikedVideosAPI();
