import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Lightbulb, ArrowRight } from 'lucide-react';

interface SmartDependencyDialogProps {
  open: boolean;
  onClose: () => void;
  movedPhase: { id: string; name: string };
  suggestedDependencies: Array<{
    sourcePhaseId: string;
    sourcePhaseName: string;
    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
    reason: string;
  }>;
  onCreateDependencies: (dependencies: Array<{
    sourcePhaseId: string;
    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  }>) => void;
  onSkip: () => void;
}

export function SmartDependencyDialog({
  open,
  onClose,
  movedPhase,
  suggestedDependencies,
  onCreateDependencies,
  onSkip
}: SmartDependencyDialogProps) {
  const [selectedDependencies, setSelectedDependencies] = useState<Set<string>>(
    new Set(suggestedDependencies.map((_, index) => index.toString()))
  );
  const [action, setAction] = useState<'create' | 'skip'>('create');

  const handleConfirm = () => {
    if (action === 'create') {
      const dependenciesToCreate = suggestedDependencies
        .filter((_, index) => selectedDependencies.has(index.toString()))
        .map(dep => ({
          sourcePhaseId: dep.sourcePhaseId,
          type: dep.type
        }));
      onCreateDependencies(dependenciesToCreate);
    } else {
      onSkip();
    }
    onClose();
  };

  const toggleDependency = (index: string) => {
    const newSelected = new Set(selectedDependencies);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedDependencies(newSelected);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Dependency Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You moved <Badge variant="outline">{movedPhase.name}</Badge>. 
            Would you like to create dependencies to maintain logical sequencing?
          </p>

          <RadioGroup value={action} onValueChange={(value) => setAction(value as 'create' | 'skip')}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create" id="create" />
                <Label htmlFor="create" className="font-medium">
                  Create suggested dependencies
                </Label>
              </div>
              
              {action === 'create' && suggestedDependencies.length > 0 && (
                <div className="ml-6 space-y-2">
                  {suggestedDependencies.map((dep, index) => (
                    <div 
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDependencies.has(index.toString()) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted'
                      }`}
                      onClick={() => toggleDependency(index.toString())}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {dep.sourcePhaseName}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs">
                            {movedPhase.name}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {dep.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dep.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip" className="font-medium">
                  Skip - I'll manage dependencies manually
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {action === 'create' ? `Create ${selectedDependencies.size} Dependencies` : 'Skip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}