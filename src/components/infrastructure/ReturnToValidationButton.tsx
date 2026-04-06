import React from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export function ReturnToValidationButton() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { companyName } = useParams<{ companyName: string }>();

  const from = searchParams.get('from');
  if (from !== 'infrastructure' || !companyName) return null;

  return (
    <div className="fixed bottom-6 right-24 z-50">
      <Button
        onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/infrastructure?openValidation=true`)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 gap-2 pr-4 pl-3 py-4 h-auto rounded-full"
      >
        <ArrowLeft className="h-5 w-5 ml-1" />
        <span className="font-medium">Return to Validation</span>
      </Button>
    </div>
  );
}
