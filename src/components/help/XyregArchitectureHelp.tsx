import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lightbulb, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface HelpContentProps {
  targetMarkets?: string[];
  onNavigateToDetail?: (detailId: string) => void;
}

const RoadmapBadge = () => (
  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
    Roadmap
  </Badge>
);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card className="border-border/50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-xs text-muted-foreground space-y-3">
      {children}
    </CardContent>
  </Card>
);

export const XyregArchitectureHelp: React.FC<HelpContentProps> = () => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <strong>System:</strong> Xyreg Helix Operating System &nbsp;|&nbsp;
          <strong>Standards:</strong> ISO 13485:2016, FDA 21 CFR Part 820, ISO 14971:2019, IEC 62304, ISO/TR 80002-2
        </p>
      </div>

      {/* 1. Core Philosophy */}
      <SectionCard title="1. Core Regulatory Philosophy: State of Control">
        <p>
          The Helix OS implements a <strong>Relational Object Architecture</strong> where compliance is an emergent property of the software's technical constraints — not a manual overlay. Every design object (User Need, Requirement, Hazard, Test Case) is a traceable OID with enforced parentage and bi-directional linkage.
        </p>
      </SectionCard>

      {/* 2A. Design Controls */}
      <SectionCard title="2A. Automated Design Controls (21 CFR 820.30)">
        <p>The system enforces the V-Model through:</p>
        <ul className="list-disc pl-4 space-y-1.5">
          <li><strong>SWR-C-12 (Manifest Discovery):</strong> Design Inputs captured as unique OIDs with mandatory parentage.</li>
          <li><strong>SWR-C-13 (Independent Reviewer Logic):</strong> Design Reviews programmatically enforced — no "self-grading" occurs during critical milestones.</li>
          <li><strong>SWR-C-14 (Baseline Lock):</strong> Freezes manifest objects into immutable JSONB snapshots upon approval.</li>
          <li><strong>Design V&V:</strong> Integrated into the Execution Module with IEC 62366-1 aligned test case generation.</li>
        </ul>
      </SectionCard>

      {/* 2B. Risk Management */}
      <SectionCard title="2B. Living Risk Management (ISO 14971)">
        <p>Unlike static PDFs, the Helix OS maintains a real-time risk profile:</p>
        <ul className="list-disc pl-4 space-y-1.5">
          <li>
            <strong>SWR-SS-03 (PMS Integration):</strong> Field complaints trigger automated <strong>CAPA/CCR escalation</strong> via tiered logic (Hard Trigger → CAPA + CCR; Soft Trigger → CAPA only).
          </li>
          <li>
            <strong>SWR-C-06 (Gate Controller):</strong> Blocks product baselining if a high-severity hazard exists without verified mitigation.
          </li>
        </ul>
        <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800 flex gap-2 items-start">
          <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span className="text-[11px]">
            <strong>Note:</strong> Dynamic RPN auto-update from field data is on the roadmap. Currently, PMS events escalate to CAPA/CCR but do not auto-increment risk frequency scores. <RoadmapBadge />
          </span>
        </div>
      </SectionCard>

      {/* 2C. Data Integrity */}
      <SectionCard title="2C. Data Integrity & Trust (ALCOA+)">
        <p>To satisfy 21 CFR Part 11:</p>
        <ul className="list-disc pl-4 space-y-1.5">
          <li><strong>SSoT (SWR-C-01):</strong> Prevents data silos; single version of the truth.</li>
          <li><strong>Immutable Audit Trail (SWR-C-09):</strong> Every change recorded with UUID, UTC timestamp, and Reason for Change.</li>
          <li><strong>MFA Signatures:</strong> Cryptographically binds approvals to specific data snapshots.</li>
        </ul>
      </SectionCard>

      {/* 3. Validation Strategy */}
      <SectionCard title="3. Validation Strategy (ISO/TR 80002-2)">
        <p>As a platform hosting life-critical data, Xyreg maintains its Validated State through:</p>
        <ul className="list-disc pl-4 space-y-1.5">
          <li><strong>SWR-C-11 (CI/CD Pipeline):</strong> Every deployment triggers automated regression testing.</li>
        </ul>
        <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800 flex gap-2 items-start">
          <Info className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span className="text-[11px]">
            <strong>Planned:</strong> A "Validation Watchdog" that triggers a platform-wide Safety Hold on core-logic failure is under development. <RoadmapBadge />
          </span>
        </div>
      </SectionCard>

      {/* 4. Traceability Table */}
      <SectionCard title="4. Traceability Flow Summary">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1.5 pr-3 font-semibold">Regulatory Need</th>
                <th className="text-left py-1.5 font-semibold">Helix OS Technical Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr><td className="py-1.5 pr-3">Traceability</td><td>SWR-C-05 (Bi-Directional Graph Engine)</td></tr>
              <tr><td className="py-1.5 pr-3">Change Control</td><td>SWR-C-15 (Impact Analysis & CCR Loop)</td></tr>
              <tr><td className="py-1.5 pr-3">Independent Review</td><td>SWR-C-13 (UUID Audit vs. Signatory Role)</td></tr>
              <tr><td className="py-1.5 pr-3">Post-Market Loop</td><td>SWR-SS-03 (Complaint → CAPA/CCR Escalation)</td></tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 5. Conclusion */}
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-2">
        <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          The Xyreg Helix OS provides the "Digital DNA" for modern medical device companies to scale without compromising safety. Every device built within this ecosystem is <strong>"Born Compliant"</strong> through enforced technical constraints rather than manual checklists.
        </p>
      </div>
    </div>
  );
};
