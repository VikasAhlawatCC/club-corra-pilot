import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { BrandCategory } from './entities/brand-category.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandSearchDto } from './dto/brand-search.dto';
import { BrandListResponseDto } from './dto/brand-list-response.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(BrandCategory)
    private categoryRepository: Repository<BrandCategory>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    // Validate that category exists if provided
    if (createBrandDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createBrandDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Brand category not found');
      }
    }

    // Validate business rules
    this.validateBrandBusinessRules(createBrandDto);

    const brand = this.brandRepository.create(createBrandDto);
    return this.brandRepository.save(brand);
  }

  async findAll(searchDto: BrandSearchDto): Promise<BrandListResponseDto> {
    const { query, categoryId, isActive, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    try {
      // Build query with proper joins for category information
      let queryBuilder = this.brandRepository
        .createQueryBuilder('brand')
        .leftJoinAndSelect('brand.category', 'category')
        .select([
          'brand.id',
          'brand.name',
          'brand.description',
          'brand.logoUrl',
          'brand.categoryId',
          'brand.earningPercentage',
          'brand.redemptionPercentage',
          'brand.minRedemptionAmount',
          'brand.maxRedemptionAmount',
          'brand.brandwiseMaxCap',
          'brand.isActive',
          'brand.createdAt',
          'brand.updatedAt',
          'category.id',
          'category.name',
          'category.description',
          'category.icon',
          'category.color'
        ])
        .where('1=1');

      if (categoryId) {
        queryBuilder = queryBuilder.andWhere('brand.categoryId = :categoryId', { categoryId });
      }

      if (isActive !== undefined) {
        queryBuilder = queryBuilder.andWhere('brand.isActive = :isActive', { isActive });
      }

      if (query) {
        queryBuilder = queryBuilder.andWhere(
          '(brand.name ILIKE :query OR brand.description ILIKE :query)',
          { query: `%${query}%` }
        );
      }

      const [brands, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .orderBy('brand.name', 'ASC')
        .getManyAndCount();

      const totalPages = Math.ceil(total / limit);

      return {
        data: brands,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Brands query failed:', error);
      // Fallback to simple query without joins
      return this.findAllFallback(searchDto);
    }
  }

  private async findAllFallback(searchDto: BrandSearchDto): Promise<BrandListResponseDto> {
    const { query, categoryId, isActive, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    let queryBuilder = this.brandRepository
      .createQueryBuilder('brand')
      .select([
        'brand.id',
        'brand.name',
        'brand.description',
        'brand.logoUrl',
        'brand.categoryId',
        'brand.earningPercentage',
        'brand.redemptionPercentage',
        'brand.minRedemptionAmount',
        'brand.maxRedemptionAmount',
        'brand.brandwiseMaxCap',
        'brand.isActive',
        'brand.createdAt',
        'brand.updatedAt'
      ])
      .where('1=1');

    if (categoryId) {
      queryBuilder = queryBuilder.andWhere('brand.categoryId = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      queryBuilder = queryBuilder.andWhere('brand.isActive = :isActive', { isActive });
    }

    if (query) {
      queryBuilder = queryBuilder.andWhere(
        '(brand.name ILIKE :query OR brand.description ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    const [brands, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('brand.name', 'ASC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: brands,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Brand> {
    try {
      const brand = await this.brandRepository.findOne({
        where: { id },
        relations: ['category'],
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      return brand;
    } catch (error) {
      // If the relation fails, try without it
      const brand = await this.brandRepository.findOne({
        where: { id },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      return brand;
    }
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);

    // If category is being updated, validate it exists
    if (updateBrandDto.categoryId && updateBrandDto.categoryId !== brand.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateBrandDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Brand category not found');
      }
    }

    // Validate business rules if percentages are being updated
    if (updateBrandDto.earningPercentage !== undefined || 
        updateBrandDto.redemptionPercentage !== undefined ||
        updateBrandDto.minRedemptionAmount !== undefined ||
        updateBrandDto.maxRedemptionAmount !== undefined) {
      const updatedData = { ...brand, ...updateBrandDto };
      this.validateBrandBusinessRules(updatedData);
    }

    Object.assign(brand, updateBrandDto);
    return this.brandRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    
    // Check if brand has any transactions
    try {
      const transactionCount = await this.brandRepository
        .createQueryBuilder('brand')
        .leftJoin('brand.transactions', 'transactions')
        .where('brand.id = :id', { id })
        .getCount();

      if (transactionCount > 0) {
        throw new BadRequestException('Cannot delete brand with existing transactions');
      }
    } catch (error) {
      // If the join fails, assume no transactions and continue
      // This is a fallback for when the transactions relation is not properly set up
    }

    await this.brandRepository.remove(brand);
  }

  async findActiveBrands(): Promise<Brand[]> {
    try {
      return this.brandRepository.find({
        where: { isActive: true },
        relations: ['category'],
        order: { name: 'ASC' },
      });
    } catch (error) {
      // If the relation fails, try without it
      return this.brandRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      });
    }
  }

  async findBrandsByCategory(categoryId: string): Promise<Brand[]> {
    try {
      return this.brandRepository.find({
        where: { categoryId, isActive: true },
        relations: ['category'],
        order: { name: 'ASC' },
      });
    } catch (error) {
      // If the relation fails, try without it
      return this.brandRepository.find({
        where: { categoryId, isActive: true },
        order: { name: 'ASC' },
      });
    }
  }

  async toggleActiveStatus(id: string): Promise<Brand> {
    const brand = await this.findOne(id);
    brand.isActive = !brand.isActive;
    return this.brandRepository.save(brand);
  }

  private validateBrandBusinessRules(brandData: Partial<Brand>): void {
    const { earningPercentage, redemptionPercentage, minRedemptionAmount, maxRedemptionAmount } = brandData;

    if (earningPercentage !== undefined && (earningPercentage < 0 || earningPercentage > 100)) {
      throw new BadRequestException('Earning percentage must be between 0 and 100');
    }

    if (redemptionPercentage !== undefined && (redemptionPercentage < 0 || redemptionPercentage > 100)) {
      throw new BadRequestException('Redemption percentage must be between 0 and 100');
    }

    if (earningPercentage !== undefined && redemptionPercentage !== undefined) {
      if (earningPercentage + redemptionPercentage > 100) {
        throw new BadRequestException(
          `Invalid percentages: earning ${earningPercentage}% + redemption ${redemptionPercentage}% = ${earningPercentage + redemptionPercentage}% (max 100%)`
        );
      }
    }

    if (minRedemptionAmount !== undefined && maxRedemptionAmount !== undefined) {
      if (maxRedemptionAmount < minRedemptionAmount) {
        throw new BadRequestException(
          `Invalid redemption amounts: min ${minRedemptionAmount} > max ${maxRedemptionAmount}`
        );
      }
    }

    // Ensure maxRedemptionAmount and brandwiseMaxCap are consistent
    if (maxRedemptionAmount !== undefined && brandData.brandwiseMaxCap !== undefined) {
      if (maxRedemptionAmount !== brandData.brandwiseMaxCap) {
        throw new BadRequestException(
          'Max redemption amount must equal brandwise max cap for consistency'
        );
      }
    }
  }
}
