import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProductDetails } from '@/hooks/useProductDetails';
import { useProductPhases } from '@/hooks/useProductPhases';
import { useActivities } from '@/hooks/useActivities';
import { useProductAudits } from '@/hooks/useProductAudits';
import { MiniGanttChart } from '@/components/charts/MiniGanttChart';
import { format } from 'date-fns';

// Extend the ProductPhase type to include the properties we need
interface ExtendedProductPhase {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  deadline?: Date;
  progress?: number;
  estimated_budget?: number;
  documents?: Array<{
    name?: string;
    description?: string;
    status?: string;
  }>;
}

export default function ProductPhaseDetail() {
  const { productId, phaseId } = useParams<{ productId: string; phaseId: string }>();
  const navigate = useNavigate();
  
  const { data: product, isLoading: isProductLoading } = useProductDetails(productId);
  const { phases, isLoading: isPhasesLoading } = useProductPhases(productId, product?.company_id, product);
  const { activities, isLoading: isActivitiesLoading } = useActivities(product?.company_id, productId, phases);
  const { audits, loading: isAuditsLoading } = useProductAudits(productId);
  
  const phase = phases?.find(p => p.id === phaseId) as ExtendedProductPhase | undefined;
  const phaseActivities = activities.filter(activity => activity.phase_id === phaseId);
  const phaseAudits = audits.filter(audit => 
    audit.lifecycle_phase && phase?.name && 
    audit.lifecycle_phase.toLowerCase().includes(phase.name.toLowerCase())
  );
  
  const handleBack = () => {
    navigate(`/app/product/${productId}/milestones`);
  };
  
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'on hold':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'not started':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not started':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  if (isProductLoading || isPhasesLoading || isActivitiesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product || !phase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Phase Not Found</h1>
          <p className="text-gray-600 mb-4">
            The requested phase could not be found.
          </p>
          <Button onClick={handleBack} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {phase.name}
              {phase.start_date && phase.end_date && (
                <span className="text-lg font-normal text-gray-500 ml-4">
                  ({format(new Date(phase.start_date), 'MMM dd, yyyy')} - {format(new Date(phase.end_date), 'MMM dd, yyyy')})
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {product.name} • Phase Details
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(phase.status)}
          <Badge className={getStatusColor(phase.status)}>
            {phase.status}
          </Badge>
        </div>
      </div>
      
      {/* CI Timeline - Full Width */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <MiniGanttChart 
            activities={phaseActivities}
            audits={phaseAudits}
            phaseStartDate={phase.start_date}
            phaseEndDate={phase.end_date}
          />
        </CardContent>
      </Card>

    </div>
  );
}