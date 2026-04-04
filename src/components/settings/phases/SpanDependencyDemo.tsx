import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

interface DemoPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

export function SpanDependencyDemo() {
  const conceptPhase: DemoPhase = {
    id: '1',
    name: 'Concept & Feasibility',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    color: 'bg-blue-500'
  };

  const vvPhase: DemoPhase = {
    id: '2', 
    name: 'Verification & Validation',
    startDate: new Date('2025-07-01'),
    endDate: new Date('2025-10-31'),
    color: 'bg-green-500'
  };

  const techDocPhase: DemoPhase = {
    id: '3',
    name: 'Technical Documentation',
    startDate: new Date('2025-04-01'), // Starts after concept finishes
    endDate: new Date('2025-10-31'), // Ends when V&V finishes
    color: 'bg-purple-500'
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-purple-600" />
          Span Between Phases Dependency
        </CardTitle>
        <CardDescription>
          A phase can now start after one phase finishes and automatically end when another phase finishes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium">Example: Technical Documentation spanning multiple phases</h3>
          
          {/* Timeline visualization */}
          <div className="relative bg-gray-50 p-6 rounded-lg">
            <div className="space-y-4">
              {/* Concept Phase */}
              <div className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium">{conceptPhase.name}</div>
                <div className="flex-1 relative">
                  <div className={`h-8 ${conceptPhase.color} rounded flex items-center px-3 text-white text-xs relative`}
                       style={{ width: '25%' }}>
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(conceptPhase.startDate)} - {formatDate(conceptPhase.endDate)}
                  </div>
                </div>
              </div>

              {/* Technical Documentation (spans) */}
              <div className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium">{techDocPhase.name}</div>
                <div className="flex-1 relative">
                  <div className={`h-8 ${techDocPhase.color} rounded flex items-center px-3 text-white text-xs`}
                       style={{ width: '75%', marginLeft: '25%' }}>
                    <ArrowRight className="h-3 w-3 mr-1" />
                    {formatDate(techDocPhase.startDate)} - {formatDate(techDocPhase.endDate)}
                  </div>
                </div>
              </div>

              {/* V&V Phase */}
              <div className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium">{vvPhase.name}</div>
                <div className="flex-1 relative">
                  <div className={`h-8 ${vvPhase.color} rounded flex items-center px-3 text-white text-xs`}
                       style={{ width: '35%', marginLeft: '65%' }}>
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(vvPhase.startDate)} - {formatDate(vvPhase.endDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline months */}
            <div className="mt-4 flex text-xs text-gray-500">
              <div className="w-32"></div>
              <div className="flex-1 flex justify-between">
                <span>Jan 2025</span>
                <span>Apr 2025</span>
                <span>Jul 2025</span>
                <span>Oct 2025</span>
              </div>
            </div>
          </div>

          {/* Dependency explanation */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">How it works:</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-purple-700">Start Dependency</Badge>
                <span>Technical Documentation starts after Concept & Feasibility finishes</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-purple-700">End Dependency</Badge>
                <span>Technical Documentation ends when Verification & Validation finishes</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-purple-700">Duration</Badge>
                <span>Automatically calculated based on the span (6+ months in this example)</span>
              </div>
            </div>
          </div>

          {/* Use cases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Perfect for:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Documentation that spans multiple phases</li>
                <li>• Regulatory submissions covering various stages</li>
                <li>• Quality assurance processes</li>
                <li>• Risk management activities</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Benefits:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• No manual duration management</li>
                <li>• Automatically adjusts to schedule changes</li>
                <li>• More accurate project planning</li>
                <li>• Better resource allocation</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}