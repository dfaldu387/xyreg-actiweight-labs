import React from 'react';
import { AlertCircle, Shield, Clock, CheckCircle, FileText, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function EudamedHelpContent() {
  return (
    <Tabs defaultValue="deadlines" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        <TabsTrigger value="registration">Registration</TabsTrigger>
        <TabsTrigger value="requirements">Requirements</TabsTrigger>
      </TabsList>
      
      <TabsContent value="deadlines" className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-base">What is EUDAMED?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EUDAMED (European Database on Medical Devices) is the EU&apos;s centralized IT system 
            for device registration, UDI-DI data, economic operator registration, Notified Body 
            certificate tracking, vigilance reporting, and clinical investigation tracking.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            EUDAMED Registration Deadlines
          </h3>
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs font-medium mb-2">Mandatory Registration (All Device Classes)</p>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li><strong>May 2021:</strong> Actor Registration module launched (voluntary)</li>
              <li><strong>Oct 2021:</strong> UDI/Device Registration module launched (voluntary)</li>
              <li><strong>Nov 27, 2025:</strong> EU declared first 4 modules &quot;Fully Functional&quot;</li>
              <li className="text-destructive font-medium">
                <strong>May 28, 2026:</strong> MANDATORY registration for ALL device classes (III, IIb, IIa, I)
              </li>
              <li><strong>Nov 27, 2026:</strong> Deadline for Legacy Devices (devices under old MDD certificates)</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Based on Regulation (EU) 2024/1860 and Commission Decision November 2025
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            MDR Certification Deadlines (Separate from EUDAMED)
          </h3>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">
              When your device must be <strong>fully MDR certified</strong>:
            </p>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li><strong>May 26, 2024:</strong> Required QMS + Notified Body application for extension</li>
              <li><strong>Dec 31, 2027:</strong> Class III & Class IIb Implantables must be MDR Certified</li>
              <li><strong>Dec 31, 2028:</strong> Class IIb, IIa, and Class I (sterile/measuring/reusable)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Quick Reference Table</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-2 font-medium">Device Class</th>
                  <th className="text-left py-2 pr-2 font-medium">EUDAMED</th>
                  <th className="text-left py-2 font-medium">MDR Cert</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Class III</td>
                  <td className="py-2 pr-2 text-destructive font-medium">May 2026</td>
                  <td className="py-2">Dec 2027</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Class IIb Implant</td>
                  <td className="py-2 pr-2 text-destructive font-medium">May 2026</td>
                  <td className="py-2">Dec 2027</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Class IIb / IIa</td>
                  <td className="py-2 pr-2 text-destructive font-medium">May 2026</td>
                  <td className="py-2">Dec 2028</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-2">Class I (special)</td>
                  <td className="py-2 pr-2 text-destructive font-medium">May 2026</td>
                  <td className="py-2">Dec 2028</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2">Legacy Devices</td>
                  <td className="py-2 pr-2">Nov 2026</td>
                  <td className="py-2">Per original</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="registration" className="space-y-6">
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            Immediate Actions for Genesis-Phase Companies
          </h4>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li><strong>1. Get your SRN immediately</strong> - Required before any Notified Body application</li>
            <li><strong>2. Assign Basic UDI-DI</strong> - Must be assigned before CE mark application</li>
            <li><strong>3. Prepare EUDAMED data</strong> - Have UDI data ready in Xyreg for submission</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Actor Registration (SRN) Requirements
          </h3>
          <p className="text-xs text-muted-foreground">
            To receive your Single Registration Number (SRN), you need:
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">EU Login</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Create an EU Login account - the authentication gateway for all EU systems.
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">PRRC</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Person Responsible for Regulatory Compliance with documented expertise (MDR Article 15).
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Legal Entity</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Company legal name, registered address, VAT number, and contact details.
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Auth Rep</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                If manufacturer is outside EU, an EU-based Authorised Representative is required.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic mt-2">
            ⏱️ Timeline: Actor registration typically takes 4-6 weeks including verification.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="requirements" className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Registration Steps
          </h3>
          <div className="space-y-2">
            {[
              "Create EU Login credentials and register your organization",
              "Complete Actor Registration form and receive your SRN (4-6 weeks)",
              "Assign Basic UDI-DIs in Xyreg for each device family",
              "Prepare UDI data using XML format or EUDAMED manual entry",
              "Submit Basic UDI-DI for each device family",
              "Register individual UDI-DIs with complete attributes",
              "Link devices to Notified Body certificates",
              "Verify data accuracy and publish to public database"
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <p className="text-xs text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-base">Data Requirements</h3>
          <p className="text-xs text-muted-foreground"><strong>Mandatory fields include:</strong></p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Device name and description</li>
            <li>Basic UDI-DI and UDI-DI codes</li>
            <li>Risk classification</li>
            <li>Intended purpose</li>
            <li>Manufacturer details (name, SRN, address)</li>
            <li>Authorised Representative info (if applicable)</li>
            <li>EMDN codes (device nomenclature)</li>
            <li>MRI compatibility, sterility, single-use status</li>
          </ul>
        </div>

        <div className="p-4 border-l-4 border-primary bg-muted/30 rounded-r-lg">
          <p className="text-sm">
            <strong>Act now, don&apos;t wait!</strong> Get your SRN immediately - it&apos;s required 
            before any Notified Body application. The May 2026 EUDAMED deadline applies to ALL 
            device classes simultaneously.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}