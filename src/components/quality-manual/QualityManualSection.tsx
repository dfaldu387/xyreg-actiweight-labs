import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextField } from '@/components/shared/RichTextField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Clock, ShieldCheck, Package, Users, Building2, MapPin, FileText, Globe, FileEdit } from 'lucide-react';
import type { QualityManualSection as QMSection, QualityManualData } from '@/hooks/useQualityManual';
import { SaveContentAsDocCIDialog } from '@/components/shared/SaveContentAsDocCIDialog';
import { DocumentDraftDrawer } from '@/components/product/documents/DocumentDraftDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { QMSubStep } from './QualityManualSidebar';
import { ISO_13485_SECTIONS } from '@/config/gapISO13485Sections';
import { format } from 'date-fns';
import { useLanguage } from '@/context/LanguageContext';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'fi', label: 'Suomi' },
];

interface QualityManualSectionProps {
  section: QMSection;
  companyData: QualityManualData;
  onContentChange: (sectionKey: string, content: string) => void;
  onGenerate: (sectionKey: string, options?: { outputLanguage?: string; additionalPrompt?: string }) => void;
  generating: string | null;
  saving: boolean;
  currentStepIndex: number;
  activeSteps: QMSubStep[];
  subStepContents: Map<string, { content: string; lastUpdated?: string }>;
  getSubStepKey: (sectionKey: string, subIndex: number) => string;
  companyId?: string;
  companyName?: string;
}

function getDataCards(section: QMSection, data: QualityManualData) {
  const cards: { label: string; value: string | number; icon: React.ReactNode }[] = [];

  const groupId = section.groupId;
  const clause = section.clause;

  if (clause === '4.1' || groupId === 4) {
    if (data.products.length > 0) {
      cards.push({ label: 'Products', value: data.products.length, icon: <Package className="h-4 w-4" /> });
      const riskClasses = [...new Set(data.products.map(p => p.risk_class).filter(Boolean))];
      if (riskClasses.length > 0) {
        cards.push({ label: 'Risk Classes', value: riskClasses.join(', '), icon: <ShieldCheck className="h-4 w-4" /> });
      }
    }
  }

  if (groupId === 5 || groupId === 6) {
    if (data.personnel.length > 0) {
      cards.push({ label: 'Personnel', value: data.personnel.length, icon: <Users className="h-4 w-4" /> });
    }
  }

  if (data.company?.country) {
    if (clause === '4.1' || clause === '5.1') {
      cards.push({ label: 'Market', value: data.company.country, icon: <ShieldCheck className="h-4 w-4" /> });
    }
  }

  return cards;
}

function buildSourceItems(section: QMSection, data: QualityManualData) {
  const items: { icon: React.ReactNode; label: string; value: string }[] = [];

  if (data.company) {
    items.push({
      icon: <Building2 className="h-4 w-4" />,
      label: 'Company',
      value: data.company.name,
    });
    if (data.company.country) {
      items.push({
        icon: <MapPin className="h-4 w-4" />,
        label: 'Country / Market',
        value: data.company.country,
      });
    }
    if (data.company.description) {
      items.push({
        icon: <FileText className="h-4 w-4" />,
        label: 'Description',
        value: data.company.description.length > 120
          ? data.company.description.slice(0, 120) + '…'
          : data.company.description,
      });
    }
  }

  if (data.products.length > 0) {
    const productNames = data.products.map(p => {
      const rc = p.risk_class ? ` (${p.risk_class})` : '';
      return `${p.name}${rc}`;
    });
    items.push({
      icon: <Package className="h-4 w-4" />,
      label: `Products (${data.products.length})`,
      value: productNames.join(', '),
    });
  }

  if (data.personnel.length > 0) {
    items.push({
      icon: <Users className="h-4 w-4" />,
      label: 'Personnel',
      value: `${data.personnel.length} team member${data.personnel.length > 1 ? 's' : ''}`,
    });
  }

  items.push({
    icon: <ShieldCheck className="h-4 w-4" />,
    label: 'Clause',
    value: `§${section.clause} ${section.title}`,
  });

  if (section.description) {
    items.push({
      icon: <FileText className="h-4 w-4" />,
      label: 'Requirement',
      value: section.description,
    });
  }

  return items;
}

export function QualityManualSectionView({
  section,
  companyData,
  onContentChange,
  onGenerate,
  generating,
  saving,
  currentStepIndex,
  activeSteps,
  subStepContents,
  getSubStepKey,
  companyId,
  companyName,
}: QualityManualSectionProps) {
  const dataCards = getDataCards(section, companyData);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const { language: appLanguage } = useLanguage();
  const [outputLanguage, setOutputLanguage] = useState<string>(appLanguage);
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<Set<string>>(new Set());
  const [sourcesInitialized, setSourcesInitialized] = useState(false);
  const [showDocCIDialog, setShowDocCIDialog] = useState(false);
  const [draftDrawerDoc, setDraftDrawerDoc] = useState<{ id: string; name: string; type: string } | null>(null);

  const sourceItems = buildSourceItems(section, companyData);
  const hasMissingData = !companyData.company;

  // Determine if we're on a sub-step or the narrative step
  const isoConfig = ISO_13485_SECTIONS.find(s => s.section === section.clause);
  const hasSubItems = isoConfig?.subItems && isoConfig.subItems.length > 0;
  const narrativeIndex = hasSubItems ? isoConfig!.subItems!.length : 0;
  const isNarrativeStep = currentStepIndex >= narrativeIndex;

  // Current sub-step info
  const currentSubItem = !isNarrativeStep && hasSubItems
    ? isoConfig!.subItems![currentStepIndex]
    : null;

  // Content key and content for the current step
  const currentContentKey = useMemo(() => {
    if (isNarrativeStep) return section.sectionKey;
    return getSubStepKey(section.sectionKey, currentStepIndex);
  }, [isNarrativeStep, section.sectionKey, currentStepIndex, getSubStepKey]);

  const currentContent = useMemo(() => {
    if (isNarrativeStep) return section.content;
    return subStepContents.get(currentContentKey)?.content || '';
  }, [isNarrativeStep, section.content, subStepContents, currentContentKey]);

  const currentLastUpdated = useMemo(() => {
    if (isNarrativeStep) return section.lastUpdated;
    return subStepContents.get(currentContentKey)?.lastUpdated;
  }, [isNarrativeStep, section.lastUpdated, subStepContents, currentContentKey]);

  const isGenerating = generating === currentContentKey;

  // Header text for current step
  const stepClause = currentSubItem
    ? `${section.clause}.${currentSubItem.letter}`
    : section.clause;
  const stepTitle = currentSubItem
    ? currentSubItem.description
    : isNarrativeStep && hasSubItems
      ? 'Publish-Ready Narrative'
      : section.title;

  // Initialize all sources as selected
  React.useEffect(() => {
    if (!sourcesInitialized && sourceItems.length > 0) {
      setSelectedSourceKeys(new Set(sourceItems.map((_, i) => String(i))));
      setSourcesInitialized(true);
    }
  }, [sourceItems.length, sourcesInitialized]);

  const handleGenerateClick = () => {
    setShowSourceDialog(true);
  };

  const handleConfirmGenerate = () => {
    setShowSourceDialog(false);
    onGenerate(currentContentKey, {
      outputLanguage,
      additionalPrompt: additionalPrompt || undefined,
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-300" key={currentContentKey}>
      {/* Section Header */}
      <div className="rounded-lg bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-primary/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                §{stepClause}
              </Badge>
              {currentSubItem && (
                <Badge variant="secondary" className="text-[10px]">
                  Part of §{section.clause}
                </Badge>
              )}
              {currentLastUpdated && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(currentLastUpdated), 'MMM d, yyyy')}
                </span>
              )}
              {saving && (
                <span className="text-[11px] text-muted-foreground">Saving…</span>
              )}
            </div>
            <h2 className="text-xl font-semibold tracking-tight">{stepTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {isNarrativeStep && hasSubItems
                ? `Compile the full narrative for §${section.clause} ${section.title}`
                : currentSubItem?.detailedDescription || currentSubItem?.description || section.description}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {companyId && companyName && currentContent && currentContent.length > 20 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDocCIDialog(true)}
                      className="gap-1.5"
                    >
                      <FileEdit className="h-4 w-4" />
                      Create Document
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export this section as a Document CI</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating…' : currentContent ? 'Regenerate' : 'Generate with AI'}
            </Button>
          </div>
        </div>
      </div>

      {/* Data Cards */}
      {dataCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {dataCards.map((card, i) => (
            <Card key={i} className="bg-muted/30">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  {card.icon}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                  <div className="text-sm font-semibold">{card.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content Editor */}
      <div>
        <RichTextField
          key={currentContentKey}
          value={currentContent}
          onChange={(html) => onContentChange(currentContentKey, html)}
          placeholder={`Write or generate the quality manual content for §${stepClause} ${stepTitle}…`}
          minHeight="300px"
          disabled={isGenerating}
        />
      </div>

      {/* AI Source Preview Dialog */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {currentContent ? 'Regenerate' : 'Generate'} §{stepClause} {stepTitle}
            </DialogTitle>
            <DialogDescription>
              The following data will be used as context for AI generation. Review the sources below before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {sourceItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  checked={selectedSourceKeys.has(String(i))}
                  onCheckedChange={() => {
                    const next = new Set(selectedSourceKeys);
                    next.has(String(i)) ? next.delete(String(i)) : next.add(String(i));
                    setSelectedSourceKeys(next);
                  }}
                  className="mt-1"
                />
                <div className="p-1.5 rounded-md bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                  <div className="text-sm text-foreground">{item.value}</div>
                </div>
              </div>
            ))}

            {hasMissingData && (
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20">
                <div className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  ⚠ Missing company data — results may be generic. Add company details for better output.
                </div>
              </div>
            )}

            {currentContent && (
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/20">
                <div className="text-xs font-medium text-blue-800 dark:text-blue-300">
                  ℹ This section already has content. Generating will replace the existing text.
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium flex items-center gap-1.5 whitespace-nowrap">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Output language
            </Label>
            <Select value={outputLanguage} onValueChange={setOutputLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Additional instructions (optional)</Label>
            <Textarea
              placeholder="Add specific instructions for the AI generation..."
              className="min-h-[60px] text-sm resize-y"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmGenerate} className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              {currentContent ? 'Regenerate' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      {companyId && companyName && (
        <>
          <SaveContentAsDocCIDialog
            open={showDocCIDialog}
            onOpenChange={setShowDocCIDialog}
            title={`Quality Manual — §${stepClause} ${stepTitle}`}
            htmlContent={currentContent}
            templateIdKey={`QM-${section.clause.replace(/\./g, '_')}-${companyId}`}
            companyId={companyId}
            companyName={companyName}
            defaultScope="enterprise"
            onDocumentCreated={(docId, docName, docType) => setDraftDrawerDoc({ id: docId, name: docName, type: docType })}
          />
          <DocumentDraftDrawer
            open={!!draftDrawerDoc}
            onOpenChange={(open) => { if (!open) setDraftDrawerDoc(null); }}
            documentId={draftDrawerDoc?.id || ''}
            documentName={draftDrawerDoc?.name || ''}
            documentType={draftDrawerDoc?.type || ''}
            companyId={companyId}
          />
        </>
      )}
    </div>
  );
}
