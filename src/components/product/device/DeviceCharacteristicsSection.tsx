import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeviceCharacteristics } from '@/types/client.d';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DeviceCharacteristicsSectionProps {
  characteristics: DeviceCharacteristics;
  onChange: (characteristics: DeviceCharacteristics) => void;
  isLoading?: boolean;
}

// Invasiveness options per MDR classification
const INVASIVENESS_OPTIONS = [
  { value: 'non-invasive', label: 'Non-invasive' },
  { value: 'body-orifice', label: 'Invasive (body orifice)' },
  { value: 'surgically-invasive', label: 'Surgically invasive' },
  { value: 'implantable', label: 'Implantable' }
];

// Duration of contact options per MDR
const DURATION_OPTIONS = [
  { value: 'transient', label: 'Transient (< 60 minutes)' },
  { value: 'short-term', label: 'Short-term (< 30 days)' },
  { value: 'long-term', label: 'Long-term (> 30 days)' }
];

export function DeviceCharacteristicsSection({
  characteristics = {},
  onChange,
  isLoading = false
}: DeviceCharacteristicsSectionProps) {
  const handleChange = (key: keyof DeviceCharacteristics, value: boolean) => {
    onChange({ ...characteristics, [key]: value });
  };

  const handleInvasivenessChange = (value: string) => {
    onChange({ ...characteristics, invasivenessLevel: value });
  };

  const handleDurationChange = (value: string) => {
    onChange({ ...characteristics, durationOfContact: value });
  };

  const handleActiveChange = (value: string) => {
    onChange({ ...characteristics, isActive: value === 'true' });
  };

  const characteristicGroups = [
    {
      title: "Device Type",
      items: [
        { key: "isImplantable", label: "Implantable Device" },
        { key: "isNonInvasive", label: "Non-invasive Device" },
        { key: "isInVitroDiagnostic", label: "In Vitro Diagnostic Device" }
      ]
    },
    {
      title: "Device Classification",
      items: [
        { key: "isReusableSurgicalInstrument", label: "Reusable Surgical Instrument" },
        { key: "isCustomMade", label: "Custom-made Device" },
        { key: "isSoftwareMobileApp", label: "Software/Mobile App" },
        { key: "isSystemOrProcedurePack", label: "System or Procedure Pack" }
      ]
    },
    {
      title: "Additional Characteristics",
      items: [
        { key: "containsHumanAnimalMaterial", label: "Contains Human/Animal Material" },
        { key: "incorporatesMedicinalSubstance", label: "Incorporates Medicinal Substance" },
        { key: "isAccessoryToMedicalDevice", label: "Accessory to Medical Device" },
        { key: "isSingleUse", label: "Single-use Device" },
        { key: "isReusable", label: "Reusable Device" }
      ]
    }
  ];

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0 space-y-6">
        {/* Core MDR Classification Fields */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-medium text-sm text-foreground">Core Classification Characteristics</h4>
          <p className="text-xs text-muted-foreground">
            These characteristics are fundamental for MDR/FDA classification and will be used by classification assistants.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {/* Invasiveness Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Invasiveness Level</Label>
              <Select
                value={(characteristics as any).invasivenessLevel || ''}
                onValueChange={handleInvasivenessChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select invasiveness..." />
                </SelectTrigger>
                <SelectContent>
                  {INVASIVENESS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Device */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Device</Label>
              <RadioGroup
                value={characteristics.isActive === true ? 'true' : characteristics.isActive === false ? 'false' : ''}
                onValueChange={handleActiveChange}
                disabled={isLoading}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="active-yes" />
                  <Label htmlFor="active-yes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="active-no" />
                  <Label htmlFor="active-no" className="font-normal">No</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Device relies on electrical/other energy source
              </p>
            </div>

            {/* Duration of Contact */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration of Contact</Label>
              <Select
                value={(characteristics as any).durationOfContact || ''}
                onValueChange={handleDurationChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration..." />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Existing checkbox groups */}
        {characteristicGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <h4 className="font-medium text-sm">{group.title}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {group.items.map((item) => (
                <div key={item.key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={item.key}
                    checked={characteristics[item.key as keyof DeviceCharacteristics] === true}
                    onCheckedChange={(checked) => {
                      handleChange(item.key as keyof DeviceCharacteristics, checked === true);
                    }}
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor={item.key}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}