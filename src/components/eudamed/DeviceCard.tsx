import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { EudamedDevice } from '@/hooks/useEudamedRegistry';
import { getEudamedDeviceLabel } from '@/utils/eudamedLabel';

interface DeviceCardProps {
  device: EudamedDevice;
  isSelected: boolean;
  onSelectionChange: (deviceId: string, selected: boolean) => void;
  searchTerm?: string;
}

const getRiskClassColor = (riskClass?: string): string => {
  switch (riskClass?.toLowerCase()) {
    case 'class i':
    case 'i':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'class iia':
    case 'iia':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'class iib':
    case 'iib':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'class iii':
    case 'iii':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const highlightText = (text: string, searchTerm?: string): React.ReactNode => {
  if (!searchTerm || !text) return text;
  
  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
        {part}
      </mark>
    ) : part
  );
};

export const DeviceCard = React.memo(({ device, isSelected, onSelectionChange, searchTerm }: DeviceCardProps) => {
  const deviceLabel = getEudamedDeviceLabel(device);
  const deviceId = device.udi_di;

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange(deviceId, checked);
  };

  const characteristics = [];
  if (device.is_implantable || device.implantable) characteristics.push('Implantable');
  if (device.is_sterile || device.sterile) characteristics.push('Sterile');
  if (device.is_single_use || device.single_use) characteristics.push('Single Use');
  if (device.is_reusable || device.reusable) characteristics.push('Reusable');
  if (device.is_measuring || device.measuring) characteristics.push('Measuring');
  if (device.is_active || device.active) characteristics.push('Active');

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardContent className="!p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`device-${deviceId}`}
            checked={isSelected}
            onCheckedChange={handleSelectionChange}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm leading-tight">
                {highlightText(deviceLabel, searchTerm)}
              </h4>
              
              {device.risk_class && (
                <Badge 
                  variant="outline" 
                  className={`text-xs shrink-0 ${getRiskClassColor(device.risk_class)}`}
                >
                  {`${device?.risk_class === "class-i" || device?.risk_class === "class_i" ? "Class I" : device?.risk_class === "class-ii" || device?.risk_class === "class_ii" ? "Class II" : device?.risk_class === "class-iia" || device?.risk_class === "class-2a" || device?.risk_class === "class_iia" ? "Class IIa" : device?.risk_class === "class-iib" || device?.risk_class === "class-2b" || device?.risk_class === "class_iib" ? "Class IIb" : device?.risk_class === "class-iii" || device?.risk_class === "class_iii" ? "Class III" : device?.risk_class}`}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              {device.device_model && (
                <p><span className="font-medium">Model:</span> {highlightText(device.device_model, searchTerm)}</p>
              )}
              
              {device.udi_di && (
                <p><span className="font-medium">UDI-DI:</span> {highlightText(device.udi_di, searchTerm)}</p>
              )}
              
              {device.basic_udi_di_code && (
                <p><span className="font-medium">Basic UDI-DI:</span> {device.basic_udi_di_code}</p>
              )}
              
              {device.trade_names && (
                <p><span className="font-medium">Trade Names:</span> {highlightText(device.trade_names, searchTerm)}</p>
              )}
            </div>
            
            {characteristics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {characteristics.map((char) => (
                  <Badge key={char} variant="secondary" className="text-xs">
                    {char}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DeviceCard.displayName = 'DeviceCard';