
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

// Export a simple hook for compatibility with existing code
export const useToast = () => {
  return {
    toast: sonnerToast
  };
};

// Helper function for showing DevMode notifications
export const showDevModeNotification = (
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    switch (type) {
      case 'success': 
        sonnerToast.success(`DevMode: ${message}`);
        break;
      case 'warning':
        sonnerToast.warning(`DevMode: ${message}`);
        break;
      case 'error':
        sonnerToast.error(`DevMode: ${message}`);
        break;
      default:
        sonnerToast.info(`DevMode: ${message}`);
    }
  }
};
