import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QualityManualSidebar } from './QualityManualSidebar';
import { QualityManualSectionView } from './QualityManualSection';
import { QualityManualLaunchView } from './QualityManualLaunchView';
import { useQualityManual } from '@/hooks/useQualityManual';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QualityManualDashboardProps {
  companyId: string;
}

export function QualityManualDashboard({ companyId }: QualityManualDashboardProps) {
  const { companyName: companyNameParam } = useParams<{ companyName: string }>();
  const decodedCompanyName = companyNameParam ? decodeURIComponent(companyNameParam) : '';
  const {
    sections,
    exclusions,
    companyData,
    loading,
    saving,
    generating,
    updateSectionContent,
    generateSection,
    toggleExclusion,
    applyClassBasedExclusions,
  } = useQualityManual(companyId);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  const currentSection = activeSection ? sections.find(s => s.sectionKey === activeSection) : null;

  const handleSelectSection = useCallback((sectionKey: string | null) => {
    setActiveSection(sectionKey);
  }, []);

  const handleGenerateAll = useCallback(async () => {
    const missing = sections.filter(s => !exclusions.has(s.clause) && (!s.content || s.content.length <= 20));
    if (missing.length === 0) {
      toast.info('All applicable sections already have content');
      return;
    }
    setGeneratingAll(true);
    let generated = 0;
    for (const section of missing) {
      try {
        await generateSection(section.sectionKey);
        generated++;
      } catch { /* continue */ }
    }
    setGeneratingAll(false);
    toast.success(`Generated ${generated} of ${missing.length} sections`);
  }, [sections, exclusions, generateSection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-200px)]">
      {/* Content area */}
      {activeSection && currentSection ? (
        <div className="mr-[280px] lg:mr-[300px] xl:mr-[320px] p-6">
          <QualityManualSectionView
            section={currentSection}
            companyData={companyData}
            onContentChange={updateSectionContent}
            onGenerate={generateSection}
            generating={generating}
            saving={saving}
            companyId={companyId}
            companyName={decodedCompanyName}
          />
        </div>
      ) : (
        <QualityManualLaunchView
          sections={sections}
          exclusions={exclusions}
          onSelectSection={handleSelectSection}
          onToggleExclusion={toggleExclusion}
          companyId={companyId}
          companyName={decodedCompanyName}
          companyData={companyData}
          applyClassBasedExclusions={applyClassBasedExclusions}
        />
      )}

      {/* Sidebar */}
      <QualityManualSidebar
        sections={sections}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        generating={generating}
      />
    </div>
  );
}
