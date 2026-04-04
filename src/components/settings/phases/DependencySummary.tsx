import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface DependencySummaryProps {
  phase: any;
  getPhaseDependencies: (phaseId: string) => Promise<{ incoming: any[]; outgoing: any[] }>;
  getDependencyTypeLabel: (type: string) => string;
}

export function DependencySummary({ 
  phase, 
  getPhaseDependencies, 
  getDependencyTypeLabel 
}: DependencySummaryProps) {
  const [dependencies, setDependencies] = useState<{ incoming: any[]; outgoing: any[] }>({ 
    incoming: [], 
    outgoing: [] 
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      if (phase?.id) {
        const deps = await getPhaseDependencies(phase.id);
        setDependencies(deps);
      }
    };
    fetchDependencies();
  }, [phase?.id, getPhaseDependencies]);

  const incomingDeps = dependencies.incoming || [];
  const outgoingDeps = dependencies.outgoing || [];
  const hasDependencies = incomingDeps.length > 0 || outgoingDeps.length > 0;

  if (!hasDependencies) {
    return (
      <p className="text-sm text-muted-foreground">
        No dependencies defined for this phase
      </p>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {incomingDeps.length > 0 && (
        <div>
          <span className="font-medium text-muted-foreground">Depends on: </span>
          {incomingDeps.slice(0, 2).map((dep, index) => (
            <span key={dep.id}>
              {index > 0 && ', '}
              <Badge variant="secondary" className="text-xs">
                {dep.source_phase_name} ({getDependencyTypeLabel(dep.dependency_type)})
              </Badge>
            </span>
          ))}
          {incomingDeps.length > 2 && (
            <span className="text-muted-foreground"> +{incomingDeps.length - 2} more</span>
          )}
        </div>
      )}
      
      {outgoingDeps.length > 0 && (
        <div>
          <span className="font-medium text-muted-foreground">Controls: </span>
          {outgoingDeps.slice(0, 2).map((dep, index) => (
            <span key={dep.id}>
              {index > 0 && ', '}
              <Badge variant="secondary" className="text-xs">
                {dep.target_phase_name} ({getDependencyTypeLabel(dep.dependency_type)})
              </Badge>
            </span>
          ))}
          {outgoingDeps.length > 2 && (
            <span className="text-muted-foreground"> +{outgoingDeps.length - 2} more</span>
          )}
        </div>
      )}
    </div>
  );
}