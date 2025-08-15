import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandCategoriesService } from '../brand-categories.service';
import { BrandCategory } from '../entities/brand-category.entity';
import { CreateBrandCategoryDto } from '../dto/create-brand-category.dto';
import { UpdateBrandCategoryDto } from '../dto/update-brand-category.dto';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('BrandCategoriesService', () => {
  let service: BrandCategoriesService;
  let categoryRepository: any;

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandCategoriesService,
        {
          provide: getRepositoryToken(BrandCategory),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<BrandCategoriesService>(BrandCategoriesService);
    categoryRepository = module.get(getRepositoryToken(BrandCategory));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateBrandCategoryDto = {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      icon: 'device-phone-mobile',
      color: '#FF5733',
    };

    it('should create category successfully', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);
      mockCategoryRepository.create.mockReturnValue(createCategoryDto);
      mockCategoryRepository.save.mockResolvedValue({ id: 'category-123', ...createCategoryDto });

      const result = await service.create(createCategoryDto);

      expect(result).toEqual({ id: 'category-123', ...createCategoryDto });
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(createCategoryDto);
      expect(mockCategoryRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if category with same name exists', async () => {
      const existingCategory = { id: 'existing-123', name: 'Electronics' };
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);

      await expect(service.create(createCategoryDto)).rejects.toThrow(ConflictException);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: createCategoryDto.name },
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      const mockCategories = [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Fashion' },
      ];
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return category by id', async () => {
      const mockCategory = { id: 'category-123', name: 'Electronics' };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('category-123');

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-123' },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateBrandCategoryDto = {
      name: 'Updated Electronics',
      description: 'Updated description',
    };

    it('should update category successfully', async () => {
      const existingCategory = { id: 'category-123', name: 'Electronics' };
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(existingCategory) // First call for findOne
        .mockResolvedValueOnce(null); // Second call for name conflict check
      mockCategoryRepository.save.mockResolvedValue({ ...existingCategory, ...updateCategoryDto });

      const result = await service.update('category-123', updateCategoryDto);

      expect(result).toEqual({ ...existingCategory, ...updateCategoryDto });
      expect(mockCategoryRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', updateCategoryDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if name conflicts with existing category', async () => {
      const existingCategory = { id: 'category-123', name: 'Electronics' };
      const conflictingCategory = { id: 'category-456', name: 'Updated Electronics' };
      
      mockCategoryRepository.findOne
        .mockResolvedValueOnce(existingCategory) // First call for findOne
        .mockResolvedValueOnce(conflictingCategory); // Second call for name conflict check

      await expect(service.update('category-123', updateCategoryDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete category successfully when no brands exist', async () => {
      const existingCategory = { id: 'category-123', name: 'Electronics' };
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);
      
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockCategoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      
      mockCategoryRepository.remove.mockResolvedValue(undefined);

      await service.remove('category-123');

      expect(mockCategoryRepository.remove).toHaveBeenCalledWith(existingCategory);
    });

    it('should throw BadRequestException if category has brands', async () => {
      const existingCategory = { id: 'category-123', name: 'Electronics' };
      mockCategoryRepository.findOne.mockResolvedValue(existingCategory);
      
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5), // 5 brands exist
      };
      mockCategoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.remove('category-123')).rejects.toThrow(BadRequestException);
      expect(mockCategoryRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByName', () => {
    it('should return category by name', async () => {
      const mockCategory = { id: 'category-123', name: 'Electronics' };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findByName('Electronics');

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Electronics' },
      });
    });

    it('should return null if category not found by name', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('Non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findActiveCategories', () => {
    it('should return all active categories ordered by name', async () => {
      const mockCategories = [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Fashion' },
      ];
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findActiveCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });
});
