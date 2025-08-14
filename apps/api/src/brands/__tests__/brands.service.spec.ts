import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandsService } from '../brands.service';
import { Brand } from '../entities/brand.entity';
import { BrandCategory } from '../entities/brand-category.entity';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BrandsService', () => {
  let service: BrandsService;
  let brandRepository: any;
  let categoryRepository: any;

  const mockBrandRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      leftJoin: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    })),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getRepositoryToken(Brand),
          useValue: mockBrandRepository,
        },
        {
          provide: getRepositoryToken(BrandCategory),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    brandRepository = module.get(getRepositoryToken(Brand));
    categoryRepository = module.get(getRepositoryToken(BrandCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBrandDto: CreateBrandDto = {
      name: 'Test Brand',
      description: 'Test Description',
      categoryId: 'category-123',
      earningPercentage: 5,
      redemptionPercentage: 3,
              minRedemptionAmount: 1,
      maxRedemptionAmount: 1000,
      isActive: true,
    };

    const mockCategory = {
      id: 'category-123',
      name: 'Electronics',
    };

    it('should create brand successfully', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockBrandRepository.create.mockReturnValue(createBrandDto);
      mockBrandRepository.save.mockResolvedValue({ id: 'brand-123', ...createBrandDto });

      const result = await service.create(createBrandDto);

      expect(result).toEqual({ id: 'brand-123', ...createBrandDto });
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: createBrandDto.categoryId },
      });
      expect(mockBrandRepository.create).toHaveBeenCalledWith(createBrandDto);
      expect(mockBrandRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createBrandDto)).rejects.toThrow(NotFoundException);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: createBrandDto.categoryId },
      });
    });

    it('should throw BadRequestException for invalid business rules', async () => {
      const invalidDto = { ...createBrandDto, earningPercentage: 60, redemptionPercentage: 50 };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const searchDto = {
      query: 'test',
      categoryId: 'category-123',
      isActive: true,
      page: 1,
      limit: 20,
    };

    it('should return brands with pagination', async () => {
      const mockBrands = [
        { id: 'brand-1', name: 'Brand 1' },
        { id: 'brand-2', name: 'Brand 2' },
      ];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockBrands, 2]),
        leftJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
      };

      mockBrandRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(searchDto);

      expect(result).toEqual({
        data: mockBrands,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should handle search without query', async () => {
      const searchDtoWithoutQuery = { page: 1, limit: 20 };
      const mockBrands = [{ id: 'brand-1', name: 'Brand 1' }];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockBrands, 1]),
        leftJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
      };

      mockBrandRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(searchDtoWithoutQuery);

      expect(result.data).toEqual(mockBrands);
    });
  });

  describe('findOne', () => {
    it('should return brand by ID', async () => {
      const mockBrand = { id: 'brand-123', name: 'Test Brand' };
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);

      const result = await service.findOne('brand-123');

      expect(result).toEqual(mockBrand);
      expect(mockBrandRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'brand-123' },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException if brand not found', async () => {
      mockBrandRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('brand-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateBrandDto: UpdateBrandDto = {
      name: 'Updated Brand',
      earningPercentage: 6,
    };

    const existingBrand = {
      id: 'brand-123',
      name: 'Test Brand',
      categoryId: 'category-123',
      earningPercentage: 5,
      redemptionPercentage: 3,
    };

    it('should update brand successfully', async () => {
      mockBrandRepository.findOne.mockResolvedValue(existingBrand);
      mockBrandRepository.save.mockResolvedValue({ ...existingBrand, ...updateBrandDto });

      const result = await service.update('brand-123', updateBrandDto);

      expect(result).toEqual({ ...existingBrand, ...updateBrandDto });
      expect(mockBrandRepository.save).toHaveBeenCalled();
    });

    it('should validate new category if provided', async () => {
      const updateWithCategory = { ...updateBrandDto, categoryId: 'new-category-123' };
      const newCategory = { id: 'new-category-123', name: 'New Category' };

      mockBrandRepository.findOne.mockResolvedValue(existingBrand);
      mockCategoryRepository.findOne.mockResolvedValue(newCategory);
      mockBrandRepository.save.mockResolvedValue({ ...existingBrand, ...updateWithCategory });

      const result = await service.update('brand-123', updateWithCategory);

      expect(result).toEqual({ ...existingBrand, ...updateWithCategory });
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-category-123' },
      });
    });

    it('should throw NotFoundException if new category not found', async () => {
      const updateWithCategory = { ...updateBrandDto, categoryId: 'invalid-category' };
      mockBrandRepository.findOne.mockResolvedValue(existingBrand);
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('brand-123', updateWithCategory)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove brand successfully', async () => {
      const mockBrand = { id: 'brand-123', name: 'Test Brand' };
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        leftJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      mockBrandRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockBrandRepository.remove.mockResolvedValue(undefined);

      await service.remove('brand-123');

      expect(mockBrandRepository.remove).toHaveBeenCalledWith(mockBrand);
    });

    it('should throw BadRequestException if brand has transactions', async () => {
      const mockBrand = { id: 'brand-123', name: 'Test Brand' };
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        leftJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      mockBrandRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.remove('brand-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findActiveBrands', () => {
    it('should return active brands', async () => {
      const mockBrands = [
        { id: 'brand-1', name: 'Brand 1', isActive: true },
        { id: 'brand-2', name: 'Brand 2', isActive: true },
      ];

      mockBrandRepository.find.mockResolvedValue(mockBrands);

      const result = await service.findActiveBrands();

      expect(result).toEqual(mockBrands);
      expect(mockBrandRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['category'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findBrandsByCategory', () => {
    it('should return brands by category', async () => {
      const mockBrands = [
        { id: 'brand-1', name: 'Brand 1', categoryId: 'category-123' },
      ];

      mockBrandRepository.find.mockResolvedValue(mockBrands);

      const result = await service.findBrandsByCategory('category-123');

      expect(result).toEqual(mockBrands);
      expect(mockBrandRepository.find).toHaveBeenCalledWith({
        where: { categoryId: 'category-123', isActive: true },
        relations: ['category'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('toggleActiveStatus', () => {
    it('should toggle brand status', async () => {
      const mockBrand = { id: 'brand-123', name: 'Test Brand', isActive: true };
      mockBrandRepository.findOne.mockResolvedValue(mockBrand);
      mockBrandRepository.save.mockResolvedValue({ ...mockBrand, isActive: false });

      const result = await service.toggleActiveStatus('brand-123');

      expect(result.isActive).toBe(false);
      expect(mockBrandRepository.save).toHaveBeenCalled();
    });
  });

  describe('validateBrandBusinessRules', () => {
    it('should validate valid percentages', () => {
      const validBrand = {
        earningPercentage: 5,
        redemptionPercentage: 3,
        minRedemptionAmount: 1,
        maxRedemptionAmount: 1000,
      };

      expect(() => service['validateBrandBusinessRules'](validBrand)).not.toThrow();
    });

    it('should throw BadRequestException for invalid earning percentage', () => {
      const invalidBrand = { earningPercentage: 150 };

      expect(() => service['validateBrandBusinessRules'](invalidBrand)).toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for invalid redemption percentage', () => {
      const invalidBrand = { redemptionPercentage: -5 };

      expect(() => service['validateBrandBusinessRules'](invalidBrand)).toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for combined percentages exceeding 100', () => {
      const invalidBrand = { earningPercentage: 60, redemptionPercentage: 50 };

      expect(() => service['validateBrandBusinessRules'](invalidBrand)).toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for invalid redemption amounts', () => {
      const invalidBrand = { minRedemptionAmount: 1000, maxRedemptionAmount: 500 };

      expect(() => service['validateBrandBusinessRules'](invalidBrand)).toThrow(
        BadRequestException
      );
    });
  });
});
