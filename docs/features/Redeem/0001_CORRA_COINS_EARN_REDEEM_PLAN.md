# Feature 0001: Corra Coins Earn/Redeem System

Overall prompt:
"
User can click any brand on the home page and either redeem or earn corra coins by uploading an image or pdf file of the receipt along with manually filling MRP and REceipt date and onlyl in case of redeem there will be a scroll bar between min amount that can be redeemed and the maximum amount that can be redeemed. 
2. The minimum amount of redeemed or earned coins will always be by default 1.
3. The maximum redeemable amount will be buy default set to 2000 for all the brands which can be changed by the admin on admin portal. 
4. Along with it there will be a percentage amount (ex: x%) on each brand that can also be set by the admin. so a user can only redeem at max x% of the MRP of the purchased product of that brand. 
5. Similarly each brand will also have percentage amount let's say y% on each brand that can also be set by the admin. so a user will only earn exactly y% of the MRP of the purchased product of that brand. 
6. Let's keep the default value of x as 30% and y as 10%.
7. The maximum redeemable amount of each brand as well as the global maximum amount both can be changed by the admin. 
8. Once the user has submitted the request for earn or redeem the amount of coin will reflect ASAP.
9. On the admin portal an admin can either approve or reject any redeem or earn request and if the request is rejected the amount of corra coins will be rolled back from the users account. 
10. An admin can directly approve the earn request just by checking the receipt and MRP and ddate entered by the User. 
11. But an admin can only approve a redeem request if and only if he has approved all the pending earn requests by that same user. And once the request is approved the admin will manually pay the user and can only click Paid button when he enters the transaction ID. 
12. An admin will also have the ability to add remove or edit any brand and its information like category, logo url etc. 
13. An admin can also add, remove or edit the list of categories of brands. 
"

## Brief Description

This feature implements a complete earn/redeem workflow for Corra Coins where users can earn coins by uploading receipts from partner brands and redeem coins for cash rewards. The system includes admin approval workflows, brand management, and real-time coin balance updates.

## Current Implementation Status

**Already Implemented:**
- ✅ Complete Auth workflow (SMS/Email verification, JWT tokens)
- ✅ User management and profiles
- ✅ Brand and brand category entities with full schema
- ✅ Coin balance and transaction entities with full schema
- ✅ Global configuration system
- ✅ File upload infrastructure
- ✅ WebSocket real-time updates
- ✅ Basic earn/redeem transaction creation
- ✅ Admin dashboard structure
- ✅ Mobile app structure with tabs

**Missing Implementation:**
- ❌ Complete earn/redeem UI flows in mobile app
- ❌ Admin approval/rejection workflows
- ❌ Payment processing with transaction IDs
- ❌ Brand management UI in admin portal
- ❌ Receipt upload and validation
- ❌ Real-time balance updates after approval
- ❌ Pending request validation logic

## Technical Requirements

### 1. User can click any brand on the home page and either redeem or earn corra coins
- **Files to modify:**
  - `apps/mobile/app/(tabs)/home.tsx` - Update brand click handlers
  - `apps/mobile/app/transactions/earn.tsx` - Create earn transaction screen
  - `apps/mobile/app/transactions/redeem.tsx` - Create redeem transaction screen
  - `apps/mobile/app/brands/[id].tsx` - Create brand detail screen

### 2. Upload image or PDF file of receipt along with manually filling MRP and receipt date
- **Files to modify:**
  - `apps/mobile/app/transactions/earn.tsx` - Add file upload, MRP input, date picker
  - `apps/mobile/app/transactions/redeem.tsx` - Add file upload, MRP input, date picker
  - `apps/mobile/src/components/common/FileUpload.tsx` - Create file upload component
  - `apps/mobile/src/components/common/DatePicker.tsx` - Create date picker component

### 3. Scroll bar between min and max redeemable amounts for redeem transactions
- **Files to modify:**
  - `apps/mobile/app/transactions/redeem.tsx` - Add slider component
  - `apps/mobile/src/components/common/Slider.tsx` - Create slider component

### 4. Default values: min=1, max=2000, earning=10%, redemption=30%
- **Files to modify:**
  - `packages/shared/src/schemas/brand.schema.ts` - Update default values
  - `apps/api/src/migrations/` - Create migration to update existing brands
  - `apps/api/src/brands/entities/brand.entity.ts` - Update entity defaults

### 5. Admin can approve/reject requests with rollback on rejection
- **Files to modify:**
  - `apps/api/src/coins/services/transaction-approval.service.ts` - Create approval service
  - `apps/api/src/coins/coins.service.ts` - Add approval/rejection methods
  - `apps/api/src/coins/coins.controller.ts` - Add admin endpoints
  - `apps/admin/src/app/transactions/page.tsx` - Create transaction management UI

### 6. Admin can only approve redeem requests after all pending earn requests are approved
- **Files to modify:**
  - `apps/api/src/coins/services/transaction-validation.service.ts` - Add validation logic
  - `apps/api/src/coins/coins.service.ts` - Add validation checks

### 7. Admin payment processing with transaction ID entry
- **Files to modify:**
  - `apps/api/src/coins/services/payment-processing.service.ts` - Create payment service
  - `apps/api/src/coins/coins.controller.ts` - Add payment endpoints
  - `apps/admin/src/app/transactions/page.tsx` - Add payment processing UI

### 8. Brand and category management in admin portal
- **Files to modify:**
  - `apps/admin/src/app/brands/page.tsx` - Create brand management UI
  - `apps/admin/src/app/brands/[id]/page.tsx` - Create brand edit page
  - `apps/admin/src/app/brands/categories/page.tsx` - Create category management UI

### 9. Real-time coin balance updates
- **Files to modify:**
  - `apps/api/src/websocket/connection.manager.ts` - Add balance update methods
  - `apps/mobile/src/hooks/useCoinBalance.ts` - Create balance hook
  - `apps/mobile/app/(tabs)/home.tsx` - Integrate real-time balance updates

## Implementation Phases

### Phase 1: Data Layer & Backend Services
1. **Update brand schema defaults** - Modify brand entity and create migration
2. **Create transaction approval service** - Implement approval/rejection logic
3. **Create payment processing service** - Handle payment completion
4. **Enhance transaction validation** - Add pending request validation
5. **Update WebSocket manager** - Add balance update notifications

### Phase 2A: Mobile App UI
1. **Create earn transaction screen** - File upload, MRP input, date picker
2. **Create redeem transaction screen** - File upload, MRP input, slider, date picker
3. **Create brand detail screen** - Show brand info and action buttons
4. **Update home screen** - Integrate brand click handlers
5. **Create common components** - FileUpload, DatePicker, Slider

### Phase 2B: Admin Portal UI
1. **Create transaction management page** - List, approve, reject, process payments
2. **Create brand management pages** - CRUD operations for brands
3. **Create category management pages** - CRUD operations for categories
4. **Enhance dashboard** - Show pending requests and transaction stats

### Phase 3: Integration & Testing
1. **Connect mobile UI to backend** - API integration for earn/redeem
2. **Connect admin UI to backend** - API integration for approvals
3. **Real-time updates** - WebSocket integration for instant balance updates
4. **End-to-end testing** - Complete workflow testing
5. **Error handling** - Add proper error handling and user feedback

## Key Algorithms

### Earn Transaction Processing
1. User uploads receipt + enters MRP + selects date
2. Calculate coins earned: `(MRP × brand.earningPercentage) / 100`
3. Create transaction with PENDING status
4. Update user's pending earn requests count
5. Send real-time notification to user

### Redeem Transaction Processing
1. User uploads receipt + enters MRP + selects date + selects coin amount
2. Validate user has sufficient balance
3. Validate amount is within brand limits (min ≤ amount ≤ max)
4. Validate amount doesn't exceed brand's redemption percentage of MRP
5. Create transaction with PENDING status
6. Update user's pending redeem requests count
7. Send real-time notification to user

### Admin Approval Workflow
1. **Earn Request Approval:**
   - Admin reviews receipt, MRP, and date
   - Approve → Add coins to user balance, update transaction status
   - Reject → Rollback coins, update transaction status
   
2. **Redeem Request Approval:**
   - Check if user has any pending earn requests
   - If pending earn requests exist → Block approval
   - If no pending earn requests → Approve and mark as PROCESSED
   - Admin processes payment manually and enters transaction ID
   - Mark as PAID after transaction ID entry

### Real-time Balance Updates
1. WebSocket connection established on app start
2. Balance updates sent immediately after transaction status changes
3. Mobile app updates UI in real-time without refresh
4. Admin portal shows live transaction status updates

## Database Schema Updates

**No new tables required** - All necessary fields already exist in:
- `brands` table: earningPercentage, redemptionPercentage, minRedemptionAmount, maxRedemptionAmount, brandwiseMaxCap
- `coin_transactions` table: billAmount, billDate, receiptUrl, status, transactionId, paymentProcessedAt
- `coin_balances` table: balance, totalEarned, totalRedeemed

**Migration needed:**
- Update default values for existing brands to match new requirements
- Ensure all brands have proper earning/redemption percentages set

## Security Considerations

1. **File upload validation** - Only allow image/PDF files, validate file size
2. **Admin authentication** - Ensure only admin users can access approval endpoints
3. **Transaction validation** - Prevent duplicate submissions and fraud
4. **Rate limiting** - Limit earn/redeem requests per user per time period
5. **Audit logging** - Log all admin actions for compliance

## Performance Considerations

1. **Database indexes** - Already implemented for transaction queries
2. **File storage** - Use S3 with CloudFront for receipt storage
3. **Real-time updates** - WebSocket connections for instant notifications
4. **Caching** - Cache brand information and user balances
5. **Pagination** - Implement pagination for transaction lists

## Testing Strategy

1. **Unit tests** - Test all service methods and validation logic
2. **Integration tests** - Test complete earn/redeem workflows
3. **E2E tests** - Test mobile app and admin portal workflows
4. **Performance tests** - Test with high transaction volumes
5. **Security tests** - Test file upload and admin access controls
