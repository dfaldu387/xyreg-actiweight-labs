export interface ISO13485Phase {
  id: 'concept-planning' | 'design-inputs' | 'design-development' | 'verification-validation' | 'transfer-production' | 'market-surveillance';
  name: string;
  isoReference: string;
  description: string;
}

export const ISO_13485_PHASES: ISO13485Phase[] = [
  {
    id: 'concept-planning',
    name: 'Concept & Planning (ISO 13485 §7.1)',
    isoReference: 'ISO 13485 §7.1',
    description: '"Defining the Strategy" The initial stage where the medical need and commercial feasibility are validated. You define the project scope, allocate resources, identify regulatory pathways, and create the core plan that guides the entire project.',
  },
  {
    id: 'design-inputs',
    name: 'Design Inputs (ISO 13485 §7.3.3)',
    isoReference: 'ISO 13485 §7.3.3',
    description: '"Freezing the Requirements" The translation of vague user needs into precise, measurable technical requirements. This phase establishes exactly what the device must do, defining the performance, safety, and regulatory constraints that the engineering team must meet.',
  },
  {
    id: 'design-development',
    name: 'Design & Development (ISO 13485 §7.3.4)',
    isoReference: 'ISO 13485 §7.3.4',
    description: '"Building the Solution" The iterative engineering process of creating the device. This involves designing the physical architecture, writing software, creating schematics, and conducting technical reviews to ensure the emerging design aligns with the inputs.',
  },
  {
    id: 'verification-validation',
    name: 'Verification & Validation (ISO 13485 §7.3.5–6)',
    isoReference: 'ISO 13485 §7.3.5-6',
    description: '"Proving It Works" Verification: Testing to prove the device was built correctly (Does it meet the specs?). Validation: Testing to prove the right device was built (Does it actually help the user/patient in the real world?).',
  },
  {
    id: 'transfer-production',
    name: 'Transfer & Production (ISO 13485 §7.3.8, §7.5)',
    isoReference: 'ISO 13485 §7.3.8, §7.5',
    description: '"Scaling for Manufacture" Moving the design from R&D to the manufacturing floor. This involves freezing the "recipe" (Device Master Record), validating manufacturing equipment, training operators, and finalizing the supply chain.',
  },
  {
    id: 'market-surveillance',
    name: 'Market & Surveillance (ISO 13485 §8.2.1)',
    isoReference: 'ISO 13485 §8.2.1',
    description: '"Monitoring Real-World Safety" The active maintenance phase after launch. You continuously collect data on how the device performs in the field, handle customer complaints, report adverse events, and update risk management files.',
  },
];
