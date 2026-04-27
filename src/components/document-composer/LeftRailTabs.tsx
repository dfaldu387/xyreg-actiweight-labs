import React, { useState, useEffect } from 'react';
import { List, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentOutlinePanel } from './DocumentOutlinePanel';
import { DocumentConfigPanel } from './DocumentConfigPanel';

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
}: LeftRailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('outline');

  // Reset to outline whenever a different document is opened.
  useEffect(() => {
    setActiveTab('outline');
  }, [documentId]);

  // When collapsed externally, hide the entire rail (parent handles the reveal button)
  if (externalCollapsed) return null;

  return (
    <div className="flex shrink-0 h-full">
      {/* Vertical icon strip — always visible */}
      <div className="flex flex-col items-center gap-1 w-10 border-r bg-muted/30 py-2">
        <button
          onClick={() => setActiveTab('outline')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            activeTab === 'outline'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
          )}
          title="Table of contents"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTab('configure')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            activeTab === 'configure'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
          )}
          title="Configure document"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Active panel */}
      {activeTab === 'outline' ? (
        <DocumentOutlinePanel
          editorContainerRef={editorContainerRef}
          refreshTrigger={refreshTrigger}
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