import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandCategory } from './entities/brand-category.entity';
import { BrandCategoriesService } from './brand-categories.service';
import { BrandCategoriesController } from './brand-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandCategory])],
  controllers: [BrandCategoriesController],
  providers: [BrandCategoriesService],
  exports: [BrandCategoriesService, TypeOrmModule],
})
export class BrandCategoriesModule {}
