/**
 * IEC 20957 Stationary Training Equipment — Clause-Specific Form Field Definitions
 */

import type { ClauseFormConfig } from './gapIEC60601FormFields';

export const IEC_20957_FORM_FIELDS: Record<string, ClauseFormConfig> = {
  // §4 General safety requirements
  '4.1': {
    clauseTitle: '4.1 — Materials',
    evidenceRequired: true,
    steps: [{ id: '4.1_materials', stepLabel: 'Material Safety', requirementText: 'Verify materials used are non-toxic, durable, and suitable for the intended environment.', fields: [
      { id: 'material_assessment', label: 'Material safety assessment', type: 'richtext', helpText: 'Describe materials used and their suitability. Include toxicity data, durability evidence, and environmental compatibility.' },
      { id: 'msds_ref', label: 'Material safety data sheets / test reports', type: 'doc_reference', required: true, helpText: 'Link to MSDS or material test reports.' },
    ]}],
  },
  '4.2': {
    clauseTitle: '4.2 — Manufacture and Assembly',
    evidenceRequired: true,
    steps: [{ id: '4.2_mfg', stepLabel: 'Manufacturing Quality', requirementText: 'Demonstrate safe and consistent manufacturing and assembly processes.', fields: [
      { id: 'mfg_process', label: 'Manufacturing process description', type: 'richtext', helpText: 'Describe production and assembly processes, quality controls, and inspection points.' },
      { id: 'quality_records_ref', label: 'Production procedures / quality records', type: 'doc_reference', helpText: 'Link to production procedures or quality records.' },
    ]}],
  },
  '4.3': {
    clauseTitle: '4.3 — Edges and Corners',
    evidenceRequired: true,
    steps: [{ id: '4.3_edges', stepLabel: 'Edge Safety', requirementText: 'Show that accessible edges and corners are rounded or protected to prevent injury.', fields: [
      { id: 'edge_assessment', label: 'Edge and corner assessment', type: 'richtext', helpText: 'Describe how accessible edges/corners have been treated (rounding, capping, guarding) and inspection results.' },
      { id: 'inspection_ref', label: 'Inspection report', type: 'doc_reference', helpText: 'Link to design verification or inspection report for edges/corners.' },
    ]}],
  },
  '4.4': {
    clauseTitle: '4.4 — Entrapment and Shearing',
    evidenceRequired: true,
    steps: [{ id: '4.4_entrapment', stepLabel: 'Entrapment Prevention', requirementText: 'Demonstrate prevention of entrapment of body parts and shearing hazards.', fields: [
      { id: 'entrapment_analysis', label: 'Entrapment and shearing analysis', type: 'richtext', helpText: 'Describe the design analysis for entrapment/shearing points, gap measurements, and mitigation measures.' },
      { id: 'test_ref', label: 'Gap measurement / test results', type: 'doc_reference', required: true, helpText: 'Link to gap measurement data and test results.' },
    ]}],
  },
  '4.5': {
    clauseTitle: '4.5 — Pinch Points and Moving Parts',
    evidenceRequired: true,
    steps: [{ id: '4.5_pinch', stepLabel: 'Pinch Point Protection', requirementText: 'Verify pinch points and moving parts are guarded or designed to prevent trapping.', fields: [
      { id: 'pinch_analysis', label: 'Pinch point analysis', type: 'richtext', helpText: 'Identify all pinch points and moving parts. Describe guarding, clearances, and force-limiting measures.' },
      { id: 'test_ref', label: 'Test evidence', type: 'doc_reference', helpText: 'Link to pinch point test results or design verification.' },
    ]}],
  },
  '4.6': {
    clauseTitle: '4.6 — Weights and Weight Stacks',
    evidenceRequired: true,
    steps: [{ id: '4.6_weights', stepLabel: 'Weight Stack Safety', requirementText: 'Ensure weight stacks are properly guided, secured, and shielded.', fields: [
      { id: 'weight_design', label: 'Weight stack design and guarding', type: 'richtext', helpText: 'Describe guide rod design, weight selector mechanism, shield/guard design, and safety features.' },
      { id: 'test_ref', label: 'Guard design specs / test results', type: 'doc_reference', helpText: 'Link to weight stack guard specifications and test results.' },
    ]}],
  },
  '4.7': {
    clauseTitle: '4.7 — Cables, Chains, Belts and Cords',
    evidenceRequired: true,
    steps: [{ id: '4.7_cables', stepLabel: 'Cable/Chain Strength', requirementText: 'Verify adequate strength, routing, and safety factors for cables, chains, belts and cords.', fields: [
      { id: 'cable_specs', label: 'Cable/chain specifications and safety factors', type: 'richtext', helpText: 'Document breaking strength, working load, safety factor (min 6:1 for cables), routing, and wear inspection criteria.' },
      { id: 'test_ref', label: 'Strength test reports', type: 'doc_reference', required: true, helpText: 'Link to cable/chain strength test reports.' },
    ]}],
  },
  '4.8': {
    clauseTitle: '4.8 — Pulleys and Sprockets',
    evidenceRequired: true,
    steps: [{ id: '4.8_pulleys', stepLabel: 'Pulley Guarding', requirementText: 'Show pulleys and sprockets are guarded to prevent derailment and user contact.', fields: [
      { id: 'pulley_guarding', label: 'Pulley/sprocket guarding design', type: 'richtext', helpText: 'Describe guard design, cable retention features, and anti-derailment measures.' },
      { id: 'test_ref', label: 'Design/test evidence', type: 'doc_reference', helpText: 'Link to pulley guard verification evidence.' },
    ]}],
  },
  '4.9': {
    clauseTitle: '4.9 — Resistance Mechanisms',
    evidenceRequired: true,
    steps: [{ id: '4.9_resistance', stepLabel: 'Resistance Safety', requirementText: 'Verify resistance mechanisms operate safely and predictably across the full range.', fields: [
      { id: 'resistance_design', label: 'Resistance mechanism design and performance', type: 'richtext', helpText: 'Describe the resistance mechanism type (friction, magnetic, air, hydraulic), range, and safety features. Include performance linearity data.' },
      { id: 'test_ref', label: 'Performance test results', type: 'doc_reference', required: true, helpText: 'Link to resistance mechanism performance test results.' },
    ]}],
  },
  '4.10': {
    clauseTitle: '4.10 — Adjusting Mechanisms',
    evidenceRequired: true,
    steps: [{ id: '4.10_adjust', stepLabel: 'Adjustment Safety', requirementText: 'Demonstrate adjusting mechanisms are secure, clearly marked, and cannot release unintentionally.', fields: [
      { id: 'adjustment_design', label: 'Adjusting mechanism design', type: 'richtext', helpText: 'Describe adjustment mechanisms (seat, backrest, resistance, range-of-motion limiters), locking features, and markings.' },
      { id: 'test_ref', label: 'Test evidence', type: 'doc_reference', helpText: 'Link to adjustment mechanism verification test results.' },
    ]}],
  },
  '4.11': {
    clauseTitle: '4.11 — Foot Supports and Pedals',
    evidenceRequired: true,
    steps: [{ id: '4.11_foot', stepLabel: 'Foot Support Safety', requirementText: 'Show foot supports and pedals have adequate grip, dimensions, and strength.', fields: [
      { id: 'foot_design', label: 'Foot support/pedal design', type: 'richtext', helpText: 'Describe dimensions, anti-slip surface treatment, strap/retention features, and structural strength.' },
      { id: 'test_ref', label: 'Slip-resistance and load test results', type: 'doc_reference', helpText: 'Link to slip-resistance and load test results.' },
    ]}],
  },
  '4.12': {
    clauseTitle: '4.12 — Hand Grips',
    evidenceRequired: true,
    steps: [{ id: '4.12_grips', stepLabel: 'Hand Grip Safety', requirementText: 'Verify hand grips have adequate dimensions, grip surface, and strength.', fields: [
      { id: 'grip_design', label: 'Hand grip design', type: 'richtext', helpText: 'Describe grip dimensions, surface material/texture, and ergonomic considerations.' },
      { id: 'test_ref', label: 'Ergonomic and load test results', type: 'doc_reference', helpText: 'Link to hand grip test results.' },
    ]}],
  },
  '4.13': {
    clauseTitle: '4.13 — Seats and Backrests',
    evidenceRequired: true,
    steps: [{ id: '4.13_seats', stepLabel: 'Seat/Backrest Safety', requirementText: 'Demonstrate seats and backrests are stable, adjustable, and support the intended user weight.', fields: [
      { id: 'seat_design', label: 'Seat/backrest design', type: 'richtext', helpText: 'Describe seat/backrest dimensions, padding, adjustability, weight rating, and stability features.' },
      { id: 'test_ref', label: 'Load test results', type: 'doc_reference', helpText: 'Link to seat/backrest load and stability test results.' },
    ]}],
  },
  '4.14': {
    clauseTitle: '4.14 — Heart Rate Measurement (if provided)',
    evidenceRequired: true,
    steps: [{ id: '4.14_hr', stepLabel: 'Heart Rate Accuracy', requirementText: 'If heart rate measurement is provided, verify accuracy and display appropriate disclaimers.', fields: [
      { id: 'hr_accuracy', label: 'Heart rate measurement accuracy', type: 'richtext', helpText: 'Describe the HR measurement technology, accuracy specifications, and disclaimers displayed to users. If not applicable, state N/A.' },
      { id: 'test_ref', label: 'Accuracy test results', type: 'doc_reference', helpText: 'Link to HR measurement accuracy test results.' },
    ]}],
  },
  // §5 Stability
  '5.1': {
    clauseTitle: '5.1 — General Stability',
    evidenceRequired: true,
    steps: [{ id: '5.1_stability', stepLabel: 'Stability Analysis', requirementText: 'Demonstrate equipment stability during normal use.', fields: [
      { id: 'stability_analysis', label: 'Stability analysis', type: 'richtext', helpText: 'Describe the stability analysis including centre-of-gravity considerations, base dimensions, and expected user forces.' },
      { id: 'test_plan_ref', label: 'Stability test plan', type: 'doc_reference', required: true, helpText: 'Link to the stability test plan.' },
    ]}],
  },
  '5.2': {
    clauseTitle: '5.2 — Static Stability Test',
    evidenceRequired: true,
    steps: [{ id: '5.2_static', stepLabel: 'Static Stability Results', requirementText: 'Provide static stability test results.', fields: [
      { id: 'static_results', label: 'Static stability test results', type: 'richtext', helpText: 'Summarize test conditions, loading, tilt angles, and pass/fail results.' },
      { id: 'test_ref', label: 'Static stability test report', type: 'doc_reference', required: true, helpText: 'Link to the static stability test report.' },
    ]}],
  },
  '5.3': {
    clauseTitle: '5.3 — Dynamic Stability Test',
    evidenceRequired: true,
    steps: [{ id: '5.3_dynamic', stepLabel: 'Dynamic Stability Results', requirementText: 'Provide dynamic stability test results.', fields: [
      { id: 'dynamic_results', label: 'Dynamic stability test results', type: 'richtext', helpText: 'Summarize test conditions, simulated use movements, and pass/fail results.' },
      { id: 'test_ref', label: 'Dynamic stability test report', type: 'doc_reference', required: true, helpText: 'Link to the dynamic stability test report.' },
    ]}],
  },
  // §6 Strength & Durability
  '6.1': {
    clauseTitle: '6.1 — Static Load Test',
    evidenceRequired: true,
    steps: [{ id: '6.1_static_load', stepLabel: 'Static Load Results', requirementText: 'Provide static load test results verifying structural integrity.', fields: [
      { id: 'static_load_results', label: 'Static load test results', type: 'richtext', helpText: 'Summarize maximum user weight, safety factor applied, test loads, and pass/fail results for all load-bearing components.' },
      { id: 'test_ref', label: 'Static load test report', type: 'doc_reference', required: true, helpText: 'Link to the static load test report.' },
    ]}],
  },
  '6.2': {
    clauseTitle: '6.2 — Dynamic Fatigue Test',
    evidenceRequired: true,
    steps: [{ id: '6.2_fatigue', stepLabel: 'Fatigue Test Results', requirementText: 'Provide dynamic fatigue test results simulating expected lifetime usage.', fields: [
      { id: 'fatigue_results', label: 'Dynamic fatigue test results', type: 'richtext', helpText: 'Summarize test parameters (cycles, loads, frequency), inspection findings, and pass/fail results.' },
      { id: 'test_ref', label: 'Fatigue test report', type: 'doc_reference', required: true, helpText: 'Link to the dynamic fatigue test report.' },
    ]}],
  },
  '6.3': {
    clauseTitle: '6.3 — Drop Test',
    evidenceRequired: true,
    steps: [{ id: '6.3_drop', stepLabel: 'Drop Test Results', requirementText: 'Provide drop test results where applicable.', fields: [
      { id: 'drop_results', label: 'Drop test results', type: 'richtext', helpText: 'Summarize drop height, surface, orientations, and pass/fail results. If not applicable, provide justification.' },
      { id: 'test_ref', label: 'Drop test report', type: 'doc_reference', helpText: 'Link to the drop test report.' },
    ]}],
  },
  // §7 Labelling
  '7.1': {
    clauseTitle: '7.1 — Permanent Markings',
    evidenceRequired: true,
    steps: [{ id: '7.1_markings', stepLabel: 'Permanent Markings', requirementText: 'Verify all required permanent markings are present.', fields: [
      { id: 'marking_checklist', label: 'Marking checklist', type: 'richtext', helpText: 'Confirm presence of: manufacturer name, model designation, serial number, manufacturing date, maximum user weight, country of origin.' },
      { id: 'photo_ref', label: 'Marking photo / specimen', type: 'doc_reference', required: true, helpText: 'Link to photos or specimens showing permanent markings.' },
    ]}],
  },
  '7.2': {
    clauseTitle: '7.2 — Warning Labels',
    evidenceRequired: true,
    steps: [{ id: '7.2_warnings', stepLabel: 'Warning Labels', requirementText: 'Show all required warning labels are present, visible, and durable.', fields: [
      { id: 'warning_checklist', label: 'Warning label checklist', type: 'richtext', helpText: 'List all required warning labels, their locations, and confirm durability (scratch, UV, moisture resistance).' },
      { id: 'photo_ref', label: 'Warning label photos', type: 'doc_reference', helpText: 'Link to photos of warning labels on the equipment.' },
    ]}],
  },
  '7.3': {
    clauseTitle: '7.3 — Maximum User Weight Marking',
    evidenceRequired: true,
    steps: [{ id: '7.3_max_weight', stepLabel: 'Max Weight Marking', requirementText: 'Verify maximum user weight is clearly and permanently marked.', fields: [
      { id: 'max_weight_details', label: 'Maximum user weight marking details', type: 'richtext', helpText: 'Confirm the maximum user weight is marked in kg, permanently attached, and visible to the user before and during use.' },
      { id: 'photo_ref', label: 'Photo evidence', type: 'doc_reference', helpText: 'Link to photo showing the maximum user weight marking.' },
    ]}],
  },
  // §8 Instructions
  '8.1': {
    clauseTitle: '8.1 — Assembly Instructions',
    evidenceRequired: true,
    steps: [{ id: '8.1_assembly', stepLabel: 'Assembly Instructions', requirementText: 'Provide clear, illustrated assembly instructions.', fields: [
      { id: 'assembly_content', label: 'Assembly instruction content', type: 'richtext', helpText: 'Describe the assembly instructions provided: illustrations, tool requirements, step-by-step procedures, and safety warnings during assembly.' },
      { id: 'assembly_doc_ref', label: 'Assembly instruction document', type: 'doc_reference', required: true, helpText: 'Link to the assembly instruction document.' },
    ]}],
  },
  '8.2': {
    clauseTitle: '8.2 — User Manual',
    evidenceRequired: true,
    steps: [{ id: '8.2_manual', stepLabel: 'User Manual', requirementText: 'Provide a comprehensive user manual.', fields: [
      { id: 'manual_content', label: 'User manual content summary', type: 'richtext', helpText: 'Summarize user manual contents: safe operation, adjustments, exercise descriptions, contraindications, and safety precautions.' },
      { id: 'manual_ref', label: 'User manual document', type: 'doc_reference', required: true, helpText: 'Link to the user manual.' },
    ]}],
  },
  '8.3': {
    clauseTitle: '8.3 — Training Instructions',
    evidenceRequired: true,
    steps: [{ id: '8.3_training', stepLabel: 'Training Instructions', requirementText: 'Provide training instructions for proper exercise techniques.', fields: [
      { id: 'training_content', label: 'Training instruction content', type: 'richtext', helpText: 'Describe exercise technique instructions, safety precautions per exercise, and any progression recommendations.' },
      { id: 'training_ref', label: 'Training instruction document', type: 'doc_reference', helpText: 'Link to training instructions.' },
    ]}],
  },
  '8.4': {
    clauseTitle: '8.4 — Safety Warnings in Documentation',
    evidenceRequired: true,
    steps: [{ id: '8.4_doc_warnings', stepLabel: 'Documentation Warnings', requirementText: 'Verify all required safety warnings are included in documentation.', fields: [
      { id: 'warning_checklist', label: 'Safety warnings in documentation', type: 'richtext', helpText: 'List all safety warnings and precautions included in the user documentation. Confirm they cover pre-exercise medical check, proper warm-up, age restrictions, etc.' },
    ]}],
  },
  '8.5': {
    clauseTitle: '8.5 — Maintenance Instructions',
    evidenceRequired: true,
    steps: [{ id: '8.5_maintenance', stepLabel: 'Maintenance Instructions', requirementText: 'Provide maintenance instructions covering inspections and wear part replacement.', fields: [
      { id: 'maintenance_content', label: 'Maintenance instruction content', type: 'richtext', helpText: 'Describe maintenance schedule, inspection intervals, wear part identification, lubrication points, and safety checks.' },
      { id: 'maintenance_ref', label: 'Maintenance instruction document', type: 'doc_reference', helpText: 'Link to maintenance instructions.' },
    ]}],
  },
  // §9 Display accuracy
  '9.1': {
    clauseTitle: '9.1 — Speed Display Accuracy',
    evidenceRequired: true,
    steps: [{ id: '9.1_speed', stepLabel: 'Speed Accuracy', requirementText: 'Verify speed display accuracy within standard tolerances.', fields: [
      { id: 'speed_accuracy', label: 'Speed display accuracy results', type: 'richtext', helpText: 'Provide accuracy data: measured vs. displayed speed at multiple points, tolerance band, and pass/fail determination. If not applicable, state N/A.' },
      { id: 'test_ref', label: 'Calibration test report', type: 'doc_reference', helpText: 'Link to speed display calibration test report.' },
    ]}],
  },
  '9.2': {
    clauseTitle: '9.2 — Distance Display Accuracy',
    evidenceRequired: true,
    steps: [{ id: '9.2_distance', stepLabel: 'Distance Accuracy', requirementText: 'Verify distance display accuracy within standard tolerances.', fields: [
      { id: 'distance_accuracy', label: 'Distance display accuracy results', type: 'richtext', helpText: 'Provide accuracy data: measured vs. displayed distance, tolerance band, and pass/fail. If not applicable, state N/A.' },
      { id: 'test_ref', label: 'Calibration test report', type: 'doc_reference', helpText: 'Link to distance display calibration test report.' },
    ]}],
  },
  '9.3': {
    clauseTitle: '9.3 — Power/Resistance Display Accuracy',
    evidenceRequired: true,
    steps: [{ id: '9.3_power', stepLabel: 'Power/Resistance Accuracy', requirementText: 'Verify power or resistance display accuracy within standard tolerances.', fields: [
      { id: 'power_accuracy', label: 'Power/resistance display accuracy results', type: 'richtext', helpText: 'Provide accuracy data: measured vs. displayed power/resistance at multiple levels, tolerance band, and pass/fail. If not applicable, state N/A.' },
      { id: 'test_ref', label: 'Calibration test report', type: 'doc_reference', helpText: 'Link to power/resistance calibration test report.' },
    ]}],
  },
};
