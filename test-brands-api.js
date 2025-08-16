const fetch = require('node-fetch');

async function testBrandsAPI() {
  try {
    console.log('🧪 Testing Brands API...');
    
    const url = 'http://192.168.1.4:3001/api/v1/brands?isActive=true';
    console.log('🌐 Making request to:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-Client-Type': 'mobile',
        'User-Agent': 'ClubCorra-Mobile/1.0.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Total brands:', data.total);
    console.log('📱 Brands array length:', data.brands?.length || 0);
    
    if (data.brands && data.brands.length > 0) {
      console.log('🏷️  First brand:', {
        name: data.brands[0].name,
        isActive: data.brands[0].isActive,
        earningPercentage: data.brands[0].earningPercentage,
        redemptionPercentage: data.brands[0].redemptionPercentage
      });
    }
    
    console.log('🎉 API test completed successfully!');
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testBrandsAPI();
