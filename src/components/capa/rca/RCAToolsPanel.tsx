import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CAPARecord, RCAMethodology, RCA_METHODOLOGY_LABELS } from '@/types/capa';
import { 
  RCAData, 
  CombinedRCAData, 
  isIshikawaData, 
  isFiveWhysData, 
  isFaultTreeData,
  isParetoData,
  isCombinedRCAData 
} from '@/types/rcaData';
import { IshikawaDiagramBuilder } from './IshikawaDiagramBuilder';
import { FiveWhysWizard } from './FiveWhysWizard';
import { FaultTreeBuilder } from './FaultTreeBuilder';
import { ParetoChartBuilder } from './ParetoChartBuilder';
import { useUpdateCAPA } from '@/hooks/useCAPAData';
import { Search, Info, Fish, HelpCircle, ArrowRight, GitBranch, BarChart3, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface RCAToolsPanelProps {
  capa: CAPARecord;
  readOnly?: boolean;
  /** Multiple selected methodologies for multi-RCA support */
  selectedMethodologies?: RCAMethodology[];
}

export function RCAToolsPanel({ capa, readOnly = false, selectedMethodologies = [] }: RCAToolsPanelProps) {
  const updateMutation = useUpdateCAPA();
  
  // Parse existing RCA data from the capa record
  const rcaData = capa.rca_data;

  // Get existing data from combined structure or legacy format
  const getExistingFishboneData = () => {
    if (isCombinedRCAData(rcaData)) {
      return rcaData.fishbone || null;
    }
    if (isIshikawaData(rcaData)) {
      return rcaData;
    }
    return null;
  };

  const getExistingFiveWhysData = () => {
    if (isCombinedRCAData(rcaData)) {
      return rcaData.five_whys || null;
    }
    if (isFiveWhysData(rcaData)) {
      return rcaData;
    }
    return null;
  };

  const getExistingFTAData = () => {
    if (isCombinedRCAData(rcaData)) {
      return rcaData.fta || null;
    }
    if (isFaultTreeData(rcaData)) {
      return rcaData;
    }
    return null;
  };

  const getExistingParetoData = () => {
    if (isCombinedRCAData(rcaData)) {
      return rcaData.pareto || null;
    }
    if (isParetoData(rcaData)) {
      return rcaData;
    }
    return null;
  };

  const handleSaveRCAData = async (data: RCAData, methodology: RCAMethodology) => {
    try {
      // Build combined data structure
      let combinedData: CombinedRCAData;
      
      if (isCombinedRCAData(rcaData)) {
        // Update existing combined structure
        combinedData = {
          ...rcaData,
          methodologies: selectedMethodologies,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Create new combined structure
        combinedData = {
          methodologies: selectedMethodologies,
          combinedRootCause: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Update the specific methodology data
      if (isIshikawaData(data)) {
        combinedData.fishbone = data;
      } else if (isFiveWhysData(data)) {
        combinedData.five_whys = data;
      } else if (isFaultTreeData(data)) {
        combinedData.fta = data;
      } else if (isParetoData(data)) {
        combinedData.pareto = data;
      }

      // Build combined root cause summary
      const rootCauses: string[] = [];
      if (combinedData.fishbone?.rootCause) {
        rootCauses.push(`Fishbone: ${combinedData.fishbone.rootCause}`);
      }
      if (combinedData.five_whys?.rootCause) {
        rootCauses.push(`5 Whys: ${combinedData.five_whys.rootCause}`);
      }
      if (combinedData.fta?.rootCause) {
        rootCauses.push(`FTA: ${combinedData.fta.rootCause}`);
      }
      if (combinedData.pareto?.rootCause) {
        rootCauses.push(`Pareto: ${combinedData.pareto.rootCause}`);
      }
      combinedData.combinedRootCause = rootCauses.join(' | ');

      await updateMutation.mutateAsync({
        id: capa.id,
        updates: {
          rca_data: combinedData,
          root_cause_summary: combinedData.combinedRootCause || data.rootCause || capa.root_cause_summary,
        }
      });
      toast.success('RCA analysis saved successfully');
    } catch (error) {
      toast.error('Failed to save RCA analysis');
    }
  };

  // No methodologies selected - show guidance
  if (selectedMethodologies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Visual RCA Tools
          </CardTitle>
          <CardDescription>
            Select RCA methodologies above to unlock interactive analysis tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Info className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No RCA methodologies selected yet
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <Fish className="h-4 w-4 text-primary" />
                <span className="text-xs">Fishbone Diagram</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-xs">5 Whys Wizard</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <GitBranch className="h-4 w-4 text-primary" />
                <span className="text-xs">Fault Tree Analysis</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs">Pareto Analysis</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Click Edit above and select methodologies to get started
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separate methodologies into those with visual tools
  const toolMethodologies = selectedMethodologies.filter(
    m => m === 'fishbone' || m === '5_whys' || m === 'fta' || m === 'pareto'
  );
  const otherMethodologies = selectedMethodologies.filter(
    m => m !== 'fishbone' && m !== '5_whys' && m !== 'fta' && m !== 'pareto'
  );

  return (
    <div className="space-y-4">
      {/* Workflow guidance when multiple tools selected */}
      {toolMethodologies.length > 1 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Multi-Method Workflow:</span>
              {toolMethodologies.includes('pareto') && (
                <>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-sm">Pareto</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </>
              )}
              {toolMethodologies.includes('fishbone') && (
                <>
                  <div className="flex items-center gap-1">
                    <Fish className="h-4 w-4 text-primary" />
                    <span className="text-sm">Fishbone</span>
                  </div>
                  {(toolMethodologies.includes('5_whys') || toolMethodologies.includes('fta')) && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </>
              )}
              {toolMethodologies.includes('5_whys') && (
                <div className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm">5 Whys</span>
                </div>
              )}
              {toolMethodologies.includes('fta') && (
                <div className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <span className="text-sm">FTA</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Complete each tool in order for comprehensive root cause analysis
            </p>
          </CardContent>
        </Card>
      )}

      {/* Render visual tools in recommended order */}
      {toolMethodologies.includes('pareto') && (
        <ParetoChartBuilder
          initialData={getExistingParetoData()}
          problemDescription={capa.problem_description}
          onSave={(data) => handleSaveRCAData(data, 'pareto')}
          isLoading={updateMutation.isPending}
          readOnly={readOnly}
        />
      )}

      {toolMethodologies.includes('fishbone') && (
        <IshikawaDiagramBuilder
          initialData={getExistingFishboneData()}
          onSave={(data) => handleSaveRCAData(data, 'fishbone')}
          isLoading={updateMutation.isPending}
          readOnly={readOnly}
        />
      )}

      {toolMethodologies.includes('5_whys') && (
        <FiveWhysWizard
          initialData={getExistingFiveWhysData()}
          problemStatement={capa.problem_description}
          onSave={(data) => handleSaveRCAData(data, '5_whys')}
          isLoading={updateMutation.isPending}
          readOnly={readOnly}
        />
      )}

      {toolMethodologies.includes('fta') && (
        <FaultTreeBuilder
          initialData={getExistingFTAData()}
          topEventDescription={capa.problem_description}
          onSave={(data) => handleSaveRCAData(data, 'fta')}
          isLoading={updateMutation.isPending}
          readOnly={readOnly}
        />
      )}

      {/* Placeholder for other methodologies */}
      {otherMethodologies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Additional Methodologies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {otherMethodologies.map(m => (
                <div key={m} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">{RCA_METHODOLOGY_LABELS[m]}</span>
                  <Badge variant="outline">Document in Summary</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-2">
                Use the root cause summary field to document your analysis for these methods.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
