import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, PenTool, Shield, ClipboardList } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { AuditCategory } from '@/types/auditTrail';

interface AuditTrailCategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categoryConfig: { value: string; labelKey: string; icon: React.ReactNode }[] = [
  { value: 'All', labelKey: 'auditLog.tabs.all', icon: null },
  { value: 'document_record', labelKey: 'auditLog.tabs.documentsAndRecords', icon: <FileText className="w-3.5 h-3.5" /> },
  { value: 'e_signature', labelKey: 'auditLog.tabs.eSignatures', icon: <PenTool className="w-3.5 h-3.5" /> },
  { value: 'user_access_security', labelKey: 'auditLog.tabs.userAccess', icon: <Shield className="w-3.5 h-3.5" /> },
  { value: 'quality_process', labelKey: 'auditLog.tabs.qualityProcesses', icon: <ClipboardList className="w-3.5 h-3.5" /> },
];

export function AuditTrailCategoryTabs({ activeCategory, onCategoryChange }: AuditTrailCategoryTabsProps) {
  const { lang } = useTranslation();

  return (
    <Tabs value={activeCategory} onValueChange={onCategoryChange}>
      <TabsList className="grid w-full grid-cols-5">
        {categoryConfig.map((cat) => (
          <TabsTrigger key={cat.value} value={cat.value} className="flex items-center gap-1.5 text-xs">
            {cat.icon}
            {lang(cat.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
