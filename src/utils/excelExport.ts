import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExcelData {
  headers: string[];
  rows: (string | number | boolean)[][];
  sheetName: string;
}

export class ExcelExportService {
  static async exportToExcel(data: ExcelData[], filename: string): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();

      data.forEach(sheet => {
        const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
      });

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      saveAs(blob, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data to Excel');
    }
  }

  static formatUserNeedsForExport(userNeeds: any[]): ExcelData {
    const headers = [
      'ID',
      'Description', 
      'Category',
      'Status',
      'Linked Requirements',
      'Created At',
      'Updated At'
    ];

    const rows = userNeeds.map(need => [
      need.user_need_id || '',
      need.description || '',
      need.category || '',
      need.status || '',
      need.linked_requirements || '',
      need.created_at ? new Date(need.created_at).toLocaleDateString() : '',
      need.updated_at ? new Date(need.updated_at).toLocaleDateString() : ''
    ]);

    return {
      headers,
      rows,
      sheetName: 'User Needs'
    };
  }

  static formatRequirementSpecsForExport(requirements: any[]): ExcelData {
    const headers = [
      'ID',
      'Description',
      'Type',
      'Category', 
      'Status',
      'Priority',
      'Traces To (User Needs)',
      'Linked Hazards',
      'Acceptance Criteria',
      'Verification Method',
      'Created At',
      'Updated At'
    ];

    const rows = requirements.map(req => [
      req.requirement_id || '',
      req.description || '',
      req.type || '',
      req.category || '',
      req.status || '',
      req.priority || '',
      req.traces_to || '',
      req.linked_risks || '',
      req.acceptance_criteria || '',
      req.verification_method || '',
      req.created_at ? new Date(req.created_at).toLocaleDateString() : '',
      req.updated_at ? new Date(req.updated_at).toLocaleDateString() : ''
    ]);

    return {
      headers,
      rows,
      sheetName: 'Requirement Specifications'
    };
  }

  static formatHazardsForExport(hazards: any[]): ExcelData {
    const headers = [
      'ID',
      'Description',
      'Category',
      'Hazardous Situation',
      'Potential Harm',
      'Foreseeable Sequence of Events',
      'Initial Severity',
      'Initial Probability', 
      'Initial Risk',
      'Risk Control Measure',
      'Risk Control Type',
      'Residual Severity',
      'Residual Probability',
      'Residual Risk',
      'Verification Implementation',
      'Verification Effectiveness',
      'Linked Requirements',
      'Created At',
      'Updated At'
    ];

    const rows = hazards.map(hazard => [
      hazard.hazard_id || '',
      hazard.description || '',
      hazard.category || '',
      hazard.hazardous_situation || '',
      hazard.potential_harm || '',
      hazard.foreseeable_sequence_events || '',
      hazard.initial_severity || '',
      hazard.initial_probability || '',
      hazard.initial_risk || '',
      hazard.risk_control_measure || '',
      hazard.risk_control_type || '',
      hazard.residual_severity || '',
      hazard.residual_probability || '',
      hazard.residual_risk || '',
      hazard.verification_implementation || '',
      hazard.verification_effectiveness || '',
      hazard.linked_requirements || '',
      hazard.created_at ? new Date(hazard.created_at).toLocaleDateString() : '',
      hazard.updated_at ? new Date(hazard.updated_at).toLocaleDateString() : ''
    ]);

    return {
      headers,
      rows,
      sheetName: 'Hazards & Risk Management'
    };
  }
}