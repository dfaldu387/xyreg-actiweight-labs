import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { 
  LPP_KEY_FACTS, 
  LPP_CATEGORIES, 
  LPP_APPLICATION_STEPS,
  SERVICE_ATTENDU_LEVELS,
  AMELIORATION_SERVICE_ATTENDU_LEVELS
} from '@/utils/reimbursement/franceLPPProcess';

export function LPPApplicationGuide() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>{LPP_KEY_FACTS.title}</CardTitle>
          <Badge variant="outline" className="w-fit">{LPP_KEY_FACTS.subtitle}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{LPP_KEY_FACTS.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Key Details</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Governing Bodies: </span>
                  <span className="font-medium">{LPP_KEY_FACTS.governingBody}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-medium">{LPP_KEY_FACTS.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Coverage: </span>
                  <span className="font-medium">{LPP_KEY_FACTS.coverage}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Target Setting: </span>
                  <span className="font-medium">{LPP_KEY_FACTS.targetSetting}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">LPP Categories (Titres)</h4>
              <ul className="space-y-1">
                {LPP_CATEGORIES.map((cat, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 text-xs">{cat.category}</Badge>
                    <span className="text-muted-foreground">{cat.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LPP Categories Detail */}
      <div>
        <h3 className="text-lg font-semibold mb-4">LPP Product Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LPP_CATEGORIES.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{category.category}</Badge>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-semibold mb-2">Examples</h4>
                <ul className="space-y-1">
                  {category.examples.map((example, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Application Process */}
      <div>
        <h3 className="text-lg font-semibold mb-4">LPP Application Process</h3>
        <div className="space-y-4">
          {LPP_APPLICATION_STEPS.map((step) => (
            <Card key={step.step}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">{step.step}</Badge>
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{step.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{step.timeline}</Badge>
                    <CardDescription className="mt-2">{step.description}</CardDescription>
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
                {step.documents && step.documents.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Required Documents</h4>
                    <div className="space-y-1">
                      {step.documents.map((doc, docIdx) => (
                        <div key={docIdx} className="text-xs bg-secondary/30 rounded px-3 py-2">
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {step.stakeholders && step.stakeholders.length > 0 && (
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
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Attendu (SA) Levels */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Attendu (SA) - Clinical Benefit Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICE_ATTENDU_LEVELS.map((level) => (
            <Card key={level.level} className={`border-${level.color}-600/20`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  {level.color === 'emerald' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <Badge className={`bg-${level.color}-600 mb-2`}>{level.level}</Badge>
                    <CardDescription className="text-xs">{level.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Implications</h4>
                  <p className="text-xs text-muted-foreground">{level.implications}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Criteria</h4>
                  <ul className="space-y-1">
                    {level.criteria.map((criterion, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ASA Levels */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Amélioration du Service Attendu (ASA) - Improvement Rating</h3>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ASA Rating Scale</CardTitle>
            <CardDescription>
              ASA rating determines the level of improvement your device provides over existing alternatives, 
              which directly impacts reimbursement pricing and negotiation leverage with CEPS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {AMELIORATION_SERVICE_ATTENDU_LEVELS.map((asa, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-secondary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">{asa.level}</Badge>
                      <p className="text-sm font-medium mb-1">{asa.description}</p>
                      <p className="text-xs text-muted-foreground">{asa.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Total LPP Process Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="w-32">3-6 months</Badge>
              <div className="text-sm">Pre-submission preparation</div>
            </div>
            <div className="border-l-2 border-primary/20 ml-16 pl-4 py-2 space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-32">6-9 months</Badge>
                <div className="text-sm text-muted-foreground">HAS clinical evaluation (CNEDiMTS)</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-32">3-6 months</Badge>
                <div className="text-sm text-muted-foreground">CEPS pricing negotiation</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="w-32">1-2 months</Badge>
                <div className="text-sm text-muted-foreground">Official publication (Journal Officiel)</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="w-32">~18-24 months</Badge>
                <div className="text-sm font-medium">Total time to reimbursement</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
