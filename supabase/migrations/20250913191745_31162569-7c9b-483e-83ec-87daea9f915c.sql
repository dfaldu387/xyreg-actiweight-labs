-- Check valid affiliation_type enum values
SELECT unnest(enum_range(NULL::affiliation_type)) AS valid_values;