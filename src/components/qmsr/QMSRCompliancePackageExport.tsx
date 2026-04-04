import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Shield, Building2, CheckCircle, Clock, AlertTriangle, Package } from "lucide-react";
import { useProcessValidationRationales, useSupplierCriticalityRationales } from "@/hooks/useRationales";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { useTranslation } from '@/hooks/useTranslation';

interface QMSRCompliancePackageExportProps {
  companyId: string;
  productId?: string;
  supplierId?: string;
}

export function QMSRCompliancePackageExport({ 
  companyId, 
  productId, 
  supplierId 
}: QMSRCompliancePackageExportProps) {
  const { lang } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [includeValidation, setIncludeValidation] = useState(true);
  const [includeSupplier, setIncludeSupplier] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch rationales
  const { data: validationRationales = [], isLoading: loadingValidation } = useProcessValidationRationales(companyId, productId);
  const { data: supplierRationales = [], isLoading: loadingSupplier } = useSupplierCriticalityRationales(companyId, supplierId);

  const isLoading = loadingValidation || loadingSupplier;

  // Filter by status if needed
  const filteredValidation = statusFilter === "all" 
    ? validationRationales 
    : validationRationales.filter(r => r.status === statusFilter);
  
  const filteredSupplier = statusFilter === "all" 
    ? supplierRationales 
    : supplierRationales.filter(r => r.status === statusFilter);

  // Stats
  const totalRationales = (includeValidation ? filteredValidation.length : 0) + (includeSupplier ? filteredSupplier.length : 0);
  const approvedCount = [
    ...(includeValidation ? filteredValidation : []),
    ...(includeSupplier ? filteredSupplier : [])
  ].filter(r => r.status === 'Approved').length;
  const pendingCount = [
    ...(includeValidation ? filteredValidation : []),
    ...(includeSupplier ? filteredSupplier : [])
  ].filter(r => r.status === 'Pending Approval').length;
  const draftCount = [
    ...(includeValidation ? filteredValidation : []),
    ...(includeSupplier ? filteredSupplier : [])
  ].filter(r => r.status === 'Draft').length;

  const handleExportPDF = async () => {
    if (totalRationales === 0) {
      toast.error(lang('deviceProcessEngine.noRationalesToExport'));
      return;
    }

    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("QMSR Compliance Package", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Risk-Based Rationale Documentation", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Summary section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Rationales: ${totalRationales}`, 20, yPos);
      yPos += 6;
      doc.text(`Approved: ${approvedCount} | Pending: ${pendingCount} | Draft: ${draftCount}`, 20, yPos);
      yPos += 15;

      // Process Validation Rationales
      if (includeValidation && filteredValidation.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Process Validation Rationales (RBR-ENG)", 20, yPos);
        yPos += 10;

        for (const rationale of filteredValidation) {
          // Check if we need a new page
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${rationale.document_id} - ${rationale.activity_description.substring(0, 50)}...`, 20, yPos);
          yPos += 6;

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`Hazard: ${rationale.hazard_identified}`, 25, yPos);
          yPos += 5;
          doc.text(`Severity: ${rationale.severity_of_harm} | Probability: ${rationale.probability_of_occurrence}`, 25, yPos);
          yPos += 5;
          doc.text(`Validation Rigor: ${rationale.validation_rigor} | Confidence: ${rationale.confidence_interval}`, 25, yPos);
          yPos += 5;
          doc.text(`QMSR Clause: ${rationale.qmsr_clause_reference} | Status: ${rationale.status}`, 25, yPos);
          yPos += 5;

          // Rationale text (truncated)
          const rationaleText = rationale.rationale_text.substring(0, 200) + (rationale.rationale_text.length > 200 ? "..." : "");
          const splitText = doc.splitTextToSize(`Rationale: ${rationaleText}`, pageWidth - 45);
          doc.text(splitText, 25, yPos);
          yPos += splitText.length * 4 + 5;

          doc.text(`Determination: ${rationale.determination}`, 25, yPos);
          yPos += 10;
        }
      }

      // Supplier Criticality Rationales
      if (includeSupplier && filteredSupplier.length > 0) {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Supplier Criticality Rationales (RBR-SUP)", 20, yPos);
        yPos += 10;

        for (const rationale of filteredSupplier) {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(`${rationale.document_id} - ${rationale.supplier_name}`, 20, yPos);
          yPos += 6;

          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`Component Role: ${rationale.component_role}`, 25, yPos);
          yPos += 5;
          doc.text(`Safety Impact: ${rationale.safety_impact} | Criticality: ${rationale.criticality_class}`, 25, yPos);
          yPos += 5;
          doc.text(`Oversight Level: ${rationale.oversight_level} | Status: ${rationale.status}`, 25, yPos);
          yPos += 5;
          doc.text(`QMSR Reference: ${rationale.qmsr_clause_reference}`, 25, yPos);
          yPos += 5;

          const rationaleText = rationale.rationale_text.substring(0, 200) + (rationale.rationale_text.length > 200 ? "..." : "");
          const splitText = doc.splitTextToSize(`Rationale: ${rationaleText}`, pageWidth - 45);
          doc.text(splitText, 25, yPos);
          yPos += splitText.length * 4 + 5;

          doc.text(`Decision: ${rationale.decision}`, 25, yPos);
          yPos += 10;
        }
      }

      // Footer with regulatory reference
      doc.addPage();
      yPos = 20;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Regulatory References", 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const references = [
        "This document package supports compliance with:",
        "",
        "• FDA Quality Management System Regulation (QMSR) - 21 CFR Part 820",
        "  Effective: February 2, 2026",
        "",
        "• ISO 13485:2016 - Medical devices — Quality management systems",
        "  Section 7.1: Planning of product realization",
        "  Section 7.4.1: Purchasing process",
        "",
        "• Risk-based thinking is required for all validation and supplier oversight decisions.",
        "",
        "• These rationales document the proportionate application of quality controls",
        "  based on the identified risks to patient safety."
      ];
      
      for (const line of references) {
        doc.text(line, 20, yPos);
        yPos += 5;
      }

      // Save
      const fileName = `QMSR_Compliance_Package_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      
      toast.success(`Exported ${totalRationales} rationales to ${fileName}`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export compliance package");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {lang('deviceProcessEngine.exportTitle')}
        </CardTitle>
        <CardDescription>
          {lang('deviceProcessEngine.exportDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">{totalRationales}</div>
            <div className="text-sm text-muted-foreground">{lang('deviceProcessEngine.totalRationales')}</div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">{approvedCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" /> {lang('deviceProcessEngine.approved')}
            </div>
          </div>
          <div className="p-4 bg-secondary rounded-lg text-center">
            <div className="text-2xl font-bold text-secondary-foreground">{pendingCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> {lang('deviceProcessEngine.pending')}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold text-muted-foreground">{draftCount}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <FileText className="h-3 w-3" /> {lang('deviceProcessEngine.draft')}
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <Label className="text-base">{lang('deviceProcessEngine.includeInExport')}</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="include-validation" 
                checked={includeValidation} 
                onCheckedChange={(checked) => setIncludeValidation(checked as boolean)}
              />
              <Label htmlFor="include-validation" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4 text-primary" />
                {lang('deviceProcessEngine.processValidationRationales')} - {filteredValidation.length} {lang('deviceProcessEngine.records')}
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox 
                id="include-supplier" 
                checked={includeSupplier} 
                onCheckedChange={(checked) => setIncludeSupplier(checked as boolean)}
              />
              <Label htmlFor="include-supplier" className="flex items-center gap-2 cursor-pointer">
                <Building2 className="h-4 w-4 text-primary" />
                {lang('deviceProcessEngine.supplierCriticalityRationales')} - {filteredSupplier.length} {lang('deviceProcessEngine.records')}
              </Label>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>{lang('deviceProcessEngine.filterByStatus')}</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang('deviceProcessEngine.allStatuses')}</SelectItem>
              <SelectItem value="Approved">{lang('deviceProcessEngine.approvedOnly')}</SelectItem>
              <SelectItem value="Pending Approval">{lang('deviceProcessEngine.pendingApproval')}</SelectItem>
              <SelectItem value="Draft">{lang('deviceProcessEngine.draft')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warning for non-approved */}
        {statusFilter === "all" && draftCount > 0 && (
          <div className="p-3 bg-secondary border border-border rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>{lang('deviceProcessEngine.note')}</strong> {lang('deviceProcessEngine.draftWarning').replace('{count}', String(draftCount))}
            </p>
          </div>
        )}

        {/* Export Button */}
        <Button 
          onClick={handleExportPDF} 
          disabled={isExporting || isLoading || totalRationales === 0}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? lang('deviceProcessEngine.generatingPdf') : `${lang('deviceProcessEngine.exportCompliancePackage')} (${totalRationales} ${lang('deviceProcessEngine.rationales')})`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {lang('deviceProcessEngine.exportFooter')}
        </p>
      </CardContent>
    </Card>
  );
}
