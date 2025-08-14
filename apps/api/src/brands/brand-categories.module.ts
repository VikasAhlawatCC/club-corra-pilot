import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandCategory } from './entities/brand-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrandCategory])],
  exports: [TypeOrmModule],
})
export class BrandCategoriesModule {}
