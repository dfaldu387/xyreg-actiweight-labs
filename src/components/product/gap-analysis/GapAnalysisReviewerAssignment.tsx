
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { User } from 'lucide-react';

interface GapAnalysisReviewerAssignmentProps {
  assignedTo?: string;
  onReviewerAssign?: (reviewerId: string) => void;
}

export function GapAnalysisReviewerAssignment({ assignedTo, onReviewerAssign }: GapAnalysisReviewerAssignmentProps) {
  const [openReviewerPopover, setOpenReviewerPopover] = useState(false);

  const teamMembers = [
    { id: "1", name: "Maria Johnson", role: "Lead Engineer" },
    { id: "2", name: "Thomas Berg", role: "Quality Manager" },
    { id: "3", name: "Erik Svensson", role: "Project Manager" },
    { id: "4", name: "Anna Lindgren", role: "Regulatory Affairs" },
    { id: "5", name: "Jonas Nilsson", role: "Lead Developer" },
    { id: "6", name: "Hans Mueller", role: "CTO" },
    { id: "7", name: "Greta Weber", role: "Quality Specialist" },
    { id: "8", name: "Pierre Dupont", role: "Research Lead" },
    { id: "9", name: "Sophie Laurent", role: "Clinical Director" },
  ];

  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : [];

  const handleReviewerChange = (reviewerId: string) => {
    try {
      if (onReviewerAssign && reviewerId) {
        onReviewerAssign(reviewerId);
        setOpenReviewerPopover(false);
      }
    } catch (error) {
      console.error('Error assigning reviewer:', error);
      setOpenReviewerPopover(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Assigned Reviewer</Label>
      <Popover open={openReviewerPopover} onOpenChange={setOpenReviewerPopover}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <User className="h-4 w-4 mr-2" />
            <span>
              {assignedTo ? assignedTo : "Assign Reviewer"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput placeholder="Search reviewer..." />
            <CommandList>
              <CommandEmpty>No reviewer found.</CommandEmpty>
              <CommandGroup>
              {safeTeamMembers.length > 0 ? (
                safeTeamMembers.map((member) => (
                  <CommandItem 
                    key={member?.id || Math.random()}
                    value={member?.name || ''}
                    onSelect={() => {
                      if (member?.id) {
                        handleReviewerChange(member.id);
                      }
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{member?.name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">{member?.role || 'No role'}</span>
                    </div>
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>
                  <span className="text-muted-foreground text-sm">No reviewers available</span>
                </CommandItem>
              )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
