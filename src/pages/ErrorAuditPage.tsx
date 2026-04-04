
import React from 'react';
import { ErrorAudit } from '@/components/error/ErrorAudit';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ErrorAuditPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Error Audit Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and analyze application errors for debugging and stability improvement.
          </p>
        </div>
      </div>
      
      <ErrorAudit />
    </div>
  );
}
