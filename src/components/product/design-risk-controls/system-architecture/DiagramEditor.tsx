import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  MarkerType,
  Handle,
  Position,
} from 'react-flow-renderer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Download, Upload, Zap, Monitor, Smartphone, Wifi, Database, Cloud, Cpu, HardDrive, Box } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { ComponentPropertiesPanel } from './ComponentPropertiesPanel';

// Custom node types with connection handles
const nodeTypes = {
  hardwareComponent: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-border min-w-[120px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-primary" />
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-primary" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      {data.specs && (
        <div className="text-xs text-muted-foreground mt-1">{data.specs}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-primary" />
    </div>
  ),
  softwareModule: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-300 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-600" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-600" />
      <div className="flex items-center gap-2">
        <Monitor className="h-4 w-4 text-blue-600" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      {data.version && (
        <Badge variant="secondary" className="text-xs mt-1">{data.version}</Badge>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-600" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-600" />
    </div>
  ),
  interface: ({ data }: { data: any }) => (
    <div className="px-3 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-300 min-w-[100px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-600" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-green-600" />
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-green-600" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      {data.protocol && (
        <div className="text-xs text-muted-foreground mt-1">{data.protocol}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-600" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-green-600" />
    </div>
  ),
  externalSystem: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-300 min-w-[120px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-600" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-purple-600" />
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-purple-600" />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-muted-foreground mt-1">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-600" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-purple-600" />
    </div>
  ),
  groupNode: ({ data }: { data: any }) => (
    <div className="px-6 py-4 rounded-lg bg-muted/30 border-2 border-dashed border-muted-foreground/30 min-w-[200px] min-h-[150px]">
      <div className="flex items-center gap-2 mb-2">
        <Box className="h-4 w-4 text-muted-foreground" />
        <div className="font-medium text-sm text-muted-foreground">{data.label}</div>
      </div>
      {data.description && (
        <div className="text-xs text-muted-foreground/70">{data.description}</div>
      )}
    </div>
  ),
};

interface DiagramEditorProps {
  initialData?: any;
  onSave?: (data: any) => void;
  onClose?: () => void;
  diagramName?: string;
}

export function DiagramEditor({ initialData, onSave, onClose, diagramName }: DiagramEditorProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  
  const initialNodes: Node[] = initialData?.nodes || [];
  const initialEdges: Edge[] = initialData?.edges || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState('hardwareComponent');

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowPropertiesPanel(true);
  }, []);

  const onUpdateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, ...updates };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${edges.length + 1}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
          width: 20,
          height: 20,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edges.length, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${nodes.length + 1}`,
        type: selectedNodeType,
        position,
        data: { 
          label: `New ${selectedNodeType}`,
          ...(selectedNodeType === 'hardwareComponent' && { specs: 'Specifications' }),
          ...(selectedNodeType === 'softwareModule' && { version: 'v1.0' }),
          ...(selectedNodeType === 'interface' && { protocol: 'Protocol' }),
          ...(selectedNodeType === 'externalSystem' && { description: 'Description' }),
          ...(selectedNodeType === 'groupNode' && { description: 'Group description' }),
        },
        ...(selectedNodeType === 'groupNode' && { 
          style: { 
            width: 300, 
            height: 200,
            zIndex: -1,
          } 
        }),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes.length, selectedNodeType, setNodes]
  );

  const handleSave = () => {
    const diagramData = {
      nodes,
      edges,
    };
    onSave?.(diagramData);
    toast({
      title: lang('systemArchitecture.toast.saveSuccess'),
      description: lang('systemArchitecture.toast.saveSuccessDesc'),
    });
  };

  const handleExport = () => {
    const diagramData = {
      nodes,
      edges,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };
    
    const dataStr = JSON.stringify(diagramData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${diagramName || 'system-architecture'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: lang('systemArchitecture.toast.exportSuccess'),
      description: lang('systemArchitecture.toast.exportedAsJson'),
    });
  };

  const componentTypes = [
    { type: 'hardwareComponent', label: lang('systemArchitecture.components.hardware'), icon: Cpu, color: 'bg-gray-100' },
    { type: 'softwareModule', label: lang('systemArchitecture.components.software'), icon: Monitor, color: 'bg-blue-100' },
    { type: 'interface', label: lang('systemArchitecture.components.interface'), icon: Wifi, color: 'bg-green-100' },
    { type: 'externalSystem', label: lang('systemArchitecture.components.external'), icon: Cloud, color: 'bg-purple-100' },
    { type: 'groupNode', label: lang('systemArchitecture.components.groupBox'), icon: Box, color: 'bg-muted/20' },
  ];

  return (
    <div className="h-full flex">
      {/* Component Palette */}
      <Card className="w-64 m-4 flex-shrink-0">
        <CardHeader>
          <CardTitle className="text-sm">{lang('systemArchitecture.editor.components')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {componentTypes.map((component) => {
            const Icon = component.icon;
            return (
              <div
                key={component.type}
                className={`p-3 rounded-md border cursor-grab ${
                  selectedNodeType === component.type 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                } ${component.color}`}
                draggable
                onDragStart={(event) => {
                  setSelectedNodeType(component.type);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => setSelectedNodeType(component.type)}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{component.label}</span>
                </div>
              </div>
            );
          })}
          
          <Separator className="my-4" />

          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">{lang('systemArchitecture.editor.howToUse')}</p>
            <ul className="list-disc list-inside space-y-1">
              <li>{lang('systemArchitecture.editor.hint1')}</li>
              <li>{lang('systemArchitecture.editor.hint2')}</li>
              <li>{lang('systemArchitecture.editor.hint3')}</li>
              <li>{lang('systemArchitecture.editor.hint4')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{diagramName || lang('systemArchitecture.title')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                {lang('systemArchitecture.actions.export')}
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {lang('systemArchitecture.actions.save')}
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  {lang('common.close')}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
            connectionLineStyle={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
          >
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'hardwareComponent': return '#6b7280';
                  case 'softwareModule': return '#3b82f6';
                  case 'interface': return '#10b981';
                  case 'externalSystem': return '#8b5cf6';
                  default: return '#6b7280';
                }
              }}
            />
            <Background />
          </ReactFlow>
        </div>
      </div>
      
      {/* Properties Panel */}
      {showPropertiesPanel && (
        <ComponentPropertiesPanel
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
          onClose={() => {
            setShowPropertiesPanel(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}

export function DiagramEditorWrapper(props: DiagramEditorProps) {
  return (
    <ReactFlowProvider>
      <DiagramEditor {...props} />
    </ReactFlowProvider>
  );
}