/**
 * MUI Material and Supabase type augmentations.
 * Uses `export {}` to enable proper interface augmentation.
 */
export {};

// ─── MUI Material augmentations ─────────────────────────────────────────────
declare module '@mui/material' {
  interface AlertProps {
    children?: React.ReactNode;
  }
  interface Theme {
    spacing: (...args: number[]) => string;
  }
  interface CheckboxProps {
    edge?: 'start' | 'end' | false;
    disableRipple?: boolean;
  }
  interface AutocompleteProps<T, Multiple, DisableClearable, FreeSolo, ChipComponent> {
    onBlur?: React.FocusEventHandler;
  }
}

// ─── Supabase Auth augmentation ─────────────────────────────────────────────
// Augment @supabase/auth-js (used by @supabase/supabase-js v2)
declare module '@supabase/auth-js' {
  interface GoTrueClient {
    getUser(jwt?: string): Promise<any>;
    signUp(credentials: any): Promise<any>;
    signInWithPassword(credentials: any): Promise<any>;
    signInWithOAuth(credentials: any): Promise<any>;
    signOut(options?: any): Promise<any>;
    resetPasswordForEmail(email: string, options?: any): Promise<any>;
    updateUser(attributes: any): Promise<any>;
    getSession(): Promise<any>;
    onAuthStateChange(callback: any): any;
    refreshSession(currentSession?: any): Promise<any>;
  }
}

// Also augment gotrue-js for older references
declare module '@supabase/gotrue-js' {
  interface GoTrueClient {
    getUser(jwt?: string): Promise<any>;
    signUp(credentials: any): Promise<any>;
    signInWithPassword(credentials: any): Promise<any>;
    signInWithOAuth(credentials: any): Promise<any>;
    signOut(options?: any): Promise<any>;
    resetPasswordForEmail(email: string, options?: any): Promise<any>;
    updateUser(attributes: any): Promise<any>;
    getSession(): Promise<any>;
    onAuthStateChange(callback: any): any;
    refreshSession(currentSession?: any): Promise<any>;
  }
}
