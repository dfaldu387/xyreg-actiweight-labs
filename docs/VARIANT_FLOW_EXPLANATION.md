# Product Variants Flow - Complete Explanation

## Overview
The variant system allows you to create different configurations of the same product (e.g., different sizes, colors, packaging). When a user selects a variant, they see the specific product details for that configuration.

---

## 📊 Database Structure

### Tables Involved:

1. **`product_variation_dimensions`** - Defines the types of variations (e.g., "Size", "Color", "Packaging")
   - Example: `{ id: "dim-1", name: "Color", company_id: "..." }`

2. **`product_variation_options`** - Defines the available options for each dimension
   - Example: `{ id: "opt-1", dimension_id: "dim-1", name: "Blue" }`
   - Example: `{ id: "opt-2", dimension_id: "dim-1", name: "Green" }`

3. **`product_variants`** - Represents a specific variant configuration
   - Example: `{ id: "var-1", product_id: "prod-1", name: "Rip Belts Variant", description: "...", status: "active" }`

4. **`product_variant_values`** - Links variants to their specific dimension-option combinations
   - Example: `{ product_variant_id: "var-1", dimension_id: "dim-1", option_id: "opt-2" }` (Green)
   - Example: `{ product_variant_id: "var-1", dimension_id: "dim-2", option_id: "opt-3" }` (Medium)

5. **`products`** - The actual product records (each variant can be a separate product or share the same product)

---

## 🔄 Complete Flow

### Step 1: Create Dimensions & Options (Setup - One Time)

**Location:** `AddVariantDialog.tsx` → "Dimensions" tab

1. Create dimensions (e.g., "Color", "Size")
2. For each dimension, create options:
   - Color: Blue, Green, Red
   - Size: Small, Medium, Large

**Database:**
- Dimensions stored in `product_variation_dimensions`
- Options stored in `product_variation_options`

---

### Step 2: Create a Variant (Your "Rip Belts Variant")

**Location:** `AddVariantDialog.tsx` → "Variants" tab

**What you did:**
1. Clicked "Create New Variant"
2. Entered name: "Rip Belts Variant"
3. Selected:
   - **Size:** Medium
   - **Color:** Green
4. Clicked "Create Variant"

**What happened in the database:**

```sql
-- 1. Created variant record
INSERT INTO product_variants (product_id, name, description, status)
VALUES ('your-product-id', 'Rip Belts Variant', NULL, 'active');

-- 2. Created variant value links
INSERT INTO product_variant_values (product_variant_id, dimension_id, option_id)
VALUES 
  ('variant-id', 'size-dimension-id', 'medium-option-id'),
  ('variant-id', 'color-dimension-id', 'green-option-id');
```

**Result:** "Rip Belts Variant" is now stored with:
- Size: Medium
- Color: Green

---

### Step 3: How Variants Are Used (Selection Flow)

**Location:** `VariantDetailsDialog.tsx` (The dialog we just updated)

#### 3.1 Opening the Variant Dialog

**Where it's triggered:**
- From `ProductPageHeader.tsx` - "Variants" dropdown button
- When viewing a product that has variants

**What happens:**
1. Dialog opens showing the current product
2. System fetches all sibling products (products with same `basic_udi_di`)
3. For each sibling, finds their `product_variants` and `product_variant_values`
4. Builds a list of all available dimension-option combinations

#### 3.2 Displaying Variant Options (Checkboxes)

**What you see:**
```
Select Variant Options
┌─────────────────────────────────┐
│ Color                           │
│ ☑ Green  ☐ Blue                │
│                                 │
│ Size                            │
│ ☐ Medium  ☑ Small              │
└─────────────────────────────────┘
```

**How it works:**
- `variantOptions` state contains all dimensions with their options
- `selectedOptions` state tracks which option is selected for each dimension
- Checkboxes show all available options
- Only one option per dimension can be selected (radio button behavior)

#### 3.3 Selecting a Variant

**When user clicks a checkbox:**

1. **`handleOptionChange`** is called:
   ```typescript
   handleOptionChange(dimensionId, optionId)
   // Updates selectedOptions state
   ```

2. **`findMatchingVariant` useEffect** runs:
   - Searches all sibling products
   - Finds the `product_variant` that matches ALL selected options
   - Example: If "Green" + "Small" selected, finds variant with:
     - Color = Green AND Size = Small

3. **`setSelectedVariant`** updates:
   - Updates `selectedVariant` to the matching product
   - This triggers `useProductDetails` hook to fetch that product's data

4. **Variant Type Tags update:**
   - Shows only selected options: "Color: Green", "Size: Small"
   - (We just fixed this!)

5. **Product details update:**
   - Trade Name, Model Reference, Description, etc. all update to show the selected variant's data

---

## 🎯 Real-World Example: "Rip Belts Variant"

### Scenario:
You have a product "RIP Belts Cables" with variants:
- **Default Variant:** No specific size/color
- **Rip Belts Variant:** Size=Medium, Color=Green

### User Flow:

1. **User opens product page** → Sees "RIP Belts Cables"

2. **User clicks "Variants" button** → `VariantDetailsDialog` opens

3. **User sees checkboxes:**
   ```
   Color: ☐ Blue  ☑ Green
   Size:  ☑ Medium  ☐ Small
   ```

4. **User selects "Green" and "Medium":**
   - System finds "Rip Belts Variant" (matches Green + Medium)
   - Dialog shows that variant's details:
     - Trade Name: "Nox Abdomen Cable"
     - Model Reference: "..."
     - Variant Type: "Color: Green, Size: Medium"

5. **User changes to "Blue" and "Small":**
   - System searches for variant with Blue + Small
   - If found, shows that variant's details
   - If not found, might show default or create new variant

---

## 🔍 Key Components

### 1. `AddVariantDialog.tsx`
**Purpose:** Create and manage variants
- **Variants Tab:** Create new variants, assign dimension-option combinations
- **Dimensions Tab:** Create dimensions and their options

### 2. `VariantDetailsDialog.tsx`
**Purpose:** View and select variants
- Shows checkboxes for selecting variant options
- Displays details of the selected variant
- Allows switching between variants

### 3. `useProductVariants.ts` Hook
**Purpose:** Database operations for variants
- `createVariant()` - Creates a new variant
- `setVariantOption()` - Links a variant to a dimension-option
- `deleteVariant()` - Deletes a variant

---

## 💡 Important Concepts

### Variant vs Product
- A **variant** (`product_variants`) is a configuration template
- A **product** (`products`) is the actual product record
- One product can have multiple variants
- OR: Each variant can be a separate product (siblings with same `basic_udi_di`)

### Matching Logic
When you select options, the system:
1. Gets all products with same `basic_udi_di`
2. For each product, gets its `product_variants`
3. For each variant, gets its `product_variant_values`
4. Finds the variant where ALL selected options match
5. Shows that variant's product details

### Why "Rip Belts Variant" Shows Up
- It's stored in `product_variants` table
- It has entries in `product_variant_values` linking it to:
  - Size dimension → Medium option
  - Color dimension → Green option
- When user selects "Medium" + "Green", system finds this variant
- Dialog displays the product associated with this variant

---

## 🚀 Next Steps

### To Use Your "Rip Belts Variant":

1. **Navigate to the product page** (RIP Belts Cables)

2. **Click "Variants" button** in the header

3. **Select options:**
   - Color: Green ✓
   - Size: Medium ✓

4. **System automatically:**
   - Finds "Rip Belts Variant" (matches your selections)
   - Shows that variant's product details
   - Updates "Variant Type" tags to show only selected options

5. **View variant details:**
   - Trade Name, Description, Images, etc. all reflect the selected variant

---

## 📝 Summary

**What you created:**
- "Rip Belts Variant" with Size=Medium, Color=Green

**How it's used:**
- User selects options via checkboxes
- System finds matching variant
- Shows that variant's product details

**The flow:**
```
Create Variant → Store in DB → User Selects Options → 
System Finds Match → Display Variant Details
```

Your "Rip Belts Variant" is now ready to use! When users select "Green" and "Medium", they'll see the details for that specific variant configuration.

