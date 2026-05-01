import React, { useState, useEffect } from 'react';
import { List, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import { DocumentConfigPanel } from './DocumentConfigPanel';
import { TemplateConfigPanel } from './TemplateConfigPanel';
import type { DocumentTemplate } from '@/types/documentComposer';

type Tab = 'outline' | 'configure';

interface LeftRailTabsProps {
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
  refreshTrigger?: number;
  documentId?: string | null;
  companyId?: string;
  productId?: string;
  showSectionNumbers?: boolean;
  onShowSectionNumbersChange?: (show: boolean) => void;
  configDisabled?: boolean;
  externalCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Forwarded to DocumentConfigPanel so the body header reflects classification changes immediately. */
  onIsRecordChange?: (isRecord: boolean) => void;
  /** When provided AND no documentId exists, the Configure tab renders a template-level view. */
  template?: DocumentTemplate | null;
}

export function LeftRailTabs({
  editorContainerRef,
  refreshTrigger,
  documentId,
  companyId,
  productId,
  showSectionNumbers,
  onShowSectionNumbersChange,
  configDisabled,
  externalCollapsed,
  onCollapsedChange,
  onIsRecordChange,
  template,
}: LeftRailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('outline');

  // Reset to outline whenever a different document is opened.
  useEffect(() => {
    setActiveTab('outline');
  }, [documentId]);

  const collapsed = !!externalCollapsed;

  const handleIconClick = (tab: Tab) => {
    if (collapsed) {
      // Re-open onto the requested tab
      setActiveTab(tab);
      onCollapsedChange?.(false);
      return;
    }
    if (tab === activeTab) {
      // Same icon clicked while open → collapse
      onCollapsedChange?.(true);
      return;
    }
    // Different tab → just switch
    setActiveTab(tab);
  };

  return (
    <div className="flex shrink-0 h-full">
      {/* Vertical icon strip — always visible */}
      <div className="flex flex-col items-center gap-1 w-10 border-r bg-muted/30 py-2">
        <button
          onClick={() => handleIconClick('outline')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            !collapsed && activeTab === 'outline'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
          )}
          title={!collapsed && activeTab === 'outline' ? 'Hide table of contents' : 'Show table of contents'}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleIconClick('configure')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            !collapsed && activeTab === 'configure'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
          )}
          title={!collapsed && activeTab === 'configure' ? 'Hide configure panel' : 'Configure document'}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Active panel — hidden when collapsed, but icon strip stays visible */}
      {collapsed ? null : activeTab === 'outline' ? (
        <DocumentOutlinePanel
          editorContainerRef={editorContainerRef}
          refreshTrigger={refreshTrigger}
        />
      ) : !documentId && template ? (
        <TemplateConfigPanel
          template={template}
          showSectionNumbers={showSectionNumbers}
          onShowSectionNumbersChange={onShowSectionNumbersChange}
        />
      ) : (
        <DocumentConfigPanel
          documentId={documentId}
          companyId={companyId}
          productId={productId}
          showSectionNumbers={showSectionNumbers}
          onShowSectionNumbersChange={onShowSectionNumbersChange}
          disabled={configDisabled}
          onIsRecordChange={onIsRecordChange}
        />
      )}
    </div>
  );
}