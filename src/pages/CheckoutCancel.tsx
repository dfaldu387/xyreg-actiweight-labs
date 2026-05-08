import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutCancel() {
  const navigate = useNavigate();

  // Clean up pending registration data and delete the unpaid auth user since payment was cancelled
  useEffect(() => {
    const cleanup = async () => {
      console.log('[CheckoutCancel] Cleanup started');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[CheckoutCancel] Session present?', !!session?.access_token, 'userId:', session?.user?.id);

        if (!session?.access_token) {
          console.warn('[CheckoutCancel] No session — skipping delete-unpaid-user');
        } else {
          // Server-side delete: removes user, orphaned company, and access rows
          // (skipped automatically if the user already has an active subscription).
          const { data, error } = await supabase.functions.invoke('delete-unpaid-user');
          console.log('[CheckoutCancel] delete-unpaid-user result:', { data, error });
        }
      } catch (err) {
        console.warn('[CheckoutCancel] Failed to delete unpaid user:', err);
      } finally {
        try { await supabase.auth.signOut(); } catch {}
        sessionStorage.removeItem('pending-registration');
        sessionStorage.removeItem('selected-plan');
        sessionStorage.removeItem('company-creation-complete');
        sessionStorage.removeItem('checkout-company');
        sessionStorage.removeItem('checkout-userType');
        console.log('[CheckoutCancel] Cleanup complete');
      }
    };
    cleanup();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        {/* Animated X icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="relative inline-block mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="p-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg"
          >
            <XCircle className="h-16 w-16 text-white" />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-bold text-red-600 mb-3">
            Payment Cancelled
          </h1>
          <p className="text-lg text-slate-500 mb-6">
            Your payment was not completed. No company or workspace was created.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => navigate('/register', { replace: true })}
              className="gap-2"
              size="lg"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
