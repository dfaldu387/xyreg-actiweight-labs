import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Wrench, Cpu, Smartphone, AlertTriangle } from 'lucide-react';

export type SystemArchitecture = 'pure_hardware' | 'hardware_simd' | 'samd' | '';

interface ArchitectureSelectorProps {
  value: SystemArchitecture;
  onChange: (value: SystemArchitecture) => void;
  disabled?: boolean;
}

const ARCHITECTURE_OPTIONS = [
  {
    value: 'pure_hardware' as const,
    label: 'No Software Used',
    icon: Wrench,
    description: 'Device has no software components',
    examples: 'Implants, instruments, passive devices',
  },
  {
    value: 'hardware_simd' as const,
    label: 'SiMD (Software in a Medical Device)',
    icon: Cpu,
    description: 'Device contains embedded software',
    examples: 'Pacemaker firmware, MRI GUI, infusion pump',
  },
  {
    value: 'samd' as const,
    label: 'Software as a Medical Device (SaMD)',
    icon: Smartphone,
    description: 'Software functions as the medical device',
    examples: 'AI diagnostics, dosing apps, clinical decision support',
  },
];

export function ArchitectureSelector({ value, onChange, disabled }: ArchitectureSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cpu className="h-5 w-5 text-primary" />
          System Architecture
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          This determines which regulatory requirements and stakeholder questions apply
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleGroup
          type="single"
          value={value}
          onValueChange={(v) => onChange(v as SystemArchitecture)}
          disabled={disabled}
          className="flex flex-col sm:flex-row gap-2"
        >
          {ARCHITECTURE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = value === opt.value;
            return (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className={`flex-1 flex flex-col items-start gap-1 p-4 h-auto border transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">{opt.label}</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">{opt.description}</p>
                <p className="text-xs text-muted-foreground/70 italic text-left">e.g., {opt.examples}</p>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        {/* Architecture-specific guidance */}
        {value === 'hardware_simd' && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <p className="font-medium">SiMD Guidance:</p>
              <p>The software is a <strong>component</strong> of the hardware. Validation focuses on hardware-software interaction (IEC 62304, IEC 62443).</p>
            </div>
          </div>
        )}

        {value === 'samd' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium">SaMD Guidance:</p>
              <p>The software IS the medical device. IT is the gatekeeper. Focus on data security (SOC2, HIPAA), platform compatibility, and cybersecurity (IEC 81001-5-1).</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
