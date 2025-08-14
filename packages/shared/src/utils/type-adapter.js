"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptUserStatus = adaptUserStatus;
exports.adaptAuthProvider = adaptAuthProvider;
exports.adaptApiUserToUser = adaptApiUserToUser;
exports.adaptApiAuthTokenToAuthToken = adaptApiAuthTokenToAuthToken;
exports.adaptApiAuthResponse = adaptApiAuthResponse;
const types_1 = require("../types");
function adaptUserStatus(apiStatus) {
    switch (apiStatus) {
        case 'PENDING':
            return types_1.UserStatus.PENDING;
        case 'ACTIVE':
            return types_1.UserStatus.ACTIVE;
        case 'SUSPENDED':
            return types_1.UserStatus.SUSPENDED;
        case 'DELETED':
            return types_1.UserStatus.DELETED;
        default:
            return types_1.UserStatus.PENDING;
    }
}
function adaptAuthProvider(apiProvider) {
    switch (apiProvider) {
        case 'SMS':
            return types_1.AuthProvider.SMS;
        case 'EMAIL':
            return types_1.AuthProvider.EMAIL;
        case 'GOOGLE':
            return types_1.AuthProvider.GOOGLE;
        case 'FACEBOOK':
            return types_1.AuthProvider.FACEBOOK;
        default:
            return types_1.AuthProvider.SMS;
    }
}
function adaptApiUserToUser(apiUser) {
    return {
        id: apiUser.id,
        mobileNumber: apiUser.mobileNumber,
        email: apiUser.email,
        status: adaptUserStatus(apiUser.status),
        isMobileVerified: apiUser.isMobileVerified,
        isEmailVerified: apiUser.isEmailVerified,
        profile: apiUser.profile,
        paymentDetails: apiUser.paymentDetails,
        authProviders: apiUser.authProviders?.map(provider => ({
            provider: adaptAuthProvider(provider.provider),
            providerId: provider.providerUserId,
            email: provider.email,
            linkedAt: provider.createdAt,
        })) || [],
        createdAt: apiUser.createdAt,
        updatedAt: apiUser.updatedAt,
    };
}
function adaptApiAuthTokenToAuthToken(apiToken) {
    return {
        accessToken: apiToken.accessToken,
        refreshToken: apiToken.refreshToken,
        expiresIn: apiToken.expiresIn,
        tokenType: 'Bearer',
    };
}
function adaptApiAuthResponse(apiResponse) {
    if (apiResponse.user && apiResponse.tokens) {
        return {
            user: adaptApiUserToUser(apiResponse.user),
            tokens: adaptApiAuthTokenToAuthToken(apiResponse.tokens),
        };
    }
    if (apiResponse.user) {
        return {
            user: adaptApiUserToUser(apiResponse.user),
            tokens: apiResponse.tokens,
        };
    }
    return apiResponse;
}
//# sourceMappingURL=type-adapter.js.map