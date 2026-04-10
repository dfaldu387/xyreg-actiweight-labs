
import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface DocumentTypeFilterProps {
  countByType: (type: string) => number;
  activeTab: string;
}

export function DocumentTypeFilter({ countByType, activeTab }: DocumentTypeFilterProps) {
  return (
    <TabsList>
      <TabsTrigger value="all">All Documents</TabsTrigger>
      <TabsTrigger value="governance">
        Governance <Badge variant="outline" className="ml-2">{countByType("Governance")}</Badge>
      </TabsTrigger>
      <TabsTrigger value="standard">
        Standard <Badge variant="outline" className="ml-2">{countByType("Standard")}</Badge>
      </TabsTrigger>
      <TabsTrigger value="regulatory">
        Regulatory <Badge variant="outline" className="ml-2">{countByType("Regulatory")}</Badge>
      </TabsTrigger>
      <TabsTrigger value="technical">
        Technical <Badge variant="outline" className="ml-2">{countByType("Technical")}</Badge>
      </TabsTrigger>
      <TabsTrigger value="clinical">
        Clinical <Badge variant="outline" className="ml-2">{countByType("Clinical")}</Badge>
      </TabsTrigger>
    </TabsList>
  );
}
