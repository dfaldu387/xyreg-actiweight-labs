import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeviceAccessSelector } from '@/components/permissions/DeviceAccessSelector';
import { DocumentPermissionSelector } from '@/components/permissions/DocumentPermissionSelector';
import { UserProductMatrixService } from '@/services/userProductMatrixService';
import { toast } from 'sonner';
import { ShieldCheck, ChevronDown, ChevronRight, Search, Loader2, Building2, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Company {
  id: string;
  name: string;
}

interface CompanyUser {
  user_id: string;
  access_level: string;
  is_internal: boolean;
  user_profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

export default function SuperAdminAccessManagement() {
  const { user: currentUser } = useAuth();

  // Company state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companySearch, setCompanySearch] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // User state
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Editing state
  const [editingDeviceIds, setEditingDeviceIds] = useState<string[]>([]);
  const [editingDocumentIds, setEditingDocumentIds] = useState<string[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Original values for cancel
  const [originalDeviceIds, setOriginalDeviceIds] = useState<string[]>([]);
  const [originalDocumentIds, setOriginalDocumentIds] = useState<string[]>([]);

  // Guard: prevent DocumentPermissionSelector stale cleanup from wiping loaded doc IDs
  const docIdsLoadedRef = useRef(false);

  const handleDocumentIdsChange = useCallback((ids: string[]) => {
    // Ignore the stale cleanup clear (onChange([])) that fires before documents load
    if (ids.length === 0 && docIdsLoadedRef.current && editingDocumentIds.length > 0) {
      // Only allow clearing if documents have actually been fetched
      // The DocumentPermissionSelector calls onChange([]) during its stale cleanup
      // before its own document fetch completes — skip that
      return;
    }
    setEditingDocumentIds(ids);
  }, [editingDocumentIds.length]);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) {
        toast.error('Failed to load companies');
        console.error(error);
      } else {
        setCompanies(data || []);
      }
      setLoadingCompanies(false);
    };
    fetchCompanies();
  }, []);

  // Fetch users when company selected
  useEffect(() => {
    if (!selectedCompanyId) {
      setUsers([]);
      setExpandedUserId(null);
      return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      setExpandedUserId(null);

      const { data, error } = await supabase
        .from('user_company_access')
        .select('user_id, access_level, is_internal, user_profiles(first_name, last_name, email)')
        .eq('company_id', selectedCompanyId);

      if (error) {
        toast.error('Failed to load users');
        console.error(error);
      } else {
        setUsers((data as unknown as CompanyUser[]) || []);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, [selectedCompanyId]);

  // Fetch access data when user expanded
  const loadUserAccess = useCallback(async (userId: string) => {
    if (!selectedCompanyId) return;
    setLoadingAccess(true);
    docIdsLoadedRef.current = false;

    const [deviceResult, docResult] = await Promise.all([
      supabase
        .from('user_product_matrix')
        .select('product_ids')
        .eq('user_id', userId)
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('user_document_permissions')
        .select('document_ids')
        .eq('user_id', userId)
        .eq('company_id', selectedCompanyId)
        .maybeSingle(),
    ]);

    if (deviceResult.error) {
      console.error('Device access error:', deviceResult.error);
    }
    if (docResult.error) {
      console.error('Document access error:', docResult.error);
    }

    const deviceIds = deviceResult.data?.product_ids || [];
    const docIds = docResult.data?.document_ids || [];

    setEditingDeviceIds(deviceIds);
    setEditingDocumentIds(docIds);
    setOriginalDeviceIds(deviceIds);
    setOriginalDocumentIds(docIds);
    docIdsLoadedRef.current = true;
    setLoadingAccess(false);
  }, [selectedCompanyId]);

  const handleExpandUser = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    loadUserAccess(userId);
  };

  const handleCancel = () => {
    setEditingDeviceIds([...originalDeviceIds]);
    setEditingDocumentIds([...originalDocumentIds]);
  };

  const handleSave = async () => {
    if (!expandedUserId || !selectedCompanyId) return;
    setSaving(true);

    try {
      // Save device access — check if row exists, then insert or update
      // (partial unique constraint prevents ON CONFLICT from working)
      const { data: existingMatrix } = await supabase
        .from('user_product_matrix')
        .select('id')
        .eq('user_id', expandedUserId)
        .eq('company_id', selectedCompanyId)
        .eq('is_active', true)
        .maybeSingle();

      if (existingMatrix) {
        const { error: matrixError } = await supabase
          .from('user_product_matrix')
          .update({
            product_ids: editingDeviceIds,
            assigned_by: currentUser?.id || null,
            assigned_at: new Date().toISOString(),
          })
          .eq('id', existingMatrix.id);
        if (matrixError) throw matrixError;
      } else {
        const { error: matrixError } = await supabase
          .from('user_product_matrix')
          .insert({
            user_id: expandedUserId,
            company_id: selectedCompanyId,
            product_ids: editingDeviceIds,
            assigned_by: currentUser?.id || null,
            assigned_at: new Date().toISOString(),
          });
        if (matrixError) throw matrixError;
      }

      // Save document access — check if row exists first, then insert or update
      const { data: existing } = await supabase
        .from('user_document_permissions')
        .select('id')
        .eq('user_id', expandedUserId)
        .eq('company_id', selectedCompanyId)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('user_document_permissions')
          .update({ document_ids: editingDocumentIds })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_document_permissions')
          .insert({
            user_id: expandedUserId,
            company_id: selectedCompanyId,
            document_ids: editingDocumentIds,
          });
        if (insertError) throw insertError;
      }

      setOriginalDeviceIds([...editingDeviceIds]);
      setOriginalDocumentIds([...editingDocumentIds]);
      toast.success('Access permissions saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const getUserDisplayName = (user: CompanyUser) => {
    const profile = user.user_profiles;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return profile?.email || 'Unknown User';
  };

  const hasChanges =
    JSON.stringify([...editingDeviceIds].sort()) !== JSON.stringify([...originalDeviceIds].sort()) ||
    JSON.stringify([...editingDocumentIds].sort()) !== JSON.stringify([...originalDocumentIds].sort());

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Access Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage device and document access for company users
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 min-h-[600px]">
        {/* Left panel: Companies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Companies
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loadingCompanies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No companies found
                </p>
              ) : (
                <div className="px-2 pb-2">
                  {filteredCompanies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => setSelectedCompanyId(company.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm ${
                        selectedCompanyId === company.id
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right panel: Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              {selectedCompany
                ? `Users of "${selectedCompany.name}"`
                : 'Select a company'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCompanyId ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Select a company from the left panel to view its users
              </p>
            ) : loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No users found for this company
              </p>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {users.map((user) => {
                    const isExpanded = expandedUserId === user.user_id;
                    return (
                      <div
                        key={user.user_id}
                        className="border rounded-lg overflow-hidden"
                      >
                        {/* User row */}
                        <button
                          onClick={() => handleExpandUser(user.user_id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="text-left">
                              <div className="font-medium text-sm">
                                {getUserDisplayName(user)}
                              </div>
                              {user.user_profiles?.email && (
                                <div className="text-xs text-muted-foreground">
                                  {user.user_profiles.email}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.is_internal && (
                              <Badge variant="outline" className="text-xs">
                                Internal
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {user.access_level}
                            </Badge>
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t px-4 py-4 bg-muted/20 space-y-4">
                            {loadingAccess ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <>
                                <div>
                                  <DeviceAccessSelector
                                    companyId={selectedCompanyId}
                                    selectedProductIds={editingDeviceIds}
                                    onChange={setEditingDeviceIds}
                                  />
                                </div>

                                <div>
                                  <DocumentPermissionSelector
                                    companyId={selectedCompanyId}
                                    selectedProductIds={editingDeviceIds}
                                    selectedDocumentIds={editingDocumentIds}
                                    onChange={handleDocumentIdsChange}
                                  />
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    size="sm"
                                  >
                                    {saving && (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={saving || !hasChanges}
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
