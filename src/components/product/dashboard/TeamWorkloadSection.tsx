import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users } from 'lucide-react';
import { Product } from '@/types/client';

interface TeamWorkloadSectionProps {
  product: Product;
}

export function TeamWorkloadSection({ product }: TeamWorkloadSectionProps) {
  // Mock team workload data - in real implementation, this would come from hooks/services
  const teamMembers = [
    { name: 'Dr Sarah Jaffeescen', workload: 75 },
    { name: 'Mark Olen', workload: 60 },
  ];

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return 'bg-red-500';
    if (workload >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Workload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {teamMembers.map((member, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{member.name}</span>
              <span className="text-sm text-muted-foreground">{member.workload}%</span>
            </div>
            <Progress 
              value={member.workload} 
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

