

## Fix: Missing Status Badges Due to Key Mismatches

### Root Cause
The `standard_version_status` database table uses different `framework_key` values than the frontend. When `buildScopeProps('IEC_62366_1')` calls `getStatus('IEC_62366_1')`, it finds no match because the DB row has `framework_key = 'IEC_62366'`.

### Mismatched Keys

```text
DB key          →  Frontend key (used in buildScopeProps)
─────────────────────────────────────────────────────────
IEC_62366       →  IEC_62366_1      (no match!)
ISO_15223       →  ISO_15223_1      (no match!)
IEEE_14971      →  ISO_14971_DEVICE (no match!)
```

### Fix
Update the three `framework_key` values in the database to match the frontend keys:

```sql
UPDATE standard_version_status SET framework_key = 'IEC_62366_1'    WHERE framework_key = 'IEC_62366';
UPDATE standard_version_status SET framework_key = 'ISO_15223_1'    WHERE framework_key = 'ISO_15223';
UPDATE standard_version_status SET framework_key = 'ISO_14971_DEVICE' WHERE framework_key = 'IEEE_14971';
```

Also update the hardcoded standards list in `supabase/functions/check-standard-status/index.ts` to use the corrected keys so nightly checks continue to match.

### Files
- **Migrate**: SQL to update the 3 mismatched keys
- **Modify**: `supabase/functions/check-standard-status/index.ts` — fix the 3 keys in the standards array

