import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Sparkles, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { GenesisStepNotice } from './GenesisStepNotice';
import { deriveBusinessModelCanvas, type DerivedCanvas } from '@/services/deriveBusinessModelCanvas';
import { AIContextSourcesPanel } from '@/components/product/ai-assistant/AIContextSourcesPanel';

interface BusinessCanvasProps {
  productId: string;
  disabled?: boolean;
  isInGenesisFlow?: boolean;
}

interface CanvasData {
  customer_segments?: string;
  value_propositions?: string;
  channels?: string;
  customer_relationships?: string;
  revenue_streams?: string;
  key_resources?: string;
  key_activities?: string;
  key_partnerships?: string;
  cost_structure?: string;
  is_ai_generated?: boolean;
  generated_at?: string;
}

// Map blueprint STEPS to canvas fields (using actual step IDs 1-24)
const BLUEPRINT_MAPPING: Record<keyof CanvasData, number[]> = {
  customer_segments: [4],           // Step 4: User & Economic Buyer Profile
  value_propositions: [5],          // Step 5: Quantified Value Proposition
  channels: [17],                   // Step 17: Go-to-Market Strategy
  customer_relationships: [17],     // Step 17: Go-to-Market Strategy
  revenue_streams: [17],            // Step 17: Go-to-Market Strategy
  key_resources: [8, 10],          // Step 8: Resource Plan, Step 10: System Design
  key_activities: [9, 11, 12],     // Step 9: Requirements, Step 11: Design, Step 12: Risk Mgmt
  key_partnerships: [8],            // Step 8: Resource Plan (suppliers, partners)
  cost_structure: [8, 18],         // Step 8: Resource Plan, Step 18: Supply Chain
  is_ai_generated: [],
  generated_at: []
};

// User-friendly step labels for display
const STEP_LABELS: Record<number, string> = {
  4: "User & Economic Buyer Profile",
  5: "Value Proposition",
  8: "Resource Plan",
  9: "System Requirements",
  10: "System Design",
  11: "Detailed Design",
  12: "Risk Management",
  17: "Go-to-Market Strategy",
  18: "Supply Chain & Production"
};

const CanvasBlock = ({
  title,
  field,
  rowSpan = 1,
  colSpan = 1,
  canvasData,
  updateField,
  disabled = false,
  highlightClass
}: {
  title: string;
  field: keyof CanvasData;
  rowSpan?: number;
  colSpan?: number;
  canvasData: CanvasData;
  updateField: (field: keyof CanvasData, value: string) => void;
  disabled?: boolean;
  highlightClass?: string;
}) => {
  const { lang } = useTranslation();

  // Taller textarea for blocks that span 2 rows
  const textareaHeight = rowSpan === 2 ? 'min-h-[280px]' : 'min-h-[120px]';

  return (
    <div
      className={`p-4 bg-card rounded-lg border ${highlightClass || ''}`}
      style={{
        gridRow: `span ${rowSpan}`,
        gridColumn: `span ${colSpan}`,
      }}
    >
      <h3 className="font-semibold text-sm mb-2 text-foreground">{title}</h3>

      <Textarea
        value={(canvasData[field] as string) || ''}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder={lang('commercial.productBusinessCanvas.describePlaceholder').replace('{{field}}', title.toLowerCase())}
        className={`${textareaHeight} resize-none text-sm`}
        disabled={disabled}
      />
    </div>
  );
};


export function BusinessCanvas({ productId, disabled = false, isInGenesisFlow = false }: BusinessCanvasProps) {
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasData, setCanvasData] = useState<CanvasData>({});
  const [isEditing, setIsEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState('en');
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  useEffect(() => {
    const loadCanvas = async () => {
      try {
        const { data, error } = await supabase
          .from('business_canvas' as any)
          .select('*')
          .eq('product_id', productId)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setCanvasData(data as CanvasData);
        }
      } catch (error) {
        console.error('[BusinessCanvas] Load error:', error);
      }
    };
    
    loadCanvas();
  }, [productId]);

  const generateCanvas = async () => {
    if (disabled) return;
    setConfirmOpen(false);
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-canvas', {
        body: { productId, outputLanguage, additionalPrompt }
      });

      if (error) throw error;

      if (data?.canvas) {
        setCanvasData(data.canvas);
        toast.success(lang('commercial.productBusinessCanvas.generatedSuccess'));
      }
    } catch (error: any) {
      console.error('[BusinessCanvas] Generation error:', error);
      if (error.message?.includes('429')) {
        toast.error(lang('commercial.productBusinessCanvas.rateLimitError'));
      } else if (error.message?.includes('402')) {
        toast.error(lang('commercial.productBusinessCanvas.creditsDepletedError'));
      } else {
        toast.error(lang('commercial.productBusinessCanvas.generationError') + ': ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Populate from system data (derive from existing Genesis inputs)
  const populateFromSystem = async () => {
    if (disabled) return;
    setIsPopulating(true);
    try {
      // Fetch all required data in parallel
      const [productRes, gtmRes, blueprintRes, reimbursementRes, teamRes, npvRes] = await Promise.all([
        supabase.from('products').select('intended_use, description, ip_strategy_summary, markets, strategic_partners').eq('id', productId).single(),
        supabase.from('product_gtm_strategies' as any).select('channels, territory_priority, buyer_persona, sales_cycle_weeks, budget_cycle').eq('product_id', productId).maybeSingle(),
        supabase.from('product_venture_blueprints' as any).select('activity_notes').eq('product_id', productId).maybeSingle(),
        supabase.from('product_reimbursement_strategies' as any).select('value_proposition, coverage_status, payer_mix, target_codes').eq('product_id', productId).maybeSingle(),
        supabase.from('team_members' as any).select('name, role').eq('product_id', productId),
        supabase.from('product_npv_analysis' as any).select('npv, peak_revenue, gross_margin, break_even_year, total_revenue, total_costs, development_costs').eq('product_id', productId).maybeSingle()
      ]);

      if (productRes.error) throw productRes.error;

      // Format NPV data (cast to any to handle dynamic table)
      const npvRaw = npvRes.data as any;
      const npvData = npvRaw ? {
        npv: npvRaw.npv || 0,
        peakRevenue: npvRaw.peak_revenue,
        grossMargin: npvRaw.gross_margin,
        breakEvenYear: npvRaw.break_even_year,
        totalRevenue: npvRaw.total_revenue,
        totalCosts: npvRaw.total_costs,
        developmentCosts: npvRaw.development_costs
      } : null;

      // Derive canvas using existing service
      const derived: DerivedCanvas = deriveBusinessModelCanvas({
        product: productRes.data as any,
        gtmStrategyData: gtmRes.data as any,
        blueprintData: blueprintRes.data as any,
        reimbursementStrategyData: reimbursementRes.data as any,
        teamMembers: teamRes.data as any,
        npvData
      });

      // Map derived values to canvas state
      setCanvasData(prev => ({
        ...prev,
        key_partnerships: derived.keyPartners,
        key_activities: derived.keyActivities,
        key_resources: derived.keyResources,
        value_propositions: derived.valuePropositions,
        customer_relationships: derived.customerRelationships,
        channels: derived.channels,
        customer_segments: derived.customerSegments,
        cost_structure: derived.costStructure,
        revenue_streams: derived.revenueStreams,
        is_ai_generated: false
      }));

      setIsEditing(true);
      toast.success('Canvas populated from system data. Review and save your changes.');
    } catch (error: any) {
      console.error('[BusinessCanvas] Populate error:', error);
      toast.error('Failed to populate canvas: ' + (error.message || 'Unknown error'));
    } finally {
      setIsPopulating(false);
    }
  };

  const saveCanvas = async () => {
    if (disabled) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('business_canvas' as any)
        .upsert({
          product_id: productId,
          ...canvasData,
          last_modified: new Date().toISOString()
        }, {
          onConflict: 'product_id'
        });

      if (error) throw error;
      // Invalidate funnel progress query so checklist updates
      queryClient.invalidateQueries({ queryKey: ['funnel-canvas', productId] });
      toast.success(lang('commercial.productBusinessCanvas.saveSuccess'));
      setIsEditing(false);
    } catch (error: any) {
      console.error('[BusinessCanvas] Save error:', error);
      toast.error(lang('commercial.productBusinessCanvas.saveError') + ': ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof CanvasData, value: string) => {
    if (disabled) return;
    setCanvasData(prev => ({ ...prev, [field]: value }));
    if (!isEditing) setIsEditing(true);
  };



  return (
    <div className="space-y-6">
      {/* Genesis Step Notice - internal only */}
      <GenesisStepNotice 
        stepNumber={[4, 5, 8, 9, 10, 11, 12, 17, 18]} 
        stepName="Multiple Genesis Steps" 
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{lang('commercial.productBusinessCanvas.title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang('commercial.productBusinessCanvas.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={populateFromSystem}
            disabled={isPopulating || disabled}
            variant="outline"
            size="icon"
            title="Populate from System"
          >
            {isPopulating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={isGenerating || disabled}
            variant="default"
            size="icon"
            title={lang('commercial.productBusinessCanvas.generateWithAI')}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
          {isEditing && (
            <Button
              onClick={saveCanvas}
              disabled={isSaving || disabled}
              variant="outline"
              size="icon"
              title={lang('commercial.productBusinessCanvas.saveChanges')}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Grid - Classic Business Model Canvas Layout */}
      <div className="grid grid-cols-5 gap-4">

        <CanvasBlock title={lang('commercial.businessCanvas.keyPartners')} field="key_partnerships" rowSpan={2}
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        <CanvasBlock title={lang('commercial.businessCanvas.keyActivities')} field="key_activities"
          canvasData={canvasData} updateField={updateField} disabled={disabled}
          highlightClass={isInGenesisFlow ? (canvasData.key_activities?.trim() ? 'border-2 border-emerald-500 bg-emerald-50/30' : 'border-2 border-amber-400 bg-amber-50/30') : undefined} />

        <CanvasBlock title={lang('commercial.businessCanvas.valuePropositions')} field="value_propositions" rowSpan={2}
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        <CanvasBlock title={lang('commercial.businessCanvas.customerRelationships')} field="customer_relationships"
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        <CanvasBlock title={lang('commercial.businessCanvas.customerSegments')} field="customer_segments" rowSpan={2}
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        {/* Row 2 */}
        <CanvasBlock title={lang('commercial.businessCanvas.keyResources')} field="key_resources"
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        <CanvasBlock title={lang('commercial.businessCanvas.channels')} field="channels"
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        {/* Row 3 */}
        <CanvasBlock title={lang('commercial.businessCanvas.costStructure')} field="cost_structure" colSpan={2}
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

        <CanvasBlock title={lang('commercial.businessCanvas.revenueStreams')} field="revenue_streams" colSpan={3}
          canvasData={canvasData} updateField={updateField} disabled={disabled} />

      </div>

      {/* Footer Info */}
      {canvasData.is_ai_generated && canvasData.generated_at && (
        <div className="text-xs text-muted-foreground text-center">
          {lang('commercial.productBusinessCanvas.aiGeneratedOn').replace('{{date}}', new Date(canvasData.generated_at).toLocaleString())}
        </div>
      )}

      {/* AI Generation Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {lang('commercial.productBusinessCanvas.generateWithAI')}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Review the context sources that will be used for AI generation.
            </p>
          </DialogHeader>
          <AIContextSourcesPanel
            productId={productId}
            additionalSources={['Blueprint Notes', 'Market Data', 'NPV Analysis']}
            mode="select"
            onLanguageChange={setOutputLanguage}
            onPromptChange={setAdditionalPrompt}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={generateCanvas}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
