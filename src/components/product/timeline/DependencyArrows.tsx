import React from 'react';
import { ProductPhaseDependency } from '@/services/productPhaseDependencyService';

interface DependencyArrowsProps {
  dependencies: ProductPhaseDependency[];
  phases: Array<{ id: string; name: string; position: { left: number; width: number } }>;
  containerHeight: number;
  rowHeight: number;
}

export function DependencyArrows({ dependencies, phases, containerHeight, rowHeight }: DependencyArrowsProps) {
  const getPhasePosition = (phaseId: string) => {
    return phases.find(p => p.id === phaseId)?.position;
  };

  const getDependencyColor = (type: ProductPhaseDependency['dependency_type']) => {
    switch (type) {
      case 'finish_to_start': return 'stroke-blue-500';
      case 'start_to_start': return 'stroke-green-500';
      case 'finish_to_finish': return 'stroke-orange-500';
      case 'start_to_finish': return 'stroke-purple-500';
      default: return 'stroke-gray-500';
    }
  };

  const getDependencyStyle = (type: ProductPhaseDependency['dependency_type']) => {
    switch (type) {
      case 'finish_to_start': return '4,2'; // Solid line
      case 'start_to_start': return '8,4'; // Dashed
      case 'finish_to_finish': return '2,2'; // Dotted
      case 'start_to_finish': return '12,6,2,6'; // Dash-dot
      default: return '4,2';
    }
  };

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-10" 
      style={{ height: containerHeight }}
      overflow="visible"
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          className="fill-current"
        >
          <polygon points="0 0, 8 3, 0 6" />
        </marker>
      </defs>
      
      {dependencies.map((dep) => {
        const sourcePos = getPhasePosition(dep.source_phase_id);
        const targetPos = getPhasePosition(dep.target_phase_id);
        
        if (!sourcePos || !targetPos) return null;

        // Calculate connection points based on dependency type
        let sourceX, targetX;
        switch (dep.dependency_type) {
          case 'finish_to_start':
            sourceX = sourcePos.left + sourcePos.width; // End of source
            targetX = targetPos.left; // Start of target
            break;
          case 'start_to_start':
            sourceX = sourcePos.left; // Start of source
            targetX = targetPos.left; // Start of target
            break;
          case 'finish_to_finish':
            sourceX = sourcePos.left + sourcePos.width; // End of source
            targetX = targetPos.left + targetPos.width; // End of target
            break;
          case 'start_to_finish':
            sourceX = sourcePos.left; // Start of source
            targetX = targetPos.left + targetPos.width; // End of target
            break;
          default:
            sourceX = sourcePos.left + sourcePos.width;
            targetX = targetPos.left;
        }

        // Convert percentage-based positions to actual pixels based on container
        const containerWidth = phases.length > 0 ? Math.max(...phases.map(p => p.position.left + p.position.width)) : 100;
        const actualSourceX = sourceX; // Already in correct units from position calculations
        const actualTargetX = targetX; // Already in correct units from position calculations

        // Calculate Y positions for each phase row
        const sourcePhaseIndex = phases.findIndex(p => p.id === dep.source_phase_id);
        const targetPhaseIndex = phases.findIndex(p => p.id === dep.target_phase_id);
        
        const sourceY = sourcePhaseIndex * rowHeight + rowHeight / 2;
        const targetY = targetPhaseIndex * rowHeight + rowHeight / 2;

        // Create curved path for better visibility
        const midX = (actualSourceX + actualTargetX) / 2;
        const curveOffset = Math.abs(actualTargetX - actualSourceX) * 0.3 + Math.abs(targetY - sourceY) * 0.1;
        const controlY1 = sourceY - curveOffset;
        const controlY2 = targetY - curveOffset;

        const pathData = `M ${actualSourceX} ${sourceY} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${actualTargetX} ${targetY}`;

        return (
          <g key={dep.id}>
            <path
              d={pathData}
              fill="none"
              className={`${getDependencyColor(dep.dependency_type)} opacity-70`}
              strokeWidth="2"
              strokeDasharray={getDependencyStyle(dep.dependency_type)}
              markerEnd="url(#arrowhead)"
            />
            <title>
              {`${dep.dependency_type.replace('_', ' ')} dependency${dep.lag_days > 0 ? ` (+${dep.lag_days} days lag)` : ''}`}
            </title>
            {/* Lag days indicator */}
            {dep.lag_days > 0 && (
              <text
                x={midX}
                y={Math.min(controlY1, controlY2) - 8}
                className="text-xs fill-current text-gray-600"
                textAnchor="middle"
              >
                +{dep.lag_days}d
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}