import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';
import { RoleRequirement, CompetencyArea, PROFICIENCY_CONFIG, ProficiencyLevel } from './types';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  requirements: RoleRequirement[];
  areas: CompetencyArea[];
}

export function RoleCompetencyMapping({ requirements, areas }: Props) {
  const { lang } = useTranslation();
  const getArea = (id: string) => areas.find(a => a.id === id);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{lang('training.competency.roleMapping.title')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">{lang('training.competency.roleMapping.jobTitle')}</TableHead>
              <TableHead>{lang('training.competency.roleMapping.department')}</TableHead>
              <TableHead>{lang('training.competency.roleMapping.requiredCompetencies')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requirements.map((req, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{req.roleTitle}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{req.department}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {req.requirements.map(r => {
                      const area = getArea(r.areaId);
                      const config = PROFICIENCY_CONFIG[r.requiredLevel];
                      return (
                        <Badge key={r.areaId} variant="outline" className="text-xs gap-1">
                          {area?.shortName} ≥ L{r.requiredLevel}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
