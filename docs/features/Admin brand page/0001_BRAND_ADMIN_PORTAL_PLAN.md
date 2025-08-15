# Brand Admin Portal - Technical Implementation Plan

## Feature Description

The Brand tab/page on the admin portal allows administrators to manage partner brands and their categories. Admins can add, remove, edit brands with comprehensive information including name, logo URL, earning/redemption percentages, and transaction limits. The system also supports brand category management for organizing brands.

## Current Implementation Analysis

After reviewing the codebase, most of the required functionality is already implemented:

### ✅ Already Implemented
- **Backend Entities**: Complete `Brand` and `BrandCategory` entities with all required fields
- **API Layer**: Full CRUD operations for brands and categories via REST endpoints
- **Admin UI Components**: `BrandTable`, `BrandForm`, and category management pages
- **Data Validation**: Zod schemas for all brand operations with business rule validation
- **Business Logic**: Earning/redemption percentage validation, amount constraints, status management

### 🔧 Current Brand Fields
- `name`: Brand name (required, max 200 chars)
- `description`: Brand description (required)
- `logoUrl`: Logo image URL (optional, validated as URL)
- `categoryId`: Associated brand category (required, UUID)
- `earningPercentage`: % of MRP earned as coins (0-100%, default 10%)
- `redemptionPercentage`: % of MRP that can be redeemed (0-100%, default 30%)
- `minRedemptionAmount`: Minimum redemption amount (default 1)
- `maxRedemptionAmount`: Maximum redemption amount (default 2000)
- `brandwiseMaxCap`: Per-transaction redemption limit (default 2000)
- `isActive`: Brand status (default true)

### 🔧 Current Category Fields
- `name`: Category name (required, unique, max 100 chars)
- `description`: Category description (optional, max 500 chars)
- `icon`: Icon identifier (optional, max 100 chars)
- `color`: Hex color code (optional, #RRGGBB format)

## Required Changes

### Phase 1: Data Layer & Validation (Already Complete)
- ✅ Brand and BrandCategory entities with all required fields
- ✅ Zod validation schemas with business rules
- ✅ TypeORM migrations for database schema
- ✅ Business rule validation (percentage ranges, amount constraints)

### Phase 2A: Admin UI Enhancements
**File: `apps/admin/src/app/brands/page.tsx`**
- Update category filter to fetch real categories from API instead of hardcoded options
- Enhance search functionality to include category-based filtering
- Add real-time category data integration

**File: `apps/admin/src/components/brands/BrandForm.tsx`**
- Ensure all form fields are properly connected to the backend
- Add category selection dropdown with real data
- Validate form submission with proper error handling

**File: `apps/admin/src/components/brands/BrandTable.tsx`**
- Display category information in the brand table
- Add proper status indicators and actions
- Ensure all CRUD operations work correctly

### Phase 2B: Backend API Integration
**File: `apps/api/src/brands/brands.service.ts`**
- Verify all CRUD operations are working correctly
- Ensure proper error handling and validation
- Test business rule enforcement

**File: `apps/api/src/brands/brand-categories.service.ts`**
- Verify category CRUD operations
- Ensure proper relationship handling with brands

### Phase 3: Integration & Testing
- Test complete brand management workflow
- Verify category management integration
- Ensure proper error handling and user feedback
- Test business rule validation

## Implementation Details

### Brand Management Workflow
1. **Create Brand**: Admin fills form → validation → API call → database insert → success feedback
2. **Edit Brand**: Admin selects brand → form pre-populated → validation → API call → database update → success feedback
3. **Delete Brand**: Admin confirms deletion → API call → database delete → success feedback
4. **Toggle Status**: Admin clicks toggle → API call → status update → UI refresh

### Category Management Workflow
1. **Create Category**: Admin fills form → validation → API call → database insert → success feedback
2. **Edit Category**: Admin selects category → form pre-populated → validation → API call → database update → success feedback
3. **Delete Category**: Admin confirms deletion → API call → database delete → success feedback

### Business Rules Validation
- Earning percentage: 0-100%
- Redemption percentage: 0-100%
- Min redemption amount ≥ 0
- Max redemption amount ≥ min redemption amount
- Brandwise max cap ≥ 0
- Max redemption amount = brandwise max cap (enforced automatically)

## Files to Modify

### Admin Portal
- `apps/admin/src/app/brands/page.tsx` - Main brands listing page
- `apps/admin/src/app/brands/categories/page.tsx` - Categories management page
- `apps/admin/src/components/brands/BrandTable.tsx` - Brands data table
- `apps/admin/src/components/brands/BrandForm.tsx` - Brand creation/editing form
- `apps/admin/src/lib/api.ts` - API client functions

### Backend API
- `apps/api/src/brands/brands.controller.ts` - Brand endpoints
- `apps/api/src/brands/brands.service.ts` - Brand business logic
- `apps/api/src/brands/brand-categories.controller.ts` - Category endpoints
- `apps/api/src/brands/brand-categories.service.ts` - Category business logic

### Shared Types
- `packages/shared/src/schemas/brand.schema.ts` - Brand validation schemas

## Testing Requirements

### Unit Tests
- Brand entity validation
- Brand service operations
- Category service operations
- Form validation logic

### Integration Tests
- Brand CRUD operations via API
- Category CRUD operations via API
- Admin portal form submissions
- Business rule enforcement

### E2E Tests
- Complete brand management workflow
- Complete category management workflow
- Error handling scenarios
- Validation feedback

## Success Criteria

1. ✅ Admins can create new brands with all required information
2. ✅ Admins can edit existing brand details and percentages
3. ✅ Admins can delete brands (with proper validation)
4. ✅ Admins can manage brand categories (create, edit, delete)
5. ✅ All business rules are enforced and validated
6. ✅ UI provides clear feedback for all operations
7. ✅ Search and filtering work correctly
8. ✅ Pagination handles large numbers of brands
9. ✅ Form validation prevents invalid data submission
10. ✅ API endpoints handle all CRUD operations correctly

## Notes

- The current implementation already covers 90% of the required functionality
- Main focus should be on ensuring proper integration between UI components and backend APIs
- Category data should be fetched dynamically instead of using hardcoded options
- Business rule validation is already implemented in the backend entities
- The system supports the exact requirements specified: name, logo URL, earning/redemption percentages, and transaction limits
