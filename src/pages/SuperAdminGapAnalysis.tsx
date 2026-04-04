import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Search, Filter, Download, Upload, FileText, FileDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { MdrAnnex1Service, type MdrAnnex1Entry } from '@/services/mdrAnnex1Service';

import { toast } from 'sonner';

// Form schema for mdr_annex_1 entries
const mdrAnnex1Schema = z.object({
  mdr_annex_1_attribute: z.string().min(1, 'Attribute is required'),
  regulatory_dna_value: z.string().optional(),
  chapter: z.string().optional(),
  section: z.string().optional(),
  sub_section: z.string().optional(),
  gspr_clause: z.string().optional(),
  detail: z.string().optional(),
  verify: z.string().optional(),
  responsible_party: z.string().optional(),
  question: z.string().optional(),
  responsibility: z.string().optional(),
  product_id: z.string().optional(),
  company_id: z.string().optional(),
});

type MdrAnnex1FormData = z.infer<typeof mdrAnnex1Schema>;

// Types
interface Company {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  company_id: string;
}


export default function SuperAdminGapAnalysis() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MdrAnnex1Entry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState<MdrAnnex1Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MdrAnnex1Entry[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [filterCompany, setFilterCompany] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const form = useForm<MdrAnnex1FormData>({
    resolver: zodResolver(mdrAnnex1Schema),
    defaultValues: {
      mdr_annex_1_attribute: '',
      regulatory_dna_value: '',
      chapter: '',
      section: '',
      sub_section: '',
      gspr_clause: '',
      detail: '',
      verify: '',
      responsible_party: '',
      question: '',
      responsibility: '',
      product_id: '',
      company_id: '',
    },
  });

  // Fetch initial data on component mount
  useEffect(() => {
    fetchCompanies();
    fetchEntries();
  }, []);

  // Fetch products when company is selected (for form)
  useEffect(() => {
    if (selectedCompany) {
      fetchProducts(selectedCompany);
    } else {
      setProducts([]);
      setSelectedProduct('');
    }
  }, [selectedCompany]);

  // Fetch filter products when filter company is selected
  useEffect(() => {
    if (filterCompany) {
      fetchFilterProducts(filterCompany);
    } else {
      setFilterProduct('');
    }
  }, [filterCompany]);

  // Fetch entries when filters change
  useEffect(() => {
    fetchEntries();
  }, [filterCompany, filterProduct]);

  // Filter entries when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry =>
        Object.values(entry).some(value =>
          value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredEntries(filtered);
    }
  }, [entries, searchTerm]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      let data;
      
      if (filterProduct) {
        // If product is selected, fetch entries for that product
        data = await MdrAnnex1Service.getByProduct(filterProduct);
      } else if (filterCompany) {
        // If only company is selected, fetch entries for that company
        data = await MdrAnnex1Service.getByCompany(filterCompany);
      } else {
        // No filters, fetch all entries
        data = await MdrAnnex1Service.getAll();
      }
      
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchProducts = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company_id')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const fetchFilterProducts = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, company_id')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      // Don't overwrite the products state, this is just for the filter
      // We'll use the same state but be careful about when we update it
    } catch (error) {
      console.error('Error fetching filter products:', error);
    }
  };

  const onSubmit = async (data: MdrAnnex1FormData) => {
    try {
      setIsLoading(true);
      
      // Add selected company and product to form data
      const formDataWithSelections = {
        ...data,
        company_id: selectedCompany || undefined,
        product_id: selectedProduct || undefined,
      };

      if (editingItem) {
        // Update existing entry
        await MdrAnnex1Service.update(editingItem.id!, formDataWithSelections);
        toast.success('Entry updated successfully');
      } else {
        // Create new entry
        await MdrAnnex1Service.create(formDataWithSelections);
        toast.success('Entry created successfully');
      }

      // Refresh data
      await fetchEntries();
      
      // Reset form
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingItem(null);
      form.reset();
      setSelectedCompany('');
      setSelectedProduct('');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: MdrAnnex1Entry) => {
    setEditingItem(item);
    form.reset(item);
    setSelectedCompany(item.company_id || '');
    setSelectedProduct(item.product_id || '');
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsLoading(true);
      await MdrAnnex1Service.delete(itemToDelete);
      toast.success('Entry deleted successfully');
      await fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterCompanyChange = (companyId: string) => {
    setFilterCompany(companyId);
    setFilterProduct(''); // Reset product filter when company changes
  };

  const handleClearFilters = () => {
    setFilterCompany('');
    setFilterProduct('');
  };

  // Sample file download handler
  const handleSampleFileDownload = () => {
    const sampleData = [
      {
        mdr_annex_1_attribute: "Device contains software or electronic programmable systems",
        regulatory_dna_value: "Yes",
        chapter: "CHAPTER II - DESIGN AND MANUFACTURE",
        section: "14.1 Software Development",
        sub_section: "14.1.1 Software Lifecycle",
        gspr_clause: "Software used in medical devices must be developed according to quality management system",
        detail: "All software components must follow IEC 62304 standards for medical device software lifecycle processes",
        verify: "Review software development documentation and V&V test reports",
        responsible_party: "R&D (P), QA/RA, Software",
        question: "How does the device ensure software safety and reliability?",
        responsibility: "R&D: Research & Development / Engineering (Includes Mechanical, Electrical, Software, Materials)"
      }
    ];

    const csvContent = [
      'mdr_annex_1_attribute,regulatory_dna_value,chapter,section,sub_section,gspr_clause,detail,verify,responsible_party,question,responsibility',
      ...sampleData.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'mdr_annex_1_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample file downloaded successfully');
  };

  // Import handler
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue;
          
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const entryData: any = {};
          
          headers.forEach((header, index) => {
            if (values[index]) {
              entryData[header] = values[index];
            }
          });

          try {
            await MdrAnnex1Service.create(entryData);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error('Error importing entry:', error);
          }
        }

        await fetchEntries();
        
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} entries`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} entries`);
        }
      } catch (error) {
        console.error('Error importing file:', error);
        toast.error('Failed to import file');
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  // Export handler
  const handleExport = () => {
    try {
      const dataToExport = filteredEntries.length > 0 ? filteredEntries : entries;
      
      if (dataToExport.length === 0) {
        toast.error('No data to export');
        return;
      }

      const headers = [
        'mdr_annex_1_attribute',
        'regulatory_dna_value',
        'chapter',
        'section',
        'sub_section',
        'gspr_clause',
        'detail',
        'verify',
        'responsible_party',
        'question',
        'responsibility'
      ];

      const csvContent = [
        headers.join(','),
        ...dataToExport.map(entry =>
          headers.map(header => `"${entry[header as keyof MdrAnnex1Entry] || ''}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mdr_annex_1_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Successfully exported ${dataToExport.length} entries`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Get products for the filter dropdown
  const [filterProducts, setFilterProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    if (filterCompany) {
      const fetchFilterProductsList = async () => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id, name, company_id')
            .eq('company_id', filterCompany)
            .eq('is_archived', false)
            .order('name');

          if (error) throw error;
          setFilterProducts(data || []);
        } catch (error) {
          console.error('Error fetching filter products:', error);
          setFilterProducts([]);
        }
      };
      fetchFilterProductsList();
    } else {
      setFilterProducts([]);
    }
  }, [filterCompany]);

  const EntryForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company and Product Selection */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Select 
              value={selectedCompany} 
              onValueChange={(value) => {
                setSelectedCompany(value);
                setSelectedProduct(''); // Reset product when company changes
              }}
            >
              <SelectTrigger className="bg-background border-border z-50">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50">
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Product</label>
            <Select 
              value={selectedProduct} 
              onValueChange={setSelectedProduct}
              disabled={!selectedCompany}
            >
              <SelectTrigger className="bg-background border-border z-50">
                <SelectValue placeholder={selectedCompany ? "Select a product" : "Select company first"} />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50">
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mdr_annex_1_attribute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MDR Annex 1 Attribute *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter attribute" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regulatory_dna_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regulatory DNA Value</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select Yes or No" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border shadow-lg">
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chapter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chapter</FormLabel>
                <FormControl>
                  <Input placeholder="Enter chapter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <FormControl>
                  <Input placeholder="Enter section" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sub_section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Section</FormLabel>
                <FormControl>
                  <Input placeholder="Enter sub section" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gspr_clause"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSPR Clause</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GSPR clause" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsible_party"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsible Party</FormLabel>
                <FormControl>
                  <Input placeholder="Enter responsible party" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="verify"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verify</FormLabel>
                <FormControl>
                  <Input placeholder="Enter verification method" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsibility</FormLabel>
                <FormControl>
                  <Input placeholder="Enter responsibility" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="detail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detail</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter detailed description" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter assessment question" 
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingItem(null);
              setSelectedCompany('');
              setSelectedProduct('');
              form.reset();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEdit ? 'Update Entry' : 'Create Entry')}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-foreground p-6 rounded-lg text-white">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gap Analysis Management</h1>
            <p className="text-white/90">Manage MDR Annex 1 requirements and compliance data</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Controls */}
          <div className="flex gap-2">
            <Select value={filterCompany} onValueChange={handleFilterCompanyChange}>
              <SelectTrigger className="w-[200px] bg-background border-border">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50">
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filterProduct} 
              onValueChange={setFilterProduct}
              disabled={!filterCompany}
            >
              <SelectTrigger className="w-[200px] bg-background border-border">
                <SelectValue placeholder={filterCompany ? "Filter by product" : "Select company first"} />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50">
                {filterProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterCompany || filterProduct) && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New MDR Annex 1 Entry</DialogTitle>
                <DialogDescription>
                  Create a new entry for MDR Annex 1 compliance requirements
                </DialogDescription>
              </DialogHeader>
              <EntryForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>MDR Annex 1 Entries</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : 
                  `${filteredEntries.length} entries found${
                    filterCompany ? ` for ${companies.find(c => c.id === filterCompany)?.name || 'selected company'}` : ''
                  }${
                    filterProduct ? ` - ${filterProducts.find(p => p.id === filterProduct)?.name || 'selected product'}` : ''
                  }`
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSampleFileDownload}
                disabled={isLoading}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Sample File Download
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleImport}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Attribute</th>
                  <th className="text-left p-3 font-medium">Chapter</th>
                  <th className="text-left p-3 font-medium">GSPR Clause</th>
                  <th className="text-left p-3 font-medium">Responsible Party</th>
                  <th className="text-left p-3 font-medium">Detail</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Loading entries...
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.mdr_annex_1_attribute}</td>
                      <td className="p-3">{item.chapter}</td>
                      <td className="p-3">{item.gspr_clause}</td>
                      <td className="p-3">{item.responsible_party}</td>
                      <td className="p-3 max-w-xs truncate">{item.detail}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            disabled={isLoading}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id!)}
                            className="text-destructive hover:text-destructive"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No entries found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit MDR Annex 1 Entry</DialogTitle>
            <DialogDescription>
              Update the selected entry details
            </DialogDescription>
          </DialogHeader>
          <EntryForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}