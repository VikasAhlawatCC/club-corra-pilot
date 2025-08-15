import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { BrandCategory } from './entities/brand-category.entity';
import { BrandCategoriesModule } from './brand-categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Brand, BrandCategory]),
    BrandCategoriesModule,
  ],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
