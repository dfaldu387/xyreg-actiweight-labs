import React, { useState, useCallback, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Plus, Monitor, Trash2, Edit2, Info, Upload, X, Image, Sparkles, ChevronDown, Loader2, FolderOpen, AlertTriangle, Zap, CheckCircle2, AlertCircle, Tag } from "lucide-react";
import { useUsabilityEngineeringFile } from "@/hooks/useUsabilityEngineeringFile";
import { hazardsService } from "@/services/hazardsService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

type UICategory = 'displays' | 'controls' | 'alarms' | 'labels' | 'connectors' | 'other';

interface UICharacteristic {
  id: string;
  feature: string;
  description: string;
  safety_relevance: 'critical' | 'moderate' | 'low';
  category?: UICategory;
  rationale?: string;
  image_url?: string;
  ai_analysis?: DetailedAnalysis;
}

const CLAUSE_5_2_CATEGORIES: { value: UICategory; label: string; icon: string; prompt: string }[] = [
  { value: 'displays', label: 'Displays', icon: '🖥️', prompt: 'Upload a screenshot of your device displays' },
  { value: 'controls', label: 'Controls', icon: '🎛️', prompt: 'Upload a photo of physical or on-screen controls' },
  { value: 'alarms', label: 'Alarms / Alerts', icon: '🔔', prompt: 'Upload a screenshot showing alarm or alert states' },
  { value: 'labels', label: 'Labels / Markings', icon: '🏷️', prompt: 'Upload a photo of device labels and markings' },
  { value: 'connectors', label: 'Connectors / Ports', icon: '🔌', prompt: 'Upload a photo of connectors, ports, or cables' },
  { value: 'other', label: 'Other Elements', icon: '📦', prompt: 'Upload an image of other interaction elements' },
];

interface AnalysisIssue {
  issue: string;
  severity: 'high' | 'medium' | 'low';
  details: string;
}

interface PotentialHazard {
  hazard: string;
  usability_root_cause: string;
  potential_clinical_outcome: string;
}

interface DetailedAnalysis {
  cognitive_load: AnalysisIssue[];
  visual_design_hazards: AnalysisIssue[];
  physical_interaction: AnalysisIssue[];
  potential_hazards: PotentialHazard[];
  recommendations: string[];
}

interface AIAnalysisResult {
  feature_name: string;
  description: string;
  safety_relevance: 'critical' | 'moderate' | 'low';
  category?: UICategory;
  rationale: string;
  detailed_analysis: DetailedAnalysis;
}

const SAFETY_RELEVANCE_OPTIONS = [
  { value: 'critical', label: 'Critical', description: 'Direct impact on patient safety', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'moderate', label: 'Moderate', description: 'Potential for use errors leading to harm', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'low', label: 'Low', description: 'Minimal safety implications', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
];

interface UICharacteristicsTabProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function UICharacteristicsTab({ productId, companyId, disabled }: UICharacteristicsTabProps) {
  const { uef, updateUEF, isUpdating } = useUsabilityEngineeringFile(productId, companyId);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isDraftingHazards, setIsDraftingHazards] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UICharacteristic | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [shareToDeviceMedia, setShareToDeviceMedia] = useState(false);
  const [deviceMediaImages, setDeviceMediaImages] = useState<string[]>([]);
  const [loadingDeviceMedia, setLoadingDeviceMedia] = useState(false);
  const [imageTab, setImageTab] = useState<string>('upload');
  const [formData, setFormData] = useState({
    feature: '',
    description: '',
    safety_relevance: 'low' as UICharacteristic['safety_relevance'],
    category: '' as UICategory | '',
    rationale: '',
    image_url: '' as string | undefined,
  });

  // AI Generate state
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<(AIAnalysisResult & { _id: string })[]>([]);
  const [selectedGeneratedIds, setSelectedGeneratedIds] = useState<Set<string>>(new Set());
  const [generateImageUrl, setGenerateImageUrl] = useState<string>('');
  const [generateImageTab, setGenerateImageTab] = useState<string>('upload');
  const [isGenerateUploading, setIsGenerateUploading] = useState(false);
  const [generateShareToDeviceMedia, setGenerateShareToDeviceMedia] = useState(false);
  const [generateDeviceMediaImages, setGenerateDeviceMediaImages] = useState<string[]>([]);

  const characteristics: UICharacteristic[] = (uef?.ui_characteristics as UICharacteristic[]) || [];

  const inferCategory = (c: UICharacteristic): UICategory => {
    const text = `${c.feature} ${c.description}`.toLowerCase();
    if (/display|screen|monitor|indicator|readout|lcd|led\s?screen/i.test(text)) return 'displays';
    if (/button|switch|knob|dial|slider|control|toggle|touchscreen|joystick/i.test(text)) return 'controls';
    if (/alarm|alert|warning|notification|beep|sound|buzzer|siren/i.test(text)) return 'alarms';
    if (/label|marking|symbol|text|instruction|icon|signage/i.test(text)) return 'labels';
    if (/connector|port|cable|plug|socket|usb|interface\s?port/i.test(text)) return 'connectors';
    return 'other';
  };

  const getEffectiveCategory = (c: UICharacteristic): UICategory => c.category || inferCategory(c);

  // Load device media images when dialog opens on the browse tab
  useEffect(() => {
    if (isDialogOpen && imageTab === 'browse') {
      loadDeviceMedia();
    }
  }, [isDialogOpen, imageTab, productId]);

  // Load device media for generate dialog
  useEffect(() => {
    if (isGenerateDialogOpen && generateImageTab === 'browse') {
      loadGenerateDeviceMedia();
    }
  }, [isGenerateDialogOpen, generateImageTab, productId]);

  const loadGenerateDeviceMedia = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', { search: `${productId}-`, limit: 50 });
      if (error) throw error;
      const urls = (data || []).map(file =>
        supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl
      );
      setGenerateDeviceMediaImages(urls);
    } catch (err) {
      console.error('Failed to load device media:', err);
    }
  };

  const loadDeviceMedia = async () => {
    setLoadingDeviceMedia(true);
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('', { search: `${productId}-`, limit: 50 });
      if (error) throw error;
      const urls = (data || []).map(file =>
        supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl
      );
      setDeviceMediaImages(urls);
    } catch (err) {
      console.error('Failed to load device media:', err);
    } finally {
      setLoadingDeviceMedia(false);
    }
  };

  const handleOpenDialog = (item?: UICharacteristic) => {
    setAiAnalysis(null);
    setShowAnalysis(false);
    setShareToDeviceMedia(false);
    setImageTab('upload');
    if (item) {
      setEditingItem(item);
      setFormData({
        feature: item.feature,
        description: item.description,
        safety_relevance: item.safety_relevance,
        category: item.category || '',
        rationale: item.rationale || '',
        image_url: item.image_url || '',
      });
      if (item.ai_analysis) {
        setAiAnalysis({
          feature_name: item.feature,
          description: item.description,
          safety_relevance: item.safety_relevance,
          rationale: item.rationale || '',
          detailed_analysis: item.ai_analysis,
        });
        setShowAnalysis(true);
      }
    } else {
      setEditingItem(null);
      setFormData({ feature: '', description: '', safety_relevance: 'low', category: '', rationale: '', image_url: '' });
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const filePath = `${productId}/ui-characteristics/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('usability-evidence')
        .upload(filePath, file);
      if (error) throw error;
      const url = supabase.storage.from('usability-evidence').getPublicUrl(filePath).data.publicUrl;
      setFormData(prev => ({ ...prev, image_url: url }));

      // If share toggle is on, also upload to product-images
      if (shareToDeviceMedia) {
        const sharedFileName = `${productId}-ue-${Date.now()}-${file.name}`;
        await supabase.storage.from('product-images').upload(sharedFileName, file);
      }

      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleImageUpload(acceptedFiles[0]);
    }
  }, [productId, shareToDeviceMedia]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleSelectDeviceMedia = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
    toast.success('Image selected from device media');
  };

  const handleAIAnalysis = async () => {
    if (!formData.image_url) {
      toast.error('Please add an image first');
      return;
    }
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-ui-analysis', {
        body: { imageUrl: formData.image_url, productContext: formData.feature || undefined },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const result = data as AIAnalysisResult;
      setAiAnalysis(result);
      setShowAnalysis(true);

      // Auto-fill form fields
      if (!formData.feature) setFormData(prev => ({ ...prev, feature: result.feature_name }));
      if (!formData.description) setFormData(prev => ({ ...prev, description: result.description }));
      setFormData(prev => ({
        ...prev,
        safety_relevance: result.safety_relevance,
        rationale: result.rationale,
        category: result.category || prev.category,
      }));

      toast.success('AI analysis complete — review and modify before saving');
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast.error(error.message || 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.feature.trim()) {
      toast.error("Feature name is required");
      return;
    }

    const newItem: UICharacteristic = {
      id: editingItem?.id || crypto.randomUUID(),
      feature: formData.feature,
      description: formData.description,
      safety_relevance: formData.safety_relevance,
      category: (formData.category || undefined) as UICategory | undefined,
      rationale: formData.rationale,
      image_url: formData.image_url || undefined,
      ai_analysis: aiAnalysis?.detailed_analysis || undefined,
    };

    const updatedList = editingItem 
      ? characteristics.map(c => c.id === editingItem.id ? newItem : c)
      : [...characteristics, newItem];

    await updateUEF({ ui_characteristics: updatedList });
    setIsDialogOpen(false);
    toast.success(editingItem ? "UI characteristic updated" : "UI characteristic added");
  };

  const handleDelete = async (id: string) => {
    const updatedList = characteristics.filter(c => c.id !== id);
    await updateUEF({ ui_characteristics: updatedList });
    toast.success("UI characteristic removed");
  };

  // AI Generate handlers
  const handleGenerateImageUpload = async (file: File) => {
    setIsGenerateUploading(true);
    try {
      const filePath = `${productId}/ui-characteristics/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('usability-evidence').upload(filePath, file);
      if (error) throw error;
      const url = supabase.storage.from('usability-evidence').getPublicUrl(filePath).data.publicUrl;
      setGenerateImageUrl(url);
      if (generateShareToDeviceMedia) {
        const sharedFileName = `${productId}-ue-${Date.now()}-${file.name}`;
        await supabase.storage.from('product-images').upload(sharedFileName, file);
      }
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsGenerateUploading(false);
    }
  };

  const onGenerateDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) handleGenerateImageUpload(acceptedFiles[0]);
  }, [productId, generateShareToDeviceMedia]);

  const handleBulkGenerate = async () => {
    if (!generateImageUrl) { toast.error('Please add an image first'); return; }
    setIsGenerating(true);
    setGeneratedItems([]);
    setSelectedGeneratedIds(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('ai-ui-analysis', {
        body: { imageUrl: generateImageUrl, mode: 'generate' },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      const features = (data.features || []).map((f: AIAnalysisResult) => ({ ...f, _id: crypto.randomUUID() }));
      setGeneratedItems(features);
      setSelectedGeneratedIds(new Set(features.map((f: any) => f._id)));
      toast.success(`Found ${features.length} UI characteristics`);
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'AI generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleGenerated = (id: string) => {
    setSelectedGeneratedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddSelected = async () => {
    const selected = generatedItems.filter(item => selectedGeneratedIds.has(item._id));
    if (selected.length === 0) { toast.error('No items selected'); return; }
    const newItems: UICharacteristic[] = selected.map(item => ({
      id: crypto.randomUUID(),
      feature: item.feature_name,
      description: item.description,
      safety_relevance: item.safety_relevance,
      category: item.category || undefined,
      rationale: item.rationale,
      image_url: generateImageUrl || undefined,
      ai_analysis: item.detailed_analysis,
    }));
    const updatedList = [...characteristics, ...newItems];
    await updateUEF({ ui_characteristics: updatedList });
    setIsGenerateDialogOpen(false);
    setGeneratedItems([]);
    setGenerateImageUrl('');
    toast.success(`Added ${newItems.length} UI characteristics`);
  };

  const handleOpenGenerateDialog = () => {
    setGenerateImageUrl('');
    setGeneratedItems([]);
    setSelectedGeneratedIds(new Set());
    setGenerateImageTab('upload');
    setGenerateShareToDeviceMedia(false);
    setIsGenerateDialogOpen(true);
  };

  // Draft usability hazards from AI-detected potential hazards
  const handleDraftHazards = async (hazards: PotentialHazard[], sourceFeature: string) => {
    if (!user?.id) { toast.error('Not authenticated'); return; }
    setIsDraftingHazards(true);
    try {
      let created = 0;
      for (const h of hazards) {
        await hazardsService.createHazard(productId, companyId, {
          description: `Draft – ${h.hazard}`,
          hazardous_situation: h.usability_root_cause,
          potential_harm: h.potential_clinical_outcome,
          category: 'human_factors',
        }, 'USE');
        created++;
      }
      queryClient.invalidateQueries({ queryKey: ['usability-hazards', productId] });
      queryClient.invalidateQueries({ queryKey: ['hazards', productId] });
      toast.success(`Drafted ${created} usability hazards from "${sourceFeature}" → Usability Hazards tab`);
    } catch (error) {
      console.error('Error drafting hazards:', error);
      toast.error('Failed to draft usability hazards');
    } finally {
      setIsDraftingHazards(false);
    }
  };

  const getSafetyBadge = (relevance: UICharacteristic['safety_relevance']) => {
    const option = SAFETY_RELEVANCE_OPTIONS.find(o => o.value === relevance);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : null;
  };

  const severityColor = (s: string) => {
    if (s === 'high') return 'text-red-600 dark:text-red-400';
    if (s === 'medium') return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
  };

  if (!uef) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Please initialize the Usability Engineering File first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                User Interface Characteristics
              </CardTitle>
              <CardDescription>
                IEC 62366-1 Clause 5.2 - Identify UI features and their safety relevance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenGenerateDialog} disabled={disabled} className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </Button>
              <Button onClick={() => handleOpenDialog()} disabled={disabled}>
                <Plus className="h-4 w-4 mr-2" />
                Add UI Characteristic
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info Banner */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What is Clause 5.2?</p>
                <p>
                  Per IEC 62366-1, you must identify all user interface characteristics that could 
                  affect safety. This includes displays, controls, alarms, labels, and any elements 
                  users interact with. Document their safety relevance to inform hazard analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Clause 5.2 Coverage Tracker */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              Clause 5.2 Coverage
            </h4>
            <div className="flex flex-wrap gap-2">
              {CLAUSE_5_2_CATEGORIES.map(cat => {
                const count = characteristics.filter(c => getEffectiveCategory(c) === cat.value).length;
                const isCovered = count > 0;
                return (
                  <button
                    key={cat.value}
                    onClick={() => {
                      if (!isCovered && !disabled) {
                        handleOpenGenerateDialog();
                      }
                    }}
                    disabled={isCovered || disabled}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      isCovered
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {isCovered ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        {cat.label} ({count})
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" />
                        {cat.label} — Missing
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            {characteristics.length > 0 && CLAUSE_5_2_CATEGORIES.some(cat => !characteristics.some(c => getEffectiveCategory(c) === cat.value)) && (
              <p className="text-xs text-muted-foreground mt-2">
                Click a missing category to open AI Generate and upload an image of that element type.
              </p>
            )}
          </div>

          {characteristics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No UI characteristics defined yet</p>
              <p className="text-sm mt-1">Add user interface features and assess their safety relevance</p>
            </div>
          ) : (
            <div className="space-y-3">
              {characteristics.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 flex-1">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.feature}
                          className="w-16 h-16 object-cover rounded border flex-shrink-0"
                        />
                      )}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{item.feature}</h4>
                          {getSafetyBadge(item.safety_relevance)}
                          {(() => {
                            const effCat = getEffectiveCategory(item);
                            const catInfo = CLAUSE_5_2_CATEGORIES.find(c => c.value === effCat);
                            return catInfo ? (
                              <Badge variant="secondary" className={`text-xs ${!item.category ? 'border-dashed' : ''}`}>
                                {catInfo.icon} {catInfo.label}
                                {!item.category && <span className="ml-1 opacity-60">(auto)</span>}
                              </Badge>
                            ) : null;
                          })()}
                          {item.ai_analysis && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" /> AI Analyzed
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        {item.rationale && (
                          <p className="text-xs text-muted-foreground italic">
                            <span className="font-medium">Rationale:</span> {item.rationale}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)} disabled={disabled}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={disabled}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingItem ? 'Edit UI Characteristic' : 'Add UI Characteristic'}
            </DialogTitle>
            <DialogDescription>
              Document a user interface feature and assess its safety relevance per IEC 62366-1 §5.2.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            <div className="space-y-4 pb-2">
              {/* Image Section */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Screenshot / Photo
                </Label>

                {formData.image_url ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img 
                        src={formData.image_url} 
                        alt="UI characteristic" 
                        className="max-h-40 rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image_url: '' }));
                          setAiAnalysis(null);
                          setShowAnalysis(false);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* AI Analyze Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIAnalysis}
                      disabled={isAnalyzing}
                      className="gap-2"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze with AI (IEC 62366-1)'}
                    </Button>
                  </div>
                ) : (
                  <Tabs value={imageTab} onValueChange={setImageTab}>
                    <TabsList className="w-full">
                      <TabsTrigger value="upload" className="flex-1 gap-1">
                        <Upload className="h-3 w-3" />
                        Upload New
                      </TabsTrigger>
                      <TabsTrigger value="browse" className="flex-1 gap-1">
                        <FolderOpen className="h-3 w-3" />
                        Device Media
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="mt-2 space-y-2">
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isUploading ? 'Uploading...' : 'Drop image or click to browse'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="share-toggle"
                          checked={shareToDeviceMedia}
                          onCheckedChange={setShareToDeviceMedia}
                        />
                        <Label htmlFor="share-toggle" className="text-xs text-muted-foreground cursor-pointer">
                          Also share to Device Media library
                        </Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="browse" className="mt-2">
                      {loadingDeviceMedia ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : deviceMediaImages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No device media images found for this product.
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                          {deviceMediaImages.map((url, idx) => (
                            <button
                              key={idx}
                              className="border rounded hover:ring-2 hover:ring-primary transition-all overflow-hidden aspect-square"
                              onClick={() => handleSelectDeviceMedia(url)}
                            >
                              <img src={url} alt={`Device media ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              {/* AI Analysis Results Panel */}
              {aiAnalysis && (
                <Collapsible open={showAnalysis} onOpenChange={setShowAnalysis}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        IEC 62366-1 Analysis Results
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAnalysis ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 border rounded-lg p-4 space-y-4 bg-muted/30 text-sm">
                      {/* Cognitive Load */}
                      {aiAnalysis.detailed_analysis.cognitive_load.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 flex items-center gap-1">🧠 Cognitive Load & Information Architecture</h5>
                          <div className="space-y-2">
                            {aiAnalysis.detailed_analysis.cognitive_load.map((item, i) => (
                              <div key={i} className="pl-3 border-l-2 border-muted-foreground/20">
                                <p className="font-medium">{item.issue} <span className={`text-xs ${severityColor(item.severity)}`}>({item.severity})</span></p>
                                <p className="text-muted-foreground text-xs">{item.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visual Design Hazards */}
                      {aiAnalysis.detailed_analysis.visual_design_hazards.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 flex items-center gap-1">👁️ Visual Design & Mapping Hazards</h5>
                          <div className="space-y-2">
                            {aiAnalysis.detailed_analysis.visual_design_hazards.map((item, i) => (
                              <div key={i} className="pl-3 border-l-2 border-muted-foreground/20">
                                <p className="font-medium">{item.issue} <span className={`text-xs ${severityColor(item.severity)}`}>({item.severity})</span></p>
                                <p className="text-muted-foreground text-xs">{item.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Physical Interaction */}
                      {aiAnalysis.detailed_analysis.physical_interaction.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 flex items-center gap-1">🖐️ Physical Interaction</h5>
                          <div className="space-y-2">
                            {aiAnalysis.detailed_analysis.physical_interaction.map((item, i) => (
                              <div key={i} className="pl-3 border-l-2 border-muted-foreground/20">
                                <p className="font-medium">{item.issue} <span className={`text-xs ${severityColor(item.severity)}`}>({item.severity})</span></p>
                                <p className="text-muted-foreground text-xs">{item.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Potential Hazards Table */}
                      {aiAnalysis.detailed_analysis.potential_hazards.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Potential Hazards (ISO 14971 Linkage)
                          </h5>
                          <div className="border rounded overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="p-2 text-left font-medium">Hazard</th>
                                  <th className="p-2 text-left font-medium">Usability Root Cause</th>
                                  <th className="p-2 text-left font-medium">Clinical Outcome</th>
                                </tr>
                              </thead>
                              <tbody>
                                {aiAnalysis.detailed_analysis.potential_hazards.map((h, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="p-2 font-medium">{h.hazard}</td>
                                    <td className="p-2 text-muted-foreground">{h.usability_root_cause}</td>
                                    <td className="p-2 text-muted-foreground">{h.potential_clinical_outcome}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 gap-2"
                            disabled={isDraftingHazards || disabled}
                            onClick={() => handleDraftHazards(
                              aiAnalysis.detailed_analysis.potential_hazards,
                              formData.feature || 'UI Characteristic'
                            )}
                          >
                            {isDraftingHazards ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                            Draft as Usability Hazards
                          </Button>
                        </div>
                      )}

                      {/* Recommendations */}
                      {aiAnalysis.detailed_analysis.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-semibold mb-2">✅ Recommendations</h5>
                          <ul className="space-y-1 list-disc list-inside text-muted-foreground text-xs">
                            {aiAnalysis.detailed_analysis.recommendations.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Form Fields */}
              <div className="space-y-2">
                <Label htmlFor="feature">UI Feature *</Label>
                <Input
                  id="feature"
                  placeholder="e.g., Touchscreen display, Alarm indicator, Control button"
                  value={formData.feature}
                  onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the UI feature and how users interact with it..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="safety_relevance">Safety Relevance</Label>
                <Select
                  value={formData.safety_relevance}
                  onValueChange={(value: UICharacteristic['safety_relevance']) => 
                    setFormData({ ...formData, safety_relevance: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select safety relevance" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAFETY_RELEVANCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Clause 5.2 Category</Label>
                <Select
                  value={formData.category || 'none'}
                  onValueChange={(value) => 
                    setFormData({ ...formData, category: value === 'none' ? '' : value as UICategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Uncategorized</span>
                    </SelectItem>
                    {CLAUSE_5_2_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span>{cat.icon} {cat.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rationale">Rationale</Label>
                <Textarea
                  id="rationale"
                  placeholder="Explain why this safety relevance level was chosen..."
                  value={formData.rationale}
                  onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || isUploading || isAnalyzing}>
              {editingItem ? 'Update' : 'Add'} Characteristic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Generate UI Characteristics
            </DialogTitle>
            <DialogDescription>
              Upload or select an image and let AI identify all UI characteristics in it.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-2">
              {/* Image Section */}
              {generateImageUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img src={generateImageUrl} alt="UI for generation" className="max-h-40 rounded border" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => { setGenerateImageUrl(''); setGeneratedItems([]); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {generatedItems.length === 0 && (
                    <Button onClick={handleBulkGenerate} disabled={isGenerating} className="gap-2">
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {isGenerating ? 'Analyzing image...' : 'Generate UI Characteristics'}
                    </Button>
                  )}
                </div>
              ) : (
                <Tabs value={generateImageTab} onValueChange={setGenerateImageTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="upload" className="flex-1 gap-1">
                      <Upload className="h-3 w-3" /> Upload New
                    </TabsTrigger>
                    <TabsTrigger value="browse" className="flex-1 gap-1">
                      <FolderOpen className="h-3 w-3" /> Device Media
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-2 space-y-2">
                    <GenerateDropzone onDrop={onGenerateDrop} isUploading={isGenerateUploading} disabled={disabled} />
                    <div className="flex items-center gap-2">
                      <Switch id="gen-share-toggle" checked={generateShareToDeviceMedia} onCheckedChange={setGenerateShareToDeviceMedia} />
                      <Label htmlFor="gen-share-toggle" className="text-xs text-muted-foreground cursor-pointer">Also share to Device Media library</Label>
                    </div>
                  </TabsContent>
                  <TabsContent value="browse" className="mt-2">
                    {generateDeviceMediaImages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No device media images found.</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {generateDeviceMediaImages.map((url, idx) => (
                          <button key={idx} className="border rounded hover:ring-2 hover:ring-primary transition-all overflow-hidden aspect-square"
                            onClick={() => { setGenerateImageUrl(url); toast.success('Image selected'); }}>
                            <img src={url} alt={`Device media ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              {/* Loading state */}
              {isGenerating && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing image for UI characteristics...</p>
                </div>
              )}

              {/* Results Preview */}
              {generatedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Found {generatedItems.length} characteristics</h4>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (selectedGeneratedIds.size === generatedItems.length) setSelectedGeneratedIds(new Set());
                      else setSelectedGeneratedIds(new Set(generatedItems.map(i => i._id)));
                    }}>
                      {selectedGeneratedIds.size === generatedItems.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedItems.map(item => (
                      <div key={item._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={selectedGeneratedIds.has(item._id)}
                          onCheckedChange={() => handleToggleGenerated(item._id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.feature_name}</span>
                            {getSafetyBadge(item.safety_relevance)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
            {generatedItems.length > 0 && (
              <Button onClick={handleAddSelected} disabled={isUpdating || selectedGeneratedIds.size === 0}>
                Add {selectedGeneratedIds.size} Selected
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted dropzone component for generate dialog
function GenerateDropzone({ onDrop, isUploading, disabled }: { onDrop: (files: File[]) => void; isUploading: boolean; disabled?: boolean }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });
  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}>
      <input {...getInputProps()} />
      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{isUploading ? 'Uploading...' : 'Drop image or click to browse'}</p>
    </div>
  );
}
