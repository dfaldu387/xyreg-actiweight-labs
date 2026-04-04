import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, FileText, Layers, GitCompare, Database, ArrowRightLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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

interface CompanyDocumentSyncPageProps {
  companyId: string;
  companyName: string;
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

export function CompanyDocumentSyncPage({ companyId, companyName }: CompanyDocumentSyncPageProps) {
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
  const [syncResults, setSyncResults] = useState<{ success: number; failed: number } | null>(null);

  const fetchSyncData = async () => {
    setIsLoading(true);

    try {
      // Get total count from documents table
      const { count: totalCount, error: totalError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document');

      if (totalError) {
        toast.error('Failed to fetch document count');
        return;
      }

      // Get documents without phase_id (phase_id IS NULL) - fetch id and name
      const { data: docsWithoutPhase, count: withoutPhaseCount, error: noPhaseError } = await supabase
        .from('documents')
        .select('id, name', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .is('phase_id', null)
        .order('name');

      if (noPhaseError) {
        toast.error('Failed to fetch document count');
        return;
      }

      // Get active phases from company_chosen_phases with phase names
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
        // Error fetching active phases
      }

      // Map phases data
      const mappedPhases: ActivePhase[] = (phasesData || []).map((phase: any) => ({
        id: phase.id,
        phase_id: phase.phase_id,
        position: phase.position,
        phase_name: phase.company_phases?.name || 'Unknown Phase'
      }));

      // Get documents from phase_assigned_document_template table
      const { data: templateDocs, error: templateError } = await supabase
        .from('phase_assigned_document_template')
        .select('id, name, phase_id')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .order('name');

      if (templateError) {
        // Error fetching phase_assigned_document_template
      }

      // Get all documents from documents table for name comparison
      const { data: allDocs, error: allDocsError } = await supabase
        .from('documents')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .order('name');

      if (allDocsError) {
        // Error fetching all documents
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
      toast.error('Failed to fetch document data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncData();
  }, [companyId]);

  const handleBack = () => {
    navigate(`/app/company/${encodeURIComponent(companyName)}/documents`);
  };

  // Open sync dialog and show missing documents (not already synced by name)
  const openSyncDialog = async () => {
    setIsSyncDialogOpen(true);
    setSyncResults(null);
    setSelectedDocIds(new Set());

    try {
      // Get all documents from documents table
      const { data: allDocs, error: allDocsError } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document')
        .order('name');

      if (allDocsError) {
        toast.error('Failed to fetch documents');
        return;
      }

      // Get all document names from phase_assigned_document_template
      const { data: templateDocs, error: templateError } = await supabase
        .from('phase_assigned_document_template')
        .select('name')
        .eq('company_id', companyId)
        .eq('document_scope', 'company_document');

      if (templateError) {
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

      // Select all missing by default
      setSelectedDocIds(new Set(missing.map(d => d.id)));
    } catch (error) {
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
            phase_id: phaseIdToUse,
            document_scope: 'company_document',
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
          failedCount++;
        } else {
          successCount++;
        }
      } catch {
        failedCount++;
      }
    }

    setIsSyncing(false);
    setSyncResults({ success: successCount, failed: failedCount });

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} document(s)`);
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
  };

  return (
    <div className="py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Document Sync Info
            </h1>
            <p className="text-muted-foreground mt-1">
              Document statistics for {companyName}
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
                company_document scope
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
                company_document scope
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

          {/* Already Synced Card */}
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
                  {activePhases.map((phase, index) => (
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

      {/* No Active Phases */}
      {!isLoading && activePhases.length === 0 && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50/50">
          <CardContent className="py-8 text-center">
            <div className="text-yellow-600">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No active phases found</p>
              <p className="text-sm text-yellow-500 mt-1">Configure phases in company settings</p>
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
              Documents from phase_assigned_document_template table (company_document scope)
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Document Name</div>
                      <div className="text-[10px] font-normal text-purple-600">phase_assigned_document_template.name</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Document ID</div>
                      <div className="text-[10px] font-normal text-purple-600">phase_assigned_document_template.id</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-purple-800">
                      <div>Phase ID</div>
                      <div className="text-[10px] font-normal text-purple-600">phase_assigned_document_template.phase_id</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {phaseTemplateDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-purple-50">
                      <td className="p-3">
                        <span className="font-medium text-gray-800">{doc.name}</span>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {doc.id}
                        </code>
                      </td>
                      <td className="p-3">
                        {doc.phase_id ? (
                          <code className="text-xs bg-purple-100 px-2 py-1 rounded font-mono text-purple-600">
                            {doc.phase_id}
                          </code>
                        ) : (
                          <span className="text-xs text-orange-600 font-medium">NULL</span>
                        )}
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
              <p className="text-sm text-purple-500 mt-1">company_document scope</p>
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
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-red-100">
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
                          {doc.documentsTableId}
                        </code>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-purple-100 px-2 py-1 rounded font-mono text-purple-600">
                          {doc.phaseTemplateId}
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

      {/* No Matching Documents */}
      {!isLoading && matchingDocuments.length === 0 && (
        <Card className="mt-6 border-green-200 bg-green-50/50">
          <CardContent className="py-8 text-center">
            <div className="text-green-600">
              <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No matching document names</p>
              <p className="text-sm text-green-500 mt-1">No duplicates found between tables</p>
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
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-orange-100">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-orange-800">
                      <div>Document Name</div>
                      <div className="text-[10px] font-normal text-orange-600">documents.name</div>
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-orange-800">
                      <div>Document ID</div>
                      <div className="text-[10px] font-normal text-orange-600">documents.id</div>
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

      {/* No Documents Without Phase */}
      {!isLoading && noPhaseDocuments.length === 0 && (
        <Card className="mt-6 border-green-200 bg-green-50/50">
          <CardContent className="py-8 text-center">
            <div className="text-green-600">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">All documents have a phase assigned</p>
              <p className="text-sm text-green-500 mt-1">No orphaned documents found</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schema Comparison Section */}
      {!isLoading && (
        <Card className="mt-6 border-cyan-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-cyan-800">
              <Database className="h-5 w-5" />
              Schema Comparison (for migration)
            </CardTitle>
            <p className="text-sm text-cyan-600">
              Column differences between documents and phase_assigned_document_template tables
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Missing Columns */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="text-left p-2 font-medium text-red-800">Column</th>
                    <th className="text-left p-2 font-medium text-red-800">Type in documents</th>
                    <th className="text-left p-2 font-medium text-red-800">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  <tr className="hover:bg-red-50/50">
                    <td className="p-2"><code className="text-xs bg-red-100 px-1 rounded">inserted_at</code></td>
                    <td className="p-2 text-gray-600">timestamp with time zone</td>
                    <td className="p-2 text-gray-500">Different from created_at</td>
                  </tr>
                  <tr className="hover:bg-red-50/50">
                    <td className="p-2"><code className="text-xs bg-red-100 px-1 rounded">milestone_due_date</code></td>
                    <td className="p-2 text-gray-600">date</td>
                    <td className="p-2 text-gray-500">Milestone specific</td>
                  </tr>
                  <tr className="hover:bg-red-50/50">
                    <td className="p-2"><code className="text-xs bg-red-100 px-1 rounded">platform_id</code></td>
                    <td className="p-2 text-gray-600">uuid</td>
                    <td className="p-2 text-gray-500">FK to company_platforms</td>
                  </tr>
                  <tr className="hover:bg-red-50/50">
                    <td className="p-2"><code className="text-xs bg-red-100 px-1 rounded">platform_reference_id</code></td>
                    <td className="p-2 text-gray-600">uuid</td>
                    <td className="p-2 text-gray-500">FK to documents (self-reference)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Migration SQL */}
            <div>
              <h3 className="font-medium text-cyan-700 mb-2">Migration SQL</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                <pre>{`-- Add missing columns to phase_assigned_document_template
ALTER TABLE phase_assigned_document_template
ADD COLUMN IF NOT EXISTS inserted_at timestamp with time zone default now(),
ADD COLUMN IF NOT EXISTS milestone_due_date date,
ADD COLUMN IF NOT EXISTS platform_id uuid,
ADD COLUMN IF NOT EXISTS platform_reference_id uuid;`}</pre>
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
              Sync Documents to phase_assigned_document_template
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

            {/* Missing Documents List */}
            {!isSyncing && !syncResults && missingDocuments.length === 0 && (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-60" />
                <p className="font-medium text-gray-800">All documents are in sync!</p>
                <p className="text-sm text-gray-500 mt-1">
                  No missing documents found in phase_assigned_document_template
                </p>
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
                            <code className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{doc.id}</code>
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
            <Button variant="outline" onClick={closeSyncDialog} disabled={isSyncing}>
              {syncResults ? 'Close' : 'Cancel'}
            </Button>
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
