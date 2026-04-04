import React from 'react';
import CompactScopeToggle from './CompactScopeToggle';

interface FieldScopeWrapperProps {
  /** The label content (text or JSX) */
  label: React.ReactNode;
  /** Unique key identifying this field */
  fieldKey: string;
  /** Current scope for this field */
  scopeView: 'individual' | 'product_family';
  /** Called when scope changes */
  onScopeChange: (scope: 'individual' | 'product_family') => void;
  /** Whether product belongs to a family (has model_id) */
  hasModel: boolean;
  /** Save status icon to show on the right */
  saveStatusIcon?: React.ReactNode;
  /** The field content (textarea, input, etc.) */
  children: React.ReactNode;
}

/**
 * Wraps a field with an inline IP/PF toggle in the label row.
 * Only shows the toggle when the product belongs to a product family.
 */
export function FieldScopeWrapper({
  label,
  fieldKey,
  scopeView,
  onScopeChange,
  hasModel,
  saveStatusIcon,
  children,
}: FieldScopeWrapperProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {label}
        </div>
        <div className="flex items-center gap-2">
          {hasModel && (
            <CompactScopeToggle
              scopeView={scopeView}
              onScopeChange={onScopeChange}
            />
          )}
          {saveStatusIcon}
        </div>
      </div>
      {children}
    </div>
  );
}
