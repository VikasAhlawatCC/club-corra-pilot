import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandCategoriesService } from './brand-categories.service';
import { CreateBrandCategoryDto } from './dto/create-brand-category.dto';
import { UpdateBrandCategoryDto } from './dto/update-brand-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('brand-categories')
@Controller('brand-categories')
export class BrandCategoriesController {
  constructor(private readonly brandCategoriesService: BrandCategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new brand category' })
  @ApiResponse({ status: 201, description: 'Brand category created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  create(@Body() createCategoryDto: CreateBrandCategoryDto) {
    return this.brandCategoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all brand categories' })
  @ApiResponse({ status: 200, description: 'Brand categories retrieved successfully' })
  findAll() {
    return this.brandCategoriesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active brand categories' })
  @ApiResponse({ status: 200, description: 'Active brand categories retrieved successfully' })
  findActiveCategories() {
    return this.brandCategoriesService.findActiveCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand category by id' })
  @ApiResponse({ status: 200, description: 'Brand category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Brand category not found' })
  findOne(@Param('id') id: string) {
    return this.brandCategoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand category' })
  @ApiResponse({ status: 200, description: 'Brand category updated successfully' })
  @ApiResponse({ status: 404, description: 'Brand category not found' })
  @ApiResponse({ status: 409, description: 'Category with this name already exists' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateBrandCategoryDto) {
    return this.brandCategoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a brand category' })
  @ApiResponse({ status: 200, description: 'Brand category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete category with existing brands' })
  @ApiResponse({ status: 404, description: 'Brand category not found' })
  remove(@Param('id') id: string) {
    return this.brandCategoriesService.remove(id);
  }
}
