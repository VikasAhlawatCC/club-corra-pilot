import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignupDto,
  OAuthSignupDto,
} from './dto/signup.dto';
import {
  MobileLoginDto,
  MobilePasswordLoginDto,
  EmailLoginDto,
  OAuthLoginDto,
  RefreshTokenDto,
} from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { PasswordSetupDto } from './dto/password-setup.dto';
import { EmailVerificationDto } from './dto/email-verification.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetDto } from './dto/password-reset.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { 
  EmailVerificationResponse, 
  PasswordResetResponse, 
  PasswordSetupResponse 
} from '../common/interfaces/auth-response.interface';
import { SignupResponseDto } from './dto/auth-response.dto';
import { InitialSignupDto } from './dto/initial-signup.dto';
import { SignupOtpVerificationDto } from './dto/signup-otp-verification.dto';
import { SignupPasswordSetupDto } from './dto/signup-password-setup.dto';
import { SignupEmailVerificationDto } from './dto/signup-email-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('signup/initial')
  async initialSignup(@Body() initialSignupDto: InitialSignupDto) {
    return this.authService.initialSignup(initialSignupDto);
  }

  @Post('signup/verify-otp')
  async verifySignupOtp(@Body() signupOtpVerificationDto: SignupOtpVerificationDto) {
    return this.authService.verifySignupOtp(signupOtpVerificationDto);
  }

  @Post('signup/setup-password')
  async setupSignupPassword(@Body() signupPasswordSetupDto: SignupPasswordSetupDto) {
    return this.authService.setupSignupPassword(signupPasswordSetupDto);
  }

  @Post('signup/add-email')
  async addSignupEmail(@Body() signupEmailVerificationDto: SignupEmailVerificationDto) {
    return this.authService.addSignupEmail(signupEmailVerificationDto);
  }

  @Post('signup/verify-email')
  async verifySignupEmail(@Body() emailVerificationDto: EmailVerificationDto) {
    return this.authService.verifySignupEmail(emailVerificationDto);
  }

  @Post('oauth/signup')
  async oauthSignup(@Body() oauthSignupDto: OAuthSignupDto) {
    return this.authService.oauthSignup(oauthSignupDto);
  }

  @Post('request-otp')
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('login/mobile')
  @HttpCode(HttpStatus.OK)
  async mobileLogin(@Body() mobileLoginDto: MobileLoginDto) {
    return this.authService.mobileLogin(mobileLoginDto);
  }

  @Post('login/mobile-password')
  @HttpCode(HttpStatus.OK)
  async mobilePasswordLogin(@Body() mobilePasswordLoginDto: MobilePasswordLoginDto) {
    return this.authService.mobilePasswordLogin(mobilePasswordLoginDto);
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  async emailLogin(@Body() emailLoginDto: EmailLoginDto) {
    return this.authService.emailLogin(emailLoginDto);
  }

  @Post('login/oauth')
  @HttpCode(HttpStatus.OK)
  async oauthLogin(@Body() oauthLoginDto: OAuthLoginDto) {
    return this.authService.oauthLogin(oauthLoginDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    // In a real implementation, you might want to blacklist the refresh token
    // For now, we'll just return a success message
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    // This endpoint is already handled by the users controller
    // but we can add it here if needed for auth-specific profile data
    return { message: 'Profile endpoint - use /users/profile instead' };
  }

  // Password setup endpoint
  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  async setupPassword(@Body() passwordSetupDto: PasswordSetupDto): Promise<PasswordSetupResponse> {
    await this.authService.setupPassword(passwordSetupDto.mobileNumber, passwordSetupDto);
    return { success: true, message: 'Password set successfully' };
  }

  // Email verification endpoints
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() emailVerificationDto: EmailVerificationDto): Promise<EmailVerificationResponse> {
    return this.authService.verifyEmail(emailVerificationDto);
  }

  @Post('request-email-verification')
  @HttpCode(HttpStatus.OK)
  async requestEmailVerification(@Body() body: { email: string }): Promise<EmailVerificationResponse> {
    return this.authService.requestEmailVerification(body.email);
  }

  // Password reset endpoints
  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() passwordResetRequestDto: PasswordResetRequestDto): Promise<PasswordResetResponse> {
    return this.authService.requestPasswordReset(passwordResetRequestDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() passwordResetDto: PasswordResetDto): Promise<PasswordResetResponse> {
    return this.authService.resetPassword(passwordResetDto);
  }

  // Admin Authentication Endpoints
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() body: { email: string; password: string }) {
    return this.authService.adminLogin(body.email, body.password);
  }

  @Post('admin/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async adminVerify(@Request() req) {
    return this.authService.adminVerify(req.user);
  }
}
