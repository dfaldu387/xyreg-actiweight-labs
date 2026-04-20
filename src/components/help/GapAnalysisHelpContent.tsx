import React from 'react';
import { useGapAnalysisHelp } from '@/context/GapAnalysisHelpContext';
import { IEC_62304_HELP, type GapClauseHelp } from '@/data/gapAnalysisHelpData';
import { IEC_60601_HELP } from '@/data/gapIEC60601HelpData';
import { IEC_60601_1_2_HELP } from '@/data/gapIEC60601_1_2HelpData';
import { IEC_60601_1_6_HELP } from '@/data/gapIEC60601_1_6HelpData';
import { MDR_ANNEX_II_HELP } from '@/data/gapAnnexIIHelpData';
import { MDR_ANNEX_III_HELP } from '@/data/gapAnnexIIIHelpData';
import { ISO_14971_DEVICE_HELP } from '@/data/gapISO14971DeviceHelpData';
import { MDR_ANNEX_I_HELP } from '@/data/gapAnnexIHelpData';
import { IEC_62366_HELP } from '@/data/gapIEC62366HelpData';
import { ISO_10993_HELP } from '@/data/gapISO10993HelpData';
import { ISO_15223_HELP } from '@/data/gapISO15223HelpData';
import { ISO_20417_HELP } from '@/data/gapISO20417HelpData';
import { IEC_20957_HELP } from '@/data/gapIEC20957HelpData';
import { ISO_13485_HELP } from '@/data/gapISO13485HelpData';
import { ISO_14971_ENTERPRISE_HELP } from '@/data/gapISO14971EnterpriseHelpData';
import { CMDR_HELP } from '@/data/gapCMDRHelpData';
import { TGA_HELP } from '@/data/gapTGAHelpData';
import { PMDA_HELP } from '@/data/gapPMDAHelpData';
import { NMPA_HELP } from '@/data/gapNMPAHelpData';
import { ANVISA_HELP } from '@/data/gapANVISAHelpData';
import { CDSCO_HELP } from '@/data/gapCDSCOHelpData';
import { UKCA_MDR_HELP } from '@/data/gapUKCAMDRHelpData';
import { MEPSW_HELP } from '@/data/gapMEPSWHelpData';
import { KFDA_HELP } from '@/data/gapKFDAHelpData';
import { PPWR_HELP } from '@/data/gapPPWRHelpData';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  FileText, 
  Shield, 
  BookOpen, 
  Target,
  Info,
  Cpu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Reusable styled blocks
const HelpSection: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2">
      {icon}
      {title}
    </h4>
    {children}
  </div>
);

const TipCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
    <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

const WarningCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground">{children}</p>
  </div>
);

function ClauseHelpContent({ help }: { help: GapClauseHelp }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base">§{help.section}: {help.title}</h3>
          <Badge variant="outline" className="mt-1 text-xs">{help.safetyClassNote || 'All classes'}</Badge>
        </div>
      </div>

      {/* Overview */}
      <HelpSection title="What This Clause Requires" icon={<BookOpen className="h-4 w-4 text-primary" />}>
        <p className="text-sm text-muted-foreground leading-relaxed">{help.overview}</p>
      </HelpSection>

      {/* Why It Matters */}
      <HelpSection title="Why It Matters" icon={<Target className="h-4 w-4 text-amber-600" />}>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{help.whyItMatters}</p>
        </div>
      </HelpSection>

      {/* Auditor Expectations */}
      <HelpSection title="What Auditors Expect to See" icon={<Shield className="h-4 w-4 text-blue-600" />}>
        <ul className="space-y-1.5">
          {help.expectations.map((exp, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{exp}</span>
            </li>
          ))}
        </ul>
      </HelpSection>

      {/* Key Deliverables */}
      {help.keyDeliverables && help.keyDeliverables.length > 0 && (
        <HelpSection title="Key Deliverables" icon={<FileText className="h-4 w-4 text-primary" />}>
          <div className="flex flex-wrap gap-1.5">
            {help.keyDeliverables.map((d, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {d}
              </Badge>
            ))}
          </div>
        </HelpSection>
      )}

      {/* Tips */}
      <HelpSection title="Practical Tips" icon={<Lightbulb className="h-4 w-4 text-primary" />}>
        <div className="space-y-2">
          {help.tips.map((tip, i) => (
            <TipCard key={i}>{tip}</TipCard>
          ))}
        </div>
      </HelpSection>

      {/* Common Pitfalls */}
      {help.commonPitfalls && help.commonPitfalls.length > 0 && (
        <HelpSection title="Common Pitfalls to Avoid" icon={<AlertTriangle className="h-4 w-4 text-destructive" />}>
          <div className="space-y-2">
            {help.commonPitfalls.map((pitfall, i) => (
              <WarningCard key={i}>{pitfall}</WarningCard>
            ))}
          </div>
        </HelpSection>
      )}

      {/* Related Clauses */}
      {help.relatedClauses && help.relatedClauses.length > 0 && (
        <HelpSection title="Related References" icon={<Info className="h-4 w-4 text-muted-foreground" />}>
          <div className="flex flex-wrap gap-1.5">
            {help.relatedClauses.map((ref, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">
                {ref}
              </Badge>
            ))}
          </div>
        </HelpSection>
      )}
    </div>
  );
}

function getHelpForFramework(framework: string, section: string): GapClauseHelp | null {
  const fwLower = framework.toLowerCase();
  if (fwLower.includes('62304')) {
    return IEC_62304_HELP[section] || null;
  }
  if (fwLower.includes('60601-1-2')) {
    return IEC_60601_1_2_HELP[section] || null;
  }
  if (fwLower.includes('60601-1-6')) {
    return IEC_60601_1_6_HELP[section] || null;
  }
  if (fwLower.includes('60601')) {
    return IEC_60601_HELP[section] || null;
  }
  if (fwLower.includes('annex iii') || fwLower.includes('annex_iii')) {
    return MDR_ANNEX_III_HELP[section] || null;
  }
  if (fwLower.includes('annex ii') || fwLower.includes('annex_ii') || fwLower === 'mdr') {
    return MDR_ANNEX_II_HELP[section] || null;
  }
  if (fwLower.includes('annex i') && !fwLower.includes('annex ii') && !fwLower.includes('annex iii') || fwLower.includes('annex_i') && !fwLower.includes('annex_ii') && !fwLower.includes('annex_iii') || fwLower === 'gspr') {
    return MDR_ANNEX_I_HELP[section] || null;
  }
  if (fwLower.includes('14971')) {
    return ISO_14971_DEVICE_HELP[section] || null;
  }
  if (fwLower.includes('62366')) {
    return IEC_62366_HELP[section] || null;
  }
  if (fwLower.includes('10993')) {
    return ISO_10993_HELP[section] || null;
  }
  if (fwLower.includes('15223')) {
    return ISO_15223_HELP[section] || null;
  }
  if (fwLower.includes('20417')) {
    return ISO_20417_HELP[section] || null;
  }
  if (fwLower.includes('20957')) {
    return IEC_20957_HELP[section] || null;
  }
  if (fwLower.includes('13485')) {
    return ISO_13485_HELP[section] || null;
  }
  if (fwLower.includes('14971')) {
    return ISO_14971_ENTERPRISE_HELP[section] || null;
  }
  if (fwLower.includes('cmdr')) return CMDR_HELP[section] || null;
  if (fwLower.includes('tga')) return TGA_HELP[section] || null;
  if (fwLower.includes('pmda')) return PMDA_HELP[section] || null;
  if (fwLower.includes('nmpa')) return NMPA_HELP[section] || null;
  if (fwLower.includes('anvisa')) return ANVISA_HELP[section] || null;
  if (fwLower.includes('cdsco')) return CDSCO_HELP[section] || null;
  if (fwLower.includes('ukca')) return UKCA_MDR_HELP[section] || null;
  if (fwLower.includes('mepsw') || fwLower.includes('mepv')) return MEPSW_HELP[section] || null;
  if (fwLower.includes('kfda')) return KFDA_HELP[section] || null;
  if (fwLower.includes('ppwr')) return PPWR_HELP[section] || null;
  return null;
}

/**
 * Dynamic gap analysis help content component.
 * Reads the active framework + section from GapAnalysisHelpContext
 * and renders detailed, clause-specific guidance.
 */
export const GapAnalysisContextualHelp: React.FC<{ targetMarkets?: string[]; onNavigateToDetail?: (id: string) => void }> = () => {
  const { framework, section } = useGapAnalysisHelp();

  if (!framework || !section) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Navigate to a specific gap analysis clause to see detailed contextual guidance here.
        </p>
        <TipCard>
          Open any clause in the gap analysis (e.g., §4.1 Quality Management System) and this panel will show you exactly what is required, why it matters, what auditors expect, and practical tips.
        </TipCard>
      </div>
    );
  }

  const help = getHelpForFramework(framework, section);

  if (!help) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Detailed help for <strong>{framework} §{section}</strong> is not yet available.
        </p>
        <TipCard>
          Contextual help content is being expanded. In the meantime, refer to the standard document directly for guidance on this clause.
        </TipCard>
      </div>
    );
  }

  return <ClauseHelpContent help={help} />;
};
