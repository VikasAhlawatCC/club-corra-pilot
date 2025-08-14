"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenExpired = exports.calculateTokenExpiry = exports.generateSessionId = exports.validateUPIId = exports.sanitizeUserInput = exports.generateUserDisplayName = exports.getAuthProviderDisplayName = exports.isUserVerified = exports.isUserActive = exports.maskEmail = exports.maskMobileNumber = exports.formatMobileNumber = exports.validateEmail = exports.validateInternationalPhoneNumber = exports.validateMobileNumber = exports.isOTPExpired = exports.calculateOTPExpiry = exports.verifyOTPHash = exports.hashOTP = exports.generateSecureToken = exports.generateOTP = exports.generateId = exports.formatDate = exports.AUTH_CONSTANTS = void 0;
const types_1 = require("./types");
const crypto_js_1 = require("crypto-js");
exports.AUTH_CONSTANTS = {
    OTP_LENGTH: 6,
    OTP_EXPIRY_MINUTES: 5,
    TOKEN_EXPIRY_HOURS: 24,
    MAX_OTP_ATTEMPTS: 3,
    SESSION_ID_PREFIX: 'sess_',
    TOKEN_LENGTH: 32,
};
const formatDate = (date) => {
    return date.toISOString();
};
exports.formatDate = formatDate;
const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};
exports.generateId = generateId;
const generateOTP = () => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < exports.AUTH_CONSTANTS.OTP_LENGTH; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
};
exports.generateOTP = generateOTP;
const generateSecureToken = (length = exports.AUTH_CONSTANTS.TOKEN_LENGTH) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
};
exports.generateSecureToken = generateSecureToken;
const hashOTP = (otp, salt) => {
    const saltedOTP = salt ? `${otp}${salt}` : otp;
    return (0, crypto_js_1.SHA256)(saltedOTP).toString();
};
exports.hashOTP = hashOTP;
const verifyOTPHash = (otp, hash, salt) => {
    const computedHash = (0, exports.hashOTP)(otp, salt);
    return computedHash === hash;
};
exports.verifyOTPHash = verifyOTPHash;
const calculateOTPExpiry = (minutes = exports.AUTH_CONSTANTS.OTP_EXPIRY_MINUTES) => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
};
exports.calculateOTPExpiry = calculateOTPExpiry;
const isOTPExpired = (expiryDate) => {
    return new Date() > expiryDate;
};
exports.isOTPExpired = isOTPExpired;
const validateMobileNumber = (mobileNumber) => {
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    return mobileRegex.test(mobileNumber) && mobileNumber.length >= 10 && mobileNumber.length <= 15;
};
exports.validateMobileNumber = validateMobileNumber;
const validateInternationalPhoneNumber = (phoneNumber) => {
    const internationalRegex = /^\+[1-9]\d{1,14}$/;
    return internationalRegex.test(phoneNumber) && phoneNumber.length >= 11 && phoneNumber.length <= 16;
};
exports.validateInternationalPhoneNumber = validateInternationalPhoneNumber;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const formatMobileNumber = (mobileNumber) => {
    const cleaned = mobileNumber.replace(/[^\d+]/g, '');
    if (cleaned.length > 10 && !cleaned.startsWith('+')) {
        return `+${cleaned}`;
    }
    return cleaned;
};
exports.formatMobileNumber = formatMobileNumber;
const maskMobileNumber = (mobileNumber) => {
    if (mobileNumber.length < 4)
        return mobileNumber;
    const visibleDigits = 4;
    const maskedLength = mobileNumber.length - visibleDigits;
    const masked = '*'.repeat(maskedLength);
    const visible = mobileNumber.slice(-visibleDigits);
    return masked + visible;
};
exports.maskMobileNumber = maskMobileNumber;
const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2)
        return email;
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
};
exports.maskEmail = maskEmail;
const isUserActive = (status) => {
    return status === types_1.UserStatus.ACTIVE;
};
exports.isUserActive = isUserActive;
const isUserVerified = (mobileVerified, emailVerified) => {
    return mobileVerified && emailVerified;
};
exports.isUserVerified = isUserVerified;
const getAuthProviderDisplayName = (provider) => {
    switch (provider) {
        case types_1.AuthProvider.SMS:
            return 'SMS';
        case types_1.AuthProvider.EMAIL:
            return 'Email';
        case types_1.AuthProvider.GOOGLE:
            return 'Google';
        case types_1.AuthProvider.FACEBOOK:
            return 'Facebook';
        default:
            return 'Unknown';
    }
};
exports.getAuthProviderDisplayName = getAuthProviderDisplayName;
const generateUserDisplayName = (firstName, lastName) => {
    return `${firstName} ${lastName}`.trim();
};
exports.generateUserDisplayName = generateUserDisplayName;
const sanitizeUserInput = (input) => {
    return input.trim().replace(/\s+/g, ' ');
};
exports.sanitizeUserInput = sanitizeUserInput;
const validateUPIId = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    return upiRegex.test(upiId);
};
exports.validateUPIId = validateUPIId;
const generateSessionId = () => {
    return `${exports.AUTH_CONSTANTS.SESSION_ID_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
exports.generateSessionId = generateSessionId;
const calculateTokenExpiry = (hours = exports.AUTH_CONSTANTS.TOKEN_EXPIRY_HOURS) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry;
};
exports.calculateTokenExpiry = calculateTokenExpiry;
const isTokenExpired = (expiryDate) => {
    return new Date() > expiryDate;
};
exports.isTokenExpired = isTokenExpired;
//# sourceMappingURL=utils.js.map