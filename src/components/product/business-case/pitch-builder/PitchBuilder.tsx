import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, Share2, Eye, GripVertical, 
  Gauge, FileText, LayoutGrid, Users, Map, 
  TrendingUp, DollarSign, FlaskConical, Flag,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useInvestorShareSettings } from '@/hooks/useInvestorShareSettings';
import { useCompany } from '@/hooks/useCompany';
import { getInvestorShareUrl, generateShareSlug } from '@/services/investorShareService';
import { exportPitchDeckToPDF } from '@/utils/pitchDeckPdfExport';
import { useProductDetails } from '@/hooks/useProductDetails';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';

interface SectionConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  settingKey: string;
  description: string;
}

const PITCH_SECTIONS: SectionConfig[] = [
  { id: 'viability', label: 'Viability Scorecard', icon: Gauge, settingKey: 'show_viability_score', description: 'Investment readiness score' },
  { id: 'description', label: 'Device Description', icon: FileText, settingKey: 'show_technical_specs', description: 'Product overview and specs' },
  { id: 'canvas', label: 'Business Canvas', icon: LayoutGrid, settingKey: 'show_business_canvas', description: '9-section business model' },
  { id: 'blueprint', label: 'Venture Blueprint', icon: Map, settingKey: 'show_venture_blueprint', description: 'Strategic roadmap' },
  { id: 'market', label: 'Market Sizing', icon: TrendingUp, settingKey: 'show_market_sizing', description: 'TAM, SAM, SOM analysis' },
  { id: 'reimbursement', label: 'Reimbursement Strategy', icon: DollarSign, settingKey: 'show_reimbursement_strategy', description: 'Payer and coding pathway' },
  { id: 'evidence', label: 'Clinical Evidence', icon: FlaskConical, settingKey: 'show_clinical_evidence', description: 'Clinical study strategy' },
  { id: 'gates', label: 'Readiness Gates', icon: Flag, settingKey: 'show_readiness_gates', description: 'Development milestones' },
  { id: 'team', label: 'Team Profile', icon: Users, settingKey: 'show_team_profile', description: 'Leadership and expertise' },
  { id: 'roadmap', label: 'Execution Timeline', icon: Map, settingKey: 'show_roadmap', description: 'ISO 13485 development phases' },
];

interface SortableSectionItemProps {
  section: SectionConfig;
  enabled: boolean;
  onToggle: (key: string, value: boolean) => void;
}

function SortableSectionItem({ section, enabled, onToggle }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = section.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <div className={`p-2 rounded-md ${enabled ? 'bg-primary/10' : 'bg-muted'}`}>
        <Icon className={`h-4 w-4 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
          {section.label}
        </p>
        <p className="text-xs text-muted-foreground truncate">{section.description}</p>
      </div>
      
      <Switch
        checked={enabled}
        onCheckedChange={(checked) => onToggle(section.settingKey, checked)}
      />
    </div>
  );
}

export function PitchBuilder() {
  const { productId } = useParams<{ productId: string }>();
  const { companyId } = useCompany();
  const { data: product } = useProductDetails(productId);
  const { settings, createOrUpdate, isUpdating } = useInvestorShareSettings(companyId);
  
  // Get company name from product
  const companyName = product?.company || '';
  
  const [sectionOrder, setSectionOrder] = useState<string[]>(PITCH_SECTIONS.map(s => s.id));
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  const [visibilitySettings, setVisibilitySettings] = useState<Record<string, boolean>>({
    show_viability_score: true,
    show_technical_specs: true,
    show_business_canvas: true,
    show_venture_blueprint: true,
    show_market_sizing: false,
    show_reimbursement_strategy: false,
    show_clinical_evidence: false,
    show_readiness_gates: false,
    show_team_profile: false,
    show_roadmap: true,
  });

  // Sync with saved settings
  useEffect(() => {
    if (settings) {
      setVisibilitySettings({
        show_viability_score: settings.show_viability_score ?? true,
        show_technical_specs: settings.show_technical_specs ?? true,
        show_business_canvas: settings.show_business_canvas ?? true,
        show_venture_blueprint: (settings as any).show_venture_blueprint ?? true,
        show_market_sizing: (settings as any).show_market_sizing ?? false,
        show_reimbursement_strategy: (settings as any).show_reimbursement_strategy ?? false,
        show_clinical_evidence: (settings as any).show_clinical_evidence ?? false,
        show_readiness_gates: (settings as any).show_readiness_gates ?? false,
        show_team_profile: settings.show_team_profile ?? false,
        show_roadmap: settings.show_roadmap ?? true,
      });
    }
  }, [settings]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    setVisibilitySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    if (!settings?.public_slug) {
      toast.error('Please generate a share link first from the Investor Share settings');
      return;
    }
    
    createOrUpdate({
      ...visibilitySettings,
      featured_product_id: productId || null,
    });
    toast.success('Pitch settings saved');
  };

  const handlePreview = async () => {
    let slug = settings?.public_slug;
    
    // Auto-generate share link if none exists
    if (!slug) {
      if (!companyId) {
        toast.error('Company not found');
        return;
      }
      
      setIsGeneratingLink(true);
      try {
        slug = generateShareSlug();
        
        // Create or update settings with the new slug
        const { error } = await supabase
          .from('company_investor_share_settings')
          .upsert({
            company_id: companyId,
            public_slug: slug,
            is_active: true,
            featured_product_id: productId || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'company_id' });
        
        if (error) throw error;
        
        toast.success('Share link generated');
      } catch (error) {
        console.error('Error generating share link:', error);
        toast.error('Failed to generate share link');
        setIsGeneratingLink(false);
        return;
      }
      setIsGeneratingLink(false);
    } else if (productId && settings?.featured_product_id !== productId) {
      // Update featured_product_id to current product before preview
      await supabase
        .from('company_investor_share_settings')
        .update({ 
          featured_product_id: productId,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId);
    }
    
    const previewUrl = `${window.location.origin}/investor/${slug}?preview=true`;
    window.open(previewUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (settings?.public_slug) {
      const url = getInvestorShareUrl(settings.public_slug);
      navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard');
    } else {
      toast.error('Please generate a share link first');
    }
  };

  const handleDownloadPDF = async () => {
    if (!product || !companyName) {
      toast.error('Product or company data not available');
      return;
    }

    setIsExporting(true);
    try {
      const enabledSections = sectionOrder.filter(id => {
        const section = PITCH_SECTIONS.find(s => s.id === id);
        return section && visibilitySettings[section.settingKey];
      });

      await exportPitchDeckToPDF({
        companyName,
        productName: product.name,
        enabledSections,
        productId: productId!,
        companyId: companyId!,
      });
      toast.success('Pitch deck downloaded');
    } catch (error) {
      console.error('Error exporting pitch deck:', error);
      toast.error('Failed to generate pitch deck');
    } finally {
      setIsExporting(false);
    }
  };

  const enabledCount = Object.values(visibilitySettings).filter(Boolean).length;
  const orderedSections = sectionOrder.map(id => PITCH_SECTIONS.find(s => s.id === id)!).filter(Boolean);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Pitch Builder
              </CardTitle>
              <CardDescription>
                Configure which sections to include in your investor pitch and download as a slide deck
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {enabledCount} sections enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePreview} variant="outline" disabled={isGeneratingLink}>
              {isGeneratingLink ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Preview
            </Button>
            <Button onClick={handleCopyLink} variant="outline" disabled={!settings?.public_slug}>
              <Share2 className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download Slide Deck
            </Button>
          </div>

          <Separator />

          {/* Section Configuration */}
          <div>
            <Label className="text-base font-semibold mb-4 block">
              Pitch Sections
            </Label>
            <p className="text-sm text-muted-foreground mb-4">
              Drag to reorder sections. Toggle to show/hide in your pitch.
            </p>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {orderedSections.map((section) => (
                    <SortableSectionItem
                      key={section.id}
                      section={section}
                      enabled={visibilitySettings[section.settingKey] ?? false}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
