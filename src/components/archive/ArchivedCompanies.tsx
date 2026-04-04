import { useState, useEffect, useMemo } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Archive, RotateCcw, ArrowUpDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { hasAdminPrivileges } from "@/utils/roleUtils";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useNavigate } from "react-router-dom";

interface ArchivedCompany {
  id: string;
  name: string;
  country: string | null;
  archived_at: string;
  archived_by: string;
}

type SortField = 'name' | 'country' | 'archived_at';
type SortDir = 'asc' | 'desc';

export function ArchivedCompanies() {
  const [companies, setCompanies] = useState<ArchivedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRestore, setConfirmingRestore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('archived_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { toast } = useToast();
  const { userRole } = useAuth();
  const { switchCompanyRole, refreshCompanyRoles } = useCompanyRole();
  const navigate = useNavigate();

  const fetchArchivedCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load archived companies: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedCompanies();
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = companies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const valA = a[sortField] || '';
      const valB = b[sortField] || '';
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [companies, searchQuery, sortField, sortDir]);

  const handleRestore = async (companyId: string) => {
    try {
      // Restore the company
      const { error } = await supabase
        .from('companies')
        .update({ is_archived: false, archived_at: null, archived_by: null })
        .eq('id', companyId);
      if (error) throw error;

      // Also restore all products belonging to this company
      const { error: productsError } = await supabase
        .from('products')
        .update({ is_archived: false, archived_at: null, archived_by: null })
        .eq('company_id', companyId)
        .eq('is_archived', true);
      if (productsError) console.error('Failed to restore products:', productsError);
      
      // Refresh company roles so the restored company appears, then switch to it
      await refreshCompanyRoles();
      await switchCompanyRole(companyId, { updateUserMetadata: true, navigateToCompany: false });
      
      toast({ title: "Company Restored", description: "The company and all its products have been restored." });
      navigate('/app/documents');
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to restore company: ${error.message}`, variant: "destructive" });
    }
    setConfirmingRestore(null);
  };

  const isAdmin = hasAdminPrivileges(userRole);

  const SortableHead = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-accent/50"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Archived Companies</h2>
        <Button variant="outline" size="sm" onClick={fetchArchivedCompanies}>Refresh</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or country..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Archive className="mx-auto h-12 w-12 mb-2 opacity-20" />
          <p>{searchQuery ? 'No matching archived companies' : 'No archived companies found'}</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead field="name">Company Name</SortableHead>
                <SortableHead field="country">Country</SortableHead>
                <SortableHead field="archived_at">Archived Date</SortableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.country || '-'}</TableCell>
                  <TableCell>
                    {company.archived_at ? format(new Date(company.archived_at), 'PPP') : '-'}
                  </TableCell>
                  <TableCell>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setConfirmingRestore(company.id)} title="Restore company">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirmingRestore} onOpenChange={() => setConfirmingRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Company</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the company and all its archived products, making them visible again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmingRestore && handleRestore(confirmingRestore)}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
