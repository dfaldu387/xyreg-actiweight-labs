
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Trash2 } from 'lucide-react';
import { ActivityTemplate, ACTIVITY_TYPES } from '@/types/activities';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';

interface ActivityTemplatesTableProps {
  templates: ActivityTemplate[];
  isLoading: boolean;
  onEdit: (template: ActivityTemplate) => void;
  onDelete: (id: string) => void;
}

export function ActivityTemplatesTable({
  templates,
  isLoading,
  onEdit,
  onDelete
}: ActivityTemplatesTableProps) {
  const { lang } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {lang('companySettings.activityTemplates.loadingTemplates')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            {lang('companySettings.activityTemplates.noTemplatesFound')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{lang('companySettings.activityTemplates.name')}</TableHead>
              <TableHead>{lang('companySettings.activityTemplates.type')}</TableHead>
              <TableHead>{lang('companySettings.activityTemplates.description')}</TableHead>
              <TableHead>{lang('companySettings.activityTemplates.created')}</TableHead>
              <TableHead className="w-[100px]">{lang('companySettings.activityTemplates.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ACTIVITY_TYPES[template.type]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {template.description || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(template.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(template)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(template.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
