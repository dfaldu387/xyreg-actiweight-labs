-- No database changes needed as we'll extend the existing device_components JSONB field
-- to support materials within each component. The JSONB structure will be:
-- device_components: [
--   {
--     "name": "Component Name",
--     "description": "Component Description", 
--     "materials": [
--       {
--         "componentRole": "e.g., Outer Casing",
--         "materialName": "e.g., Polycarbonate",
--         "specification": "e.g., Makrolon® 2458, Medical Grade",
--         "patientContact": "Direct Contact|Indirect Contact|No Contact",
--         "notes": "Additional material notes"
--       }
--     ]
--   }
-- ]

-- Add comment to document the extended structure
COMMENT ON COLUMN products.device_components IS 'JSONB array containing device components with optional materials. Structure: [{"name": "string", "description": "string", "materials": [{"componentRole": "string", "materialName": "string", "specification": "string", "patientContact": "Direct Contact|Indirect Contact|No Contact", "notes": "string"}]}]';