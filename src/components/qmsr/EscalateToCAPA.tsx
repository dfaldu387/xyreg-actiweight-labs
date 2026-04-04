import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowUpRight, Link2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { capaService } from '@/services/capaService';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface EscalateToCAPAProps {
  nodeId: string;
  nodeLabel: string;
  productId: string;
  companyId: string;
  isCritical: boolean;
  onEscalated?: () => void;
}

export function EscalateToCAPA({
  nodeId,
  nodeLabel,
  productId,
  companyId,
  isCritical,
  onEscalated,
}: EscalateToCAPAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleEscalate = async () => {
    if (!user?.id || !description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a problem description.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const capa = await capaService.createEscalatedCAPA(
        companyId,
        productId,
        nodeId,
        description,
        user.id
      );

      toast({
        title: 'CAPA Created',
        description: `Escalated to company CAPA: ${capa.capa_id}`,
      });

      setIsOpen(false);
      setDescription('');
      onEscalated?.();

      // Offer to navigate to the new CAPA
      setTimeout(() => {
        toast({
          title: 'View CAPA?',
          description: (
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => navigate(`/app/capa/${capa.id}`)}
            >
              Open {capa.capa_id} →
            </Button>
          ),
        });
      }, 500);
    } catch (error) {
      console.error('Failed to escalate to CAPA:', error);
      toast({
        title: 'Escalation Failed',
        description: 'Could not create the CAPA. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCritical) return null;

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(true)}
      >
        <ArrowUpRight className="h-4 w-4" />
        Escalate to Company CAPA
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Escalate to Company CAPA
            </DialogTitle>
            <DialogDescription>
              Create a company-level CAPA linked to this device node failure.
              This demonstrates "Loop Closure" for auditor traceability.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source Info */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Escalating from:</span>
              <Badge variant="outline" className={cn(
                'text-xs font-mono',
                'bg-red-50 text-red-700 border-red-200'
              )}>
                {nodeLabel}
              </Badge>
            </div>

            {/* Problem Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Problem Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue that triggered this escalation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will be prefixed with the source node information in the CAPA record.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEscalate}
              disabled={isSubmitting || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Create Company CAPA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
