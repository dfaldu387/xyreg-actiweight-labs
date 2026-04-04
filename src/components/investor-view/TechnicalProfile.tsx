import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, TestTube2, Activity, Zap, Globe, Shield } from "lucide-react";

interface TechnicalProfileProps {
  primaryRegulatoryType: string;
  coreDeviceNature: string | null;
  isActiveDevice: boolean | null;
  targetMarket: string;
  classification: string;
}

export function TechnicalProfile({ 
  primaryRegulatoryType, 
  coreDeviceNature, 
  isActiveDevice,
  targetMarket, 
  classification 
}: TechnicalProfileProps) {
  const isIVD = primaryRegulatoryType.toLowerCase().includes('vitro');
  
  const stats = [
    { 
      label: "Primary Regulatory Type", 
      value: primaryRegulatoryType,
      icon: isIVD ? TestTube2 : Stethoscope,
      description: isIVD ? "In Vitro Diagnostic" : "Medical Device"
    },
  ];
  
  // Only show Core Device Nature for Medical Devices (not IVD)
  if (!isIVD) {
    stats.push({
      label: "Core Device Nature",
      value: coreDeviceNature || 'Not specified',
      icon: Activity,
      description: "Invasiveness classification"
    });
  }
  
  // Always show Active Device status
  stats.push({
    label: "Device Power Status",
    value: isActiveDevice === null ? 'Not specified' : (isActiveDevice ? 'Active Device' : 'Non-Active Device'),
    icon: Zap,
    description: isActiveDevice ? "Requires external energy" : "No external energy source"
  });
  
  stats.push(
    { 
      label: "Target Market", 
      value: targetMarket,
      icon: Globe,
      description: "Primary market focus"
    },
    { 
      label: "Risk Classification", 
      value: classification,
      icon: Shield,
      description: "Regulatory risk class"
    },
  );

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">
        Device Characteristics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {stat.label}
                  </div>
                  <div className="text-base font-semibold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
