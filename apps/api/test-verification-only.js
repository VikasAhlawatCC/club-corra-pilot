const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function testVerificationOnly() {
  try {
    console.log('🧪 Testing OTP Verification Only...\n');

    // Test OTP verification with the code 9837 that was generated
    console.log('1️⃣ Testing OTP verification with code: 9837');
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: '+918397070108',
        code: '9837',
        type: 'SMS'
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('📝 Verification response:', verifyData);

    if (verifyResponse.ok) {
      console.log('✅ OTP verification successful! User should now exist.');
      
      // Test password setup (this should now work)
      console.log('\n2️⃣ Testing password setup...');
      const passwordResponse = await fetch(`${API_BASE}/auth/setup-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: '+918397070108',
          password: 'testpassword123',
          confirmPassword: 'testpassword123'
        })
      });

      const passwordData = await passwordResponse.json();
      console.log('📝 Password setup response:', passwordData);

      if (passwordResponse.ok) {
        console.log('✅ Password setup successful! Auth flow is working.');
      } else {
        console.log('❌ Password setup failed:', passwordData);
      }
    } else {
      console.log('❌ OTP verification failed:', verifyData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVerificationOnly();
