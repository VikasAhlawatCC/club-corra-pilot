import { Test, TestingModule } from '@nestjs/testing';
import { CoinsService } from '../coins/coins.service';
import { CoinAdminController } from '../coins/controllers/coin-admin.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoinTransaction } from '../coins/entities/coin-transaction.entity';
import { User } from '../users/entities/user.entity';
import { CoinBalance } from '../coins/entities/coin-balance.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ConnectionManager } from '../websocket/connection.manager';
import { TransactionApprovalService } from '../coins/services/transaction-approval.service';
import { PaymentProcessingService } from '../coins/services/payment-processing.service';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('Phase 1: Verification Form Implementation', () => {
  let module: TestingModule;
  let coinsService: CoinsService;
  let coinAdminController: CoinAdminController;
  let transactionRepository: Repository<CoinTransaction>;
  let userRepository: Repository<User>;

  const mockTransactionRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBalanceRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBrandRepository = {
    findOne: jest.fn(),
  };

  const mockConnectionManager = {
    sendTransactionStatusUpdate: jest.fn(),
    sendRealTimeBalanceUpdate: jest.fn(),
    sendTransactionApprovalNotification: jest.fn(),
  };

  const mockTransactionApprovalService = {
    approveEarnTransaction: jest.fn(),
    rejectEarnTransaction: jest.fn(),
    approveRedeemTransaction: jest.fn(),
    rejectRedeemTransaction: jest.fn(),
    getPendingTransactions: jest.fn(),
    getTransactionStats: jest.fn(),
  };

  const mockPaymentProcessingService = {
    processPayment: jest.fn(),
    getPaymentStats: jest.fn(),
    getPaymentSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        {
          provide: getRepositoryToken(CoinTransaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(CoinBalance),
          useValue: mockBalanceRepository,
        },
        {
          provide: getRepositoryToken(Brand),
          useValue: mockBrandRepository,
        },
        {
          provide: ConnectionManager,
          useValue: mockConnectionManager,
        },
        {
          provide: TransactionApprovalService,
          useValue: mockTransactionApprovalService,
        },
        {
          provide: PaymentProcessingService,
          useValue: mockPaymentProcessingService,
        },
      ],
      controllers: [CoinAdminController],
    }).compile();

    coinsService = module.get<CoinsService>(CoinsService);
    coinAdminController = module.get<CoinAdminController>(CoinAdminController);
    transactionRepository = module.get<Repository<CoinTransaction>>(getRepositoryToken(CoinTransaction));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CoinsService - New Methods', () => {
    describe('getUserPendingRequests', () => {
      it('should return user pending requests with pagination', async () => {
        const userId = 'user-123';
        const mockTransactions = [
          { id: 'txn-1', userId, status: 'PENDING', type: 'EARN' },
          { id: 'txn-2', userId, status: 'PENDING', type: 'REDEEM' },
        ];
        const mockTotal = 2;

        mockTransactionRepository.findAndCount.mockResolvedValue([mockTransactions, mockTotal]);

        const result = await coinsService.getUserPendingRequests(userId);

        expect(result).toEqual({
          data: mockTransactions,
          total: mockTotal,
          page: 1,
          limit: mockTotal,
          totalPages: 1,
        });
        expect(mockTransactionRepository.findAndCount).toHaveBeenCalledWith({
          where: { userId, status: 'PENDING' },
          relations: ['brand', 'user'],
          order: { createdAt: 'ASC' },
        });
      });
    });

    describe('getUserDetails', () => {
      it('should return user details with profile and payment details', async () => {
        const userId = 'user-123';
        const mockUser = {
          id: userId,
          mobileNumber: '+1234567890',
          email: 'test@example.com',
          profile: { firstName: 'John', lastName: 'Doe' },
          paymentDetails: { upiId: 'john@upi', mobileNumber: '+1234567890' },
        };

        mockUserRepository.findOne.mockResolvedValue(mockUser);

        const result = await coinsService.getUserDetails(userId);

        expect(result).toEqual(mockUser);
        expect(mockUserRepository.findOne).toHaveBeenCalledWith({
          where: { id: userId },
          relations: ['profile', 'paymentDetails'],
        });
      });

      it('should throw NotFoundException when user not found', async () => {
        const userId = 'user-123';
        mockUserRepository.findOne.mockResolvedValue(null);

        await expect(coinsService.getUserDetails(userId)).rejects.toThrow(NotFoundException);
      });
    });

    describe('canApproveRedeemRequest', () => {
      it('should return true when user has no pending earn requests', async () => {
        const userId = 'user-123';
        mockTransactionRepository.count.mockResolvedValue(0);

        const result = await coinsService.canApproveRedeemRequest(userId);

        expect(result).toBe(true);
        expect(mockTransactionRepository.count).toHaveBeenCalledWith({
          where: { userId, type: 'EARN', status: 'PENDING' },
        });
      });

      it('should return false when user has pending earn requests', async () => {
        const userId = 'user-123';
        mockTransactionRepository.count.mockResolvedValue(2);

        const result = await coinsService.canApproveRedeemRequest(userId);

        expect(result).toBe(false);
      });
    });

    describe('approveRedeemTransaction - Enhanced Validation', () => {
      it('should allow redeem approval when no pending earn requests', async () => {
        const transactionId = 'txn-123';
        const adminUserId = 'admin-123';
        const adminNotes = 'Approved';
        const mockTransaction = {
          id: transactionId,
          userId: 'user-123',
          type: 'REDEEM',
          status: 'PENDING',
        };

        mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
        mockTransactionRepository.count.mockResolvedValue(0);
        mockTransactionApprovalService.approveRedeemTransaction.mockResolvedValue({
          ...mockTransaction,
          status: 'PROCESSED',
        });

        const result = await coinsService.approveRedeemTransaction(transactionId, adminUserId, adminNotes);

        expect(result.status).toBe('PROCESSED');
        expect(mockTransactionApprovalService.approveRedeemTransaction).toHaveBeenCalledWith(
          transactionId,
          adminUserId,
          adminNotes,
        );
      });

      it('should reject redeem approval when user has pending earn requests', async () => {
        const transactionId = 'txn-123';
        const adminUserId = 'admin-123';
        const adminNotes = 'Approved';
        const mockTransaction = {
          id: transactionId,
          userId: 'user-123',
          type: 'REDEEM',
          status: 'PENDING',
        };

        mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);
        mockTransactionRepository.count.mockResolvedValue(1);

        await expect(
          coinsService.approveRedeemTransaction(transactionId, adminUserId, adminNotes),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('CoinAdminController - New Endpoints', () => {
    describe('GET /admin/coins/users/:userId/pending-requests', () => {
      it('should return user pending requests', async () => {
        const userId = 'user-123';
        const mockPendingRequests = {
          data: [{ id: 'txn-1', status: 'PENDING' }],
          total: 1,
          page: 1,
          limit: 1,
          totalPages: 1,
        };

        jest.spyOn(coinsService, 'getUserPendingRequests').mockResolvedValue(mockPendingRequests);

        const result = await coinAdminController.getUserPendingRequests(userId);

        expect(result).toEqual({
          success: true,
          message: 'User pending requests retrieved successfully',
          data: mockPendingRequests,
        });
      });
    });

    describe('GET /admin/coins/users/:userId/details', () => {
      it('should return user details', async () => {
        const userId = 'user-123';
        const mockUser = {
          id: userId,
          mobileNumber: '+1234567890',
          email: 'test@example.com',
        };

        jest.spyOn(coinsService, 'getUserDetails').mockResolvedValue(mockUser);

        const result = await coinAdminController.getUserDetails(userId);

        expect(result).toEqual({
          success: true,
          message: 'User details retrieved successfully',
          data: { user: mockUser },
        });
      });
    });

    describe('GET /admin/coins/users/:userId/verification-data', () => {
      it('should return combined user verification data', async () => {
        const userId = 'user-123';
        const mockUser = {
          id: userId,
          mobileNumber: '+1234567890',
          email: 'test@example.com',
        };
        const mockPendingRequests = {
          data: [{ id: 'txn-1', status: 'PENDING' }],
          total: 1,
        };

        jest.spyOn(coinsService, 'getUserDetails').mockResolvedValue(mockUser);
        jest.spyOn(coinsService, 'getUserPendingRequests').mockResolvedValue(mockPendingRequests);

        const result = await coinAdminController.getUserVerificationData(userId);

        expect(result).toEqual({
          success: true,
          message: 'User verification data retrieved successfully',
          data: {
            user: mockUser,
            pendingRequests: mockPendingRequests,
          },
        });
      });
    });
  });
});
