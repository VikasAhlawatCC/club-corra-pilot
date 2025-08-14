const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function checkOtpStatus() {
  try {
    console.log('🔍 Checking OTP Status...\n');

    // Step 1: Request a new OTP
    console.log('1️⃣ Requesting new OTP...');
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

    // Step 3: Check what OTP was generated (from logs)
    console.log('\n2️⃣ Check the backend logs for the generated OTP code');
    console.log('   Run: grep "Generated OTP" backend.log | tail -1');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkOtpStatus();
