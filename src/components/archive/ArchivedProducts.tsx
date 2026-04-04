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
import { formatDeviceClassLabel } from "@/utils/deviceClassUtils";

interface ArchivedProduct {
  id: string;
  name: string;
  company_name: string;
  status: string | null;
  class: string | null;
  archived_at: string;
  archived_by: string;
}

type SortField = 'name' | 'company_name' | 'class' | 'archived_at';
type SortDir = 'asc' | 'desc';

export function ArchivedProducts() {
  const [products, setProducts] = useState<ArchivedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRestore, setConfirmingRestore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('archived_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const { toast } = useToast();
  const { userRole } = useAuth();

  const fetchArchivedProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, status, class, archived_at, archived_by, company_id,
          companies:company_id ( name )
        `)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedProducts = data?.map(product => ({
        ...product,
        company_name: product.companies?.name || 'Unknown'
      })) || [];
      
      setProducts(formattedProducts);
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to load archived products: ${error.message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedProducts();
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
    let list = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.company_name.toLowerCase().includes(q) ||
        (p.class || '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, searchQuery, sortField, sortDir]);

  const handleRestore = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: false, archived_at: null, archived_by: null })
        .eq('id', productId);
      if (error) throw error;
      toast({ title: "Product Restored", description: "The product has been successfully restored" });
      fetchArchivedProducts();
    } catch (error: any) {
      toast({ title: "Error", description: `Failed to restore product: ${error.message}`, variant: "destructive" });
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
        <h2 className="text-xl font-semibold">Archived Products</h2>
        <Button variant="outline" size="sm" onClick={fetchArchivedProducts}>Refresh</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, company, or class..."
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
          <p>{searchQuery ? 'No matching archived products' : 'No archived products found'}</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead field="name">Device Name</SortableHead>
                <SortableHead field="company_name">Company</SortableHead>
                <SortableHead field="class">Class</SortableHead>
                <SortableHead field="archived_at">Archived Date</SortableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.company_name}</TableCell>
                  <TableCell>{product.class ? formatDeviceClassLabel(product.class) : '-'}</TableCell>
                  <TableCell>
                    {product.archived_at ? format(new Date(product.archived_at), 'PPP') : '-'}
                  </TableCell>
                  <TableCell>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => setConfirmingRestore(product.id)} title="Restore product">
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
            <AlertDialogTitle>Restore Product</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the product and make it visible again in product listings.
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
