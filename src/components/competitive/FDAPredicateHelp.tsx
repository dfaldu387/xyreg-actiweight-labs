import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  GitBranch, 
  FileText, 
  Target, 
  ChevronRight,
  ChevronDown,
  Info,
  Lightbulb,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FDAPredicateHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FDAPredicateHelp({ isOpen, onClose }: FDAPredicateHelpProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">FDA 510(k) Predicate Analysis Guide</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          <Collapsible 
            open={expandedSections.has('overview')}
            onOpenChange={() => toggleSection('overview')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">What is FDA Predicate Analysis?</h3>
                </div>
                {expandedSections.has('overview') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The FDA 510(k) predicate analysis helps you understand the regulatory pathway for medical devices by identifying similar devices that have already been cleared by the FDA.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Predicate devices</strong> are previously FDA-cleared devices that are substantially equivalent to your device. 
                  Finding the right predicates is crucial for a successful 510(k) submission.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card className="border-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">Predicate Trail</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Follow the chain of predicate devices to understand regulatory history and find the best comparisons.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-secondary/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-secondary" />
                        <h4 className="font-semibold">Smart Search</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use AI-powered search to find relevant devices based on your product's EMDN code and characteristics.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Getting Started */}
          <Collapsible 
            open={expandedSections.has('getting-started')}
            onOpenChange={() => toggleSection('getting-started')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Getting Started - Step by Step</h3>
                </div>
                {expandedSections.has('getting-started') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Enter a K-Number or Use Smart Search</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Start with a known 510(k) number (like K950404) or click "Suggest Keywords from EMDN" to find relevant devices.
                    </p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs font-mono">Example: K950404, K123456, etc.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Review the Regulatory Intelligence Hub</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Check the metrics to understand the predicate landscape:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span><strong>Upstream Predicates:</strong> Devices this one references</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        <span><strong>Downstream References:</strong> Devices that reference this one</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span><strong>Trail Depth:</strong> How many levels deep the chain goes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                        <span><strong>EU Devices:</strong> Related European devices</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">Explore the Interactive Trail</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Use the Family Tree View to navigate through predicate relationships:
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3 w-3" />
                        <span>Click expand buttons to load predicate devices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        <span>Click K-numbers to add to navigation path</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>Click external links to view FDA documents</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Understanding the Interface */}
          <Collapsible 
            open={expandedSections.has('interface')}
            onOpenChange={() => toggleSection('interface')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Understanding the Interface</h3>
                </div>
                {expandedSections.has('interface') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Search Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">K-Number</Badge>
                      <div>
                        <p className="text-sm font-medium">Direct Device Search</p>
                        <p className="text-xs text-muted-foreground">Enter a specific 510(k) clearance number (e.g., K950404)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="secondary" className="mt-1">EMDN</Badge>
                      <div>
                        <p className="text-sm font-medium">Smart Keyword Suggestion</p>
                        <p className="text-xs text-muted-foreground">Generate search terms based on your product's EMDN classification</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">View Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">Interactive Trail</Badge>
                      <div>
                        <p className="text-sm font-medium">Expandable Tree View</p>
                        <p className="text-xs text-muted-foreground">Dynamically explore predicate relationships by expanding nodes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">Static View</Badge>
                      <div>
                        <p className="text-sm font-medium">Complete Trail Display</p>
                        <p className="text-xs text-muted-foreground">Show all predicate relationships at once in a structured format</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Best Practices */}
          <Collapsible 
            open={expandedSections.has('best-practices')}
            onOpenChange={() => toggleSection('best-practices')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-semibold">Best Practices & Tips</h3>
                </div>
                {expandedSections.has('best-practices') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Look for predicates with similar intended use, technological characteristics, and safety/effectiveness considerations.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Start with Recent Clearances</p>
                      <p className="text-xs text-muted-foreground">Newer devices often have more comprehensive documentation and similar technology</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Follow the Predicate Chain</p>
                      <p className="text-xs text-muted-foreground">Trace back to find the "root" predicate to understand the regulatory foundation</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Compare Device Classes</p>
                      <p className="text-xs text-muted-foreground">Ensure your predicates are in the same device class as your product</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Review Multiple Predicates</p>
                      <p className="text-xs text-muted-foreground">Don't rely on just one - build a portfolio of similar devices for stronger comparisons</p>
                    </div>
                  </div>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-medium text-primary">Regulatory Strategy Note</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This tool helps with research, but always consult with regulatory experts for your actual 510(k) submission strategy. 
                          Each device has unique considerations that require professional evaluation.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Quick Start Button */}
          <div className="pt-4 border-t">
            <Button onClick={onClose} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Got it! Let's Start Analyzing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}