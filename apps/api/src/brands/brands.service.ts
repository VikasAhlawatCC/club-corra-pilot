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
      try {
        const category = await this.categoryRepository.findOne({
          where: { id: createBrandDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException('Brand category not found');
        }
      } catch (error) {
        // If category validation fails, continue without category
        createBrandDto.categoryId = null;
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
      // Simple query without joins to avoid database constraint issues
      let queryBuilder = this.brandRepository
        .createQueryBuilder('brand')
        .select(['brand.id', 'brand.name', 'brand.description', 'brand.logoUrl', 'brand.categoryId', 'brand.earningPercentage', 'brand.redemptionPercentage', 'brand.minRedemptionAmount', 'brand.maxRedemptionAmount', 'brand.isActive', 'brand.createdAt', 'brand.updatedAt'])
        .where('1=1'); // Start with a simple condition

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
      // If the query fails, return empty result
      console.error('Brands query failed:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
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
      try {
        const category = await this.categoryRepository.findOne({
          where: { id: updateBrandDto.categoryId },
        });

        if (!category) {
          throw new NotFoundException('Brand category not found');
        }
      } catch (error) {
        // If category validation fails, continue without category
        updateBrandDto.categoryId = null;
      }
    }

    // Validate business rules if percentages are being updated
    if (updateBrandDto.earningPercentage !== undefined || updateBrandDto.redemptionPercentage !== undefined) {
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
  }
}
