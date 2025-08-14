import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CoinsService } from '../coins.service';
import { CoinBalance } from '../entities/coin-balance.entity';
import { CoinTransaction } from '../entities/coin-transaction.entity';
import { CreateCoinTransactionDto } from '../dto/coin-transaction.dto';
import { WelcomeBonusDto } from '../dto/welcome-bonus.dto';
import { CoinAdjustmentDto } from '../dto/coin-adjustment.dto';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('CoinsService', () => {
  let service: CoinsService;
  let coinBalanceRepository: any;
  let coinTransactionRepository: any;
  let dataSource: any;

  const mockCoinBalanceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCoinTransactionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        {
          provide: getRepositoryToken(CoinBalance),
          useValue: mockCoinBalanceRepository,
        },
        {
          provide: getRepositoryToken(CoinTransaction),
          useValue: mockCoinTransactionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CoinsService>(CoinsService);
    coinBalanceRepository = module.get(getRepositoryToken(CoinBalance));
    coinTransactionRepository = module.get(getRepositoryToken(CoinTransaction));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWelcomeBonus', () => {
    const welcomeBonusDto: WelcomeBonusDto = {
      userId: 'user-123',
      amount: 100,
      description: 'Welcome Bonus',
    };

    it('should create welcome bonus successfully', async () => {
      // Mock existing welcome bonus check
      mockCoinTransactionRepository.findOne.mockResolvedValue(null);

      // Mock transaction
      const mockTransaction = { id: 'tx-123', ...welcomeBonusDto, type: 'WELCOME_BONUS' };
      const mockBalance = { userId: 'user-123', balance: 100, lastUpdated: new Date() };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn(),
          save: jest.fn(),
          findOne: jest.fn(),
        };

        mockManager.create.mockReturnValue(mockTransaction);
        mockManager.save.mockResolvedValue(mockTransaction);
        mockManager.findOne.mockResolvedValue(null);

        return callback(mockManager);
      });

      const result = await service.createWelcomeBonus(welcomeBonusDto);

      expect(result).toEqual(mockTransaction);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if welcome bonus already exists', async () => {
      mockCoinTransactionRepository.findOne.mockResolvedValue({ id: 'existing-tx' });

      await expect(service.createWelcomeBonus(welcomeBonusDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('createTransaction', () => {
    const createTransactionDto: CreateCoinTransactionDto = {
      userId: 'user-123',
      amount: 50,
      type: 'EARNED',
      description: 'Earned from purchase',
      brandId: 'brand-123',
    };

    it('should create transaction successfully', async () => {
      const mockTransaction = { id: 'tx-123', ...createTransactionDto };
      const mockBalance = { userId: 'user-123', balance: 150, lastUpdated: new Date() };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn(),
          save: jest.fn(),
          findOne: jest.fn(),
        };

        mockManager.create.mockReturnValue(mockTransaction);
        mockManager.save.mockResolvedValue(mockTransaction);
        mockManager.findOne.mockResolvedValue(mockBalance);

        return callback(mockManager);
      });

      const result = await service.createTransaction(createTransactionDto);

      expect(result).toEqual(mockTransaction);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('createAdjustment', () => {
    const adjustmentDto: CoinAdjustmentDto = {
      userId: 'user-123',
      amount: -25,
      description: 'Manual adjustment',
      reason: 'Customer service',
    };

    it('should create adjustment successfully', async () => {
      const mockTransaction = { id: 'tx-123', ...adjustmentDto, type: 'ADJUSTMENT' };
      const mockBalance = { userId: 'user-123', balance: 75, lastUpdated: new Date() };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          create: jest.fn(),
          save: jest.fn(),
          findOne: jest.fn(),
        };

        mockManager.create.mockReturnValue(mockTransaction);
        mockManager.save.mockResolvedValue(mockTransaction);
        mockManager.findOne.mockResolvedValue(mockBalance);

        return callback(mockManager);
      });

      const result = await service.createAdjustment(adjustmentDto);

      expect(result).toEqual(mockTransaction);
      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('should return existing balance', async () => {
      const mockBalance = { userId: 'user-123', balance: 100, lastUpdated: new Date() };
      mockCoinBalanceRepository.findOne.mockResolvedValue(mockBalance);

      const result = await service.getBalance('user-123');

      expect(result).toEqual(mockBalance);
    });

    it('should return zero balance if no record exists', async () => {
      mockCoinBalanceRepository.findOne.mockResolvedValue(null);
      mockCoinBalanceRepository.create.mockReturnValue({
        userId: 'user-123',
        balance: 0,
        lastUpdated: expect.any(Date),
      });

      const result = await service.getBalance('user-123');

      expect(result.balance).toBe(0);
      expect(mockCoinBalanceRepository.create).toHaveBeenCalled();
    });
  });

  describe('validateTransaction', () => {
    it('should validate WELCOME_BONUS transaction correctly', async () => {
      await expect(service.validateTransaction(100, 'WELCOME_BONUS')).resolves.not.toThrow();
    });

    it('should validate EARNED transaction correctly', async () => {
      await expect(service.validateTransaction(50, 'EARNED')).resolves.not.toThrow();
    });

    it('should validate REDEEMED transaction correctly', async () => {
      await expect(service.validateTransaction(-25, 'REDEEMED')).resolves.not.toThrow();
    });

    it('should throw BadRequestException for invalid WELCOME_BONUS amount', async () => {
      await expect(service.validateTransaction(-100, 'WELCOME_BONUS')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for invalid REDEEMED amount', async () => {
      await expect(service.validateTransaction(25, 'REDEEMED')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for zero amount', async () => {
      await expect(service.validateTransaction(0, 'ADJUSTMENT')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for invalid transaction type', async () => {
      await expect(service.validateTransaction(100, 'INVALID_TYPE' as any)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getTransactionSummary', () => {
    it('should return correct transaction summary', async () => {
      const mockTransactions = [
        { amount: 100, type: 'WELCOME_BONUS' },
        { amount: 50, type: 'EARNED' },
        { amount: -25, type: 'REDEEMED' },
        { amount: -10, type: 'EXPIRED' },
      ];

      mockCoinTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCoinBalanceRepository.findOne.mockResolvedValue({
        userId: 'user-123',
        balance: 115,
        lastUpdated: new Date(),
      });

      const result = await service.getTransactionSummary('user-123');

      expect(result).toEqual({
        totalEarned: 150,
        totalRedeemed: 25,
        totalExpired: 10,
        currentBalance: 115,
      });
    });
  });
});
