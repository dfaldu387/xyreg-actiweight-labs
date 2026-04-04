

# Change Breadcrumb Separator from Parentheses to Pipe

## Problem
The breadcrumb currently shows trade name in parentheses: `Product Name (Trade Name)`. User wants a pipe divider instead: `Product Name | Trade Name`.

## Change

### File: `src/components/product/layout/ProductPageHeader.tsx` (line 165-167)

Update the `breadcrumbName` construction:

**Before:**
```ts
const breadcrumbName = product.trade_name 
  ? `${displayName} (${product.trade_name})` 
  : displayName;
```

**After:**
```ts
const breadcrumbName = product.trade_name 
  ? `${displayName} | ${product.trade_name}` 
  : displayName;
```

Single line change, no other files affected.

