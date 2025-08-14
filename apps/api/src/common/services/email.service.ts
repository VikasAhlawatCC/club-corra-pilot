import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  async sendOtp(email: string, otpCode: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('SMTP not configured, skipping email send');
        return false;
      }

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM_EMAIL'),
        to: email,
        subject: 'Club Corra - Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Club Corra Verification</h2>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
            </div>
            <p>This code is valid for 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Club Corra Team</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${email}, Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('SMTP not configured, skipping welcome email');
        return false;
      }

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM_EMAIL'),
        to: email,
        subject: 'Welcome to Club Corra!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Club Corra, ${firstName}!</h2>
            <p>Your account has been successfully created. We're excited to have you on board!</p>
            <p>You can now:</p>
            <ul>
              <li>Complete your profile</li>
              <li>Add payment methods</li>
              <li>Start exploring our services</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Club Corra Team</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${email}, Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  async sendLoginNotification(email: string, location?: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        this.logger.warn('SMTP not configured, skipping login notification email');
        return false;
      }

      const locationText = location ? ` from ${location}` : '';
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM_EMAIL'),
        to: email,
        subject: 'New Login Detected - Club Corra',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Login Detected</h2>
            <p>We detected a new login to your Club Corra account${locationText}.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            <p>If this wasn't you, please:</p>
            <ol>
              <li>Change your password immediately</li>
              <li>Contact our support team</li>
              <li>Review your account activity</li>
            </ol>
            <p>If this was you, you can safely ignore this email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">Club Corra Security Team</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Login notification email sent successfully to ${email}, Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send login notification email to ${email}:`, error);
      return false;
    }
  }
}
