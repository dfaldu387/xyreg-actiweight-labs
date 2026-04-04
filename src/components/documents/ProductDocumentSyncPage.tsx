import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, Layers, GitCompare, Database, ArrowRightLeft, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductDocumentSyncPageProps {
  productId: string;
  productName: string;
  companyId: string;
}

interface NoPhaseDocument {
  id: string;
  name: string;
}

interface ActivePhase {
  id: string;
  phase_id: string;
  position: number;
  phase_name: string;
}

interface PhaseTemplateDocument {
  id: string;
  name: string;
  phase_id: string | null;
  document_type: string;
  status: string;
}

interface MatchingDocument {
  name: string;
  documentsTableId: string;
  phaseTemplateId: string;
}

interface MissingDocument {
  id: string;
  name: string;
  document_type: string;
  status: string;
  tech_applicability: string;
  description: string | null;
  phase_id: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
}

export function ProductDocumentSyncPage({ productId, productName, companyId }: ProductDocumentSyncPageProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [noPhaseCount, setNoPhaseCount] = useState<number | null>(null);
  const [noPhaseDocuments, setNoPhaseDocuments] = useState<NoPhaseDocument[]>([]);
  const [activePhases, setActivePhases] = useState<ActivePhase[]>([]);
  const [phaseTemplateDocuments, setPhaseTemplateDocuments] = useState<PhaseTemplateDocument[]>([]);
  const [matchingDocuments, setMatchingDocuments] = useState<MatchingDocument[]>([]);

  // Sync dialog state
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [missingDocuments, setMissingDocuments] = useState<MissingDocument[]>([]);
  const [alreadySyncedCount, setAlreadySyncedCount] = useState(0);
  const [totalDocumentsCount, setTotalDocumentsCount] = useState(0);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [syncResults, setSyncResults] = useState<{ success: number; failed: number; removed: number; sectionUpdated?: number } | null>(null);
  const [removeAfterSync, setRemoveAfterSync] = useState(false);
  const [alreadySyncedDocuments, setAlreadySyncedDocuments] = useState<MissingDocument[]>([]);
  const [selectedSyncedDocIds, setSelectedSyncedDocIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResults, setDeleteResults] = useState<{ deleted: number; failed: number } | null>(null);

  const fetchSyncData = async () => {
    setIsLoading(true);

    try {
      // Get total count from documents table for this product
      const { count: totalCount, error: totalError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('document_scope', 'product_document');

      if (totalError) {
        console.error('Error fetching document count:', totalError);
        toast.error('Failed to fetch document count');
        return;
      }

      // Get documents without phase_id (phase_id IS NULL)
      const { data: docsWithoutPhase, count: withoutPhaseCount, error: noPhaseError } = await supabase
        .from('documents')
        .select('id, name', { count: 'exact' })
        .eq('product_id', productId)
        .eq('document_scope', 'product_document')
        .is('phase_id', null)
        .order('name');

      if (noPhaseError) {
        console.error('Error fetching no-phase documents:', noPhaseError);
        toast.error('Failed to fetch document count');
        return;
      }

      // Get active phases from company_chosen_phases (using company_id)
      const { data: phasesData, error: phasesError } = await supabase
        .from('company_chosen_phases')
        .select(`
          id,
          phase_id,
          position,
          company_phases!inner(
            id,
            name
          )
        `)
        .eq('company_id', companyId)
        .order('position');

      if (phasesError) {
        console.error('Error fetching active phases:', phasesError);
      }

      // Map phases data
      const mappedPhases: ActivePhase[] = (phasesData || []).map((phase: any) => ({
        id: phase.id,
        phase_id: phase.phase_id,
        position: phase.position,
        phase_name: phase.company_phases?.name || 'Unknown Phase'
      }));

      // Get documents from phase_assigned_document_template table for this product
      const { data: templateDocs, error: templateError } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, phase_id, document_type, status')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document')
        .order('name');

      if (templateError) {
        console.error('Error fetching phase_assigned_document_template:', templateError);
      }

      // Get all documents from documents table for name comparison
      const { data: allDocs, error: allDocsError } = await supabase
        .from('documents')
        .select('id, name')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document')
        .order('name');

      if (allDocsError) {
        console.error('Error fetching all documents:', allDocsError);
      }

      // Find matching document names between both tables
      const templateDocsArray = templateDocs || [];
      const allDocsArray = allDocs || [];
      const templateNameMap = new Map(templateDocsArray.map(doc => [doc.name.toLowerCase(), doc]));

      const matches: MatchingDocument[] = [];
      allDocsArray.forEach(doc => {
        const templateDoc = templateNameMap.get(doc.name.toLowerCase());
        if (templateDoc) {
          matches.push({
            name: doc.name,
            documentsTableId: doc.id,
            phaseTemplateId: templateDoc.id
          });
        }
      });

      setDocumentCount(totalCount);
      setNoPhaseCount(withoutPhaseCount);
      setNoPhaseDocuments(docsWithoutPhase || []);
      setActivePhases(mappedPhases);
      setPhaseTemplateDocuments(templateDocsArray);
      setMatchingDocuments(matches);

    } catch (error) {
      console.error('Error fetching sync data:', error);
      toast.error('Failed to fetch document data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, [productId, companyId]);

  // Open sync dialog and show missing documents (not already synced by name)
  const openSyncDialog = async () => {
    setIsSyncDialogOpen(true);
    setSyncResults(null);
    setDeleteResults(null);
    setSelectedDocIds(new Set());
    setSelectedSyncedDocIds(new Set());

    try {
      // Get all documents from documents table for this product
      const { data: allDocs, error: allDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document')
        .order('name');

      if (allDocsError) {
        console.error('Error fetching documents:', allDocsError);
        toast.error('Failed to fetch documents');
        return;
      }

      // Get all document names from phase_assigned_document_template for this product
      const { data: templateDocs, error: templateError } = await supabase
        .from('phase_assigned_document_template')
        .select('name')
        .eq('product_id', productId)
        .eq('document_scope', 'product_document');

      if (templateError) {
        console.error('Error fetching template documents:', templateError);
        toast.error('Failed to fetch template documents');
        return;
      }

      // Find missing documents (in documents but not in phase_assigned_document_template by name)
      const templateNames = new Set((templateDocs || []).map(d => d.name.toLowerCase()));
      const missing = (allDocs || []).filter(doc => !templateNames.has(doc.name.toLowerCase()));
      const alreadySynced = (allDocs || []).filter(doc => templateNames.has(doc.name.toLowerCase()));

      // Set counts for overview
      setTotalDocumentsCount((allDocs || []).length);
      setAlreadySyncedCount(alreadySynced.length);

      // Show only missing documents
      setMissingDocuments(missing.map(doc => ({
        id: doc.id,
        name: doc.name,
        document_type: doc.document_type || 'Standard',
        status: doc.status || 'Not Started',
        tech_applicability: doc.tech_applicability || 'All device types',
        description: doc.description,
        phase_id: doc.phase_id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
      })));

      // Store already synced documents for deletion option
      setAlreadySyncedDocuments(alreadySynced.map(doc => ({
        id: doc.id,
        name: doc.name,
        document_type: doc.document_type || 'Standard',
        status: doc.status || 'Not Started',
        tech_applicability: doc.tech_applicability || 'All device types',
        description: doc.description,
        phase_id: doc.phase_id,
        file_name: doc.file_name,
        file_path: doc.file_path,
        file_size: doc.file_size,
      })));

      // Select all missing by default
      setSelectedDocIds(new Set(missing.map(d => d.id)));
    } catch (error) {
      console.error('Error finding documents:', error);
      toast.error('Failed to find documents');
    }
  };

  // Toggle selection for a document
  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedDocIds.size === missingDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(missingDocuments.map(d => d.id)));
    }
  };

  // Toggle selection for synced documents
  const toggleSyncedDocSelection = (docId: string) => {
    setSelectedSyncedDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  // Select/Deselect all synced documents
  const toggleSelectAllSynced = () => {
    if (selectedSyncedDocIds.size === alreadySyncedDocuments.length) {
      setSelectedSyncedDocIds(new Set());
    } else {
      setSelectedSyncedDocIds(new Set(alreadySyncedDocuments.map(d => d.id)));
    }
  };

  // Delete selected synced documents from documents table
  const handleDeleteSyncedDocuments = async () => {
    if (selectedSyncedDocIds.size === 0) {
      toast.error('Please select at least one document to delete');
      return;
    }

    setIsDeleting(true);
    let deletedCount = 0;
    let failedCount = 0;

    for (const docId of selectedSyncedDocIds) {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (deleteError) {
        console.error(`Error deleting document ${docId}:`, deleteError);
        failedCount++;
      } else {
        deletedCount++;
      }
    }

    setIsDeleting(false);
    setDeleteResults({ deleted: deletedCount, failed: failedCount });

    if (deletedCount > 0) {
      toast.success(`Deleted ${deletedCount} document(s) from documents table`);
      // Refresh data
      fetchSyncData();
      // Update the already synced list
      setAlreadySyncedDocuments(prev => prev.filter(d => !selectedSyncedDocIds.has(d.id)));
      setSelectedSyncedDocIds(new Set());
      setAlreadySyncedCount(prev => prev - deletedCount);
      setTotalDocumentsCount(prev => prev - deletedCount);
    }
    if (failedCount > 0) {
      toast.error(`Failed to delete ${failedCount} document(s)`);
    }
  };

  // Sync selected documents
  const handleSync = async () => {
    if (selectedDocIds.size === 0) {
      toast.error('Please select at least one document to sync');
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: selectedDocIds.size });
    let successCount = 0;
    let failedCount = 0;
    let removedCount = 0;
    const successfullySyncedIds: string[] = [];

    // Get the "No Phase" phase_id for this company (by name)
    let noPhaseId: string | null = null;
    const { data: noPhaseData, error: noPhaseError } = await supabase
      .from('company_chosen_phases')
      .select(`
        phase_id,
        company_phases!inner(name)
      `)
      .eq('company_id', companyId)
      .eq('company_phases.name', 'No Phase')
      .single();

    if (!noPhaseError && noPhaseData) {
      noPhaseId = noPhaseData.phase_id;
    } else {
      // console.warn('Could not find "No Phase" for company, will use null for documents without phase');
    }

    const docsToSync = missingDocuments.filter(d => selectedDocIds.has(d.id));

    for (let i = 0; i < docsToSync.length; i++) {
      const doc = docsToSync[i];
      setSyncProgress({ current: i + 1, total: docsToSync.length });

      try {
        // Fetch full document data from documents table
        const { data: fullDoc, error: fetchError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', doc.id)
          .single();

        if (fetchError) {
          console.error(`Error fetching document ${doc.name}:`, fetchError);
          failedCount++;
          continue;
        }

        // Use document's phase_id if exists, otherwise use "No Phase" phase_id
        const phaseIdToUse = fullDoc.phase_id || noPhaseId;

        // Insert into phase_assigned_document_template
        const { error: insertError } = await (supabase as any)
          .from('phase_assigned_document_template')
          .insert({
            name: fullDoc.name,
            document_type: fullDoc.document_type || 'Standard',
            company_id: companyId,
            product_id: productId,
            phase_id: phaseIdToUse,
            document_scope: 'product_document',
            status: fullDoc.status || 'Not Started',
            tech_applicability: fullDoc.tech_applicability || 'All device types',
            description: fullDoc.description,
            file_name: fullDoc.file_name,
            file_path: fullDoc.file_path,
            file_size: fullDoc.file_size,
            uploaded_at: fullDoc.uploaded_at,
            reviewer_group_ids: fullDoc.reviewers ? [fullDoc.reviewers] : null,
            sub_section: fullDoc.sub_section,
            section_ids: fullDoc.section_ids,
            document_reference: fullDoc.document_reference,
            version: fullDoc.version,
            date: fullDoc.date,
            due_date: fullDoc.due_date,
            is_current_effective_version: fullDoc.is_current_effective_version || false,
            brief_summary: fullDoc.brief_summary,
            author: fullDoc.author,
            authors_ids: fullDoc.authors_ids,
            need_template_update: fullDoc.need_template_update || false,
            is_record: fullDoc.is_record || false,
          });

        if (insertError) {
          console.error(`Error inserting document ${doc.name}:`, insertError);
          failedCount++;
        } else {
          successCount++;
          successfullySyncedIds.push(doc.id);
        }
      } catch (error) {
        console.error(`Error syncing document ${doc.name}:`, error);
        failedCount++;
      }
    }

    // Remove from documents table if option is enabled
    if (removeAfterSync && successfullySyncedIds.length > 0) {

      for (const docId of successfullySyncedIds) {
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', docId);

        if (deleteError) {
          console.error(`Error removing document ${docId}:`, deleteError);
        } else {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        toast.success(`Removed ${removedCount} document(s) from documents table`);
      }
    }

    // Sync section data: make product docs match company template sections
    //    - If company has section → copy to product doc
    //    - If company has NO section → clear section on product doc
    //    - If company has DIFFERENT section → update product doc
    let sectionUpdatedCount = 0;
    try {
      // Build a comprehensive phase ID → name map from ALL phase sources
      const phaseIdToName = new Map<string, string>();

      // 1. From company_chosen_phases → company_phases
      const { data: companyPhasesData } = await supabase
        .from('company_chosen_phases')
        .select('phase_id, company_phases!inner(id, name)')
        .eq('company_id', companyId);
      (companyPhasesData || []).forEach((cp: any) => {
        if (cp.company_phases?.id && cp.company_phases?.name) {
          phaseIdToName.set(cp.company_phases.id, cp.company_phases.name);
        }
      });

      // 2. From phases table (legacy phase IDs some docs may reference)
      const { data: phasesTableData } = await supabase
        .from('phases')
        .select('id, name')
        .eq('company_id', companyId);
      (phasesTableData || []).forEach(p => {
        phaseIdToName.set(p.id, p.name);
      });

      // 3. From lifecycle_phases for this product — adds BOTH lp.id and lp.phase_id
      //    Device docs created by the sync service use lp.phase_id as phase_id,
      //    but some older docs may have lp.id. Both must resolve to the phase name.
      const { data: lifecyclePhasesData } = await supabase
        .from('lifecycle_phases')
        .select('id, name, phase_id')
        .eq('product_id', productId);
      (lifecyclePhasesData || []).forEach(lp => {
        phaseIdToName.set(lp.id, lp.name);       // lifecycle_phases.id → name
        phaseIdToName.set(lp.phase_id, lp.name); // company_phases.id → name
      });

      const companyPhaseIds = Array.from(phaseIdToName.keys());

      if (companyPhaseIds.length > 0) {
        // Get ALL company template docs (including those with no section assigned)
        const { data: companyDocs } = await supabase
          .from('phase_assigned_document_template')
          .select('name, phase_id, sub_section, section_ids')
          .eq('document_scope', 'company_template')
          .is('product_id', null)
          .in('phase_id', companyPhaseIds);

        // Get ALL device-level docs regardless of document_scope —
        // docs may be in 'core', 'product_document', or other scopes
        const { data: deviceDocs } = await supabase
          .from('phase_assigned_document_template')
          .select('id, name, phase_id, sub_section, section_ids')
          .eq('product_id', productId);

        if (deviceDocs && deviceDocs.length > 0) {
          // Build lookup: "name_lower::phaseName" → device docs
          const deviceDocsByKey = new Map<string, any[]>();
          deviceDocs.forEach(d => {
            const pName = phaseIdToName.get(d.phase_id) || d.phase_id;
            const key = `${d.name.toLowerCase()}::${pName}`;
            if (!deviceDocsByKey.has(key)) deviceDocsByKey.set(key, []);
            deviceDocsByKey.get(key)!.push(d);
          });

          // Pass 1: sync sections from company template → device docs
          for (const companyDoc of (companyDocs || [])) {
            const phaseName = phaseIdToName.get(companyDoc.phase_id) || companyDoc.phase_id;
            const key = `${companyDoc.name.toLowerCase()}::${phaseName}`;
            const matchingDeviceDocs = deviceDocsByKey.get(key) || [];

            const companySubSection = companyDoc.sub_section || null;
            const companySectionIds = (companyDoc.section_ids && companyDoc.section_ids.length > 0) ? companyDoc.section_ids : null;

            for (const deviceDoc of matchingDeviceDocs) {
              const deviceSubSection = deviceDoc.sub_section || null;
              const deviceSectionIds = (deviceDoc.section_ids && deviceDoc.section_ids.length > 0) ? deviceDoc.section_ids : null;

              const subSectionChanged = companySubSection !== deviceSubSection;
              const sectionIdsChanged = JSON.stringify(companySectionIds) !== JSON.stringify(deviceSectionIds);

              if (subSectionChanged || sectionIdsChanged) {
                const { error: updateError } = await supabase
                  .from('phase_assigned_document_template')
                  .update({ sub_section: companySubSection, section_ids: companySectionIds })
                  .eq('id', deviceDoc.id);

                if (!updateError) sectionUpdatedCount++;
              }
            }
          }

          // Pass 2: phase-aware stale-section cleanup
          // Clears sections that are either deleted OR belong to a different phase.
          const { data: allSectionsData } = await supabase
            .from('compliance_document_sections')
            .select('id, phase_id')
            .eq('company_id', companyId);

          const sectionPhaseMap = new Map<string, string | null>();
          (allSectionsData || []).forEach((s: any) => {
            sectionPhaseMap.set(s.id, s.phase_id ?? null);
          });

          for (const deviceDoc of deviceDocs) {
            if (!deviceDoc.section_ids?.length) continue;
            const docPhaseName = phaseIdToName.get(deviceDoc.phase_id);
            // Resolve to the company_phases.id for this doc's phase
            const docPhaseId = docPhaseName
              ? (lifecyclePhasesData || []).find((lp: any) => lp.name === docPhaseName)?.phase_id ?? null
              : null;

            const hasStale = deviceDoc.section_ids.some((sid: string) => {
              if (!sectionPhaseMap.has(sid)) return true;        // deleted → stale
              const sectionPhase = sectionPhaseMap.get(sid);
              if (sectionPhase === null) return false;           // company-wide → valid
              return docPhaseId !== null && sectionPhase !== docPhaseId; // wrong phase
            });

            if (hasStale) {
              const { error: clearError } = await supabase
                .from('phase_assigned_document_template')
                .update({ sub_section: null, section_ids: null })
                .eq('id', deviceDoc.id);
              if (!clearError) sectionUpdatedCount++;
            }
          }
        }
      }
    } catch (sectionError) {
      console.error('Error updating sections on device docs:', sectionError);
    }

    setIsSyncing(false);
    setSyncResults({ success: successCount, failed: failedCount, removed: removedCount, sectionUpdated: sectionUpdatedCount });

    if (successCount > 0 || sectionUpdatedCount > 0) {
      const messages: string[] = [];
      if (successCount > 0) messages.push(`${successCount} document(s) synced`);
      if (sectionUpdatedCount > 0) messages.push(`${sectionUpdatedCount} section(s) updated`);
      toast.success(messages.join(', '));
      // Refresh data
      fetchSyncData();
    }
    if (failedCount > 0) {
      toast.error(`Failed to sync ${failedCount} document(s)`);
    }
  };

  // Close dialog and reset state
  const closeSyncDialog = () => {
    setIsSyncDialogOpen(false);
    setMissingDocuments([]);
    setSelectedDocIds(new Set());
    setSyncResults(null);
    setSyncProgress({ current: 0, total: 0 });
    setRemoveAfterSync(false);
    setAlreadySyncedDocuments([]);
    setSelectedSyncedDocIds(new Set());
    setDeleteResults(null);
  };

  return (
    <div className="py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Product Document Sync Info
            </h1>
            <p className="text-muted-foreground mt-1">
              Document statistics for <span className="font-medium">{productName}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className='bg-background' onClick={openSyncDialog} disabled={isLoading}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Sync Documents
            </Button>
            <Button variant="outline" className='bg-background' onClick={fetchSyncData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading document data...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          {/* Total Documents Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                documents table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{documentCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                product_document scope
              </p>
            </CardContent>
          </Card>

          {/* Phase Template Documents Card */}
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                phase_assigned_document_template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{phaseTemplateDocuments.length}</div>
              <p className="text-xs text-purple-600 mt-1">
                product_document scope
              </p>
            </CardContent>
          </Card>

          {/* Already Synced Card */}
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Already Synced
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{alreadySyncedCount}</div>
              <p className="text-xs text-green-600 mt-1">
                already synced by name
              </p>
            </CardContent>
          </Card>

          {/* Missing Documents Card */}
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                Missing Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{missingDocuments.length}</div>
              <p className="text-xs text-orange-600 mt-1">
                not synced by name
              </p>
            </CardContent>
          </Card>

          {/* Matching Names Card */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                Matching Names
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{matchingDocuments.length}</div>
              <p className="text-xs text-red-600 mt-1">
                same name in both tables
              </p>
            </CardContent>
          </Card>

          {/* Active Phases Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Active Phases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {activePhases.length}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                company_chosen_phases
              </p>
            </CardContent>
          </Card>

          {/* Documents With Phase Card */}
          <Card className="border-pink-200 bg-pink-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-pink-800">
                With Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">
                {(documentCount ?? 0) - (noPhaseCount ?? 0)}
              </div>
              <p className="text-xs text-pink-600 mt-1">
                phase_id IS NOT NULL
              </p>
            </CardContent>
          </Card>

          {/* Documents Without Phase Card */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">
                Without Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {noPhaseCount ?? 0}
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                phase_id IS NULL
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Phases List */}
      {!isLoading && activePhases.length > 0 && (
        <Card className="mt-6 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Layers className="h-5 w-5" />
              Active Phases ({activePhases.length})
            </CardTitle>
            <p className="text-sm text-blue-600">
              Phases from company_chosen_phases table
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-blue-800 w-16">
                      <div>#</div>
                      <div className="text-[10px] font-normal text-blue-600">position</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-blue-800">
                      <div>Phase Name</div>
                      <div className="text-[10px] font-normal text-blue-600">company_phases.name</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-blue-800">
                      <div>Phase ID</div>
                      <div className="text-[10px] font-normal text-blue-600">company_chosen_phases.phase_id</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-blue-800">
                      <div>Chosen Phase ID</div>
                      <div className="text-[10px] font-normal text-blue-600">company_chosen_phases.id</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {activePhases.map((phase) => (
                    <tr key={phase.id} className="hover:bg-blue-50">
                      <td className="p-3 text-gray-500 text-sm">
                        {phase.position + 1}
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-gray-800">{phase.phase_name}</span>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {phase.phase_id}
                        </code>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded font-mono text-blue-600">
                          {phase.id}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Assigned Document Template List */}
      {!isLoading && phaseTemplateDocuments.length > 0 && (
        <Card className="mt-6 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <FileText className="h-5 w-5" />
              phase_assigned_document_template ({phaseTemplateDocuments.length})
            </CardTitle>
            <p className="text-sm text-purple-600">
              Documents from phase_assigned_document_template table (product_document scope)
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-purple-100 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Document Name</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Type</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Status</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Phase ID</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Document ID</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {phaseTemplateDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-purple-50">
                      <td className="p-3">
                        <span className="font-medium text-gray-800">{doc.name}</span>
                      </td>
                      <td className="p-3 text-gray-600 text-sm">{doc.document_type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          doc.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          doc.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {doc.phase_id ? (
                          <code className="text-xs bg-purple-100 px-2 py-1 rounded font-mono text-purple-600">
                            {doc.phase_id.substring(0, 8)}...
                          </code>
                        ) : (
                          <span className="text-xs text-orange-600 font-medium">NULL</span>
                        )}
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {doc.id.substring(0, 8)}...
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Phase Template Documents */}
      {!isLoading && phaseTemplateDocuments.length === 0 && (
        <Card className="mt-6 border-purple-200 bg-purple-50/50">
          <CardContent className="py-8 text-center">
            <div className="text-purple-600">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No documents in phase_assigned_document_template</p>
              <p className="text-sm text-purple-500 mt-1">product_document scope for this product</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matching Documents List */}
      {!isLoading && matchingDocuments.length > 0 && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-800">
              <GitCompare className="h-5 w-5" />
              Matching Document Names ({matchingDocuments.length})
            </CardTitle>
            <p className="text-sm text-red-600">
              Documents with the same name in both tables
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-red-100 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-red-800">
                      <div>Document Name</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-red-800">
                      <div>documents.id</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-red-800">
                      <div>phase_assigned_document_template.id</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {matchingDocuments.map((doc, index) => (
                    <tr key={index} className="hover:bg-red-50">
                      <td className="p-3">
                        <span className="font-medium text-gray-800">{doc.name}</span>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {doc.documentsTableId.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-purple-100 px-2 py-1 rounded font-mono text-purple-600">
                          {doc.phaseTemplateId.substring(0, 8)}...
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Without Phase List */}
      {!isLoading && noPhaseDocuments.length > 0 && (
        <Card className="mt-6 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
              <FileText className="h-5 w-5" />
              Documents Without Phase ({noPhaseDocuments.length})
            </CardTitle>
            <p className="text-sm text-orange-600">
              These documents have phase_id = NULL in the documents table
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-orange-100 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-orange-800">
                      <div>Document Name</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-orange-800">
                      <div>Document ID</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {noPhaseDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-orange-50">
                      <td className="p-3">
                        <span className="font-medium text-gray-800">{doc.name}</span>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {doc.id}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schema Info Section */}
      {!isLoading && (
        <Card className="mt-6 border-cyan-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-cyan-800">
              <Database className="h-5 w-5" />
              Sync Info
            </CardTitle>
            <p className="text-sm text-cyan-600">
              Sync copies documents from "documents" table to "phase_assigned_document_template" table
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h3 className="font-medium text-cyan-800 mb-2">Fields copied during sync:</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {[
                  'name', 'document_type', 'status', 'tech_applicability', 'description',
                  'phase_id', 'file_name', 'file_path', 'file_size', 'uploaded_at',
                  'reviewer_group_ids', 'sub_section', 'section_ids', 'document_reference',
                  'version', 'date', 'due_date', 'is_current_effective_version',
                  'brief_summary', 'author', 'authors_ids', 'need_template_update', 'is_record'
                ].map((field) => (
                  <code key={field} className="bg-white px-2 py-1 rounded text-cyan-700 border border-cyan-100">
                    {field}
                  </code>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={(open) => !isSyncing && !open && closeSyncDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Sync Product Documents to phase_assigned_document_template
            </DialogTitle>
            <DialogDescription>
              Copy missing documents from <code className="bg-gray-100 px-1 rounded text-xs">documents</code> table to <code className="bg-gray-100 px-1 rounded text-xs">phase_assigned_document_template</code> table
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Overview Stats */}
            {!isSyncing && !syncResults && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-700">{totalDocumentsCount}</div>
                  <div className="text-xs text-gray-500">Total in documents</div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                  <div className="text-2xl font-bold text-green-600">{alreadySyncedCount}</div>
                  <div className="text-xs text-green-600">Already Synced</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                  <div className="text-2xl font-bold text-orange-600">{missingDocuments.length}</div>
                  <div className="text-xs text-orange-600">Missing (to sync)</div>
                </div>
              </div>
            )}

            {/* Sync Results */}
            {syncResults && (
              <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                syncResults.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
              }`}>
                {syncResults.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <div>
                  <p className="font-medium text-gray-800">Sync Complete</p>
                  <p className="text-sm text-gray-600">
                    {syncResults.success} document(s) synced successfully
                    {syncResults.failed > 0 && `, ${syncResults.failed} failed`}
                    {syncResults.removed > 0 && `, ${syncResults.removed} removed from documents table`}
                    {syncResults.sectionUpdated && syncResults.sectionUpdated > 0 && `, ${syncResults.sectionUpdated} section(s) updated`}
                  </p>
                </div>
              </div>
            )}

            {/* Syncing Progress */}
            {isSyncing && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Syncing Documents...</p>
                    <p className="text-sm text-gray-600">
                      {syncProgress.current} of {syncProgress.total} documents
                    </p>
                    <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Results */}
            {deleteResults && (
              <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                deleteResults.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
              }`}>
                {deleteResults.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                <div>
                  <p className="font-medium text-gray-800">Delete Complete</p>
                  <p className="text-sm text-gray-600">
                    {deleteResults.deleted} document(s) deleted from documents table
                    {deleteResults.failed > 0 && `, ${deleteResults.failed} failed`}
                  </p>
                </div>
              </div>
            )}

            {/* Already Synced Documents - can be deleted */}
            {!isSyncing && !isDeleting && !syncResults && missingDocuments.length === 0 && alreadySyncedDocuments.length > 0 && (
              <div>
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">All documents are in sync!</p>
                      <p className="text-sm text-green-600">
                        You can delete synced documents from the documents table below
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{alreadySyncedDocuments.length}</span> document(s) already synced (can be deleted from documents table)
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAllSynced}
                    className="text-xs"
                  >
                    {selectedSyncedDocIds.size === alreadySyncedDocuments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="w-10 p-2"></th>
                        <th className="text-left p-2 font-medium text-gray-700">Name</th>
                        <th className="text-left p-2 font-medium text-gray-700">Type</th>
                        <th className="text-left p-2 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {alreadySyncedDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleSyncedDocSelection(doc.id)}
                        >
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={selectedSyncedDocIds.has(doc.id)}
                              onCheckedChange={() => toggleSyncedDocSelection(doc.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-2">
                            <div className="font-medium text-gray-800">{doc.name}</div>
                            <code className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{doc.id.substring(0, 8)}...</code>
                          </td>
                          <td className="p-2 text-gray-600">{doc.document_type}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              doc.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              doc.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No documents at all */}
            {!isSyncing && !isDeleting && !syncResults && missingDocuments.length === 0 && alreadySyncedDocuments.length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-60" />
                <p className="font-medium text-gray-800">No documents found</p>
                <p className="text-sm text-gray-500 mt-1">
                  No documents in the documents table for this product
                </p>
              </div>
            )}

            {/* Deleting Progress */}
            {isDeleting && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Deleting Documents...</p>
                    <p className="text-sm text-gray-600">
                      Please wait while documents are being deleted
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isSyncing && !syncResults && missingDocuments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{missingDocuments.length}</span> document(s) missing from phase_assigned_document_template
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-xs"
                  >
                    {selectedDocIds.size === missingDocuments.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {/* Remove after sync option */}
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={removeAfterSync}
                      onCheckedChange={(checked) => setRemoveAfterSync(checked === true)}
                    />
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <div>
                      <span className="text-sm font-medium text-red-800">Remove from documents table after sync</span>
                      <p className="text-xs text-red-600">
                        Successfully synced documents will be deleted from the original documents table
                      </p>
                    </div>
                  </label>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-10 p-2"></th>
                        <th className="text-left p-2 font-medium text-gray-700">Name</th>
                        <th className="text-left p-2 font-medium text-gray-700">Type</th>
                        <th className="text-left p-2 font-medium text-gray-700">Status</th>
                        <th className="text-left p-2 font-medium text-gray-700">Phase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {missingDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleDocSelection(doc.id)}
                        >
                          <td className="p-2 text-center">
                            <Checkbox
                              checked={selectedDocIds.has(doc.id)}
                              onCheckedChange={() => toggleDocSelection(doc.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="p-2">
                            <div className="font-medium text-gray-800">{doc.name}</div>
                            <code className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{doc.id.substring(0, 8)}...</code>
                          </td>
                          <td className="p-2 text-gray-600">{doc.document_type}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              doc.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              doc.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-2">
                            {doc.phase_id ? (
                              <code className="text-xs bg-purple-100 px-1 rounded text-purple-600">
                                {doc.phase_id.substring(0, 8)}...
                              </code>
                            ) : (
                              <span className="text-xs text-orange-600">NULL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={closeSyncDialog} disabled={isSyncing || isDeleting}>
              {syncResults || deleteResults ? 'Close' : 'Cancel'}
            </Button>
            {/* Delete button for already synced documents */}
            {!syncResults && !deleteResults && missingDocuments.length === 0 && alreadySyncedDocuments.length > 0 && (
              <Button
                onClick={handleDeleteSyncedDocuments}
                disabled={isDeleting || selectedSyncedDocIds.size === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedSyncedDocIds.size} Document(s)
                  </>
                )}
              </Button>
            )}
            {/* Sync button for missing documents */}
            {!syncResults && missingDocuments.length > 0 && (
              <Button
                onClick={handleSync}
                disabled={isSyncing || selectedDocIds.size === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Sync {selectedDocIds.size} Document(s)
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
