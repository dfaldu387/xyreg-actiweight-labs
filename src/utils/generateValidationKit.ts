import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} from 'docx';
import { saveAs } from 'file-saver';
import { XYREG_MODULE_GROUPS } from '@/data/xyregModuleGroups';
import { CORE_SERVICES } from '@/data/coreModuleDependencies';
import { TR80002_TOOLBOX_ITEMS } from '@/data/tr80002ToolboxItems';

const CONTENT_WIDTH = 9360; // US Letter minus 1" margins
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text: string, width: number): TableCell {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "1A365D", type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })],
  });
}

function bodyCell(text: string, width: number): TableCell {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })] })],
  });
}

export async function generateValidationKit(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const version = 'v2.4.1';

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: "1A365D" },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: "2D4A7A" },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: "3B5998" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
      }],
    },
    sections: [
      // Section 1: Cover Page
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "CSV-VP-001 — XYREG Vendor Validation Kit", font: "Arial", size: 16, color: "888888" })] })] }),
        },
        footers: {
          default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", font: "Arial", size: 16 }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16 })] })] }),
        },
        children: [
          new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "XYREG Helix OS", size: 48, bold: true, font: "Arial", color: "1A365D" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Vendor Validation Kit", size: 36, font: "Arial", color: "2D4A7A" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: `Document ID: CSV-VP-001  |  Version: ${version}  |  Date: ${today}`, size: 20, font: "Arial", color: "666666" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "Per AAMI TR80002-2:2024 — Medical Device Software Validation", size: 20, font: "Arial", color: "666666" })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "GAMP 5 Category 4 — Configured Software Product", size: 20, font: "Arial", color: "666666" })] }),
          new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: "Approval Block", size: 24, bold: true, font: "Arial" })] }),
          createApprovalTable(),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 2: Scope
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Scope & Regulatory Use Assessment")] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun("XYREG Helix OS is a cloud-hosted Quality Management System (QMS) platform for medical device companies. Per ISO 13485:2016 Clause 4.1.6, organizations using software that affects product quality must validate such software. This document provides the vendor-supplied validation package to support customer validation efforts.")] }),
          bullet("Software Classification: GAMP 5 Category 4 (Configured Product)"),
          bullet("Regulatory Scope: ISO 13485:2016, EU MDR 2017/745, 21 CFR 820 (QMSR)"),
          bullet("Hosting: Cloud-based SaaS with Supabase backend, Row-Level Security"),
          bullet("Validation Approach: Modular, risk-based per TR80002-2 critical thinking methodology"),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 3: Module Group Decomposition
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Module Group Decomposition")] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun("XYREG is decomposed into 10 independently validatable module groups. Each group has defined boundaries, intended use, and risk levels per TR80002-2 \u00A75.3.2.5.")] }),
          createModuleGroupTable(),
          new Paragraph({ children: [new PageBreak()] }),

          // Module group detail pages
          ...XYREG_MODULE_GROUPS.flatMap((g, i) => [
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`2.${i + 1} ${g.name}`)] }),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Intended Use")] }),
            new Paragraph({ spacing: { after: 80 }, children: [new TextRun(g.intendedUse)] }),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Boundary Notes")] }),
            new Paragraph({ spacing: { after: 80 }, children: [new TextRun(g.boundaryNotes)] }),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Features")] }),
            ...g.features.map(f => bullet(f)),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Governing SOPs")] }),
            new Paragraph({ spacing: { after: 80 }, children: [new TextRun(g.sopNumbers.join(', '))] }),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("ISO Clause References")] }),
            new Paragraph({ spacing: { after: 80 }, children: [new TextRun(g.isoClauseRefs.join(', '))] }),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Risk Assessment")] }),
            new Paragraph({ spacing: { after: 80 }, children: [new TextRun(`Process Risk: ${g.processRisk.toUpperCase()} | Software Risk: ${g.softwareRisk.toUpperCase()}`)] }),
            ...(i < XYREG_MODULE_GROUPS.length - 1 ? [new Paragraph({ children: [new PageBreak()] })] : []),
          ]),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 4: Core Engine Dependencies
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Core Engine Dependency Matrix")] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun("Shared platform services cascade validation impact to dependent module groups. When a core service is updated, all dependent module groups with 'inherited' propagation require re-validation review.")] }),
          createCoreServicesTable(),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 5: Vendor Assessment
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Vendor Assessment")] }),
          bullet("SDLC: Agile with continuous integration, TypeScript strict mode, automated testing"),
          bullet("Security: Row-Level Security (RLS) policies, role-based access control, encrypted at rest and in transit"),
          bullet("Change Control: Git-based version control with tagged releases and structured change impact analysis"),
          bullet("Hosting: Supabase cloud infrastructure with automated backups and disaster recovery"),
          bullet("Compliance: SOC 2 Type II aligned security practices"),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 6: Toolbox Selections
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Toolbox Selections (TR80002-2 Tables A.1\u2013A.5)")] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun("Selected tools and methods per risk level, as recommended by TR80002-2 Annex A.")] }),
          createToolboxTable(),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 7: Customer Action Checklist
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Customer Validation Action Checklist")] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun("For each module group, complete the following qualification steps. Document your rationale for each decision \u2014 TR80002-2 requires critical thinking, not just checkboxes.")] }),
          ...XYREG_MODULE_GROUPS.flatMap((g, i) => [
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`6.${i + 1} ${g.name} (${g.processRisk.toUpperCase()} risk)`)] }),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("IQ \u2014 Installation Qualification")] }),
            bullet("Verify XYREG is accessible with correct user roles and permissions"),
            bullet("Confirm configuration matches your organizational requirements"),
            bullet("Document rationale: Why is the installation acceptable for your site?"),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("OQ \u2014 Operational Qualification")] }),
            bullet("Review vendor-supplied OQ test evidence for this module group"),
            bullet("Assess whether test scenarios cover your specific use cases"),
            bullet("Document rationale: Do you accept the vendor\u2019s OQ evidence? Why or why not?"),
            ...(g.processRisk !== 'low' ? [
              new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("PQ \u2014 Performance Qualification")] }),
              bullet("Execute site-specific test scenarios with realistic data"),
              bullet("Verify outputs match your process requirements"),
              bullet("Document rationale: Why do these scenarios demonstrate fitness for your intended use?"),
            ] : []),
            new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Overall Determination")] }),
            bullet("Verdict: Validated / Validated with Conditions / Not Validated / Not Applicable"),
            bullet("Rationale: Summarize why this module group is or is not validated for use in your QMS"),
            ...(i < XYREG_MODULE_GROUPS.length - 1 ? [new Paragraph({ children: [new PageBreak()] })] : []),
          ]),
          new Paragraph({ children: [new PageBreak()] }),

          // Section 8: Maintenance & Periodic Review
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Maintenance & Periodic Review Plan")] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun("Per TR80002-2 \u00A75.4, validated systems require periodic review and structured change management.")] }),
          bullet("Annual Review: Conduct annual review of validation status for all module groups"),
          bullet("Update Workflow: On each XYREG release, review the change impact matrix. Only re-validate affected module groups."),
          bullet("Core Cascade: If a core engine service is updated, all dependent module groups require review (per the dependency matrix in Section 3)."),
          bullet("Retirement: Per \u00A75.5, document data export procedures and migration paths before system retirement."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `XYREG-Vendor-Validation-Kit-CSV-VP-001-${today}.docx`);
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}

function createApprovalTable(): Table {
  const colWidths = [2340, 2340, 2340, 2340];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: ["Role", "Name", "Signature", "Date"].map((t, i) => headerCell(t, colWidths[i])) }),
      ...["Issued By", "Reviewed By", "Approved By"].map(role =>
        new TableRow({ children: [bodyCell(role, colWidths[0]), bodyCell("", colWidths[1]), bodyCell("", colWidths[2]), bodyCell("", colWidths[3])] })
      ),
    ],
  });
}

function createModuleGroupTable(): Table {
  const colWidths = [2000, 1800, 1200, 1200, 1560, 1600];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: ["Module Group", "Features", "Proc. Risk", "SW Risk", "Core Deps", "SOPs"].map((t, i) => headerCell(t, colWidths[i])) }),
      ...XYREG_MODULE_GROUPS.map(g =>
        new TableRow({ children: [
          bodyCell(g.name, colWidths[0]),
          bodyCell(g.features.join(', '), colWidths[1]),
          bodyCell(g.processRisk.toUpperCase(), colWidths[2]),
          bodyCell(g.softwareRisk.toUpperCase(), colWidths[3]),
          bodyCell(g.coreDependencies.length.toString(), colWidths[4]),
          bodyCell(g.sopNumbers.join(', '), colWidths[5]),
        ] })
      ),
    ],
  });
}

function createCoreServicesTable(): Table {
  const colWidths = [2200, 3160, 1200, 2800];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: ["Core Service", "Description", "Criticality", "Dependent Module Groups"].map((t, i) => headerCell(t, colWidths[i])) }),
      ...CORE_SERVICES.map(svc => {
        const deps = XYREG_MODULE_GROUPS.filter(g => g.coreDependencies.includes(svc.id)).map(g => g.name);
        return new TableRow({ children: [
          bodyCell(svc.name, colWidths[0]),
          bodyCell(svc.description, colWidths[1]),
          bodyCell(svc.criticality.toUpperCase(), colWidths[2]),
          bodyCell(deps.join(', '), colWidths[3]),
        ] });
      }),
    ],
  });
}

function createToolboxTable(): Table {
  const colWidths = [1200, 1800, 2160, 1200, 3000];
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: ["Table", "Activity", "Tool/Method", "Risk Levels", "Rationale"].map((t, i) => headerCell(t, colWidths[i])) }),
      ...TR80002_TOOLBOX_ITEMS.map(item =>
        new TableRow({ children: [
          bodyCell(`A.${item.table.replace('A', '')} ${item.tableName}`, colWidths[0]),
          bodyCell(item.activity, colWidths[1]),
          bodyCell(item.tool, colWidths[2]),
          bodyCell(item.applicableRiskLevels.map(r => r.toUpperCase()).join(', '), colWidths[3]),
          bodyCell(item.rationale, colWidths[4]),
        ] })
      ),
    ],
  });
}
