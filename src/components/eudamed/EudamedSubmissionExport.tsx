import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileSpreadsheet, Code } from 'lucide-react';

interface EudamedSubmissionExportProps {
  productData: any;
  deviceData: any;
}

interface WizardStep {
  step: number;
  title: string;
  fields: { label: string; value: string }[];
}

function resolveValue(...sources: any[]): string {
  for (const s of sources) {
    if (s !== null && s !== undefined && String(s).trim() !== '') return String(s);
  }
  return '';
}

function boolStr(val: any): string {
  if (val === true) return 'true';
  if (val === false) return 'false';
  return '';
}

function buildWizardSteps(p: any, d: any): WizardStep[] {
  const emdnCodes = (() => {
    if (p?.eudamed_nomenclature_codes) {
      if (Array.isArray(p.eudamed_nomenclature_codes)) return p.eudamed_nomenclature_codes.join('; ');
      return String(p.eudamed_nomenclature_codes);
    }
    if (d?.nomenclature_codes) {
      if (Array.isArray(d.nomenclature_codes)) return d.nomenclature_codes.join('; ');
      return String(d.nomenclature_codes);
    }
    return p?.emdn_code || '';
  })();

  return [
    {
      step: 1,
      title: 'Basic UDI-DI',
      fields: [
        { label: 'Basic UDI-DI Code', value: resolveValue(p?.basic_udi_di, p?.eudamed_basic_udi_di_code) },
        { label: 'Device Name', value: resolveValue(p?.eudamed_device_name, d?.device_name, p?.name) },
        { label: 'Brand/Trade Name', value: resolveValue(p?.eudamed_trade_names, d?.trade_names, p?.trade_name) },
        { label: 'EMDN Code', value: emdnCodes },
        { label: 'Risk Class', value: resolveValue(p?.eudamed_risk_class, p?.class) },
        { label: 'Intended Purpose', value: resolveValue(p?.intended_use) },
        { label: 'Applicable Legislation', value: resolveValue(p?.eudamed_applicable_legislation, d?.applicable_legislation) },
      ],
    },
    {
      step: 2,
      title: 'UDI-DI',
      fields: [
        { label: 'UDI-DI Code', value: resolveValue(p?.udi_di) },
        { label: 'Issuing Agency', value: resolveValue(p?.eudamed_issuing_agency, d?.issuing_agency) },
        { label: 'Direct Marking', value: boolStr(p?.eudamed_direct_marking ?? d?.direct_marking) },
        { label: 'Quantity of Device', value: resolveValue(p?.eudamed_quantity_of_device, d?.quantity_of_device) },
        { label: 'Package Type', value: '' },
      ],
    },
    {
      step: 3,
      title: 'Device Characteristics',
      fields: [
        { label: 'Implantable', value: boolStr(p?.eudamed_implantable ?? d?.implantable) },
        { label: 'Sterile', value: boolStr(p?.eudamed_sterile ?? d?.sterile) },
        { label: 'Active', value: boolStr(p?.eudamed_active ?? d?.active) },
        { label: 'Measuring', value: boolStr(p?.eudamed_measuring ?? d?.measuring) },
        { label: 'Single Use', value: boolStr(p?.eudamed_single_use ?? d?.single_use) },
        { label: 'Reusable', value: boolStr(p?.eudamed_reusable ?? d?.reusable) },
        { label: 'Max Reuses', value: resolveValue(p?.eudamed_max_reuses, d?.max_reuses) },
        { label: 'Contains Latex', value: boolStr(p?.eudamed_contain_latex ?? d?.contain_latex) },
        { label: 'Reprocessed', value: boolStr(p?.eudamed_reprocessed ?? d?.reprocessed) },
        { label: 'Sterilization Need', value: boolStr(p?.eudamed_sterilization_need ?? d?.sterilization_need) },
      ],
    },
    {
      step: 4,
      title: 'Market Information',
      fields: [
        { label: 'Placed on Market', value: resolveValue(p?.eudamed_placed_on_the_market, d?.placed_on_the_market) },
        { label: 'Market Distribution', value: resolveValue(p?.eudamed_market_distribution) },
        { label: 'Manufacturer SRN', value: resolveValue(p?.eudamed_id_srn, d?.manufacturer_id_srn) },
      ],
    },
    {
      step: 5,
      title: 'Certificates',
      fields: [
        { label: 'CE Certificate Number', value: resolveValue(p?.ec_certificate) },
        { label: 'Notified Body', value: resolveValue(p?.notified_body) },
        { label: 'Conformity Assessment Route', value: resolveValue(p?.conformity_assessment_route) },
      ],
    },
  ];
}

function generateCSV(steps: WizardStep[]): string {
  const lines = ['EUDAMED Step,Field Name,Value'];
  steps.forEach(step => {
    step.fields.forEach(f => {
      const escaped = f.value.replace(/"/g, '""');
      lines.push(`"Step ${step.step} - ${step.title}","${f.label}","${escaped}"`);
    });
  });
  return lines.join('\n');
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateXML(steps: WizardStep[], p: any): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<DTX_UDI_001 xmlns="urn:eudamed:udi:v1">');
  lines.push(`  <basicUdiDi>`);
  lines.push(`    <basicUdiDiCode>${escapeXml(resolveValue(p?.basic_udi_di, p?.eudamed_basic_udi_di_code))}</basicUdiDiCode>`);
  lines.push(`    <deviceName>${escapeXml(resolveValue(p?.eudamed_device_name, p?.name))}</deviceName>`);
  lines.push(`    <riskClass>${escapeXml(resolveValue(p?.eudamed_risk_class, p?.class))}</riskClass>`);
  lines.push(`    <applicableLegislation>${escapeXml(resolveValue(p?.eudamed_applicable_legislation))}</applicableLegislation>`);
  lines.push(`  </basicUdiDi>`);
  lines.push(`  <udiDi>`);
  lines.push(`    <udiDiCode>${escapeXml(resolveValue(p?.udi_di))}</udiDiCode>`);
  lines.push(`    <issuingAgency>${escapeXml(resolveValue(p?.eudamed_issuing_agency))}</issuingAgency>`);
  lines.push(`  </udiDi>`);
  lines.push(`  <deviceCharacteristics>`);
  const boolField = (name: string, val: any) => {
    if (val === true || val === false) lines.push(`    <${name}>${val}</${name}>`);
  };
  boolField('implantable', p?.eudamed_implantable);
  boolField('sterile', p?.eudamed_sterile);
  boolField('active', p?.eudamed_active);
  boolField('measuring', p?.eudamed_measuring);
  boolField('singleUse', p?.eudamed_single_use);
  boolField('reusable', p?.eudamed_reusable);
  boolField('containsLatex', p?.eudamed_contain_latex);
  lines.push(`  </deviceCharacteristics>`);
  lines.push(`  <marketInfo>`);
  lines.push(`    <manufacturerSRN>${escapeXml(resolveValue(p?.eudamed_id_srn))}</manufacturerSRN>`);
  lines.push(`  </marketInfo>`);
  lines.push('</DTX_UDI_001>');
  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function EudamedSubmissionExport({ productData, deviceData }: EudamedSubmissionExportProps) {
  const [open, setOpen] = useState(false);
  const steps = buildWizardSteps(productData, deviceData);
  const deviceName = resolveValue(productData?.eudamed_device_name, productData?.name, 'device');
  const safeName = deviceName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);

  const handleCSV = () => {
    downloadFile(generateCSV(steps), `EUDAMED_${safeName}.csv`, 'text/csv;charset=utf-8');
    setOpen(false);
  };

  const handleXML = () => {
    downloadFile(generateXML(steps, productData), `EUDAMED_${safeName}.xml`, 'application/xml;charset=utf-8');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export for EUDAMED
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export for EUDAMED Submission</DialogTitle>
          <DialogDescription>
            Download your device data in a format ready for EUDAMED registration or update.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={handleCSV}>
            <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium">Structured Summary (CSV)</div>
              <div className="text-xs text-muted-foreground">Human-readable, organized by EUDAMED's 5-step wizard</div>
            </div>
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3" onClick={handleXML}>
            <Code className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="text-left">
              <div className="font-medium">XML (DTX_UDI_001)</div>
              <div className="text-xs text-muted-foreground">Machine-readable format following EUDAMED XSD schema</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
