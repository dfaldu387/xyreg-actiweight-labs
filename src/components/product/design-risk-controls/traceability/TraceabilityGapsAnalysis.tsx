import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Link, ExternalLink, Plus } from "lucide-react";
import { traceabilityService } from "@/services/enhancedTraceabilityService";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { TraceabilityLinkEditor } from "./TraceabilityLinkEditor";

interface TraceabilityGapsAnalysisProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function TraceabilityGapsAnalysis({ productId, companyId, disabled = false }: TraceabilityGapsAnalysisProps) {
  const { lang } = useTranslation();
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: string; id: string; name: string } | null>(null);

  const { data: gapsData, isLoading } = useQuery({
    queryKey: ['traceability-gaps', companyId, productId],
    queryFn: () => traceabilityService.getTraceabilityGaps(companyId, productId),
  });

  const handleCreateLink = (itemType: string, itemId: string, itemName: string) => {
    if (disabled) return;
    setSelectedItem({ type: itemType, id: itemId, name: itemName });
    setLinkEditorOpen(true);
  };

  const handleFixAllGaps = () => {
    if (disabled) return;
    toast.info(lang('traceability.gapAnalysis.toastBatchFixing'));
  };

  const gapSections = [
    {
      title: lang('traceability.gapAnalysis.sections.unlinkedUserNeeds.title'),
      description: lang('traceability.gapAnalysis.sections.unlinkedUserNeeds.description'),
      items: gapsData?.unlinkedUserNeeds || [],
      color: "destructive" as const,
      icon: AlertTriangle
    },
    {
      title: lang('traceability.gapAnalysis.sections.unlinkedSystemRequirements.title'),
      description: lang('traceability.gapAnalysis.sections.unlinkedSystemRequirements.description'),
      items: gapsData?.unlinkedSystemRequirements || [],
      color: "destructive" as const,
      icon: AlertTriangle
    },
    {
      title: lang('traceability.gapAnalysis.sections.unlinkedSoftwareRequirements.title'),
      description: lang('traceability.gapAnalysis.sections.unlinkedSoftwareRequirements.description'),
      items: gapsData?.unlinkedSoftwareRequirements || [],
      color: "outline" as const,
      icon: AlertTriangle
    },
    {
      title: lang('traceability.gapAnalysis.sections.unlinkedHardwareRequirements.title'),
      description: lang('traceability.gapAnalysis.sections.unlinkedHardwareRequirements.description'),
      items: gapsData?.unlinkedHardwareRequirements || [],
      color: "outline" as const,
      icon: AlertTriangle
    },
    {
      title: lang('traceability.gapAnalysis.sections.orphanedTestCases.title'),
      description: lang('traceability.gapAnalysis.sections.orphanedTestCases.description'),
      items: gapsData?.unlinkedTestCases || [],
      color: "secondary" as const,
      icon: AlertTriangle
    },
    {
      title: lang('traceability.gapAnalysis.sections.unverifiedRequirements.title'),
      description: lang('traceability.gapAnalysis.sections.unverifiedRequirements.description'),
      items: gapsData?.unverifiedRequirements || [],
      color: "destructive" as const,
      icon: AlertTriangle
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{lang('traceability.gapAnalysis.title')}</h3>
          <Button disabled>{lang('traceability.gapAnalysis.fixAllGaps')}</Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalGaps = gapSections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{lang('traceability.gapAnalysis.fullTitle')}</h3>
          <p className="text-sm text-muted-foreground">
            {lang('traceability.gapAnalysis.description')}
          </p>
        </div>
        {totalGaps > 0 && (
          <Button onClick={handleFixAllGaps} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" />
            {lang('traceability.gapAnalysis.fixAllGaps')}
          </Button>
        )}
      </div>

      <Card className={totalGaps > 0 ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-50"}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {totalGaps > 0 ? (
              <AlertTriangle className="h-6 w-6 text-destructive" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}
            <div>
              <h4 className="font-medium text-foreground">
                {totalGaps > 0 ? lang('traceability.gapAnalysis.gapsFound', { count: totalGaps }) : lang('traceability.gapAnalysis.noGaps')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {totalGaps > 0
                  ? lang('traceability.gapAnalysis.gapsFoundDescription')
                  : lang('traceability.gapAnalysis.noGapsDescription')
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {gapSections.map((section) => {
          const IconComponent = section.icon;

          return (
            <Card key={section.title} className={section.items.length > 0 ? "border-orange-200" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-orange-600" />
                    <div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={section.color}>
                    {lang('traceability.gapAnalysis.itemsCount', { count: section.items.length })}
                  </Badge>
                </div>
              </CardHeader>

              {section.items.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {section.items.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {item.identifier}
                          </Badge>
                          <div>
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                            {item.status && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {item.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateLink(item.type, item.id, item.name)}
                            disabled={disabled}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            {lang('traceability.gapAnalysis.createLink')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {section.items.length === 0 && (
                <CardContent className="pt-0">
                  <div className="text-center py-4 text-green-600">
                    <span className="text-sm">{lang('traceability.gapAnalysis.noGapsInCategory')}</span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">{lang('traceability.gapAnalysis.guidelines.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.gapAnalysis.guidelines.criticalGaps.title')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('traceability.gapAnalysis.guidelines.criticalGaps.item1')}</li>
                <li>{lang('traceability.gapAnalysis.guidelines.criticalGaps.item2')}</li>
                <li>{lang('traceability.gapAnalysis.guidelines.criticalGaps.item3')}</li>
                <li>{lang('traceability.gapAnalysis.guidelines.criticalGaps.item4')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">{lang('traceability.gapAnalysis.guidelines.bestPractices.title')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{lang('traceability.gapAnalysis.guidelines.bestPractices.item1')}</li>
                <li>{lang('traceability.gapAnalysis.guidelines.bestPractices.item2')}</li>
                <li>{lang('traceability.gapAnalysis.guidelines.bestPractices.item3')}</li>
                <li>{lang('traceability.gapAnalysis.guidelines.bestPractices.item4')}</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{lang('traceability.gapAnalysis.guidelines.note.label')}</strong> {lang('traceability.gapAnalysis.guidelines.note.text')}
            </p>
          </div>
        </CardContent>
      </Card>

      <TraceabilityLinkEditor
        open={linkEditorOpen}
        onOpenChange={setLinkEditorOpen}
        productId={productId}
        companyId={companyId}
        sourceType={selectedItem?.type}
        sourceId={selectedItem?.id}
        sourceName={selectedItem?.name}
      />
    </div>
  );
}
