import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileCheck, Shield } from 'lucide-react';

// Custom node components
const ProcessNode = ({ data }: { data: { label: string; clause: string; description: string; category: string } }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'management': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'support': return 'bg-green-100 border-green-300 text-green-800';
      case 'operational': return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'improvement': return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'retained': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className={`px-3 py-2 rounded-lg border-2 shadow-sm min-w-[140px] ${getCategoryColor(data.category)}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="text-xs font-mono mb-1 opacity-70">{data.clause}</div>
      <div className="text-sm font-semibold">{data.label}</div>
      {data.description && (
        <div className="text-xs mt-1 opacity-75">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
};

const GroupNode = ({ data }: { data: { label: string; phase: string } }) => {
  const getPhaseStyle = (phase: string) => {
    switch (phase) {
      case 'plan': return 'bg-blue-50/80 border-blue-200';
      case 'do': return 'bg-green-50/80 border-green-200';
      case 'check': return 'bg-orange-50/80 border-orange-200';
      case 'act': return 'bg-purple-50/80 border-purple-200';
      default: return 'bg-gray-50/80 border-gray-200';
    }
  };

  return (
    <div className={`px-4 py-2 rounded-md border ${getPhaseStyle(data.phase)}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-60">{data.phase}</div>
      <div className="text-sm font-semibold">{data.label}</div>
    </div>
  );
};

const AlertNode = ({ data }: { data: { label: string; description: string } }) => (
  <div className="px-3 py-2 rounded-lg border-2 border-amber-400 bg-amber-50 shadow-md min-w-[160px] animate-pulse">
    <Handle type="target" position={Position.Top} className="!bg-amber-500" />
    <div className="flex items-center gap-1.5 mb-1">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
      <span className="text-xs font-semibold text-amber-800">FDA INSPECTION</span>
    </div>
    <div className="text-sm font-semibold text-amber-900">{data.label}</div>
    <div className="text-xs text-amber-700 mt-1">{data.description}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-amber-500" />
  </div>
);

// Risk-Based Rationale Node - QMSR requirement for documenting risk-proportionate decisions
const RationaleNode = ({ data }: { data: { label: string; description: string; documentType: string } }) => (
  <div className="px-3 py-2 rounded-lg border-2 border-indigo-400 bg-indigo-50 shadow-md min-w-[160px]">
    <Handle type="target" position={Position.Top} className="!bg-indigo-500" />
    <Handle type="target" position={Position.Left} id="left" className="!bg-indigo-500" />
    <div className="flex items-center gap-1.5 mb-1">
      <Shield className="h-3.5 w-3.5 text-indigo-600" />
      <span className="text-xs font-semibold text-indigo-800">QMSR RATIONALE</span>
    </div>
    <div className="text-sm font-semibold text-indigo-900">{data.label}</div>
    <div className="text-xs text-indigo-700 mt-1">{data.description}</div>
    <div className="text-[10px] font-mono text-indigo-500 mt-1">{data.documentType}</div>
    <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
    <Handle type="source" position={Position.Right} id="right" className="!bg-indigo-500" />
  </div>
);

const nodeTypes = {
  process: ProcessNode,
  group: GroupNode,
  alert: AlertNode,
  rationale: RationaleNode,
};

// Initial nodes representing QMSR/ISO 13485 process structure
const initialNodes: Node[] = [
  // PLAN Phase - Management Processes (Clause 5)
  { id: 'plan-label', type: 'group', position: { x: 50, y: 20 }, data: { label: 'Management Processes (Clause 5)', phase: 'plan' } },
  { id: 'mgmt-commitment', type: 'process', position: { x: 80, y: 80 }, data: { label: 'Management Commitment', clause: '5.1', description: 'Leadership & direction', category: 'management' } },
  { id: 'quality-policy', type: 'process', position: { x: 280, y: 80 }, data: { label: 'Quality Policy', clause: '5.3', description: 'Policy & objectives', category: 'management' } },
  { id: 'planning', type: 'process', position: { x: 480, y: 80 }, data: { label: 'QMS Planning', clause: '5.4', description: 'Planning & changes', category: 'management' } },
  { id: 'mgmt-review', type: 'alert', position: { x: 680, y: 70 }, data: { label: 'Management Review', description: 'Now subject to FDA inspection' } },

  // DO Phase - Support Processes (Clause 6)
  { id: 'do-support-label', type: 'group', position: { x: 50, y: 200 }, data: { label: 'Support Processes (Clause 6)', phase: 'do' } },
  { id: 'doc-control', type: 'process', position: { x: 80, y: 260 }, data: { label: 'Document Control', clause: '4.2', description: 'Document management', category: 'support' } },
  { id: 'human-resources', type: 'process', position: { x: 280, y: 260 }, data: { label: 'Human Resources', clause: '6.2', description: 'Competence & training', category: 'support' } },
  { id: 'infrastructure', type: 'process', position: { x: 480, y: 260 }, data: { label: 'Infrastructure', clause: '6.3', description: 'Facilities & equipment', category: 'support' } },
  { id: 'work-environment', type: 'process', position: { x: 680, y: 260 }, data: { label: 'Work Environment', clause: '6.4', description: 'Controlled conditions', category: 'support' } },

  // DO Phase - Operational Processes (Clause 7)
  { id: 'do-ops-label', type: 'group', position: { x: 50, y: 360 }, data: { label: 'Operational Processes (Clause 7)', phase: 'do' } },
  { id: 'customer-req', type: 'process', position: { x: 80, y: 420 }, data: { label: 'Customer Requirements', clause: '7.2', description: 'Requirement determination', category: 'operational' } },
  { id: 'design-dev', type: 'process', position: { x: 280, y: 420 }, data: { label: 'Design & Development', clause: '7.3', description: 'DHF equivalent', category: 'operational' } },
  { id: 'purchasing', type: 'alert', position: { x: 480, y: 410 }, data: { label: 'Purchasing & Suppliers', description: 'Supplier audits now inspectable' } },
  { id: 'production', type: 'process', position: { x: 680, y: 420 }, data: { label: 'Production & Service', clause: '7.5', description: 'DMR/DHR equivalent', category: 'operational' } },
  { id: 'risk-mgmt', type: 'process', position: { x: 880, y: 420 }, data: { label: 'Risk Management', clause: '7.1', description: 'ISO 14971 integration', category: 'operational' } },

  // Retained 820 Sections
  { id: 'retained-label', type: 'group', position: { x: 50, y: 520 }, data: { label: 'Retained Part 820 Sections', phase: 'act' } },
  { id: 'retained-complaints', type: 'process', position: { x: 80, y: 580 }, data: { label: '§820.35 Complaints', clause: '820.35', description: 'Enhanced requirements', category: 'retained' } },
  { id: 'retained-labeling', type: 'process', position: { x: 280, y: 580 }, data: { label: '§820.45 Labeling', clause: '820.45', description: 'Enhanced inspection', category: 'retained' } },
  { id: 'retained-traceability', type: 'process', position: { x: 480, y: 580 }, data: { label: '§820.10 Traceability', clause: '820.10', description: 'Life-supporting devices', category: 'retained' } },
  { id: 'retained-links', type: 'process', position: { x: 680, y: 580 }, data: { label: 'Regulatory Links', clause: '820.10', description: 'MDR, 806, 821, 830', category: 'retained' } },

  // CHECK/ACT Phase - Improvement Processes (Clause 8)
  { id: 'check-label', type: 'group', position: { x: 50, y: 680 }, data: { label: 'Improvement Processes (Clause 8)', phase: 'check' } },
  { id: 'feedback', type: 'process', position: { x: 80, y: 740 }, data: { label: 'Feedback & Monitoring', clause: '8.2.1', description: 'Customer feedback', category: 'improvement' } },
  { id: 'internal-audit', type: 'alert', position: { x: 280, y: 730 }, data: { label: 'Internal Audit', description: 'Now subject to FDA inspection' } },
  { id: 'nc-product', type: 'process', position: { x: 480, y: 740 }, data: { label: 'Nonconforming Product', clause: '8.3', description: 'NC control & rework', category: 'improvement' } },
  { id: 'capa', type: 'process', position: { x: 680, y: 740 }, data: { label: 'CAPA', clause: '8.5', description: 'Corrective/preventive', category: 'improvement' } },
  { id: 'data-analysis', type: 'process', position: { x: 880, y: 740 }, data: { label: 'Data Analysis', clause: '8.4', description: 'Trend analysis', category: 'improvement' } },

  // QMSR Risk-Based Rationale Documents (new for Feb 2026)
  { id: 'rbr-label', type: 'group', position: { x: 1050, y: 360 }, data: { label: 'Risk-Based Rationales (QMSR)', phase: 'do' } },
  { id: 'rbr-validation', type: 'rationale', position: { x: 1080, y: 420 }, data: { label: 'Validation Rationale', description: 'Test rigor justification', documentType: 'RBR-ENG-XXX' } },
  { id: 'rbr-supplier', type: 'rationale', position: { x: 1080, y: 520 }, data: { label: 'Supplier Rationale', description: 'Oversight level justification', documentType: 'RBR-SUP-XXX' } },
];

// Edges showing process interactions
const initialEdges: Edge[] = [
  // Plan to Do
  { id: 'e1', source: 'mgmt-commitment', target: 'quality-policy', animated: true },
  { id: 'e2', source: 'quality-policy', target: 'planning' },
  { id: 'e3', source: 'planning', target: 'mgmt-review' },
  { id: 'e4', source: 'mgmt-review', target: 'doc-control', type: 'smoothstep' },
  
  // Support processes
  { id: 'e5', source: 'doc-control', target: 'human-resources' },
  { id: 'e6', source: 'human-resources', target: 'infrastructure' },
  { id: 'e7', source: 'infrastructure', target: 'work-environment' },
  
  // Support to Operational
  { id: 'e8', source: 'work-environment', target: 'customer-req', type: 'smoothstep' },
  { id: 'e9', source: 'doc-control', target: 'design-dev', type: 'smoothstep', style: { strokeDasharray: '5 5' } },
  
  // Operational processes
  { id: 'e10', source: 'customer-req', target: 'design-dev' },
  { id: 'e11', source: 'design-dev', target: 'purchasing' },
  { id: 'e12', source: 'purchasing', target: 'production' },
  { id: 'e13', source: 'production', target: 'risk-mgmt' },
  { id: 'e14', source: 'risk-mgmt', target: 'design-dev', type: 'smoothstep', animated: true, style: { strokeDasharray: '5 5' } },
  
  // Retained sections links
  { id: 'e15', source: 'production', target: 'retained-complaints', type: 'smoothstep' },
  { id: 'e16', source: 'retained-complaints', target: 'retained-labeling' },
  { id: 'e17', source: 'retained-labeling', target: 'retained-traceability' },
  { id: 'e18', source: 'retained-traceability', target: 'retained-links' },
  
  // To Improvement
  { id: 'e19', source: 'retained-links', target: 'feedback', type: 'smoothstep' },
  { id: 'e20', source: 'feedback', target: 'internal-audit' },
  { id: 'e21', source: 'internal-audit', target: 'nc-product' },
  { id: 'e22', source: 'nc-product', target: 'capa' },
  { id: 'e23', source: 'capa', target: 'data-analysis' },
  
  // Feedback loop to management
  { id: 'e24', source: 'data-analysis', target: 'mgmt-review', type: 'smoothstep', animated: true, style: { stroke: '#6366f1' } },
  { id: 'e25', source: 'capa', target: 'mgmt-review', type: 'smoothstep', style: { strokeDasharray: '5 5' } },

  // Risk-Based Rationale connections (QMSR requirement)
  { id: 'e-rbr-1', source: 'risk-mgmt', target: 'rbr-validation', type: 'smoothstep', animated: true, style: { stroke: '#6366f1' }, label: 'Severity Input' },
  { id: 'e-rbr-2', source: 'purchasing', target: 'rbr-supplier', type: 'smoothstep', animated: true, style: { stroke: '#6366f1' }, label: 'Criticality' },
  { id: 'e-rbr-3', source: 'rbr-validation', target: 'design-dev', sourceHandle: 'right', type: 'smoothstep', style: { strokeDasharray: '5 5', stroke: '#6366f1' } },
  { id: 'e-rbr-4', source: 'rbr-supplier', target: 'doc-control', sourceHandle: 'right', type: 'smoothstep', style: { strokeDasharray: '5 5', stroke: '#6366f1' } },
];

export function QMSRProcessMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              QMSR Process Interaction Map
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ISO 13485:2016 + Retained 820
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              Visual representation of QMS processes per FDA QMSR structure (PDCA cycle)
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-blue-50">Management</Badge>
            <Badge variant="outline" className="bg-green-50">Support</Badge>
            <Badge variant="outline" className="bg-purple-50">Operational</Badge>
            <Badge variant="outline" className="bg-orange-50">Improvement</Badge>
            <Badge variant="outline" className="bg-red-50">Retained 820</Badge>
            <Badge variant="outline" className="bg-amber-50 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              FDA Inspectable
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[600px] w-full border-t">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background />
            <Controls position="bottom-left" />
            <MiniMap 
              nodeColor={(node) => {
                const category = node.data?.category as string;
                switch (category) {
                  case 'management': return '#93c5fd';
                  case 'support': return '#86efac';
                  case 'operational': return '#c4b5fd';
                  case 'improvement': return '#fdba74';
                  case 'retained': return '#fca5a5';
                  default: return '#e5e7eb';
                }
              }}
              position="top-right"
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}

export default QMSRProcessMap;
