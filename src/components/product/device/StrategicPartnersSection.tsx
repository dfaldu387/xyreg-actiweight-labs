import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Handshake, Factory, Stethoscope, FileCheck } from 'lucide-react';
import { InvestorVisibleBadge } from '@/components/ui/investor-visible-badge';

export interface StrategicPartners {
  distributionPartners?: string;
  manufacturingPartners?: string;
  clinicalPartners?: string;
  regulatoryPartners?: string;
}

interface StrategicPartnersSectionProps {
  partners: StrategicPartners;
  onChange: (partners: StrategicPartners) => void;
  isLoading?: boolean;
}

const PARTNER_FIELDS = [
  {
    key: 'distributionPartners' as const,
    label: 'Distribution Partners',
    icon: Handshake,
    placeholder: 'e.g., Regional distributors, Sales agents, Authorized dealers...',
    description: 'Partners who help distribute your product to end customers'
  },
  {
    key: 'manufacturingPartners' as const,
    label: 'Manufacturing Partners',
    icon: Factory,
    placeholder: 'e.g., Contract manufacturers, Sterilization providers, Component suppliers...',
    description: 'Partners involved in production and supply chain'
  },
  {
    key: 'clinicalPartners' as const,
    label: 'Clinical Partners',
    icon: Stethoscope,
    placeholder: 'e.g., CROs, KOLs, Clinical trial sites, Testing labs...',
    description: 'Partners for clinical evaluation and validation'
  },
  {
    key: 'regulatoryPartners' as const,
    label: 'Regulatory Partners',
    icon: FileCheck,
    placeholder: 'e.g., Notified Bodies, RA consultants, Authorized Representatives, FDA agents...',
    description: 'Partners who support regulatory compliance and market access'
  }
];

export function StrategicPartnersSection({
  partners = {},
  onChange,
  isLoading = false
}: StrategicPartnersSectionProps) {
  const handleFieldChange = (key: keyof StrategicPartners, value: string) => {
    onChange({ ...partners, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Strategic Partners</CardTitle>
          <InvestorVisibleBadge />
        </div>
        <p className="text-sm text-muted-foreground">
          Key partnerships that support your business model. These will appear in the Value Map for investors.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PARTNER_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor={field.key} className="font-medium">
                    {field.label}
                  </Label>
                </div>
                <Textarea
                  id={field.key}
                  value={partners[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  disabled={isLoading}
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
