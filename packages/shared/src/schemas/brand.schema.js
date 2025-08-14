"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBrandCategorySchema = exports.createBrandCategorySchema = exports.brandListResponseSchema = exports.brandSearchSchema = exports.updateBrandSchema = exports.createBrandSchema = exports.brandSchema = exports.brandCategorySchema = void 0;
const zod_1 = require("zod");
exports.brandCategorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid category ID format'),
    name: zod_1.z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    icon: zod_1.z.string().max(100, 'Icon name too long').optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.brandSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid brand ID format'),
    name: zod_1.z.string().min(1, 'Brand name is required').max(200, 'Brand name too long'),
    description: zod_1.z.string().min(1, 'Description is required'),
    logoUrl: zod_1.z.string().url('Invalid logo URL format').optional(),
    categoryId: zod_1.z.string().uuid('Invalid category ID format'),
    category: exports.brandCategorySchema.optional(),
    earningPercentage: zod_1.z.number().min(0, 'Earning percentage must be non-negative').max(100, 'Earning percentage cannot exceed 100').default(30),
    redemptionPercentage: zod_1.z.number().min(0, 'Redemption percentage must be non-negative').max(100, 'Redemption percentage cannot exceed 100').default(100),
    minRedemptionAmount: zod_1.z.number().min(0, 'Minimum redemption amount must be non-negative').optional(),
    maxRedemptionAmount: zod_1.z.number().min(0, 'Maximum redemption amount must be non-negative').optional(),
    overallMaxCap: zod_1.z.number().min(0, 'Overall max cap must be non-negative').default(2000),
    brandwiseMaxCap: zod_1.z.number().min(0, 'Brandwise max cap must be non-negative').default(2000),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.createBrandSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Brand name is required').max(200, 'Brand name too long'),
    description: zod_1.z.string().min(1, 'Description is required'),
    logoUrl: zod_1.z.string().url('Invalid logo URL format').optional(),
    categoryId: zod_1.z.string().uuid('Invalid category ID format'),
    earningPercentage: zod_1.z.number().min(0, 'Earning percentage must be non-negative').max(100, 'Earning percentage cannot exceed 100').default(30),
    redemptionPercentage: zod_1.z.number().min(0, 'Redemption percentage must be non-negative').max(100, 'Redemption percentage cannot exceed 100').default(100),
    minRedemptionAmount: zod_1.z.number().min(0, 'Minimum redemption amount must be non-negative').optional(),
    maxRedemptionAmount: zod_1.z.number().min(0, 'Maximum redemption amount must be non-negative').optional(),
    overallMaxCap: zod_1.z.number().min(0, 'Overall max cap must be non-negative').default(2000),
    brandwiseMaxCap: zod_1.z.number().min(0, 'Brandwise max cap must be non-negative').default(2000),
});
exports.updateBrandSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Brand name is required').max(200, 'Brand name too long').optional(),
    description: zod_1.z.string().min(1, 'Description is required').optional(),
    logoUrl: zod_1.z.string().url('Invalid logo URL format').optional(),
    categoryId: zod_1.z.string().uuid('Invalid category ID format').optional(),
    earningPercentage: zod_1.z.number().min(0, 'Earning percentage must be non-negative').max(100, 'Earning percentage cannot exceed 100').optional(),
    redemptionPercentage: zod_1.z.number().min(0, 'Redemption percentage must be non-negative').max(100, 'Redemption percentage cannot exceed 100').optional(),
    minRedemptionAmount: zod_1.z.number().min(0, 'Minimum redemption amount must be non-negative').optional(),
    maxRedemptionAmount: zod_1.z.number().min(0, 'Maximum redemption amount must be non-negative').optional(),
    overallMaxCap: zod_1.z.number().min(0, 'Overall max cap must be non-negative').optional(),
    brandwiseMaxCap: zod_1.z.number().min(0, 'Brandwise max cap must be non-negative').optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.brandSearchSchema = zod_1.z.object({
    query: zod_1.z.string().max(200, 'Search query too long').optional(),
    categoryId: zod_1.z.string().uuid('Invalid category ID format').optional(),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
    isActive: zod_1.z.boolean().optional(),
});
exports.brandListResponseSchema = zod_1.z.object({
    brands: zod_1.z.array(exports.brandSchema),
    total: zod_1.z.number().int().min(0, 'Total must be non-negative'),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1'),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1'),
    totalPages: zod_1.z.number().int().min(0, 'Total pages must be non-negative'),
});
exports.createBrandCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    icon: zod_1.z.string().max(100, 'Icon name too long').optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});
exports.updateBrandCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Category name is required').max(100, 'Category name too long').optional(),
    description: zod_1.z.string().max(500, 'Description too long').optional(),
    icon: zod_1.z.string().max(100, 'Icon name too long').optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});
//# sourceMappingURL=brand.schema.js.map