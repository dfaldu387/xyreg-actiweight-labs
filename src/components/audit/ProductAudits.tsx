import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuditListItem } from "./AuditListItem";
import { AuditForm, AuditFormData } from "./AuditForm";
import { AvailableAuditTemplates } from "../audit-templates/AvailableAuditTemplates";
import { useProductAudits } from "@/hooks/useProductAudits";
import { useAuditTemplates } from "@/hooks/useAuditTemplates";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { supabase } from "@/integrations/supabase/client";
import { CalendarPlus, AlertCircle, Settings } from "lucide-react";
import { ProductAudit } from "@/types/audit";
import { useTranslation } from "@/hooks/useTranslation";
import { AuditorTypeFilter } from "./AuditorTypeFilter";
import { AuditorType, matchesAuditorTypeFilter } from "@/utils/auditTypeUtils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ProductAuditsProps {
  productId: string;
  companyId: string;
  disabled?: boolean;
}

export function ProductAudits({ productId, companyId, disabled = false }: ProductAuditsProps) {
  const navigate = useNavigate();
  const { activeCompanyRole } = useCompanyRole();
  const { audits, loading, addAudit, updateAudit, removeAudit } = useProductAudits(productId);
  const { configuredTemplates } = useAuditTemplates(companyId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<ProductAudit | null>(null);
  const [auditorTypeFilter, setAuditorTypeFilter] = useState<AuditorType>("all");
  const theme = useTheme();
  const { lang } = useTranslation();

  // Filter templates available for products
  const productTemplates = configuredTemplates.filter(template => 
    template.is_enabled && 
    template.audit_templates?.applicability?.includes("product")
  );

  const handleCreateAudit = async (formData: AuditFormData) => {
    try {
      await addAudit(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // console.error('Error creating audit:', error);
    }
  };

  const handleUpdateAudit = async (formData: AuditFormData) => {
    if (!editingAudit) return;
    try {
      await updateAudit(editingAudit.id, formData);
      setEditingAudit(null);
    } catch (error) {
      // console.error('Error updating audit:', error);
    }
  };

  const handleDeleteAudit = async (auditId: string) => {
    try {
      await removeAudit(auditId);
    } catch (error) {
      // console.error('Error deleting audit:', error);
    }
  };

  const handleCreateFromTemplate = async (formData: AuditFormData) => {
    await handleCreateAudit(formData);
  };

  const handleConfigureTemplates = async () => {
    // Get company name from active company role
    let companyName = activeCompanyRole?.companyName;
    
    // Fallback: fetch company name from companyId if not available
    if (!companyName && companyId) {
      try {
        const { data: company, error } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
        
        if (error) {
          // console.error('Error fetching company name:', error);
          return;
        }
        
        if (company?.name) {
          companyName = company.name;
        }
      } catch (error) {
        // console.error('Error fetching company name:', error);
        return;
      }
    }
    
    if (companyName) {
      // Navigate to company settings with audits tab
      const encodedCompanyName = encodeURIComponent(companyName);
      navigate(`/app/company/${encodedCompanyName}/settings?tab=audits`);
    } else {
      // console.error('Cannot navigate to audit templates: company name not available');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{lang('deviceAudits.component.title')}</h2>
          <p className="text-muted-foreground">{lang('deviceAudits.component.subtitle')}</p>
        </div>
        <div className="flex items-end gap-3">
          <AuditorTypeFilter
            value={auditorTypeFilter}
            onChange={setAuditorTypeFilter}
          />
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2" disabled={disabled}>
            <CalendarPlus className="h-4 w-4" />
            {lang('deviceAudits.component.scheduleAudit')}
          </Button>
        </div>
      </div>

      {/* Generate from Templates Section */}
      {audits.length === 0 && productTemplates.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lang('deviceAudits.component.noAuditsScheduledHint')}
          </AlertDescription>
        </Alert>
      )}

      {/* Available Templates */}
      {productTemplates.length > 0 && (
        <AvailableAuditTemplates
          companyId={companyId}
          scope="product"
          productId={productId}
          title={lang('deviceAudits.component.availableTemplates')}
          onCreateAuditInstance={handleCreateFromTemplate}
          disabled={disabled}
        />
      )}

      {/* Audits List */}
      {audits.length > 0 ? (
        <div className="space-y-2">
          {audits.filter(audit => matchesAuditorTypeFilter(audit.audit_type, auditorTypeFilter)).map((audit) => (
            <AuditListItem
              key={audit.id}
              audit={audit}
              onEdit={() => setEditingAudit(audit)}
              onDelete={() => handleDeleteAudit(audit.id)}
              disabled={disabled}
            />
          ))}
        </div>
      ) : productTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{lang('deviceAudits.component.noTemplatesConfigured')}</h3>
            <p className="text-muted-foreground mb-4">
              {lang('deviceAudits.component.configureTemplatesHint')}
            </p>
            <Button variant="outline" onClick={handleConfigureTemplates}>
              {lang('deviceAudits.component.configureTemplates')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Create/Edit Audit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || !!editingAudit}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingAudit(null);
        }}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 50, // Lower z-index to not interfere with shadcn/ui components
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[8],
            zIndex: 50, // Ensure paper also has controlled z-index
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'black',
            color: theme.palette.primary.contrastText,
            padding: theme.spacing(2, 3),
            margin: 0,
            borderRadius: '8px 8px 0 0'
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {editingAudit ? lang('deviceAudits.dialog.editTitle') : lang('deviceAudits.dialog.scheduleTitle')}
          </Typography>
          <IconButton
            onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingAudit(null);
            }}
            sx={{ 
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent 
          sx={{ 
            padding: theme.spacing(3),
            background: theme.palette.background.paper,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: theme.palette.grey[100],
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.grey[400],
              borderRadius: '4px',
              '&:hover': {
                background: theme.palette.grey[600],
              },
            },
          }}
        >
          <Box sx={{ mt: 1 }}>
            <AuditForm
              formType="product"
              onSubmit={editingAudit ? handleUpdateAudit : handleCreateAudit}
              initialData={editingAudit ? {
                auditName: editingAudit.audit_name,
                auditType: editingAudit.audit_type,
                lifecyclePhase: editingAudit.lifecycle_phase || '',
                deadlineDate: editingAudit.deadline_date ? new Date(editingAudit.deadline_date) : undefined,
                status: editingAudit.status,
                responsiblePersonId: editingAudit.responsible_person_id || '',
                notes: editingAudit.notes || ''
              } : undefined}
              isSubmitting={false}
              companyId={companyId}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
}