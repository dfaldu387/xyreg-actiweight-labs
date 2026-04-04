import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupplier, useUpdateSupplier } from '@/hooks/useSuppliers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SupplierEvaluationTab } from '@/components/suppliers/SupplierEvaluationTab';
import { DatePicker } from '@/components/ui/date-picker';
import { formatScopeOfSupply, createScopeOfSupply } from '@/utils/scopeOfSupply';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export default function EditSupplierPage() {
  const { lang } = useTranslation();
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { data: supplier, isLoading, error } = useSupplier(supplierId!);
  const updateMutation = useUpdateSupplier();
  
  const [formData, setFormData] = useState<{
    name: string;
    status: 'Approved' | 'Probationary' | 'Disqualified';
    criticality: 'Critical' | 'Non-Critical';
    scope_category: string;
    scope_custom_description: string;
    contact_person: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    contact_position: string;
    next_scheduled_audit: string;
    audit_interval: '6 months' | '1 year' | '2 years' | '3 years';
    probationary_reason: string;
  }>({
    name: '',
    status: 'Probationary',
    criticality: 'Non-Critical',
    scope_category: '',
    scope_custom_description: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    contact_position: '',
    next_scheduled_audit: '',
    audit_interval: '1 year',
    probationary_reason: '',
  });

  // Initialize form data when supplier loads
  React.useEffect(() => {
    if (supplier) {
      const scopeOfSupply = supplier.scope_of_supply;
      let category = '';
      let customDescription = '';
      
      if (typeof scopeOfSupply === 'object' && scopeOfSupply) {
        category = scopeOfSupply.category || '';
        customDescription = scopeOfSupply.custom_description || '';
      } else if (typeof scopeOfSupply === 'string') {
        category = scopeOfSupply;
      }

      setFormData({
        name: supplier.name || '',
        status: supplier.status || 'Probationary',
        criticality: supplier.criticality || 'Non-Critical',
        scope_category: category,
        scope_custom_description: customDescription,
        contact_person: supplier.contact_info?.contact_person || '',
        contact_email: supplier.contact_info?.email || '',
        contact_phone: supplier.contact_info?.phone || '',
        contact_address: supplier.contact_info?.address || '',
        contact_position: supplier.contact_info?.position || '',
        next_scheduled_audit: supplier.next_scheduled_audit || '',
        audit_interval: (supplier.audit_interval as any) || '1 year',
        probationary_reason: supplier.probationary_reason || '',
      });
    }
  }, [supplier]);

  const handleSave = async () => {
    if (!supplier) return;

    const scopeOfSupply = formData.scope_category 
      ? createScopeOfSupply(formData.scope_category, formData.scope_custom_description)
      : undefined;

    const updates = {
      name: formData.name,
      status: formData.status,
      criticality: formData.criticality,
      scope_of_supply: scopeOfSupply,
      contact_info: {
        contact_person: formData.contact_person || undefined,
        email: formData.contact_email || undefined,
        phone: formData.contact_phone || undefined,
        address: formData.contact_address || undefined,
        position: formData.contact_position || undefined,
      },
      next_scheduled_audit: formData.next_scheduled_audit || undefined,
      audit_interval: formData.audit_interval || undefined,
      probationary_reason: formData.probationary_reason || undefined,
    };

    try {
      await updateMutation.mutateAsync({
        id: supplier.id,
        updates
      });
      toast.success(lang('supplier.updateSuccess'));
      navigate(`/app/supplier/${supplier.id}`);
    } catch (error) {
      console.error('Failed to update supplier:', error);
      toast.error(lang('supplier.updateFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive">{lang('supplier.loadFailed')}</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {lang('supplier.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Probationary':
        return 'secondary';
      case 'Disqualified':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCriticalityBadgeVariant = (criticality: string) => {
    return criticality === 'Critical' ? 'destructive' : 'outline';
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {lang('supplier.backToSuppliers')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lang('supplier.editSupplier')}</h1>
            <p className="text-muted-foreground">{supplier.name}</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateMutation.isPending ? lang('supplier.saving') : lang('supplier.saveChanges')}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">{lang('supplier.tabBasicInfo')}</TabsTrigger>
          <TabsTrigger value="contact">{lang('supplier.tabContactDetails')}</TabsTrigger>
          <TabsTrigger value="evaluation">{lang('supplier.tabEvaluation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{lang('supplier.basicInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{lang('supplier.supplierName')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={lang('supplier.enterSupplierName')}
                  />
                </div>

                <div>
                  <Label htmlFor="status">{lang('supplier.status')} *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Probationary">{lang('supplier.statusProbationary')}</SelectItem>
                      <SelectItem value="Approved">{lang('supplier.statusApproved')}</SelectItem>
                      <SelectItem value="Disqualified">{lang('supplier.statusDisqualified')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="criticality">{lang('supplier.criticalityLevel')} *</Label>
                  <Select
                    value={formData.criticality}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, criticality: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non-Critical">{lang('supplier.nonCritical')}</SelectItem>
                      <SelectItem value="Critical">{lang('supplier.critical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div>
                <Label htmlFor="scope_category">{lang('supplier.scopeOfSupply')}</Label>
                <Select
                  value={formData.scope_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scope_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={lang('supplier.selectScopeCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raw Materials">{lang('supplier.scopeRawMaterials')}</SelectItem>
                    <SelectItem value="Electronic Components">{lang('supplier.scopeElectronicComponents')}</SelectItem>
                    <SelectItem value="Manufacturing Services">{lang('supplier.scopeManufacturingServices')}</SelectItem>
                    <SelectItem value="Packaging Materials">{lang('supplier.scopePackagingMaterials')}</SelectItem>
                    <SelectItem value="Testing & Validation Services">{lang('supplier.scopeTestingValidation')}</SelectItem>
                    <SelectItem value="Software Components">{lang('supplier.scopeSoftwareComponents')}</SelectItem>
                    <SelectItem value="Regulatory Services">{lang('supplier.scopeRegulatoryServices')}</SelectItem>
                    <SelectItem value="Logistics & Distribution">{lang('supplier.scopeLogistics')}</SelectItem>
                    <SelectItem value="Quality Systems">{lang('supplier.scopeQualitySystems')}</SelectItem>
                    <SelectItem value="Other">{lang('supplier.typeOther')}</SelectItem>
                  </SelectContent>
                </Select>

                {formData.scope_category === 'Other' && (
                  <div className="mt-2">
                    <Input
                      value={formData.scope_custom_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, scope_custom_description: e.target.value }))}
                      placeholder={lang('supplier.describeScopeOfSupply')}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{lang('supplier.contactInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">{lang('supplier.contactPerson')}</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    placeholder={lang('supplier.contactPersonPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="contact_position">{lang('supplier.position')}</Label>
                  <Input
                    id="contact_position"
                    value={formData.contact_position}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_position: e.target.value }))}
                    placeholder={lang('supplier.positionPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">{lang('supplier.email')}</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder={lang('supplier.emailPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">{lang('supplier.phone')}</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder={lang('supplier.phonePlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact_address">{lang('supplier.address')}</Label>
                <Textarea
                  id="contact_address"
                  value={formData.contact_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                  placeholder={lang('supplier.addressPlaceholder')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6">
          <SupplierEvaluationTab 
            supplierId={supplier.id}
            companyId={supplier.company_id}
            supplierStatus={formData.status}
            probationaryReason={formData.probationary_reason}
            onProbationaryReasonChange={(reason) => setFormData(prev => ({ ...prev, probationary_reason: reason }))}
            nextScheduledAudit={formData.next_scheduled_audit}
            auditInterval={formData.audit_interval}
            onNextScheduledAuditChange={(date) => setFormData(prev => ({ ...prev, next_scheduled_audit: date }))}
            onAuditIntervalChange={(interval) => setFormData(prev => ({ ...prev, audit_interval: interval as any }))}
            isEditMode={true}
            onEvaluationComplete={() => {
              toast.success('Evaluation updated successfully');
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}