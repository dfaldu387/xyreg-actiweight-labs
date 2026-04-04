# Plan-Based Feature Restriction Implementation

## Overview

This implementation adds plan-based feature restrictions to the application, where certain features like "Add Document" and "Add Phase" are only available to users on Professional, Business, or Enterprise plans, but not on the Starter (MVP) plan. The system also includes company-specific plan management where the billing option is only shown when a company is selected.

## Key Features

1. **Company-Specific Plan Management**: Plans are tied to companies, not individual users
2. **Conditional Billing Access**: Billing option only appears when a company is selected
3. **Dynamic Feature Restrictions**: Add Document and Add Phase buttons are hidden based on plan and company selection
4. **User-Friendly Notifications**: Clear banners guide users when no company is selected

## Database Changes

### Migration: `supabase/migrations/20250101000000_add_company_subscription_plan.sql`

```sql
-- Add subscription_plan field to companies table
ALTER TABLE companies 
ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'Starter';

-- Add comment for the new column
COMMENT ON COLUMN companies.subscription_plan IS 'Current subscription plan for the company (Starter, Professional, Business, Enterprise)';

-- Update existing companies to have Starter plan by default
UPDATE companies 
SET subscription_plan = 'Starter' 
WHERE subscription_plan IS NULL;
```

## New Files Created

### 1. Plan Service (`src/services/planService.ts`)

Manages user and company plan information with the following key methods:

- `getCurrentUserPlan()`: Gets the current user's plan from metadata or company settings
- `getCurrentCompanyPlan(companyId)`: Gets a company's subscription plan
- `updateUserPlan(planName)`: Updates user's plan in metadata
- `updateCompanyPlan(companyId, planName)`: Updates company's subscription plan
- `isFeatureAvailable(feature)`: Checks if a feature is available for current plan
- `canAddDocuments()`: Specifically checks document creation permission
- `canAddPhases()`: Specifically checks phase creation permission

### 2. Plan Permissions Hook (`src/hooks/usePlanPermissions.ts`)

React hook that provides plan-based permissions:

- `usePlanPermissions()`: Returns permissions object with `canAddDocuments`, `canAddPhases`, `currentPlan`, etc.
- `useFeaturePermission(feature)`: Hook for checking specific feature availability

### 3. Plan Restriction Banner (`src/components/ui/PlanRestrictionBanner.tsx`)

UI component that shows when features are restricted, with upgrade prompts.

### 4. No Company Selected Banner (`src/components/ui/NoCompanySelectedBanner.tsx`)

UI component that guides users to select a company when none is currently selected.

## Updated Files

### 1. App Layout (`src/components/layout/AppLayout.tsx`)

Updated to:
- Show billing option only when a company is selected
- Display company name in billing menu item
- Hide billing option when no company is active

### 2. Billing Page (`src/pages/BillingPage.tsx`)

Enhanced with:
- Company-specific plan management
- Current plan display showing company name when applicable
- Plan switching that updates company plan when company is selected
- Warning banner when no company is selected
- Visual indicators for selected plan

### 3. Document Header (`src/components/settings/document-control/components/DocumentHeader.tsx`)

Updated to:
- Conditionally show/hide "Add Document" button based on plan and company selection
- Display restriction banner when feature is not available
- Show no company banner when no company is selected
- Use `usePlanPermissions` hook for permission checking

### 4. Phase Management (`src/components/settings/phases/ConsolidatedPhaseMain.tsx`)

Updated to:
- Conditionally show/hide "Add Phase" button based on plan and company selection
- Show no company banner when no company is selected
- Use `usePlanPermissions` hook for permission checking

## Plan Features Matrix

| Feature | Starter | Professional | Business | Enterprise |
|---------|---------|--------------|----------|------------|
| Basic document management | ✅ | ✅ | ✅ | ✅ |
| Up to 5 products | ✅ | ✅ | ✅ | ✅ |
| Standard phases | ✅ | ✅ | ✅ | ✅ |
| Basic reporting | ✅ | ✅ | ✅ | ✅ |
| **Add documents** | ❌ | ✅ | ✅ | ✅ |
| **Add phases** | ❌ | ✅ | ✅ | ✅ |
| Up to 20 products | ❌ | ✅ | ✅ | ✅ |
| Advanced reporting | ❌ | ✅ | ✅ | ✅ |
| Unlimited products | ❌ | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ | ✅ |
| Custom integrations | ❌ | ❌ | ❌ | ✅ |
| Dedicated support | ❌ | ❌ | ❌ | ✅ |
| Custom branding | ❌ | ❌ | ❌ | ✅ |

## Usage Examples

### Using the Plan Permissions Hook

```tsx
import { usePlanPermissions } from '@/hooks/usePlanPermissions';

function MyComponent() {
  const { canAddDocuments, canAddPhases, currentPlan, isLoading } = usePlanPermissions();

  if (isLoading) return <div>Loading permissions...</div>;

  return (
    <div>
      {canAddDocuments ? (
        <Button onClick={handleAddDocument}>Add Document</Button>
      ) : (
        <PlanRestrictionBanner 
          feature="Add Documents" 
          currentPlan={currentPlan} 
          requiredPlan="Professional" 
        />
      )}
    </div>
  );
}
```

### Using the Plan Service Directly

```tsx
import { PlanService } from '@/services/planService';

// Check if user can add documents
const canAdd = await PlanService.canAddDocuments();

// Get current plan
const currentPlan = await PlanService.getCurrentUserPlan();

// Update user's plan
await PlanService.updateUserPlan('Professional');
```

## Company Selection Logic

### Billing Access
- **When company selected**: Billing option appears in user dropdown with company name
- **When no company selected**: Billing option is hidden from user dropdown

### Feature Access
- **When company selected**: Features are controlled by company's plan
- **When no company selected**: Features are controlled by user's personal plan (if any)
- **No company + no user plan**: Features are restricted (Starter plan limitations)

### UI Indicators
- **NoCompanySelectedBanner**: Shows when no company is selected, guides users to select one
- **PlanRestrictionBanner**: Shows when company plan doesn't support a feature
- **Company name in billing**: Shows which company's plan is being managed

## Plan Storage Strategy

1. **User Level**: Plan is stored in user metadata (`user.user_metadata.selectedPlan`)
2. **Company Level**: Plan is stored in companies table (`companies.subscription_plan`)
3. **Fallback**: If no user plan is set, the system checks the company plan
4. **Default**: If no plan is found, defaults to 'Starter'

## Security Considerations

- Plan permissions are checked on both client and server side
- RLS policies should be updated to respect plan restrictions
- Plan changes are logged and auditable
- Users cannot bypass restrictions through direct API calls

## Future Enhancements

1. **Server-side validation**: Add middleware to validate plan permissions on API routes
2. **Usage tracking**: Track feature usage per plan for analytics
3. **Plan expiration**: Add plan expiration dates and renewal logic
4. **Feature flags**: Implement feature flags for easier plan management
5. **Plan migration**: Add tools for migrating users between plans

## Testing

To test the implementation:

1. **Set user to Starter plan**: Features should be restricted
2. **Set user to Professional plan**: Add Document and Add Phase should be available
3. **Set user to Business/Enterprise plan**: All features should be available
4. **Test plan switching**: Verify that permissions update immediately
5. **Test company vs user plans**: Verify fallback logic works correctly

## Migration Notes

- Existing users will default to 'Starter' plan
- Existing companies will default to 'Starter' plan
- No data loss occurs during migration
- Plan restrictions are applied immediately after migration 