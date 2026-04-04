# Memory: features/business-case/business-canvas-tab-integration
Updated: 5m ago

The Business Case section features a 'Business Canvas' tab for strategic modeling, persisted in the business_canvas table. It supports two automation modes: 'Populate from System', which uses the derivation engine to seed the canvas from existing product data (Partners, Markets, Blueprint, NPV), and 'Generate with AI', which uses LLM inference from blueprint notes. This allows users to start from system-generated content and manually refine it within an editable grid.

Genesis Step 4 is now 'Key Activities', which links directly to the Business Canvas tab. Completion requires the key_activities field to have content.
