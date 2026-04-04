import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Network, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { SiblingGroupCard } from "../product/variants/SiblingGroupCard";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { DistributionPattern } from "@/types/siblingGroup";
import { useTranslation } from "@/hooks/useTranslation";

interface PortfolioSiblingGroupsManagerProps {
  companyId: string;
}

export function PortfolioSiblingGroupsManager({ companyId }: PortfolioSiblingGroupsManagerProps) {
  const { lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sibling groups for the company
  const { data: siblingGroups, isLoading } = useQuery({
    queryKey: ['portfolio-sibling-groups', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sibling_groups')
        .select(`
          id,
          name,
          description,
          basic_udi_di,
          distribution_pattern,
          created_at,
          product_sibling_assignments(
            id,
            product_id,
            percentage,
            position,
            product:products(
              id,
              name,
              trade_name,
              model_reference
            )
          )
        `)
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Get Basic UDI-DI groups for navigation
  const { data: basicUdiGroups } = useQuery({
    queryKey: ['basic-udi-groups', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('basic_udi_di_groups')
        .select('id, basic_udi_di, internal_reference')
        .eq('company_id', companyId)
        .order('basic_udi_di');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const filteredGroups = siblingGroups?.filter(group =>
    searchTerm === "" || 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.basic_udi_di?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalGroups: siblingGroups?.length || 0,
    totalProducts: siblingGroups?.reduce((sum, group) => 
      sum + (group.product_sibling_assignments?.length || 0), 0) || 0,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {lang('portfolioSiblingGroups.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">{lang('portfolioSiblingGroups.loading')}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                {lang('portfolioSiblingGroups.title')}
              </CardTitle>
              <CardDescription>
                {lang('portfolioSiblingGroups.description')}
              </CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link to={`/app/company/${encodeURIComponent(companyId)}/portfolio?view=cards`}>
                <Plus className="h-4 w-4 mr-2" />
                {lang('portfolioSiblingGroups.manageInProducts')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalGroups}</div>
              <div className="text-sm text-muted-foreground">{lang('portfolioSiblingGroups.siblingGroups')}</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">{lang('portfolioSiblingGroups.productsInGroups')}</div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={lang('portfolioSiblingGroups.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Sibling Groups List */}
          {filteredGroups && filteredGroups.length > 0 ? (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const siblings = group.product_sibling_assignments
                  ?.map((assignment: any) => ({
                    assignmentId: assignment.id,
                    productId: assignment.product_id,
                    name: assignment.product?.name || assignment.product_id,
                    tradeName: assignment.product?.trade_name || null,
                    percentage: assignment.percentage || 0,
                    position: assignment.position || 0,
                  }))
                  .sort((a, b) => a.position - b.position) || [];

                return (
                  <SiblingGroupCard
                    key={group.id}
                    groupId={group.id}
                    groupName={group.name}
                    groupDescription={group.description}
                    distributionPattern={group.distribution_pattern as DistributionPattern}
                    siblings={siblings}
                    onDelete={async () => {
                      try {
                        const { error } = await supabase
                          .from('product_sibling_groups')
                          .delete()
                          .eq('id', group.id);

                        if (error) throw error;

                        queryClient.invalidateQueries({ queryKey: ['portfolio-sibling-groups', companyId] });

                        toast({
                          title: lang('portfolioSiblingGroups.success'),
                          description: lang('portfolioSiblingGroups.deleteSuccess'),
                        });
                      } catch (error) {
                        toast({
                          title: lang('portfolioSiblingGroups.error'),
                          description: lang('portfolioSiblingGroups.deleteError'),
                          variant: "destructive",
                        });
                      }
                    }}
                    onUpdateDistributionPattern={async (pattern: DistributionPattern) => {
                      try {
                        const { error } = await supabase
                          .from('product_sibling_groups')
                          .update({ distribution_pattern: pattern })
                          .eq('id', group.id);

                        if (error) throw error;

                        queryClient.invalidateQueries({ queryKey: ['portfolio-sibling-groups', companyId] });

                        toast({
                          title: lang('portfolioSiblingGroups.success'),
                          description: lang('portfolioSiblingGroups.updatePatternSuccess'),
                        });
                      } catch (error) {
                        toast({
                          title: lang('portfolioSiblingGroups.error'),
                          description: lang('portfolioSiblingGroups.updatePatternError'),
                          variant: "destructive",
                        });
                      }
                    }}
                    basicUdiDi={group.basic_udi_di}
                    companyId={companyId}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
                <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{lang('portfolioSiblingGroups.noGroupsTitle')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {lang('portfolioSiblingGroups.noGroupsDescription')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
