import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowRight, AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MappingItem {
  oldQSR: {
    section: string;
    title: string;
    description: string;
  };
  newQMSR: {
    section: string;
    title: string;
    description: string;
    isRetained?: boolean;
    isNewRequirement?: boolean;
  };
  notes?: string;
  impactLevel: 'no-change' | 'minor' | 'significant' | 'new';
}

const qsrToQmsrMappings: MappingItem[] = [
  {
    oldQSR: { section: "§820.1", title: "Scope", description: "Establishes scope of Part 820" },
    newQMSR: { section: "§820.1 (Retained)", title: "Scope", description: "Retained - Establishes QMSR applicability", isRetained: true },
    impactLevel: 'no-change',
    notes: "Retained as FDA-specific requirement"
  },
  {
    oldQSR: { section: "§820.3", title: "Definitions", description: "Defines key terms (DHF, DMR, DHR, etc.)" },
    newQMSR: { section: "§820.3 (Retained)", title: "Definitions", description: "FDA-specific terms retained. May continue using DHF/DMR/DHR terminology.", isRetained: true },
    impactLevel: 'no-change',
    notes: "FDA confirmed companies may continue using familiar terminology"
  },
  {
    oldQSR: { section: "§820.5", title: "Quality System", description: "General QS requirements" },
    newQMSR: { section: "ISO 13485 Clause 4", title: "Quality Management System", description: "QMS requirements now per ISO 13485:2016" },
    impactLevel: 'minor',
    notes: "Structure aligned with ISO 13485"
  },
  {
    oldQSR: { section: "§820.20", title: "Management Responsibility", description: "Management commitment and policy" },
    newQMSR: { section: "ISO 13485 Clause 5", title: "Management Responsibility", description: "Management commitment, policy, objectives, planning, responsibility, and review" },
    impactLevel: 'minor',
    notes: "Enhanced management review requirements"
  },
  {
    oldQSR: { section: "§820.22", title: "Quality Audit", description: "Internal quality audits" },
    newQMSR: { section: "ISO 13485 Clause 8.2.4", title: "Internal Audit", description: "Internal audits NOW SUBJECT TO FDA INSPECTION", isNewRequirement: true },
    impactLevel: 'significant',
    notes: "⚠️ MAJOR CHANGE: Internal audit records can now be requested by FDA inspectors"
  },
  {
    oldQSR: { section: "§820.25", title: "Personnel", description: "Training and competence" },
    newQMSR: { section: "ISO 13485 Clause 6.2", title: "Human Resources", description: "Competence, training, and awareness" },
    impactLevel: 'minor'
  },
  {
    oldQSR: { section: "§820.30", title: "Design Controls", description: "Design and development controls" },
    newQMSR: { section: "ISO 13485 Clause 7.3", title: "Design and Development", description: "Design planning, inputs, outputs, review, verification, validation, transfer, changes, files" },
    impactLevel: 'minor',
    notes: "DHF terminology may continue to be used per FDA guidance"
  },
  {
    oldQSR: { section: "§820.50", title: "Purchasing Controls", description: "Supplier evaluation and purchasing" },
    newQMSR: { section: "ISO 13485 Clause 7.4", title: "Purchasing", description: "Purchasing process, information, and verification. Supplier audit records NOW SUBJECT TO FDA INSPECTION.", isNewRequirement: true },
    impactLevel: 'significant',
    notes: "⚠️ MAJOR CHANGE: Supplier audit records can now be requested by FDA inspectors"
  },
  {
    oldQSR: { section: "§820.70", title: "Production and Process Controls", description: "Production processes and controls" },
    newQMSR: { section: "ISO 13485 Clause 7.5", title: "Production and Service Provision", description: "Control of production, cleanliness, installation, servicing, validation, identification, traceability" },
    impactLevel: 'minor'
  },
  {
    oldQSR: { section: "§820.181", title: "Device Master Record (DMR)", description: "DMR requirements" },
    newQMSR: { section: "ISO 13485 Clause 7.5", title: "Product Realization Documentation", description: "Covered by production and service documentation. May continue using DMR terminology." },
    impactLevel: 'minor',
    notes: "DMR terminology can still be used per FDA guidance"
  },
  {
    oldQSR: { section: "§820.184", title: "Device History Record (DHR)", description: "DHR requirements" },
    newQMSR: { section: "ISO 13485 Clause 7.5.8", title: "Production Records", description: "Identification and traceability records. May continue using DHR terminology." },
    impactLevel: 'minor',
    notes: "DHR terminology can still be used per FDA guidance"
  },
  {
    oldQSR: { section: "§820.198", title: "Complaint Handling", description: "Complaint files and evaluation" },
    newQMSR: { section: "ISO 13485 Clause 8.2.2 + §820.35", title: "Complaint Handling (Enhanced)", description: "ISO 13485 complaint handling PLUS retained 820.35 with enhanced requirements", isRetained: true },
    impactLevel: 'significant',
    notes: "⚠️ 820.35 retained with ENHANCED requirements for complaint investigation documentation"
  },
  {
    oldQSR: { section: "§820.120-130", title: "Labeling Controls", description: "Device labeling and packaging" },
    newQMSR: { section: "§820.45 (Retained)", title: "Device Labeling (Enhanced)", description: "Enhanced labeling inspection requirements retained as FDA-specific", isRetained: true },
    impactLevel: 'significant',
    notes: "⚠️ 820.45 retained with ENHANCED inspection requirements"
  },
  {
    oldQSR: { section: "§820.90", title: "Nonconforming Product", description: "Control of nonconforming product" },
    newQMSR: { section: "ISO 13485 Clause 8.3", title: "Control of Nonconforming Product", description: "Nonconformity control, concessions, and advisory notices" },
    impactLevel: 'minor'
  },
  {
    oldQSR: { section: "§820.100", title: "CAPA", description: "Corrective and preventive action" },
    newQMSR: { section: "ISO 13485 Clause 8.5", title: "Improvement", description: "Corrective action and preventive action procedures" },
    impactLevel: 'minor'
  },
  {
    oldQSR: { section: "N/A", title: "N/A", description: "Not explicitly required" },
    newQMSR: { section: "§820.10 (Retained)", title: "Regulatory Links", description: "Links to MDR (Part 803), Corrections (Part 806), Tracking (Part 821), UDI (Part 830)", isRetained: true },
    impactLevel: 'new',
    notes: "Explicit cross-references to other FDA requirements"
  }
];

const getImpactBadge = (level: MappingItem['impactLevel']) => {
  switch (level) {
    case 'no-change':
      return <Badge variant="outline" className="bg-muted text-muted-foreground">No Change</Badge>;
    case 'minor':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Minor Alignment</Badge>;
    case 'significant':
      return <Badge variant="destructive" className="animate-pulse">Significant Change</Badge>;
    case 'new':
      return <Badge className="bg-amber-500 hover:bg-amber-600">New Requirement</Badge>;
  }
};

export function QSRtoQMSRMapping() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const significantChanges = qsrToQmsrMappings.filter(m => m.impactLevel === 'significant' || m.impactLevel === 'new');
  const retainedSections = qsrToQmsrMappings.filter(m => m.newQMSR.isRetained);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              QSR → QMSR Transition Map
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Effective Feb 2, 2026
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              Side-by-side comparison of old 21 CFR Part 820 QSR to new QMSR (ISO 13485:2016 + retained sections)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Changes Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">Key Changes Under QMSR</p>
              <ul className="mt-2 space-y-1 text-amber-700">
                <li>• <strong>Internal audit records</strong> are now subject to FDA inspection</li>
                <li>• <strong>Supplier audit records</strong> are now subject to FDA inspection</li>
                <li>• <strong>Management review records</strong> are now subject to FDA inspection</li>
                <li>• <strong>§820.35 (Complaints)</strong> retained with enhanced requirements</li>
                <li>• <strong>§820.45 (Labeling)</strong> retained with enhanced inspection requirements</li>
              </ul>
            </div>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Mappings ({qsrToQmsrMappings.length})</TabsTrigger>
            <TabsTrigger value="significant">
              Significant Changes ({significantChanges.length})
            </TabsTrigger>
            <TabsTrigger value="retained">
              Retained 820 ({retainedSections.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {(selectedCategory === 'all' ? qsrToQmsrMappings :
                selectedCategory === 'significant' ? significantChanges :
                retainedSections
              ).map((mapping, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 transition-colors ${
                    mapping.impactLevel === 'significant' || mapping.impactLevel === 'new'
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Old QSR Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {mapping.oldQSR.section}
                        </Badge>
                        <span className="text-sm font-medium truncate">{mapping.oldQSR.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{mapping.oldQSR.description}</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 flex items-center px-2">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* New QMSR Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge 
                          variant="secondary" 
                          className={`font-mono text-xs ${
                            mapping.newQMSR.isRetained 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {mapping.newQMSR.section}
                        </Badge>
                        <span className="text-sm font-medium truncate">{mapping.newQMSR.title}</span>
                        {mapping.newQMSR.isRetained && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">FDA Retained</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This section is retained from Part 820 as an FDA-specific requirement</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{mapping.newQMSR.description}</p>
                    </div>

                    {/* Impact Badge */}
                    <div className="flex-shrink-0">
                      {getImpactBadge(mapping.impactLevel)}
                    </div>
                  </div>

                  {/* Notes */}
                  {mapping.notes && (
                    <div className="mt-2 pt-2 border-t border-dashed">
                      <div className="flex items-start gap-2 text-xs">
                        <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{mapping.notes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>

        {/* Terminology Note */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Terminology Note:</strong> FDA confirmed in the QMSR preamble that companies <strong>may continue using DHF, DMR, and DHR terminology</strong> even though ISO 13485 does not explicitly use these terms.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default QSRtoQMSRMapping;
