# Request Verification Form Implementation Plan

## Feature Description

Implement a comprehensive request verification form that opens when an admin clicks "Verify" on a pending transaction request. The form will display a two-column layout with receipt image viewer on the left and claim details/actions on the right. The form includes user information, receipt verification fields, approval/rejection actions, and a slider to navigate between pending requests from the same user.

## Current Implementation Analysis

The current codebase has:
- **Transaction Management**: Complete transaction listing, filtering, and basic approval/rejection flows
- **Transaction Detail Modal**: Basic transaction information display but lacks verification-specific functionality
- **API Endpoints**: Existing endpoints for approving/rejecting transactions (`approveEarnTransaction`, `rejectEarnTransaction`, etc.)
- **User Data**: User entities with profile, payment details, and mobile number information
- **Transaction Schema**: `CoinTransaction` with receipt URL, bill amount, bill date, and admin notes

## Required Changes

### 1. Data Layer Updates

#### 1.1 New API Endpoints
**File:** `apps/api/src/coins/controllers/coin-admin.controller.ts`
- Add `getUserPendingRequests(userId: string)` endpoint to fetch all pending requests for a user
- Add `getUserDetails(userId: string)` endpoint to fetch user profile and contact information

**File:** `apps/api/src/coins/coins.service.ts`
- Add `getUserPendingRequests(userId: string)` method
- Add `getUserDetails(userId: string)` method
- Add validation logic to check if user has pending earn requests before allowing redeem approval

#### 1.2 Schema Updates
**File:** `packages/shared/src/schemas/coin.schema.ts`
- Add `verificationFormSchema` for the verification form data
- Add `userVerificationDataSchema` for user information in verification context
- Add `pendingRequestsResponseSchema` for fetching user's pending requests

### 2. Frontend Components

#### 2.1 New Verification Modal Component
**File:** `apps/admin/src/components/transactions/TransactionVerificationModal.tsx`
- **Left Column - Receipt Viewer**:
  - Image display with navigation controls (← / →)
  - Zoom controls (+ / -)
  - Rotate (R) and reset (0) buttons
  - Support for multiple receipt images
- **Right Column - Verification Form**:
  - User information (name, mobile, email)
  - Receipt date input (editable)
  - MRP on receipt input (editable)
  - Request timestamp (read-only)
  - "I have verified the receipt" checkbox
  - Rejection note textarea (conditional)
  - Corra coin amount display (earned/redeemed)
  - Action buttons (Reject, Approve, Approve & Pay)

#### 2.2 Enhanced Transaction Table
**File:** `apps/admin/src/components/transactions/TransactionTable.tsx`
- Replace existing action buttons with a single "Verify" button for pending transactions
- Update `onTransactionSelect` to open verification modal instead of detail modal

#### 2.3 Updated Transaction List
**File:** `apps/admin/src/components/transactions/TransactionList.tsx`
- Replace `TransactionDetailModal` with `TransactionVerificationModal` for pending transactions
- Keep `TransactionDetailModal` for viewing completed/processed transactions

### 3. State Management & Logic

#### 3.1 Verification Form State
**File:** `apps/admin/src/components/transactions/TransactionVerificationModal.tsx`
- Form state for receipt date, MRP amount, verification checkbox
- User pending requests navigation state
- Current request index for slider functionality
- Validation state for form fields

#### 3.2 Business Logic
- **Earn Request Approval**: Enable approve button when checkbox is checked
- **Redeem Request Approval**: Only enable approve button when all pending earn requests are verified
- **Rejection Logic**: Require rejection note when rejecting
- **Payment Processing**: Enable "Approve & Pay" for redeem requests after approval

#### 3.3 User Request Navigation
- Fetch all pending requests for the current user
- Implement slider navigation between requests
- Update form data when navigating between requests
- Maintain verification state across navigation

### 4. API Integration

#### 4.1 Enhanced Transaction API
**File:** `apps/admin/src/lib/api.ts`
- Add `getUserPendingRequests(userId: string)` method
- Add `getUserDetails(userId: string)` method
- Add `verifyTransaction(transactionId: string, verificationData: VerificationFormData)` method

#### 4.2 Data Fetching
- Fetch user details when verification modal opens
- Fetch user's pending requests for navigation
- Submit verification form data to backend
- Handle real-time updates via existing WebSocket connection

### 5. UI/UX Enhancements

#### 5.1 Modal Design
- Responsive two-column layout
- Fixed max-width with scrollable content
- Consistent styling with existing admin panel
- Keyboard shortcuts (ESC to close, arrow keys for navigation)

#### 5.2 Receipt Viewer
- Image zoom and pan functionality
- Smooth navigation between multiple images
- Loading states for image operations
- Error handling for broken image links

#### 5.3 Form Validation
- Real-time validation feedback
- Required field indicators
- Error message display
- Form submission prevention until valid

## Implementation Phases

### Phase 1: Data Layer & API (Foundation)
1. Create new API endpoints for user data and pending requests
2. Update schemas with verification form data structures
3. Implement backend validation logic for redeem approval rules

### Phase 2: Core Verification Modal (UI)
1. Build `TransactionVerificationModal` component with two-column layout
2. Implement receipt image viewer with navigation controls
3. Create verification form with all required fields
4. Add form validation and state management

### Phase 3: Integration & Navigation (Features)
1. Integrate verification modal with transaction table
2. Implement user request navigation slider
3. Connect form submission to backend APIs
4. Add real-time updates via WebSocket

### Phase 4: Polish & Testing (Quality)
1. Add keyboard shortcuts and accessibility features
2. Implement error handling and loading states
3. Add comprehensive testing for verification flows
4. Performance optimization and testing

## Technical Considerations

### Performance
- Lazy load receipt images
- Implement image caching for better UX
- Optimize API calls for user data fetching

### Security
- Validate all form inputs on backend
- Ensure admin authentication for verification actions
- Sanitize user input for rejection notes

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modal interactions

### Mobile Responsiveness
- Responsive design for tablet and mobile admin access
- Touch-friendly controls for image navigation
- Optimized form layout for smaller screens

## Dependencies

### Backend Dependencies
- Existing transaction approval/rejection services
- User entity and profile services
- File/image handling services
- WebSocket notification system

### Frontend Dependencies
- Existing transaction management components
- Form validation libraries (Zod integration)
- Image manipulation utilities
- Modal and dialog components

### Shared Dependencies
- Updated transaction and user schemas
- Verification form data types
- API response structures

## Testing Strategy

### Unit Tests
- Verification form validation logic
- Image navigation and zoom functionality
- Form state management
- API integration methods

### Integration Tests
- End-to-end verification workflow
- User request navigation
- Form submission and approval flows
- Error handling scenarios

### E2E Tests
- Complete verification process from transaction list to approval
- Multi-request navigation and verification
- Admin workflow validation
- Cross-browser compatibility

## Success Metrics

- **Functionality**: All verification form features working correctly
- **Performance**: Modal opens in <500ms, images load in <2s
- **Usability**: Admin can complete verification in <2 minutes
- **Reliability**: 99%+ success rate for verification submissions
- **Accessibility**: WCAG 2.1 AA compliance for all interactions
