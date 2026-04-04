
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RegulatoryComplianceSectionProps {
  ceMarkStatus?: string;
  notifiedBody?: string;
  isoCertifications?: string[];
  onCeMarkStatusChange?: (value: string) => void;
  onNotifiedBodyChange?: (value: string) => void;
  onIsoCertificationsChange?: (certifications: string[]) => void;
  isLoading?: boolean;
}

export function RegulatoryComplianceSection({
  ceMarkStatus = '',
  notifiedBody = '',
  isoCertifications = [],
  onCeMarkStatusChange,
  onNotifiedBodyChange,
  onIsoCertificationsChange,
  isLoading = false
}: RegulatoryComplianceSectionProps) {
  const [newCertification, setNewCertification] = useState('');

  const handleAddCertification = () => {
    if (newCertification.trim() && !isoCertifications.includes(newCertification.trim())) {
      onIsoCertificationsChange?.([...isoCertifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    const updated = isoCertifications.filter((_, i) => i !== index);
    onIsoCertificationsChange?.(updated);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>6. Regulatory and Compliance Information</CardTitle>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ce-mark-status">CE Mark Status</Label>
          <Input
            id="ce-mark-status"
            value={ceMarkStatus}
            onChange={(e) => onCeMarkStatusChange?.(e.target.value)}
            placeholder="e.g., CE Marked, In Progress, Not Started"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="notified-body">Notified Body</Label>
          <Input
            id="notified-body"
            value={notifiedBody}
            onChange={(e) => onNotifiedBodyChange?.(e.target.value)}
            placeholder="e.g., TÜV SÜD, BSI, DEKRA"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label>ISO Certifications</Label>
          <div className="flex flex-wrap gap-2">
            {isoCertifications.map((cert, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {cert}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveCertification(index)}
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="e.g., ISO 13485, ISO 14971"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCertification();
                }
              }}
            />
            <Button 
              onClick={handleAddCertification} 
              disabled={!newCertification.trim() || isLoading}
              variant="secondary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
