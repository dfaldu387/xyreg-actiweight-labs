
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeviceComplianceSectionProps {
  deviceCompliance?: string[];
  onDeviceComplianceChange?: (compliance: string[]) => void;
  isLoading?: boolean;
}

export function DeviceComplianceSection({
  deviceCompliance = [],
  onDeviceComplianceChange,
  isLoading = false
}: DeviceComplianceSectionProps) {
  const [newCompliance, setNewCompliance] = useState('');

  const handleAddCompliance = () => {
    if (newCompliance.trim() && !deviceCompliance.includes(newCompliance.trim())) {
      onDeviceComplianceChange?.([...deviceCompliance, newCompliance.trim()]);
      setNewCompliance('');
    }
  };

  const handleRemoveCompliance = (index: number) => {
    const updated = deviceCompliance.filter((_, i) => i !== index);
    onDeviceComplianceChange?.(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>12. Device Compliance</CardTitle>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {deviceCompliance.map((compliance, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-2">
              {compliance}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveCompliance(index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newCompliance}
            onChange={(e) => setNewCompliance(e.target.value)}
            placeholder="e.g., IEC 60601-1, FDA 510(k), GDPR Compliant"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCompliance();
              }
            }}
          />
          <Button 
            onClick={handleAddCompliance} 
            disabled={!newCompliance.trim() || isLoading}
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Add additional compliance standards, certifications, or regulatory requirements that apply to your device.
        </p>
      </CardContent>
    </Card>
  );
}
