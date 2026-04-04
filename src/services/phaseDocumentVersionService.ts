import { supabase } from '@/integrations/supabase/client';

export interface PhaseDocumentVersion {
  id: string;
  template_assignment_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  change_notes: string | null;
  is_current: boolean;
  created_at: string;
}

export class PhaseDocumentVersionService {
  /**
   * Get all versions for a phase document template
   */
  static async getVersions(templateAssignmentId: string): Promise<PhaseDocumentVersion[]> {
    const { data, error } = await supabase
      .from('phase_document_template_versions')
      .select('*')
      .eq('template_assignment_id', templateAssignmentId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return (data || []) as PhaseDocumentVersion[];
  }

  /**
   * Get the current version for a phase document template
   */
  static async getCurrentVersion(templateAssignmentId: string): Promise<PhaseDocumentVersion | null> {
    const { data, error } = await supabase
      .from('phase_document_template_versions')
      .select('*')
      .eq('template_assignment_id', templateAssignmentId)
      .eq('is_current', true)
      .maybeSingle();

    if (error) throw error;
    return data as PhaseDocumentVersion | null;
  }

  /**
   * Create a new version when uploading a phase document template
   */
  static async createNewVersion(
    templateAssignmentId: string,
    filePath: string,
    fileName: string,
    fileSize: number | null,
    changeNotes?: string
  ): Promise<PhaseDocumentVersion> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the latest version number
    const { data: versions } = await supabase
      .from('phase_document_template_versions')
      .select('version_number')
      .eq('template_assignment_id', templateAssignmentId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = versions && versions.length > 0 
      ? versions[0].version_number + 1 
      : 1;

    // Mark all existing versions as not current
    await supabase
      .from('phase_document_template_versions')
      .update({ is_current: false })
      .eq('template_assignment_id', templateAssignmentId);

    // Create new version
    const { data, error } = await supabase
      .from('phase_document_template_versions')
      .insert({
        template_assignment_id: templateAssignmentId,
        version_number: nextVersionNumber,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize,
        uploaded_by: user?.id,
        change_notes: changeNotes,
        is_current: true
      })
      .select()
      .single();

    if (error) throw error;

    // Update the template assignment's current_version_id
    await supabase
      .from('phase_assigned_document_template')
      .update({ 
        current_version_id: data.id,
        file_path: filePath,
        file_name: fileName,
        file_size: fileSize
      })
      .eq('id', templateAssignmentId);

    return data as PhaseDocumentVersion;
  }

  /**
   * Restore an older version as the current version
   */
  static async restoreVersion(versionId: string): Promise<PhaseDocumentVersion> {
    // Get the version details
    const { data: version, error: versionError } = await supabase
      .from('phase_document_template_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Mark all versions as not current
    await supabase
      .from('phase_document_template_versions')
      .update({ is_current: false })
      .eq('template_assignment_id', version.template_assignment_id);

    // Mark this version as current
    const { data, error } = await supabase
      .from('phase_document_template_versions')
      .update({ is_current: true })
      .eq('id', versionId)
      .select()
      .single();

    if (error) throw error;

    // Update the template assignment's current_version_id and file info
    await supabase
      .from('phase_assigned_document_template')
      .update({ 
        current_version_id: versionId,
        file_path: version.file_path,
        file_name: version.file_name,
        file_size: version.file_size
      })
      .eq('id', version.template_assignment_id);

    return data as PhaseDocumentVersion;
  }
}
