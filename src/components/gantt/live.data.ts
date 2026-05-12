import type { GanttTask, GanttLink } from '@/types/ganttChart';

// Raw response from /lifecycle_phases?product_id=...
export const RAW_PHASES = [
    {
        "id": "6a65beed-68cb-4da6-b2e9-78bfb513646b",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "name": "No Phase",
        "description": "Documents not assigned to any specific phase",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:36.132526+00:00",
        "updated_at": "2026-04-01T06:22:36.132526+00:00",
        "start_date": "2026-03-05",
        "end_date": "2026-03-05",
        "is_overdue": true,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": -1,
        "category_id": null,
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "0f0322d5-3d10-4ed9-94e0-0a52c3f61e5c",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "name": "Risk Management (ISO 14971, ISO 13485 §7.1)",
        "description": "\"Managing Safety Throughout the Lifecycle\" A continuous process that runs in parallel with all development stages. You identify hazards, estimate and evaluate risks, implement risk controls, and verify their effectiveness. Risk management is not a phase you start and finish — it accompanies the device from concept through post-market.",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:35.740621+00:00",
        "updated_at": "2026-04-01T06:22:35.740621+00:00",
        "start_date": "2026-03-05",
        "end_date": "2027-02-28",
        "is_overdue": false,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 18,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "5898c86e-f6ea-4cca-adf0-0172d0ac7f85",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "name": "Concept & Planning (ISO 13485 §7.1)",
        "description": "\"Defining the Strategy\" The initial stage where the medical need and commercial feasibility are validated. You define the project scope, allocate resources, identify regulatory pathways, and create the core plan that guides the entire project.",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:33.619218+00:00",
        "updated_at": "2026-05-12T05:29:32.032+00:00",
        "start_date": "2026-03-29",
        "end_date": "2026-04-28",
        "is_overdue": true,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 12,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "3ee6e5ec-1c47-4823-b6d1-aafe19f37b52",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "name": "Design Inputs (ISO 13485 §7.3.3)",
        "description": "\"Freezing the Requirements\" The translation of vague user needs into precise, measurable technical requirements. This phase establishes exactly what the device must do, defining the performance, safety, and regulatory constraints that the engineering team must meet.",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:34.029301+00:00",
        "updated_at": "2026-05-12T05:29:33.185+00:00",
        "start_date": "2026-04-28",
        "end_date": "2026-05-28",
        "is_overdue": false,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 13,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "b2255f07-f215-485c-8944-443d4aac7496",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "name": "Verification & Validation (ISO 13485 §7.3.5–6)",
        "description": "\"Proving It Works\" Verification: Testing to prove the device was built correctly (Does it meet the specs?). Validation: Testing to prove the right device was built (Does it actually help the user/patient in the real world?).",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:34.743703+00:00",
        "updated_at": "2026-05-12T05:29:33.816+00:00",
        "start_date": "2026-09-25",
        "end_date": "2026-12-22",
        "is_overdue": false,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 15,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "d5684dff-3360-417a-9567-2571ef09e6ca",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "name": "Transfer & Production (ISO 13485 §7.3.8, §7.5)",
        "description": "\"Scaling for Manufacture\" Moving the design from R&D to the manufacturing floor. This involves freezing the \"recipe\" (Device Master Record), validating manufacturing equipment, training operators, and finalizing the supply chain.",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:35.065973+00:00",
        "updated_at": "2026-05-12T05:29:34.134+00:00",
        "start_date": "2026-12-22",
        "end_date": "2027-02-20",
        "is_overdue": false,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 16,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "4455f800-1b7f-4087-8420-8ed400a01e61",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "name": "Market & Surveillance (ISO 13485 §8.2.1)",
        "description": "\"Monitoring Real-World Safety\" The active maintenance phase after launch. You continuously collect data on how the device performs in the field, handle customer complaints, report adverse events, and update risk management files.",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:35.399365+00:00",
        "updated_at": "2026-05-12T05:29:34.465+00:00",
        "start_date": "2027-02-20",
        "end_date": "2027-03-22",
        "is_overdue": false,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 17,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    },
    {
        "id": "a9c5554a-6503-4d03-9d61-0809f8116e28",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "name": "Design & Development (ISO 13485 §7.3.4)",
        "description": "\"Building the Solution\" The iterative engineering process of creating the device. This involves designing the physical architecture, writing software, creating schematics, and conducting technical reviews to ensure the emerging design aligns with the inputs.",
        "status": "not_started",
        "deadline": null,
        "is_current_phase": false,
        "progress": 0,
        "inserted_at": "2026-04-01T06:22:34.384793+00:00",
        "updated_at": "2026-05-12T05:29:33.484+00:00",
        "start_date": "2026-05-28",
        "end_date": "2026-09-25",
        "is_overdue": false,
        "likelihood_of_success": 100,
        "estimated_budget": 0,
        "is_pre_launch": true,
        "cost_category": "development",
        "budget_currency": "USD",
        "position": 14,
        "category_id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "sub_section_id": null,
        "baseline_start_date": null,
        "baseline_end_date": null
    }
];
// Raw response from /product_phase_dependencies?product_id=...
export const RAW_DEPS = [
    {
        "id": "a6956b29-969c-4237-b092-7df2aa46157b",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "source_phase_id": "5898c86e-f6ea-4cca-adf0-0172d0ac7f85",
        "target_phase_id": "3ee6e5ec-1c47-4823-b6d1-aafe19f37b52",
        "dependency_type": "finish_to_start",
        "lag_days": 0,
        "created_at": "2026-04-01T06:22:39.111401+00:00",
        "updated_at": "2026-04-01T06:22:39.111401+00:00"
    },
    {
        "id": "2c31be1b-b205-4b18-9bfa-63628a0cf910",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "source_phase_id": "3ee6e5ec-1c47-4823-b6d1-aafe19f37b52",
        "target_phase_id": "a9c5554a-6503-4d03-9d61-0809f8116e28",
        "dependency_type": "finish_to_start",
        "lag_days": 0,
        "created_at": "2026-04-01T06:22:39.111401+00:00",
        "updated_at": "2026-04-01T06:22:39.111401+00:00"
    },
    {
        "id": "79b620b6-e281-4841-96b2-54835d9e9bb0",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "source_phase_id": "a9c5554a-6503-4d03-9d61-0809f8116e28",
        "target_phase_id": "b2255f07-f215-485c-8944-443d4aac7496",
        "dependency_type": "finish_to_start",
        "lag_days": 0,
        "created_at": "2026-04-01T06:22:39.111401+00:00",
        "updated_at": "2026-04-01T06:22:39.111401+00:00"
    },
    {
        "id": "75bd6c2e-4285-4f4d-b3a2-a5a71007faa1",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "source_phase_id": "b2255f07-f215-485c-8944-443d4aac7496",
        "target_phase_id": "d5684dff-3360-417a-9567-2571ef09e6ca",
        "dependency_type": "finish_to_start",
        "lag_days": 0,
        "created_at": "2026-04-01T06:22:39.111401+00:00",
        "updated_at": "2026-04-01T06:22:39.111401+00:00"
    },
    {
        "id": "ea1fccaa-291c-44ee-8566-7d8bb91e2327",
        "product_id": "aba5cc63-1b27-413a-9833-bf7ab30682d1",
        "source_phase_id": "d5684dff-3360-417a-9567-2571ef09e6ca",
        "target_phase_id": "4455f800-1b7f-4087-8420-8ed400a01e61",
        "dependency_type": "finish_to_start",
        "lag_days": 0,
        "created_at": "2026-04-01T06:22:39.111401+00:00",
        "updated_at": "2026-04-01T06:22:39.111401+00:00"
    }
];
export const RAW_CATEGORIES  = [
    {
        "id": "e952d5b3-e3cf-44a9-8d07-7e0753e637e8",
        "name": "Product Realisation Lifecycle"
    }
];

export const RAW_ACTIVITIES  = [];
export const RAW_DOCUMENTS = [
    {
        "id": "d0fafa0e-8a33-47d1-93f2-4d27b09df4e0",
        "name": "Quality Management Plan",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "dbd328f2-3cf2-4d9b-b818-5040a2a55b32",
        "name": "Quality Management Plan",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "17754a32-4f55-47f2-9826-6169bb59fbef",
        "name": "Quality Management Plan",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "f3415f8f-8e4e-46d3-b0da-c4a9bba1a5cf",
        "name": "Quality Management Plan",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "8e03aa18-ebdb-46d0-acfb-864578d8d7fa",
        "name": "Quality Management Plan",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "10e998cf-c36e-4bea-9114-5d2c18e4652a",
        "name": "Internal Audit Reports",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "8a18574d-386f-49fd-81bd-714ab3796278",
        "name": "Internal Audit Reports",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3a284be5-6a12-4e36-85a4-7f0ff3797c9b",
        "name": "Internal Audit Reports",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "94beae64-be2a-4a0a-a746-67f099af5e39",
        "name": "Internal Audit Reports",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "5fcd7119-3fa6-4cf1-baba-d9d0d509c14c",
        "name": "Internal Audit Reports",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "281df335-52c3-48bb-a719-57908766bd5a",
        "name": "Management Review Minutes",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "51608663-fd36-4798-8c45-6ec23df15375",
        "name": "Management Review Minutes",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "4bfda0c5-4603-4cce-ac59-8cffed3d27ee",
        "name": "Management Review Minutes",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "6e0f43c4-5329-408e-bcf9-da260b059edf",
        "name": "Management Review Minutes",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3fddd1a1-9f5b-4188-8ed4-0a77914732c6",
        "name": "Management Review Minutes",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "c9663497-b9aa-4b29-931d-e4d0df4b6915",
        "name": "Periodic Audit / Review Schedule",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "6731a898-506d-43dd-a131-ca4534faf1e5",
        "name": "Periodic Audit / Review Schedule",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "07e258d1-1e8b-4f28-af99-b28b13743204",
        "name": "Periodic Audit / Review Schedule",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "6382530d-19c6-4369-88fe-d32799507e01",
        "name": "Periodic Audit / Review Schedule",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "575ed27b-028a-411d-a671-2834ea883922",
        "name": "Quality Management Plan",
        "status": "Draft",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "ec2b502a-d607-4a82-a414-5cc751509616",
        "name": "Internal Audit Reports",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "73520847-91e8-4126-9f91-39d54e2e6122",
        "name": "Management Review Minutes",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "d89fa853-df6d-4f89-9a4b-03e9645ebe0d",
        "name": "Quality Management Plan",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "25a4dfcd-2538-440f-83ba-b7fba0c00099",
        "name": "Periodic Audit / Review Schedule",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "c2896d7a-2011-470c-8290-bc217a627b0f",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e56557d4-e028-4683-bfbb-4b8c44ca363e",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "1de2296c-77a8-4f8b-bafb-5308a7ef374b",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "356a2e95-90ba-4b12-b43a-0c6430e15436",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "b5233f82-b17f-4a88-ab63-812d8bb71d50",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "77855ab9-43e8-4ebf-a86f-524ff719b563",
        "name": "Design Review Records",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "9e1f814a-691e-4afa-ac2b-c66170cc1845",
        "name": "Design Review Records",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "c8f865fd-3d8a-4b28-bd5b-1dec162d6d9b",
        "name": "Packaging Design Drawings",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "ee9f4535-afe6-470b-9454-71aedef71a37",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "73c24394-0793-4f83-b29d-ff4e3e099178",
        "name": "Design Review Records",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2a049209-bbcb-4e51-aa35-da345cea1ebf",
        "name": "Biocompatibility Requirements",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a0a7ddf8-472a-4cbf-ab7d-e64d9893b85c",
        "name": "Packaging Design Drawings",
        "status": "Draft",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "d24b45b4-9754-461d-8920-76f5862a5a2b",
        "name": "Environmental & Sterilization Specs",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "ba844145-1747-44c1-9673-f9e0db3dee95",
        "name": "Process Validation Protocols & Reports (sterility, shelf-life)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "5c57e253-ad9c-4680-8111-a5ba4a8bd636",
        "name": "Risk Control Implementation Records",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e19f1294-ff9a-4e38-a672-ca90f491e85c",
        "name": "Software Architecture & Code Documentation",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "624f7184-22de-4d9c-a784-470bdd6cc9e2",
        "name": "Traceability Matrix (Inputs → Outputs → Controls)",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3c77b1d2-daf7-45b6-8978-05ea91ce24ce",
        "name": "Traceability Matrix (Inputs → Outputs → Controls)",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "b9283706-34cd-487e-a37c-9cd91b77cfad",
        "name": "Technical File / Design Dossier / Device Master Record",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "f10d831c-e39a-4c85-b809-6fdf3a5da908",
        "name": "Risk Management Report",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "50f719dc-b1d9-4b0c-809d-46ad92ce1e42",
        "name": "Test Method Development Plan",
        "status": "Not Started",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "1bc39434-20f7-4565-8a3f-773011b5e3c8",
        "name": "CE Technical File & EU Declaration of Conformity",
        "status": "Draft",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "eebc4b66-cd92-47f2-879c-247b00462211",
        "name": "Updated Hazard Log / FMEA with Controls",
        "status": "Draft",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "0341133e-e1e0-46d9-849f-73dcad7d757f",
        "name": "Software Architecture & Code Documentation",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "aaeb40cd-3ea1-40a2-a156-8ddbb4a1bb83",
        "name": "Test Method Validation Reports",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "898b937c-9c84-4d83-8210-8d8785bd6bca",
        "name": "Verification Master Plan",
        "status": "Draft",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "5560bfdc-7e65-48ab-9df0-405d5c58924e",
        "name": "Software Lifecycle Documentation (IEC 62304)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2ddb7e03-7d8a-4ae2-9757-e416e18d2ece",
        "name": "Software Validation Reports (IQ/OQ/PQ)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a160f57c-0351-4978-8fbf-45ffea1a515a",
        "name": "Risk Control Implementation Records",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "cce0e3ea-3760-49d6-8cb2-a0f9a80fa4fd",
        "name": "Verification Protocols & Acceptance Criteria",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "df10726d-f677-4112-951e-164a07ee1044",
        "name": "CE Technical File & EU Declaration of Conformity",
        "status": "Draft",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "503296c0-11dc-4751-ae9e-1b27b882df65",
        "name": "User Needs Overview",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3f55f7d4-3d71-4111-8e1d-270cd4533e2d",
        "name": "Detailed CAD Drawings & BOM",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "6059cd87-c32d-4b47-925e-025bee55c319",
        "name": "Device History File (DHF) Index",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "88faaa42-a955-46f4-aaf7-0d6c98e87971",
        "name": "Labeling & IFU Final",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "71ebfef2-c053-4ac5-b747-5ff1d5e604aa",
        "name": "Labeling & IFU Final",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "7999712f-5ab5-4a9e-b670-64296929b543",
        "name": "Supplier Qualification Records",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "acf97756-1a01-4228-b326-5008858d7e35",
        "name": "Early Competitive Landscape Summary",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "458fd90a-0387-4e69-a918-66c7570f6f78",
        "name": "Early Competitive Landscape Summary",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e44332e6-d98e-4ca3-b231-3bac55115c48",
        "name": "High-Level Architecture / Concept Diagram",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "70eca82e-b084-4473-b6ea-f5c46f0a23f5",
        "name": "Initial Hazard Log / FMEA Entries",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "43bc8378-a4f2-44e3-afc8-a4737bd470ae",
        "name": "Preliminary Market Analysis",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "236c9a05-8507-40cf-a593-5d855119f7b8",
        "name": "Verification Master Plan",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a40770ac-6061-4060-8384-a15019ea16e2",
        "name": "510(k) Submission / PMA Package",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "b0176440-7a57-4a67-84ce-26c696f53ff4",
        "name": "ANVISA Registro",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "64d4904a-0d10-4ff0-956e-efb491150c70",
        "name": "Draft Risk Management Plan",
        "status": "Draft",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3318a358-9ba5-486a-b0bc-b8f4344ba3b3",
        "name": "Regulatory Strategy Outline",
        "status": "Draft",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "94cc41b8-6fac-436d-b48c-61152f32db22",
        "name": "Resource & Budget Feasibility Study",
        "status": "Not Started",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "b5767435-d0e4-4ea9-a451-9065e4db003e",
        "name": "Preliminary Market Analysis",
        "status": "Draft",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2910ee9d-e9a2-4184-806b-ff2e9dda1ac0",
        "name": "ARTG Inclusion",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3d17b4b3-e1c5-4697-83ba-ab6dcaeb5206",
        "name": "CAPA Procedure (Post-Market)",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "629f59a3-67a4-479a-a055-a3a7a3503d81",
        "name": "CAPA Records & Effectiveness Checks",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "d6b2eb70-450b-429c-a059-3b69882943e3",
        "name": "CDSCO Device Registration",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "aea1654c-ef71-4796-bfe8-dae594e628ed",
        "name": "CN Registration Certificate application",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "dccd4b9f-187e-44eb-93c0-4ecbc6262d7f",
        "name": "Executive Sign-Off on Risk Acceptance",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "24283b92-9301-4b55-9c41-8b57a9cdee53",
        "name": "Field Safety Corrective Action (FSCA) Reports",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "cf2eca50-548f-4c71-b45d-f29733e68315",
        "name": "Final Design Review Minutes",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "9898afe4-c439-4460-b6b5-287a7a0160aa",
        "name": "Installation, Operation & Servicing Instructions Drafts",
        "status": "Not Started",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "40c91733-0c33-4b28-b52b-df06d127aa00",
        "name": "KR Marketing Authorization",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e2674e24-b32f-4340-884a-4f25cfdffa3c",
        "name": "Manufacturing Process Flowcharts & Work Instructions",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "da64907c-274d-4958-8d19-52859b9437f4",
        "name": "Medical Device License (MDL) application",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e37d97cb-3b95-4081-9f53-9212bee2496c",
        "name": "Periodic Safety Update Reports (PSUR/PBRER)",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3652384d-188d-4d08-a6f8-b60f3ca7ffb1",
        "name": "Post-Market Clinical Follow-Up (PMCF) Plan",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "c247b97f-e69a-4260-b4e0-8bf35dcb8535",
        "name": "Post-Market Risk Reassessment Updates",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "75911204-fb2a-4f59-96b5-c607e846e13c",
        "name": "Post-Market Surveillance (PMS) Plan",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "c9395c43-1fc0-4867-a262-de5cd1ad61af",
        "name": "Regulatory Submission Roadmap",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "46130f4c-24b3-46e5-a070-fe770ef5ff09",
        "name": "Human Factors Use-Specifications-VD1",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "58bc6612-4c6d-4d89-8e4c-c5ec57efba9e",
        "name": "Regulatory & Standards Mapping Matrix",
        "status": "Draft",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e677e49f-a2ed-476f-9f16-4364032630f7",
        "name": "Clinical Evaluation Plan & Protocols",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "6d383cb1-8774-469b-9f43-1aab8ff2df78",
        "name": "Design Validation Reports (simulated & actual use)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "bc7843d4-d248-45d2-835a-315e48b3b3a9",
        "name": "Clinical Investigation / Trial Protocols & CRFs",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "57c5daca-b360-4d1a-9ca1-2c59c06f270e",
        "name": "Risk Management Plan (Final)",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "468afa9e-fc95-41d3-9248-c70c0c823d91",
        "name": "Risk/Benefit Analysis & Residual Risk Summary",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "07aa7347-2a32-475a-9bb7-f0047c413653",
        "name": "Shonin / Ninsho dossier",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "22c709b3-31d7-4cea-a364-7cbe094d2105",
        "name": "Supplier / Contract Manufacturer Agreements",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "338e9d8d-2b9e-4ba4-a852-5d585f08b2ba",
        "name": "Supplier Selection & Qualification Plan",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "63df6eb7-3ed3-43eb-8740-4dcc60ae899e",
        "name": "Usability Engineering File (UEF)",
        "status": "Not Started",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "08ea16d6-2181-442f-b977-a25087bde7bd",
        "name": "Vigilance & Adverse Event Reporting Procedure",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "66e283d1-9a35-439b-ba42-4da194c3eff1",
        "name": "Vigilance Reports (MDR, MedWatch, etc.)",
        "status": "Not Started",
        "phase_id": "a6d145b2-6955-4fce-b3c2-e1723659827b",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "5b2331da-de10-4f02-a28a-d9ae10c2868f",
        "name": "Use Environment & Maintenance Profiles V1",
        "status": "Under Review",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "d70ea7f8-dd48-4241-938d-a8c747aca99f",
        "name": "Validation Master Plan (Design, Clinical, Usability)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "04f5ca96-440b-4934-96f1-76de5ee71b92",
        "name": "Untitled Document",
        "status": "Draft",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "49e430cc-63e5-4599-841b-afa01fbde97d",
        "name": "Sample DOCXx",
        "status": "Changes Requested",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e82cf07e-1ea7-47ee-9802-c437602565bf",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Changes Requested",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "39f4f05d-2d56-4021-a370-5e38d1d14e38",
        "name": "eee Business Case / Project Charter",
        "status": "Changes Requested",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "58e9ef91-67d3-4bfc-8af7-072bf9d0e76b",
        "name": "Project Schedule / Gantt Chart",
        "status": "Changes Requested",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "4c2dd954-d849-4b17-8a75-d05366be1cc6",
        "name": "SA Business Case / Project Charter",
        "status": "Approved",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e7d4f45c-84e0-48ae-847e-33b87bb27090",
        "name": "setset Business Case / Project Charter",
        "status": "Approved",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "0a96b17c-a2f9-4c29-bf19-5d47c62e0add",
        "name": "Regulatory Submission Roadmap",
        "status": "Approved",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "b0e26ba4-cedd-44e5-be74-b5341e0a64ad",
        "name": "Business Case / Project Charter",
        "status": "In Review",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "23638669-09ff-4fcd-9a08-f5e078c96a7b",
        "name": "Software Lifecycle Documentation (IEC 62304)",
        "status": "Approved",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "5fbd0197-71f3-4e2c-a649-7141934af538",
        "name": "Labeling Drafts & UDI Assignments",
        "status": "Approved",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2535ff2e-120c-4dd9-a477-5e41b1cdd8a9",
        "name": "Stakeholder Requirements Specification",
        "status": "Approved",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "799a24fc-b41b-4a2f-b44d-ea06c9802bec",
        "name": "Software Requirements Specification (SRS)",
        "status": "Approved",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "4aa214c0-7cee-448d-b7f2-d6dfc4174cdd",
        "name": "Use Environment & Maintenance Profiles",
        "status": "In Review",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a080a3f1-bccc-4c5a-9bba-1097b127a6a6",
        "name": "Untitled Document",
        "status": "In Review",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "d00a25c1-bd1f-4d27-a93f-6b63b2a8bf84",
        "name": "Electrical Schematics & PCB Layouts",
        "status": "In Review",
        "phase_id": "a91ade68-6ca4-4e72-9f9b-f35b8ed50065",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "e450aecd-e526-43ae-a31a-8be425a0ef00",
        "name": "Risk Management Plan (Final)",
        "status": "Approved",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "51b7c296-d4f1-4ac6-9968-9045612de6c0",
        "name": "DOC file ex",
        "status": "Under Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "346c9f39-f8d6-4b9d-a6cf-e011f5fe7bdd",
        "name": "User Needs Specification (UNS) - V1",
        "status": "In Review",
        "phase_id": "315272bf-7915-470c-bb3e-dae80331fbd2",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "cdd3e75f-ccba-49ec-9595-6910c53b5778",
        "name": "Design & Development Plan - V1",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "56ccdc14-75c9-41e1-b96c-94bcf430a359",
        "name": "Early Competitive Landscape Summary - ECLS1",
        "status": "Approved",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "5d94a1cb-6686-40a0-8fcd-786ad2be5ab3",
        "name": "Internal Audit Reports 12313",
        "status": "Draft",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "f838130d-cbf1-4f71-b67f-743fb75d333f",
        "name": "Management Review Minutes 1231",
        "status": "Draft",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a007731c-661b-42bf-b921-65ded413ea9b",
        "name": "High-Level Architecture / Concept Diagram - HL1",
        "status": "Approved",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "9ff0888f-df45-45e4-889a-6b27c943780a",
        "name": "Initial Hazard Log / FMEA Entries",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "491b98c4-9c38-41f0-9409-41fd541d86bf",
        "name": "Device Description & Specification — Device - 2",
        "status": "Draft",
        "phase_id": "2a9a4411-6095-4a22-b2ba-1415e0d508b0",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "786f223b-3987-44d4-8145-c342d93d3488",
        "name": "Periodic Audit / Review Schedule",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "66c212a0-efdd-4ddd-b7d8-82ad57e74d54",
        "name": "Intellectual Property (IP) Review",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "7844b484-cf7a-4f5a-a265-63f941641b9a",
        "name": "Test07",
        "status": "Not Started",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "d2e33fc3-1272-4db3-8ac9-8e1d4cdec6a8",
        "name": "Concept Brief - T1",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "ba72d3a8-398a-4e8f-bcf6-bb5842df97f7",
        "name": "ABC test 08",
        "status": "Draft",
        "phase_id": "7a15411f-4e75-49f7-a3cb-6ef9ba128d5f",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "bf8ef9e3-1858-4522-8aad-3e1d9be97bd6",
        "name": "ABC 07",
        "status": "Not Started",
        "phase_id": "11ed6107-b4d4-4039-8866-d98a0c053a6e",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a932debb-a67d-4b10-a709-a4f389f93676",
        "name": "Periodic Audit / Review Schedule",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "c78b4f50-eedf-4702-8b36-9a4436e4589b",
        "name": "Traceability Matrices (Req → Design → Verif → Valid → Risk)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "089030a6-35b7-4821-a6df-5293d7aac396",
        "name": "Design & Development Plan",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "792b33a0-10ff-4f37-8c0d-d10d25375330",
        "name": "Calibration Certificates for Test Equipment",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2264fcb5-abcf-4a64-b189-bdea615f9ff7",
        "name": "Packaging Validation Reports",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a7083f5d-a4fc-44aa-9b45-69b12b1529ea",
        "name": "Pre-Clinical / Pre-Study Protocols",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "ca22ac2c-4c71-46ba-b712-42a17afca582",
        "name": "Verification Test Reports (functional, EMC, biocomp., sterility, SW)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "44bfb748-cb08-4c1a-a865-7b43fd81fbe7",
        "name": "Sterilization & Shelf-Life Validation Summaries",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2b5525aa-20c3-4c43-8423-7db3e8f8cea0",
        "name": "Updated Traceability Matrix w/ Verification Links",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "2b634fff-36ed-46cb-b1b3-8125b1803a24",
        "name": "EMC Requirements (IEC 60601-1-2)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "a210be60-6eb6-4f10-a614-09a332519a59",
        "name": "Traceability Matrix (Inputs → Outputs → Controls)",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "930f7a35-7927-49da-bc69-fbd42f841a5f",
        "name": "Test Method Development Plan",
        "status": "Not Started",
        "phase_id": "33165efb-9fa3-49e6-bfae-dcff1ac5f729",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "f7417844-0536-401e-8e1f-e8d6e373189a",
        "name": "Draft Risk Management Plan = P1",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "30588b05-b11e-4091-895d-7ac6e8eb6deb",
        "name": "Preliminary Hazard Analysis (PHA)",
        "status": "In Review",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    },
    {
        "id": "3d13a7e1-cbe7-42f1-a27f-6dc190b7c742",
        "name": "Feasibility Study Report (with risk inputs) - FSR1",
        "status": "Approved",
        "phase_id": "a6ce4dea-f41f-459a-88e1-06e9d1c43e98",
        "company_phases": {
            "company_id": "bafcaade-2ea7-4594-b33b-1279c1d2912b"
        }
    }
];

// ─── Adapter: production shape → demo Gantt shape ────────────────────────────
//
// Assembles a 4-level tree to mirror the production milestones page:
//   Category (RAW_CATEGORIES, name = "Product Realisation Lifecycle")
//     └── Phase  (RAW_PHASES, type=task)
//           └── Documents (N)  (synthetic container per phase, name shows count)
//                 └── Individual document  (RAW_DOCUMENTS, parented via
//                                          phase_id = company_phases.id)
//           └── Activity rows  (RAW_ACTIVITIES — empty for this product, so
//                                no rows appear; the wiring is in place for
//                                when you capture them.)

const DEP_TYPE_MAP: Record<string, GanttLink['type']> = {
    finish_to_start: 'e2s',
    start_to_start: 's2s',
    finish_to_finish: 'e2e',
    start_to_finish: 's2e',
};

const MS_PER_DAY = 86_400_000;

// Status comes in two shapes from the API: phases use snake_case
// ("not_started"), documents use Title Case ("Not Started"). Normalise.
const toProgressStatus = (raw: unknown): GanttTask['progressStatus'] => {
    const k = String(raw ?? '').toLowerCase().replace(/[\s-]+/g, '_');
    if (k === 'completed') return 'completed';
    if (k === 'in_progress') return 'in-progress';
    return 'not-started';
};

// Filter rules:
//  - Phase needs both dates AND start !== end (skips "No Phase" placeholder).
const realPhases = RAW_PHASES
    .filter((p) => p.start_date && p.end_date && p.start_date !== p.end_date)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

// Resolve category_id → category_name from RAW_CATEGORIES.
const categoryNameById = new Map<string, string>();
for (const c of RAW_CATEGORIES) categoryNameById.set(c.id, c.name);

// Group phases by their category so we can compute each category bar's
// start (= earliest child start) and end (= latest child end).
const phasesByCategory = new Map<string, typeof realPhases>();
for (const p of realPhases) {
    const cid = (p as any).category_id;
    if (!cid) continue;
    const arr = phasesByCategory.get(cid) ?? [];
    arr.push(p);
    phasesByCategory.set(cid, arr);
}

// Documents reference the phase by `phase_id` (which is company_phases.id),
// but our tasks are keyed by `lifecycle_phases.id`. Bridge the two.
const phaseByCompanyPhaseId = new Map<string, (typeof realPhases)[number]>();
for (const p of realPhases) phaseByCompanyPhaseId.set((p as any).phase_id, p);

// Bucket documents by their parent phase (lifecycle_phases.id).
const docsByPhaseId = new Map<string, typeof RAW_DOCUMENTS>();
for (const d of RAW_DOCUMENTS) {
    const phase = phaseByCompanyPhaseId.get((d as any).phase_id);
    if (!phase) continue; // doc belongs to a filtered-out phase (e.g. "No Phase")
    const arr = docsByPhaseId.get(phase.id) ?? [];
    arr.push(d);
    docsByPhaseId.set(phase.id, arr);
}

// Pre-bucket activities by phase (lifecycle_phases.id) — same join shape as
// documents — so we can interleave them per phase below.
const activitiesByPhaseId = new Map<string, typeof RAW_ACTIVITIES>();
for (const a of RAW_ACTIVITIES) {
    const phase = phaseByCompanyPhaseId.get((a as any).phase_id);
    if (!phase) continue;
    const arr = activitiesByPhaseId.get(phase.id) ?? [];
    arr.push(a);
    activitiesByPhaseId.set(phase.id, arr);
}

// Build tasks in render order: for each category, emit the category, then
// each child phase, then that phase's docs container + docs, then its
// activities. The Gantt renders strictly in array order, so this is what
// keeps Documents/Activities visually nested under their phase.
const tasks: GanttTask[] = [];

for (const [categoryId, childPhases] of phasesByCategory) {
    const allDates = childPhases.flatMap((p) => [
        new Date(p.start_date as string).getTime(),
        new Date(p.end_date as string).getTime(),
    ]);
    if (allDates.length === 0) continue;

    // 1) Category row.
    tasks.push({
        id: categoryId,
        text: categoryNameById.get(categoryId) ?? 'Lifecycle Category',
        type: 'category',
        start: new Date(Math.min(...allDates)),
        end: new Date(Math.max(...allDates)),
        progressStatus: 'not-started',
        progress: 0,
    });

    // 2) For each phase under this category: phase → its docs → its activities.
    for (const p of childPhases) {
        tasks.push({
            id: p.id,
            text: p.name,
            type: 'task',
            parent: categoryId,
            start: new Date(p.start_date as string),
            end: new Date(p.end_date as string),
            progressStatus: toProgressStatus((p as any).status),
            progress: typeof (p as any).progress === 'number' ? (p as any).progress : 0,
        });

        // 2a) Documents container + individual doc children for this phase.
        const docs = docsByPhaseId.get(p.id);
        if (docs && docs.length > 0) {
            const containerId = `docs-${p.id}`;
            tasks.push({
                id: containerId,
                text: `Documents (${docs.length})`,
                type: 'summary',
                parent: p.id,
                start: new Date(p.start_date as string),
                end: new Date(p.end_date as string),
                progressStatus: 'not-started',
                progress: 0,
            });
            for (const d of docs) {
                tasks.push({
                    id: (d as any).id,
                    text: (d as any).name,
                    type: 'task',
                    parent: containerId,
                    start: new Date(p.start_date as string),
                    end: new Date(p.end_date as string),
                    progressStatus: toProgressStatus((d as any).status),
                    progress: 0,
                });
            }
        }

        // 2b) Activity rows (e.g. "Design Review") directly under the phase.
        const activities = activitiesByPhaseId.get(p.id);
        if (activities) {
            for (const a of activities) {
                const start = (a as any).start_date ?? (a as any).start ?? p.start_date;
                const end = (a as any).end_date ?? (a as any).end ?? p.end_date;
                if (!start || !end) continue;
                tasks.push({
                    id: (a as any).id,
                    text: (a as any).name ?? (a as any).title ?? 'Activity',
                    type: 'task',
                    parent: p.id,
                    start: new Date(start),
                    end: new Date(end),
                    progressStatus: toProgressStatus((a as any).status),
                    progress: typeof (a as any).progress === 'number' ? (a as any).progress : 0,
                });
            }
        }

        // 2c) Synthetic "Design Review" row at the phase's end.
        //     Production renders this client-side (no DB fetch), 1-day
        //     duration, anchored on the last day of the phase.
        const phaseEnd = new Date(p.end_date as string);
        const designReviewStart = new Date(phaseEnd.getTime() - MS_PER_DAY);
        tasks.push({
            id: `design_review_${p.id}`,
            text: 'Design Review',
            type: 'task',
            parent: p.id,
            start: designReviewStart,
            end: phaseEnd,
            progressStatus: 'not-started',
            progress: 0,
        });
    }
}

export const LIVE_TASKS: GanttTask[] = tasks;

const LIVE_TASK_IDS = new Set(LIVE_TASKS.map((t) => t.id));

export const LIVE_LINKS: GanttLink[] = RAW_DEPS
    .filter(
        (d) =>
            DEP_TYPE_MAP[d.dependency_type] &&
            LIVE_TASK_IDS.has(d.source_phase_id) &&
            LIVE_TASK_IDS.has(d.target_phase_id),
    )
    .map((d) => ({
        id: d.id,
        source: d.source_phase_id,
        target: d.target_phase_id,
        type: DEP_TYPE_MAP[d.dependency_type]!,
    }));

// Pad the visible window so bars aren't flush against the timeline edges.
const PAD_DAYS = 30;
const allMs = LIVE_TASKS.flatMap((t) => [t.start.getTime(), t.end.getTime()]);
const minMs = allMs.length ? Math.min(...allMs) - PAD_DAYS * MS_PER_DAY : Date.now();
const maxMs = allMs.length ? Math.max(...allMs) + PAD_DAYS * MS_PER_DAY : Date.now();
export const LIVE_DOMAIN: [Date, Date] = [new Date(minMs), new Date(maxMs)];