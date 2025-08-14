import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio | null = null;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio not configured. SMS sending disabled.');
    }
  }

  async sendOtp(mobileNumber: string, otpCode: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('[PILOT MODE] Twilio not configured, skipping SMS send');
        return true; // Do not block auth flow in non-configured environments
      }

      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!fromNumber) {
        this.logger.error('TWILIO_PHONE_NUMBER not configured');
        return false;
      }

      const message = await this.twilioClient.messages.create({
        body: `Your Club Corra verification code is: ${otpCode}. Valid for 5 minutes.`,
        from: fromNumber,
        to: mobileNumber,
      });

      this.logger.log(`SMS sent successfully to ${mobileNumber}, SID: ${message.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${mobileNumber}: ${error?.message || error}`);
      return false;
    }
  }

  async sendWelcomeMessage(mobileNumber: string, firstName: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('[PILOT MODE] Twilio not configured, skipping welcome SMS');
        return true;
      }

      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!fromNumber) {
        this.logger.error('TWILIO_PHONE_NUMBER not configured');
        return false;
      }

      const message = await this.twilioClient.messages.create({
        body: `Welcome to Club Corra, ${firstName}! Your account has been successfully created.`,
        from: fromNumber,
        to: mobileNumber,
      });

      this.logger.log(`Welcome SMS sent successfully to ${mobileNumber}, SID: ${message.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome SMS to ${mobileNumber}: ${error?.message || error}`);
      return false;
    }
  }

  async sendLoginNotification(mobileNumber: string, location?: string): Promise<boolean> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('[PILOT MODE] Twilio not configured, skipping login notification SMS');
        return true;
      }

      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
      if (!fromNumber) {
        this.logger.error('TWILIO_PHONE_NUMBER not configured');
        return false;
      }

      const locationText = location ? ` from ${location}` : '';
      const message = await this.twilioClient.messages.create({
        body: `New login detected${locationText}. If this wasn't you, please contact support immediately.`,
        from: fromNumber,
        to: mobileNumber,
      });

      this.logger.log(`Login notification SMS sent successfully to ${mobileNumber}, SID: ${message.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send login notification SMS to ${mobileNumber}: ${error?.message || error}`);
      return false;
    }
  }
}
