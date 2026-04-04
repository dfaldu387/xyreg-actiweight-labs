import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Barcode, Building2 } from "lucide-react";
import { UdiLookupWidget } from "@/components/device-information/UdiLookupWidget";
import { OrganizationLookup } from "@/components/device-information/OrganizationLookup";

interface EUDAMEDLookupDialogProps {
  onDeviceFound: (device: any) => void;
  onOrganizationFound: (orgData: any) => void;
  trigger?: React.ReactNode;
}

export function EUDAMEDLookupDialog({ 
  onDeviceFound, 
  onOrganizationFound,
  trigger 
}: EUDAMEDLookupDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleDeviceFound = (device: any) => {
    onDeviceFound(device);
    setOpen(false);
  };

  const handleOrganizationFound = (orgData: any) => {
    onOrganizationFound(orgData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Search EUDAMED Registry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            EUDAMED Registry Lookup
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="device" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="device" className="gap-2">
              <Barcode className="h-4 w-4" />
              UDI-DI Lookup
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organization Lookup
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="device" className="mt-4">
            <UdiLookupWidget 
              onDeviceFound={handleDeviceFound}
              onOrganizationFound={handleOrganizationFound}
            />
          </TabsContent>
          
          <TabsContent value="organization" className="mt-4">
            <OrganizationLookup 
              onOrganizationSelect={handleOrganizationFound}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
