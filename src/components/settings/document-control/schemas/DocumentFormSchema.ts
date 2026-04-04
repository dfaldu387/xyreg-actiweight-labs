
import * as z from "zod";
import { DocumentTechApplicability } from "@/types/documentTypes";

// Define allowed values for tech applicability to ensure type safety
const techApplicabilityValues: DocumentTechApplicability[] = [
  "All device types",
  "Software devices", 
  "Hardware devices",
  "Combination devices",
  "Implantable devices"
];

export const documentFormSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  type: z.enum(["Standard", "Regulatory", "Technical", "Clinical", "Quality", "Design", "SOP"]),
  phases: z.array(z.string()).min(0),
  techApplicability: z.enum(techApplicabilityValues as [DocumentTechApplicability, ...DocumentTechApplicability[]]),
  description: z.string().optional(),
  // Status and version are optional since they're not needed for document template definition
  status: z.enum(["Draft", "In Review", "Approved", "Obsolete"]).optional(),
  version: z.string().optional(),
  lastUpdated: z.string().optional()
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
