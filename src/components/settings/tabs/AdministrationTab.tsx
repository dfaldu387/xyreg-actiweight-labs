import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Key, Archive, PlusCircle, Link2, Unlink, Users } from "lucide-react";
import { ADVISORY_AGENTS, type AdvisoryAgent } from "@/data/advisoryAgents";
import { AgentCard } from "@/components/advisory/AgentCard";
import { AgentChatDialog } from "@/components/advisory/AgentChatDialog";
import { toast } from "sonner";
import { ArchiveCompanyDialog } from "@/components/company/ArchiveCompanyDialog";
import { ArchiveProductDialog } from "@/components/product/ArchiveProductDialog";
import { ApiKeyManagement } from "@/components/settings/ApiKeyManagement";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PasswordPolicySettings } from "@/components/settings/PasswordPolicySettings";

interface AdministrationTabProps {
  companyId: string;
  companyName: string;
}

export function AdministrationTab({ companyId, companyName }: AdministrationTabProps) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [apiKeysOpen, setApiKeysOpen] = useState(false);
  const [eudamedOpen, setEudamedOpen] = useState(false);
  const [advisoryOpen, setAdvisoryOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AdvisoryAgent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { activeRole } = useCompanyRole();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['company-products-admin', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: eudamedProducts = [] } = useQuery({
    queryKey: ['eudamed-linked-products-v2', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, basic_udi_di, eudamed_device_name, eudamed_id_srn')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const handleDetachEudamed = async (productId: string, productName: string) => {
    const confirmed = await confirm({
      title: 'Detach from EUDAMED',
      description: `This will remove the EUDAMED link for "${productName}". All current field values will be preserved but become freely editable. The formal connection to the EUDAMED registry will be broken.`,
      confirmLabel: 'Detach',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const { error } = await supabase
      .from('products')
      .update({ basic_udi_di: null, eudamed_device_name: null, eudamed_id_srn: null })
      .eq('id', productId);

    if (error) {
      toast.error('Failed to detach product from EUDAMED');
      return;
    }

    toast.success(`"${productName}" has been detached from EUDAMED`);
    queryClient.invalidateQueries({ queryKey: ['eudamed-linked-products-v2', companyId] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
    queryClient.invalidateQueries({ queryKey: ['device-characteristics'] });
  };

  const handleBulkDetach = async () => {
    const linkedProducts = eudamedProducts.filter(
      (p) => !!p.basic_udi_di || !!p.eudamed_device_name || !!p.eudamed_id_srn
    );
    if (linkedProducts.length === 0) return;

    const confirmed = await confirm({
      title: 'Detach All from EUDAMED',
      description: `This will remove the EUDAMED link for ${linkedProducts.length} product(s). All current field values will be preserved but become freely editable.`,
      confirmLabel: `Detach All (${linkedProducts.length})`,
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const { error } = await supabase
      .from('products')
      .update({ basic_udi_di: null, eudamed_device_name: null, eudamed_id_srn: null })
      .in('id', linkedProducts.map((p) => p.id));

    if (error) {
      toast.error('Failed to detach products from EUDAMED');
      return;
    }

    toast.success(`${linkedProducts.length} product(s) detached from EUDAMED`);
    queryClient.invalidateQueries({ queryKey: ['eudamed-linked-products-v2', companyId] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
    queryClient.invalidateQueries({ queryKey: ['device-characteristics'] });
  };

  // Only show admin-only features if user has admin privileges
  const isAdmin = hasAdminPrivileges(activeRole);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium">{lang('settings.administration.accessRestricted')}</h3>
          <p className="text-muted-foreground">
            {lang('settings.administration.accessRestrictedDescription')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Technical Advisory Board */}
      <Collapsible open={advisoryOpen} onOpenChange={setAdvisoryOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#D4AF37]" />
                    Technical Advisory Board
                  </CardTitle>
                  <CardDescription>
                    Chat with domain-specialized AI consultants for regulatory, quality, and engineering guidance.
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${advisoryOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADVISORY_AGENTS.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setChatOpen(true);
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AgentChatDialog
        agent={selectedAgent}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />

      {/* Password Expiration Policy */}
      <PasswordPolicySettings companyId={companyId} />

      {/* API Key Management */}
      <Collapsible open={apiKeysOpen} onOpenChange={setApiKeysOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {lang('settings.administration.apiKeyManagement.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.administration.apiKeyManagement.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${apiKeysOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ApiKeyManagement companyId={companyId} companyName={companyName} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* EUDAMED Connections */}
      <Collapsible open={eudamedOpen} onOpenChange={setEudamedOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    EUDAMED Connections
                  </CardTitle>
                  <CardDescription>
                    Manage product links to the EUDAMED registry. Detaching preserves data but removes field locks.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {eudamedProducts.some((p) => !!p.basic_udi_di || !!p.eudamed_device_name || !!p.eudamed_id_srn) && (
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0" onClick={(e) => { e.stopPropagation(); handleBulkDetach(); }}>
                      Detach All
                    </Button>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${eudamedOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {eudamedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No products found for this company.</p>
              ) : (
                <div className="space-y-2">
                  {eudamedProducts.map((product) => {
                    const isLinked = !!product.basic_udi_di || !!product.eudamed_device_name || !!product.eudamed_id_srn;
                    const subtitle = product.basic_udi_di || product.eudamed_id_srn;
                    return (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          {isLinked && subtitle && (
                            <p className="text-xs text-muted-foreground font-mono truncate">{subtitle}</p>
                          )}
                        </div>
                        {isLinked ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => handleDetachEudamed(product.id, product.name)}
                            title="Linked – click to detach"
                          >
                            <Link2 className="h-4 w-4 text-primary" />
                          </Button>
                        ) : (
                          <span className="shrink-0 p-2" title="Not linked to EUDAMED">
                            <Unlink className="h-4 w-4 text-orange-500" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Archives */}
      <Collapsible open={dangerZoneOpen} onOpenChange={setDangerZoneOpen}>
        <Card className="border-destructive/20">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-destructive/5 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="h-5 w-5" />
                    {lang('settings.administration.archives.title')}
                  </CardTitle>
                  <CardDescription>
                    {lang('settings.administration.archives.description')}
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dangerZoneOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">{lang('settings.administration.archives.archiveCompanyTitle')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {lang('settings.administration.archives.warning')}
                  </p>
                  <ArchiveCompanyDialog companyId={companyId} companyName={companyName} />
                </div>
                <div className="p-4 border border-muted rounded-lg">
                  <h4 className="font-medium mb-2">{lang('settings.administration.archives.archiveDeviceTitle')}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {lang('settings.administration.archives.archiveDeviceWarning')}
                  </p>
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">{lang('settings.administration.archives.noActiveDevices')}</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{product.name}</span>
                          <ArchiveProductDialog
                            productId={product.id}
                            productName={product.name}
                            companyName={companyName}
                            onArchived={() => queryClient.invalidateQueries({ queryKey: ['company-products-admin', companyId] })}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => navigate('/app/archives')}>
                    <Archive className="h-4 w-4 mr-2" />
                    {lang('settings.administration.archives.viewArchives')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Add Company */}
      <Collapsible open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Add Company
                  </CardTitle>
                  <CardDescription>
                    Add a new company to your organization
                  </CardDescription>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${addCompanyOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="p-4 border border-muted rounded-lg space-y-4">
                <p className="text-sm text-muted-foreground">
                  Adding a new company will be available as part of an upgraded plan. This feature is coming soon.
                </p>
                <Button
                  onClick={() => toast.info('This feature is coming soon and will be tied to your subscription plan.')}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}