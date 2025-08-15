import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandCategory } from './entities/brand-category.entity';
import { CreateBrandCategoryDto } from './dto/create-brand-category.dto';
import { UpdateBrandCategoryDto } from './dto/update-brand-category.dto';

@Injectable()
export class BrandCategoriesService {
  constructor(
    @InjectRepository(BrandCategory)
    private categoryRepository: Repository<BrandCategory>,
  ) {}

  async create(createCategoryDto: CreateBrandCategoryDto): Promise<BrandCategory> {
    // Check if category with same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<BrandCategory[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<BrandCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Brand category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateBrandCategoryDto): Promise<BrandCategory> {
    const category = await this.findOne(id);

    // If name is being updated, check for conflicts
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    
    // Check if category has any brands
    const brandCount = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin('category.brands', 'brands')
      .where('category.id = :id', { id })
      .getCount();

    if (brandCount > 0) {
      throw new BadRequestException('Cannot delete category with existing brands');
    }

    await this.categoryRepository.remove(category);
  }

  async findByName(name: string): Promise<BrandCategory | null> {
    return this.categoryRepository.findOne({
      where: { name },
    });
  }

  async findActiveCategories(): Promise<BrandCategory[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }
}
