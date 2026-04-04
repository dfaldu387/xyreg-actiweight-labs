
import * as z from "zod";

export const documentFormSchema = z.object({
  name: z.string().min(2, { message: "Document name is required" }),
  type: z.enum(["Standard", "Regulatory", "Technical", "Clinical", "Quality", "Design", "SOP"]),
  description: z.string().optional(),
  status: z.enum(["Draft", "In Review", "Approved", "Obsolete"]).optional(),
  version: z.string().optional(),
  lastUpdated: z.string().optional(),
  phases: z.array(z.string()).optional(),
  techApplicability: z.enum(["All device types", "Software devices", "Hardware devices", "Combination devices", "Implantable devices"] as const).optional(),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;
