# MDR Annex I Service

This service provides dynamic access to MDR Annex I (Medical Device Regulation) requirements from the `mdr_annex_1` table instead of using static data.

## Overview

The MDR Annex I service fetches data directly from the `mdr_annex_1` table, which contains the official EU MDR Annex I General Safety and Performance Requirements (GSPRs). This replaces the previous static data approach with a dynamic, database-driven solution.

## Database Structure

The service works with the following database table:

- `mdr_annex_1` - Contains individual MDR Annex I requirements with all necessary fields

## Service Functions

### Core Functions

#### `fetchMdrAnnexITemplate()`
Fetches the MDR Annex I template information (kept for compatibility).

#### `fetchMdrAnnexIRequirements(companyId?: string)`
Fetches all MDR Annex I requirements from the `mdr_annex_1` table. Company ID is optional since data is not company-restricted.

#### `fetchMdrAnnexIRequirementsByCategory(companyId?: string, category?: string)`
Fetches requirements filtered by category directly from the `mdr_annex_1` table.

#### `fetchMdrAnnexIRequirementsByPriority(companyId?: string, priority: 'low' | 'medium' | 'high')`
Fetches requirements filtered by priority level directly from the `mdr_annex_1` table.

#### `fetchMdrAnnexIRequirementsByChapter(companyId?: string, chapter: string)`
Fetches requirements filtered by chapter directly from the `mdr_annex_1` table.

#### `getRegulatoryAttributes(keyTechnologyCharacteristics: any, intendedUsers: string[])`
Generates dynamic regulatory attributes based on device characteristics.

#### `getMdrAnnexIProgress(requirements: MdrAnnexIItem[])`
Calculates progress statistics for MDR Annex I requirements.

## React Hooks

### `useMdrAnnexI(companyId?: string)`

A custom hook that provides:
- `requirements`: Array of MDR Annex I requirements from `mdr_annex_1` table
- `loading`: Loading state
- `error`: Error state
- `progress`: Progress statistics
- `refetch`: Function to refetch requirements
- `refetchByCategory`: Function to refetch by category
- `refetchByPriority`: Function to refetch by priority
- `refetchByChapter`: Function to refetch by chapter

**Note**: Company ID is optional since data is fetched directly from the `mdr_annex_1` table without company restrictions.

### `useMdrAnnexIFilters(requirements: MdrAnnexIItem[])`

A hook for filtering requirements with:
- `filters`: Current filter state
- `filteredRequirements`: Filtered results
- `updateFilters`: Function to update filters
- `clearFilters`: Function to clear all filters
- `filterOptions`: Available filter options

## Usage Examples

### Basic Usage

```tsx
import { useMdrAnnexI } from '@/hooks/useMdrAnnexI';

function MyComponent() {
  // No company ID needed - fetches from mdr_annex_1 table
  const { requirements, loading, error, progress } = useMdrAnnexI();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>MDR Annex I Requirements</h2>
      <p>Total: {progress.total}</p>
      <p>High Priority: {progress.highPriority}</p>
      
      {requirements.map(req => (
        <div key={req.id}>
          <h3>{req.requirement_text}</h3>
          <p>Priority: {req.priority}</p>
          <p>Category: {req.category}</p>
        </div>
      ))}
    </div>
  );
}
```

### With Company ID (Optional)

```tsx
import { useMdrAnnexI } from '@/hooks/useMdrAnnexI';

function MyComponent({ companyId }: { companyId?: string }) {
  // Company ID is optional but can be passed for logging/tracking purposes
  const { requirements, loading, error, progress } = useMdrAnnexI(companyId);

  // ... rest of component
}
```

### With Filters

```tsx
import { useMdrAnnexI, useMdrAnnexIFilters } from '@/hooks/useMdrAnnexI';

function FilteredRequirements() {
  const { requirements } = useMdrAnnexI(); // No company ID needed
  const { 
    filters, 
    filteredRequirements, 
    updateFilters, 
    clearFilters 
  } = useMdrAnnexIFilters(requirements);

  return (
    <div>
      <select 
        value={filters.category} 
        onChange={(e) => updateFilters({ category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="documentation">Documentation</option>
        <option value="verification">Verification</option>
      </select>

      <button onClick={clearFilters}>Clear Filters</button>

      {filteredRequirements.map(req => (
        <div key={req.id}>{req.requirement_text}</div>
      ))}
    </div>
  );
}
```

### Direct Service Usage

```tsx
import { fetchMdrAnnexIRequirements } from '@/services/mdrAnnexIService';

async function loadRequirements() {
  try {
    // No company ID needed
    const requirements = await fetchMdrAnnexIRequirements();
    console.log(`Loaded ${requirements.length} requirements from mdr_annex_1 table`);
    return requirements;
  } catch (error) {
    console.error('Failed to load requirements:', error);
    return [];
  }
}
```

## Data Structure

### MdrAnnexIItem Interface

```typescript
interface MdrAnnexIItem {
  id: string;
  item_number: string;
  clause_reference: string;
  requirement_text: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  evidence_method?: string;
  audit_guidance?: string;
  applicable_standards?: string[];
  key_standards?: string[];
  clause_number?: string;
  clause_description?: string;
  question_number?: string;
  guidance_text?: string;
  chapter?: string;
  sort_order?: number;
  excludes_if?: string;
  automatic_na_reason?: string;
}
```

### RegulatoryAttribute Interface

```typescript
interface RegulatoryAttribute {
  id: string;
  label: string;
  description: string;
  icon: string;
  details: {
    type: string;
    implications: string;
    requirements: string[];
    standards: string[];
  };
}
```

## Key Changes from Previous Version

1. **Direct Table Access**: Now fetches directly from `mdr_annex_1` table instead of `gap_template_items`
2. **No Company Restrictions**: Data is not company-specific, so company ID is optional
3. **Simplified Queries**: Direct database queries without template or access control checks
4. **Better Performance**: Fewer database joins and simpler queries

## Error Handling

The service includes comprehensive error handling:

- Database connection errors
- Table access validation
- Fallback to static data when needed
- Graceful error states in UI components

## Performance Considerations

- Requirements are fetched once per component mount
- Filtering is done client-side for better performance
- Progress calculations are memoized
- Loading states prevent unnecessary re-renders
- Direct table access reduces database complexity

## Migration from Static Data

To migrate from static data:

1. Replace static imports with service calls
2. Company ID is now optional (can be removed or kept for logging)
3. Use the `useMdrAnnexI` hook for state management
4. Handle loading and error states
5. Remove hardcoded data arrays

## Dependencies

- Supabase client for database access
- React hooks for state management
- TypeScript for type safety
- Lucide React for icons

## Future Enhancements

- Caching layer for better performance
- Real-time updates via Supabase subscriptions
- Bulk operations for multiple requirements
- Export functionality for compliance reports
- Integration with gap analysis workflows
- Advanced search and filtering capabilities
