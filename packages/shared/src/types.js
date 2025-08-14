"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationStatus = exports.UserStatus = exports.AuthProvider = void 0;
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["SMS"] = "SMS";
    AuthProvider["EMAIL"] = "EMAIL";
    AuthProvider["GOOGLE"] = "GOOGLE";
    AuthProvider["FACEBOOK"] = "FACEBOOK";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["PENDING"] = "PENDING";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "VERIFIED";
    VerificationStatus["FAILED"] = "FAILED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
//# sourceMappingURL=types.js.map