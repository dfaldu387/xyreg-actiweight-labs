import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";

interface ClientDetailsSelectionProps {
  onEudamedSearch: () => void;
  onAddNewClient: () => void;
}

export function ClientDetailsSelection({ onEudamedSearch, onAddNewClient }: ClientDetailsSelectionProps) {
  return (
    <div className="space-y-6 py-4">
      {/* <div>
        <h3 className="text-lg font-semibold">Add Your Client</h3>
        <p className="text-sm text-muted-foreground">Choose how to add your first client company</p>
      </div> */}

      <div className="grid gap-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20" 
          onClick={onEudamedSearch}
        >
          <CardContent className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Search from EUDAMED</h4>
                <p className="text-sm text-muted-foreground">
                  Find your client company in the official EUDAMED database
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20" 
          onClick={onAddNewClient}
        >
          <CardContent className="mt-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Add New</h4>
                <p className="text-sm text-muted-foreground">
                  Manually enter your client company information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}