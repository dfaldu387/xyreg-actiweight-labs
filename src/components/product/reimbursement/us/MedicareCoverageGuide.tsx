import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, Building2, MapPin } from 'lucide-react';

export function MedicareCoverageGuide() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Understanding Medicare Coverage Determinations</CardTitle>
          <CardDescription>
            How Medicare decides whether to cover medical devices and procedures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Medicare coverage for medical devices and procedures is determined through a structured process. 
            Understanding these pathways is essential for device manufacturers seeking reimbursement.
          </p>
          <div className="bg-background rounded-lg p-4 border">
            <h4 className="font-semibold text-sm mb-2">Core Coverage Principle: "Reasonable and Necessary"</h4>
            <p className="text-xs text-muted-foreground">
              Under §1862(a)(1)(A) of the Social Security Act, Medicare covers items and services that are 
              "reasonable and necessary for the diagnosis or treatment of illness or injury." This standard 
              applies to all coverage determinations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Pathways */}
      <div className="space-y-4">
        {/* NCDs */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-1" />
              <div>
                <CardTitle className="text-lg">National Coverage Determinations (NCDs)</CardTitle>
                <Badge variant="default" className="mt-2">Nationwide Authority</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Binding coverage policies made by CMS (Centers for Medicare & Medicaid Services) that apply 
              uniformly across all 50 states and all Medicare contractors.
            </CardDescription>

            <div>
              <h4 className="text-sm font-semibold mb-2">When NCDs Are Issued</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>High-cost or controversial technologies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Technologies requiring specific evidence standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Devices/procedures with significant geographic variation in use</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Technologies requested for national determination by stakeholders</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">NCD Process</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <span className="font-medium">Request/Initiation:</span>
                    <span className="text-muted-foreground ml-1">Manufacturer, provider, or CMS initiates</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <span className="font-medium">Evidence Review:</span>
                    <span className="text-muted-foreground ml-1">CMS reviews clinical evidence, may request MEDCAC input</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <span className="font-medium">Proposed Decision:</span>
                    <span className="text-muted-foreground ml-1">Public comment period (30 days)</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <span className="font-medium">Final Decision:</span>
                    <span className="text-muted-foreground ml-1">Typically 6-9 months total timeline</span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://www.cms.gov/medicare-coverage-database/search/advanced-search.aspx?NCDId=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Search NCDs on CMS Medicare Coverage Database
            </a>
          </CardContent>
        </Card>

        {/* LCDs */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-1" />
              <div>
                <CardTitle className="text-lg">Local Coverage Determinations (LCDs)</CardTitle>
                <Badge variant="secondary" className="mt-2">Regional/Contractor-Specific</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Coverage policies made by Medicare Administrative Contractors (MACs) that apply only within 
              their specific geographic jurisdiction.
            </CardDescription>

            <div>
              <h4 className="text-sm font-semibold mb-2">When LCDs Are Used</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>No NCD exists for the item/service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Regional practice variation or specific clinical concerns</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Clarification needed on existing coverage policies</span>
                </li>
              </ul>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <h4 className="font-semibold text-sm mb-2">Important: Check Your MAC</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Medicare is administered by regional contractors (MACs). LCDs vary by MAC jurisdiction, 
                so you must check coverage in each relevant region.
              </p>
              <div className="space-y-2 text-xs">
                <div><span className="font-medium">Jurisdiction A:</span> NGS</div>
                <div><span className="font-medium">Jurisdiction B:</span> NGS</div>
                <div><span className="font-medium">Jurisdiction C:</span> NGS</div>
                <div><span className="font-medium">Jurisdiction D:</span> Noridian</div>
                <div><span className="font-medium">Jurisdiction E:</span> Palmetto GBA</div>
                <div><span className="font-medium">Jurisdiction F:</span> Noridian</div>
                <div className="text-muted-foreground italic mt-2">
                  Coverage for the same device may differ across MACs
                </div>
              </div>
            </div>

            <a
              href="https://www.cms.gov/medicare-coverage-database/search/advanced-search.aspx?LCDId=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Search LCDs on CMS Medicare Coverage Database
            </a>
          </CardContent>
        </Card>

        {/* MACs */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary mt-1" />
              <div>
                <CardTitle className="text-lg">Medicare Administrative Contractors (MACs)</CardTitle>
                <Badge variant="outline" className="mt-2">Regional Administrators</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Private companies contracted by CMS to administer Medicare benefits in specific regions, 
              including processing claims and issuing LCDs.
            </CardDescription>

            <div>
              <h4 className="text-sm font-semibold mb-2">MAC Responsibilities</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Process Medicare claims for their jurisdiction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Issue Local Coverage Determinations (LCDs)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Provide coverage guidance to providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Conduct provider education</span>
                </li>
              </ul>
            </div>

            <div className="bg-background rounded-lg p-4 border">
              <h4 className="font-semibold text-sm mb-2">Strategy for Device Manufacturers</h4>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 text-xs h-5">1</Badge>
                  <span>Identify which MAC(s) cover your target markets</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 text-xs h-5">2</Badge>
                  <span>Check if any LCDs exist for similar devices/procedures</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 text-xs h-5">3</Badge>
                  <span>Engage with MACs early for coverage discussions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 text-xs h-5">4</Badge>
                  <span>Provide clinical evidence to support coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 text-xs h-5">5</Badge>
                  <span>If national coverage needed, request NCD from CMS</span>
                </li>
              </ol>
            </div>

            <a
              href="https://www.cms.gov/medicare/coordination-benefits-recovery/coordination-benefits-recovery-contractors/medicare-administrative-contractors"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Find Your MAC on CMS Website
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Helpful Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="https://www.cms.gov/medicare-coverage-database"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Medicare Coverage Database (MCD) - Search All NCDs and LCDs
            </a>
            <a
              href="https://www.cms.gov/Medicare/Coverage/DeterminationProcess"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              CMS Coverage Determination Process Overview
            </a>
            <a
              href="https://www.cms.gov/medicare/coverage/coverage-medcac"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Medicare Evidence Development & Coverage Advisory Committee (MEDCAC)
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
