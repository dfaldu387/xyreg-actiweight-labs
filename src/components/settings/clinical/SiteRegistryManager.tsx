import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building2, MapPin, User, Award } from 'lucide-react';
import { useSiteRegistry, ClinicalSite } from '@/hooks/useSiteRegistry';
import { SiteDialog } from './SiteDialog';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface SiteRegistryManagerProps {
  companyId: string;
}

export function SiteRegistryManager({ companyId }: SiteRegistryManagerProps) {
  const { lang } = useTranslation();
  const { sites, isLoading, toggleActive, deleteSite } = useSiteRegistry(companyId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<ClinicalSite | undefined>();

  const handleEdit = (site: ClinicalSite) => {
    setSelectedSite(site);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedSite(undefined);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang('companyClinical.siteRegistry.confirmDelete'))) {
      await deleteSite(id);
    }
  };

  const getQualificationBadge = (status?: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      qualified: 'default',
      pending: 'secondary',
      under_review: 'outline',
    };
    const statusLabels: Record<string, string> = {
      qualified: lang('companyClinical.siteRegistry.status.qualified'),
      pending: lang('companyClinical.siteRegistry.status.pending'),
      under_review: lang('companyClinical.siteRegistry.status.underReview'),
    };
    return <Badge variant={variants[status || 'pending']}>{statusLabels[status || 'pending']}</Badge>;
  };

  if (isLoading) {
    return <div>{lang('companyClinical.siteRegistry.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {sites.length === 1
            ? lang('companyClinical.siteRegistry.siteCountSingular')
            : lang('companyClinical.siteRegistry.siteCount').replace('{{count}}', String(sites.length))}
        </p>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {lang('companyClinical.siteRegistry.addSite')}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{lang('companyClinical.siteRegistry.headers.siteName')}</TableHead>
            <TableHead>{lang('companyClinical.siteRegistry.headers.location')}</TableHead>
            <TableHead>{lang('companyClinical.siteRegistry.headers.principalInvestigator')}</TableHead>
            <TableHead>{lang('companyClinical.siteRegistry.headers.specialty')}</TableHead>
            <TableHead>{lang('companyClinical.siteRegistry.headers.status')}</TableHead>
            <TableHead>{lang('companyClinical.siteRegistry.headers.trials')}</TableHead>
            <TableHead>{lang('companyClinical.siteRegistry.headers.active')}</TableHead>
            <TableHead className="text-right">{lang('companyClinical.siteRegistry.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sites.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                {lang('companyClinical.siteRegistry.noSites')}
              </TableCell>
            </TableRow>
          ) : (
            sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {site.site_name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {site.location}
                  </div>
                </TableCell>
                <TableCell>
                  {site.pi_name ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {site.pi_name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{site.specialty || '—'}</TableCell>
                <TableCell>{getQualificationBadge(site.qualification_status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    {site.previous_trials_count || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={site.is_active}
                    onCheckedChange={(checked) => toggleActive(site.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(site)}>
                      {lang('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(site.id)}
                    >
                      {lang('common.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <SiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={selectedSite}
        companyId={companyId}
      />
    </div>
  );
}
