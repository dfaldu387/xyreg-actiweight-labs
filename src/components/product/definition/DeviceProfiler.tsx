import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HelpCircle, Save } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface DeviceProfilerData {
  deviceType: string;
  powerSource: string[];
  connectivity: string[];
  patientContact: string;
  invasiveness: string;
  sterility: string;
  softwareClass: string;
  aiMlFeatures: string[];
}

const mockDeviceData: DeviceProfilerData = {
  deviceType: "diagnostic",
  powerSource: ["battery", "mains"],
  connectivity: ["bluetooth", "wifi"],
  patientContact: "indirect",
  invasiveness: "non-invasive",
  sterility: "non-sterile",
  softwareClass: "class-a",
  aiMlFeatures: ["image-analysis"]
};

const deviceTypes = [
  { value: "diagnostic", label: "Diagnostic Device", tooltip: "Devices used to diagnose medical conditions" },
  { value: "therapeutic", label: "Therapeutic Device", tooltip: "Devices used for treatment purposes" },
  { value: "monitoring", label: "Monitoring Device", tooltip: "Devices for continuous patient monitoring" },
  { value: "surgical", label: "Surgical Device", tooltip: "Devices used during surgical procedures" }
];

const powerSources = [
  { value: "battery", label: "Battery Powered", tooltip: "Device operates on battery power" },
  { value: "mains", label: "Mains Powered", tooltip: "Device connects to electrical mains" },
  { value: "manual", label: "Manual Operation", tooltip: "Device requires no external power" },
  { value: "wireless", label: "Wireless Charging", tooltip: "Device charges wirelessly" }
];

const connectivityOptions = [
  { value: "bluetooth", label: "Bluetooth", tooltip: "Short-range wireless communication" },
  { value: "wifi", label: "Wi-Fi", tooltip: "Wireless network connectivity" },
  { value: "cellular", label: "Cellular", tooltip: "Mobile network connectivity" },
  { value: "usb", label: "USB", tooltip: "Wired USB connection" },
  { value: "none", label: "No Connectivity", tooltip: "Standalone device with no connectivity" }
];

const patientContactOptions = [
  { value: "direct", label: "Direct Contact", tooltip: "Device directly touches the patient" },
  { value: "indirect", label: "Indirect Contact", tooltip: "Device operates near but not touching patient" },
  { value: "none", label: "No Contact", tooltip: "Device operates independently of patient proximity" }
];

const invasivenessOptions = [
  { value: "non-invasive", label: "Non-Invasive", tooltip: "Device does not penetrate the body" },
  { value: "minimally-invasive", label: "Minimally Invasive", tooltip: "Device has limited body penetration" },
  { value: "invasive", label: "Invasive", tooltip: "Device significantly penetrates body tissues" }
];

const sterilityOptions = [
  { value: "sterile", label: "Sterile", tooltip: "Device must be sterile for use" },
  { value: "non-sterile", label: "Non-Sterile", tooltip: "Device does not require sterility" },
  { value: "sterilizable", label: "Sterilizable", tooltip: "Device can be sterilized by user" }
];

const softwareClasses = [
  { value: "class-a", label: "IEC 62304 Class A", tooltip: "Software with no contribution to hazardous situations or only contributes to non-injury hazards" },
  { value: "class-b", label: "IEC 62304 Class B", tooltip: "Software that contributes to non-life-threatening injury hazards" },
  { value: "class-c", label: "IEC 62304 Class C", tooltip: "Software that contributes to life-threatening injury hazards" },
  { value: "none", label: "No Software Components", tooltip: "Device contains no software components" }
];

const aiMlOptions = [
  { value: "image-analysis", label: "Image Analysis", tooltip: "AI/ML for medical image processing" },
  { value: "predictive-analytics", label: "Predictive Analytics", tooltip: "AI/ML for predicting outcomes" },
  { value: "natural-language", label: "Natural Language Processing", tooltip: "AI/ML for text/voice processing" },
  { value: "pattern-recognition", label: "Pattern Recognition", tooltip: "AI/ML for identifying patterns" },
  { value: "none", label: "No AI/ML Features", tooltip: "Device does not use AI/ML technologies" }
];

export function DeviceProfiler() {
  const [deviceData, setDeviceData] = useState<DeviceProfilerData>(mockDeviceData);
  const [isSaving, setIsSaving] = useState(false);

  const handleDeviceTypeChange = (value: string) => {
    setDeviceData(prev => ({ ...prev, deviceType: value }));
  };

  const handlePowerSourceChange = (value: string, checked: boolean) => {
    setDeviceData(prev => ({
      ...prev,
      powerSource: checked 
        ? [...prev.powerSource, value]
        : prev.powerSource.filter(ps => ps !== value)
    }));
  };

  const handleConnectivityChange = (value: string, checked: boolean) => {
    setDeviceData(prev => ({
      ...prev,
      connectivity: checked 
        ? [...prev.connectivity, value]
        : prev.connectivity.filter(c => c !== value)
    }));
  };

  const handleAiMlChange = (value: string, checked: boolean) => {
    setDeviceData(prev => ({
      ...prev,
      aiMlFeatures: checked 
        ? [...prev.aiMlFeatures, value]
        : prev.aiMlFeatures.filter(ai => ai !== value)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Device characteristics saved successfully");
  };

  const TooltipWrapper = ({ children, tooltip }: { children: React.ReactNode, tooltip: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {children}
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Device Characteristics Profile</h3>
          <p className="text-sm text-muted-foreground">Define the technical characteristics of your medical device</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Type</CardTitle>
            <CardDescription>Select the primary function of your device</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deviceData.deviceType} onValueChange={handleDeviceTypeChange}>
              {deviceTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <TooltipWrapper tooltip={type.tooltip}>
                    <Label htmlFor={type.value}>{type.label}</Label>
                  </TooltipWrapper>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Patient Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Contact</CardTitle>
            <CardDescription>How does the device interact with patients?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deviceData.patientContact} onValueChange={(value) => setDeviceData(prev => ({ ...prev, patientContact: value }))}>
              {patientContactOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`contact-${option.value}`} />
                  <TooltipWrapper tooltip={option.tooltip}>
                    <Label htmlFor={`contact-${option.value}`}>{option.label}</Label>
                  </TooltipWrapper>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Invasiveness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invasiveness Level</CardTitle>
            <CardDescription>How invasive is the device operation?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deviceData.invasiveness} onValueChange={(value) => setDeviceData(prev => ({ ...prev, invasiveness: value }))}>
              {invasivenessOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`invasive-${option.value}`} />
                  <TooltipWrapper tooltip={option.tooltip}>
                    <Label htmlFor={`invasive-${option.value}`}>{option.label}</Label>
                  </TooltipWrapper>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Sterility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sterility Requirements</CardTitle>
            <CardDescription>What are the sterility requirements?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deviceData.sterility} onValueChange={(value) => setDeviceData(prev => ({ ...prev, sterility: value }))}>
              {sterilityOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`sterile-${option.value}`} />
                  <TooltipWrapper tooltip={option.tooltip}>
                    <Label htmlFor={`sterile-${option.value}`}>{option.label}</Label>
                  </TooltipWrapper>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* IEC 62304 Software Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">IEC 62304 Software Classification</CardTitle>
            <CardDescription>
              Select the appropriate software safety classification according to IEC 62304. 
              Only applicable if your device contains software components (SiMD) or is software (SaMD).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deviceData.softwareClass} onValueChange={(value) => setDeviceData(prev => ({ ...prev, softwareClass: value }))}>
              {softwareClasses.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`software-${option.value}`} />
                  <TooltipWrapper tooltip={option.tooltip}>
                    <Label htmlFor={`software-${option.value}`}>{option.label}</Label>
                  </TooltipWrapper>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Multi-select sections */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Power Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Power Source</CardTitle>
            <CardDescription>Select all applicable power sources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {powerSources.map((source) => (
              <div key={source.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`power-${source.value}`}
                  checked={deviceData.powerSource.includes(source.value)}
                  onCheckedChange={(checked) => handlePowerSourceChange(source.value, checked as boolean)}
                />
                <TooltipWrapper tooltip={source.tooltip}>
                  <Label htmlFor={`power-${source.value}`}>{source.label}</Label>
                </TooltipWrapper>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Connectivity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connectivity</CardTitle>
            <CardDescription>Select all connectivity options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectivityOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`connectivity-${option.value}`}
                  checked={deviceData.connectivity.includes(option.value)}
                  onCheckedChange={(checked) => handleConnectivityChange(option.value, checked as boolean)}
                />
                <TooltipWrapper tooltip={option.tooltip}>
                  <Label htmlFor={`connectivity-${option.value}`}>{option.label}</Label>
                </TooltipWrapper>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI/ML Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI/ML Features</CardTitle>
            <CardDescription>Select all AI/ML capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiMlOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`aiml-${option.value}`}
                  checked={deviceData.aiMlFeatures.includes(option.value)}
                  onCheckedChange={(checked) => handleAiMlChange(option.value, checked as boolean)}
                />
                <TooltipWrapper tooltip={option.tooltip}>
                  <Label htmlFor={`aiml-${option.value}`}>{option.label}</Label>
                </TooltipWrapper>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}