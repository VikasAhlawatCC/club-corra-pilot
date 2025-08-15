import { requestOtpSchema, verifyOtpSchema, otpResponseSchema } from '@shared/schemas';

// Include Nest global prefix `/api/v1`
const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.4:3001';
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/api/v1')
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL.replace(/\/$/, '')}/api/v1`;

class OtpService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/auth/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-Client-Type': 'mobile',
        'User-Agent': 'ClubCorra-Mobile/1.0.0',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async requestOtp(identifier: string, type: 'SMS' | 'EMAIL' = 'SMS'): Promise<{ message: string; expiresIn: number }> {
    let payload;
    
    if (type === 'SMS') {
      payload = { mobileNumber: identifier, type };
    } else {
      payload = { email: identifier, type };
    }

    const validatedPayload = requestOtpSchema.parse(payload);

    return this.makeRequest('request-otp', {
      method: 'POST',
      body: JSON.stringify(validatedPayload),
    });
  }

  async verifyOtp(identifier: string, code: string, type: 'SMS' | 'EMAIL' = 'SMS'): Promise<any> {
    let payload;
    
    if (type === 'SMS') {
      payload = { mobileNumber: identifier, code, type };
    } else {
      payload = { email: identifier, code, type };
    }

    const validatedPayload = verifyOtpSchema.parse(payload);

    return this.makeRequest('verify-otp', {
      method: 'POST',
      body: JSON.stringify(validatedPayload),
    });
  }

  async resendOtp(identifier: string, type: 'SMS' | 'EMAIL' = 'SMS'): Promise<{ message: string; expiresIn: number }> {
    return this.requestOtp(identifier, type);
  }

  // Client-side OTP validation helpers
  validateOTPFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  generateMockOTP(): string {
    // This is for development/testing only
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Rate limiting helper
  private rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();
  
  checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);
    
    if (!record) {
      this.rateLimitMap.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > windowMs) {
      this.rateLimitMap.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if under limit
    if (record.count < maxAttempts) {
      record.count++;
      record.lastAttempt = now;
      return true;
    }
    
    return false;
  }

  clearRateLimit(identifier: string): void {
    this.rateLimitMap.delete(identifier);
  }
}

export const otpService = new OtpService();
