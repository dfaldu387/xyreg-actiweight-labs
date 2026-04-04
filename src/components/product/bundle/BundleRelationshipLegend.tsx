import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RELATIONSHIP_COLORS = {
  component: { color: '#3b82f6', label: 'Component' },
  accessory: { color: '#10b981', label: 'Accessory' },
  consumable: { color: '#f59e0b', label: 'Consumable' },
  required: { color: '#ef4444', label: 'Required' },
  optional: { color: '#8b5cf6', label: 'Optional' },
  replacement_part: { color: '#6b7280', label: 'Replacement Part' },
};

interface BundleRelationshipLegendProps {
  activeTypes: Set<string>;
}

export function BundleRelationshipLegend({ activeTypes }: BundleRelationshipLegendProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Relationship Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {Object.entries(RELATIONSHIP_COLORS)
            .filter(([key]) => activeTypes.has(key))
            .map(([key, { color, label }]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{ borderColor: color }}
                />
                <span className="text-sm">{label}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
