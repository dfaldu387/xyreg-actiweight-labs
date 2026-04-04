import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sparkles, AlertCircle, CheckCircle, Clock, FileText, Edit2, Save, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  useSupplierCriticalityRationale,
  useGenerateRationale,
  useCreateSupplierCriticalityRationale,
  useUpdateSupplierCriticalityRationale,
  useGenerateDocumentId,
} from '@/hooks/useRationales';
import {
  mapCriticalityToClass,
  getRecommendedOversight,
  type SafetyImpact,
  type CriticalityClass,
  type OversightLevel,
  type SupplierDecision,
  type RationaleStatus,
} from '@/types/riskBasedRationale';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';

interface SupplierCriticalityRationalePanelProps {
  supplierId: string;
  companyId: string;
  supplierName: string;
  supplierCriticality: 'Critical' | 'Non-Critical';
  scopeOfSupply?: string;
  isEditMode?: boolean;
}

export function SupplierCriticalityRationalePanel({
  supplierId,
  companyId,
  supplierName,
  supplierCriticality,
  scopeOfSupply,
  isEditMode = false,
}: SupplierCriticalityRationalePanelProps) {
  const { lang } = useTranslation();
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [componentRole, setComponentRole] = useState(scopeOfSupply || '');
  const [safetyImpact, setSafetyImpact] = useState<SafetyImpact>(
    supplierCriticality === 'Critical' ? 'Direct Impact' : 'Indirect Impact'
  );
  const [rationaleText, setRationaleText] = useState('');
  const [oversightLevel, setOversightLevel] = useState<OversightLevel>('On-Site Audit');
  const [decision, setDecision] = useState<SupplierDecision>('Approved for ASL with High Oversight');
  
  const { data: existingRationale, isLoading } = useSupplierCriticalityRationale(supplierId);
  const generateRationale = useGenerateRationale();
  const createRationale = useCreateSupplierCriticalityRationale();
  const updateRationale = useUpdateSupplierCriticalityRationale();
  const generateDocId = useGenerateDocumentId();
  
  const criticalityClass = mapCriticalityToClass(supplierCriticality);
  
  // Initialize form with existing data
  useEffect(() => {
    if (existingRationale) {
      setComponentRole(existingRationale.component_role || '');
      setSafetyImpact(existingRationale.safety_impact as SafetyImpact);
      setRationaleText(existingRationale.rationale_text || '');
      setOversightLevel(existingRationale.oversight_level as OversightLevel);
      setDecision(existingRationale.decision as SupplierDecision);
    } else {
      // Set defaults based on criticality
      const recommended = getRecommendedOversight(criticalityClass, safetyImpact);
      setOversightLevel(recommended);
      setDecision(
        recommended === 'On-Site Audit'
          ? 'Approved for ASL with High Oversight'
          : 'Approved with Standard Monitoring'
      );
    }
  }, [existingRationale, criticalityClass, safetyImpact]);
  
  const handleGenerateRationale = async () => {
    if (!componentRole.trim()) {
      return;
    }
    
    try {
      const result = await generateRationale.mutateAsync({
        type: 'supplier',
        context: {
          supplier_name: supplierName,
          component_role: componentRole,
          safety_impact: safetyImpact,
          criticality_class: criticalityClass,
        },
        companyId,
      });
      
      setRationaleText(result.rationale_text);
      if (result.oversight_level) {
        setOversightLevel(result.oversight_level);
      }
      if (result.decision) {
        setDecision(result.decision);
      }
    } catch (error) {
      console.error('Failed to generate rationale:', error);
    }
  };
  
  const handleSave = async () => {
    if (!rationaleText.trim() || !componentRole.trim()) {
      return;
    }
    
    try {
      if (existingRationale) {
        await updateRationale.mutateAsync({
          id: existingRationale.id,
          updates: {
            component_role: componentRole,
            safety_impact: safetyImpact,
            criticality_class: criticalityClass,
            rationale_text: rationaleText,
            oversight_level: oversightLevel,
            decision,
          },
        });
      } else {
        const documentId = await generateDocId.mutateAsync({
          prefix: 'RBR-SUP',
          companyId,
        });
        
        await createRationale.mutateAsync({
          document_id: documentId,
          supplier_id: supplierId,
          supplier_name: supplierName,
          company_id: companyId,
          component_role: componentRole,
          safety_impact: safetyImpact,
          criticality_class: criticalityClass,
          rationale_text: rationaleText,
          oversight_level: oversightLevel,
          qmsr_clause_reference: '820.10 / ISO 13485:2016 7.4.1',
          decision,
          created_by: user?.id || '',
          status: 'Draft' as RationaleStatus,
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save rationale:', error);
    }
  };
  
  const getStatusBadge = (status?: RationaleStatus) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-primary/10 text-primary"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'Pending Approval':
        return <Badge className="bg-warning/10 text-warning"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" /> Draft</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }
  
  const showEditForm = isEditing || !existingRationale;
  
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              QMSR Risk-Based Rationale
            </CardTitle>
            <CardDescription>
              Supplier oversight justification per QMSR 820.10 / ISO 13485:2016 7.4.1
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {existingRationale && getStatusBadge(existingRationale.status as RationaleStatus)}
            {existingRationale?.document_id && (
              <Badge variant="outline" className="font-mono text-xs">
                {existingRationale.document_id}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!existingRationale && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>QMSR Compliance Required</AlertTitle>
            <AlertDescription>
              Under QMSR (effective Feb 2, 2026), you must document <strong>why</strong> the supplier oversight level
              is appropriate for the risk. Click "Generate Rationale" to create AI-assisted documentation.
            </AlertDescription>
          </Alert>
        )}
        
        {showEditForm ? (
          <div className="space-y-4">
            {/* Component Role */}
            <div className="space-y-2">
              <Label htmlFor="component-role">Component Role</Label>
              <Input
                id="component-role"
                placeholder="e.g., Custom ASIC for pulse generation"
                value={componentRole}
                onChange={(e) => setComponentRole(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Describe what this supplier provides and its role in your device
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Safety Impact */}
              <div className="space-y-2">
                <Label htmlFor="safety-impact">Impact on Device Safety</Label>
                <Select value={safetyImpact} onValueChange={(v) => setSafetyImpact(v as SafetyImpact)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Direct Impact">Direct Impact</SelectItem>
                    <SelectItem value="Indirect Impact">Indirect Impact</SelectItem>
                    <SelectItem value="No Impact">No Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Criticality Class (read-only) */}
              <div className="space-y-2">
                <Label>Criticality Class</Label>
                <div className="flex h-10 items-center px-3 border rounded-md bg-muted/50">
                  <span className="text-sm">{criticalityClass}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* AI Generate Button */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI-Assisted Rationale</p>
                <p className="text-xs text-muted-foreground">
                  Based on {criticalityClass} severity, AI suggests: <strong>{getRecommendedOversight(criticalityClass, safetyImpact)}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateRationale}
                disabled={!componentRole.trim() || generateRationale.isPending}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generateRationale.isPending ? 'Generating...' : 'Generate Rationale'}
              </Button>
            </div>
            
            {/* Rationale Text */}
            <div className="space-y-2">
              <Label htmlFor="rationale-text">Risk-Based Rationale</Label>
              <Textarea
                id="rationale-text"
                placeholder="The AI will generate a QMSR-compliant rationale here, or you can write your own..."
                value={rationaleText}
                onChange={(e) => setRationaleText(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Oversight Level */}
              <div className="space-y-2">
                <Label htmlFor="oversight-level">Oversight Level</Label>
                <Select value={oversightLevel} onValueChange={(v) => setOversightLevel(v as OversightLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-Site Audit">On-Site Quality Audit</SelectItem>
                    <SelectItem value="Paper Audit">Paper Audit</SelectItem>
                    <SelectItem value="Certificate Only">Certificate Monitoring Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Decision */}
              <div className="space-y-2">
                <Label htmlFor="decision">Decision</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as SupplierDecision)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved for ASL with High Oversight">High Oversight</SelectItem>
                    <SelectItem value="Approved with Standard Monitoring">Standard Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              {existingRationale && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!rationaleText.trim() || !componentRole.trim() || createRationale.isPending || updateRationale.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createRationale.isPending || updateRationale.isPending ? 'Saving...' : 'Save Rationale'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Read-only view */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Component Role</Label>
                <p className="font-medium mt-1">{existingRationale.component_role}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Safety Impact</Label>
                <p className="font-medium mt-1">{existingRationale.safety_impact}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Oversight Level</Label>
                <p className="font-medium mt-1">{existingRationale.oversight_level}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label className="text-muted-foreground">Risk-Based Rationale</Label>
              <div className="p-4 bg-muted/50 rounded-md border">
                <p className="text-sm whitespace-pre-wrap">{existingRationale.rationale_text}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>QMSR Reference: {existingRationale.qmsr_clause_reference || '820.10 / ISO 13485:2016 7.4.1'}</span>
              <span>Decision: {existingRationale.decision}</span>
            </div>
            
            {isEditMode && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Rationale
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
