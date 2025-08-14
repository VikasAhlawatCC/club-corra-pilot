import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from '../services/otp.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OTP } from '../entities/otp.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from '../services/rate-limit.service';
import { OTPType, OTPStatus } from '../entities/otp.entity';
import * as bcrypt from 'bcryptjs';

describe('OtpService', () => {
  let service: OtpService;
  let otpRepository: Repository<OTP>;
  let configService: ConfigService;
  let rateLimitService: RateLimitService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRateLimitService = {
    checkRateLimit: jest.fn(),
    resetRateLimit: jest.fn(),
  };

  const mockOtpRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RateLimitService, useValue: mockRateLimitService },
        { provide: getRepositoryToken(OTP), useValue: mockOtpRepository },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    otpRepository = module.get<Repository<OTP>>(getRepositoryToken(OTP));
    configService = module.get<ConfigService>(ConfigService);
    rateLimitService = module.get<RateLimitService>(RateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit numeric OTP', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);
      mockOtpRepository.update.mockResolvedValue({ affected: 0 });
      mockOtpRepository.create.mockReturnValue({
        identifier,
        type,
        code: 'hashedOtp',
        expiresAt: new Date(),
        status: OTPStatus.PENDING,
      });
      mockOtpRepository.save.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedOtp',
        expiresAt: new Date(),
        status: OTPStatus.PENDING,
      });

      const otp = await service.generateOtp(identifier, type);

      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThanOrEqual(999999);
      expect(mockRateLimitService.checkRateLimit).toHaveBeenCalledWith(
        `otp-generate:${identifier}_${type}`,
        'authenticated'
      );
    });

    it('should generate unique OTPs on multiple calls', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);
      mockOtpRepository.update.mockResolvedValue({ affected: 0 });
      mockOtpRepository.create.mockReturnValue({
        identifier,
        type,
        code: 'hashedOtp',
        expiresAt: new Date(),
        status: OTPStatus.PENDING,
      });
      mockOtpRepository.save.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedOtp',
        expiresAt: new Date(),
        status: OTPStatus.PENDING,
      });

      const otp1 = await service.generateOtp(identifier, type);
      const otp2 = await service.generateOtp(identifier, type);

      expect(otp1).not.toBe(otp2);
      expect(otp1.length).toBe(6);
      expect(otp2.length).toBe(6);
    });

    it('should throw error when rate limit is exceeded', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(false);

      await expect(service.generateOtp(identifier, type)).rejects.toThrow(
        'Too many OTP requests. Please wait before requesting another.'
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify valid OTP successfully', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      const code = '123456';
      const hashedCode = await bcrypt.hash(code, 10);
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: hashedCode,
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        attempts: 0,
      });
      mockOtpRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.verifyOtp(identifier, type, code);

      expect(result).toBe(true);
      expect(mockRateLimitService.checkRateLimit).toHaveBeenCalledWith(
        `otp-verify:${identifier}_${type}`,
        'authenticated'
      );
    });

    it('should reject expired OTP', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      const code = '123456';
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedCode',
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        attempts: 0,
      });

      await expect(service.verifyOtp(identifier, type, code)).rejects.toThrow(
        'OTP has expired'
      );
    });

    it('should reject invalid OTP code', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      const code = '123456';
      const hashedCode = await bcrypt.hash('000000', 10); // Different OTP
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: hashedCode,
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      });

      await expect(service.verifyOtp(identifier, type, code)).rejects.toThrow(
        'Invalid OTP code'
      );
    });

    it('should reject when too many attempts', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      const code = '123456';
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(true);
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedCode',
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 3, // Max attempts reached
      });

      await expect(service.verifyOtp(identifier, type, code)).rejects.toThrow(
        'Too many attempts. OTP expired'
      );
    });

    it('should throw error when rate limit is exceeded for verification', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      const code = '123456';
      
      mockRateLimitService.checkRateLimit.mockResolvedValue(false);

      await expect(service.verifyOtp(identifier, type, code)).rejects.toThrow(
        'Too many verification attempts. Please wait before trying again.'
      );
    });
  });

  describe('isOtpValid', () => {
    it('should return true for valid OTP', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedCode',
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
      });

      const result = await service.isOtpValid(identifier, type);

      expect(result).toBe(true);
    });

    it('should return false for expired OTP', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedCode',
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000),
        attempts: 0,
      });

      const result = await service.isOtpValid(identifier, type);

      expect(result).toBe(false);
    });

    it('should return false for OTP with too many attempts', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockOtpRepository.findOne.mockResolvedValue({
        id: '1',
        identifier,
        type,
        code: 'hashedCode',
        status: OTPStatus.PENDING,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 3,
      });

      const result = await service.isOtpValid(identifier, type);

      expect(result).toBe(false);
    });

    it('should return false for non-existent OTP', async () => {
      const identifier = '+919876543210';
      const type = OTPType.SMS;
      
      mockOtpRepository.findOne.mockResolvedValue(null);

      const result = await service.isOtpValid(identifier, type);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredOtps', () => {
    it('should update expired OTPs status', async () => {
      mockOtpRepository.update.mockResolvedValue({ affected: 5 });

      await service.cleanupExpiredOtps();

      expect(mockOtpRepository.update).toHaveBeenCalledWith(
        {
          status: OTPStatus.PENDING,
          expiresAt: expect.any(Object), // LessThan(now)
        },
        { status: OTPStatus.EXPIRED }
      );
    });
  });
});
