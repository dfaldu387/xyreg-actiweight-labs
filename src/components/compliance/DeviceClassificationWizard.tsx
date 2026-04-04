
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { ReferenceDataService } from "@/services/referenceDataService";
import type { DeviceClassificationRule } from "@/types/referenceData";

interface DeviceCharacteristics {
  contact_type: string;
  invasive: boolean;
  surgically_invasive: boolean;
  implantable: boolean;
  active: boolean;
  duration: string;
  body_contact: string;
  energy_delivery: boolean;
  medicinal_substance: boolean;
}

export function DeviceClassificationWizard() {
  const [framework, setFramework] = useState<string>('EU_MDR');
  const [characteristics, setCharacteristics] = useState<DeviceCharacteristics>({
    contact_type: '',
    invasive: false,
    surgically_invasive: false,
    implantable: false,
    active: false,
    duration: '',
    body_contact: '',
    energy_delivery: false,
    medicinal_substance: false
  });
  const [result, setResult] = useState<{
    class: string;
    rules: DeviceClassificationRule[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClassify = async () => {
    setLoading(true);
    try {
      const classification = await ReferenceDataService.classifyDevice(framework, characteristics);
      setResult(classification);
    } catch (error) {
      console.error('Classification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassColor = (deviceClass: string) => {
    switch (deviceClass) {
      case 'Class I': return 'bg-green-100 text-green-800 border-green-200';
      case 'Class IIa': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Class IIb': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Class III': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6" data-tour="classification">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Device Classification Wizard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Regulatory Framework</Label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EU_MDR">EU MDR</SelectItem>
                  <SelectItem value="FDA_QSR">FDA QSR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_type">Contact Type</Label>
              <Select 
                value={characteristics.contact_type} 
                onValueChange={(value) => setCharacteristics(prev => ({ ...prev, contact_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-invasive">Non-invasive</SelectItem>
                  <SelectItem value="invasive">Invasive</SelectItem>
                  <SelectItem value="surgically_invasive">Surgically invasive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration of Contact</Label>
              <Select 
                value={characteristics.duration} 
                onValueChange={(value) => setCharacteristics(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary (≤60 minutes)</SelectItem>
                  <SelectItem value="short_term">Short term (60 minutes - 30 days)</SelectItem>
                  <SelectItem value="long_term">Long term ({'>'}30 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_contact">Body Contact Area</Label>
              <Select 
                value={characteristics.body_contact} 
                onValueChange={(value) => setCharacteristics(prev => ({ ...prev, body_contact: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skin">Intact skin</SelectItem>
                  <SelectItem value="injured_skin">Injured skin</SelectItem>
                  <SelectItem value="body_orifice">Body orifice</SelectItem>
                  <SelectItem value="blood">Blood/circulatory system</SelectItem>
                  <SelectItem value="heart_cns">Heart/CNS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'active', label: 'Active Device' },
              { key: 'implantable', label: 'Implantable' },
              { key: 'energy_delivery', label: 'Energy Delivery' },
              { key: 'medicinal_substance', label: 'Contains Medicine' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={key}
                  checked={characteristics[key as keyof DeviceCharacteristics] as boolean}
                  onChange={(e) => setCharacteristics(prev => ({ 
                    ...prev, 
                    [key]: e.target.checked 
                  }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor={key} className="text-sm">{label}</Label>
              </div>
            ))}
          </div>

          <Button onClick={handleClassify} disabled={loading} className="w-full">
            {loading ? 'Classifying...' : 'Classify Device'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Classification Result</span>
              <Badge className={getClassColor(result.class)}>
                {result.class}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Your device has been classified as {result.class}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This classification is based on {result.rules.length} applicable rule(s) from {framework}.
                </p>
              </div>
            </div>

            {result.rules.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Applicable Classification Rules:</h4>
                {result.rules.map((rule, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{rule.rule_number}</span>
                      <Badge variant="outline">{rule.resulting_class}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{rule.rule_description}</p>
                    {rule.examples.length > 0 && (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Examples:</span> {rule.examples.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
