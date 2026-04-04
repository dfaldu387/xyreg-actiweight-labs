import React from 'react';
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useParams } from 'react-router-dom';

interface DisabledMenuItemProps {
  /** Menu item name to display */
  name: string;
  /** Icon element */
  icon?: React.ReactNode;
  /** Custom tooltip message */
  tooltipMessage?: string;
  /** Plan name for default tooltip message */
  planName?: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Indentation level */
  level?: number;
  /** Whether this is a child item (pill style) */
  isChild?: boolean;
}

/**
 * Disabled menu item component that shows a grayed-out, locked menu item
 * with a tooltip explaining why it's disabled.
 *
 * Used when a menu item is disabled by the subscription plan's menu_access settings.
 */
export function DisabledMenuItem({
  name,
  icon,
  tooltipMessage,
  planName,
  className = '',
  level = 0,
  isChild = false,
}: DisabledMenuItemProps) {
  const navigate = useNavigate();
  const { companyName: urlCompanyName } = useParams<{ companyName: string }>();

  // Get company name from URL params or session storage
  const getCompanyName = (): string | null => {
    if (urlCompanyName) return urlCompanyName;

    // Fallback to session storage (for product pages)
    try {
      const contextStr = sessionStorage.getItem('xyreg_company_context_v2');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        return context.companyName || null;
      }
    } catch (e) {
      console.error('Error reading company context:', e);
    }
    return null;
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const companyName = getCompanyName();
    const targetUrl = companyName
      ? `/app/company/${encodeURIComponent(companyName)}/profile?tab=plan`
      : '/app/profile?tab=plan';
    navigate(targetUrl);
  };

  const defaultMessage = planName
    ? `This feature is not available on the ${planName} plan.`
    : 'This feature requires an upgraded plan.';

  const message = tooltipMessage || defaultMessage;
  const indentClass = level > 0 ? `ml-${level * 4}` : '';

  // Child items render as pill-style buttons
  if (isChild) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              bg-slate-100 text-slate-400 border border-slate-200
              cursor-not-allowed select-none
              ${className}
            `}
          >
            <Lock className="w-3 h-3" />
            <span>{name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              {message}{' '}
              <button
                onClick={handleUpgradeClick}
                className="text-amber-600 hover:text-amber-700 underline font-medium"
              >
                Upgrade to access it.
              </button>
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Parent items render as full-width buttons
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            w-full flex items-center justify-between p-3 rounded-lg
            cursor-not-allowed select-none transition-colors
            bg-slate-50 hover:bg-slate-100
            ${indentClass}
            ${className}
          `}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {icon && (
              <div className="w-5 h-5 text-slate-400 flex-shrink-0">
                {icon}
              </div>
            )}
            <span className="text-sm font-medium text-slate-400 truncate leading-tight">
              {name}
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            {message}{' '}
            <button
              onClick={handleUpgradeClick}
              className="text-amber-600 hover:text-amber-700 underline font-medium"
            >
              Upgrade to access it.
            </button>
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Disabled menu item for collapsed sidebar state
 */
export function DisabledMenuItemCollapsed({
  name,
  icon,
  tooltipMessage,
  planName,
  className = '',
}: DisabledMenuItemProps) {
  const navigate = useNavigate();
  const { companyName: urlCompanyName } = useParams<{ companyName: string }>();

  // Get company name from URL params or session storage
  const getCompanyName = (): string | null => {
    if (urlCompanyName) return urlCompanyName;

    // Fallback to session storage (for product pages)
    try {
      const contextStr = sessionStorage.getItem('xyreg_company_context_v2');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        return context.companyName || null;
      }
    } catch (e) {
      console.error('Error reading company context:', e);
    }
    return null;
  };

  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const companyName = getCompanyName();
    const targetUrl = companyName
      ? `/app/company/${encodeURIComponent(companyName)}/profile?tab=plan`
      : '/app/profile?tab=plan';
    navigate(targetUrl);
  };

  const defaultMessage = planName
    ? `${name} - Not available on ${planName} plan.`
    : `${name} - Upgrade required.`;

  const message = tooltipMessage || defaultMessage;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          className={`
            w-9 h-9 flex items-center justify-center rounded-lg
            cursor-not-allowed select-none
            bg-slate-50 hover:bg-slate-100
            ${className}
          `}
        >
          <div className="relative">
            {icon && (
              <div className="w-5 h-5 text-slate-400">
                {icon}
              </div>
            )}
            <Lock className="w-2.5 h-2.5 text-slate-500 absolute -bottom-0.5 -right-0.5" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="max-w-xs">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            {message}{' '}
            <button
              onClick={handleUpgradeClick}
              className="text-amber-600 hover:text-amber-700 underline font-medium"
            >
              Upgrade
            </button>
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default DisabledMenuItem;
