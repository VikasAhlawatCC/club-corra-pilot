import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from '../../brands/brands.module';
import { BrandCategory } from '../../brands/entities/brand-category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

describe('Brand Categories Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'club_corra_test',
          entities: [BrandCategory, Brand],
          synchronize: true, // Only for tests
          logging: false,
        }),
        BrandsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await dataSource.getRepository(Brand).clear();
    await dataSource.getRepository(BrandCategory).clear();
  });

  describe('Brand Categories CRUD Operations', () => {
    it('should create, read, update, and delete a brand category', async () => {
      const categoryRepository = dataSource.getRepository(BrandCategory);
      const brandRepository = dataSource.getRepository(Brand);

      // Create category
      const createCategoryDto = {
        name: 'Test Electronics',
        description: 'Test electronic devices',
        icon: 'device-phone-mobile',
        color: '#FF5733',
      };

      const createdCategory = await categoryRepository.save(createCategoryDto);
      expect(createdCategory.id).toBeDefined();
      expect(createdCategory.name).toBe(createCategoryDto.name);
      expect(createdCategory.description).toBe(createCategoryDto.description);

      // Read category
      const foundCategory = await categoryRepository.findOne({
        where: { id: createdCategory.id },
      });
      expect(foundCategory).toBeDefined();
      expect(foundCategory.name).toBe(createCategoryDto.name);

      // Update category
      const updateData = { description: 'Updated description' };
      await categoryRepository.update(createdCategory.id, updateData);
      
      const updatedCategory = await categoryRepository.findOne({
        where: { id: createdCategory.id },
      });
      expect(updatedCategory.description).toBe(updateData.description);

      // Create a brand with this category
      const brandData = {
        name: 'Test Brand',
        description: 'Test brand description',
        categoryId: createdCategory.id,
        earningPercentage: 10,
        redemptionPercentage: 30,
        minRedemptionAmount: 1,
        maxRedemptionAmount: 1000,
        brandwiseMaxCap: 1000,
        isActive: true,
      };

      const createdBrand = await brandRepository.save(brandData);
      expect(createdBrand.categoryId).toBe(createdCategory.id);

      // Try to delete category (should fail due to existing brand)
      try {
        await categoryRepository.remove(createdCategory);
        fail('Should not be able to delete category with existing brands');
      } catch (error) {
        // Expected to fail
      }

      // Delete brand first
      await brandRepository.remove(createdBrand);

      // Now delete category
      await categoryRepository.remove(createdCategory);

      const deletedCategory = await categoryRepository.findOne({
        where: { id: createdCategory.id },
      });
      expect(deletedCategory).toBeNull();
    });

    it('should enforce unique category names', async () => {
      const categoryRepository = dataSource.getRepository(BrandCategory);

      const category1 = {
        name: 'Unique Category',
        description: 'First category',
      };

      const category2 = {
        name: 'Unique Category', // Same name
        description: 'Second category',
      };

      // Create first category
      await categoryRepository.save(category1);

      // Try to create second category with same name
      try {
        await categoryRepository.save(category2);
        fail('Should not be able to create category with duplicate name');
      } catch (error) {
        // Expected to fail due to unique constraint
        expect(error.message).toContain('duplicate key');
      }
    });
  });
});
