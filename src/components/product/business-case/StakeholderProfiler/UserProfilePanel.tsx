import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User, AlertTriangle } from 'lucide-react';
import { 
  USER_OPERATOR_OPTIONS, 
  USE_ENVIRONMENT_OPTIONS,
  HMI_TYPE_OPTIONS,
  HOST_PLATFORM_OPTIONS,
  DEPLOYMENT_ENVIRONMENT_OPTIONS,
} from './marketConfigurations';
import { SystemArchitecture } from './ArchitectureSelector';

export interface UserProfile {
  primary_operator: string;
  use_environment: string;
  pain_points: string;
  // SiMD-specific
  hmi_type?: string;
  // SaMD-specific
  host_platform?: string;
  deployment_environment?: string;
}

interface UserProfilePanelProps {
  value: UserProfile;
  onChange: (value: UserProfile) => void;
  disabled?: boolean;
  architecture?: SystemArchitecture;
}

export function UserProfilePanel({ value, onChange, disabled, architecture }: UserProfilePanelProps) {
  const handleChange = (field: keyof UserProfile, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const isSiMD = architecture === 'hardware_simd';
  const isSaMD = architecture === 'samd';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-500" />
          The User (Clinical)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Who physically uses the device
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Operator */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Who is the primary operator?
          </label>
          <Select 
            value={value.primary_operator || ''} 
            onValueChange={(v) => handleChange('primary_operator', v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator role..." />
            </SelectTrigger>
            <SelectContent>
              {USER_OPERATOR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Use Environment - Only for Pure Hardware and SiMD */}
        {(!architecture || architecture === 'pure_hardware' || isSiMD) && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Where is the device used?
            </label>
            <Select 
              value={value.use_environment || ''} 
              onValueChange={(v) => handleChange('use_environment', v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment..." />
              </SelectTrigger>
              <SelectContent>
                {USE_ENVIRONMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* SiMD-specific: HMI Type */}
        {isSiMD && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Human-Machine Interface (HMI)
            </label>
            <Select 
              value={value.hmi_type || ''} 
              onValueChange={(v) => handleChange('hmi_type', v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="How does the user interact?" />
              </SelectTrigger>
              <SelectContent>
                {HMI_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              SiMD requires IEC 62366 validation of hardware-software interaction
            </p>
            
            {/* Paired device warning */}
            {value.hmi_type === 'Paired_Tablet' && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Bluetooth/WiFi pairing adds IEC 62443 cybersecurity scope for device connectivity.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SaMD-specific: Host Platform */}
        {isSaMD && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Host Platform
              </label>
              <Select 
                value={value.host_platform || ''} 
                onValueChange={(v) => handleChange('host_platform', v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Where does the software run?" />
                </SelectTrigger>
                <SelectContent>
                  {HOST_PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Mobile app warning */}
              {value.host_platform === 'iOS_Android' && (
                <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    App Store review process adds 1-4 weeks to each release cycle. Plan for OS compatibility testing.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Deployment Environment
              </label>
              <Select 
                value={value.deployment_environment || ''} 
                onValueChange={(v) => handleChange('deployment_environment', v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Where is it hosted?" />
                </SelectTrigger>
                <SelectContent>
                  {DEPLOYMENT_ENVIRONMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                SaMD requires validation of the operating environment (OS updates, browser compatibility)
              </p>
            </div>
          </>
        )}

        {/* Pain Points */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            User Pain Points
          </label>
          <Textarea
            value={value.pain_points || ''}
            onChange={(e) => handleChange('pain_points', e.target.value)}
            placeholder="What problems does the user face with current solutions?"
            className="min-h-[100px] resize-none"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
