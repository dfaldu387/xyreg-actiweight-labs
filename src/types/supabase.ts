// Add these types to your existing supabase types or create a new file

export interface Database {
  public: {
    Tables: {
      // ... existing tables
    }
    Views: {
      // ... existing views
    }
    Functions: {
      // ... existing functions
      create_checkout_session: {
        Args: {
          plan_id: string
          plan_name: string
          price: string
          company_id?: string | null
          user_id: string
          success_url: string
          cancel_url: string
        }
        Returns: {
          sessionId: string
        }
      }
      verify_payment: {
        Args: {
          session_id: string
        }
        Returns: {
          success: boolean
          planName: string
          companyId: string | null
        }
      }
      get_current_plan: {
        Args: {
          user_id: string
          company_id?: string | null
        }
        Returns: string
      }
      update_plan: {
        Args: {
          plan_name: string
          user_id: string
          company_id?: string | null
        }
        Returns: boolean
      }
      handle_stripe_webhook: {
        Args: {
          event_type: string
          event_data: any
        }
        Returns: {
          status: string
        }
      }
    }
    Enums: {
      // ... existing enums
    }
  }
} 