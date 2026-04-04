import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useDevMode } from "@/context/DevModeContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";
import { supabase } from "@/integrations/supabase/client";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: "approval" | "deadline" | "training" | "audit" | "communication";
  priority: "high" | "medium" | "low";
  dueDate?: Date;
  productName?: string;
  companyName?: string;
  url?: string;
  threadId?: string;
}

interface PortfolioSummary {
  totalProducts: number;
  onTrack: number;
  needsAttention: number;
  atRisk: number;
}

interface ProductAlert {
  id: string;
  name: string;
  company: string;
  status: "needs-attention" | "at-risk";
  issue: string;
  url?: string;
}

interface ActivityItem {
  id: string;
  type: "status_change" | "document_upload" | "task_completion" | "user_added" | "milestone";
  title: string;
  description: string;
  productName?: string;
  companyName?: string;
  timestamp: Date;
  user?: string;
  url?: string;
}

interface MissionControlData {
  actionItems: ActionItem[];
  portfolioSummary: PortfolioSummary;
  productAlerts: ProductAlert[];
  activityItems: ActivityItem[];
}

interface MissionControlOptions {
  dashboardType?: 'multi-company' | 'single-company' | 'single-product' | 'reviewer';
  companyId?: string;
  productId?: string;
}

export function useMissionControlData(options: MissionControlOptions = {}) {
  const { user, session, isLoading: authLoading } = useAuth();
  const { isDevMode } = useDevMode();
  const { companyRoles, activeCompanyRole } = useCompanyRole();
  const { effectiveRole } = useEffectiveUserRole();

  // Check if user is a super_admin (platform-level admin who can see ALL data)
  const isSuperAdmin = effectiveRole === 'super_admin';

  // Get user's accessible companies - ONLY super_admin users can see all companies
  // Regular admin/company admin users should still be filtered by their assigned companies
  const userCompanyIds = companyRoles.map(role => role.companyId).filter(Boolean);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mission-control-data', user?.id, options.dashboardType, options.companyId, options.productId, isSuperAdmin, userCompanyIds.join(',')],
    queryFn: async (): Promise<MissionControlData> => {
      if (!user && !isDevMode) {
        throw new Error("No authenticated user");
      }
      
      // Build products query based on dashboard type and user permissions
      let productsQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          status,
          progress,
          company_id,
          current_lifecycle_phase,
          updated_at,
          companies!inner(
            id,
            name
          )
        `)
        .eq('is_archived', false);

      // Apply filters based on dashboard type and permissions
      if (options.companyId && options.companyId !== 'all') {
        // Filter by specific company
        productsQuery = productsQuery.eq('company_id', options.companyId);
      } else if (options.dashboardType === 'single-product' && options.productId) {
        productsQuery = productsQuery.eq('id', options.productId);
      } else if (options.dashboardType === 'multi-company' || options.companyId === 'all') {
        // For multi-company or "all companies" selection
        if (!isSuperAdmin && userCompanyIds.length > 0) {
          // Regular users (including company admins) are restricted to their assigned companies
          productsQuery = productsQuery.in('company_id', userCompanyIds);
        }
        // Super admin users can see all companies (no additional filtering)
      } else if (userCompanyIds.length > 0) {
        // Default to user's first assigned company if no specific context
        productsQuery = productsQuery.eq('company_id', userCompanyIds[0]);
      }

      // Fetch products
      const { data: products, error: productsError } = await productsQuery.order('updated_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      // Fetch real action items from documents and activities
      const actionItemsPromises = [];

      // Get overdue documents as action items
      if (isSuperAdmin || userCompanyIds.length > 0 || options.companyId) {
        const companiesToQuery = options.companyId && options.companyId !== 'all' 
          ? [options.companyId] 
          : (isSuperAdmin ? [] : userCompanyIds); // Super admin users don't need company filtering
        
        if (companiesToQuery.length > 0) {
          actionItemsPromises.push(
            supabase
              .from('documents')
              .select(`
                id,
                name,
                due_date,
                status,
                products!inner(
                  id,
                  name,
                  company_id,
                  companies!inner(
                    id,
                    name
                  )
                )
              `)
              .in('products.company_id', companiesToQuery)
              .in('status', ['Pending', 'In Review'])
              .not('due_date', 'is', null)
              .lt('due_date', new Date().toISOString())
              .limit(10)
          );
        } else if (isSuperAdmin) {
          // Admin users can see all documents
          actionItemsPromises.push(
            supabase
              .from('documents')
              .select(`
                id,
                name,
                due_date,
                status,
                products!inner(
                  id,
                  name,
                  company_id,
                  companies!inner(
                    id,
                    name
                  )
                )
              `)
              .in('status', ['Pending', 'In Review'])
              .not('due_date', 'is', null)
              .lt('due_date', new Date().toISOString())
              .limit(10)
          );
        }

        // Get pending activities requiring approval
        if (companiesToQuery.length > 0) {
          actionItemsPromises.push(
            supabase
              .from('activities')
              .select(`
                id,
                name,
                due_date,
                status,
                type,
                admin_approved,
                products!inner(
                  id,
                  name,
                  company_id,
                  companies!inner(
                    id,
                    name
                  )
                )
              `)
              .in('products.company_id', companiesToQuery)
              .eq('admin_approved', false)
              .in('status', ['completed'])
              .limit(10)
          );
        } else if (isSuperAdmin) {
          // Admin users can see all activities
          actionItemsPromises.push(
            supabase
              .from('activities')
              .select(`
                id,
                name,
                due_date,
                status,
                type,
                admin_approved,
                products!inner(
                  id,
                  name,
                  company_id,
                  companies!inner(
                    id,
                    name
                  )
                )
              `)
              .eq('admin_approved', false)
              .in('status', ['completed'])
              .limit(10)
          );
        }

        // Get upcoming audits as deadlines
        if (companiesToQuery.length > 0) {
          actionItemsPromises.push(
            supabase
              .from('company_audits')
              .select(`
                id,
                audit_name,
                deadline_date,
                status,
                companies!inner(
                  id,
                  name
                )
              `)
              .in('company_id', companiesToQuery)
              .in('status', ['Planned', 'In Progress'])
              .not('deadline_date', 'is', null)
              .gte('deadline_date', new Date().toISOString())
              .order('deadline_date', { ascending: true })
              .limit(5)
          );
        } else if (isSuperAdmin) {
          // Admin users can see all audits
          actionItemsPromises.push(
            supabase
              .from('company_audits')
              .select(`
                id,
                audit_name,
                deadline_date,
                status,
                companies!inner(
                  id,
                  name
                )
              `)
              .in('status', ['Planned', 'In Progress'])
              .not('deadline_date', 'is', null)
              .gte('deadline_date', new Date().toISOString())
              .order('deadline_date', { ascending: true })
              .limit(5)
          );
        }
      }

      const actionResults = await Promise.all(actionItemsPromises);
      
      // Process action items
      const actionItems: ActionItem[] = [];

      // Overdue documents
      if (actionResults[0]?.data) {
        actionResults[0].data.forEach((doc: any) => {
          actionItems.push({
            id: `doc-${doc.id}`,
            title: `Overdue Document: ${doc.name}`,
            description: `Document is past due date`,
            type: 'deadline',
            priority: 'high',
            dueDate: new Date(doc.due_date),
            productName: doc.products?.name,
            companyName: doc.products?.companies?.name,
            url: `/app/product/${doc.products?.id}/documents`
          });
        });
      }

      // Activities needing approval
      if (actionResults[1]?.data) {
        actionResults[1].data.forEach((activity: any) => {
          actionItems.push({
            id: `activity-${activity.id}`,
            title: `Approval Required: ${activity.name}`,
            description: `${activity.type} completed and awaiting approval`,
            type: 'approval',
            priority: 'medium',
            productName: activity.products?.name,
            companyName: activity.products?.companies?.name,
            url: `/app/product/${activity.products?.id}/activities`
          });
        });
      }

      // Upcoming audits
      if (actionResults[2]?.data) {
        actionResults[2].data.forEach((audit: any) => {
          actionItems.push({
            id: `audit-${audit.id}`,
            title: `Upcoming Audit: ${audit.audit_name}`,
            description: `Audit scheduled and requires preparation`,
            type: 'audit',
            priority: 'medium',
            dueDate: new Date(audit.deadline_date),
            companyName: audit.companies?.name,
            url: `/app/audits/${audit.id}`
          });
        });
      }

      // Fetch training records for current user
      if (user?.id) {
        const trainingCompanyIds = options.companyId && options.companyId !== 'all'
          ? [options.companyId]
          : (isSuperAdmin ? [] : userCompanyIds);

        let trainingQuery = supabase
          .from('training_records')
          .select(`
            id,
            status,
            due_date,
            company_id,
            training_module:training_modules(id, name, type)
          `)
          .eq('user_id', user.id)
          .in('status', ['overdue', 'not_started', 'scheduled', 'in_progress'])
          .limit(10);

        if (trainingCompanyIds.length > 0) {
          trainingQuery = trainingQuery.in('company_id', trainingCompanyIds);
        }

        const { data: trainingData } = await trainingQuery;
        trainingData?.forEach((record: any) => {
          const isOverdue = record.status === 'overdue';
          actionItems.push({
            id: `training-${record.id}`,
            title: `Training: ${record.training_module?.name || 'Unknown'}`,
            description: isOverdue ? 'Training is overdue' : `Training ${record.status.replace('_', ' ')}`,
            type: 'training',
            priority: isOverdue ? 'high' : 'medium',
            dueDate: record.due_date ? new Date(record.due_date) : undefined,
          });
        });
      }

      // Fetch unread communication notifications for the current user
      if (user?.id) {
        const targetCompanyId = options.companyId && options.companyId !== 'all' ? options.companyId : (userCompanyIds[0] || null);
        if (targetCompanyId) {
          const { data: commNotifs } = await supabase
            .from('notifications')
            .select('*')
            .eq('company_id', targetCompanyId)
            .eq('is_read', false)
            .eq('is_remove', false)
            .eq('type', 'communication')
            .or(`user_id.eq.${user.id},user_id.is.null`)
            .order('created_at', { ascending: false })
            .limit(10);

          commNotifs?.forEach((notif: any) => {
            const commTitle = notif.data?.communication_title || notif.title;
            actionItems.push({
              id: `comm-${notif.id}`,
              title: commTitle,
              description: notif.message || 'New communication',
              type: 'communication',
              priority: 'medium',
              dueDate: notif.created_at ? new Date(notif.created_at) : undefined,
              threadId: notif.data?.thread_id || undefined,
            });
          });
        }
      }

      // Fetch unread app_notifications (review assignments, communication, etc.) for current user
      if (user?.id) {
        const targetCompanyIdForAppNotifs = options.companyId && options.companyId !== 'all' ? options.companyId : (userCompanyIds[0] || null);
        if (targetCompanyIdForAppNotifs) {
          // Fetch review notifications
          const { data: reviewNotifs } = await supabase
            .from('app_notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('company_id', targetCompanyIdForAppNotifs)
            .eq('is_read', false)
            .eq('is_archived', false)
            .neq('category', 'communication')
            .order('created_at', { ascending: false })
            .limit(20);

          // Fetch communication notifications separately (so they aren't pushed out by review ones)
          const { data: commNotifRows } = await supabase
            .from('app_notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('company_id', targetCompanyIdForAppNotifs)
            .eq('is_read', false)
            .eq('is_archived', false)
            .eq('category', 'communication')
            .order('created_at', { ascending: false })
            .limit(50);

          // Deduplicate communication notifications by thread — keep only the latest per thread
          const commByThread = new Map<string, any>();
          (commNotifRows || []).forEach((notif: any) => {
            const threadKey = notif.entity_id || notif.id;
            if (!commByThread.has(threadKey)) {
              commByThread.set(threadKey, notif);
            }
          });

          // Add review notifications
          (reviewNotifs || []).forEach((notif: any) => {
            actionItems.push({
              id: `app-notif-${notif.id}`,
              title: notif.title,
              description: notif.message || notif.action || 'New notification',
              type: 'approval',
              priority: notif.priority === 'high' || notif.priority === 'urgent' ? 'high' : 'medium',
              dueDate: notif.metadata?.due_date ? new Date(notif.metadata.due_date) : (notif.created_at ? new Date(notif.created_at) : undefined),
              url: notif.action_url || undefined,
            });
          });

          // Add communication notifications (one per thread)
          for (const notif of commByThread.values()) {
            actionItems.push({
              id: `app-notif-${notif.id}`,
              title: notif.title,
              description: notif.message || notif.action || 'New message',
              type: 'communication',
              priority: notif.priority === 'high' || notif.priority === 'urgent' ? 'high' : 'medium',
              dueDate: notif.created_at ? new Date(notif.created_at) : undefined,
              threadId: notif.entity_type === 'communication_thread' ? notif.entity_id : undefined,
            });
          }
        }
      }

      // Fetch pending review documents as approval action items
      if (user?.id) {
        const targetCompanyId = options.companyId && options.companyId !== 'all' ? options.companyId : (userCompanyIds[0] || null);
        if (targetCompanyId) {
          // Get user's reviewer group memberships
          const { data: membershipData } = await supabase
            .from('reviewer_group_members_new')
            .select('group_id')
            .eq('user_id', user.id)
            .eq('is_active', true);

          const reviewerGroupIds = (membershipData || []).map(m => m.group_id);

          if (reviewerGroupIds.length > 0) {
            const ACTIONABLE_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested'];

            // Fetch phase-assigned docs needing review
            const { data: phaseDocs } = await supabase
              .from('phase_assigned_document_template')
              .select('id, name, status, due_date, deadline, company_phases!inner(company_id)')
              .eq('company_phases.company_id', targetCompanyId)
              .overlaps('reviewer_group_ids', reviewerGroupIds)
              .eq('is_excluded', false)
              .in('status', ACTIONABLE_STATUSES)
              .limit(20);

            // Fetch regular docs needing review
            const { data: regularDocs } = await supabase
              .from('documents')
              .select('id, name, status, due_date')
              .eq('company_id', targetCompanyId)
              .overlaps('reviewer_group_ids', reviewerGroupIds)
              .in('status', ACTIONABLE_STATUSES)
              .limit(20);

            (phaseDocs || []).forEach((doc: any) => {
              actionItems.push({
                id: `review-phase-${doc.id}`,
                title: `Review: ${doc.name}`,
                description: `Document awaiting review (${doc.status || 'Pending'})`,
                type: 'approval',
                priority: doc.status === 'Changes Requested' ? 'high' : 'medium',
                dueDate: doc.due_date || doc.deadline ? new Date(doc.due_date || doc.deadline) : undefined,
                url: '/app/review',
              });
            });

            (regularDocs || []).forEach((doc: any) => {
              actionItems.push({
                id: `review-doc-${doc.id}`,
                title: `Review: ${doc.name}`,
                description: `Document awaiting review (${doc.status || 'Pending'})`,
                type: 'approval',
                priority: doc.status === 'Changes Requested' ? 'high' : 'medium',
                dueDate: doc.due_date ? new Date(doc.due_date) : undefined,
                url: '/app/review',
              });
            });
          }

          // Fetch documents where current user is assigned as author
          if (user?.id) {
            const AUTHOR_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'In Review', 'Pending', 'Changes Requested', 'Draft'];

            // Phase-assigned docs where user is author
            const { data: authorPhaseDocs } = await supabase
              .from('phase_assigned_document_template')
              .select('id, name, status, due_date, deadline, company_phases!inner(company_id)')
              .eq('company_phases.company_id', targetCompanyId)
              .eq('is_excluded', false)
              .in('status', AUTHOR_STATUSES)
              .contains('authors_ids', JSON.stringify([user.id]))
              .limit(20);

            // Regular docs where user is author
            const { data: authorRegularDocs } = await supabase
              .from('documents')
              .select('id, name, status, due_date')
              .eq('company_id', targetCompanyId)
              .in('status', AUTHOR_STATUSES)
              .contains('authors_ids', JSON.stringify([user.id]))
              .limit(20);

            // Deduplicate — don't add if already in action items as review
            const existingIds = new Set(actionItems.map(a => a.id));

            (authorPhaseDocs || []).forEach((doc: any) => {
              const itemId = `author-phase-${doc.id}`;
              if (!existingIds.has(itemId) && !existingIds.has(`review-phase-${doc.id}`)) {
                actionItems.push({
                  id: itemId,
                  title: `Author: ${doc.name}`,
                  description: `Assigned as document author (${doc.status || 'Draft'})`,
                  type: 'deadline',
                  priority: 'medium',
                  dueDate: doc.due_date || doc.deadline ? new Date(doc.due_date || doc.deadline) : undefined,
                  url: '/app/review',
                });
              }
            });

            (authorRegularDocs || []).forEach((doc: any) => {
              const itemId = `author-doc-${doc.id}`;
              if (!existingIds.has(itemId) && !existingIds.has(`review-doc-${doc.id}`)) {
                actionItems.push({
                  id: itemId,
                  title: `Author: ${doc.name}`,
                  description: `Assigned as document author (${doc.status || 'Draft'})`,
                  type: 'deadline',
                  priority: 'medium',
                  dueDate: doc.due_date ? new Date(doc.due_date) : undefined,
                  url: '/app/review',
                });
              }
            });
          }
        }
      }

      const totalProducts = products?.length || 0;
      
      // Calculate status distribution based on actual product data
      const statusCounts = products?.reduce((acc: any, product: any) => {
        const status = product.status?.toLowerCase() || 'on track';
        if (status === 'on track' || status === 'active' || status === 'launched') {
          acc.onTrack++;
        } else if (status === 'needs attention' || status === 'pending' || status === 'in development') {
          acc.needsAttention++;
        } else if (status === 'at risk' || status === 'delayed' || status === 'blocked') {
          acc.atRisk++;
        } else {
          acc.onTrack++; // Default unknown statuses to on track
        }
        return acc;
      }, { onTrack: 0, needsAttention: 0, atRisk: 0 }) || { onTrack: 0, needsAttention: 0, atRisk: 0 };

      const portfolioSummary: PortfolioSummary = {
        totalProducts,
        onTrack: statusCounts.onTrack,
        needsAttention: statusCounts.needsAttention,
        atRisk: statusCounts.atRisk
      };

      // Generate product alerts for products that actually need attention
      const productAlerts: ProductAlert[] = products
        ?.filter((product: any) => {
          const status = product.status?.toLowerCase() || '';
          return status === 'needs attention' || status === 'at risk' || status === 'delayed' || status === 'blocked';
        })
        ?.slice(0, 5)
        ?.map((product: any) => ({
          id: product.id,
          name: product.name,
          company: product.companies?.name || "Unknown Company",
          status: (product.status?.toLowerCase() || '').includes('risk') ? "at-risk" : "needs-attention",
          issue: (product.status?.toLowerCase() || '').includes('risk') 
            ? "Multiple regulatory deadlines approaching"
            : "Requires review and updates",
          url: `/app/product/${product.id}/device-information`
        })) || [];

      // Fetch real activity stream
      let activitiesQuery = supabase
        .from('activities')
        .select(`
          id,
          name,
          type,
          status,
          created_at,
          updated_at,
          products!inner(
            id,
            name,
            company_id,
            companies!inner(
              id,
              name
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (options.companyId && options.companyId !== 'all') {
        activitiesQuery = activitiesQuery.eq('products.company_id', options.companyId);
      } else if (userCompanyIds.length > 0) {
        activitiesQuery = activitiesQuery.in('products.company_id', userCompanyIds);
      }

      const { data: activities } = await activitiesQuery;

      // Also fetch document updates
      let documentsQuery = supabase
        .from('documents')
        .select(`
          id,
          name,
          status,
          updated_at,
          products!inner(
            id,
            name,
            company_id,
            companies!inner(
              id,
              name
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (options.companyId && options.companyId !== 'all') {
        documentsQuery = documentsQuery.eq('products.company_id', options.companyId);
      } else if (userCompanyIds.length > 0) {
        documentsQuery = documentsQuery.in('products.company_id', userCompanyIds);
      }

      const { data: recentDocuments } = await documentsQuery;

      // Combine activities and document updates into activity stream
      const activityItems: ActivityItem[] = [];

      // Add activity items
      activities?.forEach((activity: any) => {
        let activityType: ActivityItem['type'] = 'task_completion';
        if (activity.type?.toLowerCase().includes('audit')) activityType = 'milestone';
        if (activity.type?.toLowerCase().includes('review')) activityType = 'status_change';

        activityItems.push({
          id: `activity-${activity.id}`,
          type: activityType,
          title: activity.name,
          description: `${activity.type} - ${activity.status}`,
          productName: activity.products?.name,
          companyName: activity.products?.companies?.name,
          timestamp: new Date(activity.updated_at),
          user: 'Team Member',
          url: `/app/product/${activity.products?.id}/activities`
        });
      });

      // Add document updates
      recentDocuments?.forEach((doc: any) => {
        activityItems.push({
          id: `doc-${doc.id}`,
          type: 'document_upload',
          title: `Document Updated: ${doc.name}`,
          description: `Document status: ${doc.status}`,
          productName: doc.products?.name,
          companyName: doc.products?.companies?.name,
          timestamp: new Date(doc.updated_at),
          user: 'System'
        });
      });

      // Sort activity items by timestamp
      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        actionItems: actionItems.slice(0, 10),
        portfolioSummary,
        productAlerts,
        activityItems: activityItems.slice(0, 15)
      };
    },
    enabled: !authLoading && (!!user || isDevMode),
    staleTime: 2 * 60 * 1000, // 2 minutes for more dynamic updates
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount) => {
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000)
  });

  // REMOVED: Global real-time subscriptions were causing continuous API calls.
  // These subscriptions had no company filter and triggered refetch on ANY change
  // to products/documents/activities/audits tables globally.
  // React Query's staleTime (2 min) and gcTime (5 min) handle caching efficiently.
  // If real-time updates are needed, add filtered subscriptions based on user's companies.

  return {
    actionItems: data?.actionItems || [],
    portfolioSummary: data?.portfolioSummary || null,
    productAlerts: data?.productAlerts || [],
    activityItems: data?.activityItems || [],
    isLoading,
    error,
    refetch
  };
}