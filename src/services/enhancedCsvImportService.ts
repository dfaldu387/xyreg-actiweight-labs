import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ImportMode = 'skip' | 'update' | 'rename';

export interface CsvPhaseRow {
  categoryName: string;
  phaseName: string;
  phaseDescription: string;
  position: number;
  status: string;
  phaseType: string;
}

export interface ImportPreview {
  action: 'create' | 'update' | 'skip' | 'rename';
  phaseName: string;
  newName?: string;
  newPosition?: number;
  existingPhase?: any;
  reason?: string;
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  renamed: number;
  errors: string[];
  preview: ImportPreview[];
}

export class EnhancedCsvImportService {
  /**
   * Parse CSV content and validate structure
   */
  static parseCSV(csvContent: string): { isValid: boolean; data: CsvPhaseRow[]; errors: string[] } {
    const lines = csvContent.trim().split('\n');
    const errors: string[] = [];
    
    if (lines.length < 2) {
      errors.push('CSV must have header row and at least one data row');
      return { isValid: false, data: [], errors };
    }

    // Detect delimiter (prefer semicolon, fallback to comma)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    
    // Validate header - make Category Name optional but Phase Name required
    const expectedHeaders = ['Category Name', 'Phase Name', 'Phase Description', 'Position', 'Status', 'Phase Type'];
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
    
    const missingCriticalHeaders = ['Phase Name', 'Phase Description', 'Position'].filter(h => !headers.includes(h));
    if (missingCriticalHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingCriticalHeaders.join(', ')}`);
    }
    
    // Check if we have the basic structure even if not all headers match exactly
    if (headers.length < 4) {
      errors.push('CSV must have at least 4 columns: Category Name (optional), Phase Name, Phase Description, Position');
      return { isValid: false, data: [], errors };
    }

    // Parse data rows
    const data: CsvPhaseRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const line = lines[i].trim();
      
      if (!line) continue; // Skip empty lines
      
      const cells = line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''));
      
      if (cells.length < 4) {
        errors.push(`Row ${rowNumber}: Must have at least 4 columns (found ${cells.length})`);
        continue;
      }

      // Extract values with better error handling
      const categoryName = cells[0] || ''; // Category can be empty
      const phaseName = cells[1] || '';
      const phaseDescription = cells[2] || '';
      const positionStr = cells[3] || '';
      const status = cells[4] || 'Active';
      const phaseType = cells[5] || 'Standard';

      // Validate required Phase Name
      if (!phaseName.trim()) {
        errors.push(`Row ${rowNumber}: Phase Name is required and cannot be empty`);
        continue;
      }

      // Validate Position
      const position = parseInt(positionStr);
      if (isNaN(position) || position < 0) {
        errors.push(`Row ${rowNumber}: Position must be a valid positive number (found: "${positionStr}")`);
        continue;
      }

      // Validate Phase Description
      if (!phaseDescription.trim()) {
        errors.push(`Row ${rowNumber}: Phase Description is required and cannot be empty`);
        continue;
      }

      data.push({
        categoryName: categoryName.trim(), // Can be empty string
        phaseName: phaseName.trim(),
        phaseDescription: phaseDescription.trim(),
        position,
        status: status.trim() || 'Active',
        phaseType: phaseType.trim() || 'Standard'
      });
    }

    return { isValid: errors.length === 0, data, errors };
  }

  /**
   * Generate import preview showing what will happen
   */
  static async generatePreview(
    companyId: string, 
    phases: CsvPhaseRow[], 
    mode: ImportMode
  ): Promise<ImportPreview[]> {
    // Get existing phases
    const { data: existingPhases } = await supabase
      .from('company_phases')
      .select('*')
      .eq('company_id', companyId);

    const existingByName = new Map(existingPhases?.map(p => [p.name, p]) || []);
    const existingPositions = new Set(existingPhases?.map(p => p.position) || []);
    const maxPosition = Math.max(...Array.from(existingPositions), -1);

    const preview: ImportPreview[] = [];
    let nextAvailablePosition = maxPosition + 1;

    for (const phase of phases) {
      const existing = existingByName.get(phase.phaseName);
      
      if (existing) {
        // Phase name already exists
        switch (mode) {
          case 'skip':
            preview.push({
              action: 'skip',
              phaseName: phase.phaseName,
              existingPhase: existing,
              reason: 'Phase name already exists'
            });
            break;
            
          case 'update':
            preview.push({
              action: 'update',
              phaseName: phase.phaseName,
              existingPhase: existing,
              reason: 'Will update existing phase'
            });
            break;
            
          case 'rename':
            const newName = `${phase.phaseName} (Imported)`;
            const newPosition = existingPositions.has(phase.position) ? nextAvailablePosition++ : phase.position;
            preview.push({
              action: 'rename',
              phaseName: phase.phaseName,
              newName,
              newPosition,
              reason: 'Renamed to avoid conflict'
            });
            break;
        }
      } else {
        // New phase
        const newPosition = existingPositions.has(phase.position) ? nextAvailablePosition++ : phase.position;
        preview.push({
          action: 'create',
          phaseName: phase.phaseName,
          newPosition,
          reason: newPosition !== phase.position ? 'Position adjusted to avoid conflict' : 'New phase'
        });
        existingPositions.add(newPosition);
      }
    }

    return preview;
  }

  /**
   * Execute the import with the specified mode
   */
  static async executeImport(
    companyId: string,
    phases: CsvPhaseRow[],
    mode: ImportMode,
    preview: ImportPreview[]
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      created: 0,
      updated: 0,
      skipped: 0,
      renamed: 0,
      errors: [],
      preview
    };

    try {
      // Group phases by category and handle category creation
      const categoryMap = new Map<string, string>(); // categoryName -> categoryId

      // Get or create categories for phases that have category names
      const uniqueCategories = [...new Set(phases
        .map(p => p.categoryName)
        .filter(name => name && name.trim())
      )];

      for (const categoryName of uniqueCategories) {
        if (!categoryName.trim()) continue;

        const { data: existingCategory } = await supabase
          .from('phase_categories')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', categoryName)
          .maybeSingle();

        if (existingCategory) {
          categoryMap.set(categoryName, existingCategory.id);
        } else {
          const { data: newCategory, error: categoryError } = await supabase
            .from('phase_categories')
            .insert({
              company_id: companyId,
              name: categoryName
            })
            .select('id')
            .single();

          if (categoryError) {
            result.errors.push(`Failed to create category "${categoryName}": ${categoryError.message}`);
            continue;
          }
          categoryMap.set(categoryName, newCategory.id);
        }
      }

      // Execute each action from preview
      for (let i = 0; i < preview.length; i++) {
        const action = preview[i];
        const phase = phases[i];

        try {
          // Get category ID if category name is provided
          const categoryId = phase.categoryName && phase.categoryName.trim() 
            ? categoryMap.get(phase.categoryName) 
            : null;

          switch (action.action) {
            case 'skip':
              result.skipped++;
              break;

            case 'update':
              await supabase
                .from('company_phases')
                .update({
                  description: phase.phaseDescription,
                  category_id: categoryId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', action.existingPhase.id);
              result.updated++;
              break;

            case 'create':
              await supabase
                .from('company_phases')
                .insert({
                  company_id: companyId,
                  name: phase.phaseName,
                  description: phase.phaseDescription,
                  position: action.newPosition || phase.position,
                  category_id: categoryId,
                  is_active: phase.status === 'Active',
                  duration_days: 30
                });
              result.created++;
              break;

            case 'rename':
              await supabase
                .from('company_phases')
                .insert({
                  company_id: companyId,
                  name: action.newName!,
                  description: phase.phaseDescription,
                  position: action.newPosition || phase.position,
                  category_id: categoryId,
                  is_active: phase.status === 'Active',
                  duration_days: 30
                });
              result.renamed++;
              break;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to process ${phase.phaseName}: ${errorMsg}`);
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Import failed: ${errorMsg}`);
      return result;
    }
  }
}
