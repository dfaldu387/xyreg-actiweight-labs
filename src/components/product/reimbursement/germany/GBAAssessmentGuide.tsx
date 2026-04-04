import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Users, FileText, Gavel, AlertCircle } from 'lucide-react';
import { GBA_PROCESS_STEPS, GBA_PATHWAYS, GBA_STAKEHOLDERS, GBA_KEY_FACTS } from '@/utils/reimbursement/germanyGBAProcess';

export function GBAAssessmentGuide() {
  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <FileText className="h-5 w-5 text-primary" />;
      case 2:
        return <FileText className="h-5 w-5 text-primary" />;
      case 3:
        return <Users className="h-5 w-5 text-primary" />;
      case 4:
        return <Gavel className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>{GBA_KEY_FACTS.title}</CardTitle>
          <Badge variant="outline" className="w-fit">{GBA_KEY_FACTS.subtitle}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{GBA_KEY_FACTS.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Authority & Scope</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Coverage Scope: </span>
                  <span className="font-medium">{GBA_KEY_FACTS.scope}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Authority: </span>
                  <span className="font-medium">{GBA_KEY_FACTS.authority}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Composition: </span>
                  <span className="font-medium">{GBA_KEY_FACTS.composition}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Annual Decisions: </span>
                  <span className="font-medium">{GBA_KEY_FACTS.decisions}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Critical for Devices</h4>
              <ul className="space-y-1">
                {GBA_KEY_FACTS.criticalForDevices.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* G-BA Pathways */}
      <div>
        <h3 className="text-lg font-semibold mb-4">G-BA Assessment Pathways</h3>
        <div className="space-y-4">
          {GBA_PATHWAYS.map((pathway, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{pathway.pathway}</Badge>
                  <CardTitle className="text-base">{pathway.name}</CardTitle>
                </div>
                <CardDescription>{pathway.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trigger: </span>
                    <span className="font-medium">{pathway.trigger}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timeline: </span>
                    <span className="font-medium">{pathway.timeline}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Implications</h4>
                  <ul className="space-y-1">
                    {pathway.implications.map((impl, implIdx) => (
                      <li key={implIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{impl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* G-BA Process Steps */}
      <div>
        <h3 className="text-lg font-semibold mb-4">G-BA Assessment Process</h3>
        <div className="space-y-4">
          {GBA_PROCESS_STEPS.map((step) => (
            <Card key={step.step}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {getStepIcon(step.step)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{step.step}</Badge>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs ml-auto">{step.timeline}</Badge>
                    </div>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Key Actions</h4>
                  <ul className="space-y-1">
                    {step.keyActions.map((action, actionIdx) => (
                      <li key={actionIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Key Stakeholders</h4>
                  <div className="flex flex-wrap gap-2">
                    {step.stakeholders.map((stakeholder, sIdx) => (
                      <Badge key={sIdx} variant="outline" className="text-xs">
                        {stakeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stakeholders Detail */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Key Stakeholders in G-BA Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GBA_STAKEHOLDERS.map((stakeholder, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-sm">{stakeholder.name}</CardTitle>
                <Badge variant="secondary" className="w-fit text-xs">{stakeholder.role}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stakeholder.responsibility}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Official Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="https://www.g-ba.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              G-BA Official Website (German)
            </a>
            <a
              href="https://www.iqwig.de/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              IQWiG (Institute for Quality and Efficiency in Health Care)
            </a>
            <a
              href="https://www.g-ba.de/themen/methodenbewertung/ambulant/medizinprodukte-mit-hohem-risiko/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              G-BA High-Risk Medical Device Assessment (§137h)
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Note */}
      <Card className="border-yellow-600/20 bg-yellow-600/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Important Timeline Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            The complete G-BA assessment process typically takes <strong>18-24 months</strong> from initial 
            application to final decision. This timeline should be factored into market entry planning.
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>IQWiG assessment alone can take 6-12 months</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>Stakeholder consultation and hearing add 3-6 months</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>Final G-BA deliberation and publication add 2-4 months</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 mt-1">•</span>
              <span>Additional time may be required if further evidence is requested</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
