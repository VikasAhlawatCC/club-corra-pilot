"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchemas = exports.jwtPayloadSchema = exports.authTokenSchema = exports.userOtpVerificationSchema = exports.userSchema = exports.authProviderLinkSchema = exports.paymentDetailsSchema = exports.userProfileSchema = exports.addressSchema = exports.upiIdSchema = exports.genderSchema = exports.dateOfBirthSchema = exports.lastNameSchema = exports.firstNameSchema = void 0;
const zod_1 = require("zod");
exports.firstNameSchema = zod_1.z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces');
exports.lastNameSchema = zod_1.z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces');
exports.dateOfBirthSchema = zod_1.z
    .date()
    .refine((date) => {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        return age - 1;
    }
    return age;
}, 'User must be at least 13 years old')
    .optional();
exports.genderSchema = zod_1.z
    .enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
    .optional();
exports.upiIdSchema = zod_1.z
    .string()
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/, 'Invalid UPI ID format')
    .max(50, 'UPI ID must not exceed 50 characters')
    .optional();
exports.addressSchema = zod_1.z.object({
    street: zod_1.z.string().max(100, 'Street address must not exceed 100 characters').optional(),
    city: zod_1.z.string().max(50, 'City must not exceed 50 characters').optional(),
    state: zod_1.z.string().max(50, 'State must not exceed 50 characters').optional(),
    country: zod_1.z.string().max(50, 'Country must not exceed 50 characters').optional(),
    postalCode: zod_1.z.string().max(10, 'Postal code must not exceed 10 characters').optional(),
});
exports.userProfileSchema = zod_1.z.object({
    firstName: exports.firstNameSchema,
    lastName: exports.lastNameSchema,
    dateOfBirth: exports.dateOfBirthSchema,
    gender: exports.genderSchema,
    profilePicture: zod_1.z.string().url('Invalid profile picture URL').optional(),
    address: exports.addressSchema.optional(),
});
exports.paymentDetailsSchema = zod_1.z.object({
    upiId: exports.upiIdSchema,
});
exports.authProviderLinkSchema = zod_1.z.object({
    provider: zod_1.z.enum(['SMS', 'EMAIL', 'GOOGLE', 'FACEBOOK']),
    providerId: zod_1.z.string().min(1, 'Provider ID is required'),
    email: zod_1.z.string().email('Invalid email format').optional(),
    linkedAt: zod_1.z.date(),
});
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid user ID format'),
    mobileNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format'),
    email: zod_1.z.string().email('Invalid email format').optional(),
    status: zod_1.z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED']),
    isMobileVerified: zod_1.z.boolean(),
    isEmailVerified: zod_1.z.boolean(),
    profile: exports.userProfileSchema.optional(),
    paymentDetails: exports.paymentDetailsSchema.optional(),
    authProviders: zod_1.z.array(exports.authProviderLinkSchema),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.userOtpVerificationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid OTP verification ID format'),
    userId: zod_1.z.string().uuid('Invalid user ID format').optional(),
    mobileNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format').optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
    otpHash: zod_1.z.string().min(1, 'OTP hash is required'),
    expiresAt: zod_1.z.date(),
    attempts: zod_1.z.number().int().min(0, 'Attempts must be a non-negative integer'),
    maxAttempts: zod_1.z.number().int().min(1, 'Max attempts must be at least 1'),
    isUsed: zod_1.z.boolean(),
    createdAt: zod_1.z.date(),
});
exports.authTokenSchema = zod_1.z.object({
    accessToken: zod_1.z.string().min(1, 'Access token is required'),
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
    expiresIn: zod_1.z.number().int().positive('Expires in must be a positive integer'),
    tokenType: zod_1.z.literal('Bearer'),
});
exports.jwtPayloadSchema = zod_1.z.object({
    sub: zod_1.z.string().uuid('Invalid user ID in JWT payload'),
    mobileNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format'),
    email: zod_1.z.string().email('Invalid email format').optional(),
    roles: zod_1.z.array(zod_1.z.string().min(1, 'Role must not be empty')),
    iat: zod_1.z.number().int().positive('Issued at must be a positive integer'),
    exp: zod_1.z.number().int().positive('Expiration must be a positive integer'),
});
exports.userSchemas = {
    userProfile: exports.userProfileSchema,
    paymentDetails: exports.paymentDetailsSchema,
    user: exports.userSchema,
};
//# sourceMappingURL=user.schema.js.map