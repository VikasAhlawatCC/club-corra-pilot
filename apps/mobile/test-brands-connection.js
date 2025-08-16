// Simple test script to verify brands service connection
const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testBrandsConnection() {
  console.log('🧪 Testing brands service connection...');
  console.log('🔗 API Base URL:', API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/brands`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Connection successful!');
    console.log(`📊 Found ${data.brands?.length || 0} brands`);
    console.log('📱 First brand:', data.brands?.[0]?.name || 'None');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testBrandsConnection();
