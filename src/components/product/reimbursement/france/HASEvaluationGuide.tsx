import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Users, FileText, AlertCircle } from 'lucide-react';
import { 
  HAS_KEY_FACTS, 
  HAS_COMMISSIONS, 
  HAS_EVALUATION_CRITERIA,
  HAS_SUBMISSION_PATHWAYS,
  HAS_RESUBMISSION_SCENARIOS
} from '@/utils/reimbursement/franceHASProcess';

export function HASEvaluationGuide() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>{HAS_KEY_FACTS.title}</CardTitle>
          <Badge variant="outline" className="w-fit">{HAS_KEY_FACTS.subtitle}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{HAS_KEY_FACTS.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Authority & Scope</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="font-medium">{HAS_KEY_FACTS.authority}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Composition: </span>
                  <span className="font-medium">{HAS_KEY_FACTS.composition}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Scope: </span>
                  <span className="font-medium">{HAS_KEY_FACTS.scope}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mandate: </span>
                  <span className="font-medium">{HAS_KEY_FACTS.mandate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HAS Commissions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">HAS Commissions</h3>
        <div className="space-y-4">
          {HAS_COMMISSIONS.map((commission, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{commission.name}</CardTitle>
                </div>
                <Badge variant="secondary" className="w-fit text-xs mb-2">{commission.fullName}</Badge>
                <CardDescription>{commission.responsibility}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="text-muted-foreground">Composition: </span>
                  <span className="font-medium">{commission.composition}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Evaluation Criteria */}
      <div>
        <h3 className="text-lg font-semibold mb-4">HAS Evaluation Criteria</h3>
        <div className="space-y-4">
          {HAS_EVALUATION_CRITERIA.map((criterion, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base">{criterion.criterion}</CardTitle>
                <CardDescription>{criterion.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                <ul className="space-y-1">
                  {criterion.requirements.map((req, reqIdx) => (
                    <li key={reqIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Submission Pathways */}
      <div>
        <h3 className="text-lg font-semibold mb-4">HAS Submission Pathways</h3>
        <div className="space-y-4">
          {HAS_SUBMISSION_PATHWAYS.map((pathway, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{pathway.pathway}</Badge>
                  <Badge variant="secondary" className="text-xs">{pathway.timeline}</Badge>
                </div>
                <CardDescription>{pathway.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Applicability</h4>
                  <p className="text-sm text-muted-foreground">{pathway.applicability}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Process Steps</h4>
                  <ul className="space-y-1">
                    {pathway.process.map((step, stepIdx) => (
                      <li key={stepIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resubmission Scenarios */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Handling Unfavorable Outcomes</h3>
        <div className="space-y-4">
          {HAS_RESUBMISSION_SCENARIOS.map((scenario, idx) => (
            <Card key={idx} className="border-yellow-600/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <CardTitle className="text-base">{scenario.scenario}</CardTitle>
                </div>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold mb-2">Options</h4>
                <ul className="space-y-1">
                  {scenario.options.map((option, optIdx) => (
                    <li key={optIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span>{option}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Official Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="https://www.has-sante.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              HAS Official Website (French/English)
            </a>
            <a
              href="https://www.has-sante.fr/jcms/c_418716/en/transparency-committee"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              CNEDiMTS Commission Information
            </a>
            <a
              href="https://www.ameli.fr/l-assurance-maladie/statistiques-et-publications/etudes-en-sante-publique/remboursements-de-soins/lpp.php"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              LPP Official List (Assurance Maladie)
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
