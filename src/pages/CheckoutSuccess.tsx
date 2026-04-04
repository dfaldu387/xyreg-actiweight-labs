import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { StripeService } from "@/services/stripeService";
import { CompanyInitializationService } from "@/services/companyInitializationService";
import { newPricingService } from "@/services/newPricingService";
import { createLegacyProducts } from "@/services/legacyProductService";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Processing payment...');

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const processPaymentAndCreateCompany = async () => {
      try {
        // Step 1: Process Stripe payment
        if (sessionId) {
          setStatusMessage('Confirming payment...');
          await StripeService.handlePaymentSuccess(sessionId);
        }

        // Step 2: Create company from pending registration data
        const pendingStr = sessionStorage.getItem('pending-registration');
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          console.log('[CheckoutSuccess] Creating company from pending registration:', pending.companyName);

          setStatusMessage('Setting up your company...');

          const srnTrim = (pending.srn || '').trim();
          let companyId: string | null = null;

          // Check if company already exists by SRN
          if (srnTrim) {
            const { data: existingBySrn } = await supabase
              .from('companies')
              .select('id')
              .eq('srn', srnTrim)
              .order('inserted_at', { ascending: true })
              .limit(1)
              .maybeSingle();

            if (existingBySrn?.id) {
              companyId = existingBySrn.id;
              console.log('[CheckoutSuccess] Found existing company by SRN:', companyId);
            }
          }

          // Create company if not found
          if (!companyId) {
            const contactPerson = `${(pending.prrcFirstName || '')} ${(pending.prrcLastName || '')}`.trim();
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: pending.companyName,
                contact_person: contactPerson || null,
                email: pending.email || null,
                website: pending.website || null,
                telephone: pending.telephone || null,
                address: pending.address || null,
                country: pending.country || null,
                srn: srnTrim || null,
              })
              .select('id')
              .single();

            if (companyError) {
              console.error('[CheckoutSuccess] Failed to create company:', companyError);
              throw companyError;
            }

            companyId = newCompany.id;
            console.log('[CheckoutSuccess] Company created:', companyId);
          }

          // Create user-company access
          setStatusMessage('Configuring access...');
          const accessLevel = pending.userType === 'business' ? 'admin' : 'consultant';
          const isInternal = pending.userType === 'business';

          const { error: accessError } = await supabase
            .from('user_company_access')
            .insert({
              user_id: pending.userId,
              company_id: companyId,
              access_level: accessLevel,
              affiliation_type: isInternal ? 'internal' : 'external',
              is_primary: true,
            });

          if (accessError) {
            console.error('[CheckoutSuccess] Failed to create user company access:', accessError);
          }

          // Initialize company phases and documents
          setStatusMessage('Initializing phases and documents...');
          const initResult = await CompanyInitializationService.initializeCompany(
            companyId,
            pending.companyName
          );

          if (!initResult.success) {
            console.warn('[CheckoutSuccess] Phase initialization failed:', initResult.message);
          }

          // Assign pricing plan
          setStatusMessage('Activating your plan...');
          const planToAssign = pending.selectedPlan?.tier || 'genesis';
          try {
            await newPricingService.assignPlanToCompany(companyId, planToAssign, pending.userId);
          } catch (planError) {
            console.error('[CheckoutSuccess] Error assigning plan:', planError);
          }

          // Import EUDAMED devices if any
          if (pending.devices && pending.devices.length > 0) {
            setStatusMessage(`Importing ${pending.devices.length} devices...`);
            try {
              const importResult = await createLegacyProducts({
                companyId,
                devices: pending.devices,
              });
              if (importResult.errors.length > 0) {
                console.warn('[CheckoutSuccess] Device import errors:', importResult.errors);
              }
            } catch (importError) {
              console.error('[CheckoutSuccess] Error importing devices:', importError);
            }
          }

          // Send welcome email (non-blocking)
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            supabase.functions.invoke('send-welcome-email', {
              body: {
                email: user.email,
                firstName: user.user_metadata?.first_name || '',
                lastName: user.user_metadata?.last_name || '',
                companyName: pending.companyName,
                planTier: planToAssign,
                emailType: 'welcome'
              }
            }).catch(err => console.warn('Welcome email failed:', err));

            setTimeout(() => {
              supabase.functions.invoke('send-welcome-email', {
                body: {
                  email: user.email,
                  firstName: user.user_metadata?.first_name || '',
                  emailType: 'helix-pilot'
                }
              }).catch(err => console.warn('Helix pilot email failed:', err));
            }, 5000);
          }

          // Clean up pending registration
          sessionStorage.removeItem('pending-registration');
          sessionStorage.removeItem('selected-plan');

          console.log('[CheckoutSuccess] Company setup complete');
        }

        setStatusMessage('Payment successful!');
      } catch (error) {
        console.error('Error processing payment success:', error);
        setStatusMessage('Payment confirmed. Redirecting...');
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentAndCreateCompany();
  }, [sessionId]);

  // Redirect to company dashboard after processing completes
  useEffect(() => {
    if (isProcessing) return;

    const redirectToCompanyDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: access } = await supabase
            .from('user_company_access')
            .select('company:companies(name)')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single();

          const company = access?.company as { name: string } | null;
          if (company?.name) {
            const companySlug = company.name.toLowerCase().replace(/\s+/g, '-');
            setTimeout(() => navigate(`/app/company/${companySlug}`), 1000);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching company:', error);
      }
      // Fallback
      setTimeout(() => navigate('/app'), 1000);
    };

    redirectToCompanyDashboard();
  }, [isProcessing, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        {/* Animated checkmark */}
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
            className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg"
          >
            <CheckCircle className="h-16 w-16 text-white" />
          </motion.div>

          {/* Floating sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, Math.cos((i * 60 * Math.PI) / 180) * 80],
                y: [0, Math.sin((i * 60 * Math.PI) / 180) * 80],
              }}
              transition={{
                delay: 0.4 + i * 0.1,
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
            </motion.div>
          ))}
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-green-600 mb-3">
            {isProcessing ? 'Setting Up Your Workspace...' : 'Payment Successful!'}
          </h1>
          <p className="text-lg text-slate-500">
            {isProcessing ? statusMessage : 'Redirecting to your dashboard...'}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
