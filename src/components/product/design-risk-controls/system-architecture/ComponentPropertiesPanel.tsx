import React from 'react';
import { Node } from 'react-flow-renderer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface ComponentPropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, updates: Partial<Node>) => void;
  onClose: () => void;
}

export const ComponentPropertiesPanel: React.FC<ComponentPropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onClose,
}) => {
  const { lang } = useTranslation();

  if (!selectedNode) return null;

  const handleLabelChange = (value: string) => {
    onUpdateNode(selectedNode.id, {
      data: { ...selectedNode.data, label: value }
    });
  };

  const handleDescriptionChange = (value: string) => {
    onUpdateNode(selectedNode.id, {
      data: { ...selectedNode.data, description: value }
    });
  };

  const handleProtocolChange = (value: string) => {
    onUpdateNode(selectedNode.id, {
      data: { ...selectedNode.data, protocol: value }
    });
  };

  const handleVersionChange = (value: string) => {
    onUpdateNode(selectedNode.id, {
      data: { ...selectedNode.data, version: value }
    });
  };

  const handleManufacturerChange = (value: string) => {
    onUpdateNode(selectedNode.id, {
      data: { ...selectedNode.data, manufacturer: value }
    });
  };

  const handleRiskLevelChange = (value: string) => {
    onUpdateNode(selectedNode.id, {
      data: { ...selectedNode.data, riskLevel: value }
    });
  };

  return (
    <Card className="w-80 h-full overflow-y-auto border-l">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{lang('systemArchitecture.properties.title')}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="component-type">{lang('systemArchitecture.properties.type')}</Label>
          <Input
            id="component-type"
            value={selectedNode.type || 'default'}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="component-label">{lang('systemArchitecture.properties.label')} *</Label>
          <Input
            id="component-label"
            value={selectedNode.data?.label || ''}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder={lang('systemArchitecture.properties.labelPlaceholder')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="component-description">{lang('systemArchitecture.properties.description')}</Label>
          <Textarea
            id="component-description"
            value={selectedNode.data?.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder={lang('systemArchitecture.properties.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        {selectedNode.type === 'interface' && (
          <div className="space-y-2">
            <Label htmlFor="component-protocol">{lang('systemArchitecture.properties.protocol')}</Label>
            <Select
              value={selectedNode.data?.protocol || ''}
              onValueChange={handleProtocolChange}
            >
              <SelectTrigger id="component-protocol">
                <SelectValue placeholder={lang('systemArchitecture.properties.selectProtocol')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HL7">HL7</SelectItem>
                <SelectItem value="DICOM">DICOM</SelectItem>
                <SelectItem value="FHIR">FHIR</SelectItem>
                <SelectItem value="REST API">REST API</SelectItem>
                <SelectItem value="MQTT">MQTT</SelectItem>
                <SelectItem value="Bluetooth">Bluetooth</SelectItem>
                <SelectItem value="USB">USB</SelectItem>
                <SelectItem value="Serial">Serial</SelectItem>
                <SelectItem value="WiFi">WiFi</SelectItem>
                <SelectItem value="Custom">{lang('systemArchitecture.properties.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {(selectedNode.type === 'softwareModule' || selectedNode.type === 'hardwareComponent') && (
          <div className="space-y-2">
            <Label htmlFor="component-version">{lang('systemArchitecture.properties.version')}</Label>
            <Input
              id="component-version"
              value={selectedNode.data?.version || ''}
              onChange={(e) => handleVersionChange(e.target.value)}
              placeholder={lang('systemArchitecture.properties.versionPlaceholder')}
            />
          </div>
        )}

        {selectedNode.type === 'hardwareComponent' && (
          <div className="space-y-2">
            <Label htmlFor="component-manufacturer">{lang('systemArchitecture.properties.manufacturer')}</Label>
            <Input
              id="component-manufacturer"
              value={selectedNode.data?.manufacturer || ''}
              onChange={(e) => handleManufacturerChange(e.target.value)}
              placeholder={lang('systemArchitecture.properties.manufacturerPlaceholder')}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="component-risk">{lang('systemArchitecture.properties.riskLevel')}</Label>
          <Select
            value={selectedNode.data?.riskLevel || 'low'}
            onValueChange={handleRiskLevelChange}
          >
            <SelectTrigger id="component-risk">
              <SelectValue placeholder={lang('systemArchitecture.properties.selectRiskLevel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{lang('systemArchitecture.riskLevels.low')}</SelectItem>
              <SelectItem value="medium">{lang('systemArchitecture.riskLevels.medium')}</SelectItem>
              <SelectItem value="high">{lang('systemArchitecture.riskLevels.high')}</SelectItem>
              <SelectItem value="critical">{lang('systemArchitecture.riskLevels.critical')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">{lang('systemArchitecture.properties.position')}:</span>
            <span className="ml-2 font-mono text-xs">
              ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{lang('systemArchitecture.properties.id')}:</span>
            <span className="ml-2 font-mono text-xs">{selectedNode.id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
