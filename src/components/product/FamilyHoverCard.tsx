import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger, HoverCardPortal } from '@/components/ui/hover-card';
import { GitFork, Package, Rocket, AlertCircle, FileText } from 'lucide-react';
import { useBasicUDIAliases } from '@/hooks/useBasicUDIAliases';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className="truncate">{value ?? 'N/A'}</span>
    </div>
  );
}

interface FamilyHoverCardProps {
  basicUdiDi: string;
  companyId: string;
  devices: Array<{ id: string; name: string; status?: string | null }>;
  children: React.ReactNode;
}

export function FamilyHoverCard({ basicUdiDi, companyId, devices, children }: FamilyHoverCardProps) {
  const { getAlias, getDescription } = useBasicUDIAliases(companyId);
  
  const alias = getAlias(basicUdiDi);
  const description = getDescription(basicUdiDi);
  const displayName = alias || basicUdiDi;
  const memberCount = devices.length;
  
  const launchedCount = devices.filter(d => {
    const s = (d.status || '').toLowerCase();
    return s.includes('launch') || s.includes('market');
  }).length;
  
  const inDevCount = devices.filter(d => {
    const s = (d.status || '').toLowerCase();
    return s.includes('develop') || s.includes('design') || s.includes('concept');
  }).length;

  // Strip HTML tags for description preview
  const plainDescription = description
    ? description.replace(/<[^>]*>/g, '').slice(0, 150)
    : null;

  return (
    <HoverCard openDelay={400} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent side="right" align="start" sideOffset={16} className="w-80 p-4 z-[9999]">
          <div className="space-y-3">
            {/* Family name */}
            <div className="flex items-center gap-2">
              <GitFork className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground truncate">{displayName}</span>
            </div>

            {/* Description snippet */}
            {plainDescription && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-3">{plainDescription}{description && description.replace(/<[^>]*>/g, '').length > 150 ? '…' : ''}</span>
              </div>
            )}

            {/* KPIs */}
            <div className="space-y-1.5 pt-1 border-t">
              <InfoRow icon={Package} label="Total Devices" value={memberCount} />
              <InfoRow icon={Rocket} label="Launched" value={launchedCount} />
              <InfoRow icon={AlertCircle} label="In Development" value={inDevCount} />
            </div>
          </div>
        </HoverCardContent>
      </HoverCardPortal>
    </HoverCard>
  );
}
