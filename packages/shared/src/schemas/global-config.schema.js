"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemConfigSchema = exports.fileUploadConfigSchema = exports.transactionConfigSchema = exports.brandDefaultsConfigSchema = exports.globalConfigListResponseSchema = exports.globalConfigSearchSchema = exports.updateGlobalConfigSchema = exports.createGlobalConfigSchema = exports.globalConfigSchema = void 0;
const zod_1 = require("zod");
exports.globalConfigSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid config ID format'),
    key: zod_1.z.string().min(1, 'Config key is required').max(100, 'Config key too long'),
    value: zod_1.z.string().min(1, 'Config value is required'),
    description: zod_1.z.string().max(200, 'Description too long').optional(),
    type: zod_1.z.enum(['string', 'number', 'boolean', 'json']),
    isEditable: zod_1.z.boolean(),
    category: zod_1.z.string().max(100, 'Category too long').optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.createGlobalConfigSchema = zod_1.z.object({
    key: zod_1.z.string().min(1, 'Config key is required').max(100, 'Config key too long'),
    value: zod_1.z.string().min(1, 'Config value is required'),
    description: zod_1.z.string().max(200, 'Description too long').optional(),
    type: zod_1.z.enum(['string', 'number', 'boolean', 'json']),
    isEditable: zod_1.z.boolean().default(false),
    category: zod_1.z.string().max(100, 'Category too long').optional(),
});
exports.updateGlobalConfigSchema = zod_1.z.object({
    value: zod_1.z.string().min(1, 'Config value is required'),
    description: zod_1.z.string().max(200, 'Description too long').optional(),
    isEditable: zod_1.z.boolean().optional(),
    category: zod_1.z.string().max(100, 'Category too long').optional(),
});
exports.globalConfigSearchSchema = zod_1.z.object({
    category: zod_1.z.string().max(100, 'Category too long').optional(),
    isEditable: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
});
exports.globalConfigListResponseSchema = zod_1.z.object({
    configs: zod_1.z.array(exports.globalConfigSchema),
    total: zod_1.z.number().int().min(0, 'Total must be non-negative'),
    page: zod_1.z.number().int().min(1, 'Page must be at least 1'),
    limit: zod_1.z.number().int().min(1, 'Limit must be at least 1'),
    totalPages: zod_1.z.number().int().min(0, 'Total pages must be non-negative'),
});
exports.brandDefaultsConfigSchema = zod_1.z.object({
    earningPercentage: zod_1.z.number().min(0).max(100).default(30),
    redemptionPercentage: zod_1.z.number().min(0).max(100).default(100),
    overallMaxCap: zod_1.z.number().min(0).default(2000),
    brandwiseMaxCap: zod_1.z.number().min(0).default(2000),
});
exports.transactionConfigSchema = zod_1.z.object({
    minBillAmount: zod_1.z.number().min(0).default(10),
    maxBillAgeDays: zod_1.z.number().min(1).default(30),
    fraudPreventionHours: zod_1.z.number().min(1).default(24),
});
exports.fileUploadConfigSchema = zod_1.z.object({
    maxFileSizeMB: zod_1.z.number().min(1).default(10),
    allowedFileTypes: zod_1.z.array(zod_1.z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
});
exports.systemConfigSchema = zod_1.z.object({
    systemMaintenanceMode: zod_1.z.boolean().default(false),
    welcomeBonusAmount: zod_1.z.number().min(0).default(100),
});
//# sourceMappingURL=global-config.schema.js.map