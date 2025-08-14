"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentResponseSchema = exports.profileResponseSchema = exports.otpResponseSchema = exports.authResponseSchema = exports.paymentUpdateSchema = exports.profileUpdateSchema = exports.refreshTokenSchema = exports.oauthLoginSchema = exports.emailLoginSchema = exports.mobileLoginSchema = exports.verifyOtpSchema = exports.requestOtpSchema = exports.oauthSignupSchema = exports.signupSchema = exports.otpSchema = exports.emailSchema = exports.mobileNumberSchema = void 0;
const zod_1 = require("zod");
exports.mobileNumberSchema = zod_1.z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .regex(/^\+?[0-9]+$/, 'Mobile number must contain only digits and optional + prefix');
exports.emailSchema = zod_1.z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required');
exports.otpSchema = zod_1.z
    .string()
    .min(4, 'OTP must be at least 4 digits')
    .max(6, 'OTP must not exceed 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only digits');
exports.signupSchema = zod_1.z.object({
    mobileNumber: exports.mobileNumberSchema,
    email: exports.emailSchema.optional(),
    authProvider: zod_1.z.enum(['SMS', 'EMAIL', 'GOOGLE', 'FACEBOOK']),
    profile: zod_1.z.object({
        firstName: zod_1.z.string().min(1, 'First name is required').max(100, 'First name too long'),
        lastName: zod_1.z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
        dateOfBirth: zod_1.z.date().optional(),
        gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    }).optional(),
});
exports.oauthSignupSchema = zod_1.z.object({
    mobileNumber: exports.mobileNumberSchema,
    oauthProvider: zod_1.z.enum(['GOOGLE', 'FACEBOOK']),
    oauthToken: zod_1.z.string().min(1, 'OAuth token is required'),
    profile: zod_1.z.object({
        firstName: zod_1.z.string().min(1, 'First name is required').max(100, 'First name too long'),
        lastName: zod_1.z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
        email: exports.emailSchema.optional(),
    }).optional(),
});
exports.requestOtpSchema = zod_1.z.object({
    mobileNumber: exports.mobileNumberSchema.optional(),
    email: exports.emailSchema.optional(),
    type: zod_1.z.enum(['SMS', 'EMAIL']),
}).refine((data) => {
    if (data.type === 'SMS' && !data.mobileNumber) {
        return false;
    }
    if (data.type === 'EMAIL' && !data.email) {
        return false;
    }
    return true;
}, {
    message: 'Mobile number is required for SMS OTP, email is required for email OTP',
    path: ['type'],
});
exports.verifyOtpSchema = zod_1.z.object({
    mobileNumber: exports.mobileNumberSchema.optional(),
    email: exports.emailSchema.optional(),
    code: exports.otpSchema,
    type: zod_1.z.enum(['SMS', 'EMAIL']),
}).refine((data) => {
    if (data.type === 'SMS' && !data.mobileNumber) {
        return false;
    }
    if (data.type === 'EMAIL' && !data.email) {
        return false;
    }
    return true;
}, {
    message: 'Mobile number is required for SMS OTP verification, email is required for email OTP verification',
    path: ['type'],
});
exports.mobileLoginSchema = zod_1.z.object({
    mobileNumber: exports.mobileNumberSchema,
    otpCode: exports.otpSchema,
});
exports.emailLoginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.oauthLoginSchema = zod_1.z.object({
    provider: zod_1.z.enum(['GOOGLE', 'FACEBOOK']),
    accessToken: zod_1.z.string().min(1, 'Access token is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.profileUpdateSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').max(100, 'First name too long').optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(100, 'Last name too long').optional(),
    dateOfBirth: zod_1.z.date().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    address: zod_1.z.object({
        street: zod_1.z.string().max(200, 'Street too long').optional(),
        city: zod_1.z.string().max(100, 'City too long').optional(),
        state: zod_1.z.string().max(100, 'State too long').optional(),
        country: zod_1.z.string().max(100, 'Country too long').optional(),
        postalCode: zod_1.z.string().max(20, 'Postal code too long').optional(),
    }).optional(),
});
exports.paymentUpdateSchema = zod_1.z.object({
    upiId: zod_1.z.string().min(1, 'UPI ID is required').max(100, 'UPI ID too long'),
});
exports.authResponseSchema = zod_1.z.object({
    user: zod_1.z.object({
        id: zod_1.z.string(),
        mobileNumber: zod_1.z.string(),
        email: zod_1.z.string().optional(),
        status: zod_1.z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED']),
        isMobileVerified: zod_1.z.boolean(),
        isEmailVerified: zod_1.z.boolean(),
        hasWelcomeBonusProcessed: zod_1.z.boolean().optional(),
        createdAt: zod_1.z.date(),
        updatedAt: zod_1.z.date(),
    }),
    tokens: zod_1.z.object({
        accessToken: zod_1.z.string(),
        refreshToken: zod_1.z.string(),
        expiresIn: zod_1.z.number(),
        tokenType: zod_1.z.literal('Bearer'),
    }),
});
exports.otpResponseSchema = zod_1.z.object({
    message: zod_1.z.string(),
    expiresIn: zod_1.z.number(),
});
exports.profileResponseSchema = zod_1.z.object({
    profile: zod_1.z.object({
        firstName: zod_1.z.string(),
        lastName: zod_1.z.string(),
        dateOfBirth: zod_1.z.date().optional(),
        gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
        profilePicture: zod_1.z.string().optional(),
        address: zod_1.z.object({
            street: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            country: zod_1.z.string().optional(),
            postalCode: zod_1.z.string().optional(),
        }).optional(),
    }),
});
exports.paymentResponseSchema = zod_1.z.object({
    paymentDetails: zod_1.z.object({
        upiId: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=auth.schema.js.map