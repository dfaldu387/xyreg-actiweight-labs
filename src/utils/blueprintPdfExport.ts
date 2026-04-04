import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CompanyVentureBlueprintData, PhaseData } from '@/types/blueprint';

interface ExportOptions {
  companyName: string;
  data: CompanyVentureBlueprintData;
  phases: PhaseData[];
}

export async function exportBlueprintToPDF({ companyName, data, phases }: ExportOptions): Promise<void> {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkAddPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Company Venture Blueprint', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyName, margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Calculate completion
    const totalActivities = phases.reduce((sum, phase) => sum + phase.activities.length, 0);
    const completedCount = data.completedActivities.length;
    const completionPercent = Math.round((completedCount / totalActivities) * 100);

    // Executive Summary
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Overall Progress: ${completionPercent}% (${completedCount} of ${totalActivities} activities completed)`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Last Updated: ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString() : 'N/A'}`, margin, yPosition);
    yPosition += 15;

    // Phases and Activities
    for (const phase of phases) {
      checkAddPage(20);

      // Phase header with background
      pdf.setFillColor(240, 240, 245);
      pdf.rect(margin, yPosition - 5, contentWidth, 12, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Phase ${phase.id}: ${phase.title}`, margin + 3, yPosition + 3);
      yPosition += 12;

      // Phase goal
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(60, 60, 60);
      const goalLines = pdf.splitTextToSize(`Goal: ${phase.goal}`, contentWidth - 6);
      goalLines.forEach((line: string) => {
        checkAddPage(6);
        pdf.text(line, margin + 3, yPosition);
        yPosition += 5;
      });
      yPosition += 5;

      // Activities
      for (const activity of phase.activities) {
        checkAddPage(15);

        const isCompleted = data.completedActivities.includes(activity.id);
        const note = data.activityNotes[activity.id];
        const file = data.activityFiles[activity.id];

        // Activity title with checkbox
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
        // Checkbox
        pdf.setDrawColor(150, 150, 150);
        pdf.rect(margin + 3, yPosition - 3, 4, 4, isCompleted ? 'F' : 'S');
        if (isCompleted) {
          pdf.setDrawColor(34, 197, 94);
          pdf.setLineWidth(0.5);
          pdf.line(margin + 4, yPosition - 1, margin + 5, yPosition);
          pdf.line(margin + 5, yPosition, margin + 7, yPosition - 2);
          pdf.setLineWidth(0.2);
        }
        
        pdf.text(activity.title, margin + 10, yPosition);
        yPosition += 6;

        // Questions
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(80, 80, 80);
        const questionLines = pdf.splitTextToSize(activity.questions, contentWidth - 15);
        questionLines.forEach((line: string) => {
          checkAddPage(5);
          pdf.text(line, margin + 10, yPosition);
          yPosition += 4;
        });
        yPosition += 2;

        // Notes
        if (note && note.trim()) {
          checkAddPage(10);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Notes:', margin + 10, yPosition);
          yPosition += 4;

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(40, 40, 40);
          const noteLines = pdf.splitTextToSize(note, contentWidth - 15);
          noteLines.forEach((line: string) => {
            checkAddPage(4);
            pdf.text(line, margin + 10, yPosition);
            yPosition += 4;
          });
          yPosition += 2;
        }

        // File attachment
        if (file) {
          checkAddPage(5);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 180);
          pdf.text(`📎 ${file.name}`, margin + 10, yPosition);
          yPosition += 5;
        }

        yPosition += 3;
      }

      yPosition += 5;
    }

    // Footer on each page
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      pdf.text(
        `${companyName} - Strategic Blueprint`,
        margin,
        pageHeight - 10
      );
    }

    // Save the PDF
    const fileName = `${companyName.replace(/\s+/g, '_')}_Strategic_Blueprint_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error exporting blueprint to PDF:', error);
    throw error;
  }
}
