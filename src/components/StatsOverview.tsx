
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Users, CheckCircle2, Briefcase } from "lucide-react";
import { Client } from "@/types/client";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsOverviewProps {
  clients: Client[];
  isLoading?: boolean;
}

export function StatsOverview({ clients, isLoading = false }: StatsOverviewProps) {
  const totalClients = clients.length;
  const totalProducts = clients.reduce((sum, client) => sum + client.products, 0);
  const clientsAtRisk = clients.filter(client => client.status === "At Risk").length;
  const clientsOnTrack = clients.filter(client => client.status === "On Track").length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardContent className="flex items-center pt-6">
              <Skeleton className="h-10 w-10 rounded-full mr-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="flex items-center pt-6">
          <div className="bg-primary/10 p-2 rounded-full mr-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
            <h3 className="text-2xl font-bold">{totalClients}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center pt-6">
          <div className="bg-success/10 p-2 rounded-full mr-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">On Track</p>
            <h3 className="text-2xl font-bold">{clientsOnTrack}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center pt-6">
          <div className="bg-destructive/10 p-2 rounded-full mr-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">At Risk</p>
            <h3 className="text-2xl font-bold">{clientsAtRisk}</h3>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center pt-6">
          <div className="bg-primary/10 p-2 rounded-full mr-4">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
            <h3 className="text-2xl font-bold">{totalProducts}</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
