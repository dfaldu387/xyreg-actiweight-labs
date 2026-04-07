export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      action_item_dismissals: {
        Row: {
          action_item_id: string
          company_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_item_id: string
          company_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_item_id?: string
          company_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          admin_approved: boolean | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          admin_comments: string | null
          assignee_ids: Json | null
          company_id: string
          created_at: string | null
          due_date: string | null
          end_date: string | null
          id: string
          name: string
          phase_id: string | null
          platform_change_id: string | null
          product_id: string | null
          start_date: string | null
          status: string
          template_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          assignee_ids?: Json | null
          company_id: string
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          name: string
          phase_id?: string | null
          platform_change_id?: string | null
          product_id?: string | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          assignee_ids?: Json | null
          company_id?: string
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          name?: string
          phase_id?: string | null
          platform_change_id?: string | null
          product_id?: string | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activities_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "lifecycle_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_platform_change_id_fkey"
            columns: ["platform_change_id"]
            isOneToOne: false
            referencedRelation: "platform_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "activities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "activity_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_phase_id"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "lifecycle_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_templates: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ai_summary_prompts: {
        Row: {
          additional_instructions: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          default_context_chunks: number | null
          default_max_tokens: number | null
          default_temperature: number | null
          description: string | null
          id: string
          instructions: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          prompt_type: string
          system_message: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          additional_instructions?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          default_context_chunks?: number | null
          default_max_tokens?: number | null
          default_temperature?: number | null
          description?: string | null
          id?: string
          instructions: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          prompt_type?: string
          system_message: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          additional_instructions?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          default_context_chunks?: number | null
          default_max_tokens?: number | null
          default_temperature?: number | null
          description?: string | null
          id?: string
          instructions?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          prompt_type?: string
          system_message?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_summary_prompts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_summary_prompts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      app_notifications: {
        Row: {
          action: string
          action_url: string | null
          actor_id: string | null
          actor_name: string | null
          category: string
          company_id: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          is_read: boolean
          message: string | null
          metadata: Json | null
          priority: string
          product_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action: string
          action_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          category?: string
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          product_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action?: string
          action_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          category?: string
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string | null
          metadata?: Json | null
          priority?: string
          product_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      architecture_decisions: {
        Row: {
          alternatives_considered: string | null
          company_id: string
          created_at: string
          created_by: string | null
          decided_by: string | null
          decision_date: string | null
          decision_id: string
          description: string
          diagram_id: string | null
          id: string
          implications: string | null
          metadata: Json | null
          product_id: string
          rationale: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alternatives_considered?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          decided_by?: string | null
          decision_date?: string | null
          decision_id: string
          description: string
          diagram_id?: string | null
          id?: string
          implications?: string | null
          metadata?: Json | null
          product_id: string
          rationale: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alternatives_considered?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          decided_by?: string | null
          decision_date?: string | null
          decision_id?: string
          description?: string
          diagram_id?: string | null
          id?: string
          implications?: string | null
          metadata?: Json | null
          product_id?: string
          rationale?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "architecture_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "architecture_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "architecture_decisions_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "system_architecture_diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "architecture_decisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "architecture_decisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      architecture_patterns: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          regulatory_context: string | null
          template_data: Json | null
          updated_at: string
          use_cases: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          regulatory_context?: string | null
          template_data?: Json | null
          updated_at?: string
          use_cases?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          regulatory_context?: string | null
          template_data?: Json | null
          updated_at?: string
          use_cases?: string | null
        }
        Relationships: []
      }
      archived_pms_data: {
        Row: {
          archived_at: string | null
          archived_data: Json
          id: string
          migration_phase: string | null
          table_name: string
        }
        Insert: {
          archived_at?: string | null
          archived_data: Json
          id?: string
          migration_phase?: string | null
          table_name: string
        }
        Update: {
          archived_at?: string | null
          archived_data?: Json
          id?: string
          migration_phase?: string | null
          table_name?: string
        }
        Relationships: []
      }
      audit_completion_documents: {
        Row: {
          audit_id: string
          audit_type: string
          description: string | null
          document_type: string | null
          file_name: string
          id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          audit_id: string
          audit_type: string
          description?: string | null
          document_type?: string | null
          file_name: string
          id?: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          audit_id?: string
          audit_type?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      audit_documents: {
        Row: {
          audit_id: string
          audit_type: string
          created_at: string
          document_id: string
          id: string
          updated_at: string
        }
        Insert: {
          audit_id: string
          audit_type: string
          created_at?: string
          document_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          audit_id?: string
          audit_type?: string
          created_at?: string
          document_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_id: string
          audit_type: string
          corrective_actions_taken: string | null
          created_at: string
          description: string
          id: string
          severity: Database["public"]["Enums"]["audit_finding_severity"]
          status: Database["public"]["Enums"]["audit_finding_status"]
          updated_at: string
        }
        Insert: {
          audit_id: string
          audit_type: string
          corrective_actions_taken?: string | null
          created_at?: string
          description: string
          id?: string
          severity: Database["public"]["Enums"]["audit_finding_severity"]
          status?: Database["public"]["Enums"]["audit_finding_status"]
          updated_at?: string
        }
        Update: {
          audit_id?: string
          audit_type?: string
          corrective_actions_taken?: string | null
          created_at?: string
          description?: string
          id?: string
          severity?: Database["public"]["Enums"]["audit_finding_severity"]
          status?: Database["public"]["Enums"]["audit_finding_status"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_recommendations: {
        Row: {
          audit_id: string
          audit_type: string
          created_at: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["audit_recommendation_priority"]
          updated_at: string
        }
        Insert: {
          audit_id: string
          audit_type: string
          created_at?: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["audit_recommendation_priority"]
          updated_at?: string
        }
        Update: {
          audit_id?: string
          audit_type?: string
          created_at?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["audit_recommendation_priority"]
          updated_at?: string
        }
        Relationships: []
      }
      audit_templates: {
        Row: {
          applicability: string
          audit_type_category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          lifecycle_phase: string | null
          source: string
          suggested_auditor_type: string | null
          suggested_documents: string | null
          suggested_duration: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          applicability: string
          audit_type_category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lifecycle_phase?: string | null
          source?: string
          suggested_auditor_type?: string | null
          suggested_documents?: string | null
          suggested_duration?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          applicability?: string
          audit_type_category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lifecycle_phase?: string | null
          source?: string
          suggested_auditor_type?: string | null
          suggested_documents?: string | null
          suggested_duration?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_trail_logs: {
        Row: {
          action: string
          action_details: Json | null
          category: string
          changes: Json | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          reason: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          action_details?: Json | null
          category: string
          changes?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          action_details?: Json | null
          category?: string
          changes?: Json | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trail_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      audit_types_metadata: {
        Row: {
          applies_to: string | null
          audit_type: string
          auditor_type: string | null
          created_at: string
          duration: string | null
          id: string
          lifecycle_phase: string | null
          purpose: string | null
          suggested_documents: string | null
          updated_at: string
        }
        Insert: {
          applies_to?: string | null
          audit_type: string
          auditor_type?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          lifecycle_phase?: string | null
          purpose?: string | null
          suggested_documents?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string | null
          audit_type?: string
          auditor_type?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          lifecycle_phase?: string | null
          purpose?: string | null
          suggested_documents?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audits: {
        Row: {
          date: string | null
          description: string | null
          documents: string[] | null
          id: string
          inserted_at: string
          name: string
          phase_id: string | null
          product_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          date?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          inserted_at?: string
          name: string
          phase_id?: string | null
          product_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          date?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          inserted_at?: string
          name?: string
          phase_id?: string | null
          product_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "lifecycle_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "audits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      basic_udi_aliases: {
        Row: {
          alias: string
          basic_udi_di: string
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          alias: string
          basic_udi_di: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          alias?: string
          basic_udi_di?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "basic_udi_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basic_udi_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      basic_udi_di_groups: {
        Row: {
          basic_udi_di: string
          check_character: string
          company_id: string
          company_prefix: string
          created_at: string
          display_as_merged: boolean
          essential_characteristics: string | null
          id: string
          intended_purpose: string | null
          internal_reference: string
          issuing_agency: string
          risk_class: string | null
          updated_at: string
        }
        Insert: {
          basic_udi_di: string
          check_character: string
          company_id: string
          company_prefix: string
          created_at?: string
          display_as_merged?: boolean
          essential_characteristics?: string | null
          id?: string
          intended_purpose?: string | null
          internal_reference: string
          issuing_agency: string
          risk_class?: string | null
          updated_at?: string
        }
        Update: {
          basic_udi_di?: string
          check_character?: string
          company_id?: string
          company_prefix?: string
          created_at?: string
          display_as_merged?: boolean
          essential_characteristics?: string | null
          id?: string
          intended_purpose?: string | null
          internal_reference?: string
          issuing_agency?: string
          risk_class?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_basic_udi_di_groups_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_basic_udi_di_groups_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      blueprint_comments: {
        Row: {
          activity_id: number
          company_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          activity_id: number
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          activity_id?: number
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      bom_item_changes: {
        Row: {
          bom_item_id: string | null
          bom_revision_id: string
          change_type: string
          changed_by: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          bom_item_id?: string | null
          bom_revision_id: string
          change_type: string
          changed_by: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          bom_item_id?: string | null
          bom_revision_id?: string
          change_type?: string
          changed_by?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_item_changes_bom_item_id_fkey"
            columns: ["bom_item_id"]
            isOneToOne: false
            referencedRelation: "bom_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_item_changes_bom_revision_id_fkey"
            columns: ["bom_revision_id"]
            isOneToOne: false
            referencedRelation: "bom_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_item_documents: {
        Row: {
          bom_item_id: string
          company_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          bom_item_id: string
          company_id: string
          created_at?: string
          document_type?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          bom_item_id?: string
          company_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bom_item_documents_bom_item_id_fkey"
            columns: ["bom_item_id"]
            isOneToOne: false
            referencedRelation: "bom_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_item_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_item_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      bom_item_product_scope: {
        Row: {
          bom_item_id: string
          company_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          bom_item_id: string
          company_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          bom_item_id?: string
          company_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_item_product_scope_bom_item_id_fkey"
            columns: ["bom_item_id"]
            isOneToOne: false
            referencedRelation: "bom_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_item_product_scope_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_item_product_scope_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bom_item_product_scope_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "bom_item_product_scope_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_items: {
        Row: {
          biocompatibility_notes: string | null
          bom_revision_id: string
          category: Database["public"]["Enums"]["bom_item_category"] | null
          certificate_required:
            | Database["public"]["Enums"]["bom_certificate_required"]
            | null
          component_id: string | null
          created_at: string
          description: string
          drawing_url: string | null
          extended_cost: number | null
          id: string
          internal_part_number: string | null
          is_critical: boolean
          item_number: string
          lead_time_days: number | null
          material_id: string | null
          material_name: string | null
          material_specification: string | null
          notes: string | null
          patient_contact:
            | Database["public"]["Enums"]["bom_patient_contact"]
            | null
          quantity: number
          reach_compliant: boolean | null
          reference_designator: string | null
          rohs_compliant: boolean | null
          shelf_life_days: number | null
          sort_order: number
          sterilization_compatible: string | null
          supplier_id: string | null
          supplier_part_number: string | null
          unit_cost: number | null
          unit_of_measure: string
          updated_at: string
        }
        Insert: {
          biocompatibility_notes?: string | null
          bom_revision_id: string
          category?: Database["public"]["Enums"]["bom_item_category"] | null
          certificate_required?:
            | Database["public"]["Enums"]["bom_certificate_required"]
            | null
          component_id?: string | null
          created_at?: string
          description: string
          drawing_url?: string | null
          extended_cost?: number | null
          id?: string
          internal_part_number?: string | null
          is_critical?: boolean
          item_number?: string
          lead_time_days?: number | null
          material_id?: string | null
          material_name?: string | null
          material_specification?: string | null
          notes?: string | null
          patient_contact?:
            | Database["public"]["Enums"]["bom_patient_contact"]
            | null
          quantity?: number
          reach_compliant?: boolean | null
          reference_designator?: string | null
          rohs_compliant?: boolean | null
          shelf_life_days?: number | null
          sort_order?: number
          sterilization_compatible?: string | null
          supplier_id?: string | null
          supplier_part_number?: string | null
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
        }
        Update: {
          biocompatibility_notes?: string | null
          bom_revision_id?: string
          category?: Database["public"]["Enums"]["bom_item_category"] | null
          certificate_required?:
            | Database["public"]["Enums"]["bom_certificate_required"]
            | null
          component_id?: string | null
          created_at?: string
          description?: string
          drawing_url?: string | null
          extended_cost?: number | null
          id?: string
          internal_part_number?: string | null
          is_critical?: boolean
          item_number?: string
          lead_time_days?: number | null
          material_id?: string | null
          material_name?: string | null
          material_specification?: string | null
          notes?: string | null
          patient_contact?:
            | Database["public"]["Enums"]["bom_patient_contact"]
            | null
          quantity?: number
          reach_compliant?: boolean | null
          reference_designator?: string | null
          rohs_compliant?: boolean | null
          shelf_life_days?: number | null
          sort_order?: number
          sterilization_compatible?: string | null
          supplier_id?: string | null
          supplier_part_number?: string | null
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_revision_id_fkey"
            columns: ["bom_revision_id"]
            isOneToOne: false
            referencedRelation: "bom_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "device_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_revision_transitions: {
        Row: {
          bom_revision_id: string
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
          transitioned_by: string
        }
        Insert: {
          bom_revision_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
          transitioned_by: string
        }
        Update: {
          bom_revision_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_revision_transitions_bom_revision_id_fkey"
            columns: ["bom_revision_id"]
            isOneToOne: false
            referencedRelation: "bom_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_revision_transitions_transitioned_by_fkey"
            columns: ["transitioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_revisions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archived_at: string | null
          archived_by: string | null
          ccr_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          is_archived: boolean | null
          product_id: string
          revision: string
          status: Database["public"]["Enums"]["bom_revision_status"]
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          ccr_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          product_id: string
          revision?: string
          status?: Database["public"]["Enums"]["bom_revision_status"]
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          ccr_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          product_id?: string
          revision?: string
          status?: Database["public"]["Enums"]["bom_revision_status"]
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_revisions_ccr_id_fkey"
            columns: ["ccr_id"]
            isOneToOne: false
            referencedRelation: "change_control_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_revisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_revisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "bom_revisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "bom_revisions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_product_rnpv_inputs: {
        Row: {
          annual_cost_change: number | null
          annual_price_change: number | null
          annual_sales_growth_rate: number | null
          attachment_rate: number | null
          bundle_rnpv_id: string
          commercial_los: number | null
          consumption_rate: number | null
          created_at: string | null
          development_phases: Json | null
          discount_rate: number | null
          forecast_duration_years: number | null
          id: string
          incremental_annual_costs: number | null
          incremental_annual_revenue: number | null
          is_new_product: boolean
          monthly_fixed_costs: number | null
          monthly_sales_forecast: number | null
          product_id: string
          regulatory_los: number | null
          technical_los: number | null
          unit_price: number | null
          unit_variable_cost: number | null
          updated_at: string | null
        }
        Insert: {
          annual_cost_change?: number | null
          annual_price_change?: number | null
          annual_sales_growth_rate?: number | null
          attachment_rate?: number | null
          bundle_rnpv_id: string
          commercial_los?: number | null
          consumption_rate?: number | null
          created_at?: string | null
          development_phases?: Json | null
          discount_rate?: number | null
          forecast_duration_years?: number | null
          id?: string
          incremental_annual_costs?: number | null
          incremental_annual_revenue?: number | null
          is_new_product?: boolean
          monthly_fixed_costs?: number | null
          monthly_sales_forecast?: number | null
          product_id: string
          regulatory_los?: number | null
          technical_los?: number | null
          unit_price?: number | null
          unit_variable_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          annual_cost_change?: number | null
          annual_price_change?: number | null
          annual_sales_growth_rate?: number | null
          attachment_rate?: number | null
          bundle_rnpv_id?: string
          commercial_los?: number | null
          consumption_rate?: number | null
          created_at?: string | null
          development_phases?: Json | null
          discount_rate?: number | null
          forecast_duration_years?: number | null
          id?: string
          incremental_annual_costs?: number | null
          incremental_annual_revenue?: number | null
          is_new_product?: boolean
          monthly_fixed_costs?: number | null
          monthly_sales_forecast?: number | null
          product_id?: string
          regulatory_los?: number | null
          technical_los?: number | null
          unit_price?: number | null
          unit_variable_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_product_rnpv_inputs_bundle_rnpv_id_fkey"
            columns: ["bundle_rnpv_id"]
            isOneToOne: false
            referencedRelation: "bundle_rnpv_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_product_rnpv_inputs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "bundle_product_rnpv_inputs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_rnpv_analyses: {
        Row: {
          bundle_id: string
          company_id: string
          created_at: string | null
          id: string
          last_calculated_at: string | null
          product_breakdown: Json | null
          selected_currency: string
          total_costs: number | null
          total_development_costs: number | null
          total_nominal_npv: number | null
          total_revenue: number | null
          total_risk_adjusted_npv: number | null
          updated_at: string | null
          weighted_average_los: number | null
        }
        Insert: {
          bundle_id: string
          company_id: string
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          product_breakdown?: Json | null
          selected_currency?: string
          total_costs?: number | null
          total_development_costs?: number | null
          total_nominal_npv?: number | null
          total_revenue?: number | null
          total_risk_adjusted_npv?: number | null
          updated_at?: string | null
          weighted_average_los?: number | null
        }
        Update: {
          bundle_id?: string
          company_id?: string
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          product_breakdown?: Json | null
          selected_currency?: string
          total_costs?: number | null
          total_development_costs?: number | null
          total_nominal_npv?: number | null
          total_revenue?: number | null
          total_risk_adjusted_npv?: number | null
          updated_at?: string | null
          weighted_average_los?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_rnpv_analyses_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_canvas: {
        Row: {
          channels: string | null
          cost_structure: string | null
          created_at: string | null
          customer_relationships: string | null
          customer_segments: string | null
          generated_at: string | null
          id: string
          is_ai_generated: boolean | null
          key_activities: string | null
          key_partnerships: string | null
          key_resources: string | null
          last_modified: string | null
          product_id: string
          revenue_streams: string | null
          updated_at: string | null
          value_propositions: string | null
        }
        Insert: {
          channels?: string | null
          cost_structure?: string | null
          created_at?: string | null
          customer_relationships?: string | null
          customer_segments?: string | null
          generated_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          key_activities?: string | null
          key_partnerships?: string | null
          key_resources?: string | null
          last_modified?: string | null
          product_id: string
          revenue_streams?: string | null
          updated_at?: string | null
          value_propositions?: string | null
        }
        Update: {
          channels?: string | null
          cost_structure?: string | null
          created_at?: string | null
          customer_relationships?: string | null
          customer_segments?: string | null
          generated_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          key_activities?: string | null
          key_partnerships?: string | null
          key_resources?: string | null
          last_modified?: string | null
          product_id?: string
          revenue_streams?: string | null
          updated_at?: string | null
          value_propositions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_canvas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "business_canvas_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      calibration_instruments: {
        Row: {
          calibration_interval_months: number
          category: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          instrument_id_code: string
          instrument_name: string
          location: string
          manufacturer: string | null
          model: string | null
          notes: string | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          calibration_interval_months?: number
          category?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          instrument_id_code: string
          instrument_name: string
          location?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          calibration_interval_months?: number
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instrument_id_code?: string
          instrument_name?: string
          location?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibration_instruments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibration_instruments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      calibration_records: {
        Row: {
          calibration_date: string
          certificate_number: string | null
          created_at: string
          created_by: string | null
          id: string
          instrument_id: string
          next_due_date: string
          notes: string | null
          performed_by: string
          result: string
        }
        Insert: {
          calibration_date: string
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instrument_id: string
          next_due_date: string
          notes?: string | null
          performed_by?: string
          result?: string
        }
        Update: {
          calibration_date?: string
          certificate_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          instrument_id?: string
          next_due_date?: string
          notes?: string | null
          performed_by?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "calibration_records_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "calibration_instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      capa_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          capa_id: string
          completed_date: string | null
          completion_evidence: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          capa_id: string
          completed_date?: string | null
          completion_evidence?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          capa_id?: string
          completed_date?: string | null
          completion_evidence?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capa_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_actions_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
        ]
      }
      capa_evidence: {
        Row: {
          capa_id: string
          created_at: string | null
          description: string | null
          evidence_type: string
          file_name: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          capa_id: string
          created_at?: string | null
          description?: string | null
          evidence_type: string
          file_name: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          capa_id?: string
          created_at?: string | null
          description?: string | null
          evidence_type?: string
          file_name?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capa_evidence_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capa_priority_rationales: {
        Row: {
          approved_by: string | null
          capa_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          determination: string
          document_id: string
          event_description: string
          id: string
          is_override: boolean | null
          is_recurring: boolean | null
          override_reason: string | null
          promoted_to_capa: boolean
          qmsr_clause_reference: string | null
          rationale_text: string
          risk_assessment: Json
          source_event_id: string
          source_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          capa_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          determination: string
          document_id: string
          event_description: string
          id?: string
          is_override?: boolean | null
          is_recurring?: boolean | null
          override_reason?: string | null
          promoted_to_capa: boolean
          qmsr_clause_reference?: string | null
          rationale_text: string
          risk_assessment: Json
          source_event_id: string
          source_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          capa_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          determination?: string
          document_id?: string
          event_description?: string
          id?: string
          is_override?: boolean | null
          is_recurring?: boolean | null
          override_reason?: string | null
          promoted_to_capa?: boolean
          qmsr_clause_reference?: string | null
          rationale_text?: string
          risk_assessment?: Json
          source_event_id?: string
          source_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capa_priority_rationales_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_priority_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_priority_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      capa_records: {
        Row: {
          affected_documents: Json | null
          affected_requirements: Json | null
          capa_id: string
          capa_type: string
          closed_by: string | null
          closure_comments: string | null
          closure_date: string | null
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          immediate_correction: string | null
          investigation_team: Json | null
          owner_id: string | null
          probability: number | null
          problem_complexity: string | null
          problem_description: string
          product_id: string | null
          quality_approved: boolean | null
          quality_approved_at: string | null
          quality_approved_by: string | null
          quality_lead_id: string | null
          rca_data: Json | null
          rca_methodologies: string[] | null
          rca_methodology: string | null
          rca_override_reason: string | null
          rca_recommendation_followed: boolean | null
          regulatory_impact_description: string | null
          requires_regulatory_update: boolean | null
          root_cause_category: string | null
          root_cause_summary: string | null
          severity: number | null
          source_device_id: string | null
          source_id: string | null
          source_node_id: string | null
          source_type: string
          status: string
          target_closure_date: string | null
          target_implementation_date: string | null
          target_investigation_date: string | null
          target_verification_date: string | null
          technical_approved: boolean | null
          technical_approved_at: string | null
          technical_approved_by: string | null
          technical_lead_id: string | null
          updated_at: string | null
          voe_completion_date: string | null
          voe_evidence_ids: Json | null
          voe_plan: string | null
          voe_result: string | null
          voe_success_criteria: string | null
          voe_verified_by: string | null
        }
        Insert: {
          affected_documents?: Json | null
          affected_requirements?: Json | null
          capa_id: string
          capa_type: string
          closed_by?: string | null
          closure_comments?: string | null
          closure_date?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          immediate_correction?: string | null
          investigation_team?: Json | null
          owner_id?: string | null
          probability?: number | null
          problem_complexity?: string | null
          problem_description: string
          product_id?: string | null
          quality_approved?: boolean | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          quality_lead_id?: string | null
          rca_data?: Json | null
          rca_methodologies?: string[] | null
          rca_methodology?: string | null
          rca_override_reason?: string | null
          rca_recommendation_followed?: boolean | null
          regulatory_impact_description?: string | null
          requires_regulatory_update?: boolean | null
          root_cause_category?: string | null
          root_cause_summary?: string | null
          severity?: number | null
          source_device_id?: string | null
          source_id?: string | null
          source_node_id?: string | null
          source_type: string
          status?: string
          target_closure_date?: string | null
          target_implementation_date?: string | null
          target_investigation_date?: string | null
          target_verification_date?: string | null
          technical_approved?: boolean | null
          technical_approved_at?: string | null
          technical_approved_by?: string | null
          technical_lead_id?: string | null
          updated_at?: string | null
          voe_completion_date?: string | null
          voe_evidence_ids?: Json | null
          voe_plan?: string | null
          voe_result?: string | null
          voe_success_criteria?: string | null
          voe_verified_by?: string | null
        }
        Update: {
          affected_documents?: Json | null
          affected_requirements?: Json | null
          capa_id?: string
          capa_type?: string
          closed_by?: string | null
          closure_comments?: string | null
          closure_date?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          immediate_correction?: string | null
          investigation_team?: Json | null
          owner_id?: string | null
          probability?: number | null
          problem_complexity?: string | null
          problem_description?: string
          product_id?: string | null
          quality_approved?: boolean | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          quality_lead_id?: string | null
          rca_data?: Json | null
          rca_methodologies?: string[] | null
          rca_methodology?: string | null
          rca_override_reason?: string | null
          rca_recommendation_followed?: boolean | null
          regulatory_impact_description?: string | null
          requires_regulatory_update?: boolean | null
          root_cause_category?: string | null
          root_cause_summary?: string | null
          severity?: number | null
          source_device_id?: string | null
          source_id?: string | null
          source_node_id?: string | null
          source_type?: string
          status?: string
          target_closure_date?: string | null
          target_implementation_date?: string | null
          target_investigation_date?: string | null
          target_verification_date?: string | null
          technical_approved?: boolean | null
          technical_approved_at?: string | null
          technical_approved_by?: string | null
          technical_lead_id?: string | null
          updated_at?: string | null
          voe_completion_date?: string | null
          voe_evidence_ids?: Json | null
          voe_plan?: string | null
          voe_result?: string | null
          voe_success_criteria?: string | null
          voe_verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capa_records_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "capa_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "capa_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_quality_approved_by_fkey"
            columns: ["quality_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_quality_lead_id_fkey"
            columns: ["quality_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_source_device_id_fkey"
            columns: ["source_device_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "capa_records_source_device_id_fkey"
            columns: ["source_device_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_technical_approved_by_fkey"
            columns: ["technical_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_technical_lead_id_fkey"
            columns: ["technical_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_records_voe_verified_by_fkey"
            columns: ["voe_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capa_state_transitions: {
        Row: {
          capa_id: string
          created_at: string | null
          digital_signature: string | null
          from_status: string | null
          id: string
          to_status: string
          transition_reason: string | null
          transitioned_by: string
        }
        Insert: {
          capa_id: string
          created_at?: string | null
          digital_signature?: string | null
          from_status?: string | null
          id?: string
          to_status: string
          transition_reason?: string | null
          transitioned_by: string
        }
        Update: {
          capa_id?: string
          created_at?: string | null
          digital_signature?: string | null
          from_status?: string | null
          id?: string
          to_status?: string
          transition_reason?: string | null
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "capa_state_transitions_capa_id_fkey"
            columns: ["capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capa_state_transitions_transitioned_by_fkey"
            columns: ["transitioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          comments: Json | null
          description: string | null
          expiry_date: string | null
          id: string
          inserted_at: string
          name: string
          product_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          comments?: Json | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          inserted_at?: string
          name: string
          product_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          comments?: Json | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          inserted_at?: string
          name?: string
          product_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "certifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      change_control_requests: {
        Row: {
          affected_documents: Json | null
          affected_requirements: Json | null
          affected_specifications: Json | null
          ccr_id: string
          change_type: string
          closed_by: string | null
          closed_date: string | null
          company_id: string
          cost_impact: number | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          implementation_notes: string | null
          implementation_plan: string | null
          implemented_by: string | null
          implemented_date: string | null
          justification: string | null
          owner_id: string | null
          product_id: string | null
          quality_approved: boolean | null
          quality_approved_at: string | null
          quality_approved_by: string | null
          regulatory_approved: boolean | null
          regulatory_approved_at: string | null
          regulatory_approved_by: string | null
          regulatory_impact: boolean | null
          regulatory_impact_description: string | null
          risk_impact: string | null
          source_capa_id: string | null
          source_reference: string | null
          source_type: string
          status: string
          target_implementation_date: string | null
          target_object_id: string | null
          target_object_type: string | null
          technical_approved: boolean | null
          technical_approved_at: string | null
          technical_approved_by: string | null
          title: string
          updated_at: string | null
          verification_evidence: string | null
          verification_plan: string | null
          verified_by: string | null
          verified_date: string | null
        }
        Insert: {
          affected_documents?: Json | null
          affected_requirements?: Json | null
          affected_specifications?: Json | null
          ccr_id: string
          change_type: string
          closed_by?: string | null
          closed_date?: string | null
          company_id: string
          cost_impact?: number | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          implementation_notes?: string | null
          implementation_plan?: string | null
          implemented_by?: string | null
          implemented_date?: string | null
          justification?: string | null
          owner_id?: string | null
          product_id?: string | null
          quality_approved?: boolean | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          regulatory_approved?: boolean | null
          regulatory_approved_at?: string | null
          regulatory_approved_by?: string | null
          regulatory_impact?: boolean | null
          regulatory_impact_description?: string | null
          risk_impact?: string | null
          source_capa_id?: string | null
          source_reference?: string | null
          source_type?: string
          status?: string
          target_implementation_date?: string | null
          target_object_id?: string | null
          target_object_type?: string | null
          technical_approved?: boolean | null
          technical_approved_at?: string | null
          technical_approved_by?: string | null
          title: string
          updated_at?: string | null
          verification_evidence?: string | null
          verification_plan?: string | null
          verified_by?: string | null
          verified_date?: string | null
        }
        Update: {
          affected_documents?: Json | null
          affected_requirements?: Json | null
          affected_specifications?: Json | null
          ccr_id?: string
          change_type?: string
          closed_by?: string | null
          closed_date?: string | null
          company_id?: string
          cost_impact?: number | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          implementation_notes?: string | null
          implementation_plan?: string | null
          implemented_by?: string | null
          implemented_date?: string | null
          justification?: string | null
          owner_id?: string | null
          product_id?: string | null
          quality_approved?: boolean | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          regulatory_approved?: boolean | null
          regulatory_approved_at?: string | null
          regulatory_approved_by?: string | null
          regulatory_impact?: boolean | null
          regulatory_impact_description?: string | null
          risk_impact?: string | null
          source_capa_id?: string | null
          source_reference?: string | null
          source_type?: string
          status?: string
          target_implementation_date?: string | null
          target_object_id?: string | null
          target_object_type?: string | null
          technical_approved?: boolean | null
          technical_approved_at?: string | null
          technical_approved_by?: string | null
          title?: string
          updated_at?: string | null
          verification_evidence?: string | null
          verification_plan?: string | null
          verified_by?: string | null
          verified_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "change_control_requests_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "change_control_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_implemented_by_fkey"
            columns: ["implemented_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "change_control_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_quality_approved_by_fkey"
            columns: ["quality_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_regulatory_approved_by_fkey"
            columns: ["regulatory_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_source_capa_id_fkey"
            columns: ["source_capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_technical_approved_by_fkey"
            columns: ["technical_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_requests_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      change_control_state_transitions: {
        Row: {
          ccr_id: string
          created_at: string | null
          digital_signature: string | null
          from_status: string | null
          id: string
          to_status: string
          transition_reason: string | null
          transitioned_by: string
        }
        Insert: {
          ccr_id: string
          created_at?: string | null
          digital_signature?: string | null
          from_status?: string | null
          id?: string
          to_status: string
          transition_reason?: string | null
          transitioned_by: string
        }
        Update: {
          ccr_id?: string
          created_at?: string | null
          digital_signature?: string | null
          from_status?: string | null
          id?: string
          to_status?: string
          transition_reason?: string | null
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_control_state_transitions_ccr_id_fkey"
            columns: ["ccr_id"]
            isOneToOne: false
            referencedRelation: "change_control_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_control_state_transitions_transitioned_by_fkey"
            columns: ["transitioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ci_dependencies: {
        Row: {
          company_id: string
          created_at: string
          dependency_type: string
          description: string | null
          id: string
          source_ci_id: string
          target_ci_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          dependency_type: string
          description?: string | null
          id?: string
          source_ci_id: string
          target_ci_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dependency_type?: string
          description?: string | null
          id?: string
          source_ci_id?: string
          target_ci_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ci_dependencies_source_ci_id_fkey"
            columns: ["source_ci_id"]
            isOneToOne: false
            referencedRelation: "ci_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ci_dependencies_target_ci_id_fkey"
            columns: ["target_ci_id"]
            isOneToOne: false
            referencedRelation: "ci_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      ci_instances: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          instance_config: Json
          phase_id: string | null
          priority: string
          product_id: string | null
          status: string
          template_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          instance_config?: Json
          phase_id?: string | null
          priority: string
          product_id?: string | null
          status: string
          template_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          instance_config?: Json
          phase_id?: string | null
          priority?: string
          product_id?: string | null
          status?: string
          template_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ci_instances_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ci_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ci_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ci_templates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          priority: string
          template_config: Json
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority: string
          template_config?: Json
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          template_config?: Json
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinical_cro_partners: {
        Row: {
          company_id: string
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_preferred: boolean | null
          name: string
          performance_notes: string | null
          phone: string | null
          specialty_areas: string[] | null
          standard_agreement_path: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_preferred?: boolean | null
          name: string
          performance_notes?: string | null
          phone?: string | null
          specialty_areas?: string[] | null
          standard_agreement_path?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_preferred?: boolean | null
          name?: string
          performance_notes?: string | null
          phone?: string | null
          specialty_areas?: string[] | null
          standard_agreement_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_cro_partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_cro_partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_documentation_templates: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          file_path: string
          id: string
          is_active: boolean | null
          region: string | null
          study_type: Database["public"]["Enums"]["clinical_study_type"] | null
          template_name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          file_path: string
          id?: string
          is_active?: boolean | null
          region?: string | null
          study_type?: Database["public"]["Enums"]["clinical_study_type"] | null
          template_name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          file_path?: string
          id?: string
          is_active?: boolean | null
          region?: string | null
          study_type?: Database["public"]["Enums"]["clinical_study_type"] | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documentation_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documentation_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_notification_rules: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notification_message: string | null
          notification_recipients: Json | null
          rule_name: string
          trigger_conditions: Json | null
          trigger_event: Database["public"]["Enums"]["clinical_notification_trigger"]
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_message?: string | null
          notification_recipients?: Json | null
          rule_name: string
          trigger_conditions?: Json | null
          trigger_event: Database["public"]["Enums"]["clinical_notification_trigger"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notification_message?: string | null
          notification_recipients?: Json | null
          rule_name?: string
          trigger_conditions?: Json | null
          trigger_event?: Database["public"]["Enums"]["clinical_notification_trigger"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notification_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notification_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_protocol_templates: {
        Row: {
          approval_workflow: Json | null
          company_id: string
          created_at: string | null
          file_path: string
          id: string
          is_active: boolean | null
          required_sections: Json | null
          study_type: Database["public"]["Enums"]["clinical_study_type"] | null
          template_name: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          approval_workflow?: Json | null
          company_id: string
          created_at?: string | null
          file_path: string
          id?: string
          is_active?: boolean | null
          required_sections?: Json | null
          study_type?: Database["public"]["Enums"]["clinical_study_type"] | null
          template_name: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          approval_workflow?: Json | null
          company_id?: string
          created_at?: string | null
          file_path?: string
          id?: string
          is_active?: boolean | null
          required_sections?: Json | null
          study_type?: Database["public"]["Enums"]["clinical_study_type"] | null
          template_name?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_protocol_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_protocol_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_site_registry: {
        Row: {
          capabilities: string[] | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string
          notes: string | null
          pi_email: string | null
          pi_name: string | null
          pi_phone: string | null
          previous_trials_count: number | null
          qualification_status: string | null
          site_name: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          capabilities?: string[] | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          notes?: string | null
          pi_email?: string | null
          pi_name?: string | null
          pi_phone?: string | null
          previous_trials_count?: number | null
          qualification_status?: string | null
          site_name: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          capabilities?: string[] | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          notes?: string | null
          pi_email?: string | null
          pi_name?: string | null
          pi_phone?: string | null
          previous_trials_count?: number | null
          qualification_status?: string | null
          site_name?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_site_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_site_registry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_standard_endpoints: {
        Row: {
          category: string | null
          company_id: string
          created_at: string | null
          description: string | null
          endpoint_type: Database["public"]["Enums"]["clinical_endpoint_type"]
          id: string
          is_active: boolean | null
          measurement_criteria: string | null
          name: string
          regulatory_references: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          endpoint_type: Database["public"]["Enums"]["clinical_endpoint_type"]
          id?: string
          is_active?: boolean | null
          measurement_criteria?: string | null
          name: string
          regulatory_references?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          endpoint_type?: Database["public"]["Enums"]["clinical_endpoint_type"]
          id?: string
          is_active?: boolean | null
          measurement_criteria?: string | null
          name?: string
          regulatory_references?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_standard_endpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_standard_endpoints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_study_type_configs: {
        Row: {
          company_id: string
          created_at: string | null
          default_max_enrollment: number | null
          default_min_enrollment: number | null
          id: string
          is_enabled: boolean | null
          phase_progression_rules: Json | null
          required_documents: Json | null
          study_type: Database["public"]["Enums"]["clinical_study_type"]
          typical_timeline_months: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          default_max_enrollment?: number | null
          default_min_enrollment?: number | null
          id?: string
          is_enabled?: boolean | null
          phase_progression_rules?: Json | null
          required_documents?: Json | null
          study_type: Database["public"]["Enums"]["clinical_study_type"]
          typical_timeline_months?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          default_max_enrollment?: number | null
          default_min_enrollment?: number | null
          id?: string
          is_enabled?: boolean | null
          phase_progression_rules?: Json | null
          required_documents?: Json | null
          study_type?: Database["public"]["Enums"]["clinical_study_type"]
          typical_timeline_months?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_study_type_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_study_type_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      clinical_trials: {
        Row: {
          actual_completion_date: string | null
          actual_enrollment: number
          assigned_to: string | null
          company_id: string
          completion_percentage: number
          created_at: string
          created_by: string
          cro_name: string | null
          cro_partner_id: string | null
          description: string | null
          estimated_completion_date: string | null
          ethics_approval_date: string | null
          id: string
          notes: string | null
          phase_id: string | null
          primary_endpoint: string | null
          primary_endpoint_id: string | null
          principal_investigator: string | null
          priority: string
          product_id: string
          protocol_id: string
          secondary_endpoints: string[] | null
          site_ids: Json | null
          start_date: string | null
          status: string
          study_name: string
          study_phase: string
          study_sites: Json | null
          study_type: string
          study_type_config_id: string | null
          target_enrollment: number
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          actual_enrollment?: number
          assigned_to?: string | null
          company_id: string
          completion_percentage?: number
          created_at?: string
          created_by: string
          cro_name?: string | null
          cro_partner_id?: string | null
          description?: string | null
          estimated_completion_date?: string | null
          ethics_approval_date?: string | null
          id?: string
          notes?: string | null
          phase_id?: string | null
          primary_endpoint?: string | null
          primary_endpoint_id?: string | null
          principal_investigator?: string | null
          priority?: string
          product_id: string
          protocol_id: string
          secondary_endpoints?: string[] | null
          site_ids?: Json | null
          start_date?: string | null
          status?: string
          study_name: string
          study_phase: string
          study_sites?: Json | null
          study_type: string
          study_type_config_id?: string | null
          target_enrollment?: number
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          actual_enrollment?: number
          assigned_to?: string | null
          company_id?: string
          completion_percentage?: number
          created_at?: string
          created_by?: string
          cro_name?: string | null
          cro_partner_id?: string | null
          description?: string | null
          estimated_completion_date?: string | null
          ethics_approval_date?: string | null
          id?: string
          notes?: string | null
          phase_id?: string | null
          primary_endpoint?: string | null
          primary_endpoint_id?: string | null
          principal_investigator?: string | null
          priority?: string
          product_id?: string
          protocol_id?: string
          secondary_endpoints?: string[] | null
          site_ids?: Json | null
          start_date?: string | null
          status?: string
          study_name?: string
          study_phase?: string
          study_sites?: Json | null
          study_type?: string
          study_type_config_id?: string | null
          target_enrollment?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_trials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_trials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "clinical_trials_cro_partner_id_fkey"
            columns: ["cro_partner_id"]
            isOneToOne: false
            referencedRelation: "clinical_cro_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_trials_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_trials_primary_endpoint_id_fkey"
            columns: ["primary_endpoint_id"]
            isOneToOne: false
            referencedRelation: "clinical_standard_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_trials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "clinical_trials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_trials_study_type_config_id_fkey"
            columns: ["study_type_config_id"]
            isOneToOne: false
            referencedRelation: "clinical_study_type_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_threads: {
        Row: {
          created_at: string
          document_id: string
          id: string
          is_internal: boolean
          position: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          is_internal?: boolean
          position?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          is_internal?: boolean
          position?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_threads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_threads_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "comment_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_factor_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          suggested_los_range: string | null
          typical_timeline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          suggested_los_range?: string | null
          typical_timeline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          suggested_los_range?: string | null
          typical_timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commercial_forecasts: {
        Row: {
          company_id: string | null
          created_at: string | null
          forecast_month: string
          id: string
          scenario_type: string
          total_revenue: number
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          forecast_month: string
          id?: string
          scenario_type: string
          total_revenue?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          forecast_month?: string
          id?: string
          scenario_type?: string
          total_revenue?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_forecasts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      commercial_success_factors: {
        Row: {
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          estimated_timeline_months: number | null
          id: string
          is_active: boolean
          likelihood_of_success: number
          market_codes: Json | null
          name: string
          position: number
          product_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_timeline_months?: number | null
          id?: string
          is_active?: boolean
          likelihood_of_success?: number
          market_codes?: Json | null
          name: string
          position?: number
          product_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_timeline_months?: number | null
          id?: string
          is_active?: boolean
          likelihood_of_success?: number
          market_codes?: Json | null
          name?: string
          position?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_success_factors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "commercial_factor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          message_type: string | null
          reply_to_id: string | null
          sender_participant_id: string | null
          sender_user_id: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          message_type?: string | null
          reply_to_id?: string | null
          sender_participant_id?: string | null
          sender_user_id?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          message_type?: string | null
          reply_to_id?: string | null
          sender_participant_id?: string | null
          sender_user_id?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_sender_participant_id_fkey"
            columns: ["sender_participant_id"]
            isOneToOne: false
            referencedRelation: "thread_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_threads: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          last_activity_at: string | null
          product_id: string | null
          related_entity_id: string | null
          related_entity_name: string | null
          related_entity_type: string | null
          status: string | null
          thread_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_activity_at?: string | null
          product_id?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          status?: string | null
          thread_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_activity_at?: string | null
          product_id?: string | null
          related_entity_id?: string | null
          related_entity_name?: string | null
          related_entity_type?: string | null
          status?: string | null
          thread_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "communication_threads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "communication_threads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          app_url: string | null
          ar_address: string | null
          ar_city: string | null
          ar_country: string | null
          ar_name: string | null
          ar_postal_code: string | null
          archived_at: string | null
          archived_by: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          date_format: string | null
          default_markets: Json | null
          department_structure: Json | null
          description: string | null
          email: string | null
          id: string
          importers: Json | null
          inserted_at: string
          is_archived: boolean
          logo_url: string | null
          name: string
          notified_body_id: string | null
          phone: string | null
          postal_code: string | null
          production_site_address: string | null
          production_site_city: string | null
          production_site_country: string | null
          production_site_name: string | null
          production_site_postal_code: string | null
          srn: string | null
          stripe_customer_id: string | null
          subscription_plan: string | null
          telephone: string | null
          updated_at: string
          variant_field: Json | null
          website: string | null
        }
        Insert: {
          address?: string | null
          app_url?: string | null
          ar_address?: string | null
          ar_city?: string | null
          ar_country?: string | null
          ar_name?: string | null
          ar_postal_code?: string | null
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          date_format?: string | null
          default_markets?: Json | null
          department_structure?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          importers?: Json | null
          inserted_at?: string
          is_archived?: boolean
          logo_url?: string | null
          name: string
          notified_body_id?: string | null
          phone?: string | null
          postal_code?: string | null
          production_site_address?: string | null
          production_site_city?: string | null
          production_site_country?: string | null
          production_site_name?: string | null
          production_site_postal_code?: string | null
          srn?: string | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          telephone?: string | null
          updated_at?: string
          variant_field?: Json | null
          website?: string | null
        }
        Update: {
          address?: string | null
          app_url?: string | null
          ar_address?: string | null
          ar_city?: string | null
          ar_country?: string | null
          ar_name?: string | null
          ar_postal_code?: string | null
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          date_format?: string | null
          default_markets?: Json | null
          department_structure?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          importers?: Json | null
          inserted_at?: string
          is_archived?: boolean
          logo_url?: string | null
          name?: string
          notified_body_id?: string | null
          phone?: string | null
          postal_code?: string | null
          production_site_address?: string | null
          production_site_city?: string | null
          production_site_country?: string | null
          production_site_name?: string | null
          production_site_postal_code?: string | null
          srn?: string | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          telephone?: string | null
          updated_at?: string
          variant_field?: Json | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_notified_body_id_fkey"
            columns: ["notified_body_id"]
            isOneToOne: false
            referencedRelation: "notified_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_api_keys: {
        Row: {
          company_id: string
          created_at: string
          encrypted_key: string
          id: string
          key_type: string
          last_usage_at: string | null
          token_usage_data: Json | null
          updated_at: string
          usage_last_synced_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          encrypted_key: string
          id?: string
          key_type: string
          last_usage_at?: string | null
          token_usage_data?: Json | null
          updated_at?: string
          usage_last_synced_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          encrypted_key?: string
          id?: string
          key_type?: string
          last_usage_at?: string | null
          token_usage_data?: Json | null
          updated_at?: string
          usage_last_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_api_keys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_audit_templates: {
        Row: {
          audit_template_id: string
          company_id: string
          company_notes: string | null
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          audit_template_id: string
          company_id: string
          company_notes?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          audit_template_id?: string
          company_id?: string
          company_notes?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_audit_templates_audit_template_id_fkey"
            columns: ["audit_template_id"]
            isOneToOne: false
            referencedRelation: "audit_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      company_audits: {
        Row: {
          actual_audit_duration: string | null
          admin_approved: boolean | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          admin_comments: string | null
          audit_name: string
          audit_type: string
          close_out_actions_summary: string | null
          company_id: string
          completion_date: string | null
          created_at: string
          deadline_date: string | null
          end_date: string | null
          executive_summary: string | null
          id: string
          lead_auditor_name: string | null
          notes: string | null
          overall_assessment: string | null
          phase_id: string | null
          responsible_person_id: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_audit_duration?: string | null
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          audit_name: string
          audit_type: string
          close_out_actions_summary?: string | null
          company_id: string
          completion_date?: string | null
          created_at?: string
          deadline_date?: string | null
          end_date?: string | null
          executive_summary?: string | null
          id?: string
          lead_auditor_name?: string | null
          notes?: string | null
          overall_assessment?: string | null
          phase_id?: string | null
          responsible_person_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_audit_duration?: string | null
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          audit_name?: string
          audit_type?: string
          close_out_actions_summary?: string | null
          company_id?: string
          completion_date?: string | null
          created_at?: string
          deadline_date?: string | null
          end_date?: string | null
          executive_summary?: string | null
          id?: string
          lead_auditor_name?: string | null
          notes?: string | null
          overall_assessment?: string | null
          phase_id?: string | null
          responsible_person_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_audits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_audits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_audits_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      company_business_canvas: {
        Row: {
          channels: string | null
          company_id: string
          cost_structure: string | null
          created_at: string | null
          customer_relationships: string | null
          customer_segments: string | null
          id: string
          key_activities: string | null
          key_partners: string | null
          key_resources: string | null
          revenue_streams: string | null
          updated_at: string | null
          value_propositions: string | null
        }
        Insert: {
          channels?: string | null
          company_id: string
          cost_structure?: string | null
          created_at?: string | null
          customer_relationships?: string | null
          customer_segments?: string | null
          id?: string
          key_activities?: string | null
          key_partners?: string | null
          key_resources?: string | null
          revenue_streams?: string | null
          updated_at?: string | null
          value_propositions?: string | null
        }
        Update: {
          channels?: string | null
          company_id?: string
          cost_structure?: string | null
          created_at?: string | null
          customer_relationships?: string | null
          customer_segments?: string | null
          id?: string
          key_activities?: string | null
          key_partners?: string | null
          key_resources?: string | null
          revenue_streams?: string | null
          updated_at?: string | null
          value_propositions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_business_canvas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_business_canvas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_category_preferences: {
        Row: {
          category_value: string
          company_id: string
          created_at: string
          custom_description: string | null
          id: string
          is_enabled: boolean
          updated_at: string
        }
        Insert: {
          category_value: string
          company_id: string
          created_at?: string
          custom_description?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Update: {
          category_value?: string
          company_id?: string
          created_at?: string
          custom_description?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      company_chosen_phases: {
        Row: {
          company_id: string
          created_at: string
          id: string
          phase_id: string
          position: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          phase_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          phase_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_chosen_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_chosen_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_chosen_phases_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cost_template_overrides: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          override_cost: number
          override_justification: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          override_cost: number
          override_justification?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          override_cost?: number
          override_justification?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_cost_template_overrides_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "regulatory_cost_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      company_device_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          markets: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          markets?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          markets?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_device_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_device_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_document_phase_preferences: {
        Row: {
          company_id: string
          created_at: string | null
          document_name: string
          id: string
          is_active_for_company: boolean | null
          phase_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_name: string
          id?: string
          is_active_for_company?: boolean | null
          phase_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_name?: string
          id?: string
          is_active_for_company?: boolean | null
          phase_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_document_phase_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_document_phase_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_document_phase_preferences_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      company_document_templates: {
        Row: {
          classes_by_market: Json | null
          company_id: string
          created_at: string | null
          description: string | null
          document_type: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_user_removed: boolean | null
          markets: Json | null
          name: string
          public_url: string | null
          scope: string | null
          structure: Json | null
          tech_applicability: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          classes_by_market?: Json | null
          company_id: string
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_user_removed?: boolean | null
          markets?: Json | null
          name: string
          public_url?: string | null
          scope?: string | null
          structure?: Json | null
          tech_applicability?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          classes_by_market?: Json | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_user_removed?: boolean | null
          markets?: Json | null
          name?: string
          public_url?: string | null
          scope?: string | null
          structure?: Json | null
          tech_applicability?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_funding_applications: {
        Row: {
          checklist_responses: Json | null
          company_id: string
          created_at: string | null
          created_by: string | null
          eligibility_score: number | null
          id: string
          notes: string | null
          programme_id: string
          requested_amount: number | null
          status: string
          submission_deadline: string | null
          target_call: string | null
          updated_at: string | null
          workspace_items: Json | null
        }
        Insert: {
          checklist_responses?: Json | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          eligibility_score?: number | null
          id?: string
          notes?: string | null
          programme_id: string
          requested_amount?: number | null
          status?: string
          submission_deadline?: string | null
          target_call?: string | null
          updated_at?: string | null
          workspace_items?: Json | null
        }
        Update: {
          checklist_responses?: Json | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          eligibility_score?: number | null
          id?: string
          notes?: string | null
          programme_id?: string
          requested_amount?: number | null
          status?: string
          submission_deadline?: string | null
          target_call?: string | null
          updated_at?: string | null
          workspace_items?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "company_funding_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_funding_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_funding_applications_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "funding_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      company_gap_templates: {
        Row: {
          company_id: string
          company_notes: string | null
          created_at: string
          id: string
          is_enabled: boolean
          template_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          company_notes?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          template_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          company_notes?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_gap_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_gap_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_gap_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "gap_analysis_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      company_investor_share_settings: {
        Row: {
          access_code_hash: string | null
          auto_grant_monitor_access: boolean | null
          company_id: string
          created_at: string | null
          current_phase: string | null
          expires_at: string | null
          featured_product_id: string | null
          funding_amount: number | null
          funding_currency: string | null
          funding_stage: string | null
          id: string
          is_active: boolean | null
          list_on_marketplace: boolean | null
          marketplace_categories: string[] | null
          marketplace_expires_at: string | null
          marketplace_listed_at: string | null
          marketplace_slug: string | null
          mp_funding_amount: number | null
          mp_funding_currency: string | null
          mp_funding_stage: string | null
          mp_show_business_canvas: boolean | null
          mp_show_clinical_evidence: boolean | null
          mp_show_gtm_strategy: boolean | null
          mp_show_key_risks: boolean | null
          mp_show_manufacturing: boolean | null
          mp_show_market_sizing: boolean | null
          mp_show_media_gallery: boolean | null
          mp_show_readiness_gates: boolean | null
          mp_show_regulatory_timeline: boolean | null
          mp_show_reimbursement_strategy: boolean | null
          mp_show_roadmap: boolean | null
          mp_show_team_gaps: boolean | null
          mp_show_team_profile: boolean | null
          mp_show_technical_specs: boolean | null
          mp_show_unit_economics: boolean | null
          mp_show_use_of_proceeds: boolean | null
          mp_show_venture_blueprint: boolean | null
          mp_show_viability_score: boolean | null
          phase_dates: Json | null
          public_slug: string | null
          show_burn_rate: boolean | null
          show_business_canvas: boolean | null
          show_clinical_enrollment: boolean | null
          show_clinical_evidence: boolean | null
          show_competitor_analysis: boolean | null
          show_customer_segments: boolean | null
          show_device_description: boolean | null
          show_device_type: boolean | null
          show_exit_strategy: boolean | null
          show_gtm_strategy: boolean | null
          show_key_risks: boolean | null
          show_manufacturing: boolean | null
          show_market_sizing: boolean | null
          show_media_gallery: boolean | null
          show_readiness_gates: boolean | null
          show_regulatory_status_map: boolean | null
          show_regulatory_timeline: boolean | null
          show_reimbursement_strategy: boolean | null
          show_revenue_chart: boolean | null
          show_risk_summary: boolean | null
          show_rnpv: boolean | null
          show_roadmap: boolean | null
          show_team_gaps: boolean | null
          show_team_profile: boolean | null
          show_technical_specs: boolean | null
          show_trl_architecture: boolean | null
          show_unit_economics: boolean | null
          show_use_of_proceeds: boolean | null
          show_venture_blueprint: boolean
          show_viability_score: boolean | null
          timeline_auto_sync: boolean | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          access_code_hash?: string | null
          auto_grant_monitor_access?: boolean | null
          company_id: string
          created_at?: string | null
          current_phase?: string | null
          expires_at?: string | null
          featured_product_id?: string | null
          funding_amount?: number | null
          funding_currency?: string | null
          funding_stage?: string | null
          id?: string
          is_active?: boolean | null
          list_on_marketplace?: boolean | null
          marketplace_categories?: string[] | null
          marketplace_expires_at?: string | null
          marketplace_listed_at?: string | null
          marketplace_slug?: string | null
          mp_funding_amount?: number | null
          mp_funding_currency?: string | null
          mp_funding_stage?: string | null
          mp_show_business_canvas?: boolean | null
          mp_show_clinical_evidence?: boolean | null
          mp_show_gtm_strategy?: boolean | null
          mp_show_key_risks?: boolean | null
          mp_show_manufacturing?: boolean | null
          mp_show_market_sizing?: boolean | null
          mp_show_media_gallery?: boolean | null
          mp_show_readiness_gates?: boolean | null
          mp_show_regulatory_timeline?: boolean | null
          mp_show_reimbursement_strategy?: boolean | null
          mp_show_roadmap?: boolean | null
          mp_show_team_gaps?: boolean | null
          mp_show_team_profile?: boolean | null
          mp_show_technical_specs?: boolean | null
          mp_show_unit_economics?: boolean | null
          mp_show_use_of_proceeds?: boolean | null
          mp_show_venture_blueprint?: boolean | null
          mp_show_viability_score?: boolean | null
          phase_dates?: Json | null
          public_slug?: string | null
          show_burn_rate?: boolean | null
          show_business_canvas?: boolean | null
          show_clinical_enrollment?: boolean | null
          show_clinical_evidence?: boolean | null
          show_competitor_analysis?: boolean | null
          show_customer_segments?: boolean | null
          show_device_description?: boolean | null
          show_device_type?: boolean | null
          show_exit_strategy?: boolean | null
          show_gtm_strategy?: boolean | null
          show_key_risks?: boolean | null
          show_manufacturing?: boolean | null
          show_market_sizing?: boolean | null
          show_media_gallery?: boolean | null
          show_readiness_gates?: boolean | null
          show_regulatory_status_map?: boolean | null
          show_regulatory_timeline?: boolean | null
          show_reimbursement_strategy?: boolean | null
          show_revenue_chart?: boolean | null
          show_risk_summary?: boolean | null
          show_rnpv?: boolean | null
          show_roadmap?: boolean | null
          show_team_gaps?: boolean | null
          show_team_profile?: boolean | null
          show_technical_specs?: boolean | null
          show_trl_architecture?: boolean | null
          show_unit_economics?: boolean | null
          show_use_of_proceeds?: boolean | null
          show_venture_blueprint?: boolean
          show_viability_score?: boolean | null
          timeline_auto_sync?: boolean | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          access_code_hash?: string | null
          auto_grant_monitor_access?: boolean | null
          company_id?: string
          created_at?: string | null
          current_phase?: string | null
          expires_at?: string | null
          featured_product_id?: string | null
          funding_amount?: number | null
          funding_currency?: string | null
          funding_stage?: string | null
          id?: string
          is_active?: boolean | null
          list_on_marketplace?: boolean | null
          marketplace_categories?: string[] | null
          marketplace_expires_at?: string | null
          marketplace_listed_at?: string | null
          marketplace_slug?: string | null
          mp_funding_amount?: number | null
          mp_funding_currency?: string | null
          mp_funding_stage?: string | null
          mp_show_business_canvas?: boolean | null
          mp_show_clinical_evidence?: boolean | null
          mp_show_gtm_strategy?: boolean | null
          mp_show_key_risks?: boolean | null
          mp_show_manufacturing?: boolean | null
          mp_show_market_sizing?: boolean | null
          mp_show_media_gallery?: boolean | null
          mp_show_readiness_gates?: boolean | null
          mp_show_regulatory_timeline?: boolean | null
          mp_show_reimbursement_strategy?: boolean | null
          mp_show_roadmap?: boolean | null
          mp_show_team_gaps?: boolean | null
          mp_show_team_profile?: boolean | null
          mp_show_technical_specs?: boolean | null
          mp_show_unit_economics?: boolean | null
          mp_show_use_of_proceeds?: boolean | null
          mp_show_venture_blueprint?: boolean | null
          mp_show_viability_score?: boolean | null
          phase_dates?: Json | null
          public_slug?: string | null
          show_burn_rate?: boolean | null
          show_business_canvas?: boolean | null
          show_clinical_enrollment?: boolean | null
          show_clinical_evidence?: boolean | null
          show_competitor_analysis?: boolean | null
          show_customer_segments?: boolean | null
          show_device_description?: boolean | null
          show_device_type?: boolean | null
          show_exit_strategy?: boolean | null
          show_gtm_strategy?: boolean | null
          show_key_risks?: boolean | null
          show_manufacturing?: boolean | null
          show_market_sizing?: boolean | null
          show_media_gallery?: boolean | null
          show_readiness_gates?: boolean | null
          show_regulatory_status_map?: boolean | null
          show_regulatory_timeline?: boolean | null
          show_reimbursement_strategy?: boolean | null
          show_revenue_chart?: boolean | null
          show_risk_summary?: boolean | null
          show_rnpv?: boolean | null
          show_roadmap?: boolean | null
          show_team_gaps?: boolean | null
          show_team_profile?: boolean | null
          show_technical_specs?: boolean | null
          show_trl_architecture?: boolean | null
          show_unit_economics?: boolean | null
          show_use_of_proceeds?: boolean | null
          show_venture_blueprint?: boolean
          show_viability_score?: boolean | null
          timeline_auto_sync?: boolean | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_investor_share_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_investor_share_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_investor_share_settings_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "company_investor_share_settings_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      company_phases: {
        Row: {
          assigned_to: string | null
          budget_currency: string | null
          category_id: string | null
          company_id: string
          compliance_section_ids: string[] | null
          cost_category: string | null
          created_at: string | null
          description: string | null
          duration_days: number
          end_date: string | null
          end_percentage: number | null
          end_phase_id: string | null
          end_position: string | null
          estimated_budget: number | null
          id: string
          is_active: boolean
          is_continuous_process: boolean | null
          is_custom: boolean | null
          is_deletable: boolean | null
          is_predefined_core_phase: boolean | null
          name: string
          position: number
          reviewer_group_id: string | null
          start_date: string | null
          start_percentage: number | null
          start_phase_id: string | null
          start_position: string | null
          sub_section_id: string | null
          typical_duration_days: number | null
          typical_start_day: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget_currency?: string | null
          category_id?: string | null
          company_id: string
          compliance_section_ids?: string[] | null
          cost_category?: string | null
          created_at?: string | null
          description?: string | null
          duration_days: number
          end_date?: string | null
          end_percentage?: number | null
          end_phase_id?: string | null
          end_position?: string | null
          estimated_budget?: number | null
          id?: string
          is_active?: boolean
          is_continuous_process?: boolean | null
          is_custom?: boolean | null
          is_deletable?: boolean | null
          is_predefined_core_phase?: boolean | null
          name: string
          position?: number
          reviewer_group_id?: string | null
          start_date?: string | null
          start_percentage?: number | null
          start_phase_id?: string | null
          start_position?: string | null
          sub_section_id?: string | null
          typical_duration_days?: number | null
          typical_start_day?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget_currency?: string | null
          category_id?: string | null
          company_id?: string
          compliance_section_ids?: string[] | null
          cost_category?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number
          end_date?: string | null
          end_percentage?: number | null
          end_phase_id?: string | null
          end_position?: string | null
          estimated_budget?: number | null
          id?: string
          is_active?: boolean
          is_continuous_process?: boolean | null
          is_custom?: boolean | null
          is_deletable?: boolean | null
          is_predefined_core_phase?: boolean | null
          name?: string
          position?: number
          reviewer_group_id?: string | null
          start_date?: string | null
          start_percentage?: number | null
          start_phase_id?: string | null
          start_position?: string | null
          sub_section_id?: string | null
          typical_duration_days?: number | null
          typical_start_day?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_phases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_phases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "phase_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_phases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_phases_end_phase_id_fkey"
            columns: ["end_phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_phases_reviewer_group_id_fkey"
            columns: ["reviewer_group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_phases_start_phase_id_fkey"
            columns: ["start_phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_phases_sub_section_id_fkey"
            columns: ["sub_section_id"]
            isOneToOne: false
            referencedRelation: "phase_sub_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      company_platforms: {
        Row: {
          company_id: string
          core_documents: Json | null
          created_at: string | null
          description: string | null
          id: string
          markets: Json | null
          name: string
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          company_id: string
          core_documents?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          markets?: Json | null
          name: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          company_id?: string
          core_documents?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          markets?: Json | null
          name?: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_platforms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_platforms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_product_models: {
        Row: {
          basic_udi_di: string | null
          company_id: string
          contraindications: string[] | null
          created_at: string | null
          description: string | null
          id: string
          intended_purpose_data: Json | null
          intended_use: string | null
          intended_users: Json | null
          is_active: boolean | null
          is_classification_model_level: boolean | null
          is_clinical_benefits_model_level: boolean | null
          is_contraindications_model_level: boolean | null
          is_device_components_model_level: boolean | null
          is_duration_of_use_model_level: boolean | null
          is_environment_of_use_model_level: boolean | null
          is_intended_use_model_level: boolean | null
          is_intended_users_model_level: boolean | null
          is_shelf_life_model_level: boolean | null
          is_storage_sterility_model_level: boolean | null
          is_technical_specs_model_level: boolean | null
          is_warnings_model_level: boolean | null
          markets: Json | null
          mode_of_action: string | null
          model_code: string | null
          model_price: number | null
          name: string
          precautions: string | null
          primary_product_id: string | null
          regulatory_class: string | null
          risk_class: string | null
          updated_at: string | null
          variant_count: number | null
          warnings: string | null
        }
        Insert: {
          basic_udi_di?: string | null
          company_id: string
          contraindications?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          intended_purpose_data?: Json | null
          intended_use?: string | null
          intended_users?: Json | null
          is_active?: boolean | null
          is_classification_model_level?: boolean | null
          is_clinical_benefits_model_level?: boolean | null
          is_contraindications_model_level?: boolean | null
          is_device_components_model_level?: boolean | null
          is_duration_of_use_model_level?: boolean | null
          is_environment_of_use_model_level?: boolean | null
          is_intended_use_model_level?: boolean | null
          is_intended_users_model_level?: boolean | null
          is_shelf_life_model_level?: boolean | null
          is_storage_sterility_model_level?: boolean | null
          is_technical_specs_model_level?: boolean | null
          is_warnings_model_level?: boolean | null
          markets?: Json | null
          mode_of_action?: string | null
          model_code?: string | null
          model_price?: number | null
          name: string
          precautions?: string | null
          primary_product_id?: string | null
          regulatory_class?: string | null
          risk_class?: string | null
          updated_at?: string | null
          variant_count?: number | null
          warnings?: string | null
        }
        Update: {
          basic_udi_di?: string | null
          company_id?: string
          contraindications?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          intended_purpose_data?: Json | null
          intended_use?: string | null
          intended_users?: Json | null
          is_active?: boolean | null
          is_classification_model_level?: boolean | null
          is_clinical_benefits_model_level?: boolean | null
          is_contraindications_model_level?: boolean | null
          is_device_components_model_level?: boolean | null
          is_duration_of_use_model_level?: boolean | null
          is_environment_of_use_model_level?: boolean | null
          is_intended_use_model_level?: boolean | null
          is_intended_users_model_level?: boolean | null
          is_shelf_life_model_level?: boolean | null
          is_storage_sterility_model_level?: boolean | null
          is_technical_specs_model_level?: boolean | null
          is_warnings_model_level?: boolean | null
          markets?: Json | null
          mode_of_action?: string | null
          model_code?: string | null
          model_price?: number | null
          name?: string
          precautions?: string | null
          primary_product_id?: string | null
          regulatory_class?: string | null
          risk_class?: string | null
          updated_at?: string | null
          variant_count?: number | null
          warnings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_product_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_product_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_product_models_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "company_product_models_primary_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      company_release_adoptions: {
        Row: {
          adopted_at: string
          adopted_by: string | null
          company_id: string
          created_at: string
          id: string
          release_id: string
          status: string
          updated_at: string
        }
        Insert: {
          adopted_at?: string
          adopted_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          release_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          adopted_at?: string
          adopted_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          release_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_release_adoptions_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "xyreg_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      company_roles: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          is_system_role: boolean | null
          role_key: string
          role_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_system_role?: boolean | null
          role_key: string
          role_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          is_system_role?: boolean | null
          role_key?: string
          role_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      company_venture_blueprints: {
        Row: {
          activity_files: Json | null
          activity_notes: Json | null
          company_id: string
          completed_activities: number[] | null
          created_at: string | null
          id: string
          last_updated: string | null
          updated_at: string | null
        }
        Insert: {
          activity_files?: Json | null
          activity_notes?: Json | null
          company_id: string
          completed_activities?: number[] | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_files?: Json | null
          activity_notes?: Json | null
          company_id?: string
          completed_activities?: number[] | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_document_sections: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          phase_id: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          phase_id?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          phase_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_document_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_document_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "compliance_document_sections_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_frameworks: {
        Row: {
          created_at: string | null
          description: string | null
          framework_code: string
          framework_config: Json | null
          framework_name: string
          id: string
          is_active: boolean | null
          jurisdiction: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          framework_code: string
          framework_config?: Json | null
          framework_name: string
          id?: string
          is_active?: boolean | null
          jurisdiction: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          framework_code?: string
          framework_config?: Json | null
          framework_name?: string
          id?: string
          is_active?: boolean | null
          jurisdiction?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      contextual_suggestions: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          company_id: string
          confidence_score: number | null
          created_at: string | null
          description: string
          id: string
          is_actioned: boolean | null
          report_id: string
          suggested_action: Json
          suggestion_type: string
          target_module: string
          title: string
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          company_id: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          id?: string
          is_actioned?: boolean | null
          report_id: string
          suggested_action: Json
          suggestion_type: string
          target_module: string
          title: string
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          company_id?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          id?: string
          is_actioned?: boolean | null
          report_id?: string
          suggested_action?: Json
          suggestion_type?: string
          target_module?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contextual_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contextual_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contextual_suggestions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "market_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      core_module_dependency_matrix: {
        Row: {
          core_service_id: string
          core_service_name: string
          created_at: string
          id: string
          module_group_id: string
          propagation_type: string
          validation_criticality: string
        }
        Insert: {
          core_service_id: string
          core_service_name: string
          created_at?: string
          id?: string
          module_group_id: string
          propagation_type?: string
          validation_criticality?: string
        }
        Update: {
          core_service_id?: string
          core_service_name?: string
          created_at?: string
          id?: string
          module_group_id?: string
          propagation_type?: string
          validation_criticality?: string
        }
        Relationships: []
      }
      countries_regulatory: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          harmonized_standards: Json | null
          id: string
          iso_alpha_2: string
          iso_alpha_3: string
          medical_device_authority: string | null
          region: string
          registration_required: boolean | null
          regulatory_framework: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          harmonized_standards?: Json | null
          id?: string
          iso_alpha_2: string
          iso_alpha_3: string
          medical_device_authority?: string | null
          region: string
          registration_required?: boolean | null
          regulatory_framework?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          harmonized_standards?: Json | null
          id?: string
          iso_alpha_2?: string
          iso_alpha_3?: string
          medical_device_authority?: string | null
          region?: string
          registration_required?: boolean | null
          regulatory_framework?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          default_value: string | null
          display_conditions: Json | null
          display_order: number | null
          field_group: string | null
          field_group_order: number | null
          field_key: string
          field_label: string
          field_type: string
          help_text: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          module_type: string
          options: Json | null
          placeholder: string | null
          scope_config: Json | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          display_conditions?: Json | null
          display_order?: number | null
          field_group?: string | null
          field_group_order?: number | null
          field_key: string
          field_label: string
          field_type: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          module_type: string
          options?: Json | null
          placeholder?: string | null
          scope_config?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          display_conditions?: Json | null
          display_order?: number | null
          field_group?: string | null
          field_group_order?: number | null
          field_key?: string
          field_label?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          module_type?: string
          options?: Json | null
          placeholder?: string | null
          scope_config?: Json | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          field_definition_id: string
          id: string
          updated_at: string | null
          value_boolean: boolean | null
          value_date: string | null
          value_datetime: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
          value_time: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          field_definition_id: string
          id?: string
          updated_at?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_datetime?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
          value_time?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          field_definition_id?: string
          id?: string
          updated_at?: string | null
          value_boolean?: boolean | null
          value_date?: string | null
          value_datetime?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
          value_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_validation_records: {
        Row: {
          company_id: string
          conditions: string | null
          created_at: string
          id: string
          invalidated_by_core: boolean
          invalidated_core_service: string | null
          iq_approver_id: string | null
          iq_approver_meaning: string | null
          iq_approver_signed_at: string | null
          iq_initiator_id: string | null
          iq_initiator_meaning: string | null
          iq_initiator_signed_at: string | null
          iq_rationale: Json | null
          module_group: string
          oq_approver_id: string | null
          oq_approver_meaning: string | null
          oq_approver_signed_at: string | null
          oq_initiator_id: string | null
          oq_initiator_meaning: string | null
          oq_initiator_signed_at: string | null
          oq_rationale: Json | null
          overall_rationale: string | null
          overall_verdict: string | null
          pq_approver_id: string | null
          pq_approver_meaning: string | null
          pq_approver_signed_at: string | null
          pq_initiator_id: string | null
          pq_initiator_meaning: string | null
          pq_initiator_signed_at: string | null
          pq_rationale: Json | null
          release_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          company_id: string
          conditions?: string | null
          created_at?: string
          id?: string
          invalidated_by_core?: boolean
          invalidated_core_service?: string | null
          iq_approver_id?: string | null
          iq_approver_meaning?: string | null
          iq_approver_signed_at?: string | null
          iq_initiator_id?: string | null
          iq_initiator_meaning?: string | null
          iq_initiator_signed_at?: string | null
          iq_rationale?: Json | null
          module_group: string
          oq_approver_id?: string | null
          oq_approver_meaning?: string | null
          oq_approver_signed_at?: string | null
          oq_initiator_id?: string | null
          oq_initiator_meaning?: string | null
          oq_initiator_signed_at?: string | null
          oq_rationale?: Json | null
          overall_rationale?: string | null
          overall_verdict?: string | null
          pq_approver_id?: string | null
          pq_approver_meaning?: string | null
          pq_approver_signed_at?: string | null
          pq_initiator_id?: string | null
          pq_initiator_meaning?: string | null
          pq_initiator_signed_at?: string | null
          pq_rationale?: Json | null
          release_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          company_id?: string
          conditions?: string | null
          created_at?: string
          id?: string
          invalidated_by_core?: boolean
          invalidated_core_service?: string | null
          iq_approver_id?: string | null
          iq_approver_meaning?: string | null
          iq_approver_signed_at?: string | null
          iq_initiator_id?: string | null
          iq_initiator_meaning?: string | null
          iq_initiator_signed_at?: string | null
          iq_rationale?: Json | null
          module_group?: string
          oq_approver_id?: string | null
          oq_approver_meaning?: string | null
          oq_approver_signed_at?: string | null
          oq_initiator_id?: string | null
          oq_initiator_meaning?: string | null
          oq_initiator_signed_at?: string | null
          oq_rationale?: Json | null
          overall_rationale?: string | null
          overall_verdict?: string | null
          pq_approver_id?: string | null
          pq_approver_meaning?: string | null
          pq_approver_signed_at?: string | null
          pq_initiator_id?: string | null
          pq_initiator_meaning?: string | null
          pq_initiator_signed_at?: string | null
          pq_rationale?: Json | null
          release_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_validation_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_validation_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "customer_validation_records_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "vendor_validation_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_access: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string
          access_level: string
          access_token: string
          can_download: boolean
          created_at: string
          created_by: string | null
          data_room_id: string
          id: string
          investor_email: string
          investor_name: string | null
          investor_organization: string | null
          last_accessed_at: string | null
          status: string
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string
          access_level?: string
          access_token: string
          can_download?: boolean
          created_at?: string
          created_by?: string | null
          data_room_id: string
          id?: string
          investor_email: string
          investor_name?: string | null
          investor_organization?: string | null
          last_accessed_at?: string | null
          status?: string
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string
          access_level?: string
          access_token?: string
          can_download?: boolean
          created_at?: string
          created_by?: string | null
          data_room_id?: string
          id?: string
          investor_email?: string
          investor_name?: string | null
          investor_organization?: string | null
          last_accessed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_room_access_data_room_id_fkey"
            columns: ["data_room_id"]
            isOneToOne: false
            referencedRelation: "data_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_activity_log: {
        Row: {
          action: string
          content_id: string | null
          content_title: string | null
          data_room_id: string
          id: string
          investor_email: string
          ip_address: string | null
          metadata: Json
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: string
          content_id?: string | null
          content_title?: string | null
          data_room_id: string
          id?: string
          investor_email: string
          ip_address?: string | null
          metadata?: Json
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          content_id?: string | null
          content_title?: string | null
          data_room_id?: string
          id?: string
          investor_email?: string
          ip_address?: string | null
          metadata?: Json
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_room_activity_log_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "data_room_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_room_activity_log_data_room_id_fkey"
            columns: ["data_room_id"]
            isOneToOne: false
            referencedRelation: "data_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_content: {
        Row: {
          auto_refresh: boolean | null
          content_source: string
          content_type: string
          created_at: string
          data_room_id: string
          display_order: number
          document_description: string | null
          document_title: string
          file_path: string | null
          generated_at: string | null
          id: string
          is_visible: boolean
          metadata: Json
          product_id: string | null
          source_data_query: Json | null
        }
        Insert: {
          auto_refresh?: boolean | null
          content_source?: string
          content_type: string
          created_at?: string
          data_room_id: string
          display_order?: number
          document_description?: string | null
          document_title: string
          file_path?: string | null
          generated_at?: string | null
          id?: string
          is_visible?: boolean
          metadata?: Json
          product_id?: string | null
          source_data_query?: Json | null
        }
        Update: {
          auto_refresh?: boolean | null
          content_source?: string
          content_type?: string
          created_at?: string
          data_room_id?: string
          display_order?: number
          document_description?: string | null
          document_title?: string
          file_path?: string | null
          generated_at?: string | null
          id?: string
          is_visible?: boolean
          metadata?: Json
          product_id?: string | null
          source_data_query?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_room_content_data_room_id_fkey"
            columns: ["data_room_id"]
            isOneToOne: false
            referencedRelation: "data_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_room_content_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "data_room_content_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      data_rooms: {
        Row: {
          access_end_date: string | null
          access_start_date: string | null
          branding_logo_url: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          access_end_date?: string | null
          access_start_date?: string | null
          branding_logo_url?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_end_date?: string | null
          access_start_date?: string | null
          branding_logo_url?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      default_company_document_template: {
        Row: {
          created_at: string
          description: string | null
          document_type: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          inserted_at: string
          name: string
          phase_id: string[] | null
          public_url: string | null
          scope: string | null
          updated_at: string
          updated_by: string | null
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          inserted_at?: string
          name: string
          phase_id?: string[] | null
          public_url?: string | null
          scope?: string | null
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          inserted_at?: string
          name?: string
          phase_id?: string[] | null
          public_url?: string | null
          scope?: string | null
          updated_at?: string
          updated_by?: string | null
          uploaded_at?: string | null
        }
        Relationships: []
      }
      default_document_templates: {
        Row: {
          classes_by_market: Json | null
          created_at: string | null
          description: string | null
          document_type: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          markets: Json | null
          name: string
          public_url: string | null
          scope: string | null
          tech_applicability: string | null
          template_category: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          classes_by_market?: Json | null
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          markets?: Json | null
          name: string
          public_url?: string | null
          scope?: string | null
          tech_applicability?: string | null
          template_category?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          classes_by_market?: Json | null
          created_at?: string | null
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          markets?: Json | null
          name?: string
          public_url?: string | null
          scope?: string | null
          tech_applicability?: string | null
          template_category?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      defects: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          defect_id: string
          defect_type: string | null
          description: string
          discovered_in_phase: string | null
          id: string
          jira_issue_key: string | null
          linked_capa_id: string | null
          linked_ccr_id: string | null
          linked_hazard_id: string | null
          priority: string
          product_id: string
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          severity: string
          status: string
          test_case_id: string | null
          test_execution_id: string | null
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          defect_id: string
          defect_type?: string | null
          description: string
          discovered_in_phase?: string | null
          id?: string
          jira_issue_key?: string | null
          linked_capa_id?: string | null
          linked_ccr_id?: string | null
          linked_hazard_id?: string | null
          priority?: string
          product_id: string
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          test_case_id?: string | null
          test_execution_id?: string | null
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          defect_id?: string
          defect_type?: string | null
          description?: string
          discovered_in_phase?: string | null
          id?: string
          jira_issue_key?: string | null
          linked_capa_id?: string | null
          linked_ccr_id?: string | null
          linked_hazard_id?: string | null
          priority?: string
          product_id?: string
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          test_case_id?: string | null
          test_execution_id?: string | null
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "defects_linked_capa_id_fkey"
            columns: ["linked_capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_linked_ccr_id_fkey"
            columns: ["linked_ccr_id"]
            isOneToOne: false
            referencedRelation: "change_control_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_linked_hazard_id_fkey"
            columns: ["linked_hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_test_execution_id_fkey"
            columns: ["test_execution_id"]
            isOneToOne: false
            referencedRelation: "test_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      design_change_rationales: {
        Row: {
          affected_design_outputs: Json | null
          approved_by: string | null
          change_classification: string
          change_description: string
          change_request_id: string | null
          clinical_data_required: boolean | null
          company_id: string
          created_at: string | null
          created_by: string | null
          determination: string
          document_id: string
          id: string
          is_override: boolean | null
          override_reason: string | null
          product_id: string
          qmsr_clause_reference: string | null
          rationale_text: string
          regulatory_submission_required: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          affected_design_outputs?: Json | null
          approved_by?: string | null
          change_classification: string
          change_description: string
          change_request_id?: string | null
          clinical_data_required?: boolean | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          determination: string
          document_id: string
          id?: string
          is_override?: boolean | null
          override_reason?: string | null
          product_id: string
          qmsr_clause_reference?: string | null
          rationale_text: string
          regulatory_submission_required?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_design_outputs?: Json | null
          approved_by?: string | null
          change_classification?: string
          change_description?: string
          change_request_id?: string | null
          clinical_data_required?: boolean | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          determination?: string
          document_id?: string
          id?: string
          is_override?: boolean | null
          override_reason?: string | null
          product_id?: string
          qmsr_clause_reference?: string | null
          rationale_text?: string
          regulatory_submission_required?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_change_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_change_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "design_change_rationales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "design_change_rationales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      design_review_findings: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string
          description: string
          design_review_id: string
          due_date: string | null
          finding_id: string
          id: string
          object_id: string | null
          object_type: string | null
          resolution_notes: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by: string
          description?: string
          design_review_id: string
          due_date?: string | null
          finding_id?: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string
          description?: string
          design_review_id?: string
          due_date?: string | null
          finding_id?: string
          id?: string
          object_id?: string | null
          object_type?: string | null
          resolution_notes?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_review_findings_design_review_id_fkey"
            columns: ["design_review_id"]
            isOneToOne: false
            referencedRelation: "design_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      design_review_manifest_items: {
        Row: {
          created_at: string
          design_review_id: string
          id: string
          object_display_id: string | null
          object_id: string
          object_type: string
          snapshot_data: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          design_review_id: string
          id?: string
          object_display_id?: string | null
          object_id: string
          object_type: string
          snapshot_data?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          design_review_id?: string
          id?: string
          object_display_id?: string | null
          object_id?: string
          object_type?: string
          snapshot_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_review_manifest_items_design_review_id_fkey"
            columns: ["design_review_id"]
            isOneToOne: false
            referencedRelation: "design_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      design_review_participants: {
        Row: {
          attended: boolean
          design_review_id: string
          id: string
          invited_at: string
          role: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          design_review_id: string
          id?: string
          invited_at?: string
          role?: string
          user_id: string
        }
        Update: {
          attended?: boolean
          design_review_id?: string
          id?: string
          invited_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_review_participants_design_review_id_fkey"
            columns: ["design_review_id"]
            isOneToOne: false
            referencedRelation: "design_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      design_review_signatures: {
        Row: {
          comments: string | null
          design_review_id: string
          id: string
          is_independent: boolean
          signature_hash: string | null
          signature_meaning: string
          signed_at: string
          signer_id: string
          signer_role: string
        }
        Insert: {
          comments?: string | null
          design_review_id: string
          id?: string
          is_independent?: boolean
          signature_hash?: string | null
          signature_meaning?: string
          signed_at?: string
          signer_id: string
          signer_role: string
        }
        Update: {
          comments?: string | null
          design_review_id?: string
          id?: string
          is_independent?: boolean
          signature_hash?: string | null
          signature_meaning?: string
          signed_at?: string
          signer_id?: string
          signer_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_review_signatures_design_review_id_fkey"
            columns: ["design_review_id"]
            isOneToOne: false
            referencedRelation: "design_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      design_reviews: {
        Row: {
          baseline_label: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          dr_id: string
          due_date: string | null
          id: string
          metadata: Json | null
          owner_id: string
          phase_name: string | null
          product_id: string | null
          review_type: string
          source_ccr_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          baseline_label?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          dr_id: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          owner_id: string
          phase_name?: string | null
          product_id?: string | null
          review_type?: string
          source_ccr_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          baseline_label?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          dr_id?: string
          due_date?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string
          phase_name?: string | null
          product_id?: string | null
          review_type?: string
          source_ccr_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "design_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "design_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "design_reviews_source_ccr_id_fkey"
            columns: ["source_ccr_id"]
            isOneToOne: false
            referencedRelation: "change_control_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      device_classes: {
        Row: {
          class_code: string
          classification_rules: Json | null
          created_at: string | null
          description: string | null
          id: string
          market_code: string
          regulatory_framework: string | null
          risk_level: string | null
        }
        Insert: {
          class_code: string
          classification_rules?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          market_code: string
          regulatory_framework?: string | null
          risk_level?: string | null
        }
        Update: {
          class_code?: string
          classification_rules?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          market_code?: string
          regulatory_framework?: string | null
          risk_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_classes_market_code_fkey"
            columns: ["market_code"]
            isOneToOne: false
            referencedRelation: "device_markets"
            referencedColumns: ["code"]
          },
        ]
      }
      device_classification_rules: {
        Row: {
          applicable_annexes: Json | null
          created_at: string | null
          decision_criteria: Json
          examples: Json | null
          id: string
          regulatory_framework: string
          resulting_class: string
          rule_description: string
          rule_number: string
          updated_at: string | null
        }
        Insert: {
          applicable_annexes?: Json | null
          created_at?: string | null
          decision_criteria: Json
          examples?: Json | null
          id?: string
          regulatory_framework: string
          resulting_class: string
          rule_description: string
          rule_number: string
          updated_at?: string | null
        }
        Update: {
          applicable_annexes?: Json | null
          created_at?: string | null
          decision_criteria?: Json
          examples?: Json | null
          id?: string
          regulatory_framework?: string
          resulting_class?: string
          rule_description?: string
          rule_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      device_component_features: {
        Row: {
          component_id: string
          created_at: string
          feature_name: string
          id: string
        }
        Insert: {
          component_id: string
          created_at?: string
          feature_name: string
          id?: string
        }
        Update: {
          component_id?: string
          created_at?: string
          feature_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_component_features_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "device_components"
            referencedColumns: ["id"]
          },
        ]
      }
      device_component_hierarchy: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          parent_id: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_component_hierarchy_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "device_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_component_hierarchy_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "device_components"
            referencedColumns: ["id"]
          },
        ]
      }
      device_components: {
        Row: {
          company_id: string
          component_type: string
          created_at: string
          description: string | null
          id: string
          is_master_source: boolean | null
          is_root_level: boolean
          name: string
          parent_id: string | null
          part_number: string | null
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          company_id: string
          component_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_master_source?: boolean | null
          is_root_level?: boolean
          name: string
          parent_id?: string | null
          part_number?: string | null
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          component_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_master_source?: boolean | null
          is_root_level?: boolean
          name?: string
          parent_id?: string | null
          part_number?: string | null
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_components_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_components_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "device_components_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "device_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "device_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      device_markets: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          active: boolean | null
          administering_medicine: boolean | null
          applicable_legislation: string | null
          basic_udi_di_code: string | null
          basic_udi_version_date: string | null
          contain_latex: boolean | null
          created_at: string | null
          created_by: string | null
          device_model: string | null
          device_name: string | null
          direct_marking: boolean | null
          implantable: boolean | null
          issuing_agency: string | null
          manufacturer_address: string | null
          manufacturer_ca_address: string | null
          manufacturer_ca_country: string | null
          manufacturer_ca_email: string | null
          manufacturer_ca_name: string | null
          manufacturer_ca_phone: string | null
          manufacturer_ca_postcode: string | null
          manufacturer_country: string | null
          manufacturer_email: string | null
          manufacturer_id_srn: string | null
          manufacturer_last_update_date: string | null
          manufacturer_most_recent_update: string | null
          manufacturer_organization: string | null
          manufacturer_phone: string | null
          manufacturer_postcode: string | null
          manufacturer_prrc_address: string | null
          manufacturer_prrc_country: string | null
          manufacturer_prrc_email: string | null
          manufacturer_prrc_first_name: string | null
          manufacturer_prrc_last_name: string | null
          manufacturer_prrc_phone: string | null
          manufacturer_prrc_postcode: string | null
          manufacturer_prrc_responsible_for: string | null
          manufacturer_status: string | null
          manufacturer_uuid: string | null
          manufacturer_website: string | null
          market_distribution: string | null
          max_reuses: number | null
          measuring: boolean | null
          most_recent_update: string | null
          nomenclature_codes: string | null
          placed_on_the_market: string | null
          quantity_of_device: number | null
          reference_number: string | null
          reprocessed: boolean | null
          reusable: boolean | null
          risk_class: string | null
          single_use: boolean | null
          status: string | null
          sterile: boolean | null
          sterilization_need: boolean | null
          trade_names: string | null
          udi_di: string | null
          udi_version_date: string | null
          updated_at: string | null
          updated_by: string | null
          uuid: string
        }
        Insert: {
          active?: boolean | null
          administering_medicine?: boolean | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          basic_udi_version_date?: string | null
          contain_latex?: boolean | null
          created_at?: string | null
          created_by?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: boolean | null
          implantable?: boolean | null
          issuing_agency?: string | null
          manufacturer_address?: string | null
          manufacturer_ca_address?: string | null
          manufacturer_ca_country?: string | null
          manufacturer_ca_email?: string | null
          manufacturer_ca_name?: string | null
          manufacturer_ca_phone?: string | null
          manufacturer_ca_postcode?: string | null
          manufacturer_country?: string | null
          manufacturer_email?: string | null
          manufacturer_id_srn?: string | null
          manufacturer_last_update_date?: string | null
          manufacturer_most_recent_update?: string | null
          manufacturer_organization?: string | null
          manufacturer_phone?: string | null
          manufacturer_postcode?: string | null
          manufacturer_prrc_address?: string | null
          manufacturer_prrc_country?: string | null
          manufacturer_prrc_email?: string | null
          manufacturer_prrc_first_name?: string | null
          manufacturer_prrc_last_name?: string | null
          manufacturer_prrc_phone?: string | null
          manufacturer_prrc_postcode?: string | null
          manufacturer_prrc_responsible_for?: string | null
          manufacturer_status?: string | null
          manufacturer_uuid?: string | null
          manufacturer_website?: string | null
          market_distribution?: string | null
          max_reuses?: number | null
          measuring?: boolean | null
          most_recent_update?: string | null
          nomenclature_codes?: string | null
          placed_on_the_market?: string | null
          quantity_of_device?: number | null
          reference_number?: string | null
          reprocessed?: boolean | null
          reusable?: boolean | null
          risk_class?: string | null
          single_use?: boolean | null
          status?: string | null
          sterile?: boolean | null
          sterilization_need?: boolean | null
          trade_names?: string | null
          udi_di?: string | null
          udi_version_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uuid: string
        }
        Update: {
          active?: boolean | null
          administering_medicine?: boolean | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          basic_udi_version_date?: string | null
          contain_latex?: boolean | null
          created_at?: string | null
          created_by?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: boolean | null
          implantable?: boolean | null
          issuing_agency?: string | null
          manufacturer_address?: string | null
          manufacturer_ca_address?: string | null
          manufacturer_ca_country?: string | null
          manufacturer_ca_email?: string | null
          manufacturer_ca_name?: string | null
          manufacturer_ca_phone?: string | null
          manufacturer_ca_postcode?: string | null
          manufacturer_country?: string | null
          manufacturer_email?: string | null
          manufacturer_id_srn?: string | null
          manufacturer_last_update_date?: string | null
          manufacturer_most_recent_update?: string | null
          manufacturer_organization?: string | null
          manufacturer_phone?: string | null
          manufacturer_postcode?: string | null
          manufacturer_prrc_address?: string | null
          manufacturer_prrc_country?: string | null
          manufacturer_prrc_email?: string | null
          manufacturer_prrc_first_name?: string | null
          manufacturer_prrc_last_name?: string | null
          manufacturer_prrc_phone?: string | null
          manufacturer_prrc_postcode?: string | null
          manufacturer_prrc_responsible_for?: string | null
          manufacturer_status?: string | null
          manufacturer_uuid?: string | null
          manufacturer_website?: string | null
          market_distribution?: string | null
          max_reuses?: number | null
          measuring?: boolean | null
          most_recent_update?: string | null
          nomenclature_codes?: string | null
          placed_on_the_market?: string | null
          quantity_of_device?: number | null
          reference_number?: string | null
          reprocessed?: boolean | null
          reusable?: boolean | null
          risk_class?: string | null
          single_use?: boolean | null
          status?: string | null
          sterile?: boolean | null
          sterilization_need?: boolean | null
          trade_names?: string | null
          udi_di?: string | null
          udi_version_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uuid?: string
        }
        Relationships: []
      }
      digital_templates: {
        Row: {
          base_template: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          phase_adaptations: Json
          template_name: string
          template_type: string
          updated_at: string
        }
        Insert: {
          base_template: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          phase_adaptations?: Json
          template_name: string
          template_type: string
          updated_at?: string
        }
        Update: {
          base_template?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          phase_adaptations?: Json
          template_name?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_digital_templates_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_digital_templates_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      document_ai_sessions: {
        Row: {
          ai_response: string
          company_id: string
          created_at: string
          document_id: string
          id: string
          query_text: string | null
          response_metadata: Json | null
          session_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_response: string
          company_id: string
          created_at?: string
          document_id: string
          id?: string
          query_text?: string | null
          response_metadata?: Json | null
          session_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_response?: string
          company_id?: string
          created_at?: string
          document_id?: string
          id?: string
          query_text?: string | null
          response_metadata?: Json | null
          session_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_annotations: {
        Row: {
          annotation_id: string
          annotation_type: string
          content: string | null
          created_at: string | null
          document_id: string
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          page_number: number
          position: Json
          report_id: string | null
          style: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annotation_id: string
          annotation_type: string
          content?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          page_number?: number
          position: Json
          report_id?: string | null
          style?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annotation_id?: string
          annotation_type?: string
          content?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          page_number?: number
          position?: Json
          report_id?: string | null
          style?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_annotations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_annotations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_annotations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "market_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      document_annotations_new: {
        Row: {
          annotation_id: string | null
          annotation_type: string
          content: string | null
          created_at: string | null
          document_id: string
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          page_number: number | null
          position: Json
          report_id: string | null
          style: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annotation_id?: string | null
          annotation_type: string
          content?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          page_number?: number | null
          position?: Json
          report_id?: string | null
          style?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annotation_id?: string | null
          annotation_type?: string
          content?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          page_number?: number | null
          position?: Json
          report_id?: string | null
          style?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_annotations_test: {
        Row: {
          annotation_id: string
          annotation_type: string
          content: string | null
          created_at: string | null
          document_id: string
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          page_number: number
          position: Json
          report_id: string | null
          style: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annotation_id: string
          annotation_type: string
          content?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          page_number?: number
          position: Json
          report_id?: string | null
          style?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annotation_id?: string
          annotation_type?: string
          content?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          page_number?: number
          position?: Json
          report_id?: string | null
          style?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_annotations_test_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_annotations_test_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "market_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      document_audit_logs: {
        Row: {
          action: string
          action_details: Json | null
          annotations_created: number | null
          annotations_deleted: number | null
          annotations_modified: number | null
          comments_added: number | null
          company_id: string
          created_at: string | null
          device_info: Json | null
          document_id: string
          duration_seconds: number | null
          id: string
          ip_address: unknown
          location_info: Json | null
          metadata: Json | null
          page_views: number | null
          reviews_created: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          action_details?: Json | null
          annotations_created?: number | null
          annotations_deleted?: number | null
          annotations_modified?: number | null
          comments_added?: number | null
          company_id: string
          created_at?: string | null
          device_info?: Json | null
          document_id: string
          duration_seconds?: number | null
          id?: string
          ip_address?: unknown
          location_info?: Json | null
          metadata?: Json | null
          page_views?: number | null
          reviews_created?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          action_details?: Json | null
          annotations_created?: number | null
          annotations_deleted?: number | null
          annotations_modified?: number | null
          comments_added?: number | null
          company_id?: string
          created_at?: string | null
          device_info?: Json | null
          document_id?: string
          duration_seconds?: number | null
          id?: string
          ip_address?: unknown
          location_info?: Json | null
          metadata?: Json | null
          page_views?: number | null
          reviews_created?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "document_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_audit_logs_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_authors: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_visible: boolean
          last_name: string | null
          name: string
          user_id: string | null
          user_invitation_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_visible?: boolean
          last_name?: string | null
          name: string
          user_id?: string | null
          user_invitation_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_visible?: boolean
          last_name?: string | null
          name?: string
          user_id?: string | null
          user_invitation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_authors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_authors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "document_authors_user_invitation_id_fkey"
            columns: ["user_invitation_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string | null
          id: string
          page_number: number | null
          report_id: string
          section_title: string | null
          word_count: number | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          page_number?: number | null
          report_id: string
          section_title?: string | null
          word_count?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          page_number?: number | null
          report_id?: string
          section_title?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "market_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      document_cleanup_backup: {
        Row: {
          backup_created_at: string | null
          backup_reason: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          document_scope: Database["public"]["Enums"]["document_scope"] | null
          document_type: string | null
          due_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string | null
          inserted_at: string | null
          is_predefined_core_template: boolean | null
          milestone_due_date: string | null
          name: string | null
          phase_id: string | null
          product_id: string | null
          reviewer_group_id: string | null
          reviewers: Json | null
          status: string | null
          tech_applicability: string | null
          template_source_id: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          backup_created_at?: string | null
          backup_reason?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string | null
          inserted_at?: string | null
          is_predefined_core_template?: boolean | null
          milestone_due_date?: string | null
          name?: string | null
          phase_id?: string | null
          product_id?: string | null
          reviewer_group_id?: string | null
          reviewers?: Json | null
          status?: string | null
          tech_applicability?: string | null
          template_source_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          backup_created_at?: string | null
          backup_reason?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string | null
          inserted_at?: string | null
          is_predefined_core_template?: boolean | null
          milestone_due_date?: string | null
          name?: string | null
          phase_id?: string | null
          product_id?: string | null
          reviewer_group_id?: string | null
          reviewers?: Json | null
          status?: string | null
          tech_applicability?: string | null
          template_source_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      document_control_assignments: {
        Row: {
          company_id: string
          control_data: Json
          created_at: string | null
          created_by: string | null
          document_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          control_data?: Json
          created_at?: string | null
          created_by?: string | null
          document_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          control_data?: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_control_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_control_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      document_editor_sessions: {
        Row: {
          document_id: string
          editor_key: string
          updated_at: string
          version: number
        }
        Insert: {
          document_id: string
          editor_key: string
          updated_at?: string
          version?: number
        }
        Update: {
          document_id?: string
          editor_key?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          chunk_tokens: number | null
          company_id: string
          created_at: string | null
          document_id: string
          document_table: string | null
          embedding: string
          embedding_model: string | null
          id: string
          metadata: Json | null
          product_id: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          chunk_tokens?: number | null
          company_id: string
          created_at?: string | null
          document_id: string
          document_table?: string | null
          embedding: string
          embedding_model?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          chunk_tokens?: number | null
          company_id?: string
          created_at?: string | null
          document_id?: string
          document_table?: string | null
          embedding?: string
          embedding_model?: string | null
          id?: string
          metadata?: Json | null
          product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_highlights: {
        Row: {
          color: string
          created_at: string | null
          document_id: string
          end_offset: number
          highlighted_text: string
          id: string
          page_number: number
          position: Json
          start_offset: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          document_id: string
          end_offset: number
          highlighted_text: string
          id?: string
          page_number?: number
          position: Json
          start_offset: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          document_id?: string
          end_offset?: number
          highlighted_text?: string
          id?: string
          page_number?: number
          position?: Json
          start_offset?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_review_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          document_id: string
          due_date: string | null
          id: string
          notes: string | null
          reviewer_group_id: string | null
          reviewer_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          document_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          reviewer_group_id?: string | null
          reviewer_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          document_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          reviewer_group_id?: string | null
          reviewer_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_review_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "document_review_assignments_reviewer_group_id_fkey"
            columns: ["reviewer_group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      document_review_notes: {
        Row: {
          assignment_id: string | null
          created_at: string
          document_id: string | null
          id: string
          note: string
          reviewer_id: string
          template_document_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          note: string
          reviewer_id: string
          template_document_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          note?: string
          reviewer_id?: string
          template_document_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_review_notes_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "review_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_notes_template_document_id_fkey"
            columns: ["template_document_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviewer_decisions: {
        Row: {
          comment: string | null
          created_at: string | null
          decision: string
          document_id: string
          id: string
          reviewer_group_id: string | null
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          decision: string
          document_id: string
          id?: string
          reviewer_group_id?: string | null
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          decision?: string
          document_id?: string
          id?: string
          reviewer_group_id?: string | null
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_reviewer_decisions_reviewer_group_id_fkey"
            columns: ["reviewer_group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections: {
        Row: {
          created_at: string | null
          document_id: string
          error_message: string | null
          extracted_data: Json | null
          extracted_text: string | null
          extraction_status: string
          id: string
          page_end: number
          page_start: number
          section_title: string
          section_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          error_message?: string | null
          extracted_data?: Json | null
          extracted_text?: string | null
          extraction_status?: string
          id?: string
          page_end: number
          page_start: number
          section_title: string
          section_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          extracted_data?: Json | null
          extracted_text?: string | null
          extraction_status?: string
          id?: string
          page_end?: number
          page_start?: number
          section_title?: string
          section_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "product_competitor_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_stars: {
        Row: {
          created_at: string
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_stars_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      document_studio_templates: {
        Row: {
          associated_documents: Json | null
          company_id: string
          created_at: string | null
          created_by: string | null
          document_control: Json | null
          id: string
          last_edited_by: string | null
          metadata: Json
          name: string
          notes: Json | null
          product_context: Json | null
          product_id: string | null
          revision_history: Json | null
          role_mappings: Json | null
          sections: Json
          smart_data: Json | null
          template_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          associated_documents?: Json | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          document_control?: Json | null
          id?: string
          last_edited_by?: string | null
          metadata?: Json
          name: string
          notes?: Json | null
          product_context?: Json | null
          product_id?: string | null
          revision_history?: Json | null
          role_mappings?: Json | null
          sections?: Json
          smart_data?: Json | null
          template_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          associated_documents?: Json | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          document_control?: Json | null
          id?: string
          last_edited_by?: string | null
          metadata?: Json
          name?: string
          notes?: Json | null
          product_context?: Json | null
          product_id?: string | null
          revision_history?: Json | null
          role_mappings?: Json | null
          sections?: Json
          smart_data?: Json | null
          template_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_types: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_summary: string | null
          created_at: string | null
          created_by: string | null
          document_data: Json
          document_id: string
          id: string
          is_current: boolean | null
          version_name: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          document_data: Json
          document_id: string
          id?: string
          is_current?: boolean | null
          version_name?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string | null
          created_by?: string | null
          document_data?: Json
          document_id?: string
          id?: string
          is_current?: boolean | null
          version_name?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_studio_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          approval_date: string | null
          author: string | null
          authors_ids: Json | null
          brief_summary: string | null
          company_id: string | null
          created_at: string
          current_version_id: string | null
          date: string | null
          description: string | null
          document_reference: string | null
          document_scope: Database["public"]["Enums"]["document_scope"] | null
          document_type: string | null
          due_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          inserted_at: string
          is_current_effective_version: boolean | null
          is_predefined_core_template: boolean | null
          is_record: boolean | null
          milestone_due_date: string | null
          name: string
          need_template_update: boolean | null
          phase_id: string | null
          platform_id: string | null
          platform_reference_id: string | null
          product_id: string | null
          public_url: string | null
          reference_document_ids: string[] | null
          reviewer_group_ids: string[] | null
          reviewers: Json | null
          section_ids: string[] | null
          status: string | null
          sub_section: string | null
          tech_applicability: string | null
          template_source_id: string | null
          updated_at: string
          uploaded_at: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          author?: string | null
          authors_ids?: Json | null
          brief_summary?: string | null
          company_id?: string | null
          created_at?: string
          current_version_id?: string | null
          date?: string | null
          description?: string | null
          document_reference?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          inserted_at?: string
          is_current_effective_version?: boolean | null
          is_predefined_core_template?: boolean | null
          is_record?: boolean | null
          milestone_due_date?: string | null
          name: string
          need_template_update?: boolean | null
          phase_id?: string | null
          platform_id?: string | null
          platform_reference_id?: string | null
          product_id?: string | null
          public_url?: string | null
          reference_document_ids?: string[] | null
          reviewer_group_ids?: string[] | null
          reviewers?: Json | null
          section_ids?: string[] | null
          status?: string | null
          sub_section?: string | null
          tech_applicability?: string | null
          template_source_id?: string | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          author?: string | null
          authors_ids?: Json | null
          brief_summary?: string | null
          company_id?: string | null
          created_at?: string
          current_version_id?: string | null
          date?: string | null
          description?: string | null
          document_reference?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          inserted_at?: string
          is_current_effective_version?: boolean | null
          is_predefined_core_template?: boolean | null
          is_record?: boolean | null
          milestone_due_date?: string | null
          name?: string
          need_template_update?: boolean | null
          phase_id?: string | null
          platform_id?: string | null
          platform_reference_id?: string | null
          product_id?: string | null
          public_url?: string | null
          reference_document_ids?: string[] | null
          reviewer_group_ids?: string[] | null
          reviewers?: Json | null
          section_ids?: string[] | null
          status?: string | null
          sub_section?: string | null
          tech_applicability?: string | null
          template_source_id?: string | null
          updated_at?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "documents_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "company_platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_platform_reference_id_fkey"
            columns: ["platform_reference_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_platform_reference_id_fkey"
            columns: ["platform_reference_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_source_id_fkey"
            columns: ["template_source_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      esign_audit_log: {
        Row: {
          action: string
          created_at: string | null
          document_id: string
          id: string
          ip_address: string | null
          metadata: Json | null
          request_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          document_id: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          document_id?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          request_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      esign_otp_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      esign_records: {
        Row: {
          auth_method: string
          document_hash: string
          document_id: string | null
          full_legal_name: string | null
          id: string
          ip_address: string | null
          meaning: string
          request_id: string | null
          signed_at: string | null
          signer_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_method?: string
          document_hash: string
          document_id?: string | null
          full_legal_name?: string | null
          id?: string
          ip_address?: string | null
          meaning: string
          request_id?: string | null
          signed_at?: string | null
          signer_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_method?: string
          document_hash?: string
          document_id?: string | null
          full_legal_name?: string | null
          id?: string
          ip_address?: string | null
          meaning?: string
          request_id?: string | null
          signed_at?: string | null
          signer_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esign_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "esign_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esign_records_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "esign_signers"
            referencedColumns: ["id"]
          },
        ]
      }
      esign_requests: {
        Row: {
          created_at: string | null
          created_by: string
          document_hash: string
          document_id: string
          id: string
          signing_order: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          document_hash: string
          document_id: string
          id?: string
          signing_order?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          document_hash?: string
          document_id?: string
          id?: string
          signing_order?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      esign_signers: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          meaning: string
          order_index: number
          rejection_reason: string | null
          request_id: string
          signed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          meaning: string
          order_index?: number
          rejection_reason?: string | null
          request_id: string
          signed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          meaning?: string
          order_index?: number
          rejection_reason?: string | null
          request_id?: string
          signed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esign_signers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "esign_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      eudamed_device_registry: {
        Row: {
          active: string | null
          address: string | null
          administering_medicine: string | null
          applicable_legislation: string | null
          basic_udi_di_code: string | null
          ca_address: string | null
          ca_country: string | null
          ca_email: string | null
          ca_name: string | null
          ca_phone: string | null
          ca_postcode: string | null
          contain_latex: string | null
          country: string | null
          device_model: string | null
          device_name: string | null
          direct_marking: string | null
          email: string | null
          id_srn: string | null
          implantable: string | null
          issuing_agency: string | null
          market_distribution: string | null
          max_reuses: string | null
          measuring: string | null
          nomenclature_codes: string | null
          organization: string | null
          organization_status: string | null
          phone: string | null
          placed_on_the_market: string | null
          postcode: string | null
          prrc_address: string | null
          prrc_country: string | null
          prrc_email: string | null
          prrc_first_name: string | null
          prrc_last_name: string | null
          prrc_phone: string | null
          prrc_postcode: string | null
          prrc_responsible_for: string | null
          quantity_of_device: string | null
          reference_number: string | null
          reprocessed: string | null
          reusable: string | null
          risk_class: string | null
          single_use: string | null
          status: string | null
          sterile: string | null
          sterilization_need: string | null
          trade_names: string | null
          udi_di: string
          website: string | null
        }
        Insert: {
          active?: string | null
          address?: string | null
          administering_medicine?: string | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          ca_address?: string | null
          ca_country?: string | null
          ca_email?: string | null
          ca_name?: string | null
          ca_phone?: string | null
          ca_postcode?: string | null
          contain_latex?: string | null
          country?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: string | null
          email?: string | null
          id_srn?: string | null
          implantable?: string | null
          issuing_agency?: string | null
          market_distribution?: string | null
          max_reuses?: string | null
          measuring?: string | null
          nomenclature_codes?: string | null
          organization?: string | null
          organization_status?: string | null
          phone?: string | null
          placed_on_the_market?: string | null
          postcode?: string | null
          prrc_address?: string | null
          prrc_country?: string | null
          prrc_email?: string | null
          prrc_first_name?: string | null
          prrc_last_name?: string | null
          prrc_phone?: string | null
          prrc_postcode?: string | null
          prrc_responsible_for?: string | null
          quantity_of_device?: string | null
          reference_number?: string | null
          reprocessed?: string | null
          reusable?: string | null
          risk_class?: string | null
          single_use?: string | null
          status?: string | null
          sterile?: string | null
          sterilization_need?: string | null
          trade_names?: string | null
          udi_di: string
          website?: string | null
        }
        Update: {
          active?: string | null
          address?: string | null
          administering_medicine?: string | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          ca_address?: string | null
          ca_country?: string | null
          ca_email?: string | null
          ca_name?: string | null
          ca_phone?: string | null
          ca_postcode?: string | null
          contain_latex?: string | null
          country?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: string | null
          email?: string | null
          id_srn?: string | null
          implantable?: string | null
          issuing_agency?: string | null
          market_distribution?: string | null
          max_reuses?: string | null
          measuring?: string | null
          nomenclature_codes?: string | null
          organization?: string | null
          organization_status?: string | null
          phone?: string | null
          placed_on_the_market?: string | null
          postcode?: string | null
          prrc_address?: string | null
          prrc_country?: string | null
          prrc_email?: string | null
          prrc_first_name?: string | null
          prrc_last_name?: string | null
          prrc_phone?: string | null
          prrc_postcode?: string | null
          prrc_responsible_for?: string | null
          quantity_of_device?: string | null
          reference_number?: string | null
          reprocessed?: string | null
          reusable?: string | null
          risk_class?: string | null
          single_use?: string | null
          status?: string | null
          sterile?: string | null
          sterilization_need?: string | null
          trade_names?: string | null
          udi_di?: string
          website?: string | null
        }
        Relationships: []
      }
      eudamed_sync_status: {
        Row: {
          company_id: string
          created_at: string
          duplicates_found: number | null
          duplicates_merged: number | null
          errors: Json | null
          id: string
          last_sync_at: string | null
          new_products_created: number | null
          sync_status: string | null
          total_company_products: number | null
          total_eudamed_devices: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          duplicates_found?: number | null
          duplicates_merged?: number | null
          errors?: Json | null
          id?: string
          last_sync_at?: string | null
          new_products_created?: number | null
          sync_status?: string | null
          total_company_products?: number | null
          total_eudamed_devices?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          duplicates_found?: number | null
          duplicates_merged?: number | null
          errors?: Json | null
          id?: string
          last_sync_at?: string | null
          new_products_created?: number | null
          sync_status?: string | null
          total_company_products?: number | null
          total_eudamed_devices?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          last_updated: string
          rate: number
          source: string
          target_currency: string
        }
        Insert: {
          base_currency: string
          created_at?: string
          id?: string
          last_updated?: string
          rate: number
          source?: string
          target_currency: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          last_updated?: string
          rate?: number
          source?: string
          target_currency?: string
        }
        Relationships: []
      }
      excluded_documents: {
        Row: {
          created_at: string
          document_name: string
          id: string
          phase_id: string
        }
        Insert: {
          created_at?: string
          document_name: string
          id?: string
          phase_id: string
        }
        Update: {
          created_at?: string
          document_name?: string
          id?: string
          phase_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "excluded_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_excluded_documents_phase_id"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_los_assessments: {
        Row: {
          assessed_los: number
          assessment_product_id: string
          company_id: string
          confidence_level: string
          created_at: string
          expert_email: string | null
          expert_name: string | null
          expert_role: string | null
          expert_user_id: string
          id: string
          justification: string | null
          phase_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_factors: Json | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assessed_los: number
          assessment_product_id: string
          company_id: string
          confidence_level?: string
          created_at?: string
          expert_email?: string | null
          expert_name?: string | null
          expert_role?: string | null
          expert_user_id: string
          id?: string
          justification?: string | null
          phase_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assessed_los?: number
          assessment_product_id?: string
          company_id?: string
          confidence_level?: string
          created_at?: string
          expert_email?: string | null
          expert_name?: string | null
          expert_role?: string | null
          expert_user_id?: string
          id?: string
          justification?: string | null
          phase_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: Json | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_field_values: {
        Row: {
          basic_udi_di: string
          company_id: string
          field_key: string
          field_value: Json | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          basic_udi_di: string
          company_id: string
          field_key: string
          field_value?: Json | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          basic_udi_di?: string
          company_id?: string
          field_key?: string
          field_value?: Json | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_field_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_field_values_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      fda_document_cache: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          k_number: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          k_number: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          k_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fda_product_codes: {
        Row: {
          code: string
          created_at: string | null
          definition: string | null
          description: string | null
          device_class: string | null
          guidance_documents: Json | null
          id: string
          last_fetched_at: string | null
          medical_specialty: string | null
          product_code_name: string | null
          regulation_number: string | null
          submission_type_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          definition?: string | null
          description?: string | null
          device_class?: string | null
          guidance_documents?: Json | null
          id?: string
          last_fetched_at?: string | null
          medical_specialty?: string | null
          product_code_name?: string | null
          regulation_number?: string | null
          submission_type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          definition?: string | null
          description?: string | null
          device_class?: string | null
          guidance_documents?: Json | null
          id?: string
          last_fetched_at?: string | null
          medical_specialty?: string | null
          product_code_name?: string | null
          regulation_number?: string | null
          submission_type_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feasibility_assumptions: {
        Row: {
          assumption_text: string
          category: string
          confidence_level: string
          created_at: string | null
          id: string
          is_portfolio_level: boolean
          portfolio_id: string
          portfolio_product_id: string | null
          rationale: string | null
          updated_at: string | null
        }
        Insert: {
          assumption_text: string
          category: string
          confidence_level?: string
          created_at?: string | null
          id?: string
          is_portfolio_level?: boolean
          portfolio_id: string
          portfolio_product_id?: string | null
          rationale?: string | null
          updated_at?: string | null
        }
        Update: {
          assumption_text?: string
          category?: string
          confidence_level?: string
          created_at?: string | null
          id?: string
          is_portfolio_level?: boolean
          portfolio_id?: string
          portfolio_product_id?: string | null
          rationale?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_assumptions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_assumptions_portfolio_product_id_fkey"
            columns: ["portfolio_product_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolio_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_budget_items: {
        Row: {
          best_case: number | null
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_portfolio_level: boolean | null
          item_name: string
          likely_case: number | null
          portfolio_id: string
          portfolio_product_id: string | null
          timing_months_from_start: number | null
          updated_at: string | null
          worst_case: number | null
        }
        Insert: {
          best_case?: number | null
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_portfolio_level?: boolean | null
          item_name: string
          likely_case?: number | null
          portfolio_id: string
          portfolio_product_id?: string | null
          timing_months_from_start?: number | null
          updated_at?: string | null
          worst_case?: number | null
        }
        Update: {
          best_case?: number | null
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_portfolio_level?: boolean | null
          item_name?: string
          likely_case?: number | null
          portfolio_id?: string
          portfolio_product_id?: string | null
          timing_months_from_start?: number | null
          updated_at?: string | null
          worst_case?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_budget_items_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_budget_items_portfolio_product_id_fkey"
            columns: ["portfolio_product_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolio_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_cannibalization: {
        Row: {
          affected_product_id: string
          cannibalization_percentage: number
          created_at: string | null
          explanation: string | null
          id: string
          portfolio_id: string
        }
        Insert: {
          affected_product_id: string
          cannibalization_percentage: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          portfolio_id: string
        }
        Update: {
          affected_product_id?: string
          cannibalization_percentage?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          portfolio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_cannibalization_affected_product_id_fkey"
            columns: ["affected_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "feasibility_cannibalization_affected_product_id_fkey"
            columns: ["affected_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_cannibalization_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_financial_analysis: {
        Row: {
          analysis_date: string | null
          break_even_years: number | null
          calculation_metadata: Json | null
          commercial_los: number | null
          created_at: string | null
          discount_rate: number | null
          id: string
          irr_percentage: number | null
          portfolio_id: string
          rnpv: number | null
          roi_percentage: number | null
          scenario: string
          technical_los: number | null
          total_investment: number | null
          total_revenue_pv: number | null
        }
        Insert: {
          analysis_date?: string | null
          break_even_years?: number | null
          calculation_metadata?: Json | null
          commercial_los?: number | null
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          irr_percentage?: number | null
          portfolio_id: string
          rnpv?: number | null
          roi_percentage?: number | null
          scenario: string
          technical_los?: number | null
          total_investment?: number | null
          total_revenue_pv?: number | null
        }
        Update: {
          analysis_date?: string | null
          break_even_years?: number | null
          calculation_metadata?: Json | null
          commercial_los?: number | null
          created_at?: string | null
          discount_rate?: number | null
          id?: string
          irr_percentage?: number | null
          portfolio_id?: string
          rnpv?: number | null
          roi_percentage?: number | null
          scenario?: string
          technical_los?: number | null
          total_investment?: number | null
          total_revenue_pv?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_financial_analysis_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_operational_costs: {
        Row: {
          allocated_facility_costs: number | null
          annual_fixed_cost_change_percent: number | null
          annual_variable_cost_change_percent: number | null
          best_case_multiplier: number | null
          created_at: string | null
          currency: string | null
          direct_labor_cost: number | null
          direct_materials_cost: number | null
          distribution_costs: number | null
          fixed_monthly_costs: number | null
          id: string
          is_portfolio_level: boolean | null
          likely_case_multiplier: number | null
          notes: string | null
          portfolio_id: string | null
          portfolio_product_id: string | null
          post_market_surveillance_annual: number | null
          quality_compliance_costs: number | null
          quality_system_annual: number | null
          regulatory_fees_annual: number | null
          support_service_costs: number | null
          updated_at: string | null
          variable_cost_per_unit: number | null
          variable_overhead_cost: number | null
          worst_case_multiplier: number | null
        }
        Insert: {
          allocated_facility_costs?: number | null
          annual_fixed_cost_change_percent?: number | null
          annual_variable_cost_change_percent?: number | null
          best_case_multiplier?: number | null
          created_at?: string | null
          currency?: string | null
          direct_labor_cost?: number | null
          direct_materials_cost?: number | null
          distribution_costs?: number | null
          fixed_monthly_costs?: number | null
          id?: string
          is_portfolio_level?: boolean | null
          likely_case_multiplier?: number | null
          notes?: string | null
          portfolio_id?: string | null
          portfolio_product_id?: string | null
          post_market_surveillance_annual?: number | null
          quality_compliance_costs?: number | null
          quality_system_annual?: number | null
          regulatory_fees_annual?: number | null
          support_service_costs?: number | null
          updated_at?: string | null
          variable_cost_per_unit?: number | null
          variable_overhead_cost?: number | null
          worst_case_multiplier?: number | null
        }
        Update: {
          allocated_facility_costs?: number | null
          annual_fixed_cost_change_percent?: number | null
          annual_variable_cost_change_percent?: number | null
          best_case_multiplier?: number | null
          created_at?: string | null
          currency?: string | null
          direct_labor_cost?: number | null
          direct_materials_cost?: number | null
          distribution_costs?: number | null
          fixed_monthly_costs?: number | null
          id?: string
          is_portfolio_level?: boolean | null
          likely_case_multiplier?: number | null
          notes?: string | null
          portfolio_id?: string | null
          portfolio_product_id?: string | null
          post_market_surveillance_annual?: number | null
          quality_compliance_costs?: number | null
          quality_system_annual?: number | null
          regulatory_fees_annual?: number | null
          support_service_costs?: number | null
          updated_at?: string | null
          variable_cost_per_unit?: number | null
          variable_overhead_cost?: number | null
          worst_case_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_operational_costs_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_operational_costs_portfolio_product_id_fkey"
            columns: ["portfolio_product_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolio_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_phase_templates: {
        Row: {
          created_at: string | null
          estimated_cost_best: number | null
          estimated_cost_likely: number | null
          estimated_cost_worst: number | null
          estimated_duration_months: number | null
          id: string
          likelihood_of_success: number
          phase_dependencies: string[] | null
          phase_description: string | null
          phase_name: string
          portfolio_id: string
          portfolio_product_id: string | null
          position: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_cost_best?: number | null
          estimated_cost_likely?: number | null
          estimated_cost_worst?: number | null
          estimated_duration_months?: number | null
          id?: string
          likelihood_of_success: number
          phase_dependencies?: string[] | null
          phase_description?: string | null
          phase_name: string
          portfolio_id: string
          portfolio_product_id?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_cost_best?: number | null
          estimated_cost_likely?: number | null
          estimated_cost_worst?: number | null
          estimated_duration_months?: number | null
          id?: string
          likelihood_of_success?: number
          phase_dependencies?: string[] | null
          phase_description?: string | null
          phase_name?: string
          portfolio_id?: string
          portfolio_product_id?: string | null
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_phase_templates_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_phase_templates_portfolio_product_id_fkey"
            columns: ["portfolio_product_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolio_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_portfolio_products: {
        Row: {
          consumption_pattern: Json | null
          created_at: string | null
          development_status: string | null
          expected_variant_count: number | null
          id: string
          is_placeholder: boolean | null
          lifecycle_type: string | null
          order_index: number | null
          portfolio_id: string
          product_description: string | null
          product_id: string | null
          product_name: string
          quantity_in_bundle: number | null
          role: string | null
          skip_phase_analysis: boolean | null
          source_bundle_member_id: string | null
          updated_at: string | null
          will_split_into_variants: boolean | null
        }
        Insert: {
          consumption_pattern?: Json | null
          created_at?: string | null
          development_status?: string | null
          expected_variant_count?: number | null
          id?: string
          is_placeholder?: boolean | null
          lifecycle_type?: string | null
          order_index?: number | null
          portfolio_id: string
          product_description?: string | null
          product_id?: string | null
          product_name: string
          quantity_in_bundle?: number | null
          role?: string | null
          skip_phase_analysis?: boolean | null
          source_bundle_member_id?: string | null
          updated_at?: string | null
          will_split_into_variants?: boolean | null
        }
        Update: {
          consumption_pattern?: Json | null
          created_at?: string | null
          development_status?: string | null
          expected_variant_count?: number | null
          id?: string
          is_placeholder?: boolean | null
          lifecycle_type?: string | null
          order_index?: number | null
          portfolio_id?: string
          product_description?: string | null
          product_id?: string | null
          product_name?: string
          quantity_in_bundle?: number | null
          role?: string | null
          skip_phase_analysis?: boolean | null
          source_bundle_member_id?: string | null
          updated_at?: string | null
          will_split_into_variants?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_portfolio_products_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_portfolio_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "feasibility_portfolio_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_portfolio_products_source_bundle_member_id_fkey"
            columns: ["source_bundle_member_id"]
            isOneToOne: false
            referencedRelation: "product_bundle_members"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_portfolios: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          custom_risk_categories: Json | null
          decision_date: string | null
          decision_rationale: string | null
          description: string | null
          id: string
          is_from_bundle: boolean | null
          los_methodology: string | null
          los_scope: string | null
          name: string
          source_bundle_id: string | null
          status: string
          strategic_priority: string | null
          target_launch_year: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          custom_risk_categories?: Json | null
          decision_date?: string | null
          decision_rationale?: string | null
          description?: string | null
          id?: string
          is_from_bundle?: boolean | null
          los_methodology?: string | null
          los_scope?: string | null
          name: string
          source_bundle_id?: string | null
          status?: string
          strategic_priority?: string | null
          target_launch_year?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          custom_risk_categories?: Json | null
          decision_date?: string | null
          decision_rationale?: string | null
          description?: string | null
          id?: string
          is_from_bundle?: boolean | null
          los_methodology?: string | null
          los_scope?: string | null
          name?: string
          source_bundle_id?: string | null
          status?: string
          strategic_priority?: string | null
          target_launch_year?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_portfolios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_portfolios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "feasibility_portfolios_source_bundle_id_fkey"
            columns: ["source_bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_revenue_projections: {
        Row: {
          best_case_revenue: number | null
          cogs_best: number | null
          cogs_likely: number | null
          cogs_worst: number | null
          created_at: string | null
          currency: string | null
          id: string
          likely_case_revenue: number | null
          market_share_assumption: number | null
          portfolio_id: string
          portfolio_product_id: string
          target_market: string
          unit_price_best: number | null
          unit_price_likely: number | null
          unit_price_worst: number | null
          units_best: number | null
          units_likely: number | null
          units_worst: number | null
          updated_at: string | null
          worst_case_revenue: number | null
          year_from_launch: number
        }
        Insert: {
          best_case_revenue?: number | null
          cogs_best?: number | null
          cogs_likely?: number | null
          cogs_worst?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          likely_case_revenue?: number | null
          market_share_assumption?: number | null
          portfolio_id: string
          portfolio_product_id: string
          target_market: string
          unit_price_best?: number | null
          unit_price_likely?: number | null
          unit_price_worst?: number | null
          units_best?: number | null
          units_likely?: number | null
          units_worst?: number | null
          updated_at?: string | null
          worst_case_revenue?: number | null
          year_from_launch: number
        }
        Update: {
          best_case_revenue?: number | null
          cogs_best?: number | null
          cogs_likely?: number | null
          cogs_worst?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          likely_case_revenue?: number | null
          market_share_assumption?: number | null
          portfolio_id?: string
          portfolio_product_id?: string
          target_market?: string
          unit_price_best?: number | null
          unit_price_likely?: number | null
          unit_price_worst?: number | null
          units_best?: number | null
          units_likely?: number | null
          units_worst?: number | null
          updated_at?: string | null
          worst_case_revenue?: number | null
          year_from_launch?: number
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_revenue_projections_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_revenue_projections_portfolio_product_id_fkey"
            columns: ["portfolio_product_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolio_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feasibility_risk_assessments: {
        Row: {
          category: string
          created_at: string | null
          id: string
          impact_score: number
          is_portfolio_level: boolean
          mitigation_plan: string | null
          portfolio_id: string
          portfolio_product_id: string | null
          probability_percent: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          impact_score?: number
          is_portfolio_level?: boolean
          mitigation_plan?: string | null
          portfolio_id: string
          portfolio_product_id?: string | null
          probability_percent: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          impact_score?: number
          is_portfolio_level?: boolean
          mitigation_plan?: string | null
          portfolio_id?: string
          portfolio_product_id?: string | null
          probability_percent?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feasibility_risk_assessments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feasibility_risk_assessments_portfolio_product_id_fkey"
            columns: ["portfolio_product_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolio_products"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_user_needs: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          product_id: string
          user_need_id: string
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          product_id: string
          user_need_id: string
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          product_id?: string
          user_need_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_user_needs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "feature_user_needs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_user_needs_user_need_id_fkey"
            columns: ["user_need_id"]
            isOneToOne: false
            referencedRelation: "user_needs"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_submissions: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          page_url: string | null
          priority: string | null
          resolved_at: string | null
          resolved_by: string | null
          screen_resolution: string | null
          screenshot_url: string | null
          screenshot_urls: string[] | null
          status: string
          title: string
          type: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          viewport_size: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          page_url?: string | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screen_resolution?: string | null
          screenshot_url?: string | null
          screenshot_urls?: string[] | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          viewport_size?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          page_url?: string | null
          priority?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          screen_resolution?: string | null
          screenshot_url?: string | null
          screenshot_urls?: string[] | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          viewport_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      field_governance_status: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          design_review_id: string | null
          id: string
          product_id: string
          section_key: string
          snapshot_hash: string | null
          status: string
          updated_at: string
          verdict_comment: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          design_review_id?: string | null
          id?: string
          product_id: string
          section_key: string
          snapshot_hash?: string | null
          status?: string
          updated_at?: string
          verdict_comment?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          design_review_id?: string | null
          id?: string
          product_id?: string
          section_key?: string
          snapshot_hash?: string | null
          status?: string
          updated_at?: string
          verdict_comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_governance_status_design_review_id_fkey"
            columns: ["design_review_id"]
            isOneToOne: false
            referencedRelation: "design_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_governance_status_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "field_governance_status_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_factors: {
        Row: {
          company_id: string | null
          created_at: string | null
          data_source: string | null
          factor_description: string | null
          factor_name: string
          id: string
          impact_weight: number | null
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          data_source?: string | null
          factor_description?: string | null
          factor_name: string
          id?: string
          impact_weight?: number | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          data_source?: string | null
          factor_description?: string | null
          factor_name?: string
          id?: string
          impact_weight?: number | null
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecast_factors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecast_factors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      funding_programmes: {
        Row: {
          checklist_items: Json | null
          created_at: string | null
          deadline_info: string | null
          description: string | null
          eligibility_criteria: Json | null
          funding_body: string | null
          id: string
          is_active: boolean | null
          is_builtin: boolean | null
          name: string
          programme_code: string | null
          region: string
          trl_range: string | null
          typical_budget_range: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          checklist_items?: Json | null
          created_at?: string | null
          deadline_info?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          funding_body?: string | null
          id?: string
          is_active?: boolean | null
          is_builtin?: boolean | null
          name: string
          programme_code?: string | null
          region?: string
          trl_range?: string | null
          typical_budget_range?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          checklist_items?: Json | null
          created_at?: string | null
          deadline_info?: string | null
          description?: string | null
          eligibility_criteria?: Json | null
          funding_body?: string | null
          id?: string
          is_active?: boolean | null
          is_builtin?: boolean | null
          name?: string
          programme_code?: string | null
          region?: string
          trl_range?: string | null
          typical_budget_range?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      gap_activity_links: {
        Row: {
          activity_id: string
          created_at: string | null
          gap_item_id: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          gap_item_id: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          gap_item_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_activity_links_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_activity_links_gap_item_id_fkey"
            columns: ["gap_item_id"]
            isOneToOne: false
            referencedRelation: "gap_analysis_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_analysis_items: {
        Row: {
          action_needed: string | null
          admin_approved: boolean | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          admin_comments: string | null
          applicable_phases: Json | null
          assigned_to: string | null
          associated_standards: string | null
          automatic_na_reason: string | null
          category: string | null
          chapter: string | null
          clause_id: string | null
          clause_summary: string | null
          clinical_owner: string | null
          evidence_links: Json | null
          evidence_method: string | null
          evidence_of_conformity: Json | null
          form_responses: Json | null
          framework: string | null
          id: string
          inserted_at: string
          is_auto_excluded: boolean | null
          labeling_owner: string | null
          last_updated_by: string | null
          mfg_ops_owner: string | null
          milestone_due_date: string | null
          other_owner: string | null
          phase_time: Json | null
          priority: string | null
          product_id: string | null
          qa_ra_owner: string | null
          rd_owner: string | null
          recommended_teams: string | null
          requirement: string
          requirement_summary: string | null
          responsible_user_ids: Json
          section: string | null
          start_date: string | null
          status: string | null
          subsection: string | null
          updated_at: string
        }
        Insert: {
          action_needed?: string | null
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          applicable_phases?: Json | null
          assigned_to?: string | null
          associated_standards?: string | null
          automatic_na_reason?: string | null
          category?: string | null
          chapter?: string | null
          clause_id?: string | null
          clause_summary?: string | null
          clinical_owner?: string | null
          evidence_links?: Json | null
          evidence_method?: string | null
          evidence_of_conformity?: Json | null
          form_responses?: Json | null
          framework?: string | null
          id?: string
          inserted_at?: string
          is_auto_excluded?: boolean | null
          labeling_owner?: string | null
          last_updated_by?: string | null
          mfg_ops_owner?: string | null
          milestone_due_date?: string | null
          other_owner?: string | null
          phase_time?: Json | null
          priority?: string | null
          product_id?: string | null
          qa_ra_owner?: string | null
          rd_owner?: string | null
          recommended_teams?: string | null
          requirement: string
          requirement_summary?: string | null
          responsible_user_ids?: Json
          section?: string | null
          start_date?: string | null
          status?: string | null
          subsection?: string | null
          updated_at?: string
        }
        Update: {
          action_needed?: string | null
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          applicable_phases?: Json | null
          assigned_to?: string | null
          associated_standards?: string | null
          automatic_na_reason?: string | null
          category?: string | null
          chapter?: string | null
          clause_id?: string | null
          clause_summary?: string | null
          clinical_owner?: string | null
          evidence_links?: Json | null
          evidence_method?: string | null
          evidence_of_conformity?: Json | null
          form_responses?: Json | null
          framework?: string | null
          id?: string
          inserted_at?: string
          is_auto_excluded?: boolean | null
          labeling_owner?: string | null
          last_updated_by?: string | null
          mfg_ops_owner?: string | null
          milestone_due_date?: string | null
          other_owner?: string | null
          phase_time?: Json | null
          priority?: string | null
          product_id?: string | null
          qa_ra_owner?: string | null
          rd_owner?: string | null
          recommended_teams?: string | null
          requirement?: string
          requirement_summary?: string | null
          responsible_user_ids?: Json
          section?: string | null
          start_date?: string | null
          status?: string | null
          subsection?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gap_analysis_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "gap_analysis_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_analysis_lists: {
        Row: {
          applicability_rule: string | null
          associated_standards: string | null
          clause_reference: string | null
          id: string
          parent_id: string | null
          recommended_teams: string | null
          recommended_verification_method: string | null
          requirement_id: string | null
          requirement_text: string | null
          source_checklist: string | null
        }
        Insert: {
          applicability_rule?: string | null
          associated_standards?: string | null
          clause_reference?: string | null
          id?: string
          parent_id?: string | null
          recommended_teams?: string | null
          recommended_verification_method?: string | null
          requirement_id?: string | null
          requirement_text?: string | null
          source_checklist?: string | null
        }
        Update: {
          applicability_rule?: string | null
          associated_standards?: string | null
          clause_reference?: string | null
          id?: string
          parent_id?: string | null
          recommended_teams?: string | null
          recommended_verification_method?: string | null
          requirement_id?: string | null
          requirement_text?: string | null
          source_checklist?: string | null
        }
        Relationships: []
      }
      gap_analysis_templates: {
        Row: {
          applicable_device_classes: Json | null
          applicable_phases: Json | null
          auto_enable_condition: string | null
          company_id: string | null
          created_at: string
          description: string | null
          framework: string
          id: string
          importance: string
          is_active: boolean
          is_core: boolean
          is_custom: boolean
          name: string
          parent_template_id: string | null
          regulatory_framework: string | null
          scope: string
          template_config: Json | null
          template_type: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          applicable_device_classes?: Json | null
          applicable_phases?: Json | null
          auto_enable_condition?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          framework: string
          id?: string
          importance?: string
          is_active?: boolean
          is_core?: boolean
          is_custom?: boolean
          name: string
          parent_template_id?: string | null
          regulatory_framework?: string | null
          scope?: string
          template_config?: Json | null
          template_type?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          applicable_device_classes?: Json | null
          applicable_phases?: Json | null
          auto_enable_condition?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          framework?: string
          id?: string
          importance?: string
          is_active?: boolean
          is_core?: boolean
          is_custom?: boolean
          name?: string
          parent_template_id?: string | null
          regulatory_framework?: string | null
          scope?: string
          template_config?: Json | null
          template_type?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_analysis_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_analysis_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "gap_analysis_templates_parent_template_id_fkey"
            columns: ["parent_template_id"]
            isOneToOne: false
            referencedRelation: "gap_analysis_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_audit_links: {
        Row: {
          audit_id: string
          audit_type: string
          created_at: string | null
          gap_item_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          audit_id: string
          audit_type: string
          created_at?: string | null
          gap_item_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          audit_id?: string
          audit_type?: string
          created_at?: string | null
          gap_item_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_audit_links_gap_item_id_fkey"
            columns: ["gap_item_id"]
            isOneToOne: false
            referencedRelation: "gap_analysis_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_document_links: {
        Row: {
          created_at: string | null
          document_id: string
          gap_item_id: string
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          gap_item_id: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          gap_item_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gap_document_links_gap_item_id_fkey"
            columns: ["gap_item_id"]
            isOneToOne: false
            referencedRelation: "gap_analysis_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gap_template_items: {
        Row: {
          applicability_rationale: string | null
          applicable_phases: Json | null
          applicable_standards: Json | null
          associated_standards: string | null
          audit_guidance: string | null
          category: string | null
          chapter: string | null
          clause_description: string | null
          clause_number: string | null
          clause_reference: string | null
          clinical_owner: string | null
          created_at: string | null
          evidence_method: string | null
          evidence_of_conformity: Json | null
          evidence_requirements: Json | null
          excludes_if: string | null
          guidance_text: string | null
          id: string
          is_applicable: boolean | null
          item_number: string
          key_standards: string | null
          labeling_owner: string | null
          mfg_ops_owner: string | null
          other_owner: string | null
          priority: string | null
          qa_ra_owner: string | null
          question_number: string | null
          rd_owner: string | null
          recommended_teams: string | null
          requirement_summary: string | null
          requirement_text: string
          sort_order: number | null
          subsection: string | null
          template_id: string
          updated_at: string | null
        }
        Insert: {
          applicability_rationale?: string | null
          applicable_phases?: Json | null
          applicable_standards?: Json | null
          associated_standards?: string | null
          audit_guidance?: string | null
          category?: string | null
          chapter?: string | null
          clause_description?: string | null
          clause_number?: string | null
          clause_reference?: string | null
          clinical_owner?: string | null
          created_at?: string | null
          evidence_method?: string | null
          evidence_of_conformity?: Json | null
          evidence_requirements?: Json | null
          excludes_if?: string | null
          guidance_text?: string | null
          id?: string
          is_applicable?: boolean | null
          item_number: string
          key_standards?: string | null
          labeling_owner?: string | null
          mfg_ops_owner?: string | null
          other_owner?: string | null
          priority?: string | null
          qa_ra_owner?: string | null
          question_number?: string | null
          rd_owner?: string | null
          recommended_teams?: string | null
          requirement_summary?: string | null
          requirement_text: string
          sort_order?: number | null
          subsection?: string | null
          template_id: string
          updated_at?: string | null
        }
        Update: {
          applicability_rationale?: string | null
          applicable_phases?: Json | null
          applicable_standards?: Json | null
          associated_standards?: string | null
          audit_guidance?: string | null
          category?: string | null
          chapter?: string | null
          clause_description?: string | null
          clause_number?: string | null
          clause_reference?: string | null
          clinical_owner?: string | null
          created_at?: string | null
          evidence_method?: string | null
          evidence_of_conformity?: Json | null
          evidence_requirements?: Json | null
          excludes_if?: string | null
          guidance_text?: string | null
          id?: string
          is_applicable?: boolean | null
          item_number?: string
          key_standards?: string | null
          labeling_owner?: string | null
          mfg_ops_owner?: string | null
          other_owner?: string | null
          priority?: string | null
          qa_ra_owner?: string | null
          question_number?: string | null
          rd_owner?: string | null
          recommended_teams?: string | null
          requirement_summary?: string | null
          requirement_text?: string
          sort_order?: number | null
          subsection?: string | null
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gap_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "gap_analysis_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_requirements: {
        Row: {
          acceptance_criteria: string | null
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          material_specifications: string | null
          priority: string | null
          product_id: string
          rationale: string | null
          requirement_id: string
          status: string | null
          updated_at: string | null
          verification_method: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          material_specifications?: string | null
          priority?: string | null
          product_id: string
          rationale?: string | null
          requirement_id: string
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          material_specifications?: string | null
          priority?: string | null
          product_id?: string
          rationale?: string | null
          requirement_id?: string
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_hardware_req_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hardware_req_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_hardware_req_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_hardware_req_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hazard_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      hazard_product_scope: {
        Row: {
          category_name: string | null
          company_id: string
          created_at: string | null
          hazard_id: string
          id: string
          product_id: string | null
          scope_type: string
        }
        Insert: {
          category_name?: string | null
          company_id: string
          created_at?: string | null
          hazard_id: string
          id?: string
          product_id?: string | null
          scope_type: string
        }
        Update: {
          category_name?: string | null
          company_id?: string
          created_at?: string | null
          hazard_id?: string
          id?: string
          product_id?: string | null
          scope_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "hazard_product_scope_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_product_scope_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "hazard_product_scope_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazard_product_scope_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "hazard_product_scope_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hazards: {
        Row: {
          ai_approval_states: Json | null
          ai_confidence: number | null
          ai_generated_fields: Json | null
          assessment_status: string | null
          category: string | null
          category_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          foreseeable_sequence_events: string | null
          hazard_id: string
          hazardous_situation: string | null
          id: string
          initial_probability: number | null
          initial_risk: Database["public"]["Enums"]["risk_level"]
          initial_risk_level: string | null
          initial_severity: number | null
          kol_assignment_id: string | null
          linked_requirements: string | null
          mitigation_link: string | null
          mitigation_measure: string
          mitigation_type: Database["public"]["Enums"]["mitigation_type"]
          potential_harm: string | null
          product_id: string
          residual_probability: number | null
          residual_risk: Database["public"]["Enums"]["risk_level"]
          residual_risk_level: string | null
          residual_severity: number | null
          risk_control_measure: string | null
          risk_control_type: string | null
          traceability_requirements: string | null
          updated_at: string
          verification_effectiveness: string | null
          verification_implementation: string | null
        }
        Insert: {
          ai_approval_states?: Json | null
          ai_confidence?: number | null
          ai_generated_fields?: Json | null
          assessment_status?: string | null
          category?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          foreseeable_sequence_events?: string | null
          hazard_id: string
          hazardous_situation?: string | null
          id?: string
          initial_probability?: number | null
          initial_risk: Database["public"]["Enums"]["risk_level"]
          initial_risk_level?: string | null
          initial_severity?: number | null
          kol_assignment_id?: string | null
          linked_requirements?: string | null
          mitigation_link?: string | null
          mitigation_measure: string
          mitigation_type: Database["public"]["Enums"]["mitigation_type"]
          potential_harm?: string | null
          product_id: string
          residual_probability?: number | null
          residual_risk: Database["public"]["Enums"]["risk_level"]
          residual_risk_level?: string | null
          residual_severity?: number | null
          risk_control_measure?: string | null
          risk_control_type?: string | null
          traceability_requirements?: string | null
          updated_at?: string
          verification_effectiveness?: string | null
          verification_implementation?: string | null
        }
        Update: {
          ai_approval_states?: Json | null
          ai_confidence?: number | null
          ai_generated_fields?: Json | null
          assessment_status?: string | null
          category?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          foreseeable_sequence_events?: string | null
          hazard_id?: string
          hazardous_situation?: string | null
          id?: string
          initial_probability?: number | null
          initial_risk?: Database["public"]["Enums"]["risk_level"]
          initial_risk_level?: string | null
          initial_severity?: number | null
          kol_assignment_id?: string | null
          linked_requirements?: string | null
          mitigation_link?: string | null
          mitigation_measure?: string
          mitigation_type?: Database["public"]["Enums"]["mitigation_type"]
          potential_harm?: string | null
          product_id?: string
          residual_probability?: number | null
          residual_risk?: Database["public"]["Enums"]["risk_level"]
          residual_risk_level?: string | null
          residual_severity?: number | null
          risk_control_measure?: string | null
          risk_control_type?: string | null
          traceability_requirements?: string | null
          updated_at?: string
          verification_effectiveness?: string | null
          verification_implementation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hazards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "hazard_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hazards_kol_assignment_id_fkey"
            columns: ["kol_assignment_id"]
            isOneToOne: false
            referencedRelation: "kol_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_inspection_evidence: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          file_name: string
          id: string
          inspection_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_name: string
          id?: string
          inspection_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_name?: string
          id?: string
          inspection_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incoming_inspection_evidence_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "incoming_inspection_records"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_inspection_items: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          item_name: string
          measured_value: string | null
          notes: string | null
          pass: boolean | null
          sort_order: number | null
          specification: string | null
          unit_of_measure: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          item_name: string
          measured_value?: string | null
          notes?: string | null
          pass?: boolean | null
          sort_order?: number | null
          specification?: string | null
          unit_of_measure?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          item_name?: string
          measured_value?: string | null
          notes?: string | null
          pass?: boolean | null
          sort_order?: number | null
          specification?: string | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incoming_inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "incoming_inspection_records"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_inspection_records: {
        Row: {
          aql_level: string | null
          coc_received: boolean | null
          coc_reference: string | null
          company_id: string
          created_at: string
          created_by: string
          disposition: Database["public"]["Enums"]["inspection_disposition"]
          disposition_by: string | null
          disposition_date: string | null
          disposition_reason: string | null
          id: string
          inspection_criteria: string | null
          inspection_id: string
          inspector_id: string | null
          lot_batch_number: string | null
          nc_id: string | null
          owner_id: string | null
          product_id: string | null
          purchase_order_number: string | null
          quantity_received: number | null
          received_date: string | null
          sample_size: number | null
          sampling_plan:
            | Database["public"]["Enums"]["sampling_plan_type"]
            | null
          status: Database["public"]["Enums"]["inspection_status"]
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          aql_level?: string | null
          coc_received?: boolean | null
          coc_reference?: string | null
          company_id: string
          created_at?: string
          created_by: string
          disposition?: Database["public"]["Enums"]["inspection_disposition"]
          disposition_by?: string | null
          disposition_date?: string | null
          disposition_reason?: string | null
          id?: string
          inspection_criteria?: string | null
          inspection_id: string
          inspector_id?: string | null
          lot_batch_number?: string | null
          nc_id?: string | null
          owner_id?: string | null
          product_id?: string | null
          purchase_order_number?: string | null
          quantity_received?: number | null
          received_date?: string | null
          sample_size?: number | null
          sampling_plan?:
            | Database["public"]["Enums"]["sampling_plan_type"]
            | null
          status?: Database["public"]["Enums"]["inspection_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          aql_level?: string | null
          coc_received?: boolean | null
          coc_reference?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          disposition?: Database["public"]["Enums"]["inspection_disposition"]
          disposition_by?: string | null
          disposition_date?: string | null
          disposition_reason?: string | null
          id?: string
          inspection_criteria?: string | null
          inspection_id?: string
          inspector_id?: string | null
          lot_batch_number?: string | null
          nc_id?: string | null
          owner_id?: string | null
          product_id?: string | null
          purchase_order_number?: string | null
          quantity_received?: number | null
          received_date?: string | null
          sample_size?: number | null
          sampling_plan?:
            | Database["public"]["Enums"]["sampling_plan_type"]
            | null
          status?: Database["public"]["Enums"]["inspection_status"]
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_inspection_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incoming_inspection_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "incoming_inspection_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "incoming_inspection_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incoming_inspection_records_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      incoming_inspection_transitions: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          inspection_id: string
          to_status: string
          transition_reason: string | null
          transitioned_by: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          inspection_id: string
          to_status: string
          transition_reason?: string | null
          transitioned_by: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          inspection_id?: string
          to_status?: string
          transition_reason?: string | null
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_inspection_transitions_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "incoming_inspection_records"
            referencedColumns: ["id"]
          },
        ]
      }
      invention_disclosures: {
        Row: {
          attachments: Json | null
          co_inventors: Json | null
          commercial_potential: string | null
          company_id: string
          converted_ip_asset_id: string | null
          created_at: string | null
          description: string
          id: string
          novelty_statement: string | null
          prior_art_known: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["disclosure_status"]
          submitter_id: string
          technical_field: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          co_inventors?: Json | null
          commercial_potential?: string | null
          company_id: string
          converted_ip_asset_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          novelty_statement?: string | null
          prior_art_known?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["disclosure_status"]
          submitter_id: string
          technical_field?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          co_inventors?: Json | null
          commercial_potential?: string | null
          company_id?: string
          converted_ip_asset_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          novelty_statement?: string | null
          prior_art_known?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["disclosure_status"]
          submitter_id?: string
          technical_field?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invention_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invention_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invention_disclosures_converted_ip_asset_id_fkey"
            columns: ["converted_ip_asset_id"]
            isOneToOne: false
            referencedRelation: "ip_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_deal_notes: {
        Row: {
          created_at: string
          id: string
          investor_profile_id: string
          is_anonymous: boolean | null
          notes: Json | null
          rating: number | null
          share_settings_id: string
          share_with_company: boolean | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_profile_id: string
          is_anonymous?: boolean | null
          notes?: Json | null
          rating?: number | null
          share_settings_id: string
          share_with_company?: boolean | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_profile_id?: string
          is_anonymous?: boolean | null
          notes?: Json | null
          rating?: number | null
          share_settings_id?: string
          share_with_company?: boolean | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_deal_notes_investor_profile_id_fkey"
            columns: ["investor_profile_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_deal_notes_share_settings_id_fkey"
            columns: ["share_settings_id"]
            isOneToOne: false
            referencedRelation: "company_investor_share_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_monitor_access: {
        Row: {
          company_id: string
          created_at: string | null
          expires_at: string | null
          founder_notes: string | null
          id: string
          investor_profile_id: string
          product_id: string | null
          request_message: string | null
          requested_at: string | null
          responded_at: string | null
          responded_by: string | null
          share_settings_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          founder_notes?: string | null
          id?: string
          investor_profile_id: string
          product_id?: string | null
          request_message?: string | null
          requested_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          share_settings_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          founder_notes?: string | null
          id?: string
          investor_profile_id?: string
          product_id?: string | null
          request_message?: string | null
          requested_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          share_settings_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_monitor_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_monitor_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "investor_monitor_access_investor_profile_id_fkey"
            columns: ["investor_profile_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_monitor_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "investor_monitor_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_monitor_access_share_settings_id_fkey"
            columns: ["share_settings_id"]
            isOneToOne: false
            referencedRelation: "company_investor_share_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          accredited_self_cert: boolean | null
          admin_notes: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          investment_focus: string[] | null
          linkedin_url: string
          typical_check_size: string | null
          updated_at: string
          user_id: string
          verification_tier: string | null
          verified_at: string | null
        }
        Insert: {
          accredited_self_cert?: boolean | null
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          investment_focus?: string[] | null
          linkedin_url: string
          typical_check_size?: string | null
          updated_at?: string
          user_id: string
          verification_tier?: string | null
          verified_at?: string | null
        }
        Update: {
          accredited_self_cert?: boolean | null
          admin_notes?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          investment_focus?: string[] | null
          linkedin_url?: string
          typical_check_size?: string | null
          updated_at?: string
          user_id?: string
          verification_tier?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      investor_view_logs: {
        Row: {
          company_id: string
          id: string
          investor_profile_id: string
          product_id: string | null
          share_settings_id: string
          view_duration_seconds: number | null
          viewed_at: string
        }
        Insert: {
          company_id: string
          id?: string
          investor_profile_id: string
          product_id?: string | null
          share_settings_id: string
          view_duration_seconds?: number | null
          viewed_at?: string
        }
        Update: {
          company_id?: string
          id?: string
          investor_profile_id?: string
          product_id?: string | null
          share_settings_id?: string
          view_duration_seconds?: number | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_view_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_view_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "investor_view_logs_investor_profile_id_fkey"
            columns: ["investor_profile_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_view_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "investor_view_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_view_logs_share_settings_id_fkey"
            columns: ["share_settings_id"]
            isOneToOne: false
            referencedRelation: "company_investor_share_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_department_assignments: {
        Row: {
          company_id: string
          created_at: string
          department_name: string
          fte_allocation: number
          id: string
          invitation_id: string
          role: string[] | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department_name: string
          fte_allocation?: number
          id?: string
          invitation_id: string
          role?: string[] | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department_name?: string
          fte_allocation?: number
          id?: string
          invitation_id?: string
          role?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_department_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_department_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invitation_department_assignments_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_device_access: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invitation_id: string
          product_ids: string[]
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invitation_id: string
          product_ids?: string[]
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invitation_id?: string
          product_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "invitation_device_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_device_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invitation_device_access_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_document_access: {
        Row: {
          company_id: string
          created_at: string
          document_ids: string[]
          id: string
          invitation_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_ids?: string[]
          id?: string
          invitation_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_ids?: string[]
          id?: string
          invitation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_document_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_document_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invitation_document_access_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_module_access: {
        Row: {
          company_id: string
          created_at: string
          id: string
          invitation_id: string
          module_ids: string[]
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          invitation_id: string
          module_ids?: string[]
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          invitation_id?: string
          module_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "invitation_module_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_module_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "invitation_module_access_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "user_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_asset_products: {
        Row: {
          created_at: string | null
          id: string
          ip_asset_id: string
          notes: string | null
          product_id: string
          protection_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_asset_id: string
          notes?: string | null
          product_id: string
          protection_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_asset_id?: string
          notes?: string | null
          product_id?: string
          protection_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_asset_products_ip_asset_id_fkey"
            columns: ["ip_asset_id"]
            isOneToOne: false
            referencedRelation: "ip_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_asset_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "ip_asset_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_assets: {
        Row: {
          abstract: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          internal_reference: string | null
          inventors: Json | null
          ip_type: Database["public"]["Enums"]["ip_asset_type"]
          notes: string | null
          owner_assignee: string | null
          patent_family_id: string | null
          priority_date: string | null
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["ip_asset_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          abstract?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          internal_reference?: string | null
          inventors?: Json | null
          ip_type: Database["public"]["Enums"]["ip_asset_type"]
          notes?: string | null
          owner_assignee?: string | null
          patent_family_id?: string | null
          priority_date?: string | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["ip_asset_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          abstract?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          internal_reference?: string | null
          inventors?: Json | null
          ip_type?: Database["public"]["Enums"]["ip_asset_type"]
          notes?: string | null
          owner_assignee?: string | null
          patent_family_id?: string | null
          priority_date?: string | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["ip_asset_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      ip_costs: {
        Row: {
          amount: number
          cost_type: string
          created_at: string | null
          currency: string
          date: string
          description: string | null
          filing_id: string | null
          id: string
          invoice_reference: string | null
          ip_asset_id: string
          is_projected: boolean | null
          notes: string | null
          paid_date: string | null
          paid_status: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          cost_type: string
          created_at?: string | null
          currency?: string
          date: string
          description?: string | null
          filing_id?: string | null
          id?: string
          invoice_reference?: string | null
          ip_asset_id: string
          is_projected?: boolean | null
          notes?: string | null
          paid_date?: string | null
          paid_status?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          cost_type?: string
          created_at?: string | null
          currency?: string
          date?: string
          description?: string | null
          filing_id?: string | null
          id?: string
          invoice_reference?: string | null
          ip_asset_id?: string
          is_projected?: boolean | null
          notes?: string | null
          paid_date?: string | null
          paid_status?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_costs_filing_id_fkey"
            columns: ["filing_id"]
            isOneToOne: false
            referencedRelation: "ip_filings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_costs_ip_asset_id_fkey"
            columns: ["ip_asset_id"]
            isOneToOne: false
            referencedRelation: "ip_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_deadlines: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          deadline_type: string
          description: string | null
          due_date: string
          filing_id: string | null
          id: string
          ip_asset_id: string
          notes: string | null
          reminder_days: number[] | null
          responsible_user_id: string | null
          status: Database["public"]["Enums"]["deadline_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deadline_type: string
          description?: string | null
          due_date: string
          filing_id?: string | null
          id?: string
          ip_asset_id: string
          notes?: string | null
          reminder_days?: number[] | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["deadline_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          deadline_type?: string
          description?: string | null
          due_date?: string
          filing_id?: string | null
          id?: string
          ip_asset_id?: string
          notes?: string | null
          reminder_days?: number[] | null
          responsible_user_id?: string | null
          status?: Database["public"]["Enums"]["deadline_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_deadlines_filing_id_fkey"
            columns: ["filing_id"]
            isOneToOne: false
            referencedRelation: "ip_filings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_deadlines_ip_asset_id_fkey"
            columns: ["ip_asset_id"]
            isOneToOne: false
            referencedRelation: "ip_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_filings: {
        Row: {
          application_number: string | null
          country_region: string
          created_at: string | null
          epo_data: Json | null
          expiration_date: string | null
          filing_date: string | null
          grant_date: string | null
          grant_number: string | null
          id: string
          ip_asset_id: string
          last_synced_at: string | null
          notes: string | null
          publication_date: string | null
          publication_number: string | null
          status: string | null
          updated_at: string | null
          uspto_data: Json | null
        }
        Insert: {
          application_number?: string | null
          country_region: string
          created_at?: string | null
          epo_data?: Json | null
          expiration_date?: string | null
          filing_date?: string | null
          grant_date?: string | null
          grant_number?: string | null
          id?: string
          ip_asset_id: string
          last_synced_at?: string | null
          notes?: string | null
          publication_date?: string | null
          publication_number?: string | null
          status?: string | null
          updated_at?: string | null
          uspto_data?: Json | null
        }
        Update: {
          application_number?: string | null
          country_region?: string
          created_at?: string | null
          epo_data?: Json | null
          expiration_date?: string | null
          filing_date?: string | null
          grant_date?: string | null
          grant_number?: string | null
          id?: string
          ip_asset_id?: string
          last_synced_at?: string | null
          notes?: string | null
          publication_date?: string | null
          publication_number?: string | null
          status?: string | null
          updated_at?: string | null
          uspto_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_filings_ip_asset_id_fkey"
            columns: ["ip_asset_id"]
            isOneToOne: false
            referencedRelation: "ip_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      kol_assessments: {
        Row: {
          additional_controls_needed: string | null
          assessor_id: string
          assignment_id: string
          comments: string | null
          confidence_level: number | null
          created_at: string
          hazard_id: string
          id: string
          initial_probability: number | null
          initial_risk_rationale: string | null
          initial_severity: number | null
          residual_probability: number | null
          residual_risk_rationale: string | null
          residual_severity: number | null
          risk_control_recommendations: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          additional_controls_needed?: string | null
          assessor_id: string
          assignment_id: string
          comments?: string | null
          confidence_level?: number | null
          created_at?: string
          hazard_id: string
          id?: string
          initial_probability?: number | null
          initial_risk_rationale?: string | null
          initial_severity?: number | null
          residual_probability?: number | null
          residual_risk_rationale?: string | null
          residual_severity?: number | null
          risk_control_recommendations?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          additional_controls_needed?: string | null
          assessor_id?: string
          assignment_id?: string
          comments?: string | null
          confidence_level?: number | null
          created_at?: string
          hazard_id?: string
          id?: string
          initial_probability?: number | null
          initial_risk_rationale?: string | null
          initial_severity?: number | null
          residual_probability?: number | null
          residual_risk_rationale?: string | null
          residual_severity?: number | null
          risk_control_recommendations?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kol_assessments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "kol_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      kol_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          description: string | null
          hazard_category_id: string
          id: string
          kol_group_id: string
          product_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          hazard_category_id: string
          id?: string
          kol_group_id: string
          product_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          hazard_category_id?: string
          id?: string
          kol_group_id?: string
          product_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kol_assignments_hazard_category_id_fkey"
            columns: ["hazard_category_id"]
            isOneToOne: false
            referencedRelation: "hazard_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kol_assignments_kol_group_id_fkey"
            columns: ["kol_group_id"]
            isOneToOne: false
            referencedRelation: "kol_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      kol_group_members: {
        Row: {
          created_at: string
          expertise_notes: string | null
          group_id: string
          id: string
          is_lead: boolean | null
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expertise_notes?: string | null
          group_id: string
          id?: string
          is_lead?: boolean | null
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expertise_notes?: string | null
          group_id?: string
          id?: string
          is_lead?: boolean | null
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kol_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "kol_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      kol_groups: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          expertise_area: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expertise_area?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expertise_area?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lifecycle_phases: {
        Row: {
          baseline_end_date: string | null
          baseline_start_date: string | null
          budget_currency: string | null
          category_id: string | null
          cost_category: string | null
          deadline: string | null
          description: string | null
          end_date: string | null
          estimated_budget: number | null
          id: string
          inserted_at: string
          is_current_phase: boolean | null
          is_overdue: boolean | null
          is_pre_launch: boolean | null
          likelihood_of_success: number
          name: string
          phase_id: string
          position: number | null
          product_id: string
          progress: number | null
          start_date: string | null
          status: string
          sub_section_id: string | null
          updated_at: string
        }
        Insert: {
          baseline_end_date?: string | null
          baseline_start_date?: string | null
          budget_currency?: string | null
          category_id?: string | null
          cost_category?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          inserted_at?: string
          is_current_phase?: boolean | null
          is_overdue?: boolean | null
          is_pre_launch?: boolean | null
          likelihood_of_success?: number
          name: string
          phase_id: string
          position?: number | null
          product_id: string
          progress?: number | null
          start_date?: string | null
          status?: string
          sub_section_id?: string | null
          updated_at?: string
        }
        Update: {
          baseline_end_date?: string | null
          baseline_start_date?: string | null
          budget_currency?: string | null
          category_id?: string | null
          cost_category?: string | null
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          inserted_at?: string
          is_current_phase?: boolean | null
          is_overdue?: boolean | null
          is_pre_launch?: boolean | null
          likelihood_of_success?: number
          name?: string
          phase_id?: string
          position?: number | null
          product_id?: string
          progress?: number | null
          start_date?: string | null
          status?: string
          sub_section_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lifecycle_phases_phase_id"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifecycle_phases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "phase_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifecycle_phases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "lifecycle_phases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifecycle_phases_sub_section_id_fkey"
            columns: ["sub_section_id"]
            isOneToOne: false
            referencedRelation: "phase_sub_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      list_column_preferences: {
        Row: {
          column_order: string[] | null
          company_id: string
          created_at: string | null
          hidden_columns: string[] | null
          id: string
          module: string
          product_id: string | null
          updated_at: string | null
          view_key: string
        }
        Insert: {
          column_order?: string[] | null
          company_id: string
          created_at?: string | null
          hidden_columns?: string[] | null
          id?: string
          module: string
          product_id?: string | null
          updated_at?: string | null
          view_key?: string
        }
        Update: {
          column_order?: string[] | null
          company_id?: string
          created_at?: string | null
          hidden_columns?: string[] | null
          id?: string
          module?: string
          product_id?: string | null
          updated_at?: string | null
          view_key?: string
        }
        Relationships: []
      }
      management_review_agenda_items: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_id: string
          notes: string | null
          presenter: string | null
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_id: string
          notes?: string | null
          presenter?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_id?: string
          notes?: string | null
          presenter?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_review_agenda_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "management_review_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      management_review_attendees: {
        Row: {
          attended: boolean
          created_at: string
          id: string
          meeting_id: string
          name: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          attended?: boolean
          created_at?: string
          id?: string
          meeting_id: string
          name: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          attended?: boolean
          created_at?: string
          id?: string
          meeting_id?: string
          name?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_review_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "management_review_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      management_review_meetings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          location: string | null
          meeting_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          location?: string | null
          meeting_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          location?: string | null
          meeting_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_review_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_review_meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      management_review_minutes: {
        Row: {
          action_due_date: string | null
          action_item: string | null
          action_owner: string | null
          agenda_item_id: string | null
          content: string
          created_at: string
          decision: string | null
          id: string
          meeting_id: string
        }
        Insert: {
          action_due_date?: string | null
          action_item?: string | null
          action_owner?: string | null
          agenda_item_id?: string | null
          content?: string
          created_at?: string
          decision?: string | null
          id?: string
          meeting_id: string
        }
        Update: {
          action_due_date?: string | null
          action_item?: string | null
          action_owner?: string | null
          agenda_item_id?: string | null
          content?: string
          created_at?: string
          decision?: string | null
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_review_minutes_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "management_review_agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_review_minutes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "management_review_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      market_extension_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          id: string
          market_extension_id: string
          timing_months: number | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description: string
          id?: string
          market_extension_id: string
          timing_months?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          market_extension_id?: string
          timing_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_extension_costs_market_extension_id_fkey"
            columns: ["market_extension_id"]
            isOneToOne: false
            referencedRelation: "market_extensions"
            referencedColumns: ["id"]
          },
        ]
      }
      market_extensions: {
        Row: {
          company_id: string
          created_at: string
          estimated_launch_date: string | null
          id: string
          is_enabled: boolean
          market_code: string
          market_commercial_los: number | null
          market_name: string
          market_specific_investment: number | null
          platform_project_id: string
          regulatory_requirements: Json | null
          revenue_forecast: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          estimated_launch_date?: string | null
          id?: string
          is_enabled?: boolean
          market_code: string
          market_commercial_los?: number | null
          market_name: string
          market_specific_investment?: number | null
          platform_project_id: string
          regulatory_requirements?: Json | null
          revenue_forecast?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          estimated_launch_date?: string | null
          id?: string
          is_enabled?: boolean
          market_code?: string
          market_commercial_los?: number | null
          market_name?: string
          market_specific_investment?: number | null
          platform_project_id?: string
          regulatory_requirements?: Json | null
          revenue_forecast?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_extensions_platform_project_id_fkey"
            columns: ["platform_project_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "market_extensions_platform_project_id_fkey"
            columns: ["platform_project_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_reports: {
        Row: {
          company_id: string
          competitive_landscape_type: string | null
          created_at: string | null
          description: string | null
          executive_summary: string | null
          extracted_text: string | null
          file_name: string | null
          file_size: number | null
          file_storage_path: string | null
          file_type: string | null
          id: string
          key_findings: Json | null
          market_segments: string[] | null
          market_size_data: Json | null
          metadata: Json | null
          processing_completed_at: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string | null
          product_focus_areas: string[] | null
          report_category: string | null
          report_date: string | null
          source: string
          status: string | null
          strategic_recommendations: Json | null
          title: string
          updated_at: string | null
          upload_timestamp: string | null
          uploaded_by_user_id: string
        }
        Insert: {
          company_id: string
          competitive_landscape_type?: string | null
          created_at?: string | null
          description?: string | null
          executive_summary?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_size?: number | null
          file_storage_path?: string | null
          file_type?: string | null
          id?: string
          key_findings?: Json | null
          market_segments?: string[] | null
          market_size_data?: Json | null
          metadata?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          product_focus_areas?: string[] | null
          report_category?: string | null
          report_date?: string | null
          source: string
          status?: string | null
          strategic_recommendations?: Json | null
          title: string
          updated_at?: string | null
          upload_timestamp?: string | null
          uploaded_by_user_id: string
        }
        Update: {
          company_id?: string
          competitive_landscape_type?: string | null
          created_at?: string | null
          description?: string | null
          executive_summary?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_size?: number | null
          file_storage_path?: string | null
          file_type?: string | null
          id?: string
          key_findings?: Json | null
          market_segments?: string[] | null
          market_size_data?: Json | null
          metadata?: Json | null
          processing_completed_at?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          product_focus_areas?: string[] | null
          report_category?: string | null
          report_date?: string | null
          source?: string
          status?: string | null
          strategic_recommendations?: Json | null
          title?: string
          updated_at?: string | null
          upload_timestamp?: string | null
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      material_suppliers: {
        Row: {
          company_id: string
          created_at: string
          id: string
          inspection_requirements: string | null
          is_primary: boolean
          lead_time_days: number | null
          material_id: string
          material_specification: string | null
          minimum_order_quantity: number | null
          notes: string | null
          supplier_id: string
          supplier_part_number: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          inspection_requirements?: string | null
          is_primary?: boolean
          lead_time_days?: number | null
          material_id: string
          material_specification?: string | null
          minimum_order_quantity?: number | null
          notes?: string | null
          supplier_id: string
          supplier_part_number?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          inspection_requirements?: string | null
          is_primary?: boolean
          lead_time_days?: number | null
          material_id?: string
          material_specification?: string | null
          minimum_order_quantity?: number | null
          notes?: string | null
          supplier_id?: string
          supplier_part_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      mdr_annex_1: {
        Row: {
          chapter: string | null
          company_id: string | null
          detail: string | null
          gspr_clause: string | null
          id: string
          mdr_annex_1_attribute: string
          product_id: string | null
          question: string | null
          regulatory_dna_value: string | null
          responsibility: string | null
          responsible_party: string | null
          section: string | null
          sub_section: string | null
          verify: string | null
        }
        Insert: {
          chapter?: string | null
          company_id?: string | null
          detail?: string | null
          gspr_clause?: string | null
          id?: string
          mdr_annex_1_attribute: string
          product_id?: string | null
          question?: string | null
          regulatory_dna_value?: string | null
          responsibility?: string | null
          responsible_party?: string | null
          section?: string | null
          sub_section?: string | null
          verify?: string | null
        }
        Update: {
          chapter?: string | null
          company_id?: string | null
          detail?: string | null
          gspr_clause?: string | null
          id?: string
          mdr_annex_1_attribute?: string
          product_id?: string | null
          question?: string | null
          regulatory_dna_value?: string | null
          responsibility?: string | null
          responsible_party?: string | null
          section?: string | null
          sub_section?: string | null
          verify?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdr_annex_1_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdr_annex_1_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mdr_annex_1_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "mdr_annex_1_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          file_name: string
          file_size: number
          file_type: string | null
          id: string
          message_id: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size: number
          file_type?: string | null
          id?: string
          message_id: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number
          file_type?: string | null
          id?: string
          message_id?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_phases: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          phase_name: string
          position: number | null
          product_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          phase_name: string
          position?: number | null
          product_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          phase_name?: string
          position?: number | null
          product_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_phases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "milestone_phases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_action_items: {
        Row: {
          approval_requested_from: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_by: string | null
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          item_reference_id: string | null
          item_type: string | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          requires_approval: boolean | null
          status: Database["public"]["Enums"]["action_item_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_requested_from?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_reference_id?: string | null
          item_type?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["action_item_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_requested_from?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_reference_id?: string | null
          item_type?: string | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["action_item_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_action_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_action_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mission_activity_stream: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          related_item_id: string | null
          related_item_name: string | null
          related_item_type: string | null
          title: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          related_item_id?: string | null
          related_item_name?: string | null
          related_item_type?: string | null
          title: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          related_item_id?: string | null
          related_item_name?: string | null
          related_item_type?: string | null
          title?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_activity_stream_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_activity_stream_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mission_executive_communications: {
        Row: {
          author_id: string | null
          author_name: string | null
          company_id: string
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_published: boolean | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          published_at: string | null
          recipients: Json | null
          tags: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          company_id: string
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          published_at?: string | null
          recipients?: Json | null
          tags?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          company_id?: string
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          published_at?: string | null
          recipients?: Json | null
          tags?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_executive_communications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_executive_communications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mission_portfolio_health: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_portfolio_health_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_portfolio_health_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      mission_recent_messages: {
        Row: {
          attachments: Json | null
          company_id: string
          content: string
          created_at: string | null
          id: string
          is_read_by: Json | null
          message_type: Database["public"]["Enums"]["message_type"] | null
          recipient_ids: Json | null
          reply_to_id: string | null
          sender_id: string | null
          sender_name: string | null
          subject: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read_by?: Json | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          recipient_ids?: Json | null
          reply_to_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read_by?: Json | null
          message_type?: Database["public"]["Enums"]["message_type"] | null
          recipient_ids?: Json | null
          reply_to_id?: string | null
          sender_id?: string | null
          sender_name?: string | null
          subject?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_recent_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_recent_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "mission_recent_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "mission_recent_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_requires_attention: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          item_id: string | null
          item_type: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_id?: string | null
          item_type: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_id?: string | null
          item_type?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_requires_attention_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_requires_attention_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      module_group_validations: {
        Row: {
          company_id: string
          conditions: string | null
          created_at: string | null
          id: string
          invalidated_by_core: boolean | null
          invalidated_service: string | null
          iq_evidence_doc_ids: string[] | null
          iq_evidence_notes: string | null
          iq_reasoning: string | null
          iq_signatures: Json | null
          iq_test_environment: Json | null
          iq_test_step_results: Json | null
          iq_verdict: string | null
          module_group_id: string
          oq_deviations_noted: string | null
          oq_evidence_doc_ids: string[] | null
          oq_reasoning: string | null
          oq_risk_accepted: boolean | null
          oq_risk_rationale: string | null
          oq_signatures: Json | null
          oq_test_environment: Json | null
          oq_test_step_results: Json | null
          oq_verdict: string | null
          overall_rationale: string | null
          overall_verdict: string | null
          pq_evidence_doc_ids: string[] | null
          pq_evidence_notes: string | null
          pq_reasoning: string | null
          pq_signatures: Json | null
          pq_test_environment: Json | null
          pq_test_step_results: Json | null
          pq_verdict: string | null
          release_id: string | null
          release_version: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          company_id: string
          conditions?: string | null
          created_at?: string | null
          id?: string
          invalidated_by_core?: boolean | null
          invalidated_service?: string | null
          iq_evidence_doc_ids?: string[] | null
          iq_evidence_notes?: string | null
          iq_reasoning?: string | null
          iq_signatures?: Json | null
          iq_test_environment?: Json | null
          iq_test_step_results?: Json | null
          iq_verdict?: string | null
          module_group_id: string
          oq_deviations_noted?: string | null
          oq_evidence_doc_ids?: string[] | null
          oq_reasoning?: string | null
          oq_risk_accepted?: boolean | null
          oq_risk_rationale?: string | null
          oq_signatures?: Json | null
          oq_test_environment?: Json | null
          oq_test_step_results?: Json | null
          oq_verdict?: string | null
          overall_rationale?: string | null
          overall_verdict?: string | null
          pq_evidence_doc_ids?: string[] | null
          pq_evidence_notes?: string | null
          pq_reasoning?: string | null
          pq_signatures?: Json | null
          pq_test_environment?: Json | null
          pq_test_step_results?: Json | null
          pq_verdict?: string | null
          release_id?: string | null
          release_version?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          company_id?: string
          conditions?: string | null
          created_at?: string | null
          id?: string
          invalidated_by_core?: boolean | null
          invalidated_service?: string | null
          iq_evidence_doc_ids?: string[] | null
          iq_evidence_notes?: string | null
          iq_reasoning?: string | null
          iq_signatures?: Json | null
          iq_test_environment?: Json | null
          iq_test_step_results?: Json | null
          iq_verdict?: string | null
          module_group_id?: string
          oq_deviations_noted?: string | null
          oq_evidence_doc_ids?: string[] | null
          oq_reasoning?: string | null
          oq_risk_accepted?: boolean | null
          oq_risk_rationale?: string | null
          oq_signatures?: Json | null
          oq_test_environment?: Json | null
          oq_test_step_results?: Json | null
          oq_verdict?: string | null
          overall_rationale?: string | null
          overall_verdict?: string | null
          pq_evidence_doc_ids?: string[] | null
          pq_evidence_notes?: string | null
          pq_reasoning?: string | null
          pq_signatures?: Json | null
          pq_test_environment?: Json | null
          pq_test_step_results?: Json | null
          pq_verdict?: string | null
          release_id?: string | null
          release_version?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_group_validations_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "xyreg_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      multiplier_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_initial_multiplier: number | null
          new_recurring_multiplier: number | null
          old_initial_multiplier: number | null
          old_recurring_multiplier: number | null
          relationship_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_initial_multiplier?: number | null
          new_recurring_multiplier?: number | null
          old_initial_multiplier?: number | null
          old_recurring_multiplier?: number | null
          relationship_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_initial_multiplier?: number | null
          new_recurring_multiplier?: number | null
          old_initial_multiplier?: number | null
          old_recurring_multiplier?: number | null
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiplier_history_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "product_accessory_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      nc_evidence: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          file_name: string
          id: string
          nc_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_name: string
          id?: string
          nc_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_name?: string
          id?: string
          nc_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nc_evidence_nc_id_fkey"
            columns: ["nc_id"]
            isOneToOne: false
            referencedRelation: "nonconformity_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nc_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nc_state_transitions: {
        Row: {
          created_at: string
          digital_signature: string | null
          from_status: string | null
          id: string
          nc_id: string
          to_status: string
          transition_reason: string | null
          transitioned_by: string
        }
        Insert: {
          created_at?: string
          digital_signature?: string | null
          from_status?: string | null
          id?: string
          nc_id: string
          to_status: string
          transition_reason?: string | null
          transitioned_by: string
        }
        Update: {
          created_at?: string
          digital_signature?: string | null
          from_status?: string | null
          id?: string
          nc_id?: string
          to_status?: string
          transition_reason?: string | null
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "nc_state_transitions_nc_id_fkey"
            columns: ["nc_id"]
            isOneToOne: false
            referencedRelation: "nonconformity_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nc_state_transitions_transitioned_by_fkey"
            columns: ["transitioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      new_eudamed_device: {
        Row: {
          active: boolean | null
          administering_medicine: boolean | null
          applicable_legislation: string | null
          basic_udi_di_code: string | null
          basic_udi_version_date: string | null
          contain_latex: boolean | null
          created_at: string | null
          device_model: string | null
          device_name: string | null
          direct_marking: boolean | null
          implantable: boolean | null
          issuing_agency: string | null
          manufacturer_address: string | null
          manufacturer_ca_address: string | null
          manufacturer_ca_country: string | null
          manufacturer_ca_email: string | null
          manufacturer_ca_name: string | null
          manufacturer_ca_phone: string | null
          manufacturer_ca_postcode: string | null
          manufacturer_country: string | null
          manufacturer_email: string | null
          manufacturer_id_srn: string | null
          manufacturer_last_update_date: string | null
          manufacturer_most_recent_update: string | null
          manufacturer_organization: string | null
          manufacturer_phone: string | null
          manufacturer_postcode: string | null
          manufacturer_prrc_address: string | null
          manufacturer_prrc_country: string | null
          manufacturer_prrc_email: string | null
          manufacturer_prrc_first_name: string | null
          manufacturer_prrc_last_name: string | null
          manufacturer_prrc_phone: string | null
          manufacturer_prrc_postcode: string | null
          manufacturer_prrc_responsible_for: string | null
          manufacturer_status: string | null
          manufacturer_uuid: string | null
          manufacturer_website: string | null
          market_distribution: string | null
          max_reuses: number | null
          measuring: boolean | null
          most_recent_update: string | null
          nomenclature_codes: string | null
          placed_on_the_market: string | null
          quantity_of_device: number | null
          reference_number: string | null
          reprocessed: boolean | null
          reusable: boolean | null
          risk_class: string | null
          single_use: boolean | null
          status: string | null
          sterile: boolean | null
          sterilization_need: boolean | null
          trade_names: string | null
          udi_di: string | null
          udi_version_date: string | null
          updated_at: string | null
          uuid: string
        }
        Insert: {
          active?: boolean | null
          administering_medicine?: boolean | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          basic_udi_version_date?: string | null
          contain_latex?: boolean | null
          created_at?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: boolean | null
          implantable?: boolean | null
          issuing_agency?: string | null
          manufacturer_address?: string | null
          manufacturer_ca_address?: string | null
          manufacturer_ca_country?: string | null
          manufacturer_ca_email?: string | null
          manufacturer_ca_name?: string | null
          manufacturer_ca_phone?: string | null
          manufacturer_ca_postcode?: string | null
          manufacturer_country?: string | null
          manufacturer_email?: string | null
          manufacturer_id_srn?: string | null
          manufacturer_last_update_date?: string | null
          manufacturer_most_recent_update?: string | null
          manufacturer_organization?: string | null
          manufacturer_phone?: string | null
          manufacturer_postcode?: string | null
          manufacturer_prrc_address?: string | null
          manufacturer_prrc_country?: string | null
          manufacturer_prrc_email?: string | null
          manufacturer_prrc_first_name?: string | null
          manufacturer_prrc_last_name?: string | null
          manufacturer_prrc_phone?: string | null
          manufacturer_prrc_postcode?: string | null
          manufacturer_prrc_responsible_for?: string | null
          manufacturer_status?: string | null
          manufacturer_uuid?: string | null
          manufacturer_website?: string | null
          market_distribution?: string | null
          max_reuses?: number | null
          measuring?: boolean | null
          most_recent_update?: string | null
          nomenclature_codes?: string | null
          placed_on_the_market?: string | null
          quantity_of_device?: number | null
          reference_number?: string | null
          reprocessed?: boolean | null
          reusable?: boolean | null
          risk_class?: string | null
          single_use?: boolean | null
          status?: string | null
          sterile?: boolean | null
          sterilization_need?: boolean | null
          trade_names?: string | null
          udi_di?: string | null
          udi_version_date?: string | null
          updated_at?: string | null
          uuid: string
        }
        Update: {
          active?: boolean | null
          administering_medicine?: boolean | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          basic_udi_version_date?: string | null
          contain_latex?: boolean | null
          created_at?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: boolean | null
          implantable?: boolean | null
          issuing_agency?: string | null
          manufacturer_address?: string | null
          manufacturer_ca_address?: string | null
          manufacturer_ca_country?: string | null
          manufacturer_ca_email?: string | null
          manufacturer_ca_name?: string | null
          manufacturer_ca_phone?: string | null
          manufacturer_ca_postcode?: string | null
          manufacturer_country?: string | null
          manufacturer_email?: string | null
          manufacturer_id_srn?: string | null
          manufacturer_last_update_date?: string | null
          manufacturer_most_recent_update?: string | null
          manufacturer_organization?: string | null
          manufacturer_phone?: string | null
          manufacturer_postcode?: string | null
          manufacturer_prrc_address?: string | null
          manufacturer_prrc_country?: string | null
          manufacturer_prrc_email?: string | null
          manufacturer_prrc_first_name?: string | null
          manufacturer_prrc_last_name?: string | null
          manufacturer_prrc_phone?: string | null
          manufacturer_prrc_postcode?: string | null
          manufacturer_prrc_responsible_for?: string | null
          manufacturer_status?: string | null
          manufacturer_uuid?: string | null
          manufacturer_website?: string | null
          market_distribution?: string | null
          max_reuses?: number | null
          measuring?: boolean | null
          most_recent_update?: string | null
          nomenclature_codes?: string | null
          placed_on_the_market?: string | null
          quantity_of_device?: number | null
          reference_number?: string | null
          reprocessed?: boolean | null
          reusable?: boolean | null
          risk_class?: string | null
          single_use?: boolean | null
          status?: string | null
          sterile?: boolean | null
          sterilization_need?: boolean | null
          trade_names?: string | null
          udi_di?: string | null
          udi_version_date?: string | null
          updated_at?: string | null
          uuid?: string
        }
        Relationships: []
      }
      new_pricing_company_plans: {
        Row: {
          ai_booster_packs: number | null
          cancelled_at: string | null
          company_id: string
          created_at: string | null
          expires_at: string | null
          extra_devices: number | null
          extra_module_slots: number | null
          id: string
          metadata: Json | null
          monthly_total: number | null
          plan_id: string
          started_at: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          ai_booster_packs?: number | null
          cancelled_at?: string | null
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          extra_devices?: number | null
          extra_module_slots?: number | null
          id?: string
          metadata?: Json | null
          monthly_total?: number | null
          plan_id: string
          started_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_booster_packs?: number | null
          cancelled_at?: string | null
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          extra_devices?: number | null
          extra_module_slots?: number | null
          id?: string
          metadata?: Json | null
          monthly_total?: number | null
          plan_id?: string
          started_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_pricing_company_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_pricing_company_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "new_pricing_company_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "new_pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      new_pricing_plan_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          company_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_plan_id: string
          old_plan_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_plan_id: string
          old_plan_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_plan_id?: string
          old_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_pricing_plan_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_pricing_plan_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "new_pricing_plan_history_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "new_pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_pricing_plan_history_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "new_pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      new_pricing_plans: {
        Row: {
          ai_booster_cost: number | null
          ai_booster_credits: number | null
          created_at: string | null
          description: string | null
          display_name: string
          extra_device_cost: number | null
          extra_module_slot_cost: number | null
          features: Json | null
          id: string
          included_ai_credits: number | null
          included_devices: number | null
          included_module_slots: number | null
          is_active: boolean | null
          is_free: boolean | null
          menu_access: Json | null
          monthly_price: number | null
          name: string
          restrictions: Json | null
          sort_order: number | null
          subtitle: string | null
          updated_at: string | null
          yearly_price: number | null
        }
        Insert: {
          ai_booster_cost?: number | null
          ai_booster_credits?: number | null
          created_at?: string | null
          description?: string | null
          display_name: string
          extra_device_cost?: number | null
          extra_module_slot_cost?: number | null
          features?: Json | null
          id?: string
          included_ai_credits?: number | null
          included_devices?: number | null
          included_module_slots?: number | null
          is_active?: boolean | null
          is_free?: boolean | null
          menu_access?: Json | null
          monthly_price?: number | null
          name: string
          restrictions?: Json | null
          sort_order?: number | null
          subtitle?: string | null
          updated_at?: string | null
          yearly_price?: number | null
        }
        Update: {
          ai_booster_cost?: number | null
          ai_booster_credits?: number | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          extra_device_cost?: number | null
          extra_module_slot_cost?: number | null
          features?: Json | null
          id?: string
          included_ai_credits?: number | null
          included_devices?: number | null
          included_module_slots?: number | null
          is_active?: boolean | null
          is_free?: boolean | null
          menu_access?: Json | null
          monthly_price?: number | null
          name?: string
          restrictions?: Json | null
          sort_order?: number | null
          subtitle?: string | null
          updated_at?: string | null
          yearly_price?: number | null
        }
        Relationships: []
      }
      new_pricing_signups: {
        Row: {
          company_id: string | null
          company_name: string | null
          converted_at: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string | null
          selected_plan: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          converted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone?: string | null
          selected_plan: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string | null
          selected_plan?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_pricing_signups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_pricing_signups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      nomenclatures: {
        Row: {
          cnd_code: string
          cnd_uuid: string
          created_at: string | null
          description: string | null
          gmdn_codes: Json | null
          id: number
          level: number | null
          parent_uuid: string | null
          updated_at: string | null
        }
        Insert: {
          cnd_code: string
          cnd_uuid: string
          created_at?: string | null
          description?: string | null
          gmdn_codes?: Json | null
          id?: number
          level?: number | null
          parent_uuid?: string | null
          updated_at?: string | null
        }
        Update: {
          cnd_code?: string
          cnd_uuid?: string
          created_at?: string | null
          description?: string | null
          gmdn_codes?: Json | null
          id?: number
          level?: number | null
          parent_uuid?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent"
            columns: ["parent_uuid"]
            isOneToOne: false
            referencedRelation: "nomenclatures"
            referencedColumns: ["cnd_uuid"]
          },
        ]
      }
      nonconformity_records: {
        Row: {
          affected_field_ids: Json | null
          affected_requirement_ids: Json | null
          batch_lot_number: string | null
          closed_by: string | null
          closure_date: string | null
          company_id: string
          created_at: string
          created_by: string
          description_is: string
          description_should_be: string
          disposition: string | null
          disposition_justification: string | null
          id: string
          linked_capa_id: string | null
          linked_ccr_id: string | null
          nc_id: string
          owner_id: string | null
          product_id: string | null
          quality_approved_at: string | null
          quality_approved_by: string | null
          rca_data: Json | null
          rca_methodologies: string[] | null
          rca_methodology: string | null
          root_cause_category: string | null
          root_cause_summary: string | null
          serial_number: string | null
          severity: string | null
          source_id: string | null
          source_type: string
          status: string
          target_closure_date: string | null
          target_disposition_date: string | null
          target_verification_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          affected_field_ids?: Json | null
          affected_requirement_ids?: Json | null
          batch_lot_number?: string | null
          closed_by?: string | null
          closure_date?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description_is?: string
          description_should_be?: string
          disposition?: string | null
          disposition_justification?: string | null
          id?: string
          linked_capa_id?: string | null
          linked_ccr_id?: string | null
          nc_id?: string
          owner_id?: string | null
          product_id?: string | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          rca_data?: Json | null
          rca_methodologies?: string[] | null
          rca_methodology?: string | null
          root_cause_category?: string | null
          root_cause_summary?: string | null
          serial_number?: string | null
          severity?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          target_closure_date?: string | null
          target_disposition_date?: string | null
          target_verification_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          affected_field_ids?: Json | null
          affected_requirement_ids?: Json | null
          batch_lot_number?: string | null
          closed_by?: string | null
          closure_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description_is?: string
          description_should_be?: string
          disposition?: string | null
          disposition_justification?: string | null
          id?: string
          linked_capa_id?: string | null
          linked_ccr_id?: string | null
          nc_id?: string
          owner_id?: string | null
          product_id?: string | null
          quality_approved_at?: string | null
          quality_approved_by?: string | null
          rca_data?: Json | null
          rca_methodologies?: string[] | null
          rca_methodology?: string | null
          root_cause_category?: string | null
          root_cause_summary?: string | null
          serial_number?: string | null
          severity?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          target_closure_date?: string | null
          target_disposition_date?: string | null
          target_verification_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nonconformity_records_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformity_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformity_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "nonconformity_records_linked_capa_id_fkey"
            columns: ["linked_capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformity_records_linked_ccr_id_fkey"
            columns: ["linked_ccr_id"]
            isOneToOne: false
            referencedRelation: "change_control_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformity_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformity_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "nonconformity_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformity_records_quality_approved_by_fkey"
            columns: ["quality_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          document_id: string | null
          document_name: string | null
          group_id: string | null
          id: string
          is_read: boolean
          is_remove: boolean | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          document_id?: string | null
          document_name?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean
          is_remove?: boolean | null
          message?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          document_id?: string | null
          document_name?: string | null
          group_id?: string | null
          id?: string
          is_read?: boolean
          is_remove?: boolean | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notified_bodies: {
        Row: {
          address: string
          audit_fee_per_day_max: number | null
          audit_fee_per_day_min: number | null
          category: string | null
          contact_number: string
          country: string
          created_at: string | null
          data_source: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          nb_number: number
          notes: string | null
          scope_depth: string | null
          scope_drug_device_combinations: boolean
          scope_high_risk_active_implantables: boolean
          scope_high_risk_implants_non_active: boolean
          scope_ivdr: boolean
          scope_mdr: boolean
          scope_medical_software: boolean
          scope_sterilization_methods: boolean
          strengths: string[] | null
          typical_lead_time_months_max: number | null
          typical_lead_time_months_min: number | null
          updated_at: string | null
          waitlist_status: string | null
          website: string | null
        }
        Insert: {
          address: string
          audit_fee_per_day_max?: number | null
          audit_fee_per_day_min?: number | null
          category?: string | null
          contact_number: string
          country: string
          created_at?: string | null
          data_source?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          nb_number: number
          notes?: string | null
          scope_depth?: string | null
          scope_drug_device_combinations?: boolean
          scope_high_risk_active_implantables?: boolean
          scope_high_risk_implants_non_active?: boolean
          scope_ivdr?: boolean
          scope_mdr?: boolean
          scope_medical_software?: boolean
          scope_sterilization_methods?: boolean
          strengths?: string[] | null
          typical_lead_time_months_max?: number | null
          typical_lead_time_months_min?: number | null
          updated_at?: string | null
          waitlist_status?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          audit_fee_per_day_max?: number | null
          audit_fee_per_day_min?: number | null
          category?: string | null
          contact_number?: string
          country?: string
          created_at?: string | null
          data_source?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          nb_number?: number
          notes?: string | null
          scope_depth?: string | null
          scope_drug_device_combinations?: boolean
          scope_high_risk_active_implantables?: boolean
          scope_high_risk_implants_non_active?: boolean
          scope_ivdr?: boolean
          scope_mdr?: boolean
          scope_medical_software?: boolean
          scope_sterilization_methods?: boolean
          strengths?: string[] | null
          typical_lead_time_months_max?: number | null
          typical_lead_time_months_min?: number | null
          updated_at?: string | null
          waitlist_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      notified_bodies_backup: {
        Row: {
          address: string | null
          contact_number: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          nb_number: number | null
          scope_drug_device_combinations: boolean | null
          scope_high_risk_active_implantables: boolean | null
          scope_high_risk_implants_non_active: boolean | null
          scope_ivdr: boolean | null
          scope_mdr: boolean | null
          scope_medical_software: boolean | null
          scope_sterilization_methods: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          nb_number?: number | null
          scope_drug_device_combinations?: boolean | null
          scope_high_risk_active_implantables?: boolean | null
          scope_high_risk_implants_non_active?: boolean | null
          scope_ivdr?: boolean | null
          scope_mdr?: boolean | null
          scope_medical_software?: boolean | null
          scope_sterilization_methods?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_number?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          nb_number?: number | null
          scope_drug_device_combinations?: boolean | null
          scope_high_risk_active_implantables?: boolean | null
          scope_high_risk_implants_non_active?: boolean | null
          scope_ivdr?: boolean | null
          scope_mdr?: boolean | null
          scope_medical_software?: boolean | null
          scope_sterilization_methods?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      password_change_log: {
        Row: {
          change_source: string
          changed_at: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          change_source?: string
          changed_at?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          change_source?: string
          changed_at?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_company_users: {
        Row: {
          access_level: string
          company_id: string
          created_at: string
          created_by: string | null
          email: string
          external_role: string | null
          functional_area: string | null
          id: string
          is_internal: boolean
          members: string | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_level: string
          company_id: string
          created_at?: string
          created_by?: string | null
          email: string
          external_role?: string | null
          functional_area?: string | null
          id?: string
          is_internal?: boolean
          members?: string | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_level?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          external_role?: string | null
          functional_area?: string | null
          id?: string
          is_internal?: boolean
          members?: string | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      permission_categories: {
        Row: {
          category_key: string
          category_name: string
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          category_key: string
          category_name: string
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          category_key?: string
          category_name?: string
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          permission_key: string
          permission_name: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          permission_key: string
          permission_name: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          permission_key?: string
          permission_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      phase_assigned_document_template: {
        Row: {
          approval_date: string | null
          approval_note: string | null
          approved_by: string | null
          approver_due_date: string | null
          approver_group_ids: string[] | null
          approver_user_ids: string[] | null
          author: string | null
          authors_ids: Json | null
          brief_summary: string | null
          classes: Json[] | null
          classes_by_market: Json | null
          company_id: string | null
          created_at: string | null
          current_version_id: string | null
          date: string | null
          deadline: string | null
          description: string | null
          device_scope: Json | null
          document_number: string | null
          document_reference: string | null
          document_scope: Database["public"]["Enums"]["document_scope"] | null
          document_type: string | null
          due_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          inserted_at: string | null
          is_current_effective_version: boolean | null
          is_excluded: boolean | null
          is_predefined_core_template: boolean | null
          is_record: boolean | null
          markets: Json | null
          milestone_due_date: string | null
          name: string
          need_template_update: boolean | null
          next_review_date: string | null
          phase_id: string
          phases: Json[] | null
          platform_id: string | null
          platform_reference_id: string | null
          product_id: string | null
          public_url: string | null
          record_id: string | null
          reference_document_ids: string[] | null
          reviewer_group_id: string | null
          reviewer_group_ids: string[] | null
          reviewer_user_ids: string[] | null
          reviewers: Json | null
          section_ids: string[] | null
          start_date: string | null
          status: string | null
          sub_section: string | null
          tags: string[] | null
          tech_applicability: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_note?: string | null
          approved_by?: string | null
          approver_due_date?: string | null
          approver_group_ids?: string[] | null
          approver_user_ids?: string[] | null
          author?: string | null
          authors_ids?: Json | null
          brief_summary?: string | null
          classes?: Json[] | null
          classes_by_market?: Json | null
          company_id?: string | null
          created_at?: string | null
          current_version_id?: string | null
          date?: string | null
          deadline?: string | null
          description?: string | null
          device_scope?: Json | null
          document_number?: string | null
          document_reference?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          inserted_at?: string | null
          is_current_effective_version?: boolean | null
          is_excluded?: boolean | null
          is_predefined_core_template?: boolean | null
          is_record?: boolean | null
          markets?: Json | null
          milestone_due_date?: string | null
          name: string
          need_template_update?: boolean | null
          next_review_date?: string | null
          phase_id: string
          phases?: Json[] | null
          platform_id?: string | null
          platform_reference_id?: string | null
          product_id?: string | null
          public_url?: string | null
          record_id?: string | null
          reference_document_ids?: string[] | null
          reviewer_group_id?: string | null
          reviewer_group_ids?: string[] | null
          reviewer_user_ids?: string[] | null
          reviewers?: Json | null
          section_ids?: string[] | null
          start_date?: string | null
          status?: string | null
          sub_section?: string | null
          tags?: string[] | null
          tech_applicability?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_note?: string | null
          approved_by?: string | null
          approver_due_date?: string | null
          approver_group_ids?: string[] | null
          approver_user_ids?: string[] | null
          author?: string | null
          authors_ids?: Json | null
          brief_summary?: string | null
          classes?: Json[] | null
          classes_by_market?: Json | null
          company_id?: string | null
          created_at?: string | null
          current_version_id?: string | null
          date?: string | null
          deadline?: string | null
          description?: string | null
          device_scope?: Json | null
          document_number?: string | null
          document_reference?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          due_date?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          inserted_at?: string | null
          is_current_effective_version?: boolean | null
          is_excluded?: boolean | null
          is_predefined_core_template?: boolean | null
          is_record?: boolean | null
          markets?: Json | null
          milestone_due_date?: string | null
          name?: string
          need_template_update?: boolean | null
          next_review_date?: string | null
          phase_id?: string
          phases?: Json[] | null
          platform_id?: string | null
          platform_reference_id?: string | null
          product_id?: string | null
          public_url?: string | null
          record_id?: string | null
          reference_document_ids?: string[] | null
          reviewer_group_id?: string | null
          reviewer_group_ids?: string[] | null
          reviewer_user_ids?: string[] | null
          reviewers?: Json | null
          section_ids?: string[] | null
          start_date?: string | null
          status?: string | null
          sub_section?: string | null
          tags?: string[] | null
          tech_applicability?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_assigned_document_template_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "phase_document_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_assigned_document_template_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_assigned_documents: {
        Row: {
          classes: Json[] | null
          classes_by_market: Json | null
          created_at: string | null
          deadline: string | null
          description: string | null
          document_scope: Database["public"]["Enums"]["document_scope"] | null
          document_type: string | null
          id: string
          is_excluded: boolean | null
          markets: Json | null
          name: string
          phase_id: string
          phases: Json[] | null
          status: string | null
          tech_applicability: string | null
          template_data: Json | null
          updated_at: string | null
        }
        Insert: {
          classes?: Json[] | null
          classes_by_market?: Json | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          id?: string
          is_excluded?: boolean | null
          markets?: Json | null
          name: string
          phase_id: string
          phases?: Json[] | null
          status?: string | null
          tech_applicability?: string | null
          template_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          classes?: Json[] | null
          classes_by_market?: Json | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          id?: string
          is_excluded?: boolean | null
          markets?: Json | null
          name?: string
          phase_id?: string
          phases?: Json[] | null
          status?: string | null
          tech_applicability?: string | null
          template_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_phase_assigned_documents_phase_id"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_assigned_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_budget_items: {
        Row: {
          active_end_date: string | null
          active_start_date: string | null
          actual_cost: number | null
          best_case_amount: number | null
          category: string
          cost: number
          created_at: string
          currency: string
          feasibility_portfolio_id: string | null
          frequency: string | null
          id: string
          is_feasibility: boolean
          item_name: string
          likely_case_amount: number | null
          phase_id: string
          post_launch_cost: number | null
          timing_type: string | null
          updated_at: string
          worst_case_amount: number | null
        }
        Insert: {
          active_end_date?: string | null
          active_start_date?: string | null
          actual_cost?: number | null
          best_case_amount?: number | null
          category: string
          cost?: number
          created_at?: string
          currency?: string
          feasibility_portfolio_id?: string | null
          frequency?: string | null
          id?: string
          is_feasibility?: boolean
          item_name: string
          likely_case_amount?: number | null
          phase_id: string
          post_launch_cost?: number | null
          timing_type?: string | null
          updated_at?: string
          worst_case_amount?: number | null
        }
        Update: {
          active_end_date?: string | null
          active_start_date?: string | null
          actual_cost?: number | null
          best_case_amount?: number | null
          category?: string
          cost?: number
          created_at?: string
          currency?: string
          feasibility_portfolio_id?: string | null
          frequency?: string | null
          id?: string
          is_feasibility?: boolean
          item_name?: string
          likely_case_amount?: number | null
          phase_id?: string
          post_launch_cost?: number | null
          timing_type?: string | null
          updated_at?: string
          worst_case_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_budget_items_feasibility_portfolio_id_fkey"
            columns: ["feasibility_portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_budget_items_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "lifecycle_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_categories: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_system_category: boolean | null
          name: string
          position: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_system_category?: boolean | null
          name: string
          position?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_system_category?: boolean | null
          name?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      phase_category_assignments: {
        Row: {
          category_id: string
          company_phase_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          company_phase_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          company_phase_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "phase_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_category_assignments_company_phase_id_fkey"
            columns: ["company_phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_dependencies: {
        Row: {
          company_id: string
          created_at: string
          dependency_type: string
          end_phase_id: string | null
          id: string
          lag_days: number
          source_phase_id: string
          target_phase_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          dependency_type: string
          end_phase_id?: string | null
          id?: string
          lag_days?: number
          source_phase_id: string
          target_phase_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dependency_type?: string
          end_phase_id?: string | null
          id?: string
          lag_days?: number
          source_phase_id?: string
          target_phase_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_dependencies_end_phase_id_fkey"
            columns: ["end_phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_document_template_versions: {
        Row: {
          change_notes: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_current: boolean | null
          template_assignment_id: string
          uploaded_at: string | null
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_current?: boolean | null
          template_assignment_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_current?: boolean | null
          template_assignment_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "phase_document_template_versions_template_assignment_id_fkey"
            columns: ["template_assignment_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_document_templates: {
        Row: {
          classes_by_market: Json | null
          company_phase_id: string
          created_at: string | null
          deadline: string | null
          document_scope: Database["public"]["Enums"]["document_scope"] | null
          document_type: string | null
          id: string
          markets: Json | null
          name: string
          status: string | null
          tech_applicability: string | null
          updated_at: string | null
        }
        Insert: {
          classes_by_market?: Json | null
          company_phase_id: string
          created_at?: string | null
          deadline?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          id?: string
          markets?: Json | null
          name: string
          status?: string | null
          tech_applicability?: string | null
          updated_at?: string | null
        }
        Update: {
          classes_by_market?: Json | null
          company_phase_id?: string
          created_at?: string | null
          deadline?: string | null
          document_scope?: Database["public"]["Enums"]["document_scope"] | null
          document_type?: string | null
          id?: string
          markets?: Json | null
          name?: string
          status?: string | null
          tech_applicability?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_document_templates_company_phase_id_fkey"
            columns: ["company_phase_id"]
            isOneToOne: false
            referencedRelation: "company_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_documents: {
        Row: {
          classes: string[] | null
          classes_by_market: Json | null
          id: string
          inserted_at: string
          markets: Json | null
          name: string
          phase_id: string
          position: number
          tech_applicability: string | null
          updated_at: string
        }
        Insert: {
          classes?: string[] | null
          classes_by_market?: Json | null
          id?: string
          inserted_at?: string
          markets?: Json | null
          name: string
          phase_id: string
          position?: number
          tech_applicability?: string | null
          updated_at?: string
        }
        Update: {
          classes?: string[] | null
          classes_by_market?: Json | null
          id?: string
          inserted_at?: string
          markets?: Json | null
          name?: string
          phase_id?: string
          position?: number
          tech_applicability?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_groups: {
        Row: {
          company_id: string
          id: string
          inserted_at: string
          is_default: boolean
          is_deletable: boolean
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          company_id: string
          id?: string
          inserted_at?: string
          is_default?: boolean
          is_deletable?: boolean
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          id?: string
          inserted_at?: string
          is_default?: boolean
          is_deletable?: boolean
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      phase_recommended_documents: {
        Row: {
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          inserted_at: string
          name: string
          phase_id: string
          position: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          inserted_at?: string
          name: string
          phase_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          inserted_at?: string
          name?: string
          phase_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_recommended_documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_sub_sections: {
        Row: {
          category_ids: string[] | null
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number | null
          updated_at: string | null
        }
        Insert: {
          category_ids?: string[] | null
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          category_ids?: string[] | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_sub_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_sub_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      phases: {
        Row: {
          category_id: string | null
          company_id: string
          description: string | null
          group_id: string | null
          id: string
          inserted_at: string
          is_custom: boolean
          is_deletable: boolean
          is_pre_launch: boolean | null
          is_predefined_core_phase: boolean | null
          is_saas_default: boolean
          name: string
          position: number
          recommended_docs: Json | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          company_id: string
          description?: string | null
          group_id?: string | null
          id?: string
          inserted_at?: string
          is_custom?: boolean
          is_deletable?: boolean
          is_pre_launch?: boolean | null
          is_predefined_core_phase?: boolean | null
          is_saas_default?: boolean
          name: string
          position?: number
          recommended_docs?: Json | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          company_id?: string
          description?: string | null
          group_id?: string | null
          id?: string
          inserted_at?: string
          is_custom?: boolean
          is_deletable?: boolean
          is_pre_launch?: boolean | null
          is_predefined_core_phase?: boolean | null
          is_saas_default?: boolean
          name?: string
          position?: number
          recommended_docs?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "phase_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phases_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "phase_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_category: {
        Row: {
          created_at: string
          id: string
          plan_category_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          plan_category_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          plan_category_name?: string | null
        }
        Relationships: []
      }
      plan_feature: {
        Row: {
          created_at: string
          feature_name: string | null
          feature_value: string | null
          id: number
          plan_category_id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          feature_name?: string | null
          feature_value?: string | null
          id?: number
          plan_category_id?: string
          plan_id?: string
        }
        Update: {
          created_at?: string
          feature_name?: string | null
          feature_value?: string | null
          id?: number
          plan_category_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_feature_plan_category_id_fkey"
            columns: ["plan_category_id"]
            isOneToOne: false
            referencedRelation: "plan_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_feature_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plan_subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          max_companies: number | null
          max_products: number | null
          max_users: number | null
          plan_key: string
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          max_companies?: number | null
          max_products?: number | null
          max_users?: number | null
          plan_key: string
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          max_companies?: number | null
          max_products?: number | null
          max_users?: number | null
          plan_key?: string
        }
        Relationships: []
      }
      plan_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          checkout_session_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_plan: string
          old_plan: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          checkout_session_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_plan: string
          old_plan?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          checkout_session_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_plan?: string
          old_plan?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_history_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "stripe_checkout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "plan_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "stripe_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_subscription: {
        Row: {
          created_at: string
          id: string
          plan_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          plan_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          plan_name?: string | null
        }
        Relationships: []
      }
      platform_changes: {
        Row: {
          affected_documents: string[] | null
          change_date: string
          change_description: string
          change_type: string
          changed_by: string
          created_at: string
          id: string
          platform_name: string
          updated_at: string
          version: string | null
        }
        Insert: {
          affected_documents?: string[] | null
          change_date?: string
          change_description: string
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          platform_name: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          affected_documents?: string[] | null
          change_date?: string
          change_description?: string
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          platform_name?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      platform_documents: {
        Row: {
          created_at: string
          document_category: string | null
          document_id: string
          id: string
          platform_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_category?: string | null
          document_id: string
          id?: string
          platform_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_category?: string | null
          document_id?: string
          id?: string
          platform_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_documents_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "company_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_projects: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          estimated_completion_date: string | null
          id: string
          name: string
          platform_technical_los: number | null
          status: string
          total_platform_investment: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          estimated_completion_date?: string | null
          id?: string
          name: string
          platform_technical_los?: number | null
          status?: string
          total_platform_investment?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_completion_date?: string | null
          id?: string
          name?: string
          platform_technical_los?: number | null
          status?: string
          total_platform_investment?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      pms_activity_templates: {
        Row: {
          activity_name: string
          activity_type: string
          checklist_items: Json | null
          company_id: string | null
          created_at: string | null
          days_before_report: number | null
          description: string | null
          device_class: string | null
          document_templates: Json | null
          frequency: string | null
          id: string
          is_mandatory: boolean | null
          is_system_template: boolean | null
          market_code: string
          regulatory_reference: string | null
          updated_at: string | null
        }
        Insert: {
          activity_name: string
          activity_type: string
          checklist_items?: Json | null
          company_id?: string | null
          created_at?: string | null
          days_before_report?: number | null
          description?: string | null
          device_class?: string | null
          document_templates?: Json | null
          frequency?: string | null
          id?: string
          is_mandatory?: boolean | null
          is_system_template?: boolean | null
          market_code: string
          regulatory_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_name?: string
          activity_type?: string
          checklist_items?: Json | null
          company_id?: string | null
          created_at?: string | null
          days_before_report?: number | null
          description?: string | null
          device_class?: string | null
          document_templates?: Json | null
          frequency?: string | null
          id?: string
          is_mandatory?: boolean | null
          is_system_template?: boolean | null
          market_code?: string
          regulatory_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_activity_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_activity_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      pms_activity_tracking: {
        Row: {
          activity_name: string
          activity_template_id: string | null
          company_id: string
          completed_by: string | null
          completion_date: string | null
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          market_code: string
          notes: string | null
          product_id: string
          regulatory_reference: string | null
          related_documents: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          activity_name: string
          activity_template_id?: string | null
          company_id: string
          completed_by?: string | null
          completion_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          market_code: string
          notes?: string | null
          product_id: string
          regulatory_reference?: string | null
          related_documents?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          activity_name?: string
          activity_template_id?: string | null
          company_id?: string
          completed_by?: string | null
          completion_date?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          market_code?: string
          notes?: string | null
          product_id?: string
          regulatory_reference?: string | null
          related_documents?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pms_activity_tracking_activity_template_id_fkey"
            columns: ["activity_template_id"]
            isOneToOne: false
            referencedRelation: "pms_activity_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_activity_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_activity_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pms_activity_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pms_activity_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_events: {
        Row: {
          authority_reference: string | null
          company_id: string
          corrective_actions: string | null
          created_at: string
          created_by: string | null
          description: string
          escalated_capa_id: string | null
          escalated_ccr_id: string | null
          event_date: string
          event_type: string
          id: string
          investigation_status: string
          is_reportable: boolean | null
          linked_hazard_ids: Json | null
          linked_requirement_ids: Json | null
          market_code: string | null
          preventive_actions: string | null
          product_id: string
          reported_to_authority: boolean | null
          reporter_contact: string | null
          reporter_name: string | null
          root_cause: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          authority_reference?: string | null
          company_id: string
          corrective_actions?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          escalated_capa_id?: string | null
          escalated_ccr_id?: string | null
          event_date: string
          event_type: string
          id?: string
          investigation_status?: string
          is_reportable?: boolean | null
          linked_hazard_ids?: Json | null
          linked_requirement_ids?: Json | null
          market_code?: string | null
          preventive_actions?: string | null
          product_id: string
          reported_to_authority?: boolean | null
          reporter_contact?: string | null
          reporter_name?: string | null
          root_cause?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          authority_reference?: string | null
          company_id?: string
          corrective_actions?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          escalated_capa_id?: string | null
          escalated_ccr_id?: string | null
          event_date?: string
          event_type?: string
          id?: string
          investigation_status?: string
          is_reportable?: boolean | null
          linked_hazard_ids?: Json | null
          linked_requirement_ids?: Json | null
          market_code?: string | null
          preventive_actions?: string | null
          product_id?: string
          reported_to_authority?: boolean | null
          reporter_contact?: string | null
          reporter_name?: string | null
          root_cause?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pms_events_escalated_capa_id_fkey"
            columns: ["escalated_capa_id"]
            isOneToOne: false
            referencedRelation: "capa_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_events_escalated_ccr_id_fkey"
            columns: ["escalated_ccr_id"]
            isOneToOne: false
            referencedRelation: "change_control_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pms_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_milestones: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_by: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_recurring: boolean | null
          milestone_type: string
          product_id: string
          recurrence_interval_months: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_recurring?: boolean | null
          milestone_type: string
          product_id: string
          recurrence_interval_months?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          milestone_type?: string
          product_id?: string
          recurrence_interval_months?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pms_milestones_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pms_milestones_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_reports: {
        Row: {
          approval_date: string | null
          attachments: Json | null
          checklist_completion_percentage: number | null
          company_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          market_code: string | null
          next_due_date: string | null
          notes: string | null
          preparation_start_date: string | null
          product_id: string
          regulatory_body: string | null
          report_type: string
          reporting_period_end: string | null
          reporting_period_start: string | null
          review_date: string | null
          submission_date: string
          submission_status: string
          updated_at: string
        }
        Insert: {
          approval_date?: string | null
          attachments?: Json | null
          checklist_completion_percentage?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          market_code?: string | null
          next_due_date?: string | null
          notes?: string | null
          preparation_start_date?: string | null
          product_id: string
          regulatory_body?: string | null
          report_type: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          review_date?: string | null
          submission_date: string
          submission_status?: string
          updated_at?: string
        }
        Update: {
          approval_date?: string | null
          attachments?: Json | null
          checklist_completion_percentage?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          market_code?: string | null
          next_due_date?: string | null
          notes?: string | null
          preparation_start_date?: string | null
          product_id?: string
          regulatory_body?: string | null
          report_type?: string
          reporting_period_end?: string | null
          reporting_period_start?: string | null
          review_date?: string | null
          submission_date?: string
          submission_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pms_reports_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_reports_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pms_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_effective: {
        Row: {
          company_id: string
          computed_at: string
          currency_code: string
          effective_price: number
          id: string
          inheritance_path: string[]
          market_code: string
          product_id: string
          source_rule_id: string | null
        }
        Insert: {
          company_id: string
          computed_at?: string
          currency_code: string
          effective_price: number
          id?: string
          inheritance_path?: string[]
          market_code: string
          product_id: string
          source_rule_id?: string | null
        }
        Update: {
          company_id?: string
          computed_at?: string
          currency_code?: string
          effective_price?: number
          id?: string
          inheritance_path?: string[]
          market_code?: string
          product_id?: string
          source_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_effective_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_effective_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pricing_effective_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pricing_effective_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_effective_source_rule_id_fkey"
            columns: ["source_rule_id"]
            isOneToOne: false
            referencedRelation: "pricing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          base_price: number | null
          company_id: string
          created_at: string
          currency_code: string
          id: string
          market_code: string
          model_name: string | null
          note: string | null
          product_id: string | null
          relative_type:
            | Database["public"]["Enums"]["price_modifier_type"]
            | null
          relative_value: number | null
          rule_type: Database["public"]["Enums"]["price_rule_type"]
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          company_id: string
          created_at?: string
          currency_code?: string
          id?: string
          market_code?: string
          model_name?: string | null
          note?: string | null
          product_id?: string | null
          relative_type?:
            | Database["public"]["Enums"]["price_modifier_type"]
            | null
          relative_value?: number | null
          rule_type: Database["public"]["Enums"]["price_rule_type"]
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          company_id?: string
          created_at?: string
          currency_code?: string
          id?: string
          market_code?: string
          model_name?: string | null
          note?: string | null
          product_id?: string | null
          relative_type?:
            | Database["public"]["Enums"]["price_modifier_type"]
            | null
          relative_value?: number | null
          rule_type?: Database["public"]["Enums"]["price_rule_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pricing_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pricing_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      process_validation_rationales: {
        Row: {
          activity_description: string
          approved_by: string | null
          company_id: string
          confidence_interval: string | null
          created_at: string | null
          created_by: string | null
          determination: string
          document_id: string
          hazard_identified: string
          id: string
          linked_hazard_id: string | null
          probability_of_occurrence: string
          process_type: string
          product_id: string | null
          qmsr_clause_reference: string | null
          rationale_text: string
          severity_of_harm: string
          status: string | null
          updated_at: string | null
          validation_rigor: string
        }
        Insert: {
          activity_description: string
          approved_by?: string | null
          company_id: string
          confidence_interval?: string | null
          created_at?: string | null
          created_by?: string | null
          determination: string
          document_id: string
          hazard_identified: string
          id?: string
          linked_hazard_id?: string | null
          probability_of_occurrence: string
          process_type: string
          product_id?: string | null
          qmsr_clause_reference?: string | null
          rationale_text: string
          severity_of_harm: string
          status?: string | null
          updated_at?: string | null
          validation_rigor: string
        }
        Update: {
          activity_description?: string
          approved_by?: string | null
          company_id?: string
          confidence_interval?: string | null
          created_at?: string | null
          created_by?: string | null
          determination?: string
          document_id?: string
          hazard_identified?: string
          id?: string
          linked_hazard_id?: string | null
          probability_of_occurrence?: string
          process_type?: string
          product_id?: string | null
          qmsr_clause_reference?: string | null
          rationale_text?: string
          severity_of_harm?: string
          status?: string | null
          updated_at?: string | null
          validation_rigor?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_validation_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_validation_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "process_validation_rationales_linked_hazard_id_fkey"
            columns: ["linked_hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_validation_rationales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "process_validation_rationales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_accessory_relationships: {
        Row: {
          accessory_product_id: string
          company_id: string
          created_at: string
          distribution_method: string | null
          has_variant_distribution: boolean
          id: string
          initial_multiplier: number | null
          is_required: boolean | null
          lifecycle_duration_months: number | null
          main_product_id: string
          metadata: Json | null
          recurring_multiplier: number | null
          recurring_period: string | null
          relationship_type: string
          revenue_attribution_percentage: number | null
          seasonality_factors: Json | null
          typical_quantity: number | null
          updated_at: string
        }
        Insert: {
          accessory_product_id: string
          company_id: string
          created_at?: string
          distribution_method?: string | null
          has_variant_distribution?: boolean
          id?: string
          initial_multiplier?: number | null
          is_required?: boolean | null
          lifecycle_duration_months?: number | null
          main_product_id: string
          metadata?: Json | null
          recurring_multiplier?: number | null
          recurring_period?: string | null
          relationship_type?: string
          revenue_attribution_percentage?: number | null
          seasonality_factors?: Json | null
          typical_quantity?: number | null
          updated_at?: string
        }
        Update: {
          accessory_product_id?: string
          company_id?: string
          created_at?: string
          distribution_method?: string | null
          has_variant_distribution?: boolean
          id?: string
          initial_multiplier?: number | null
          is_required?: boolean | null
          lifecycle_duration_months?: number | null
          main_product_id?: string
          metadata?: Json | null
          recurring_multiplier?: number | null
          recurring_period?: string | null
          relationship_type?: string
          revenue_attribution_percentage?: number | null
          seasonality_factors?: Json | null
          typical_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      product_architecture_layouts: {
        Row: {
          company_id: string
          created_at: string
          edges: Json
          id: string
          name: string
          nodes: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_architecture_layouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_architecture_layouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      product_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          company_id: string
          created_at: string | null
          description: string
          duration_seconds: number | null
          entity_name: string
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          product_id: string
          session_id: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json | null
          company_id: string
          created_at?: string | null
          description: string
          duration_seconds?: number | null
          entity_name: string
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          product_id: string
          session_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json | null
          company_id?: string
          created_at?: string | null
          description?: string
          duration_seconds?: number | null
          entity_name?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          product_id?: string
          session_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_audit_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_audit_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_audit_logs_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_audits: {
        Row: {
          actual_audit_duration: string | null
          admin_approved: boolean | null
          admin_approved_at: string | null
          admin_approved_by: string | null
          admin_comments: string | null
          audit_name: string
          audit_type: string
          close_out_actions_summary: string | null
          completion_date: string | null
          created_at: string
          deadline_date: string | null
          end_date: string | null
          executive_summary: string | null
          id: string
          lead_auditor_name: string | null
          lifecycle_phase: string | null
          milestone_due_date: string | null
          notes: string | null
          overall_assessment: string | null
          phase_id: string | null
          product_id: string
          responsible_person_id: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_audit_duration?: string | null
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          audit_name: string
          audit_type: string
          close_out_actions_summary?: string | null
          completion_date?: string | null
          created_at?: string
          deadline_date?: string | null
          end_date?: string | null
          executive_summary?: string | null
          id?: string
          lead_auditor_name?: string | null
          lifecycle_phase?: string | null
          milestone_due_date?: string | null
          notes?: string | null
          overall_assessment?: string | null
          phase_id?: string | null
          product_id: string
          responsible_person_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_audit_duration?: string | null
          admin_approved?: boolean | null
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_comments?: string | null
          audit_name?: string
          audit_type?: string
          close_out_actions_summary?: string | null
          completion_date?: string | null
          created_at?: string
          deadline_date?: string | null
          end_date?: string | null
          executive_summary?: string | null
          id?: string
          lead_auditor_name?: string | null
          lifecycle_phase?: string | null
          milestone_due_date?: string | null
          notes?: string | null
          overall_assessment?: string | null
          phase_id?: string | null
          product_id?: string
          responsible_person_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_audits_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_audits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_audits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_basic_udi_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          basic_udi_di_group_id: string
          id: string
          product_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          basic_udi_di_group_id: string
          id?: string
          product_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          basic_udi_di_group_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_basic_udi_assignments_basic_udi_di_group_id"
            columns: ["basic_udi_di_group_id"]
            isOneToOne: false
            referencedRelation: "basic_udi_di_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product_basic_udi_assignments_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_product_basic_udi_assignments_product_id"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_blueprint_comments: {
        Row: {
          activity_id: number
          company_id: string
          content: string
          created_at: string | null
          id: string
          product_id: string
          updated_at: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          activity_id: number
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          product_id: string
          updated_at?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          activity_id?: number
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          product_id?: string
          updated_at?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_blueprint_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_blueprint_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_blueprint_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_blueprint_comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundle_members: {
        Row: {
          attachment_rate: number | null
          bundle_id: string
          consumption_period: string | null
          consumption_rate: number | null
          created_at: string
          distribution_group_id: string | null
          id: string
          is_primary: boolean | null
          multiplier: number | null
          position: number | null
          product_id: string | null
          quantity: number | null
          relationship_type: string
          sibling_group_id: string | null
        }
        Insert: {
          attachment_rate?: number | null
          bundle_id: string
          consumption_period?: string | null
          consumption_rate?: number | null
          created_at?: string
          distribution_group_id?: string | null
          id?: string
          is_primary?: boolean | null
          multiplier?: number | null
          position?: number | null
          product_id?: string | null
          quantity?: number | null
          relationship_type: string
          sibling_group_id?: string | null
        }
        Update: {
          attachment_rate?: number | null
          bundle_id?: string
          consumption_period?: string | null
          consumption_rate?: number | null
          created_at?: string
          distribution_group_id?: string | null
          id?: string
          is_primary?: boolean | null
          multiplier?: number | null
          position?: number | null
          product_id?: string | null
          quantity?: number | null
          relationship_type?: string
          sibling_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_members_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_bundle_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_members_sibling_group_id_fkey"
            columns: ["sibling_group_id"]
            isOneToOne: false
            referencedRelation: "product_sibling_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          bundle_name: string
          company_id: string
          created_at: string
          created_by_product_id: string | null
          description: string | null
          id: string
          is_feasibility_study: boolean
          target_markets: Json | null
          updated_at: string
        }
        Insert: {
          bundle_name: string
          company_id: string
          created_at?: string
          created_by_product_id?: string | null
          description?: string | null
          id?: string
          is_feasibility_study?: boolean
          target_markets?: Json | null
          updated_at?: string
        }
        Update: {
          bundle_name?: string
          company_id?: string
          created_at?: string
          created_by_product_id?: string | null
          description?: string | null
          id?: string
          is_feasibility_study?: boolean
          target_markets?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_bundles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_bundles_created_by_product_id_fkey"
            columns: ["created_by_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_bundles_created_by_product_id_fkey"
            columns: ["created_by_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_clinical_evidence_plan: {
        Row: {
          company_id: string
          created_at: string
          id: string
          kol_strategy: string | null
          kols: Json | null
          no_literature_found: boolean | null
          payer_requirements: string | null
          physician_requirements: string | null
          pmcf_plan: string | null
          pmcf_required: boolean | null
          product_id: string
          regulator_requirements: string | null
          study_budget: number | null
          study_budget_currency: string | null
          study_design: Json | null
          study_end_date: string | null
          study_start_date: string | null
          supporting_literature: Json | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          kol_strategy?: string | null
          kols?: Json | null
          no_literature_found?: boolean | null
          payer_requirements?: string | null
          physician_requirements?: string | null
          pmcf_plan?: string | null
          pmcf_required?: boolean | null
          product_id: string
          regulator_requirements?: string | null
          study_budget?: number | null
          study_budget_currency?: string | null
          study_design?: Json | null
          study_end_date?: string | null
          study_start_date?: string | null
          supporting_literature?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          kol_strategy?: string | null
          kols?: Json | null
          no_literature_found?: boolean | null
          payer_requirements?: string | null
          physician_requirements?: string | null
          pmcf_plan?: string | null
          pmcf_required?: boolean | null
          product_id?: string
          regulator_requirements?: string | null
          study_budget?: number | null
          study_budget_currency?: string | null
          study_design?: Json | null
          study_end_date?: string | null
          study_start_date?: string | null
          supporting_literature?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_clinical_evidence_plan_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_clinical_evidence_plan_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_clinical_evidence_plan_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_clinical_evidence_plan_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_competitor_documents: {
        Row: {
          company_id: string
          created_at: string | null
          document_structure: Json | null
          error_message: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          processing_status: string
          product_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_structure?: Json | null
          error_message?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          processing_status?: string
          product_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_structure?: Json | null
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          processing_status?: string
          product_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_competitor_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_competitor_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_competitor_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_competitor_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_exit_strategy: {
        Row: {
          company_id: string
          comparable_transactions: Json | null
          created_at: string
          endgame_checklist: Json | null
          endgame_metrics_focus: string | null
          exit_timeline_years: number | null
          id: string
          ipo_readiness: Json | null
          licensing_terms: Json | null
          potential_acquirers: Json | null
          preferred_exit_type: string | null
          product_id: string
          selected_endgame: string | null
          strategic_rationale: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          comparable_transactions?: Json | null
          created_at?: string
          endgame_checklist?: Json | null
          endgame_metrics_focus?: string | null
          exit_timeline_years?: number | null
          id?: string
          ipo_readiness?: Json | null
          licensing_terms?: Json | null
          potential_acquirers?: Json | null
          preferred_exit_type?: string | null
          product_id: string
          selected_endgame?: string | null
          strategic_rationale?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          comparable_transactions?: Json | null
          created_at?: string
          endgame_checklist?: Json | null
          endgame_metrics_focus?: string | null
          exit_timeline_years?: number | null
          id?: string
          ipo_readiness?: Json | null
          licensing_terms?: Json | null
          potential_acquirers?: Json | null
          preferred_exit_type?: string | null
          product_id?: string
          selected_endgame?: string | null
          strategic_rationale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_exit_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_exit_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_exit_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_exit_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_field_suggestions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          current_value: string | null
          field_key: string
          field_label: string
          id: string
          product_id: string
          source: string
          status: string
          suggested_value: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          current_value?: string | null
          field_key: string
          field_label: string
          id?: string
          product_id: string
          source?: string
          status?: string
          suggested_value: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_value?: string | null
          field_key?: string
          field_label?: string
          id?: string
          product_id?: string
          source?: string
          status?: string
          suggested_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_field_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_field_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_field_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_field_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_gtm_strategy: {
        Row: {
          budget_cycle: string | null
          buyer_persona: string | null
          channels: Json | null
          company_id: string
          created_at: string
          customers_for_1m_arr: number | null
          customers_for_5m_arr: number | null
          id: string
          notes: string | null
          product_id: string
          sales_cycle_weeks: number | null
          territory_priority: Json | null
          updated_at: string
        }
        Insert: {
          budget_cycle?: string | null
          buyer_persona?: string | null
          channels?: Json | null
          company_id: string
          created_at?: string
          customers_for_1m_arr?: number | null
          customers_for_5m_arr?: number | null
          id?: string
          notes?: string | null
          product_id: string
          sales_cycle_weeks?: number | null
          territory_priority?: Json | null
          updated_at?: string
        }
        Update: {
          budget_cycle?: string | null
          buyer_persona?: string | null
          channels?: Json | null
          company_id?: string
          created_at?: string
          customers_for_1m_arr?: number | null
          customers_for_5m_arr?: number | null
          id?: string
          notes?: string | null
          product_id?: string
          sales_cycle_weeks?: number | null
          territory_priority?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_gtm_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_gtm_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_gtm_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_gtm_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_high_level_risks: {
        Row: {
          category: string
          company_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          impact: number
          is_custom: boolean
          likelihood: number
          mitigation: string | null
          order_index: number
          owner: string | null
          product_id: string
          risk_level: string | null
          risk_score: number | null
          risk_type: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          impact: number
          is_custom?: boolean
          likelihood: number
          mitigation?: string | null
          order_index?: number
          owner?: string | null
          product_id: string
          risk_level?: string | null
          risk_score?: number | null
          risk_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          impact?: number
          is_custom?: boolean
          likelihood?: number
          mitigation?: string | null
          order_index?: number
          owner?: string | null
          product_id?: string
          risk_level?: string | null
          risk_score?: number | null
          risk_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_high_level_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_high_level_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_high_level_risks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_high_level_risks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_key_risks: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
          risk_1_description: string | null
          risk_1_fallback: string | null
          risk_1_impact: string | null
          risk_1_likelihood: string | null
          risk_1_mitigation: string | null
          risk_2_description: string | null
          risk_2_fallback: string | null
          risk_2_impact: string | null
          risk_2_likelihood: string | null
          risk_2_mitigation: string | null
          risk_3_description: string | null
          risk_3_fallback: string | null
          risk_3_impact: string | null
          risk_3_likelihood: string | null
          risk_3_mitigation: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
          risk_1_description?: string | null
          risk_1_fallback?: string | null
          risk_1_impact?: string | null
          risk_1_likelihood?: string | null
          risk_1_mitigation?: string | null
          risk_2_description?: string | null
          risk_2_fallback?: string | null
          risk_2_impact?: string | null
          risk_2_likelihood?: string | null
          risk_2_mitigation?: string | null
          risk_3_description?: string | null
          risk_3_fallback?: string | null
          risk_3_impact?: string | null
          risk_3_likelihood?: string | null
          risk_3_mitigation?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
          risk_1_description?: string | null
          risk_1_fallback?: string | null
          risk_1_impact?: string | null
          risk_1_likelihood?: string | null
          risk_1_mitigation?: string | null
          risk_2_description?: string | null
          risk_2_fallback?: string | null
          risk_2_impact?: string | null
          risk_2_likelihood?: string | null
          risk_2_mitigation?: string | null
          risk_3_description?: string | null
          risk_3_fallback?: string | null
          risk_3_impact?: string | null
          risk_3_likelihood?: string | null
          risk_3_mitigation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_key_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_key_risks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_key_risks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_key_risks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_manual_competitors: {
        Row: {
          area_of_focus: string | null
          company_id: string
          competitor_company: string
          created_at: string | null
          created_by: string | null
          device_classification: string | null
          homepage_url: string | null
          id: string
          launch_date: string | null
          market: string | null
          market_share_estimate: string | null
          material: string | null
          metadata: Json | null
          notes: string | null
          phase: string | null
          product_id: string
          product_name: string | null
          regulatory_status: string | null
          source_section_id: string | null
          updated_at: string | null
        }
        Insert: {
          area_of_focus?: string | null
          company_id: string
          competitor_company: string
          created_at?: string | null
          created_by?: string | null
          device_classification?: string | null
          homepage_url?: string | null
          id?: string
          launch_date?: string | null
          market?: string | null
          market_share_estimate?: string | null
          material?: string | null
          metadata?: Json | null
          notes?: string | null
          phase?: string | null
          product_id: string
          product_name?: string | null
          regulatory_status?: string | null
          source_section_id?: string | null
          updated_at?: string | null
        }
        Update: {
          area_of_focus?: string | null
          company_id?: string
          competitor_company?: string
          created_at?: string | null
          created_by?: string | null
          device_classification?: string | null
          homepage_url?: string | null
          id?: string
          launch_date?: string | null
          market?: string | null
          market_share_estimate?: string | null
          material?: string | null
          metadata?: Json | null
          notes?: string | null
          phase?: string | null
          product_id?: string
          product_name?: string | null
          regulatory_status?: string | null
          source_section_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_manual_competitors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_manual_competitors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_manual_competitors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_manual_competitors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_manual_competitors_source_section_id_fkey"
            columns: ["source_section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      product_manufacturing: {
        Row: {
          cmo_partners: Json | null
          cogs_at_scale: number | null
          cogs_at_scale_currency: string | null
          commercial_location: string | null
          commercial_model: string | null
          company_id: string
          created_at: string
          current_stage: string | null
          id: string
          notes: string | null
          product_id: string
          single_source_components: Json | null
          supply_chain_risks: string | null
          updated_at: string
        }
        Insert: {
          cmo_partners?: Json | null
          cogs_at_scale?: number | null
          cogs_at_scale_currency?: string | null
          commercial_location?: string | null
          commercial_model?: string | null
          company_id: string
          created_at?: string
          current_stage?: string | null
          id?: string
          notes?: string | null
          product_id: string
          single_source_components?: Json | null
          supply_chain_risks?: string | null
          updated_at?: string
        }
        Update: {
          cmo_partners?: Json | null
          cogs_at_scale?: number | null
          cogs_at_scale_currency?: string | null
          commercial_location?: string | null
          commercial_model?: string | null
          company_id?: string
          created_at?: string
          current_stage?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          single_source_components?: Json | null
          supply_chain_risks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_manufacturing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_manufacturing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_manufacturing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_manufacturing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_market_approvals: {
        Row: {
          approval_date: string | null
          certificate_file_name: string | null
          certificate_file_path: string | null
          certificate_number: string | null
          company_id: string
          created_at: string | null
          id: string
          market_code: string
          notes: string | null
          product_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          certificate_file_name?: string | null
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          market_code: string
          notes?: string | null
          product_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          certificate_file_name?: string | null
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          market_code?: string
          notes?: string | null
          product_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_market_approvals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_market_approvals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_market_sizing: {
        Row: {
          average_selling_price: number | null
          clinical_impact_sources: string | null
          company_id: string
          cost_savings_per_procedure: number | null
          created_at: string
          id: string
          lives_impacted_annually: number | null
          procedures_enabled_annually: number | null
          product_id: string
          sam_methodology: string | null
          sam_patient_volume: number | null
          sam_sources: string | null
          sam_value: number | null
          som_methodology: string | null
          som_patient_volume: number | null
          som_timeline_years: number | null
          som_value: number | null
          tam_currency: string | null
          tam_methodology: string | null
          tam_patient_volume: number | null
          tam_sources: string | null
          tam_value: number | null
          updated_at: string
        }
        Insert: {
          average_selling_price?: number | null
          clinical_impact_sources?: string | null
          company_id: string
          cost_savings_per_procedure?: number | null
          created_at?: string
          id?: string
          lives_impacted_annually?: number | null
          procedures_enabled_annually?: number | null
          product_id: string
          sam_methodology?: string | null
          sam_patient_volume?: number | null
          sam_sources?: string | null
          sam_value?: number | null
          som_methodology?: string | null
          som_patient_volume?: number | null
          som_timeline_years?: number | null
          som_value?: number | null
          tam_currency?: string | null
          tam_methodology?: string | null
          tam_patient_volume?: number | null
          tam_sources?: string | null
          tam_value?: number | null
          updated_at?: string
        }
        Update: {
          average_selling_price?: number | null
          clinical_impact_sources?: string | null
          company_id?: string
          cost_savings_per_procedure?: number | null
          created_at?: string
          id?: string
          lives_impacted_annually?: number | null
          procedures_enabled_annually?: number | null
          product_id?: string
          sam_methodology?: string | null
          sam_patient_volume?: number | null
          sam_sources?: string | null
          sam_value?: number | null
          som_methodology?: string | null
          som_patient_volume?: number | null
          som_timeline_years?: number | null
          som_value?: number | null
          tam_currency?: string | null
          tam_methodology?: string | null
          tam_patient_volume?: number | null
          tam_sources?: string | null
          tam_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_market_sizing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_market_sizing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_market_sizing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_market_sizing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media_files: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_deleted: boolean | null
          media_type: string
          metadata: Json | null
          mime_type: string
          product_id: string
          public_url: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_deleted?: boolean | null
          media_type: string
          metadata?: Json | null
          mime_type: string
          product_id: string
          public_url: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_deleted?: boolean | null
          media_type?: string
          metadata?: Json | null
          mime_type?: string
          product_id?: string
          public_url?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_media_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_name_corrections: {
        Row: {
          company_id: string
          corrected_at: string | null
          corrected_by: string | null
          correction_reason: string | null
          id: string
          new_name: string
          old_name: string
          product_id: string
          udi_di: string | null
        }
        Insert: {
          company_id: string
          corrected_at?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          id?: string
          new_name: string
          old_name: string
          product_id: string
          udi_di?: string | null
        }
        Update: {
          company_id?: string
          corrected_at?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          id?: string
          new_name?: string
          old_name?: string
          product_id?: string
          udi_di?: string | null
        }
        Relationships: []
      }
      product_npv_analyses: {
        Row: {
          analysis_name: string
          analysis_status: string | null
          created_at: string
          id: string
          last_calculated_at: string | null
          market_calculations: Json | null
          market_input_data: Json | null
          product_id: string
          scenario_name: string | null
          selected_currency: string
          total_portfolio_npv: number | null
          updated_at: string
        }
        Insert: {
          analysis_name?: string
          analysis_status?: string | null
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          market_calculations?: Json | null
          market_input_data?: Json | null
          product_id: string
          scenario_name?: string | null
          selected_currency?: string
          total_portfolio_npv?: number | null
          updated_at?: string
        }
        Update: {
          analysis_name?: string
          analysis_status?: string | null
          created_at?: string
          id?: string
          last_calculated_at?: string | null
          market_calculations?: Json | null
          market_input_data?: Json | null
          product_id?: string
          scenario_name?: string | null
          selected_currency?: string
          total_portfolio_npv?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_npv_analyses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_npv_analyses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_phase_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          id: string
          lag_days: number
          product_id: string
          source_phase_id: string
          target_phase_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          id?: string
          lag_days?: number
          product_id: string
          source_phase_id: string
          target_phase_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          id?: string
          lag_days?: number
          product_id?: string
          source_phase_id?: string
          target_phase_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_readiness_gates: {
        Row: {
          company_id: string
          created_at: string
          current_gate_id: string | null
          decision_log: Json | null
          gates: Json | null
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_gate_id?: string | null
          decision_log?: Json | null
          gates?: Json | null
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_gate_id?: string | null
          decision_log?: Json | null
          gates?: Json | null
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_readiness_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_readiness_gates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_readiness_gates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_readiness_gates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_regulatory_timeline: {
        Row: {
          benchmark_notes: string | null
          company_id: string
          created_at: string
          dependencies: Json | null
          id: string
          market_timelines: Json | null
          milestones: Json | null
          product_id: string
          similar_device_timeline_months: number | null
          updated_at: string
        }
        Insert: {
          benchmark_notes?: string | null
          company_id: string
          created_at?: string
          dependencies?: Json | null
          id?: string
          market_timelines?: Json | null
          milestones?: Json | null
          product_id: string
          similar_device_timeline_months?: number | null
          updated_at?: string
        }
        Update: {
          benchmark_notes?: string | null
          company_id?: string
          created_at?: string
          dependencies?: Json | null
          id?: string
          market_timelines?: Json | null
          milestones?: Json | null
          product_id?: string
          similar_device_timeline_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_regulatory_timeline_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_regulatory_timeline_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_regulatory_timeline_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_regulatory_timeline_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reimbursement_codes: {
        Row: {
          application_date: string | null
          approval_date: string | null
          code_description: string | null
          code_type: string
          code_value: string
          company_id: string
          coverage_status: string
          created_at: string | null
          id: string
          market_code: string
          notes: string | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          application_date?: string | null
          approval_date?: string | null
          code_description?: string | null
          code_type: string
          code_value: string
          company_id: string
          coverage_status?: string
          created_at?: string | null
          id?: string
          market_code: string
          notes?: string | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          application_date?: string | null
          approval_date?: string | null
          code_description?: string | null
          code_type?: string
          code_value?: string
          company_id?: string
          coverage_status?: string
          created_at?: string | null
          id?: string
          market_code?: string
          notes?: string | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reimbursement_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reimbursement_codes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_reimbursement_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reimbursement_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reimbursement_strategy: {
        Row: {
          budget_impact_notes: string | null
          budget_impact_year1: number | null
          budget_impact_year2: number | null
          budget_impact_year3: number | null
          budget_type: string | null
          buyer_type: string | null
          coding_strategy: string | null
          company_id: string
          cost_per_procedure_current: number | null
          cost_per_procedure_new: number | null
          cost_savings_annual: number | null
          cost_savings_per_procedure: number | null
          coverage_notes: string | null
          coverage_status: string | null
          created_at: string
          device_capital_cost: number | null
          health_economics_evidence: string | null
          heor_assumptions: string | null
          heor_by_market: Json | null
          heor_completed: boolean | null
          heor_evidence_sources: Json | null
          heor_model_type: string | null
          icer_currency: string | null
          icer_value: number | null
          id: string
          key_milestones: Json | null
          mhlw_category: string | null
          payback_period_months: number | null
          payer_meetings: Json | null
          payer_mix: Json | null
          primary_launch_market: string | null
          primary_payer: string | null
          procedure_volume_annual: number | null
          procurement_path: string | null
          product_id: string
          prostheses_list_grouping: string | null
          prostheses_list_targeting: boolean | null
          qaly_gain_estimate: number | null
          reimbursement_timeline_months: number | null
          roi_percent: number | null
          target_codes: Json | null
          updated_at: string
          user_profile: Json | null
          value_dossier_by_market: Json | null
          value_dossier_status: string | null
          value_proposition: string | null
          vbp_status: string | null
          willingness_to_pay_threshold: number | null
        }
        Insert: {
          budget_impact_notes?: string | null
          budget_impact_year1?: number | null
          budget_impact_year2?: number | null
          budget_impact_year3?: number | null
          budget_type?: string | null
          buyer_type?: string | null
          coding_strategy?: string | null
          company_id: string
          cost_per_procedure_current?: number | null
          cost_per_procedure_new?: number | null
          cost_savings_annual?: number | null
          cost_savings_per_procedure?: number | null
          coverage_notes?: string | null
          coverage_status?: string | null
          created_at?: string
          device_capital_cost?: number | null
          health_economics_evidence?: string | null
          heor_assumptions?: string | null
          heor_by_market?: Json | null
          heor_completed?: boolean | null
          heor_evidence_sources?: Json | null
          heor_model_type?: string | null
          icer_currency?: string | null
          icer_value?: number | null
          id?: string
          key_milestones?: Json | null
          mhlw_category?: string | null
          payback_period_months?: number | null
          payer_meetings?: Json | null
          payer_mix?: Json | null
          primary_launch_market?: string | null
          primary_payer?: string | null
          procedure_volume_annual?: number | null
          procurement_path?: string | null
          product_id: string
          prostheses_list_grouping?: string | null
          prostheses_list_targeting?: boolean | null
          qaly_gain_estimate?: number | null
          reimbursement_timeline_months?: number | null
          roi_percent?: number | null
          target_codes?: Json | null
          updated_at?: string
          user_profile?: Json | null
          value_dossier_by_market?: Json | null
          value_dossier_status?: string | null
          value_proposition?: string | null
          vbp_status?: string | null
          willingness_to_pay_threshold?: number | null
        }
        Update: {
          budget_impact_notes?: string | null
          budget_impact_year1?: number | null
          budget_impact_year2?: number | null
          budget_impact_year3?: number | null
          budget_type?: string | null
          buyer_type?: string | null
          coding_strategy?: string | null
          company_id?: string
          cost_per_procedure_current?: number | null
          cost_per_procedure_new?: number | null
          cost_savings_annual?: number | null
          cost_savings_per_procedure?: number | null
          coverage_notes?: string | null
          coverage_status?: string | null
          created_at?: string
          device_capital_cost?: number | null
          health_economics_evidence?: string | null
          heor_assumptions?: string | null
          heor_by_market?: Json | null
          heor_completed?: boolean | null
          heor_evidence_sources?: Json | null
          heor_model_type?: string | null
          icer_currency?: string | null
          icer_value?: number | null
          id?: string
          key_milestones?: Json | null
          mhlw_category?: string | null
          payback_period_months?: number | null
          payer_meetings?: Json | null
          payer_mix?: Json | null
          primary_launch_market?: string | null
          primary_payer?: string | null
          procedure_volume_annual?: number | null
          procurement_path?: string | null
          product_id?: string
          prostheses_list_grouping?: string | null
          prostheses_list_targeting?: boolean | null
          qaly_gain_estimate?: number | null
          reimbursement_timeline_months?: number | null
          roi_percent?: number | null
          target_codes?: Json | null
          updated_at?: string
          user_profile?: Json | null
          value_dossier_by_market?: Json | null
          value_dossier_status?: string | null
          value_proposition?: string | null
          vbp_status?: string | null
          willingness_to_pay_threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reimbursement_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reimbursement_strategy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_reimbursement_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reimbursement_strategy_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_revenues: {
        Row: {
          cogs_amount: number | null
          created_at: string
          created_by: string | null
          currency_code: string
          id: string
          market_code: string
          market_penetration_percentage: number | null
          period_end: string
          period_start: string
          product_id: string
          profit_margin_percentage: number | null
          revenue_amount: number
          units_forecast: number | null
          units_sold: number | null
          updated_at: string
          variant_id: string | null
          volume_seasonality_factor: number | null
        }
        Insert: {
          cogs_amount?: number | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          id?: string
          market_code: string
          market_penetration_percentage?: number | null
          period_end: string
          period_start: string
          product_id: string
          profit_margin_percentage?: number | null
          revenue_amount?: number
          units_forecast?: number | null
          units_sold?: number | null
          updated_at?: string
          variant_id?: string | null
          volume_seasonality_factor?: number | null
        }
        Update: {
          cogs_amount?: number | null
          created_at?: string
          created_by?: string | null
          currency_code?: string
          id?: string
          market_code?: string
          market_penetration_percentage?: number | null
          period_end?: string
          period_start?: string
          product_id?: string
          profit_margin_percentage?: number | null
          revenue_amount?: number
          units_forecast?: number | null
          units_sold?: number | null
          updated_at?: string
          variant_id?: string | null
          volume_seasonality_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_revenues_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_revenues_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_revenues_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rnpv_inputs: {
        Row: {
          affected_products: Json
          analysis_name: string
          annual_cost_change: number
          annual_price_change: number
          annual_volume_growth: number
          average_selling_price: number
          cannibalization_enabled: boolean
          company_id: string
          competitive_risk: number
          created_at: string
          created_by: string
          description: string | null
          discount_rate: number
          expected_market_share: number
          fixed_costs: number
          id: string
          is_archived: boolean
          launch_year: number
          market_risk: number
          portfolio_synergies: number
          product_id: string
          product_lifespan: number
          regulatory_risk: number
          target_markets: Json
          tax_rate: number
          technical_risk: number
          total_addressable_market: number
          total_development_costs: number | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          affected_products?: Json
          analysis_name?: string
          annual_cost_change?: number
          annual_price_change?: number
          annual_volume_growth?: number
          average_selling_price?: number
          cannibalization_enabled?: boolean
          company_id: string
          competitive_risk?: number
          created_at?: string
          created_by: string
          description?: string | null
          discount_rate?: number
          expected_market_share?: number
          fixed_costs?: number
          id?: string
          is_archived?: boolean
          launch_year?: number
          market_risk?: number
          portfolio_synergies?: number
          product_id: string
          product_lifespan?: number
          regulatory_risk?: number
          target_markets?: Json
          tax_rate?: number
          technical_risk?: number
          total_addressable_market?: number
          total_development_costs?: number | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          affected_products?: Json
          analysis_name?: string
          annual_cost_change?: number
          annual_price_change?: number
          annual_volume_growth?: number
          average_selling_price?: number
          cannibalization_enabled?: boolean
          company_id?: string
          competitive_risk?: number
          created_at?: string
          created_by?: string
          description?: string | null
          discount_rate?: number
          expected_market_share?: number
          fixed_costs?: number
          id?: string
          is_archived?: boolean
          launch_year?: number
          market_risk?: number
          portfolio_synergies?: number
          product_id?: string
          product_lifespan?: number
          regulatory_risk?: number
          target_markets?: Json
          tax_rate?: number
          technical_risk?: number
          total_addressable_market?: number
          total_development_costs?: number | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_sibling_assignments: {
        Row: {
          created_at: string
          id: string
          percentage: number
          position: number
          product_id: string
          sibling_group_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          percentage?: number
          position?: number
          product_id: string
          sibling_group_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          percentage?: number
          position?: number
          product_id?: string
          sibling_group_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sibling_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_sibling_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sibling_assignments_sibling_group_id_fkey"
            columns: ["sibling_group_id"]
            isOneToOne: false
            referencedRelation: "product_sibling_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sibling_group_relationships: {
        Row: {
          accessory_sibling_group_id: string
          company_id: string
          created_at: string
          id: string
          initial_multiplier: number | null
          is_required: boolean | null
          lifecycle_duration_months: number | null
          main_product_id: string
          recurring_multiplier: number | null
          recurring_period: string | null
          relationship_type: string
          revenue_attribution_percentage: number | null
          seasonality_factors: Json | null
          typical_quantity: number | null
          updated_at: string
        }
        Insert: {
          accessory_sibling_group_id: string
          company_id: string
          created_at?: string
          id?: string
          initial_multiplier?: number | null
          is_required?: boolean | null
          lifecycle_duration_months?: number | null
          main_product_id: string
          recurring_multiplier?: number | null
          recurring_period?: string | null
          relationship_type?: string
          revenue_attribution_percentage?: number | null
          seasonality_factors?: Json | null
          typical_quantity?: number | null
          updated_at?: string
        }
        Update: {
          accessory_sibling_group_id?: string
          company_id?: string
          created_at?: string
          id?: string
          initial_multiplier?: number | null
          is_required?: boolean | null
          lifecycle_duration_months?: number | null
          main_product_id?: string
          recurring_multiplier?: number | null
          recurring_period?: string | null
          relationship_type?: string
          revenue_attribution_percentage?: number | null
          seasonality_factors?: Json | null
          typical_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sibling_group_relations_accessory_sibling_group_id_fkey"
            columns: ["accessory_sibling_group_id"]
            isOneToOne: false
            referencedRelation: "product_sibling_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sibling_group_relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sibling_group_relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_sibling_group_relationships_main_product_id_fkey"
            columns: ["main_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_sibling_group_relationships_main_product_id_fkey"
            columns: ["main_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sibling_groups: {
        Row: {
          basic_udi_di: string
          company_id: string
          created_at: string | null
          description: string | null
          distribution_pattern: string | null
          id: string
          name: string
          position: number | null
          total_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          basic_udi_di: string
          company_id: string
          created_at?: string | null
          description?: string | null
          distribution_pattern?: string | null
          id?: string
          name: string
          position?: number | null
          total_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          basic_udi_di?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          distribution_pattern?: string | null
          id?: string
          name?: string
          position?: number | null
          total_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sibling_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sibling_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      product_suppliers: {
        Row: {
          component_name: string
          created_at: string | null
          id: string
          inspection_requirements: string | null
          product_id: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          component_name: string
          created_at?: string | null
          id?: string
          inspection_requirements?: string | null
          product_id: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          created_at?: string | null
          id?: string
          inspection_requirements?: string | null
          product_id?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string
          id: string
          product_id: string
          source_phase_time_index: string | null
          source_task_id: string
          source_task_type: string
          target_phase_time_index: string | null
          target_task_id: string
          target_task_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dependency_type: string
          id?: string
          product_id: string
          source_phase_time_index?: string | null
          source_task_id: string
          source_task_type: string
          target_phase_time_index?: string | null
          target_task_id: string
          target_task_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dependency_type?: string
          id?: string
          product_id?: string
          source_phase_time_index?: string | null
          source_task_id?: string
          source_task_type?: string
          target_phase_time_index?: string | null
          target_task_id?: string
          target_task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_task_dependencies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_task_dependencies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_team_gaps: {
        Row: {
          advisors: Json | null
          company_id: string
          competencies: Json | null
          created_at: string
          critical_gaps: Json | null
          founder_allocation: Json | null
          hiring_roadmap: Json | null
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          advisors?: Json | null
          company_id: string
          competencies?: Json | null
          created_at?: string
          critical_gaps?: Json | null
          founder_allocation?: Json | null
          hiring_roadmap?: Json | null
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          advisors?: Json | null
          company_id?: string
          competencies?: Json | null
          created_at?: string
          critical_gaps?: Json | null
          founder_allocation?: Json | null
          hiring_roadmap?: Json | null
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_team_gaps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_team_gaps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_team_gaps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_team_gaps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_udi_di_variants: {
        Row: {
          basic_udi_di_group_id: string
          created_at: string
          generated_udi_di: string
          id: string
          item_reference: string
          package_level_indicator: number
          packaging_level: string
          product_id: string
          updated_at: string
        }
        Insert: {
          basic_udi_di_group_id: string
          created_at?: string
          generated_udi_di: string
          id?: string
          item_reference: string
          package_level_indicator?: number
          packaging_level: string
          product_id: string
          updated_at?: string
        }
        Update: {
          basic_udi_di_group_id?: string
          created_at?: string
          generated_udi_di?: string
          id?: string
          item_reference?: string
          package_level_indicator?: number
          packaging_level?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_udi_di_variants_basic_udi_di_group_id_fkey"
            columns: ["basic_udi_di_group_id"]
            isOneToOne: false
            referencedRelation: "basic_udi_di_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_udi_di_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_udi_di_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_unit_economics: {
        Row: {
          cac_currency: string | null
          cogs_currency: string | null
          cogs_per_unit: number | null
          company_id: string
          created_at: string
          customer_acquisition_cost: number | null
          gross_margin_percent: number | null
          id: string
          notes: string | null
          payback_period_months: number | null
          product_id: string
          updated_at: string
        }
        Insert: {
          cac_currency?: string | null
          cogs_currency?: string | null
          cogs_per_unit?: number | null
          company_id: string
          created_at?: string
          customer_acquisition_cost?: number | null
          gross_margin_percent?: number | null
          id?: string
          notes?: string | null
          payback_period_months?: number | null
          product_id: string
          updated_at?: string
        }
        Update: {
          cac_currency?: string | null
          cogs_currency?: string | null
          cogs_per_unit?: number | null
          company_id?: string
          created_at?: string
          customer_acquisition_cost?: number | null
          gross_margin_percent?: number | null
          id?: string
          notes?: string | null
          payback_period_months?: number | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_unit_economics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_unit_economics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_unit_economics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_unit_economics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_use_of_proceeds: {
        Row: {
          commercial_activities: string | null
          commercial_percent: number | null
          company_id: string
          created_at: string
          id: string
          operations_activities: string | null
          operations_percent: number | null
          product_id: string
          raise_currency: string | null
          rd_activities: string | null
          rd_percent: number | null
          regulatory_activities: string | null
          regulatory_percent: number | null
          team_activities: string | null
          team_percent: number | null
          total_raise_amount: number | null
          updated_at: string
        }
        Insert: {
          commercial_activities?: string | null
          commercial_percent?: number | null
          company_id: string
          created_at?: string
          id?: string
          operations_activities?: string | null
          operations_percent?: number | null
          product_id: string
          raise_currency?: string | null
          rd_activities?: string | null
          rd_percent?: number | null
          regulatory_activities?: string | null
          regulatory_percent?: number | null
          team_activities?: string | null
          team_percent?: number | null
          total_raise_amount?: number | null
          updated_at?: string
        }
        Update: {
          commercial_activities?: string | null
          commercial_percent?: number | null
          company_id?: string
          created_at?: string
          id?: string
          operations_activities?: string | null
          operations_percent?: number | null
          product_id?: string
          raise_currency?: string | null
          rd_activities?: string | null
          rd_percent?: number | null
          regulatory_activities?: string | null
          regulatory_percent?: number | null
          team_activities?: string | null
          team_percent?: number | null
          total_raise_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_use_of_proceeds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_use_of_proceeds_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_use_of_proceeds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_use_of_proceeds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_user_access: {
        Row: {
          access_level: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          last_accessed_at: string | null
          notes: string | null
          permissions: Json | null
          product_id: string
          role_id: string | null
          role_name: string | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_accessed_at?: string | null
          notes?: string | null
          permissions?: Json | null
          product_id: string
          role_id?: string | null
          role_name?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_accessed_at?: string | null
          notes?: string | null
          permissions?: Json | null
          product_id?: string
          role_id?: string | null
          role_name?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_user_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_user_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_user_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_user_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_distribution_settings: {
        Row: {
          company_id: string
          created_at: string
          distribution_percentage: number
          group_id: string | null
          group_position: number | null
          id: string
          notes: string | null
          product_id: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          distribution_percentage: number
          group_id?: string | null
          group_position?: number | null
          id?: string
          notes?: string | null
          product_id: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          distribution_percentage?: number
          group_id?: string | null
          group_position?: number | null
          id?: string
          notes?: string | null
          product_id?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_distribution_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_distribution_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_variant_distribution_settings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_variant_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_distribution_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_distribution_settings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_distribution_settings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_distributions: {
        Row: {
          conditional_rules: Json | null
          created_at: string
          distribution_method: string
          distribution_percentage: number
          id: string
          relationship_id: string
          source_variant_id: string | null
          target_variant_id: string
          updated_at: string
        }
        Insert: {
          conditional_rules?: Json | null
          created_at?: string
          distribution_method?: string
          distribution_percentage?: number
          id?: string
          relationship_id: string
          source_variant_id?: string | null
          target_variant_id: string
          updated_at?: string
        }
        Update: {
          conditional_rules?: Json | null
          created_at?: string
          distribution_method?: string
          distribution_percentage?: number
          id?: string
          relationship_id?: string
          source_variant_id?: string | null
          target_variant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pvd_relationship"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "product_accessory_relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pvd_source_variant"
            columns: ["source_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pvd_target_variant"
            columns: ["target_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_groups: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          distribution_pattern: string
          id: string
          name: string
          position: number
          product_id: string
          total_percentage: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          distribution_pattern?: string
          id?: string
          name: string
          position?: number
          product_id: string
          total_percentage?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          distribution_pattern?: string
          id?: string
          name?: string
          position?: number
          product_id?: string
          total_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_variant_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_values: {
        Row: {
          created_at: string | null
          dimension_id: string
          id: string
          markets: Json | null
          option_id: string | null
          product_variant_id: string
          updated_at: string | null
          value_text: string | null
        }
        Insert: {
          created_at?: string | null
          dimension_id: string
          id?: string
          markets?: Json | null
          option_id?: string | null
          product_variant_id: string
          updated_at?: string | null
          value_text?: string | null
        }
        Update: {
          created_at?: string | null
          dimension_id?: string
          id?: string
          markets?: Json | null
          option_id?: string | null
          product_variant_id?: string
          updated_at?: string | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_values_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "product_variation_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_variation_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_values_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          markets: Json | null
          name: string | null
          product_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          markets?: Json | null
          name?: string | null
          product_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          markets?: Json | null
          name?: string | null
          product_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variation_dimensions: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          position: number
          product_id: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          position?: number
          product_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          product_id?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variation_dimensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variation_dimensions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_variation_dimensions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variation_dimensions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variation_options: {
        Row: {
          company_id: string
          created_at: string | null
          dimension_id: string
          id: string
          is_active: boolean
          name: string
          position: number
          updated_at: string | null
          value_key: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          dimension_id: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          updated_at?: string | null
          value_key?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          dimension_id?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          updated_at?: string | null
          value_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variation_options_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variation_options_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_variation_options_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "product_variation_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_venture_blueprints: {
        Row: {
          activity_files: Json | null
          activity_notes: Json | null
          company_id: string
          completed_activities: number[] | null
          created_at: string | null
          id: string
          last_updated: string | null
          product_id: string
        }
        Insert: {
          activity_files?: Json | null
          activity_notes?: Json | null
          company_id: string
          completed_activities?: number[] | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          product_id: string
        }
        Update: {
          activity_files?: Json | null
          activity_notes?: Json | null
          company_id?: string
          completed_activities?: number[] | null
          created_at?: string | null
          id?: string
          last_updated?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_venture_blueprints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_venture_blueprints_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_venture_blueprints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_venture_blueprints_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_version_history: {
        Row: {
          change_description: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          parent_product_id: string | null
          product_id: string
          version: string
          version_type: string | null
        }
        Insert: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          parent_product_id?: string | null
          product_id: string
          version: string
          version_type?: string | null
        }
        Update: {
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          parent_product_id?: string | null
          product_id?: string
          version?: string
          version_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_version_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_version_history_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_version_history_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_version_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_version_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_viability_scorecards: {
        Row: {
          clinical_score: number
          clinical_strategy: string[] | null
          company_id: string
          created_at: string | null
          device_class: string
          has_predicate: string | null
          id: string
          patient_count: number | null
          product_id: string
          regulatory_framework: string
          regulatory_score: number
          reimbursement_code: string | null
          reimbursement_score: number
          technical_score: number
          technology_type: string | null
          total_score: number
          updated_at: string | null
        }
        Insert: {
          clinical_score: number
          clinical_strategy?: string[] | null
          company_id: string
          created_at?: string | null
          device_class: string
          has_predicate?: string | null
          id?: string
          patient_count?: number | null
          product_id: string
          regulatory_framework: string
          regulatory_score: number
          reimbursement_code?: string | null
          reimbursement_score: number
          technical_score: number
          technology_type?: string | null
          total_score: number
          updated_at?: string | null
        }
        Update: {
          clinical_score?: number
          clinical_strategy?: string[] | null
          company_id?: string
          created_at?: string | null
          device_class?: string
          has_predicate?: string | null
          id?: string
          patient_count?: number | null
          product_id?: string
          regulatory_framework?: string
          regulatory_score?: number
          reimbursement_code?: string | null
          reimbursement_score?: number
          technical_score?: number
          technology_type?: string | null
          total_score?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_viability_scorecards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_viability_scorecards_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "product_viability_scorecards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_viability_scorecards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_checkpoints: {
        Row: {
          checkpoint_name: string
          created_at: string
          description: string | null
          equipment_used: string | null
          id: string
          inspected_at: string | null
          inspector_id: string | null
          measured_value: string | null
          notes: string | null
          order_id: string
          result: Database["public"]["Enums"]["checkpoint_result"]
          sort_order: number | null
          specification: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          checkpoint_name: string
          created_at?: string
          description?: string | null
          equipment_used?: string | null
          id?: string
          inspected_at?: string | null
          inspector_id?: string | null
          measured_value?: string | null
          notes?: string | null
          order_id: string
          result?: Database["public"]["Enums"]["checkpoint_result"]
          sort_order?: number | null
          specification?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          checkpoint_name?: string
          created_at?: string
          description?: string | null
          equipment_used?: string | null
          id?: string
          inspected_at?: string | null
          inspector_id?: string | null
          measured_value?: string | null
          notes?: string | null
          order_id?: string
          result?: Database["public"]["Enums"]["checkpoint_result"]
          sort_order?: number | null
          specification?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_checkpoints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_evidence: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          file_name: string
          id: string
          order_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_name: string
          id?: string
          order_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_name?: string
          id?: string
          order_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_evidence_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_transitions: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          order_id: string
          to_status: string
          transition_reason: string | null
          transitioned_by: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          order_id: string
          to_status: string
          transition_reason?: string | null
          transitioned_by: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          order_id?: string
          to_status?: string
          transition_reason?: string | null
          transitioned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_transitions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          batch_number: string | null
          bom_revision_id: string | null
          company_id: string
          component_lot_numbers: Json | null
          created_at: string
          created_by: string
          dhr_generated: boolean | null
          dhr_generated_at: string | null
          dhr_generated_by: string | null
          disposition: Database["public"]["Enums"]["batch_disposition"]
          disposition_by: string | null
          disposition_date: string | null
          disposition_notes: string | null
          equipment_ids: Json | null
          id: string
          linked_nc_id: string | null
          lot_number: string | null
          notes: string | null
          operator_ids: Json | null
          order_id: string
          planned_end_date: string | null
          planned_start_date: string | null
          product_id: string | null
          quantity_accepted: number | null
          quantity_planned: number | null
          quantity_produced: number | null
          quantity_rejected: number | null
          serial_number_range: string | null
          status: Database["public"]["Enums"]["production_order_status"]
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          batch_number?: string | null
          bom_revision_id?: string | null
          company_id: string
          component_lot_numbers?: Json | null
          created_at?: string
          created_by: string
          dhr_generated?: boolean | null
          dhr_generated_at?: string | null
          dhr_generated_by?: string | null
          disposition?: Database["public"]["Enums"]["batch_disposition"]
          disposition_by?: string | null
          disposition_date?: string | null
          disposition_notes?: string | null
          equipment_ids?: Json | null
          id?: string
          linked_nc_id?: string | null
          lot_number?: string | null
          notes?: string | null
          operator_ids?: Json | null
          order_id?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          product_id?: string | null
          quantity_accepted?: number | null
          quantity_planned?: number | null
          quantity_produced?: number | null
          quantity_rejected?: number | null
          serial_number_range?: string | null
          status?: Database["public"]["Enums"]["production_order_status"]
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          batch_number?: string | null
          bom_revision_id?: string | null
          company_id?: string
          component_lot_numbers?: Json | null
          created_at?: string
          created_by?: string
          dhr_generated?: boolean | null
          dhr_generated_at?: string | null
          dhr_generated_by?: string | null
          disposition?: Database["public"]["Enums"]["batch_disposition"]
          disposition_by?: string | null
          disposition_date?: string | null
          disposition_notes?: string | null
          equipment_ids?: Json | null
          id?: string
          linked_nc_id?: string | null
          lot_number?: string | null
          notes?: string | null
          operator_ids?: Json | null
          order_id?: string
          planned_end_date?: string | null
          planned_start_date?: string | null
          product_id?: string | null
          quantity_accepted?: number | null
          quantity_planned?: number | null
          quantity_produced?: number | null
          quantity_rejected?: number | null
          serial_number_range?: string | null
          status?: Database["public"]["Enums"]["production_order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_bom_revision_id_fkey"
            columns: ["bom_revision_id"]
            isOneToOne: false
            referencedRelation: "bom_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "production_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          actual_launch_date: string | null
          archived_at: string | null
          archived_by: string | null
          article_number: string | null
          basic_udi_di: string | null
          ce_mark_status: string | null
          change_description: string | null
          class: string | null
          clinical_benefits: Json | null
          clinical_eval_status: string | null
          commercial_factors_enabled: boolean | null
          commercial_launch_date: string | null
          company_id: string | null
          conformity_assessment_route: string | null
          conformity_route: string | null
          contraindications: string[] | null
          current_lifecycle_phase: string | null
          definition_override_reason: string | null
          description: string | null
          design_freeze_date: string | null
          device_category: string | null
          device_compliance: Json | null
          device_components: Json | null
          device_summary: string | null
          device_type: string | null
          display_as_variant_group: boolean | null
          ec_certificate: string | null
          emdn_category_id: string | null
          emdn_code: string | null
          emdn_description: string | null
          eu_representative: string | null
          eudamed_active: boolean | null
          eudamed_address: string | null
          eudamed_administering_medicine: boolean | null
          eudamed_applicable_legislation: string | null
          eudamed_basic_udi_di_code: string | null
          eudamed_ca_address: string | null
          eudamed_ca_country: string | null
          eudamed_ca_email: string | null
          eudamed_ca_name: string | null
          eudamed_ca_phone: string | null
          eudamed_ca_postcode: string | null
          eudamed_contain_latex: boolean | null
          eudamed_country: string | null
          eudamed_device_model: string | null
          eudamed_device_name: string | null
          eudamed_direct_marking: boolean | null
          eudamed_email: string | null
          eudamed_id_srn: string | null
          eudamed_implantable: boolean | null
          eudamed_issuing_agency: string | null
          eudamed_market_distribution: string | null
          eudamed_max_reuses: number | null
          eudamed_measuring: boolean | null
          eudamed_nomenclature_codes: Json | null
          eudamed_organization: string | null
          eudamed_organization_status: string | null
          eudamed_phone: string | null
          eudamed_placed_on_the_market: string | null
          eudamed_postcode: string | null
          eudamed_prrc_address: string | null
          eudamed_prrc_country: string | null
          eudamed_prrc_email: string | null
          eudamed_prrc_first_name: string | null
          eudamed_prrc_last_name: string | null
          eudamed_prrc_phone: string | null
          eudamed_prrc_postcode: string | null
          eudamed_prrc_responsible_for: string | null
          eudamed_quantity_of_device: string | null
          eudamed_reference_number: string | null
          eudamed_registration_number: string | null
          eudamed_reprocessed: boolean | null
          eudamed_reusable: boolean | null
          eudamed_risk_class: string | null
          eudamed_single_use: boolean | null
          eudamed_status: string | null
          eudamed_sterile: boolean | null
          eudamed_sterilization_need: boolean | null
          eudamed_trade_names: string | null
          eudamed_website: string | null
          facility_locations: string | null
          fda_product_code: string | null
          fda_product_codes: Json | null
          feasibility_portfolio_id: string | null
          field_overrides: Json | null
          field_scope_overrides: Json | null
          fto_analysis_date: string | null
          fto_certainty: string | null
          fto_mitigation_strategy: string | null
          fto_notes: string | null
          fto_risk_level: string | null
          fto_status: string | null
          gtin: string | null
          has_classification_override: boolean | null
          has_clinical_benefits_override: boolean | null
          has_contraindications_override: boolean | null
          has_definition_override: boolean | null
          has_device_components_override: boolean | null
          has_duration_of_use_override: boolean | null
          has_environment_of_use_override: boolean | null
          has_intended_use_override: boolean | null
          has_intended_users_override: boolean | null
          has_no_accessories: boolean | null
          has_shelf_life_override: boolean | null
          has_storage_sterility_override: boolean | null
          has_technical_specs_override: boolean | null
          has_warnings_override: boolean | null
          id: string
          image: string | null
          images: Json | null
          inherit_pricing_from_model: boolean | null
          inserted_at: string
          intended_purpose_data: Json | null
          intended_use: string | null
          intended_users: Json | null
          ip_ownership_notes: string | null
          ip_ownership_status: string | null
          ip_protection_types: string[] | null
          ip_strategy_completed: boolean | null
          ip_strategy_summary: string | null
          is_archived: boolean
          is_line_extension: boolean
          is_master_device: boolean
          is_master_product: boolean | null
          is_platform_core: boolean | null
          is_software_project: boolean | null
          is_variant: boolean | null
          isActiveDevice: boolean | null
          iso_certifications: Json | null
          key_features: Json | null
          key_technology_characteristics: Json | null
          launch_status: Database["public"]["Enums"]["launch_status"] | null
          manufacturer: string | null
          market_authorization_holder: string | null
          market_extension_id: string | null
          market_launch_dates: Json | null
          markets: Json | null
          master_product_id: string | null
          model_id: string | null
          model_reference: string | null
          model_version: string | null
          models_3d: Json | null
          name: string
          no_ip_applicable: boolean | null
          notified_body: string | null
          parent_product_id: string | null
          parent_relationship_type:
            | Database["public"]["Enums"]["parent_relationship_type"]
            | null
          platform_project_id: string | null
          pms_plan_status: string | null
          post_market_surveillance_date: string | null
          primary_regulatory_type: string | null
          product_family_placeholder: string | null
          product_platform: string | null
          progress: number | null
          project_start_date: string | null
          project_types: Json
          projected_launch_date: string | null
          psur_status: string | null
          registration_date: string | null
          registration_status: string | null
          regulatory_override_at: string | null
          regulatory_override_by: string | null
          regulatory_override_reason: string | null
          regulatory_status: string | null
          risk_management_status: string | null
          samd_gpl_code_present: boolean | null
          samd_license_audit_completed: boolean | null
          samd_license_notes: string | null
          sibling_group_id: string | null
          status: string | null
          storage_sterility_handling: Json | null
          strategic_partners: Json | null
          technical_doc_status: string | null
          timeline_confirmed: boolean | null
          trade_name: string | null
          trl_level: number | null
          trl_notes: string | null
          udi_di: string | null
          udi_pi: string | null
          udi_pi_config: Json | null
          updated_at: string
          user_instructions: Json | null
          variant_display_name: string | null
          variant_group_summary: Json | null
          variant_sequence: number | null
          variant_tags: Json | null
          version: string | null
          videos: string | null
          videos_array: Json | null
          vigilance_status: string | null
        }
        Insert: {
          actual_launch_date?: string | null
          archived_at?: string | null
          archived_by?: string | null
          article_number?: string | null
          basic_udi_di?: string | null
          ce_mark_status?: string | null
          change_description?: string | null
          class?: string | null
          clinical_benefits?: Json | null
          clinical_eval_status?: string | null
          commercial_factors_enabled?: boolean | null
          commercial_launch_date?: string | null
          company_id?: string | null
          conformity_assessment_route?: string | null
          conformity_route?: string | null
          contraindications?: string[] | null
          current_lifecycle_phase?: string | null
          definition_override_reason?: string | null
          description?: string | null
          design_freeze_date?: string | null
          device_category?: string | null
          device_compliance?: Json | null
          device_components?: Json | null
          device_summary?: string | null
          device_type?: string | null
          display_as_variant_group?: boolean | null
          ec_certificate?: string | null
          emdn_category_id?: string | null
          emdn_code?: string | null
          emdn_description?: string | null
          eu_representative?: string | null
          eudamed_active?: boolean | null
          eudamed_address?: string | null
          eudamed_administering_medicine?: boolean | null
          eudamed_applicable_legislation?: string | null
          eudamed_basic_udi_di_code?: string | null
          eudamed_ca_address?: string | null
          eudamed_ca_country?: string | null
          eudamed_ca_email?: string | null
          eudamed_ca_name?: string | null
          eudamed_ca_phone?: string | null
          eudamed_ca_postcode?: string | null
          eudamed_contain_latex?: boolean | null
          eudamed_country?: string | null
          eudamed_device_model?: string | null
          eudamed_device_name?: string | null
          eudamed_direct_marking?: boolean | null
          eudamed_email?: string | null
          eudamed_id_srn?: string | null
          eudamed_implantable?: boolean | null
          eudamed_issuing_agency?: string | null
          eudamed_market_distribution?: string | null
          eudamed_max_reuses?: number | null
          eudamed_measuring?: boolean | null
          eudamed_nomenclature_codes?: Json | null
          eudamed_organization?: string | null
          eudamed_organization_status?: string | null
          eudamed_phone?: string | null
          eudamed_placed_on_the_market?: string | null
          eudamed_postcode?: string | null
          eudamed_prrc_address?: string | null
          eudamed_prrc_country?: string | null
          eudamed_prrc_email?: string | null
          eudamed_prrc_first_name?: string | null
          eudamed_prrc_last_name?: string | null
          eudamed_prrc_phone?: string | null
          eudamed_prrc_postcode?: string | null
          eudamed_prrc_responsible_for?: string | null
          eudamed_quantity_of_device?: string | null
          eudamed_reference_number?: string | null
          eudamed_registration_number?: string | null
          eudamed_reprocessed?: boolean | null
          eudamed_reusable?: boolean | null
          eudamed_risk_class?: string | null
          eudamed_single_use?: boolean | null
          eudamed_status?: string | null
          eudamed_sterile?: boolean | null
          eudamed_sterilization_need?: boolean | null
          eudamed_trade_names?: string | null
          eudamed_website?: string | null
          facility_locations?: string | null
          fda_product_code?: string | null
          fda_product_codes?: Json | null
          feasibility_portfolio_id?: string | null
          field_overrides?: Json | null
          field_scope_overrides?: Json | null
          fto_analysis_date?: string | null
          fto_certainty?: string | null
          fto_mitigation_strategy?: string | null
          fto_notes?: string | null
          fto_risk_level?: string | null
          fto_status?: string | null
          gtin?: string | null
          has_classification_override?: boolean | null
          has_clinical_benefits_override?: boolean | null
          has_contraindications_override?: boolean | null
          has_definition_override?: boolean | null
          has_device_components_override?: boolean | null
          has_duration_of_use_override?: boolean | null
          has_environment_of_use_override?: boolean | null
          has_intended_use_override?: boolean | null
          has_intended_users_override?: boolean | null
          has_no_accessories?: boolean | null
          has_shelf_life_override?: boolean | null
          has_storage_sterility_override?: boolean | null
          has_technical_specs_override?: boolean | null
          has_warnings_override?: boolean | null
          id?: string
          image?: string | null
          images?: Json | null
          inherit_pricing_from_model?: boolean | null
          inserted_at?: string
          intended_purpose_data?: Json | null
          intended_use?: string | null
          intended_users?: Json | null
          ip_ownership_notes?: string | null
          ip_ownership_status?: string | null
          ip_protection_types?: string[] | null
          ip_strategy_completed?: boolean | null
          ip_strategy_summary?: string | null
          is_archived?: boolean
          is_line_extension?: boolean
          is_master_device?: boolean
          is_master_product?: boolean | null
          is_platform_core?: boolean | null
          is_software_project?: boolean | null
          is_variant?: boolean | null
          isActiveDevice?: boolean | null
          iso_certifications?: Json | null
          key_features?: Json | null
          key_technology_characteristics?: Json | null
          launch_status?: Database["public"]["Enums"]["launch_status"] | null
          manufacturer?: string | null
          market_authorization_holder?: string | null
          market_extension_id?: string | null
          market_launch_dates?: Json | null
          markets?: Json | null
          master_product_id?: string | null
          model_id?: string | null
          model_reference?: string | null
          model_version?: string | null
          models_3d?: Json | null
          name: string
          no_ip_applicable?: boolean | null
          notified_body?: string | null
          parent_product_id?: string | null
          parent_relationship_type?:
            | Database["public"]["Enums"]["parent_relationship_type"]
            | null
          platform_project_id?: string | null
          pms_plan_status?: string | null
          post_market_surveillance_date?: string | null
          primary_regulatory_type?: string | null
          product_family_placeholder?: string | null
          product_platform?: string | null
          progress?: number | null
          project_start_date?: string | null
          project_types?: Json
          projected_launch_date?: string | null
          psur_status?: string | null
          registration_date?: string | null
          registration_status?: string | null
          regulatory_override_at?: string | null
          regulatory_override_by?: string | null
          regulatory_override_reason?: string | null
          regulatory_status?: string | null
          risk_management_status?: string | null
          samd_gpl_code_present?: boolean | null
          samd_license_audit_completed?: boolean | null
          samd_license_notes?: string | null
          sibling_group_id?: string | null
          status?: string | null
          storage_sterility_handling?: Json | null
          strategic_partners?: Json | null
          technical_doc_status?: string | null
          timeline_confirmed?: boolean | null
          trade_name?: string | null
          trl_level?: number | null
          trl_notes?: string | null
          udi_di?: string | null
          udi_pi?: string | null
          udi_pi_config?: Json | null
          updated_at?: string
          user_instructions?: Json | null
          variant_display_name?: string | null
          variant_group_summary?: Json | null
          variant_sequence?: number | null
          variant_tags?: Json | null
          version?: string | null
          videos?: string | null
          videos_array?: Json | null
          vigilance_status?: string | null
        }
        Update: {
          actual_launch_date?: string | null
          archived_at?: string | null
          archived_by?: string | null
          article_number?: string | null
          basic_udi_di?: string | null
          ce_mark_status?: string | null
          change_description?: string | null
          class?: string | null
          clinical_benefits?: Json | null
          clinical_eval_status?: string | null
          commercial_factors_enabled?: boolean | null
          commercial_launch_date?: string | null
          company_id?: string | null
          conformity_assessment_route?: string | null
          conformity_route?: string | null
          contraindications?: string[] | null
          current_lifecycle_phase?: string | null
          definition_override_reason?: string | null
          description?: string | null
          design_freeze_date?: string | null
          device_category?: string | null
          device_compliance?: Json | null
          device_components?: Json | null
          device_summary?: string | null
          device_type?: string | null
          display_as_variant_group?: boolean | null
          ec_certificate?: string | null
          emdn_category_id?: string | null
          emdn_code?: string | null
          emdn_description?: string | null
          eu_representative?: string | null
          eudamed_active?: boolean | null
          eudamed_address?: string | null
          eudamed_administering_medicine?: boolean | null
          eudamed_applicable_legislation?: string | null
          eudamed_basic_udi_di_code?: string | null
          eudamed_ca_address?: string | null
          eudamed_ca_country?: string | null
          eudamed_ca_email?: string | null
          eudamed_ca_name?: string | null
          eudamed_ca_phone?: string | null
          eudamed_ca_postcode?: string | null
          eudamed_contain_latex?: boolean | null
          eudamed_country?: string | null
          eudamed_device_model?: string | null
          eudamed_device_name?: string | null
          eudamed_direct_marking?: boolean | null
          eudamed_email?: string | null
          eudamed_id_srn?: string | null
          eudamed_implantable?: boolean | null
          eudamed_issuing_agency?: string | null
          eudamed_market_distribution?: string | null
          eudamed_max_reuses?: number | null
          eudamed_measuring?: boolean | null
          eudamed_nomenclature_codes?: Json | null
          eudamed_organization?: string | null
          eudamed_organization_status?: string | null
          eudamed_phone?: string | null
          eudamed_placed_on_the_market?: string | null
          eudamed_postcode?: string | null
          eudamed_prrc_address?: string | null
          eudamed_prrc_country?: string | null
          eudamed_prrc_email?: string | null
          eudamed_prrc_first_name?: string | null
          eudamed_prrc_last_name?: string | null
          eudamed_prrc_phone?: string | null
          eudamed_prrc_postcode?: string | null
          eudamed_prrc_responsible_for?: string | null
          eudamed_quantity_of_device?: string | null
          eudamed_reference_number?: string | null
          eudamed_registration_number?: string | null
          eudamed_reprocessed?: boolean | null
          eudamed_reusable?: boolean | null
          eudamed_risk_class?: string | null
          eudamed_single_use?: boolean | null
          eudamed_status?: string | null
          eudamed_sterile?: boolean | null
          eudamed_sterilization_need?: boolean | null
          eudamed_trade_names?: string | null
          eudamed_website?: string | null
          facility_locations?: string | null
          fda_product_code?: string | null
          fda_product_codes?: Json | null
          feasibility_portfolio_id?: string | null
          field_overrides?: Json | null
          field_scope_overrides?: Json | null
          fto_analysis_date?: string | null
          fto_certainty?: string | null
          fto_mitigation_strategy?: string | null
          fto_notes?: string | null
          fto_risk_level?: string | null
          fto_status?: string | null
          gtin?: string | null
          has_classification_override?: boolean | null
          has_clinical_benefits_override?: boolean | null
          has_contraindications_override?: boolean | null
          has_definition_override?: boolean | null
          has_device_components_override?: boolean | null
          has_duration_of_use_override?: boolean | null
          has_environment_of_use_override?: boolean | null
          has_intended_use_override?: boolean | null
          has_intended_users_override?: boolean | null
          has_no_accessories?: boolean | null
          has_shelf_life_override?: boolean | null
          has_storage_sterility_override?: boolean | null
          has_technical_specs_override?: boolean | null
          has_warnings_override?: boolean | null
          id?: string
          image?: string | null
          images?: Json | null
          inherit_pricing_from_model?: boolean | null
          inserted_at?: string
          intended_purpose_data?: Json | null
          intended_use?: string | null
          intended_users?: Json | null
          ip_ownership_notes?: string | null
          ip_ownership_status?: string | null
          ip_protection_types?: string[] | null
          ip_strategy_completed?: boolean | null
          ip_strategy_summary?: string | null
          is_archived?: boolean
          is_line_extension?: boolean
          is_master_device?: boolean
          is_master_product?: boolean | null
          is_platform_core?: boolean | null
          is_software_project?: boolean | null
          is_variant?: boolean | null
          isActiveDevice?: boolean | null
          iso_certifications?: Json | null
          key_features?: Json | null
          key_technology_characteristics?: Json | null
          launch_status?: Database["public"]["Enums"]["launch_status"] | null
          manufacturer?: string | null
          market_authorization_holder?: string | null
          market_extension_id?: string | null
          market_launch_dates?: Json | null
          markets?: Json | null
          master_product_id?: string | null
          model_id?: string | null
          model_reference?: string | null
          model_version?: string | null
          models_3d?: Json | null
          name?: string
          no_ip_applicable?: boolean | null
          notified_body?: string | null
          parent_product_id?: string | null
          parent_relationship_type?:
            | Database["public"]["Enums"]["parent_relationship_type"]
            | null
          platform_project_id?: string | null
          pms_plan_status?: string | null
          post_market_surveillance_date?: string | null
          primary_regulatory_type?: string | null
          product_family_placeholder?: string | null
          product_platform?: string | null
          progress?: number | null
          project_start_date?: string | null
          project_types?: Json
          projected_launch_date?: string | null
          psur_status?: string | null
          registration_date?: string | null
          registration_status?: string | null
          regulatory_override_at?: string | null
          regulatory_override_by?: string | null
          regulatory_override_reason?: string | null
          regulatory_status?: string | null
          risk_management_status?: string | null
          samd_gpl_code_present?: boolean | null
          samd_license_audit_completed?: boolean | null
          samd_license_notes?: string | null
          sibling_group_id?: string | null
          status?: string | null
          storage_sterility_handling?: Json | null
          strategic_partners?: Json | null
          technical_doc_status?: string | null
          timeline_confirmed?: boolean | null
          trade_name?: string | null
          trl_level?: number | null
          trl_notes?: string | null
          udi_di?: string | null
          udi_pi?: string | null
          udi_pi_config?: Json | null
          updated_at?: string
          user_instructions?: Json | null
          variant_display_name?: string | null
          variant_group_summary?: Json | null
          variant_sequence?: number | null
          variant_tags?: Json | null
          version?: string | null
          videos?: string | null
          videos_array?: Json | null
          vigilance_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "products_feasibility_portfolio_id_fkey"
            columns: ["feasibility_portfolio_id"]
            isOneToOne: false
            referencedRelation: "feasibility_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_market_extension_id_fkey"
            columns: ["market_extension_id"]
            isOneToOne: false
            referencedRelation: "market_extensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "products_master_product_id_fkey"
            columns: ["master_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "company_product_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_platform_project_id_fkey"
            columns: ["platform_project_id"]
            isOneToOne: false
            referencedRelation: "platform_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sibling_group_id_fkey"
            columns: ["sibling_group_id"]
            isOneToOne: false
            referencedRelation: "product_sibling_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_product_id: string | null
          product_id: string | null
          project_category: string
          project_types: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_product_id?: string | null
          product_id?: string | null
          project_category: string
          project_types?: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_product_id?: string | null
          product_id?: string | null
          project_category?: string
          project_types?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "projects_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "projects_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      qms_node_internal_processes: {
        Row: {
          company_id: string
          id: string
          node_id: string
          process_description: string | null
          process_steps: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id: string
          id?: string
          node_id: string
          process_description?: string | null
          process_steps?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          node_id?: string
          process_description?: string | null
          process_steps?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qms_node_internal_processes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qms_node_internal_processes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "qms_node_internal_processes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qms_node_sop_links: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          document_id: string
          id: string
          node_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          document_id: string
          id?: string
          node_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          document_id?: string
          id?: string
          node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qms_node_sop_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qms_node_sop_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "qms_node_sop_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qms_node_sop_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_messages: {
        Row: {
          company_id: string | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          priority: string | null
          product_id: string | null
          read_at: string | null
          recipient_email: string | null
          recipient_user_id: string | null
          sender_id: string
          subject: string | null
          thread_id: string | null
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          product_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_user_id?: string | null
          sender_id: string
          subject?: string | null
          thread_id?: string | null
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string | null
          product_id?: string | null
          read_at?: string | null
          recipient_email?: string | null
          recipient_user_id?: string | null
          sender_id?: string
          subject?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "quick_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quick_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_documents: {
        Row: {
          company_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      regulatory_cost_templates: {
        Row: {
          cost_category: string
          cost_description: string | null
          cost_subcategory: string | null
          created_at: string
          currency: string
          device_class: string
          frequency: string | null
          id: string
          is_active: boolean
          justification: string | null
          market_code: string
          market_name: string
          max_cost: number | null
          min_cost: number | null
          timeline_months: number | null
          typical_cost: number
          updated_at: string
        }
        Insert: {
          cost_category: string
          cost_description?: string | null
          cost_subcategory?: string | null
          created_at?: string
          currency?: string
          device_class: string
          frequency?: string | null
          id?: string
          is_active?: boolean
          justification?: string | null
          market_code: string
          market_name: string
          max_cost?: number | null
          min_cost?: number | null
          timeline_months?: number | null
          typical_cost: number
          updated_at?: string
        }
        Update: {
          cost_category?: string
          cost_description?: string | null
          cost_subcategory?: string | null
          created_at?: string
          currency?: string
          device_class?: string
          frequency?: string | null
          id?: string
          is_active?: boolean
          justification?: string | null
          market_code?: string
          market_name?: string
          max_cost?: number | null
          min_cost?: number | null
          timeline_months?: number | null
          typical_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      report_analytics: {
        Row: {
          action_details: Json | null
          action_type: string
          company_id: string
          created_at: string | null
          id: string
          report_id: string
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          company_id: string
          created_at?: string | null
          id?: string
          report_id: string
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          company_id?: string
          created_at?: string | null
          id?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "report_analytics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "market_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_chat_sessions: {
        Row: {
          ai_response: string
          company_id: string
          created_at: string
          id: string
          query_text: string
          report_id: string
          response_sources: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_response: string
          company_id: string
          created_at?: string
          id?: string
          query_text: string
          report_id: string
          response_sources?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_response?: string
          company_id?: string
          created_at?: string
          id?: string
          query_text?: string
          report_id?: string
          response_sources?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_chat_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_chat_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "report_chat_sessions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "market_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_specifications: {
        Row: {
          category: string | null
          child_requirements: Json | null
          company_id: string
          component_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          linked_risks: string | null
          parent_requirements: Json | null
          product_id: string
          requirement_id: string
          requirement_type:
            | Database["public"]["Enums"]["requirement_type"]
            | null
          traces_to: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          category?: string | null
          child_requirements?: Json | null
          company_id: string
          component_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          linked_risks?: string | null
          parent_requirements?: Json | null
          product_id: string
          requirement_id: string
          requirement_type?:
            | Database["public"]["Enums"]["requirement_type"]
            | null
          traces_to?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          category?: string | null
          child_requirements?: Json | null
          company_id?: string
          component_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          linked_risks?: string | null
          parent_requirements?: Json | null
          product_id?: string
          requirement_id?: string
          requirement_type?:
            | Database["public"]["Enums"]["requirement_type"]
            | null
          traces_to?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_specifications_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "device_components"
            referencedColumns: ["id"]
          },
        ]
      }
      review_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_type: string | null
          completed_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          reviewer_group_id: string
          stage_number: number
          status: string | null
          workflow_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_type?: string | null
          completed_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          reviewer_group_id: string
          stage_number: number
          status?: string | null
          workflow_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_type?: string | null
          completed_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          reviewer_group_id?: string
          stage_number?: number
          status?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_assignments_reviewer_group_id_fkey"
            columns: ["reviewer_group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_assignments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "review_workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_assignments_workflow_id_stage_number_fkey"
            columns: ["workflow_id", "stage_number"]
            isOneToOne: false
            referencedRelation: "review_workflow_stages"
            referencedColumns: ["workflow_id", "stage_number"]
          },
        ]
      }
      review_comments: {
        Row: {
          assignment_id: string | null
          comment_text: string
          comment_type: string | null
          commenter_id: string | null
          created_at: string | null
          id: string
          is_resolved: boolean | null
          parent_comment_id: string | null
          position: Json | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          comment_text: string
          comment_type?: string | null
          commenter_id?: string | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          position?: Json | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          comment_text?: string
          comment_type?: string | null
          commenter_id?: string | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          position?: Json | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "review_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "review_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "review_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      review_decisions: {
        Row: {
          assignment_id: string | null
          comments: string | null
          decision: string
          decision_at: string | null
          id: string
          is_final: boolean | null
          metadata: Json | null
          reviewer_id: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          comments?: string | null
          decision: string
          decision_at?: string | null
          id?: string
          is_final?: boolean | null
          metadata?: Json | null
          reviewer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          comments?: string | null
          decision?: string
          decision_at?: string | null
          id?: string
          is_final?: boolean | null
          metadata?: Json | null
          reviewer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_decisions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "review_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_notifications: {
        Row: {
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          title: string
          user_id: string | null
          workflow_id: string | null
        }
        Insert: {
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          title: string
          user_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          title?: string
          user_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_notifications_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "review_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      review_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          record_type: string
          template_config: Json
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          record_type: string
          template_config: Json
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          record_type?: string
          template_config?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      review_workflow_stages: {
        Row: {
          approval_threshold: number | null
          auto_advance: boolean | null
          created_at: string | null
          id: string
          is_parallel: boolean | null
          required_approvals: number
          stage_description: string | null
          stage_name: string
          stage_number: number
          workflow_id: string | null
        }
        Insert: {
          approval_threshold?: number | null
          auto_advance?: boolean | null
          created_at?: string | null
          id?: string
          is_parallel?: boolean | null
          required_approvals?: number
          stage_description?: string | null
          stage_name: string
          stage_number: number
          workflow_id?: string | null
        }
        Update: {
          approval_threshold?: number | null
          auto_advance?: boolean | null
          created_at?: string | null
          id?: string
          is_parallel?: boolean | null
          required_approvals?: number
          stage_description?: string | null
          stage_name?: string
          stage_number?: number
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_workflow_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "review_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      review_workflows: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_stage: number
          due_date: string | null
          id: string
          metadata: Json | null
          overall_status: string
          priority: string | null
          record_id: string
          record_type: string
          total_stages: number
          updated_at: string | null
          workflow_description: string | null
          workflow_name: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: number
          due_date?: string | null
          id?: string
          metadata?: Json | null
          overall_status?: string
          priority?: string | null
          record_id: string
          record_type: string
          total_stages?: number
          updated_at?: string | null
          workflow_description?: string | null
          workflow_name: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage?: number
          due_date?: string | null
          id?: string
          metadata?: Json | null
          overall_status?: string
          priority?: string | null
          record_id?: string
          record_type?: string
          total_stages?: number
          updated_at?: string | null
          workflow_description?: string | null
          workflow_name?: string
        }
        Relationships: []
      }
      reviewer_group_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          can_approve: boolean | null
          can_reject: boolean | null
          can_request_changes: boolean | null
          group_id: string
          id: string
          is_active: boolean | null
          notification_preferences: Json | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          can_approve?: boolean | null
          can_reject?: boolean | null
          can_request_changes?: boolean | null
          group_id: string
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          can_approve?: boolean | null
          can_reject?: boolean | null
          can_request_changes?: boolean | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          notification_preferences?: Json | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      reviewer_group_members_new: {
        Row: {
          added_at: string
          added_by: string | null
          can_approve: boolean | null
          can_reject: boolean | null
          can_request_changes: boolean | null
          group_id: string
          id: string
          is_active: boolean | null
          is_lead: boolean | null
          notification_preferences: Json | null
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          can_approve?: boolean | null
          can_reject?: boolean | null
          can_request_changes?: boolean | null
          group_id: string
          id?: string
          is_active?: boolean | null
          is_lead?: boolean | null
          notification_preferences?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          can_approve?: boolean | null
          can_reject?: boolean | null
          can_request_changes?: boolean | null
          group_id?: string
          id?: string
          is_active?: boolean | null
          is_lead?: boolean | null
          notification_preferences?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviewer_group_members_reviewer_groups"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviewer_group_members_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviewer_group_members_new_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "reviewer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewer_groups: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          group_type: string
          id: string
          is_default: boolean | null
          is_removed: boolean | null
          name: string
          permissions: Json
          settings: Json
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: string
          id?: string
          is_default?: boolean | null
          is_removed?: boolean | null
          name: string
          permissions?: Json
          settings?: Json
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_type?: string
          id?: string
          is_default?: boolean | null
          is_removed?: boolean | null
          name?: string
          permissions?: Json
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviewer_groups_companies"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reviewer_groups_companies"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "reviewer_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviewer_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      rnpv_calculations: {
        Row: {
          calculated_at: string
          calculation_metadata: Json
          calculation_type: string
          calculation_version: string
          company_id: string
          cumulative_commercial_los: number
          cumulative_technical_los: number
          expected_cost_pv: number
          expected_revenue_pv: number
          id: string
          market_code: string | null
          phase_calculations: Json
          rnpv_product_id: string
          rnpv_value: number
          scenario_id: string | null
        }
        Insert: {
          calculated_at?: string
          calculation_metadata?: Json
          calculation_type: string
          calculation_version?: string
          company_id: string
          cumulative_commercial_los?: number
          cumulative_technical_los?: number
          expected_cost_pv?: number
          expected_revenue_pv?: number
          id?: string
          market_code?: string | null
          phase_calculations?: Json
          rnpv_product_id: string
          rnpv_value?: number
          scenario_id?: string | null
        }
        Update: {
          calculated_at?: string
          calculation_metadata?: Json
          calculation_type?: string
          calculation_version?: string
          company_id?: string
          cumulative_commercial_los?: number
          cumulative_technical_los?: number
          expected_cost_pv?: number
          expected_revenue_pv?: number
          id?: string
          market_code?: string | null
          phase_calculations?: Json
          rnpv_product_id?: string
          rnpv_value?: number
          scenario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rnpv_calculations_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "rnpv_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rnpv_scenarios: {
        Row: {
          active_markets: Json
          company_id: string
          core_project_config: Json
          created_at: string
          created_by: string | null
          id: string
          is_baseline: boolean
          los_adjustments: Json
          product_id: string
          scenario_description: string | null
          scenario_name: string
          updated_at: string
        }
        Insert: {
          active_markets?: Json
          company_id: string
          core_project_config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_baseline?: boolean
          los_adjustments?: Json
          product_id: string
          scenario_description?: string | null
          scenario_name: string
          updated_at?: string
        }
        Update: {
          active_markets?: Json
          company_id?: string
          core_project_config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_baseline?: boolean
          los_adjustments?: Json
          product_id?: string
          scenario_description?: string | null
          scenario_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          granted: boolean | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          granted?: boolean | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_training_requirements: {
        Row: {
          annual_due_day: number | null
          annual_due_month: number | null
          company_id: string
          created_at: string | null
          due_days: number | null
          due_type: string
          id: string
          is_mandatory: boolean | null
          role_id: string
          training_module_id: string
          updated_at: string | null
        }
        Insert: {
          annual_due_day?: number | null
          annual_due_month?: number | null
          company_id: string
          created_at?: string | null
          due_days?: number | null
          due_type?: string
          id?: string
          is_mandatory?: boolean | null
          role_id: string
          training_module_id: string
          updated_at?: string | null
        }
        Update: {
          annual_due_day?: number | null
          annual_due_month?: number | null
          company_id?: string
          created_at?: string | null
          due_days?: number | null
          due_type?: string
          id?: string
          is_mandatory?: boolean | null
          role_id?: string
          training_module_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_training_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_training_requirements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "role_training_requirements_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "company_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_training_requirements_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_size_rationales: {
        Row: {
          approved_by: string | null
          company_id: string
          confidence_level: string
          created_at: string | null
          created_by: string | null
          determination: string
          document_id: string
          failure_mode: string
          id: string
          is_override: boolean | null
          linked_hazard_id: string | null
          override_reason: string | null
          product_id: string | null
          qmsr_clause_reference: string | null
          rationale_text: string
          sample_size: number
          severity_level: string
          statistical_method: string | null
          status: string | null
          test_case_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          confidence_level: string
          created_at?: string | null
          created_by?: string | null
          determination: string
          document_id: string
          failure_mode: string
          id?: string
          is_override?: boolean | null
          linked_hazard_id?: string | null
          override_reason?: string | null
          product_id?: string | null
          qmsr_clause_reference?: string | null
          rationale_text: string
          sample_size: number
          severity_level: string
          statistical_method?: string | null
          status?: string | null
          test_case_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          confidence_level?: string
          created_at?: string | null
          created_by?: string | null
          determination?: string
          document_id?: string
          failure_mode?: string
          id?: string
          is_override?: boolean | null
          linked_hazard_id?: string | null
          override_reason?: string | null
          product_id?: string | null
          qmsr_clause_reference?: string | null
          rationale_text?: string
          sample_size?: number
          severity_level?: string
          statistical_method?: string | null
          status?: string | null
          test_case_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sample_size_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_size_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sample_size_rationales_linked_hazard_id_fkey"
            columns: ["linked_hazard_id"]
            isOneToOne: false
            referencedRelation: "hazards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_size_rationales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sample_size_rationales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sample_size_rationales_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_queries: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_public: boolean | null
          query_name: string
          query_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          query_name: string
          query_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          query_name?: string
          query_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_queries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_queries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      scraper_errors: {
        Row: {
          cnd_code: string | null
          cnd_uuid: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: number
          level: number | null
          parent_uuid: string | null
          request_data: Json | null
          response_data: Json | null
          url: string | null
        }
        Insert: {
          cnd_code?: string | null
          cnd_uuid?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: number
          level?: number | null
          parent_uuid?: string | null
          request_data?: Json | null
          response_data?: Json | null
          url?: string | null
        }
        Update: {
          cnd_code?: string | null
          cnd_uuid?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: number
          level?: number | null
          parent_uuid?: string | null
          request_data?: Json | null
          response_data?: Json | null
          url?: string | null
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          ai_response: string | null
          company_id: string
          created_at: string | null
          id: string
          query_text: string
          response_time_ms: number | null
          source_chunks: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          query_text: string
          response_time_ms?: number | null
          source_chunks?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_response?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          query_text?: string
          response_time_ms?: number | null
          source_chunks?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sibling_group_product_relationships: {
        Row: {
          accessory_product_id: string
          company_id: string
          created_at: string
          id: string
          initial_multiplier: number
          is_required: boolean
          lifecycle_duration_months: number
          main_sibling_group_id: string
          recurring_multiplier: number
          recurring_period: string
          relationship_type: string
          revenue_attribution_percentage: number
          seasonality_factors: Json | null
          typical_quantity: number
          updated_at: string
        }
        Insert: {
          accessory_product_id: string
          company_id: string
          created_at?: string
          id?: string
          initial_multiplier?: number
          is_required?: boolean
          lifecycle_duration_months?: number
          main_sibling_group_id: string
          recurring_multiplier?: number
          recurring_period?: string
          relationship_type?: string
          revenue_attribution_percentage?: number
          seasonality_factors?: Json | null
          typical_quantity?: number
          updated_at?: string
        }
        Update: {
          accessory_product_id?: string
          company_id?: string
          created_at?: string
          id?: string
          initial_multiplier?: number
          is_required?: boolean
          lifecycle_duration_months?: number
          main_sibling_group_id?: string
          recurring_multiplier?: number
          recurring_period?: string
          relationship_type?: string
          revenue_attribution_percentage?: number
          seasonality_factors?: Json | null
          typical_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      sibling_group_relationships: {
        Row: {
          accessory_sibling_group_id: string
          company_id: string
          created_at: string
          id: string
          initial_multiplier: number | null
          lifecycle_duration_months: number | null
          main_sibling_group_id: string
          recurring_multiplier: number | null
          recurring_period: string | null
          relationship_type: string
          revenue_attribution_percentage: number | null
          seasonality_factors: Json | null
          updated_at: string
        }
        Insert: {
          accessory_sibling_group_id: string
          company_id: string
          created_at?: string
          id?: string
          initial_multiplier?: number | null
          lifecycle_duration_months?: number | null
          main_sibling_group_id: string
          recurring_multiplier?: number | null
          recurring_period?: string | null
          relationship_type?: string
          revenue_attribution_percentage?: number | null
          seasonality_factors?: Json | null
          updated_at?: string
        }
        Update: {
          accessory_sibling_group_id?: string
          company_id?: string
          created_at?: string
          id?: string
          initial_multiplier?: number | null
          lifecycle_duration_months?: number | null
          main_sibling_group_id?: string
          recurring_multiplier?: number | null
          recurring_period?: string | null
          relationship_type?: string
          revenue_attribution_percentage?: number | null
          seasonality_factors?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sibling_group_relationships_accessory_sibling_group_id_fkey"
            columns: ["accessory_sibling_group_id"]
            isOneToOne: false
            referencedRelation: "product_sibling_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sibling_group_relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sibling_group_relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "sibling_group_relationships_main_sibling_group_id_fkey"
            columns: ["main_sibling_group_id"]
            isOneToOne: false
            referencedRelation: "product_sibling_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_preferences: {
        Row: {
          checked_l1: Json | null
          checked_l2: Json | null
          company_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checked_l1?: Json | null
          checked_l2?: Json | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checked_l1?: Json | null
          checked_l2?: Json | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidebar_preferences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      slack_knowledge_chats: {
        Row: {
          ai_response: string
          cluster_filter: string | null
          company_id: string
          created_at: string
          id: string
          query_text: string
          user_id: string
        }
        Insert: {
          ai_response?: string
          cluster_filter?: string | null
          company_id: string
          created_at?: string
          id?: string
          query_text: string
          user_id: string
        }
        Update: {
          ai_response?: string
          cluster_filter?: string | null
          company_id?: string
          created_at?: string
          id?: string
          query_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_knowledge_chats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_knowledge_chats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      slack_knowledge_entries: {
        Row: {
          channel_name: string | null
          cluster: string | null
          company_id: string
          content_text: string
          created_at: string
          id: string
          message_count: number
          raw_messages: Json
          source_date: string | null
          uploaded_by: string
        }
        Insert: {
          channel_name?: string | null
          cluster?: string | null
          company_id: string
          content_text?: string
          created_at?: string
          id?: string
          message_count?: number
          raw_messages?: Json
          source_date?: string | null
          uploaded_by: string
        }
        Update: {
          channel_name?: string | null
          cluster?: string | null
          company_id?: string
          content_text?: string
          created_at?: string
          id?: string
          message_count?: number
          raw_messages?: Json
          source_date?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_knowledge_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slack_knowledge_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      slack_sync_state: {
        Row: {
          channel_id: string
          channel_name: string | null
          company_id: string
          created_at: string
          id: string
          last_synced_at: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          channel_name?: string | null
          company_id: string
          created_at?: string
          id?: string
          last_synced_at?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          channel_name?: string | null
          company_id?: string
          created_at?: string
          id?: string
          last_synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      smart_revenue_calculations: {
        Row: {
          accessory_product_id: string
          calculation_metadata: Json | null
          calculation_month: string
          company_id: string
          created_at: string | null
          id: string
          initial_accessory_revenue: number | null
          main_product_forecast_units: number | null
          main_product_id: string
          recurring_accessory_revenue: number | null
          total_attributed_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          accessory_product_id: string
          calculation_metadata?: Json | null
          calculation_month: string
          company_id: string
          created_at?: string | null
          id?: string
          initial_accessory_revenue?: number | null
          main_product_forecast_units?: number | null
          main_product_id: string
          recurring_accessory_revenue?: number | null
          total_attributed_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          accessory_product_id?: string
          calculation_metadata?: Json | null
          calculation_month?: string
          company_id?: string
          created_at?: string | null
          id?: string
          initial_accessory_revenue?: number | null
          main_product_forecast_units?: number | null
          main_product_id?: string
          recurring_accessory_revenue?: number | null
          total_attributed_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_revenue_calculations_accessory_product_id_fkey"
            columns: ["accessory_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "smart_revenue_calculations_accessory_product_id_fkey"
            columns: ["accessory_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_revenue_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_revenue_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "smart_revenue_calculations_main_product_id_fkey"
            columns: ["main_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "smart_revenue_calculations_main_product_id_fkey"
            columns: ["main_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      software_requirements: {
        Row: {
          acceptance_criteria: string | null
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          priority: string | null
          product_id: string
          rationale: string | null
          requirement_id: string
          safety_classification: string | null
          status: string | null
          updated_at: string | null
          verification_method: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          priority?: string | null
          product_id: string
          rationale?: string | null
          requirement_id: string
          safety_classification?: string | null
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          priority?: string | null
          product_id?: string
          rationale?: string | null
          requirement_id?: string
          safety_classification?: string | null
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_software_req_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_software_req_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_software_req_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_software_req_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_document_templates: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          example: string | null
          id: string
          is_addable: boolean
          is_default: boolean
          is_editable: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string
          example?: string | null
          id?: string
          is_addable?: boolean
          is_default?: boolean
          is_editable?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          example?: string | null
          id?: string
          is_addable?: boolean
          is_default?: boolean
          is_editable?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_checkout_sessions: {
        Row: {
          company_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          metadata: Json | null
          payment_status: string | null
          plan_id: string
          plan_name: string
          price_amount: number
          price_currency: string | null
          session_id: string
          stripe_price_id: string | null
          subscription_id: string | null
          tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          payment_status?: string | null
          plan_id: string
          plan_name: string
          price_amount: number
          price_currency?: string | null
          session_id: string
          stripe_price_id?: string | null
          subscription_id?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          payment_status?: string | null
          plan_id?: string
          plan_name?: string
          price_amount?: number
          price_currency?: string | null
          session_id?: string
          stripe_price_id?: string | null
          subscription_id?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_checkout_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_checkout_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          address: Json | null
          company_id: string | null
          created_at: string | null
          customer_id: string
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          phone: string | null
          shipping: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          company_id?: string | null
          created_at?: string | null
          customer_id: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          shipping?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          company_id?: string | null
          created_at?: string | null
          customer_id?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          shipping?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          api_version: string | null
          created_at: string | null
          created_at_db: string | null
          data: Json
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          api_version?: string | null
          created_at?: string | null
          created_at_db?: string | null
          data: Json
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          api_version?: string | null
          created_at?: string | null
          created_at_db?: string | null
          data?: Json
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      stripe_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number
          company_id: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_id: string
          invoice_url: string | null
          metadata: Json | null
          paid_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount_due?: number | null
          amount_paid: number
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_id: string
          invoice_url?: string | null
          metadata?: Json | null
          paid_at?: string | null
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number
          company_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_id?: string
          invoice_url?: string | null
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      stripe_payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          company_id: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          metadata: Json | null
          payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          payment_method_id: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          metadata?: Json | null
          payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          checkout_session_id: string | null
          company_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan_name: string
          status: string
          stripe_price_id: string | null
          subscription_id: string
          tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          checkout_session_id?: string | null
          company_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_name: string
          status: string
          stripe_price_id?: string | null
          subscription_id: string
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          checkout_session_id?: string | null
          company_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan_name?: string
          status?: string
          stripe_price_id?: string | null
          subscription_id?: string
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_subscriptions_checkout_session_id_fkey"
            columns: ["checkout_session_id"]
            isOneToOne: false
            referencedRelation: "stripe_checkout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          is_featured: boolean
          master_emails: Json | null
          menu_access: Json | null
          name: string
          price: number
          sort_order: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          is_featured?: boolean
          master_emails?: Json | null
          menu_access?: Json | null
          name: string
          price: number
          sort_order?: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          is_featured?: boolean
          master_emails?: Json | null
          menu_access?: Json | null
          name?: string
          price?: number
          sort_order?: number
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_certifications: {
        Row: {
          cert_number: string | null
          cert_type: string
          created_at: string | null
          expiry_date: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          cert_number?: string | null
          cert_type: string
          created_at?: string | null
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          cert_number?: string | null
          cert_type?: string
          created_at?: string | null
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_certifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_criticality_rationales: {
        Row: {
          approved_by: string | null
          company_id: string
          component_role: string
          created_at: string | null
          created_by: string | null
          criticality_class: string
          decision: string
          document_id: string
          id: string
          oversight_level: string
          qmsr_clause_reference: string | null
          rationale_text: string
          safety_impact: string
          status: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          component_role: string
          created_at?: string | null
          created_by?: string | null
          criticality_class: string
          decision: string
          document_id: string
          id?: string
          oversight_level: string
          qmsr_clause_reference?: string | null
          rationale_text: string
          safety_impact: string
          status?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          component_role?: string
          created_at?: string | null
          created_by?: string | null
          criticality_class?: string
          decision?: string
          document_id?: string
          id?: string
          oversight_level?: string
          qmsr_clause_reference?: string | null
          rationale_text?: string
          safety_impact?: string
          status?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_criticality_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_criticality_rationales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "supplier_criticality_rationales_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_evaluation_documents: {
        Row: {
          created_at: string
          description: string | null
          document_name: string
          document_type: string
          evaluation_id: string | null
          file_path: string | null
          file_url: string | null
          id: string
          supplier_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_name: string
          document_type?: string
          evaluation_id?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          supplier_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_name?: string
          document_type?: string
          evaluation_id?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          supplier_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      supplier_evaluations: {
        Row: {
          checklist_results: Json | null
          created_at: string | null
          evaluation_date: string | null
          evaluator_id: string | null
          id: string
          notes: string | null
          status: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          checklist_results?: Json | null
          created_at?: string | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          checklist_results?: Json | null
          created_at?: string | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_evaluations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_performance_logs: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          log_date: string | null
          logged_by: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          log_date?: string | null
          logged_by?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          log_date?: string | null
          logged_by?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_performance_logs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          audit_interval: string | null
          company_id: string
          contact_info: Json | null
          created_at: string | null
          criticality: string
          id: string
          name: string
          next_scheduled_audit: string | null
          probationary_reason: string | null
          scope_of_supply: string | null
          status: string
          supplier_type: string | null
          updated_at: string | null
        }
        Insert: {
          audit_interval?: string | null
          company_id: string
          contact_info?: Json | null
          created_at?: string | null
          criticality?: string
          id?: string
          name: string
          next_scheduled_audit?: string | null
          probationary_reason?: string | null
          scope_of_supply?: string | null
          status?: string
          supplier_type?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_interval?: string | null
          company_id?: string
          contact_info?: Json | null
          created_at?: string | null
          criticality?: string
          id?: string
          name?: string
          next_scheduled_audit?: string | null
          probationary_reason?: string | null
          scope_of_supply?: string | null
          status?: string
          supplier_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_architecture_diagrams: {
        Row: {
          architecture_purpose: string | null
          category: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          design_rationale: string | null
          diagram_data: Json
          id: string
          is_template: boolean
          metadata: Json | null
          name: string
          product_id: string
          system_boundary: Json | null
          updated_at: string
          version: string
        }
        Insert: {
          architecture_purpose?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          design_rationale?: string | null
          diagram_data?: Json
          id?: string
          is_template?: boolean
          metadata?: Json | null
          name: string
          product_id: string
          system_boundary?: Json | null
          updated_at?: string
          version?: string
        }
        Update: {
          architecture_purpose?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          design_rationale?: string | null
          diagram_data?: Json
          id?: string
          is_template?: boolean
          metadata?: Json | null
          name?: string
          product_id?: string
          system_boundary?: Json | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      system_interfaces: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          criticality: string | null
          data_flow_description: string | null
          destination_subsystem_id: string | null
          diagram_id: string | null
          id: string
          interface_id: string
          interface_type: string
          metadata: Json | null
          product_id: string
          protocol_specification: string | null
          source_subsystem_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          criticality?: string | null
          data_flow_description?: string | null
          destination_subsystem_id?: string | null
          diagram_id?: string | null
          id?: string
          interface_id: string
          interface_type: string
          metadata?: Json | null
          product_id: string
          protocol_specification?: string | null
          source_subsystem_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          criticality?: string | null
          data_flow_description?: string | null
          destination_subsystem_id?: string | null
          diagram_id?: string | null
          id?: string
          interface_id?: string
          interface_type?: string
          metadata?: Json | null
          product_id?: string
          protocol_specification?: string | null
          source_subsystem_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_interfaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_interfaces_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "system_interfaces_destination_subsystem_id_fkey"
            columns: ["destination_subsystem_id"]
            isOneToOne: false
            referencedRelation: "system_subsystems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_interfaces_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "system_architecture_diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_interfaces_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "system_interfaces_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_interfaces_source_subsystem_id_fkey"
            columns: ["source_subsystem_id"]
            isOneToOne: false
            referencedRelation: "system_subsystems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_requirements: {
        Row: {
          acceptance_criteria: string | null
          category: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          priority: string | null
          product_id: string
          rationale: string | null
          requirement_id: string
          status: string | null
          updated_at: string | null
          verification_method: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          category?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          priority?: string | null
          product_id: string
          rationale?: string | null
          requirement_id: string
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          category?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          priority?: string | null
          product_id?: string
          rationale?: string | null
          requirement_id?: string
          status?: string | null
          updated_at?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_system_req_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_system_req_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "fk_system_req_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_system_req_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_subsystems: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          criticality: string | null
          description: string | null
          diagram_id: string | null
          id: string
          interface_definition: string | null
          metadata: Json | null
          name: string
          product_id: string
          responsible_person_id: string | null
          status: string
          subsystem_id: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          criticality?: string | null
          description?: string | null
          diagram_id?: string | null
          id?: string
          interface_definition?: string | null
          metadata?: Json | null
          name: string
          product_id: string
          responsible_person_id?: string | null
          status?: string
          subsystem_id: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          criticality?: string | null
          description?: string | null
          diagram_id?: string | null
          id?: string
          interface_definition?: string | null
          metadata?: Json | null
          name?: string
          product_id?: string
          responsible_person_id?: string | null
          status?: string
          subsystem_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_subsystems_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_subsystems_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "system_subsystems_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "system_architecture_diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_subsystems_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "system_subsystems_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          id: string
          inserted_at: string
          linkedin_url: string | null
          name: string
          product_id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          id?: string
          inserted_at?: string
          linkedin_url?: string | null
          name: string
          product_id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          id?: string
          inserted_at?: string
          linkedin_url?: string | null
          name?: string
          product_id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "team_members_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_file_document_links: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          product_id: string
          section_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          product_id: string
          section_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          product_id?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_file_document_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "technical_file_document_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      template_responses: {
        Row: {
          activity_id: string
          company_id: string
          completed_at: string | null
          completed_by: string | null
          completion_status: string
          created_at: string
          id: string
          template_data: Json
          template_type: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          completion_status?: string
          created_at?: string
          id?: string
          template_data?: Json
          template_type?: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          completion_status?: string
          created_at?: string
          id?: string
          template_data?: Json
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_settings: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          id?: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      tenant_audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_at: string
          performed_by: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          admin_email: string
          admin_user_id: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          dns_configured: boolean | null
          favicon_url: string | null
          features: Json | null
          id: string
          logo_url: string | null
          name: string
          plan: string
          primary_color: string | null
          primary_company_id: string | null
          provisioned_at: string | null
          provisioning_status: string | null
          settings: Json | null
          ssl_configured: boolean | null
          status: string
          subdomain: string
          updated_at: string
          vercel_domain_id: string | null
          vercel_project_id: string | null
        }
        Insert: {
          admin_email: string
          admin_user_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          dns_configured?: boolean | null
          favicon_url?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          primary_color?: string | null
          primary_company_id?: string | null
          provisioned_at?: string | null
          provisioning_status?: string | null
          settings?: Json | null
          ssl_configured?: boolean | null
          status?: string
          subdomain: string
          updated_at?: string
          vercel_domain_id?: string | null
          vercel_project_id?: string | null
        }
        Update: {
          admin_email?: string
          admin_user_id?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          dns_configured?: boolean | null
          favicon_url?: string | null
          features?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          primary_color?: string | null
          primary_company_id?: string | null
          provisioned_at?: string | null
          provisioning_status?: string | null
          settings?: Json | null
          ssl_configured?: boolean | null
          status?: string
          subdomain?: string
          updated_at?: string
          vercel_domain_id?: string | null
          vercel_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      test_cases: {
        Row: {
          acceptance_criteria: string | null
          assigned_to: string | null
          category: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          estimated_duration: number | null
          expected_results: string | null
          id: string
          name: string
          preconditions: string | null
          priority: string | null
          product_id: string
          sample_size: number | null
          status: string
          test_case_id: string
          test_level: string
          test_method: string | null
          test_steps: Json | null
          test_type: string
          updated_at: string
        }
        Insert: {
          acceptance_criteria?: string | null
          assigned_to?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          estimated_duration?: number | null
          expected_results?: string | null
          id?: string
          name: string
          preconditions?: string | null
          priority?: string | null
          product_id: string
          sample_size?: number | null
          status?: string
          test_case_id: string
          test_level: string
          test_method?: string | null
          test_steps?: Json | null
          test_type: string
          updated_at?: string
        }
        Update: {
          acceptance_criteria?: string | null
          assigned_to?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          estimated_duration?: number | null
          expected_results?: string | null
          id?: string
          name?: string
          preconditions?: string | null
          priority?: string | null
          product_id?: string
          sample_size?: number | null
          status?: string
          test_case_id?: string
          test_level?: string
          test_method?: string | null
          test_steps?: Json | null
          test_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      test_executions: {
        Row: {
          actual_results: string | null
          attachments: Json | null
          created_at: string
          environment_info: Json | null
          executed_by: string
          execution_date: string
          execution_id: string
          execution_time_minutes: number | null
          hardware_version: string | null
          id: string
          notes: string | null
          software_version: string | null
          status: string
          test_case_id: string
          updated_at: string
        }
        Insert: {
          actual_results?: string | null
          attachments?: Json | null
          created_at?: string
          environment_info?: Json | null
          executed_by: string
          execution_date?: string
          execution_id: string
          execution_time_minutes?: number | null
          hardware_version?: string | null
          id?: string
          notes?: string | null
          software_version?: string | null
          status?: string
          test_case_id: string
          updated_at?: string
        }
        Update: {
          actual_results?: string | null
          attachments?: Json | null
          created_at?: string
          environment_info?: Json | null
          executed_by?: string
          execution_date?: string
          execution_id?: string
          execution_time_minutes?: number | null
          hardware_version?: string | null
          id?: string
          notes?: string | null
          software_version?: string | null
          status?: string
          test_case_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_executions_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          external_email: string | null
          external_name: string | null
          external_organization: string | null
          id: string
          is_internal: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          thread_id: string
          unread_count: number | null
          user_id: string | null
        }
        Insert: {
          external_email?: string | null
          external_name?: string | null
          external_organization?: string | null
          id?: string
          is_internal?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          thread_id: string
          unread_count?: number | null
          user_id?: string | null
        }
        Update: {
          external_email?: string | null
          external_name?: string | null
          external_organization?: string | null
          id?: string
          is_internal?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          thread_id?: string
          unread_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      traceability_links: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          link_type: string
          product_id: string | null
          rationale: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          link_type?: string
          product_id?: string | null
          rationale?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          link_type?: string
          product_id?: string | null
          rationale?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traceability_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "traceability_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          company_id: string
          created_at: string | null
          delivery_method: string
          description: string | null
          document_id: string | null
          estimated_minutes: number | null
          external_url: string | null
          group_name: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_signature: boolean | null
          type: string
          updated_at: string | null
          validity_days: number | null
          version: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          delivery_method?: string
          description?: string | null
          document_id?: string | null
          estimated_minutes?: number | null
          external_url?: string | null
          group_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_signature?: boolean | null
          type: string
          updated_at?: string | null
          validity_days?: number | null
          version?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          delivery_method?: string
          description?: string | null
          document_id?: string | null
          estimated_minutes?: number | null
          external_url?: string | null
          group_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_signature?: boolean | null
          type?: string
          updated_at?: string | null
          validity_days?: number | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "training_modules_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_modules_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          assigned_at: string | null
          assigned_trainer_id: string | null
          company_id: string
          completed_at: string | null
          completion_notes: string | null
          created_at: string | null
          due_date: string | null
          expires_at: string | null
          id: string
          previous_record_id: string | null
          reissue_reason: string | null
          role_requirement_id: string | null
          scheduled_session_date: string | null
          score: number | null
          signature_data: Json | null
          started_at: string | null
          status: string
          training_module_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_trainer_id?: string | null
          company_id: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          due_date?: string | null
          expires_at?: string | null
          id?: string
          previous_record_id?: string | null
          reissue_reason?: string | null
          role_requirement_id?: string | null
          scheduled_session_date?: string | null
          score?: number | null
          signature_data?: Json | null
          started_at?: string | null
          status?: string
          training_module_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_trainer_id?: string | null
          company_id?: string
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string | null
          due_date?: string | null
          expires_at?: string | null
          id?: string
          previous_record_id?: string | null
          reissue_reason?: string | null
          role_requirement_id?: string | null
          scheduled_session_date?: string | null
          score?: number | null
          signature_data?: Json | null
          started_at?: string | null
          status?: string
          training_module_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "training_records_previous_record_id_fkey"
            columns: ["previous_record_id"]
            isOneToOne: false
            referencedRelation: "training_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_role_requirement_id_fkey"
            columns: ["role_requirement_id"]
            isOneToOne: false
            referencedRelation: "role_training_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      usability_engineering_files: {
        Row: {
          accompanying_documents: string | null
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          formative_plan: string | null
          id: string
          intended_use: string | null
          intended_users: Json | null
          operating_principle: string | null
          product_id: string
          status: string | null
          summative_plan: string | null
          ui_characteristics: Json | null
          ui_specification: string | null
          updated_at: string | null
          use_environments: Json | null
          version: string | null
        }
        Insert: {
          accompanying_documents?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          formative_plan?: string | null
          id?: string
          intended_use?: string | null
          intended_users?: Json | null
          operating_principle?: string | null
          product_id: string
          status?: string | null
          summative_plan?: string | null
          ui_characteristics?: Json | null
          ui_specification?: string | null
          updated_at?: string | null
          use_environments?: Json | null
          version?: string | null
        }
        Update: {
          accompanying_documents?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          formative_plan?: string | null
          id?: string
          intended_use?: string | null
          intended_users?: Json | null
          operating_principle?: string | null
          product_id?: string
          status?: string | null
          summative_plan?: string | null
          ui_characteristics?: Json | null
          ui_specification?: string | null
          updated_at?: string | null
          use_environments?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usability_engineering_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usability_engineering_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "usability_engineering_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "usability_engineering_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      usability_studies: {
        Row: {
          acceptance_criteria: string | null
          accompanying_docs: string | null
          company_id: string
          conductors: string | null
          created_at: string | null
          created_by: string | null
          id: string
          interview_questions: string | null
          method: string | null
          methods_used: Json | null
          name: string
          negative_learnings: string | null
          objective: string | null
          observations: Json | null
          other_equipment: string | null
          overall_conclusion: string | null
          participants_structured: Json | null
          participants_text: string | null
          positive_learnings: string | null
          product_id: string
          prototype_id: string | null
          recommendations: string | null
          software_version: string | null
          sort_order: number | null
          status: string
          study_dates: string | null
          study_subtype: string | null
          study_type: string
          tasks_structured: Json | null
          tasks_text: string | null
          test_conditions: string | null
          test_location: string | null
          training_description: string | null
          training_to_test_interval: string | null
          uef_id: string | null
          ui_under_evaluation: string | null
          updated_at: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          accompanying_docs?: string | null
          company_id: string
          conductors?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interview_questions?: string | null
          method?: string | null
          methods_used?: Json | null
          name?: string
          negative_learnings?: string | null
          objective?: string | null
          observations?: Json | null
          other_equipment?: string | null
          overall_conclusion?: string | null
          participants_structured?: Json | null
          participants_text?: string | null
          positive_learnings?: string | null
          product_id: string
          prototype_id?: string | null
          recommendations?: string | null
          software_version?: string | null
          sort_order?: number | null
          status?: string
          study_dates?: string | null
          study_subtype?: string | null
          study_type: string
          tasks_structured?: Json | null
          tasks_text?: string | null
          test_conditions?: string | null
          test_location?: string | null
          training_description?: string | null
          training_to_test_interval?: string | null
          uef_id?: string | null
          ui_under_evaluation?: string | null
          updated_at?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          accompanying_docs?: string | null
          company_id?: string
          conductors?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interview_questions?: string | null
          method?: string | null
          methods_used?: Json | null
          name?: string
          negative_learnings?: string | null
          objective?: string | null
          observations?: Json | null
          other_equipment?: string | null
          overall_conclusion?: string | null
          participants_structured?: Json | null
          participants_text?: string | null
          positive_learnings?: string | null
          product_id?: string
          prototype_id?: string | null
          recommendations?: string | null
          software_version?: string | null
          sort_order?: number | null
          status?: string
          study_dates?: string | null
          study_subtype?: string | null
          study_type?: string
          tasks_structured?: Json | null
          tasks_text?: string | null
          test_conditions?: string | null
          test_location?: string | null
          training_description?: string | null
          training_to_test_interval?: string | null
          uef_id?: string | null
          ui_under_evaluation?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usability_studies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usability_studies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "usability_studies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "usability_studies_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usability_studies_uef_id_fkey"
            columns: ["uef_id"]
            isOneToOne: false
            referencedRelation: "usability_engineering_files"
            referencedColumns: ["id"]
          },
        ]
      }
      user_company_access: {
        Row: {
          access_level: Database["public"]["Enums"]["user_role_type"]
          affiliation_type: Database["public"]["Enums"]["affiliation_type"]
          company_id: string
          created_at: string
          department: string | null
          external_role: Database["public"]["Enums"]["external_role"] | null
          functional_area: Database["public"]["Enums"]["functional_area"] | null
          id: string
          is_internal: boolean
          is_invite_user: boolean | null
          is_primary: boolean
          last_accessed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["user_role_type"]
          affiliation_type: Database["public"]["Enums"]["affiliation_type"]
          company_id: string
          created_at?: string
          department?: string | null
          external_role?: Database["public"]["Enums"]["external_role"] | null
          functional_area?:
            | Database["public"]["Enums"]["functional_area"]
            | null
          id?: string
          is_internal?: boolean
          is_invite_user?: boolean | null
          is_primary?: boolean
          last_accessed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["user_role_type"]
          affiliation_type?: Database["public"]["Enums"]["affiliation_type"]
          company_id?: string
          created_at?: string
          department?: string | null
          external_role?: Database["public"]["Enums"]["external_role"] | null
          functional_area?:
            | Database["public"]["Enums"]["functional_area"]
            | null
          id?: string
          is_internal?: boolean
          is_invite_user?: boolean | null
          is_primary?: boolean
          last_accessed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_company_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_company_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_company_module_access: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          module_ids: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_ids?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          module_ids?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_module_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_company_module_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_company_module_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_department_assignments: {
        Row: {
          company_id: string
          created_at: string
          department_name: string
          fte_allocation: number
          id: string
          role: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_name: string
          fte_allocation?: number
          id?: string
          role?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_name?: string
          fte_allocation?: number
          id?: string
          role?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_department_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_department_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      user_document_permissions: {
        Row: {
          company_id: string
          created_at: string
          document_id: string | null
          document_ids: string[]
          id: string
          is_active_reviewer: boolean | null
          is_external_reviewer: boolean | null
          is_internal_reviewer: boolean | null
          override_product_permissions: boolean | null
          permissions: string[] | null
          review_deadline: string | null
          review_scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_id?: string | null
          document_ids?: string[]
          id?: string
          is_active_reviewer?: boolean | null
          is_external_reviewer?: boolean | null
          is_internal_reviewer?: boolean | null
          override_product_permissions?: boolean | null
          permissions?: string[] | null
          review_deadline?: string | null
          review_scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_id?: string | null
          document_ids?: string[]
          id?: string
          is_active_reviewer?: boolean | null
          is_external_reviewer?: boolean | null
          is_internal_reviewer?: boolean | null
          override_product_permissions?: boolean | null
          permissions?: string[] | null
          review_deadline?: string | null
          review_scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          company_id: string
          department_role: string[] | null
          email: string
          expires_at: string
          external_role: string | null
          first_name: string | null
          functional_area: string | null
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string
          is_internal: boolean
          last_name: string | null
          status: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          company_id: string
          department_role?: string[] | null
          email: string
          expires_at?: string
          external_role?: string | null
          first_name?: string | null
          functional_area?: string | null
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by: string
          is_internal?: boolean
          last_name?: string | null
          status?: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          company_id?: string
          department_role?: string[] | null
          email?: string
          expires_at?: string
          external_role?: string | null
          first_name?: string | null
          functional_area?: string | null
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string
          is_internal?: boolean
          last_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_needs: {
        Row: {
          category: string
          child_requirements: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          linked_requirements: string | null
          product_id: string
          status: string
          updated_at: string
          user_need_id: string
        }
        Insert: {
          category?: string
          child_requirements?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          linked_requirements?: string | null
          product_id: string
          status?: string
          updated_at?: string
          user_need_id: string
        }
        Update: {
          category?: string
          child_requirements?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          linked_requirements?: string | null
          product_id?: string
          status?: string
          updated_at?: string
          user_need_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_needs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_needs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_needs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "user_needs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_matrix: {
        Row: {
          access_level: string | null
          assigned_at: string | null
          assigned_by: string | null
          company_id: string
          created_at: string | null
          department: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          notes: string | null
          permissions: Json | null
          product_ids: string[]
          role_id: string | null
          role_name: string | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          access_level?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          company_id: string
          created_at?: string | null
          department?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          notes?: string | null
          permissions?: Json | null
          product_ids?: string[]
          role_id?: string | null
          role_name?: string | null
          updated_at?: string | null
          user_id: string
          user_type?: string
        }
        Update: {
          access_level?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          company_id?: string
          created_at?: string | null
          department?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          notes?: string | null
          permissions?: Json | null
          product_ids?: string[]
          role_id?: string | null
          role_name?: string | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_matrix_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_matrix_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_product_matrix_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "role_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_matrix_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_product_permissions: {
        Row: {
          created_at: string
          id: string
          override_company_permissions: boolean
          permissions: string[]
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          override_company_permissions?: boolean
          permissions: string[]
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          override_company_permissions?: boolean
          permissions?: string[]
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_product_permissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "user_product_permissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_product_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_expert: boolean | null
          is_invited: boolean | null
          is_reviewer: boolean | null
          last_name: string | null
          role: Database["public"]["Enums"]["Role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_expert?: boolean | null
          is_invited?: boolean | null
          is_reviewer?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["Role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_expert?: boolean | null
          is_invited?: boolean | null
          is_reviewer?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["Role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          access_level: Database["public"]["Enums"]["user_role_type"] | null
          affiliation_type: Database["public"]["Enums"]["affiliation_type"]
          company_id: string
          created_at: string
          created_by: string | null
          department: string | null
          external_role: Database["public"]["Enums"]["external_role"] | null
          functional_area: Database["public"]["Enums"]["functional_area"] | null
          hire_date: string | null
          id: string
          title: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["user_role_type"] | null
          affiliation_type: Database["public"]["Enums"]["affiliation_type"]
          company_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          external_role?: Database["public"]["Enums"]["external_role"] | null
          functional_area?:
            | Database["public"]["Enums"]["functional_area"]
            | null
          hire_date?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["user_role_type"] | null
          affiliation_type?: Database["public"]["Enums"]["affiliation_type"]
          company_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          external_role?: Database["public"]["Enums"]["external_role"] | null
          functional_area?:
            | Database["public"]["Enums"]["functional_area"]
            | null
          hire_date?: string | null
          id?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string | null
          price_id: string | null
          product_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          price_id?: string | null
          product_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      variant_document_links: {
        Row: {
          created_at: string
          id: string
          is_overridden: boolean
          master_document_id: string
          override_document_id: string | null
          updated_at: string
          variant_product_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_overridden?: boolean
          master_document_id: string
          override_document_id?: string | null
          updated_at?: string
          variant_product_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_overridden?: boolean
          master_document_id?: string
          override_document_id?: string | null
          updated_at?: string
          variant_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_document_links_master_document_id_fkey"
            columns: ["master_document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_document_links_master_document_id_fkey"
            columns: ["master_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_document_links_override_document_id_fkey"
            columns: ["override_document_id"]
            isOneToOne: false
            referencedRelation: "company_template_documents_by_phase"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_document_links_override_document_id_fkey"
            columns: ["override_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_document_links_variant_product_id_fkey"
            columns: ["variant_product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "variant_document_links_variant_product_id_fkey"
            columns: ["variant_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_validation_releases: {
        Row: {
          change_impact_matrix: Json | null
          core_services_affected: string[]
          created_at: string
          id: string
          module_groups_affected: string[]
          release_date: string
          release_notes: string | null
          updated_at: string
          validation_kit_url: string | null
          vendor_test_summary: Json | null
          version: string
        }
        Insert: {
          change_impact_matrix?: Json | null
          core_services_affected?: string[]
          created_at?: string
          id?: string
          module_groups_affected?: string[]
          release_date?: string
          release_notes?: string | null
          updated_at?: string
          validation_kit_url?: string | null
          vendor_test_summary?: Json | null
          version: string
        }
        Update: {
          change_impact_matrix?: Json | null
          core_services_affected?: string[]
          created_at?: string
          id?: string
          module_groups_affected?: string[]
          release_date?: string
          release_notes?: string | null
          updated_at?: string
          validation_kit_url?: string | null
          vendor_test_summary?: Json | null
          version?: string
        }
        Relationships: []
      }
      vv_plans: {
        Row: {
          acceptance_criteria: string | null
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          family_identifier: string | null
          id: string
          methodology: string | null
          name: string
          product_id: string
          roles_responsibilities: Json | null
          scope: string | null
          scope_type: string
          status: string
          updated_at: string
          version: string | null
        }
        Insert: {
          acceptance_criteria?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          family_identifier?: string | null
          id?: string
          methodology?: string | null
          name: string
          product_id: string
          roles_responsibilities?: Json | null
          scope?: string | null
          scope_type?: string
          status?: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          acceptance_criteria?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          family_identifier?: string | null
          id?: string
          methodology?: string | null
          name?: string
          product_id?: string
          roles_responsibilities?: Json | null
          scope?: string | null
          scope_type?: string
          status?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      vv_requirement_coverage: {
        Row: {
          company_id: string
          id: string
          last_validation_date: string | null
          last_verification_date: string | null
          requirement_id: string
          requirement_type: string
          updated_at: string
          validation_status: string | null
          validation_test_count: number | null
          verification_status: string | null
          verification_test_count: number | null
        }
        Insert: {
          company_id: string
          id?: string
          last_validation_date?: string | null
          last_verification_date?: string | null
          requirement_id: string
          requirement_type: string
          updated_at?: string
          validation_status?: string | null
          validation_test_count?: number | null
          verification_status?: string | null
          verification_test_count?: number | null
        }
        Update: {
          company_id?: string
          id?: string
          last_validation_date?: string | null
          last_verification_date?: string | null
          requirement_id?: string
          requirement_type?: string
          updated_at?: string
          validation_status?: string | null
          validation_test_count?: number | null
          verification_status?: string | null
          verification_test_count?: number | null
        }
        Relationships: []
      }
      whx_access_requests: {
        Row: {
          assigned_code: string | null
          company: string
          created_at: string | null
          email: string
          id: string
          name: string
          reason: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_code?: string | null
          company: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          reason: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_code?: string | null
          company?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          reason?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whx_event_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      xyreg_releases: {
        Row: {
          changelog: string | null
          created_at: string | null
          id: string
          impacted_module_groups: string[] | null
          published_at: string | null
          release_date: string
          status: string
          version: string
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          id?: string
          impacted_module_groups?: string[] | null
          published_at?: string | null
          release_date: string
          status?: string
          version: string
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          id?: string
          impacted_module_groups?: string[] | null
          published_at?: string | null
          release_date?: string
          status?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      company_dashboard_summary: {
        Row: {
          active_products: number | null
          category_count: number | null
          company_id: string | null
          company_name: string | null
          last_product_update: string | null
          model_count: number | null
          platform_count: number | null
          total_products: number | null
        }
        Relationships: []
      }
      company_template_documents_by_phase: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          document_scope: Database["public"]["Enums"]["document_scope"] | null
          document_type: string | null
          due_date: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string | null
          is_predefined_core_template: boolean | null
          name: string | null
          phase_id: string | null
          phase_name: string | null
          product_id: string | null
          reviewer_group_ids: string[] | null
          status: string | null
          tech_applicability: string | null
          template_source_id: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_template_source_id_fkey"
            columns: ["template_source_id"]
            isOneToOne: false
            referencedRelation: "phase_assigned_document_template"
            referencedColumns: ["id"]
          },
        ]
      }
      eudamed_medical_devices: {
        Row: {
          active: string | null
          address: string | null
          administering_medicine: string | null
          applicable_legislation: string | null
          basic_udi_di_code: string | null
          ca_address: string | null
          ca_country: string | null
          ca_email: string | null
          ca_name: string | null
          ca_phone: string | null
          ca_postcode: string | null
          contain_latex: string | null
          country: string | null
          device_model: string | null
          device_name: string | null
          direct_marking: string | null
          email: string | null
          id_srn: string | null
          implantable: string | null
          issuing_agency: string | null
          market_distribution: string | null
          max_reuses: number | null
          measuring: string | null
          nomenclature_codes: string | null
          organization: string | null
          organization_status: string | null
          phone: string | null
          placed_on_the_market: string | null
          postcode: string | null
          prrc_address: string | null
          prrc_country: string | null
          prrc_email: string | null
          prrc_first_name: string | null
          prrc_last_name: string | null
          prrc_phone: string | null
          prrc_postcode: string | null
          prrc_responsible_for: string | null
          quantity_of_device: number | null
          reference_number: string | null
          reprocessed: string | null
          reusable: string | null
          risk_class: string | null
          single_use: string | null
          status: string | null
          sterile: string | null
          sterilization_need: string | null
          trade_names: string | null
          udi_di: string | null
          website: string | null
        }
        Insert: {
          active?: string | null
          address?: string | null
          administering_medicine?: string | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          ca_address?: string | null
          ca_country?: string | null
          ca_email?: string | null
          ca_name?: string | null
          ca_phone?: string | null
          ca_postcode?: string | null
          contain_latex?: string | null
          country?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: string | null
          email?: string | null
          id_srn?: string | null
          implantable?: string | null
          issuing_agency?: string | null
          market_distribution?: string | null
          max_reuses?: number | null
          measuring?: string | null
          nomenclature_codes?: string | null
          organization?: string | null
          organization_status?: string | null
          phone?: string | null
          placed_on_the_market?: string | null
          postcode?: string | null
          prrc_address?: string | null
          prrc_country?: string | null
          prrc_email?: string | null
          prrc_first_name?: string | null
          prrc_last_name?: string | null
          prrc_phone?: string | null
          prrc_postcode?: string | null
          prrc_responsible_for?: string | null
          quantity_of_device?: number | null
          reference_number?: string | null
          reprocessed?: string | null
          reusable?: string | null
          risk_class?: string | null
          single_use?: string | null
          status?: string | null
          sterile?: string | null
          sterilization_need?: string | null
          trade_names?: string | null
          udi_di?: string | null
          website?: string | null
        }
        Update: {
          active?: string | null
          address?: string | null
          administering_medicine?: string | null
          applicable_legislation?: string | null
          basic_udi_di_code?: string | null
          ca_address?: string | null
          ca_country?: string | null
          ca_email?: string | null
          ca_name?: string | null
          ca_phone?: string | null
          ca_postcode?: string | null
          contain_latex?: string | null
          country?: string | null
          device_model?: string | null
          device_name?: string | null
          direct_marking?: string | null
          email?: string | null
          id_srn?: string | null
          implantable?: string | null
          issuing_agency?: string | null
          market_distribution?: string | null
          max_reuses?: number | null
          measuring?: string | null
          nomenclature_codes?: string | null
          organization?: string | null
          organization_status?: string | null
          phone?: string | null
          placed_on_the_market?: string | null
          postcode?: string | null
          prrc_address?: string | null
          prrc_country?: string | null
          prrc_email?: string | null
          prrc_first_name?: string | null
          prrc_last_name?: string | null
          prrc_phone?: string | null
          prrc_postcode?: string | null
          prrc_responsible_for?: string | null
          quantity_of_device?: number | null
          reference_number?: string | null
          reprocessed?: string | null
          reusable?: string | null
          risk_class?: string | null
          single_use?: string | null
          status?: string | null
          sterile?: string | null
          sterilization_need?: string | null
          trade_names?: string | null
          udi_di?: string | null
          website?: string | null
        }
        Relationships: []
      }
      new_pricing_company_plan_details: {
        Row: {
          ai_booster_packs: number | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          expires_at: string | null
          extra_devices: number | null
          extra_module_slots: number | null
          features: Json | null
          id: string | null
          is_free: boolean | null
          menu_access: Json | null
          monthly_price: number | null
          monthly_total: number | null
          plan_display_name: string | null
          plan_id: string | null
          plan_name: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_pricing_company_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "new_pricing_company_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "new_pricing_company_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "new_pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_revenue_analytics: {
        Row: {
          avg_revenue_per_period: number | null
          category_total_revenue: number | null
          company_id: string | null
          company_total_revenue: number | null
          currency_code: string | null
          device_category: string | null
          latest_period: string | null
          market_code: string | null
          model_reference: string | null
          model_total_revenue: number | null
          platform_total_revenue: number | null
          product_id: string | null
          product_name: string | null
          product_platform: string | null
          revenue_percentage_of_company: number | null
          revenue_periods: number | null
          total_revenue: number | null
          total_units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      user_roles_view: {
        Row: {
          access_level: Database["public"]["Enums"]["user_role_type"] | null
          affiliation_type:
            | Database["public"]["Enums"]["affiliation_type"]
            | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          department: string | null
          email: string | null
          external_role: Database["public"]["Enums"]["external_role"] | null
          first_name: string | null
          functional_area: Database["public"]["Enums"]["functional_area"] | null
          hire_date: string | null
          id: string | null
          last_name: string | null
          role_display_name: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_dashboard_summary"
            referencedColumns: ["company_id"]
          },
        ]
      }
      variant_revenue_summary: {
        Row: {
          avg_revenue: number | null
          currency_code: string | null
          entry_count: number | null
          first_period: string | null
          last_period: string | null
          market_code: string | null
          product_id: string | null
          total_revenue: number | null
          total_units: number | null
          variant_id: string | null
          variant_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_revenues_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "portfolio_revenue_analytics"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_revenues_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_revenues_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _get_document_and_company_from_workflow: {
        Args: { p_workflow_id: string }
        Returns: {
          out_company_id: string
          out_document_id: string
        }[]
      }
      accept_invitation: { Args: { invitation_token: string }; Returns: Json }
      assign_new_pricing_plan: {
        Args: {
          p_changed_by?: string
          p_company_id: string
          p_plan_name: string
        }
        Returns: string
      }
      batch_update_product_status: {
        Args: {
          p_company_id: string
          p_new_status: string
          p_product_ids: string[]
        }
        Returns: number
      }
      calculate_phase_dates: {
        Args: { p_company_id: string }
        Returns: {
          calculated_end_date: string
          calculated_start_date: string
          phase_id: string
        }[]
      }
      calculate_risk_level: {
        Args: { probability: number; severity: number }
        Returns: string
      }
      can_manage_user_profiles: { Args: never; Returns: boolean }
      check_phase_system_health: {
        Args: never
        Returns: {
          details: string
          metric_name: string
          metric_value: number
          status: string
        }[]
      }
      cleanup_duplicate_company_phases: {
        Args: { target_company_id: string }
        Returns: {
          action_taken: string
          duplicates_removed: number
          phase_name: string
          success: boolean
        }[]
      }
      cleanup_duplicate_phases: {
        Args: { target_company_id: string }
        Returns: {
          action_taken: string
          documents_moved: number
          new_phase_name: string
          old_phase_name: string
        }[]
      }
      cleanup_duplicate_phases_for_company: {
        Args: { target_company_id: string }
        Returns: {
          action_taken: string
          duplicates_removed: number
          phase_name: string
        }[]
      }
      cleanup_orphaned_media_files: { Args: never; Returns: undefined }
      cleanup_product_data: {
        Args: { target_product_id: string }
        Returns: {
          action_taken: string
          count: number
          details: string
          step: string
        }[]
      }
      cleanup_product_documents_and_phases: {
        Args: { target_product_id: string }
        Returns: {
          action_taken: string
          count: number
          details: string
          step: string
        }[]
      }
      compare_versions: {
        Args: { version1: string; version2: string }
        Returns: number
      }
      comprehensive_phase_repair: {
        Args: { company_id_param: string }
        Returns: {
          action_taken: string
          details: string
          product_name: string
          step: string
          success: boolean
        }[]
      }
      consolidate_company_gap_analysis: {
        Args: never
        Returns: {
          action_taken: string
          company_name: string
          items_consolidated: number
          items_removed: number
          template_name: string
        }[]
      }
      correct_remaining_nox_medical_names: {
        Args: never
        Returns: {
          action_taken: string
          new_name: string
          old_name: string
          product_id: string
        }[]
      }
      count_eudamed_company_devices: {
        Args: { company_identifier: string }
        Returns: number
      }
      count_eudamed_devices_by_srn: { Args: { p_srn: string }; Returns: number }
      create_checkout_session: {
        Args: {
          cancel_url: string
          company_id?: string
          plan_id: string
          plan_name: string
          price: string
          success_url: string
          user_id: string
        }
        Returns: Json
      }
      create_highlights_table_if_not_exists: { Args: never; Returns: undefined }
      create_line_extension_product: {
        Args: {
          p_company_id: string
          p_description: string
          p_extension_name: string
          p_parent_product_id: string
          p_project_category: string
          p_project_name?: string
          p_project_types: Json
        }
        Returns: Json
      }
      create_media_record: {
        Args: {
          p_file_name: string
          p_file_path: string
          p_file_size: number
          p_media_type: string
          p_metadata: Json
          p_mime_type: string
          p_product_id: string
          p_public_url: string
        }
        Returns: string
      }
      create_new_comment_thread: {
        Args: {
          p_comment_content: string
          p_document_id: string
          p_is_internal?: boolean
          p_position_coords?: Json
        }
        Returns: Json
      }
      create_phase_document_with_sync: {
        Args: {
          p_classes_by_market?: Json
          p_document_scope?: string
          p_document_type?: string
          p_markets?: Json
          p_name: string
          p_phase_id: string
          p_status?: string
          p_tech_applicability?: string
        }
        Returns: Json
      }
      create_product_document_instances: {
        Args: { target_phase_id: string; target_product_id: string }
        Returns: number
      }
      create_product_version: {
        Args: {
          p_base_product_id: string
          p_project_category?: string
          p_project_description?: string
          p_project_name?: string
          p_project_types?: string[]
        }
        Returns: Json
      }
      create_project_for_existing_product: {
        Args: {
          p_company_id: string
          p_description?: string
          p_project_category: string
          p_project_name: string
          p_project_types: string
          p_selected_product_id: string
        }
        Returns: string
      }
      debug_auth_state: {
        Args: never
        Returns: {
          current_user_id: string
          session_info: string
        }[]
      }
      delete_leaf_emdn_codes: {
        Args: never
        Returns: {
          deleted_id: string
        }[]
      }
      ensure_detailed_design_category: {
        Args: { company_id_param: string }
        Returns: string
      }
      ensure_phase_integrity: {
        Args: { target_company_id?: string }
        Returns: {
          action_taken: string
          company_name: string
          details: string
          product_name: string
          success: boolean
        }[]
      }
      ensure_standard_phases_for_company: {
        Args: { target_category_id: string; target_company_id: string }
        Returns: undefined
      }
      fetch_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
        }[]
      }
      fetch_all_users_with_companies: {
        Args: never
        Returns: {
          companies: Json
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
        }[]
      }
      fetch_whx_genesis_users: {
        Args: never
        Returns: {
          company_name: string
          created_at: string
          email: string
          email_confirmed: boolean
          first_name: string
          id: string
          last_name: string
          phone: string
          plan_tier: string
          role: string
        }[]
      }
      fix_lifecycle_phases_consistency: {
        Args: never
        Returns: {
          fixed_issue: string
          phase_name: string
          product_id: string
          product_name: string
        }[]
      }
      generate_rbr_document_id: {
        Args: { p_company_id: string; prefix: string }
        Returns: string
      }
      generate_requirement_id: {
        Args: {
          p_category_suffix?: string
          p_lineage_base?: string
          p_product_id: string
          p_requirement_type?: Database["public"]["Enums"]["requirement_type"]
        }
        Returns: string
      }
      generate_unique_product_name: {
        Args: {
          base_name: string
          exclude_product_id?: string
          target_company_id: string
        }
        Returns: string
      }
      get_all_eudamed_emdn_codes: {
        Args: never
        Returns: {
          code: string
          description: string
          LEVEL: number
          parent_code: string
          temp: string
        }[]
      }
      get_bundle_company_name: {
        Args: { p_bundle_id: string }
        Returns: string
      }
      get_company_dashboard_summary: {
        Args: { p_company_id: string }
        Returns: {
          active_products: number
          category_count: number
          company_id: string
          company_name: string
          last_product_update: string
          model_count: number
          platform_count: number
          total_products: number
        }[]
      }
      get_company_gap_analysis_items: {
        Args: { target_company_id: string }
        Returns: {
          action_needed: string
          assigned_to: string
          category: string
          clause_id: string
          clause_summary: string
          evidence_links: Json
          framework: string
          id: string
          inserted_at: string
          last_updated_by: string
          milestone_due_date: string
          priority: string
          requirement: string
          section: string
          status: string
          updated_at: string
        }[]
      }
      get_company_phase_health_stats: {
        Args: { target_company_id: string }
        Returns: {
          health_percentage: number
          needs_repair: number
          properly_mapped: number
          total_products: number
        }[]
      }
      get_company_products_chunked: {
        Args: { p_company_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          created_at: string
          device_category: string
          id: string
          markets: Json
          model_reference: string
          name: string
          product_platform: string
          status: string
          total_count: number
          updated_at: string
        }[]
      }
      get_company_products_for_selection: {
        Args: { target_company_id: string }
        Returns: {
          created_at: string
          description: string
          id: string
          name: string
          status: string
        }[]
      }
      get_competitive_analysis: {
        Args: { result_limit?: number; target_emdn_codes: string[] }
        Returns: {
          basic_udi_di_code: string
          device_id: string
          device_name: string
          match_score: number
          nomenclature_codes: string[]
          organization: string
          organization_country: string
          organization_status: string
          risk_class: string
        }[]
      }
      get_current_plan: {
        Args: { company_id?: string; user_id: string }
        Returns: string
      }
      get_document_audit_stats: {
        Args: { document_uuid: string }
        Returns: {
          recent_activity_count: number
          total_annotations: number
          total_comments: number
          total_duration: number
          total_reviews: number
          total_views: number
          unique_users: number
        }[]
      }
      get_documents_by_scope: {
        Args: {
          p_company_id?: string
          p_phase_id?: string
          p_product_id?: string
          p_scope: Database["public"]["Enums"]["document_scope"]
        }
        Returns: {
          created_at: string
          document_type: string
          id: string
          name: string
          phase_id: string
          phase_name: string
          status: string
          tech_applicability: string
          updated_at: string
        }[]
      }
      get_emdn_codes: {
        Args: never
        Returns: {
          description: string
          emdn_code: string
          full_path: string
          id: string
          level: number
          parent_id: string
          regulatory_notes: string
          risk_class: string
        }[]
      }
      get_eudamed_devices_by_company: {
        Args: {
          company_identifier: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          active: boolean
          address: string
          administering_medicine: boolean
          applicable_legislation: string
          basic_udi_di_code: string
          ca_address: string
          ca_country: string
          ca_email: string
          ca_name: string
          ca_phone: string
          ca_postcode: string
          contain_latex: boolean
          country: string
          device_model: string
          device_name: string
          direct_marking: boolean
          email: string
          id_srn: string
          implantable: boolean
          issuing_agency: string
          market_distribution: string
          max_reuses: number
          measuring: boolean
          nomenclature_codes: Json
          organization: string
          organization_status: string
          phone: string
          placed_on_the_market: string
          postcode: string
          prrc_address: string
          prrc_country: string
          prrc_email: string
          prrc_first_name: string
          prrc_last_name: string
          prrc_phone: string
          prrc_postcode: string
          prrc_responsible_for: string
          quantity_of_device: string
          reference_number: string
          reprocessed: boolean
          reusable: boolean
          risk_class: string
          single_use: boolean
          status: string
          sterile: boolean
          sterilization_need: boolean
          trade_names: string
          udi_di: string
          website: string
        }[]
      }
      get_eudamed_devices_by_emdn: {
        Args: { emdn_code: string; limit_count?: number }
        Returns: {
          basic_udi_di_code: string
          country: string
          device_model: string
          device_name: string
          id_srn: string
          nomenclature_codes: Json
          organization: string
          risk_class: string
          trade_names: string
          udi_di: string
        }[]
      }
      get_eudamed_devices_by_emdn_with_markets: {
        Args: { emdn_code: string; limit_count?: number }
        Returns: {
          basic_udi_di_code: string
          country: string
          device_model: string
          device_name: string
          id_srn: string
          market_distribution: string
          nomenclature_codes: Json
          organization: string
          risk_class: string
          trade_names: string
          udi_di: string
        }[]
      }
      get_eudamed_emdn_codes: {
        Args: never
        Returns: {
          code: string
          description: string
          LEVEL: number
          parent_code: string
          temp: string
        }[]
      }
      get_eudamed_emdn_codes_by_prefix: {
        Args: { prefix_letter: string }
        Returns: {
          code: string
          description: string
          LEVEL: number
          parent_code: string
          temp: string
        }[]
      }
      get_eudamed_widex_devices: {
        Args: { limit_count?: number; offset_count?: number }
        Returns: {
          basic_udi_di_code: string
          country: string
          device_model: string
          device_name: string
          id_srn: string
          nomenclature_codes: Json
          organization: string
          risk_class: string
          trade_names: string
          udi_di: string
        }[]
      }
      get_exchange_rate: {
        Args: { p_base_currency: string; p_target_currency: string }
        Returns: number
      }
      get_market_summary: { Args: { emdn_code_pattern: string }; Returns: Json }
      get_media_file_path: { Args: { p_file_id: string }; Returns: string }
      get_new_pricing_menu_access: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_next_version_number: {
        Args: { document_uuid: string }
        Returns: number
      }
      get_portfolio_revenue_sunburst: {
        Args: {
          p_company_id: string
          p_currency_code?: string
          p_period_end?: string
          p_period_start?: string
        }
        Returns: Json
      }
      get_product_audit_stats: {
        Args: { company_uuid: string; product_uuid: string }
        Returns: {
          average_session_duration: number
          recent_activity: number
          total_actions: Json
          total_entities: Json
          total_entries: number
          total_users: number
        }[]
      }
      get_product_full_name: { Args: { product_id: string }; Returns: string }
      get_product_media_files: {
        Args: { p_product_id: string }
        Returns: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          media_type: string
          metadata: Json
          mime_type: string
          public_url: string
        }[]
      }
      get_product_version_hierarchy: {
        Args: { root_product_id: string }
        Returns: {
          created_at: string
          level: number
          parent_id: string
          product_id: string
          product_name: string
          version: string
        }[]
      }
      get_user_role_in_company: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: {
          access_level: Database["public"]["Enums"]["user_role_type"]
          affiliation_type: Database["public"]["Enums"]["affiliation_type"]
          external_role: Database["public"]["Enums"]["external_role"]
          functional_area: Database["public"]["Enums"]["functional_area"]
          role_display_name: string
        }[]
      }
      handle_stripe_webhook: {
        Args: { event_data: Json; event_type: string }
        Returns: Json
      }
      has_circular_dependency: {
        Args: {
          p_company_id: string
          p_source_phase_id: string
          p_target_phase_id: string
        }
        Returns: boolean
      }
      has_phase_dependencies: {
        Args: { input_phase_id: string }
        Returns: boolean
      }
      increment_code_usage: { Args: { code_value: string }; Returns: boolean }
      increment_thread_unread: {
        Args: { _sender_user_id: string; _thread_id: string }
        Returns: undefined
      }
      increment_unread_count: {
        Args: { p_exclude_user_id: string; p_thread_id: string }
        Returns: undefined
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_company_admin: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      is_thread_participant: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      match_document_chunks: {
        Args: {
          match_company_id: string
          match_count?: number
          match_document_ids?: string[]
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      migrate_existing_phase_documents_to_templates: {
        Args: never
        Returns: {
          company_name: string
          documents_migrated: number
          success: boolean
        }[]
      }
      price_compute_effective_for_product: {
        Args: {
          p_company_id: string
          p_market_code?: string
          p_product_id: string
        }
        Returns: undefined
      }
      price_recompute_company: {
        Args: { p_company_id: string; p_market_code?: string }
        Returns: number
      }
      recalculate_continuous_process_dates: {
        Args: { target_product_id: string }
        Returns: {
          new_end_date: string
          new_start_date: string
          old_end_date: string
          old_start_date: string
          phase_name: string
        }[]
      }
      rename_phases_with_numbers: {
        Args: { target_company_id: string }
        Returns: {
          new_name: string
          old_name: string
          phase_id: string
          position_number: number
          success: boolean
        }[]
      }
      renumber_company_phases: {
        Args: { target_company_id: string }
        Returns: {
          new_name: string
          old_name: string
          phase_id: string
          phase_position: number
        }[]
      }
      reorder_company_phases: {
        Args: { phase_ids: string[]; target_company_id: string }
        Returns: boolean
      }
      repair_all_product_phase_consistency: {
        Args: never
        Returns: {
          action_taken: string
          company_name: string
          new_phase: string
          old_phase: string
          product_name: string
          success: boolean
        }[]
      }
      repair_phase_assignments: {
        Args: { company_id_param: string }
        Returns: {
          action_taken: string
          new_phase: string
          old_phase: string
          product_name: string
        }[]
      }
      repair_specific_product_phases: {
        Args: { target_product_id: string }
        Returns: {
          action_taken: string
          new_value: string
          old_value: string
          step: string
          success: boolean
        }[]
      }
      safe_delete_phase: { Args: { phase_id: string }; Returns: Json }
      safe_reorder_company_phases: {
        Args: { phase_ids: string[]; target_company_id: string }
        Returns: boolean
      }
      safely_delete_document_template: {
        Args: { template_id_param: string }
        Returns: boolean
      }
      search_documents_hybrid: {
        Args: {
          match_company_id: string
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          combined_score: number
          id: string
          keyword_score: number
          page_number: number
          report_date: string
          report_id: string
          report_source: string
          report_title: string
          section_title: string
          similarity: number
          word_count: number
        }[]
      }
      set_user_company_internal_status: {
        Args: {
          p_company_id: string
          p_is_internal: boolean
          p_user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_media_file: {
        Args: { p_file_id: string }
        Returns: undefined
      }
      standardize_company_phases: {
        Args: { target_company_id: string }
        Returns: {
          action_taken: string
          phase_name: string
          phase_position: number
          success: boolean
        }[]
      }
      standardize_phase_documents_across_companies: {
        Args: never
        Returns: {
          action_taken: string
          company_name: string
          documents_added: number
          documents_removed: number
          phase_name: string
          success: boolean
        }[]
      }
      sync_document_matrix: { Args: never; Returns: boolean }
      sync_document_matrix_from_static: {
        Args: never
        Returns: {
          action_taken: string
          document_name: string
          markets_count: number
          phase_name: string
          success: boolean
          tech_applicability: string
        }[]
      }
      sync_document_to_company_templates: {
        Args: {
          p_classes_by_market?: Json
          p_document_name: string
          p_document_type?: string
          p_markets?: Json
          p_phase_id: string
          p_tech_applicability?: string
        }
        Returns: string
      }
      sync_product_phases_safe: {
        Args: { target_company_id: string; target_product_id: string }
        Returns: number
      }
      toggle_document_phase_exclusion: {
        Args: {
          company_id_param: string
          document_name_param: string
          exclude_param?: boolean
          phase_name_param: string
        }
        Returns: boolean
      }
      transfer_phase_documents: {
        Args: { source_phase_id: string; target_phase_id: string }
        Returns: number
      }
      truncate_long_text: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      update_phase_numbering_on_reorder: {
        Args: { phase_ids: string[]; target_company_id: string }
        Returns: boolean
      }
      update_plan: {
        Args: { company_id?: string; plan_name: string; user_id: string }
        Returns: boolean
      }
      update_product_contraindications: {
        Args: { p_contraindications: string[]; p_product_id: string }
        Returns: undefined
      }
      update_product_fda_code: {
        Args: { new_fda_code: string; product_id_param: string }
        Returns: boolean
      }
      update_product_indications: {
        Args: { p_indications: string[]; p_product_id: string }
        Returns: undefined
      }
      update_traceability_links: {
        Args: {
          p_child_id: string
          p_parent_id: string
          p_parent_table?: string
        }
        Returns: undefined
      }
      user_can_access_lifecycle_phase: {
        Args: { phase_product_id: string }
        Returns: boolean
      }
      user_has_company_access_ref: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      validate_all_company_phases: {
        Args: never
        Returns: {
          company_name: string
          invalid_count: number
          issues: Json
          product_count: number
        }[]
      }
      validate_all_product_phases: {
        Args: { company_id_param?: string }
        Returns: {
          company_name: string
          current_phase: string
          has_current_flag: boolean
          is_valid_company_phase: boolean
          issue_summary: string
          lifecycle_phase_count: number
          phase_name_match: boolean
          product_name: string
        }[]
      }
      validate_and_repair_company_phase_integrity: {
        Args: { target_company_id: string }
        Returns: {
          action_taken: string
          new_value: string
          old_value: string
          product_name: string
          success: boolean
        }[]
      }
      validate_document_matrix_migration: {
        Args: never
        Returns: {
          company_name: string
          documents_with_classes: number
          documents_with_markets: number
          migration_status: string
          total_documents: number
          unique_tech_applicabilities: string[]
        }[]
      }
      validate_phase_addition: {
        Args: { p_company_id: string; p_phase_id: string }
        Returns: Json
      }
      validate_phase_document_consistency: {
        Args: never
        Returns: {
          avg_docs: number
          companies_with_issues: string[]
          company_count: number
          is_consistent: boolean
          max_docs: number
          min_docs: number
          phase_name: string
        }[]
      }
      validate_phase_template_consistency: {
        Args: never
        Returns: {
          company_name: string
          missing_phases: string[]
          phase_count: number
          status: string
        }[]
      }
      verify_payment: { Args: { session_id: string }; Returns: Json }
    }
    Enums: {
      access_level: "viewer" | "editor" | "admin" | "consultant" | "author"
      action_item_status: "pending" | "in_progress" | "completed" | "overdue"
      activity_type:
        | "document_updated"
        | "milestone_completed"
        | "approval_requested"
        | "task_assigned"
        | "review_completed"
        | "system_alert"
      affiliation_type: "internal" | "external"
      audit_finding_severity: "Minor" | "Major" | "Critical"
      audit_finding_status:
        | "Open"
        | "Addressed"
        | "CAPA Raised"
        | "Pending Action"
        | "Closed"
      audit_recommendation_priority: "Low" | "Medium" | "High"
      batch_disposition:
        | "pending"
        | "released"
        | "rejected"
        | "on_hold"
        | "quarantined"
      bom_certificate_required: "coa" | "coc" | "both" | "none"
      bom_item_category:
        | "purchased_part"
        | "manufactured_part"
        | "raw_material"
        | "sub_assembly"
        | "consumable"
      bom_patient_contact: "direct" | "indirect" | "none"
      bom_revision_status: "draft" | "active" | "obsolete"
      checkpoint_result: "pass" | "fail" | "conditional" | "na" | "pending"
      clinical_endpoint_type: "primary" | "secondary"
      clinical_notification_trigger:
        | "ethics_approval"
        | "enrollment_milestone"
        | "behind_schedule"
        | "safety_report_due"
        | "regulatory_deadline"
      clinical_study_type:
        | "feasibility"
        | "pivotal"
        | "pmcf"
        | "registry"
        | "other"
      deadline_status: "upcoming" | "completed" | "missed" | "cancelled"
      disclosure_status:
        | "submitted"
        | "under_review"
        | "approved_for_filing"
        | "rejected"
        | "converted_to_asset"
      document_scope:
        | "company_template"
        | "company_document"
        | "product_document"
      external_role:
        | "consultant"
        | "auditor"
        | "contract_manufacturer"
        | "distributor"
        | "key_opinion_leader"
        | "other_external"
      functional_area:
        | "research_development"
        | "quality_assurance"
        | "regulatory_affairs"
        | "clinical_affairs"
        | "manufacturing_operations"
        | "marketing_labeling"
        | "management_executive"
        | "other_internal"
        | "design_development"
      inspection_disposition:
        | "pending"
        | "accepted"
        | "rejected"
        | "conditional_accept"
      inspection_status: "draft" | "in_progress" | "disposition" | "closed"
      ip_asset_status:
        | "idea"
        | "disclosure"
        | "filing_prep"
        | "pending"
        | "granted"
        | "abandoned"
        | "expired"
      ip_asset_type:
        | "patent"
        | "trademark"
        | "copyright"
        | "trade_secret"
        | "design_right"
      launch_status: "pre_launch" | "launched" | "discontinued"
      message_type: "executive" | "team" | "system" | "announcement"
      mission_status: "on_track" | "needs_attention" | "at_risk"
      mitigation_type:
        | "Design Control"
        | "Protective Measure"
        | "Information for Safety"
      notification_type:
        | "group_create"
        | "group_updated"
        | "group_delete"
        | "group_member_added"
        | "group_member_removed"
        | "document_assigned"
        | "communication"
      parent_relationship_type: "line_extension" | "variant"
      price_modifier_type: "PERCENT" | "FIXED"
      price_rule_type: "BASE" | "RELATIVE" | "ABSOLUTE"
      priority_level: "low" | "medium" | "high" | "critical"
      production_order_status:
        | "draft"
        | "ready"
        | "in_progress"
        | "pending_review"
        | "released"
        | "rejected"
        | "on_hold"
        | "cancelled"
      requirement_type: "system" | "software" | "hardware"
      risk_level: "Low" | "Medium" | "High"
      Role: "admin" | "manager" | "user"
      sampling_plan_type: "100_percent" | "aql_based" | "skip_lot"
      user_role_type:
        | "admin"
        | "editor"
        | "viewer"
        | "consultant"
        | "business"
        | "author"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level: ["viewer", "editor", "admin", "consultant", "author"],
      action_item_status: ["pending", "in_progress", "completed", "overdue"],
      activity_type: [
        "document_updated",
        "milestone_completed",
        "approval_requested",
        "task_assigned",
        "review_completed",
        "system_alert",
      ],
      affiliation_type: ["internal", "external"],
      audit_finding_severity: ["Minor", "Major", "Critical"],
      audit_finding_status: [
        "Open",
        "Addressed",
        "CAPA Raised",
        "Pending Action",
        "Closed",
      ],
      audit_recommendation_priority: ["Low", "Medium", "High"],
      batch_disposition: [
        "pending",
        "released",
        "rejected",
        "on_hold",
        "quarantined",
      ],
      bom_certificate_required: ["coa", "coc", "both", "none"],
      bom_item_category: [
        "purchased_part",
        "manufactured_part",
        "raw_material",
        "sub_assembly",
        "consumable",
      ],
      bom_patient_contact: ["direct", "indirect", "none"],
      bom_revision_status: ["draft", "active", "obsolete"],
      checkpoint_result: ["pass", "fail", "conditional", "na", "pending"],
      clinical_endpoint_type: ["primary", "secondary"],
      clinical_notification_trigger: [
        "ethics_approval",
        "enrollment_milestone",
        "behind_schedule",
        "safety_report_due",
        "regulatory_deadline",
      ],
      clinical_study_type: [
        "feasibility",
        "pivotal",
        "pmcf",
        "registry",
        "other",
      ],
      deadline_status: ["upcoming", "completed", "missed", "cancelled"],
      disclosure_status: [
        "submitted",
        "under_review",
        "approved_for_filing",
        "rejected",
        "converted_to_asset",
      ],
      document_scope: [
        "company_template",
        "company_document",
        "product_document",
      ],
      external_role: [
        "consultant",
        "auditor",
        "contract_manufacturer",
        "distributor",
        "key_opinion_leader",
        "other_external",
      ],
      functional_area: [
        "research_development",
        "quality_assurance",
        "regulatory_affairs",
        "clinical_affairs",
        "manufacturing_operations",
        "marketing_labeling",
        "management_executive",
        "other_internal",
        "design_development",
      ],
      inspection_disposition: [
        "pending",
        "accepted",
        "rejected",
        "conditional_accept",
      ],
      inspection_status: ["draft", "in_progress", "disposition", "closed"],
      ip_asset_status: [
        "idea",
        "disclosure",
        "filing_prep",
        "pending",
        "granted",
        "abandoned",
        "expired",
      ],
      ip_asset_type: [
        "patent",
        "trademark",
        "copyright",
        "trade_secret",
        "design_right",
      ],
      launch_status: ["pre_launch", "launched", "discontinued"],
      message_type: ["executive", "team", "system", "announcement"],
      mission_status: ["on_track", "needs_attention", "at_risk"],
      mitigation_type: [
        "Design Control",
        "Protective Measure",
        "Information for Safety",
      ],
      notification_type: [
        "group_create",
        "group_updated",
        "group_delete",
        "group_member_added",
        "group_member_removed",
        "document_assigned",
        "communication",
      ],
      parent_relationship_type: ["line_extension", "variant"],
      price_modifier_type: ["PERCENT", "FIXED"],
      price_rule_type: ["BASE", "RELATIVE", "ABSOLUTE"],
      priority_level: ["low", "medium", "high", "critical"],
      production_order_status: [
        "draft",
        "ready",
        "in_progress",
        "pending_review",
        "released",
        "rejected",
        "on_hold",
        "cancelled",
      ],
      requirement_type: ["system", "software", "hardware"],
      risk_level: ["Low", "Medium", "High"],
      Role: ["admin", "manager", "user"],
      sampling_plan_type: ["100_percent", "aql_based", "skip_lot"],
      user_role_type: [
        "admin",
        "editor",
        "viewer",
        "consultant",
        "business",
        "author",
      ],
    },
  },
} as const
