import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Zap, 
  Link, 
  GitBranch, 
  Settings, 
  Clock,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";
import { SequenceMode } from "@/hooks/useEnhancedAutoSequencing";

interface QuickSetupOption {
  mode: SequenceMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  bestFor: string;
  complexity: 'Simple' | 'Medium' | 'Advanced';
}

interface QuickSetupWizardProps {
  onModeSelect: (mode: SequenceMode) => void;
  onCreateDependencies?: () => Promise<void>;
  currentMode: SequenceMode;
  phaseCount: number;
  dependencyCount: number;
}

const setupOptions: QuickSetupOption[] = [
  {
    mode: 'simple',
    title: 'Simple Sequential',
    description: 'Phases run one after another with no gaps',
    icon: <Zap className="h-5 w-5" />,
    pros: ['Easy to understand', 'Quick setup', 'No complex dependencies'],
    cons: ['Not flexible for complex projects', 'May not reflect real workflow'],
    bestFor: 'Small projects, quick prototypes, linear workflows',
    complexity: 'Simple'
  },
  {
    mode: 'dependency',
    title: 'Dependency-Based',
    description: 'Uses project dependencies for intelligent scheduling',
    icon: <Link className="h-5 w-5" />,
    pros: ['Realistic scheduling', 'Handles complex relationships', 'Professional approach'],
    cons: ['Requires dependency setup', 'More complex to manage'],
    bestFor: 'Complex projects, regulated industries, team collaboration',
    complexity: 'Advanced'
  },
  {
    mode: 'parallel',
    title: 'Parallel Phases',
    description: 'Identifies phases that can run at the same time',
    icon: <GitBranch className="h-5 w-5" />,
    pros: ['Faster project completion', 'Resource optimization', 'Concurrent work'],
    cons: ['Requires careful planning', 'Risk of conflicts'],
    bestFor: 'Resource-rich projects, time-critical deliveries',
    complexity: 'Medium'
  }
];

export function QuickSetupWizard({
  onModeSelect,
  onCreateDependencies,
  currentMode,
  phaseCount,
  dependencyCount
}: QuickSetupWizardProps) {
  const [selectedMode, setSelectedMode] = useState<SequenceMode>(currentMode);
  const [isOpen, setIsOpen] = useState(false);

  const handleApplySetup = async () => {
    onModeSelect(selectedMode);
    
    if (selectedMode === 'simple' && onCreateDependencies && dependencyCount === 0) {
      await onCreateDependencies();
    }
    
    setIsOpen(false);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lightbulb className="h-4 w-4 mr-2" />
          Quick Setup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Timeline Quick Setup Wizard
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Status */}
          <Card className="border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Current Project Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{phaseCount} phases</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-primary" />
                  <span>{dependencyCount} dependencies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Current: {currentMode === 'none' ? 'Disabled' : currentMode}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Options */}
          <div className="space-y-4">
            <h3 className="font-medium">Choose your timeline management approach:</h3>
            
            <RadioGroup value={selectedMode} onValueChange={(value) => setSelectedMode(value as SequenceMode)}>
              <div className="grid gap-4">
                {setupOptions.map((option) => (
                  <div key={option.mode} className="relative">
                    <RadioGroupItem 
                      value={option.mode} 
                      id={option.mode} 
                      className="absolute top-4 left-4 z-10"
                    />
                    <Label htmlFor={option.mode} className="cursor-pointer">
                      <Card className={`transition-all ${selectedMode === option.mode ? 'ring-2 ring-primary border-primary' : 'hover:border-muted-foreground/20'}`}>
                        <CardContent className="p-4 pl-12">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  {option.icon}
                                </div>
                                <div>
                                  <h4 className="font-medium">{option.title}</h4>
                                  <p className="text-sm text-muted-foreground">{option.description}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-xs ${getComplexityColor(option.complexity)}`}>
                                {option.complexity}
                              </Badge>
                            </div>

                            {/* Details */}
                            <div className="grid md:grid-cols-3 gap-3 text-xs">
                              <div>
                                <h5 className="font-medium text-green-700 mb-1">Pros:</h5>
                                <ul className="space-y-1">
                                  {option.pros.map((pro, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground">{pro}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-red-700 mb-1">Considerations:</h5>
                                <ul className="space-y-1">
                                  {option.cons.map((con, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <div className="h-3 w-3 rounded-full bg-red-200 mt-0.5 flex-shrink-0" />
                                      <span className="text-muted-foreground">{con}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-primary mb-1">Best for:</h5>
                                <p className="text-muted-foreground">{option.bestFor}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Next Steps Preview */}
          {selectedMode !== 'none' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  What happens next:
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedMode === 'simple' && (
                    <>
                      <p>• Timeline will be set to Simple Sequential mode</p>
                      {dependencyCount === 0 && onCreateDependencies && (
                        <p>• Sequential dependencies will be created automatically</p>
                      )}
                      <p>• Phases will be arranged in order with no gaps</p>
                    </>
                  )}
                  {selectedMode === 'dependency' && (
                    <>
                      <p>• Timeline will use existing dependencies for scheduling</p>
                      {dependencyCount === 0 && (
                        <p>• You'll need to set up dependencies manually first</p>
                      )}
                      <p>• Critical path method will be used for optimal scheduling</p>
                    </>
                  )}
                  {selectedMode === 'parallel' && (
                    <>
                      <p>• Timeline will identify phases that can run concurrently</p>
                      <p>• Resource optimization will be considered</p>
                      <p>• Project duration may be reduced significantly</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplySetup}
              disabled={selectedMode === currentMode && (selectedMode !== 'simple' || dependencyCount > 0)}
            >
              Apply Setup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}