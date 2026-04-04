import { supabase } from '@/integrations/supabase/client';
import { BlueprintComment, CompanyVentureBlueprintData } from '@/types/blueprint';
import { RealtimeChannel } from '@supabase/supabase-js';

export class BlueprintCollaborationService {
  private static channel: RealtimeChannel | null = null;

  /**
   * Load blueprint data from Supabase (company-level)
   */
  static async loadBlueprintData(companyId: string): Promise<CompanyVentureBlueprintData | null> {
    try {
      const { data, error } = await supabase
        .from('company_venture_blueprints')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) {
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        activityNotes: (data.activity_notes as Record<number, string>) || {},
        activityFiles: (data.activity_files as Record<number, { name: string; path: string; uploadedAt?: string } | null>) || {},
        completedActivities: (data.completed_activities as number[]) || [],
        activityComments: {},
        lastUpdated: data.last_updated
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Load comments for a company's blueprint
   */
  static async loadComments(companyId: string): Promise<Record<number, BlueprintComment[]>> {
    try {
      const { data, error } = await supabase
        .from('blueprint_comments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) {
        return {};
      }

      const commentsByActivity: Record<number, BlueprintComment[]> = {};
      
      data?.forEach(comment => {
        if (!commentsByActivity[comment.activity_id]) {
          commentsByActivity[comment.activity_id] = [];
        }
        
        commentsByActivity[comment.activity_id].push({
          id: comment.id,
          activityId: comment.activity_id,
          userId: comment.user_id,
          userName: comment.user_name,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at
        });
      });

      return commentsByActivity;
    } catch (error) {
      return {};
    }
  }

  /**
   * Save or update blueprint data
   */
  static async saveBlueprintData(
    companyId: string,
    data: CompanyVentureBlueprintData
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('company_venture_blueprints')
        .upsert({
          company_id: companyId,
          activity_notes: data.activityNotes,
          activity_files: data.activityFiles,
          completed_activities: data.completedActivities,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add a comment to an activity
   */
  static async addComment(
    companyId: string,
    activityId: number,
    content: string,
    userId: string,
    userName: string
  ): Promise<BlueprintComment | null> {
    try {
      const { data, error } = await supabase
        .from('blueprint_comments')
        .insert({
          company_id: companyId,
          activity_id: activityId,
          user_id: userId,
          user_name: userName,
          content: content
        })
        .select()
        .single();

      if (error) {
        return null;
      }

      return {
        id: data.id,
        activityId: data.activity_id,
        userId: data.user_id,
        userName: data.user_name,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blueprint_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Subscribe to real-time blueprint changes
   */
  static subscribeToChanges(
    companyId: string,
    onBlueprintUpdate: (data: any) => void,
    onCommentUpdate: (comment: any) => void,
    onCommentDelete: (commentId: string) => void
  ): RealtimeChannel {
    // Cleanup existing subscription
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    // Create new channel
    this.channel = supabase
      .channel(`blueprint-changes-${companyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_venture_blueprints',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            onBlueprintUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blueprint_comments',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          onCommentUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'blueprint_comments',
          filter: `company_id=eq.${companyId}`
        },
        (payload) => {
          onCommentDelete(payload.old.id);
        }
      )
      .subscribe();

    return this.channel;
  }

  /**
   * Unsubscribe from real-time changes
   */
  static unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // ============ PRODUCT-SPECIFIC METHODS ============

  /**
   * Load product blueprint data from Supabase
   */
  static async loadProductBlueprintData(productId: string): Promise<CompanyVentureBlueprintData | null> {
    try {
      const { data, error } = await supabase
        .from('product_venture_blueprints')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      if (error) {
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        activityNotes: (data.activity_notes as Record<number, string>) || {},
        activityFiles: (data.activity_files as Record<number, { name: string; path: string; uploadedAt?: string } | null>) || {},
        completedActivities: (data.completed_activities as number[]) || [],
        activityComments: {},
        lastUpdated: data.last_updated
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Load comments for a product's blueprint
   */
  static async loadProductComments(productId: string): Promise<Record<number, BlueprintComment[]>> {
    try {
      const { data, error } = await supabase
        .from('product_blueprint_comments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (error) {
        return {};
      }

      const commentsByActivity: Record<number, BlueprintComment[]> = {};
      
      data?.forEach(comment => {
        if (!commentsByActivity[comment.activity_id]) {
          commentsByActivity[comment.activity_id] = [];
        }
        
        commentsByActivity[comment.activity_id].push({
          id: comment.id,
          activityId: comment.activity_id,
          userId: comment.user_id,
          userName: comment.user_name,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at
        });
      });

      return commentsByActivity;
    } catch (error) {
      return {};
    }
  }

  /**
   * Save or update product blueprint data
   */
  static async saveProductBlueprintData(
    productId: string,
    companyId: string,
    data: CompanyVentureBlueprintData
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_venture_blueprints')
        .upsert({
          product_id: productId,
          company_id: companyId,
          activity_notes: data.activityNotes,
          activity_files: data.activityFiles,
          completed_activities: data.completedActivities,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'product_id'
        });

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add a comment to a product activity
   */
  static async addProductComment(
    productId: string,
    companyId: string,
    activityId: number,
    content: string,
    userId: string,
    userName: string
  ): Promise<BlueprintComment | null> {
    try {
      const { data, error } = await supabase
        .from('product_blueprint_comments')
        .insert({
          product_id: productId,
          company_id: companyId,
          activity_id: activityId,
          user_id: userId,
          user_name: userName,
          content: content
        })
        .select()
        .single();

      if (error) {
        return null;
      }

      return {
        id: data.id,
        activityId: data.activity_id,
        userId: data.user_id,
        userName: data.user_name,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete a product comment
   */
  static async deleteProductComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('product_blueprint_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Subscribe to real-time product blueprint changes
   */
  static subscribeToProductChanges(
    productId: string,
    onBlueprintUpdate: (data: any) => void,
    onCommentUpdate: (comment: any) => void,
    onCommentDelete: (commentId: string) => void
  ): RealtimeChannel {
    // Cleanup existing subscription
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    // Create new channel
    this.channel = supabase
      .channel(`product-blueprint-changes-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_venture_blueprints',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            onBlueprintUpdate(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_blueprint_comments',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          onCommentUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'product_blueprint_comments',
          filter: `product_id=eq.${productId}`
        },
        (payload) => {
          onCommentDelete(payload.old.id);
        }
      )
      .subscribe();

    return this.channel;
  }
}
