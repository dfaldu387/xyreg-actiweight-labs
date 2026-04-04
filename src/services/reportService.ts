import { supabase } from '@/integrations/supabase/client';

export interface AIReport {
  id: string;
  company_id: string;
  title: string;
  content: string;
  report_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export class ReportService {
  static async saveReport(
    companyId: string,
    title: string,
    content: string,
    reportType: string = 'competitive_analysis',
    metadata: any = {}
  ): Promise<AIReport> {
    const { data, error } = await (supabase as any)
      .from('ai_reports')
      .insert({
        company_id: companyId,
        title,
        content,
        report_type: reportType,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving report:', error);
      throw new Error('Failed to save report');
    }

    return data as AIReport;
  }

  static async getReports(companyId: string): Promise<AIReport[]> {
    const { data, error } = await (supabase as any)
      .from('ai_reports')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }

    return (data || []) as AIReport[];
  }

  static async deleteReport(reportId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('ai_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      throw new Error('Failed to delete report');
    }
  }

  static async exportReport(
    content: string,
    title: string,
    format: 'pdf' | 'docx' | 'html'
  ): Promise<void> {
    if (format === 'html') {
      // Export as HTML file
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1, h2, h3 { color: #333; }
            .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .swot-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .strengths { border-left: 4px solid #10b981; }
            .weaknesses { border-left: 4px solid #ef4444; }
            .opportunities { border-left: 4px solid #3b82f6; }
            .threats { border-left: 4px solid #f97316; }
            ul { margin: 10px 0; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p><em>Generated on ${new Date().toLocaleDateString()}</em></p>
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${content}</pre>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // For PDF export, we would need a library like jsPDF or react-pdf
      // For now, just download as text
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'docx') {
      // For Word export, we would need a library like docx
      // For now, just download as text
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

export const reportService = new ReportService();