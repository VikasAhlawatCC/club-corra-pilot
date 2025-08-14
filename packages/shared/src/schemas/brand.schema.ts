import { z } from 'zod';

// Base brand schemas
export const brandCategorySchema = z.object({
  id: z.string().uuid('Invalid category ID format'),
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(100, 'Icon name too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const brandSchema = z.object({
  id: z.string().uuid('Invalid brand ID format'),
  name: z.string().min(1, 'Brand name is required').max(200, 'Brand name too long'),
  description: z.string().min(1, 'Description is required'),
  logoUrl: z.string().url('Invalid logo URL format').optional(),
  categoryId: z.string().uuid('Invalid category ID format'),
  category: brandCategorySchema.optional(),
  earningPercentage: z.number().min(0, 'Earning percentage must be non-negative').max(100, 'Earning percentage cannot exceed 100').default(30),
  redemptionPercentage: z.number().min(0, 'Redemption percentage must be non-negative').max(100, 'Redemption percentage cannot exceed 100').default(100),
  minRedemptionAmount: z.number().min(0, 'Minimum redemption amount must be non-negative').default(1),
  maxRedemptionAmount: z.number().min(0, 'Maximum redemption amount must be non-negative').default(2000),
  brandwiseMaxCap: z.number().min(0, 'Brandwise max cap must be non-negative').default(2000),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Brand creation and update schemas
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(200, 'Brand name too long'),
  description: z.string().min(1, 'Description is required'),
  logoUrl: z.string().url('Invalid logo URL format').optional(),
  categoryId: z.string().uuid('Invalid category ID format'),
  earningPercentage: z.number().min(0, 'Earning percentage must be non-negative').max(100, 'Earning percentage cannot exceed 100').default(30),
  redemptionPercentage: z.number().min(0, 'Redemption percentage must be non-negative').max(100, 'Redemption percentage cannot exceed 100').default(100),
  minRedemptionAmount: z.number().min(0, 'Minimum redemption amount must be non-negative').default(1),
  maxRedemptionAmount: z.number().min(0, 'Maximum redemption amount must be non-negative').default(2000),
  brandwiseMaxCap: z.number().min(0, 'Brandwise max cap must be non-negative').default(2000),
});

export const updateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(200, 'Brand name too long').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  logoUrl: z.string().url('Invalid logo URL format').optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  earningPercentage: z.number().min(0, 'Earning percentage must be non-negative').max(100, 'Earning percentage cannot exceed 100').optional(),
  redemptionPercentage: z.number().min(0, 'Redemption percentage must be non-negative').max(100, 'Redemption percentage cannot exceed 100').optional(),
  minRedemptionAmount: z.number().min(0, 'Minimum redemption amount must be non-negative').optional(),
  maxRedemptionAmount: z.number().min(0, 'Maximum redemption amount must be non-negative').optional(),
  brandwiseMaxCap: z.number().min(0, 'Brandwise max cap must be non-negative').optional(),
  isActive: z.boolean().optional(),
});

// Brand search and filtering schemas
export const brandSearchSchema = z.object({
  query: z.string().max(200, 'Search query too long').optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  isActive: z.boolean().optional(),
});

export const brandListResponseSchema = z.object({
  brands: z.array(brandSchema),
  total: z.number().int().min(0, 'Total must be non-negative'),
  page: z.number().int().min(1, 'Page must be at least 1'),
  limit: z.number().int().min(1, 'Limit must be at least 1'),
  totalPages: z.number().int().min(0, 'Total pages must be non-negative'),
});

// Brand category schemas
export const createBrandCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(100, 'Icon name too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

export const updateBrandCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  icon: z.string().max(100, 'Icon name too long').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

// Type exports
export type Brand = z.infer<typeof brandSchema>;
export type BrandCategory = z.infer<typeof brandCategorySchema>;
export type CreateBrandRequest = z.infer<typeof createBrandSchema>;
export type UpdateBrandRequest = z.infer<typeof updateBrandSchema>;
export type BrandSearchRequest = z.infer<typeof brandSearchSchema>;
export type BrandListResponse = z.infer<typeof brandListResponseSchema>;
export type CreateBrandCategoryRequest = z.infer<typeof createBrandCategorySchema>;
export type UpdateBrandCategoryRequest = z.infer<typeof updateBrandCategorySchema>;
