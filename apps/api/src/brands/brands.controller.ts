import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandSearchDto } from './dto/brand-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get('test')
  @ApiOperation({ summary: 'Test brands endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  test() {
    return {
      success: true,
      message: 'Brands endpoint is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all brands with search and pagination' })
  @ApiResponse({ status: 200, description: 'Brands retrieved successfully' })
  findAll(@Query() searchDto: BrandSearchDto) {
    return this.brandsService.findAll(searchDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active brands' })
  @ApiResponse({ status: 200, description: 'Active brands retrieved successfully' })
  findActiveBrands() {
    return this.brandsService.findActiveBrands();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get brands by category' })
  @ApiResponse({ status: 200, description: 'Brands by category retrieved successfully' })
  findBrandsByCategory(@Param('categoryId') categoryId: string) {
    return this.brandsService.findBrandsByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by id' })
  @ApiResponse({ status: 200, description: 'Brand retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand' })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle brand active status' })
  @ApiResponse({ status: 200, description: 'Brand status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  toggleActiveStatus(@Param('id') id: string) {
    return this.brandsService.toggleActiveStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a brand' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete brand with transactions' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
