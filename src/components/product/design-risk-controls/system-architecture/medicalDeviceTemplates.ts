import { Node, Edge } from 'react-flow-renderer';

export interface MedicalDeviceTemplate {
  id: string;
  name: string;
  category: 'SaMD' | 'SiMD' | 'EMDN' | 'RiskClass' | 'General';
  subcategory?: string;
  description: string;
  regulatoryNotes?: string;
  nodes: Node[];
  edges: Edge[];
}

export const medicalDeviceTemplates: MedicalDeviceTemplate[] = [
  // General Templates
  {
    id: 'blank',
    name: 'Blank Canvas',
    category: 'General',
    description: 'Start with an empty diagram',
    nodes: [],
    edges: [],
  },
  {
    id: 'basic-medtech',
    name: 'Basic MedTech Device',
    category: 'General',
    description: 'Simple medical device with basic components',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 250, y: 50 },
        data: { label: 'Sensor Unit', description: 'Primary sensing component', riskLevel: 'medium' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 250, y: 200 },
        data: { label: 'Processing Module', description: 'Data processing and analysis', riskLevel: 'medium' },
      },
      {
        id: '3',
        type: 'interface',
        position: { x: 250, y: 350 },
        data: { label: 'User Display', protocol: 'Custom', description: 'User interface', riskLevel: 'low' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
    ],
  },

  // SaMD Templates
  {
    id: 'samd-class-a',
    name: 'SaMD Class A (Low Risk)',
    category: 'SaMD',
    subcategory: 'Class A',
    description: 'Standalone software for informational purposes',
    regulatoryNotes: 'Minimal regulatory requirements. Focus on basic safety and data integrity.',
    nodes: [
      {
        id: '1',
        type: 'softwareModule',
        position: { x: 100, y: 50 },
        data: { label: 'Data Input Module', description: 'User data collection', version: '1.0', riskLevel: 'low' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 300, y: 50 },
        data: { label: 'Analytics Engine', description: 'Non-diagnostic analysis', version: '1.0', riskLevel: 'low' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 500, y: 50 },
        data: { label: 'Reporting Module', description: 'Generate informational reports', version: '1.0', riskLevel: 'low' },
      },
      {
        id: '4',
        type: 'externalSystem',
        position: { x: 300, y: 200 },
        data: { label: 'Cloud Storage', description: 'Data backup and sync', riskLevel: 'low' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e2-4', source: '2', target: '4', type: 'smoothstep' },
    ],
  },
  {
    id: 'samd-class-b',
    name: 'SaMD Class B (Moderate Risk)',
    category: 'SaMD',
    subcategory: 'Class B',
    description: 'Software aiding diagnosis for non-critical conditions',
    regulatoryNotes: 'Requires clinical validation. Must demonstrate safety and effectiveness.',
    nodes: [
      {
        id: '1',
        type: 'softwareModule',
        position: { x: 150, y: 50 },
        data: { label: 'Data Acquisition', description: 'Medical data input', version: '2.0', riskLevel: 'medium' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 350, y: 50 },
        data: { label: 'AI/ML Algorithm', description: 'Diagnostic assistance', version: '2.0', riskLevel: 'high' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 550, y: 50 },
        data: { label: 'Clinical Decision Support', description: 'Treatment recommendations', version: '2.0', riskLevel: 'high' },
      },
      {
        id: '4',
        type: 'interface',
        position: { x: 350, y: 200 },
        data: { label: 'HL7 Interface', protocol: 'HL7', description: 'EHR integration', riskLevel: 'medium' },
      },
      {
        id: '5',
        type: 'externalSystem',
        position: { x: 150, y: 200 },
        data: { label: 'Healthcare Provider System', description: 'Hospital IT infrastructure', riskLevel: 'medium' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' },
      { id: 'e4-5', source: '4', target: '5', type: 'smoothstep' },
    ],
  },
  {
    id: 'samd-class-c',
    name: 'SaMD Class C (High Risk)',
    category: 'SaMD',
    subcategory: 'Class C',
    description: 'Software for critical diagnostic or treatment decisions',
    regulatoryNotes: 'Extensive clinical validation required. Full quality management system needed.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 100, y: 50 },
        data: { label: 'Medical Imaging Device', description: 'CT/MRI scanner interface', riskLevel: 'critical' },
      },
      {
        id: '2',
        type: 'interface',
        position: { x: 100, y: 180 },
        data: { label: 'DICOM Interface', protocol: 'DICOM', description: 'Medical imaging protocol', riskLevel: 'high' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 350, y: 115 },
        data: { label: 'Image Processing', description: 'Advanced image analysis', version: '3.0', riskLevel: 'critical' },
      },
      {
        id: '4',
        type: 'softwareModule',
        position: { x: 600, y: 50 },
        data: { label: 'AI Diagnostic Engine', description: 'Deep learning diagnosis', version: '3.0', riskLevel: 'critical' },
      },
      {
        id: '5',
        type: 'softwareModule',
        position: { x: 600, y: 180 },
        data: { label: 'Treatment Planning', description: 'Therapy recommendations', version: '3.0', riskLevel: 'critical' },
      },
      {
        id: '6',
        type: 'externalSystem',
        position: { x: 350, y: 280 },
        data: { label: 'Audit & Compliance System', description: 'Regulatory tracking', riskLevel: 'high' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true },
      { id: 'e4-6', source: '4', target: '6', type: 'smoothstep' },
      { id: 'e5-6', source: '5', target: '6', type: 'smoothstep' },
    ],
  },

  // SiMD Templates
  {
    id: 'simd-embedded',
    name: 'SiMD - Embedded Controller',
    category: 'SiMD',
    subcategory: 'Embedded',
    description: 'Software integrated into medical device hardware',
    regulatoryNotes: 'Software safety classification per IEC 62304. Hardware-software integration testing required.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 150, y: 50 },
        data: { label: 'Microcontroller', description: 'Main processor unit', manufacturer: 'STMicroelectronics', riskLevel: 'high' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 150, y: 180 },
        data: { label: 'Firmware/RTOS', description: 'Real-time operating system', version: '1.5', riskLevel: 'high' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 350, y: 180 },
        data: { label: 'Control Algorithm', description: 'Device control logic', version: '1.5', riskLevel: 'critical' },
      },
      {
        id: '4',
        type: 'hardwareComponent',
        position: { x: 550, y: 50 },
        data: { label: 'Sensor Array', description: 'Multiple sensors', riskLevel: 'high' },
      },
      {
        id: '5',
        type: 'hardwareComponent',
        position: { x: 550, y: 180 },
        data: { label: 'Actuator System', description: 'Therapeutic delivery', riskLevel: 'critical' },
      },
      {
        id: '6',
        type: 'interface',
        position: { x: 350, y: 310 },
        data: { label: 'USB Interface', protocol: 'USB', description: 'Programming and diagnostics', riskLevel: 'medium' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true },
      { id: 'e3-6', source: '3', target: '6', type: 'smoothstep' },
    ],
  },
  {
    id: 'simd-iot',
    name: 'SiMD - IoT Connected Device',
    category: 'SiMD',
    subcategory: 'IoT',
    description: 'Medical device with cloud connectivity and mobile app',
    regulatoryNotes: 'Cybersecurity requirements per IEC 81001-5-1. Data privacy compliance needed.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 100, y: 100 },
        data: { label: 'Medical Device', description: 'Primary hardware unit', riskLevel: 'high' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 100, y: 250 },
        data: { label: 'Device Firmware', description: 'Embedded software', version: '2.0', riskLevel: 'high' },
      },
      {
        id: '3',
        type: 'interface',
        position: { x: 300, y: 175 },
        data: { label: 'Bluetooth LE', protocol: 'Bluetooth', description: 'Wireless communication', riskLevel: 'medium' },
      },
      {
        id: '4',
        type: 'softwareModule',
        position: { x: 500, y: 100 },
        data: { label: 'Mobile App', description: 'Patient interface', version: '2.0', riskLevel: 'medium' },
      },
      {
        id: '5',
        type: 'interface',
        position: { x: 500, y: 250 },
        data: { label: 'REST API', protocol: 'REST API', description: 'Cloud communication', riskLevel: 'medium' },
      },
      {
        id: '6',
        type: 'externalSystem',
        position: { x: 700, y: 175 },
        data: { label: 'Cloud Backend', description: 'Data storage and analytics', riskLevel: 'high' },
      },
      {
        id: '7',
        type: 'externalSystem',
        position: { x: 300, y: 350 },
        data: { label: 'Healthcare Provider Portal', description: 'Clinician dashboard', riskLevel: 'medium' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', animated: true },
      { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', animated: true },
      { id: 'e6-7', source: '6', target: '7', type: 'smoothstep' },
    ],
  },

  // EMDN-Based Templates
  {
    id: 'emdn-cardiovascular',
    name: 'Cardiovascular Device',
    category: 'EMDN',
    subcategory: 'C06 - Cardiovascular',
    description: 'Cardiac monitoring and diagnostic system',
    regulatoryNotes: 'High risk classification. Extensive clinical trials required.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 150, y: 50 },
        data: { label: 'ECG Electrodes', description: 'Patient contact sensors', riskLevel: 'high' },
      },
      {
        id: '2',
        type: 'hardwareComponent',
        position: { x: 150, y: 180 },
        data: { label: 'Signal Amplifier', description: 'ECG signal processing', riskLevel: 'high' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 400, y: 115 },
        data: { label: 'Arrhythmia Detection', description: 'AI-based cardiac analysis', version: '1.0', riskLevel: 'critical' },
      },
      {
        id: '4',
        type: 'softwareModule',
        position: { x: 650, y: 50 },
        data: { label: 'Alert System', description: 'Critical event notifications', version: '1.0', riskLevel: 'critical' },
      },
      {
        id: '5',
        type: 'interface',
        position: { x: 650, y: 180 },
        data: { label: 'Data Export', protocol: 'HL7', description: 'EMR integration', riskLevel: 'medium' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e3-5', source: '3', target: '5', type: 'smoothstep' },
    ],
  },
  {
    id: 'emdn-respiratory',
    name: 'Respiratory Support Device',
    category: 'EMDN',
    subcategory: 'D09 - Respiratory',
    description: 'Ventilation and respiratory monitoring system',
    regulatoryNotes: 'Life-sustaining device. Requires extensive safety analysis and testing.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 100, y: 100 },
        data: { label: 'Pressure Sensors', description: 'Airway pressure monitoring', riskLevel: 'critical' },
      },
      {
        id: '2',
        type: 'hardwareComponent',
        position: { x: 100, y: 250 },
        data: { label: 'Flow Sensors', description: 'Airflow measurement', riskLevel: 'critical' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 350, y: 175 },
        data: { label: 'Ventilation Control', description: 'Breathing cycle management', version: '1.0', riskLevel: 'critical' },
      },
      {
        id: '4',
        type: 'hardwareComponent',
        position: { x: 600, y: 100 },
        data: { label: 'Pneumatic System', description: 'Air delivery mechanism', riskLevel: 'critical' },
      },
      {
        id: '5',
        type: 'softwareModule',
        position: { x: 600, y: 250 },
        data: { label: 'Alarm Management', description: 'Safety monitoring', version: '1.0', riskLevel: 'critical' },
      },
    ],
    edges: [
      { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true },
    ],
  },
  {
    id: 'emdn-diagnostic-imaging',
    name: 'Diagnostic Imaging System',
    category: 'EMDN',
    subcategory: 'D10 - Imaging',
    description: 'Medical imaging device with AI analysis',
    regulatoryNotes: 'Radiation safety for X-ray/CT. AI algorithm validation required.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 150, y: 50 },
        data: { label: 'Imaging Sensor', description: 'X-ray/Ultrasound detector', riskLevel: 'high' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 150, y: 180 },
        data: { label: 'Image Acquisition', description: 'Raw image capture', version: '1.0', riskLevel: 'high' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 400, y: 115 },
        data: { label: 'Image Processing', description: 'Enhancement and filtering', version: '1.0', riskLevel: 'high' },
      },
      {
        id: '4',
        type: 'softwareModule',
        position: { x: 650, y: 50 },
        data: { label: 'AI Analysis', description: 'Automated detection', version: '1.0', riskLevel: 'high' },
      },
      {
        id: '5',
        type: 'interface',
        position: { x: 650, y: 180 },
        data: { label: 'DICOM Export', protocol: 'DICOM', description: 'Standard imaging format', riskLevel: 'medium' },
      },
      {
        id: '6',
        type: 'externalSystem',
        position: { x: 400, y: 280 },
        data: { label: 'PACS System', description: 'Image archiving', riskLevel: 'medium' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e3-5', source: '3', target: '5', type: 'smoothstep' },
      { id: 'e5-6', source: '5', target: '6', type: 'smoothstep' },
    ],
  },

  // Risk Class Templates
  {
    id: 'risk-class-i',
    name: 'Class I Device Architecture',
    category: 'RiskClass',
    subcategory: 'Class I',
    description: 'Low-risk medical device with minimal regulatory requirements',
    regulatoryNotes: 'General controls. Basic quality system required.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 200, y: 100 },
        data: { label: 'Primary Component', description: 'Main device hardware', riskLevel: 'low' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 450, y: 100 },
        data: { label: 'Basic Control', description: 'Simple control logic', version: '1.0', riskLevel: 'low' },
      },
      {
        id: '3',
        type: 'interface',
        position: { x: 325, y: 250 },
        data: { label: 'User Interface', protocol: 'Custom', description: 'Simple controls', riskLevel: 'low' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
    ],
  },
  {
    id: 'risk-class-iia',
    name: 'Class IIa Device Architecture',
    category: 'RiskClass',
    subcategory: 'Class IIa',
    description: 'Medium-risk device with moderate regulatory requirements',
    regulatoryNotes: 'Special controls required. Clinical evaluation needed.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 100, y: 80 },
        data: { label: 'Sensor System', description: 'Patient monitoring sensors', riskLevel: 'medium' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 300, y: 80 },
        data: { label: 'Data Processing', description: 'Signal analysis', version: '1.0', riskLevel: 'medium' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 500, y: 80 },
        data: { label: 'Safety Monitoring', description: 'Alert generation', version: '1.0', riskLevel: 'high' },
      },
      {
        id: '4',
        type: 'interface',
        position: { x: 300, y: 230 },
        data: { label: 'Communication', protocol: 'WiFi', description: 'Data transmission', riskLevel: 'medium' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' },
    ],
  },
  {
    id: 'risk-class-iii',
    name: 'Class III Device Architecture',
    category: 'RiskClass',
    subcategory: 'Class III',
    description: 'High-risk life-sustaining device',
    regulatoryNotes: 'Premarket approval required. Extensive clinical trials mandatory.',
    nodes: [
      {
        id: '1',
        type: 'hardwareComponent',
        position: { x: 100, y: 50 },
        data: { label: 'Critical Sensors', description: 'Life-critical monitoring', riskLevel: 'critical' },
      },
      {
        id: '2',
        type: 'softwareModule',
        position: { x: 100, y: 180 },
        data: { label: 'Safety Control System', description: 'IEC 62304 Class C', version: '1.0', riskLevel: 'critical' },
      },
      {
        id: '3',
        type: 'softwareModule',
        position: { x: 350, y: 115 },
        data: { label: 'Therapeutic Control', description: 'Treatment delivery', version: '1.0', riskLevel: 'critical' },
      },
      {
        id: '4',
        type: 'hardwareComponent',
        position: { x: 600, y: 50 },
        data: { label: 'Therapeutic Actuator', description: 'Direct patient intervention', riskLevel: 'critical' },
      },
      {
        id: '5',
        type: 'softwareModule',
        position: { x: 600, y: 180 },
        data: { label: 'Multi-Level Alarms', description: 'Redundant safety systems', version: '1.0', riskLevel: 'critical' },
      },
      {
        id: '6',
        type: 'externalSystem',
        position: { x: 350, y: 310 },
        data: { label: 'Clinical Monitoring System', description: 'Remote oversight', riskLevel: 'high' },
      },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
      { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
      { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', animated: true },
      { id: 'e3-5', source: '3', target: '5', type: 'smoothstep', animated: true },
      { id: 'e4-6', source: '4', target: '6', type: 'smoothstep' },
      { id: 'e5-6', source: '5', target: '6', type: 'smoothstep' },
    ],
  },
];

export const getTemplatesByCategory = (category: string) => {
  return medicalDeviceTemplates.filter(t => t.category === category);
};

export const getTemplateById = (id: string) => {
  return medicalDeviceTemplates.find(t => t.id === id);
};
