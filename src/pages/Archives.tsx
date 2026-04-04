
import React from 'react';
import { ArchivedCompanies } from '@/components/archive/ArchivedCompanies';
import { ArchivedProducts } from '@/components/archive/ArchivedProducts';
import { ArchivedBomRevisions } from '@/components/archive/ArchivedBomRevisions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Archives() {
  const navigate = useNavigate();
  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 lg:py-4 space-y-2 sm:space-y-3 lg:space-y-4">
      <h1 className="text-2xl font-bold">Archives</h1>
      <p className="text-muted-foreground">View and manage archived companies and products.</p>
      <div className="flex justify-end">
        <Button onClick={() => navigate(-1)} >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      <Tabs defaultValue="companies" className="mt-2 sm:mt-3 lg:mt-4">
        <TabsList>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="bom">BOM Revisions</TabsTrigger>
        </TabsList>
        <TabsContent value="companies" className="mt-2 sm:mt-3 lg:mt-4">
          <ArchivedCompanies />
        </TabsContent>
        <TabsContent value="products" className="mt-2 sm:mt-3 lg:mt-4">
          <ArchivedProducts />
        </TabsContent>
        <TabsContent value="bom" className="mt-2 sm:mt-3 lg:mt-4">
          <ArchivedBomRevisions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
