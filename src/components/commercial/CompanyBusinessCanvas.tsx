import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestrictedFeature } from '@/contexts/RestrictedFeatureContext';
import { usePlanMenuAccess } from '@/hooks/usePlanMenuAccess';
import { PORTFOLIO_MENU_ACCESS } from '@/constants/menuAccessKeys';
import { useTranslation } from '@/hooks/useTranslation';

interface CompanyBusinessCanvasProps {
  companyId: string;
}

interface BusinessCanvasData {
  key_partners: string;
  key_activities: string;
  key_resources: string;
  value_propositions: string;
  customer_relationships: string;
  channels: string;
  customer_segments: string;
  cost_structure: string;
  revenue_streams: string;
}

export function CompanyBusinessCanvas({ companyId }: CompanyBusinessCanvasProps) {
  const { toast } = useToast();
  const { lang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canvasData, setCanvasData] = useState<BusinessCanvasData>({
    key_partners: '',
    key_activities: '',
    key_resources: '',
    value_propositions: '',
    customer_relationships: '',
    channels: '',
    customer_segments: '',
    cost_structure: '',
    revenue_streams: '',
  });

  // Get restricted feature context (from parent) and double-check with plan access
  const { isRestricted: contextRestricted } = useRestrictedFeature();
  const { isMenuAccessKeyEnabled, planName } = usePlanMenuAccess();

  // SECURITY: Double-check restriction status directly from plan access
  // This prevents bypass via DevTools modifying the context
  const isFeatureEnabled = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_BUSINESS_CANVAS);
  const isRestricted = contextRestricted || !isFeatureEnabled;

  // Load canvas data
  useEffect(() => {
    loadCanvasData();
  }, [companyId]);

  const loadCanvasData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_business_canvas')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCanvasData({
          key_partners: data.key_partners || '',
          key_activities: data.key_activities || '',
          key_resources: data.key_resources || '',
          value_propositions: data.value_propositions || '',
          customer_relationships: data.customer_relationships || '',
          channels: data.channels || '',
          customer_segments: data.customer_segments || '',
          cost_structure: data.cost_structure || '',
          revenue_streams: data.revenue_streams || '',
        });
      }
    } catch {
      toast({
        title: lang('commercial.businessCanvas.error'),
        description: lang('commercial.businessCanvas.failedToLoad'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Save canvas data (debounced)
  // SECURITY: This function validates plan access before saving
  const saveCanvasData = async (data: BusinessCanvasData) => {
    // SECURITY CHECK: Verify plan access before any mutation
    // This is the critical security layer that prevents DevTools bypass
    const hasAccess = isMenuAccessKeyEnabled(PORTFOLIO_MENU_ACCESS.COMMERCIAL_BUSINESS_CANVAS);

    if (!hasAccess) {
      toast({
        title: lang('commercial.businessCanvas.upgradeRequired'),
        description: lang('commercial.businessCanvas.editingRequiresUpgrade'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_business_canvas')
        .upsert({
          company_id: companyId,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch {
      toast({
        title: lang('commercial.businessCanvas.error'),
        description: lang('commercial.businessCanvas.failedToSave'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((data: BusinessCanvasData) => {
      saveCanvasData(data);
    }, 1000),
    [companyId]
  );

  const handleFieldChange = (field: keyof BusinessCanvasData, value: string) => {
    // SECURITY: Block field changes in restricted mode
    if (isRestricted) {
      toast({
        title: lang('commercial.businessCanvas.previewMode'),
        description: lang('commercial.businessCanvas.editingDisabled'),
        variant: 'destructive',
      });
      return;
    }

    const newData = { ...canvasData, [field]: value };
    setCanvasData(newData);
    debouncedSave(newData);
  };

  const exportToPDF = () => {
    toast({
      title: lang('commercial.businessCanvas.exportPDF'),
      description: lang('commercial.businessCanvas.exportComingSoon'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Helper component for restricted textarea - clean, minimal styling
  const RestrictedTextarea = ({
    value,
    onChange,
    placeholder,
    className
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    className: string;
  }) => {
    if (isRestricted) {
      return (
        <Textarea
          value={value}
          readOnly
          placeholder={placeholder}
          className={`${className} cursor-default bg-slate-50/50 text-slate-600`}
          onFocus={(e) => e.target.blur()}
        />
      );
    }

    return (
      <Textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{lang('commercial.businessCanvas.title')}</h2>
          <p className="text-muted-foreground">
            {lang('commercial.businessCanvas.subtitle')}
          </p>
        </div>
        <Button
          onClick={exportToPDF}
          disabled={isRestricted}
          className={isRestricted ? 'opacity-50' : ''}
        >
          <Download className="h-4 w-4 mr-2" />
          {lang('commercial.businessCanvas.exportPDF')}
        </Button>
      </div>

      {saving && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {lang('commercial.businessCanvas.saving')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Column - Key Partners, Activities, Resources */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.keyPartners')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.keyPartnersDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.key_partners}
                onChange={(e) => handleFieldChange('key_partners', e.target.value)}
                placeholder={lang('commercial.businessCanvas.keyPartnersPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.keyActivities')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.keyActivitiesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.key_activities}
                onChange={(e) => handleFieldChange('key_activities', e.target.value)}
                placeholder={lang('commercial.businessCanvas.keyActivitiesPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.keyResources')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.keyResourcesDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.key_resources}
                onChange={(e) => handleFieldChange('key_resources', e.target.value)}
                placeholder={lang('commercial.businessCanvas.keyResourcesPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Value Propositions */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.valuePropositions')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.valuePropositionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.value_propositions}
                onChange={(e) => handleFieldChange('value_propositions', e.target.value)}
                placeholder={lang('commercial.businessCanvas.valuePropositionsPlaceholder')}
                className="min-h-[500px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer Relationships, Channels, Segments */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.customerRelationships')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.customerRelationshipsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.customer_relationships}
                onChange={(e) => handleFieldChange('customer_relationships', e.target.value)}
                placeholder={lang('commercial.businessCanvas.customerRelationshipsPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.channels')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.channelsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.channels}
                onChange={(e) => handleFieldChange('channels', e.target.value)}
                placeholder={lang('commercial.businessCanvas.channelsPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.customerSegments')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.customerSegmentsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.customer_segments}
                onChange={(e) => handleFieldChange('customer_segments', e.target.value)}
                placeholder={lang('commercial.businessCanvas.customerSegmentsPlaceholder')}
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Cost Structure and Revenue Streams */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.costStructure')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.costStructureDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.cost_structure}
                onChange={(e) => handleFieldChange('cost_structure', e.target.value)}
                placeholder={lang('commercial.businessCanvas.costStructurePlaceholder')}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{lang('commercial.businessCanvas.revenueStreams')}</CardTitle>
              <CardDescription className="text-xs">
                {lang('commercial.businessCanvas.revenueStreamsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RestrictedTextarea
                value={canvasData.revenue_streams}
                onChange={(e) => handleFieldChange('revenue_streams', e.target.value)}
                placeholder={lang('commercial.businessCanvas.revenueStreamsPlaceholder')}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
