const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Auth Flow...\n');

    // Step 1: Request OTP
    console.log('1️⃣ Requesting OTP...');
    const otpResponse = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobileNumber: '+918397070108',
        type: 'SMS'
      })
    });

    if (!otpResponse.ok) {
      throw new Error(`OTP request failed: ${otpResponse.status}`);
    }

    const otpData = await otpResponse.json();
    console.log('✅ OTP requested successfully:', otpData.message);

    // Step 2: Wait a moment for OTP to be generated
    console.log('\n⏳ Waiting for OTP generation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Try to verify with a dummy OTP (this should fail)
    console.log('\n2️⃣ Testing OTP verification with dummy code...');
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
      
      // Step 4: Try to set password (this should now work)
      console.log('\n3️⃣ Testing password setup...');
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
      console.log('❌ OTP verification failed (expected with dummy code):', verifyData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();
