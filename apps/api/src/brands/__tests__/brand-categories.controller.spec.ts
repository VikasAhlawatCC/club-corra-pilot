import { Test, TestingModule } from '@nestjs/testing';
import { BrandCategoriesController } from '../brand-categories.controller';
import { BrandCategoriesService } from '../brand-categories.service';
import { CreateBrandCategoryDto } from '../dto/create-brand-category.dto';
import { UpdateBrandCategoryDto } from '../dto/update-brand-category.dto';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('BrandCategoriesController', () => {
  let controller: BrandCategoriesController;
  let service: BrandCategoriesService;

  const mockBrandCategoriesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findActiveCategories: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandCategoriesController],
      providers: [
        {
          provide: BrandCategoriesService,
          useValue: mockBrandCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<BrandCategoriesController>(BrandCategoriesController);
    service = module.get<BrandCategoriesService>(BrandCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createCategoryDto: CreateBrandCategoryDto = {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      icon: 'device-phone-mobile',
      color: '#FF5733',
    };

    it('should create a new category', async () => {
      const expectedResult = { id: 'category-123', ...createCategoryDto };
      mockBrandCategoriesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createCategoryDto);

      expect(result).toEqual(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createCategoryDto);
    });

    it('should handle service errors', async () => {
      const error = new ConflictException('Category with this name already exists');
      mockBrandCategoriesService.create.mockRejectedValue(error);

      await expect(controller.create(createCategoryDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const expectedCategories = [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Fashion' },
      ];
      mockBrandCategoriesService.findAll.mockResolvedValue(expectedCategories);

      const result = await controller.findAll();

      expect(result).toEqual(expectedCategories);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findActiveCategories', () => {
    it('should return active categories', async () => {
      const expectedCategories = [
        { id: '1', name: 'Electronics' },
        { id: '2', name: 'Fashion' },
      ];
      mockBrandCategoriesService.findActiveCategories.mockResolvedValue(expectedCategories);

      const result = await controller.findActiveCategories();

      expect(result).toEqual(expectedCategories);
      expect(service.findActiveCategories).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      const expectedCategory = { id: 'category-123', name: 'Electronics' };
      mockBrandCategoriesService.findOne.mockResolvedValue(expectedCategory);

      const result = await controller.findOne('category-123');

      expect(result).toEqual(expectedCategory);
      expect(service.findOne).toHaveBeenCalledWith('category-123');
    });

    it('should handle not found error', async () => {
      const error = new NotFoundException('Brand category not found');
      mockBrandCategoriesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCategoryDto: UpdateBrandCategoryDto = {
      name: 'Updated Electronics',
      description: 'Updated description',
    };

    it('should update a category', async () => {
      const expectedResult = { 
        id: 'category-123', 
        name: 'Updated Electronics',
        description: 'Updated description',
        icon: 'device-phone-mobile',
        color: '#FF5733',
      };
      mockBrandCategoriesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update('category-123', updateCategoryDto);

      expect(result).toEqual(expectedResult);
      expect(service.update).toHaveBeenCalledWith('category-123', updateCategoryDto);
    });

    it('should handle not found error', async () => {
      const error = new NotFoundException('Brand category not found');
      mockBrandCategoriesService.update.mockRejectedValue(error);

      await expect(controller.update('non-existent', updateCategoryDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle conflict error', async () => {
      const error = new ConflictException('Category with this name already exists');
      mockBrandCategoriesService.update.mockRejectedValue(error);

      await expect(controller.update('category-123', updateCategoryDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      mockBrandCategoriesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('category-123');

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('category-123');
    });

    it('should handle not found error', async () => {
      const error = new NotFoundException('Brand category not found');
      mockBrandCategoriesService.remove.mockRejectedValue(error);

      await expect(controller.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should handle bad request error', async () => {
      const error = new BadRequestException('Cannot delete category with existing brands');
      mockBrandCategoriesService.remove.mockRejectedValue(error);

      await expect(controller.remove('category-123')).rejects.toThrow(BadRequestException);
    });
  });
});
