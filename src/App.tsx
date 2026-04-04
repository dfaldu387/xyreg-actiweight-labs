import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { ErrorProvider } from "@/components/error/ErrorProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CompanyRouteGuard } from "@/components/security/CompanyRouteGuard";
import { CompanyModuleAccessGuard } from "@/components/security/CompanyModuleAccessGuard";
import { COMPANY_MODULES } from "@/types/userCompanyModuleAccess";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FeedbackSystem } from "@/components/feedback/FeedbackSystem";
import Landing from "@/pages/Landing";
import AppLayout from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import Clients from "@/pages/Clients";
import AccessDenied from "@/pages/AccessDenied";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import { fixBrainScanLaunchStatus } from "@/utils/fixBrainScanLaunchStatus";

import SuperAdminLogin from "@/pages/SuperAdminLogin";

import { MissionControlRedirect } from "@/components/mission-control/MissionControlRedirect";

// Lazy load heavy components
const MissionControlDashboard = lazy(() => import("@/pages/MissionControlDashboard"));
const AdvisoryBoard = lazy(() => import("@/pages/AdvisoryBoard"));
const SingleCompanyDashboard = lazy(() => import("@/components/mission-control/SingleCompanyDashboard").then(m => ({ default: m.SingleCompanyDashboard })));
const Archives = lazy(() => import("@/pages/Archives"));
const SupplierDetailPage = lazy(() => import("@/pages/SupplierDetailPage"));
const EditSupplierPage = lazy(() => import("@/pages/EditSupplierPage"));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage"));
const Activities = lazy(() => import("@/pages/Activities"));
const Permissions = lazy(() => import("@/pages/Permissions"));
const FieldConfigurationPage = lazy(() => import("@/pages/FieldConfigurationPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ProductDashboard = lazy(() => import("@/pages/ProductDashboard"));
const UserProductMatrix = lazy(() => import("@/pages/UserProductMatrix"));
const ProductGapAnalysisPage = lazy(() => import("@/pages/ProductGapAnalysisPage"));
const ProductGapItemDetailPage = lazy(() => import("@/pages/ProductGapItemDetailPage"));
const ProductDocumentsPage = lazy(() =>
  import("@/pages/ProductDocumentsPage").catch(error => {
    console.error("Failed to load ProductDocumentsPage:", error);
    throw error;
  })
);
const ProductAuditsPage = lazy(() => import("@/pages/ProductAuditsPage"));
const ProductClinicalTrialsPage = lazy(() => import("@/pages/ProductClinicalTrialsPage"));
const ProductMilestonesPage = lazy(() => import("@/pages/ProductMilestonesPage"));
const ProductGanttV23Page = lazy(() => import("@/pages/ProductGanttV23Page"));
const ProductFamilyDashboard = lazy(() => import("@/pages/ProductFamilyDashboard"));
const ProductDeviceInformationPage = lazy(() => import("@/pages/ProductDeviceInformationPage"));
const ProductDesignRiskControlsPage = lazy(() => import("@/pages/ProductDesignRiskControlsPage"));
const ProductDesignRiskLandingPage = lazy(() => import("@/pages/ProductDesignRiskLandingPage"));
const CompanyDocumentsPage = lazy(() => import("@/pages/CompanyDocumentsPage"));
const CompanyAuditsPage = lazy(() => import("@/pages/CompanyAuditsPage"));
const CompanyGapAnalysisPage = lazy(() => import("@/pages/CompanyGapAnalysisPage"));
const CompanyMilestonesPage = lazy(() => import("@/pages/CompanyMilestonesPage"));
const RoleAccessControlPage = lazy(() => import("@/pages/RoleAccessControlPage"));
const CompanyDashboardWrapper = lazy(() => import("@/pages/CompanyDashboardWrapper"));
const CompanyProductsPage = lazy(() => import("@/pages/CompanyProductsPage"));
const CompanySettings = lazy(() => import("@/pages/CompanySettings"));
const ReviewPanel = lazy(() => import("@/pages/ReviewPanel"));
const ReviewerProductsPage = lazy(() => import("@/pages/ReviewerProductsPage"));
const ReviewerProductDetails = lazy(() => import("@/components/reviewer/ReviewerProductDetails").then(m => ({ default: m.ReviewerProductDetails })));
const ReviewDashboard = lazy(() => import("@/pages/ReviewDashboard"));
const ReviewRedirect = lazy(() => import("@/pages/ReviewRedirect"));
const ExpertMatching = lazy(() => import("@/pages/ExpertMatching"));
const CompanyPermissions = lazy(() => import("@/pages/CompanyPermissions"));
const CompanyMDRAnnexIPage = lazy(() => import("@/pages/CompanyMDRAnnexIPage"));
const ProductUserAccessPage = lazy(() => import("@/pages/ProductUserAccessPage"));
const CompanyCommercialPage = lazy(() => import("@/pages/CompanyCommercialPage"));
const CompanySuppliersPage = lazy(() => import("@/pages/CompanySuppliersPage"));
const CompanyInfrastructurePage = lazy(() => import("@/pages/CompanyInfrastructurePage"));
const ProductPortfolio = lazy(() => import("@/pages/ProductPortfolio"));
const AuditLogPage = lazy(() => import("@/pages/AuditLogPage"));
const ProductAuditLogPage = lazy(() => import("@/pages/ProductAuditLogPage"));
const CommunicationsPage = lazy(() => import("@/pages/CommunicationsPage"));
const ProductPMSPage = lazy(() => import("@/pages/ProductPMSPage"));
const CompanyPMSPage = lazy(() => import("@/pages/CompanyPMSPage"));
const CommunicationThreadPage = lazy(() => import("@/pages/CommunicationThreadPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const CompanyMarketplacePreviewPage = lazy(() => import("@/pages/CompanyMarketplacePreviewPage"));
const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));
const ProductDefinitionPage = lazy(() => import("@/pages/ProductDefinitionPage"));
const ProductPhaseDetail = lazy(() => import("@/pages/ProductPhaseDetail"));
const BusinessCasePage = lazy(() => import("@/pages/BusinessCasePage"));
const InvitationAcceptedPage = lazy(() => import("@/pages/InvitationAcceptedPage"));
const ComprehensiveDeviceInformation = lazy(() => import("@/pages/NpvPage"));
const CompanyProcessingPage = lazy(() => import("@/pages/CompanyProcessingPage"));
const ReviewerAnalyticsPage = lazy(() => import("@/pages/ReviewerAnalyticsPage").then(module => ({ default: module.ReviewerAnalyticsPage })));
const SuperAdminUsers = lazy(() => import("@/pages/SuperAdminUsers"));
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));
const SuperAdminBilling = lazy(() => import("@/pages/SuperAdminBilling"));
const SuperAdminPlans = lazy(() => import("@/pages/SuperAdminPlans"));
const SuperAdminPlanMenuAccess = lazy(() => import("@/pages/SuperAdminPlanMenuAccess"));
const SuperAdminPlanPricing = lazy(() => import("@/pages/SuperAdminPlanPricing"));
const SuperAdminApiKeyManagement = lazy(() => import("@/components/super-admin/SuperAdminApiKeyManagement"));
const SuperAdminDocuments = lazy(() => import("@/pages/SuperAdminDocuments"));
const SuperAdminTemplates = lazy(() => import("@/pages/SuperAdminTemplates"));
const SuperAdminReleases = lazy(() => import("@/pages/super-admin/SuperAdminReleases"));
const SuperAdminAuditLog = lazy(() => import("@/pages/SuperAdminAuditLog"));

const SuperAdminFeedback = lazy(() => import("@/pages/SuperAdminFeedback"));

const SuperAdminWHXCodes = lazy(() => import("@/components/super-admin/SuperAdminWHXCodes"));
const SuperAdminWHXUsers = lazy(() => import("@/components/super-admin/SuperAdminWHXUsers"));
const SuperAdminAccessManagement = lazy(() => import("@/pages/SuperAdminAccessManagement"));

const ViewerCompliancePage = lazy(() => import("@/pages/ViewerCompliancePage"));
const ViewerDocumentsPage = lazy(() => import("@/pages/ViewerDocumentsPage"));
const ViewerGapAnalysisPage = lazy(() => import("@/pages/ViewerGapAnalysisPage"));
const PlatformProfile = lazy(() => import("@/pages/PlatformProfile"));
const DocumentStudioPage = lazy(() => import("@/pages/DocumentStudioPage"));
const ProductDocumentSelectionPage = lazy(() => import("@/pages/ProductDocumentSelectionPage"));
const ProductTemplateHubPage = lazy(() => import("@/pages/ProductTemplateHubPage"));
const DocumentComposerPage = lazy(() => import("@/pages/DocumentComposerPage"));
const ComplianceInstancesPage = lazy(() => import("@/pages/ComplianceInstancesPage"));
const ProductComplianceInstancesPage = lazy(() => import("@/pages/ProductComplianceInstancesPage"));
const ProductTechnicalFilePage = lazy(() => import("@/pages/ProductTechnicalFilePage"));
const CompanyCommercialLandingPage = lazy(() => import("@/pages/CompanyCommercialLandingPage"));
const ProductBusinessCaseLandingPage = lazy(() => import("@/pages/ProductBusinessCaseLandingPage"));
const ProductDefinitionLandingPage = lazy(() => import("@/pages/ProductDefinitionLandingPage"));
const ProductBundleManagementPage = lazy(() => import("@/pages/ProductBundleManagementPage"));
const PortfolioLandingPage = lazy(() => import("@/pages/PortfolioLandingPage"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("@/pages/CheckoutCancel"));
const TestSidebarPage = lazy(() => import("@/pages/TestSidebarPage"));
const BasicUDIOverview = lazy(() => import("@/pages/BasicUDIOverview"));
const BasicUDIDetail = lazy(() => import("@/pages/BasicUDIDetail"));
const CompanyBudgetDashboard = lazy(() => import("@/pages/CompanyBudgetDashboard"));
const ProductReimbursementPage = lazy(() => import("@/pages/ProductReimbursementPage"));
const ProductFamilyView = lazy(() => import("@/pages/ProductFamilyView"));
const DeviceFamilyDashboard = lazy(() => import("@/pages/DeviceFamilyDashboard"));

const StandaloneBundleBuilderPage = lazy(() => import("@/pages/StandaloneBundleBuilderPage"));
const InvestorViewPage = lazy(() => import("@/pages/InvestorViewPage"));
const InvestorMonitorPage = lazy(() => import("@/pages/InvestorMonitorPage"));
const CompanyIPPortfolioPage = lazy(() => import("@/pages/CompanyIPPortfolioPage"));
const CompanyTrainingPage = lazy(() => import("@/pages/CompanyTrainingPage"));
const CalibrationSchedulePage = lazy(() => import("@/pages/CalibrationSchedulePage"));
// CompetencyMatrixPage merged into CompanyTrainingPage
const ManagementReviewPage = lazy(() => import("@/pages/ManagementReviewPage"));
const QualityManualPage = lazy(() => import("@/pages/QualityManualPage"));
const ProductInvestorSharePage = lazy(() => import("@/pages/ProductInvestorSharePage"));
const InvestorRegistrationPage = lazy(() => import("@/pages/InvestorRegistrationPage"));
const DealFlowMarketplacePage = lazy(() => import("@/pages/DealFlowMarketplacePage"));
const InvestorDashboardPage = lazy(() => import("@/pages/InvestorDashboardPage"));
const EssentialGatesTimelinePage = lazy(() => import("@/pages/EssentialGatesTimelinePage"));
const DeviceOperationsPage = lazy(() => import("@/pages/DeviceOperationsPage"));
const DeviceBomPage = lazy(() => import("@/pages/DeviceBomPage"));
const InvestorLayout = lazy(() => import("@/components/layout/InvestorLayout"));

// CAPA Module
const CompanyCAPAPage = lazy(() => import("@/pages/CompanyCAPAPage"));
const ProductCAPAPage = lazy(() => import("@/pages/ProductCAPAPage"));
const CAPADetailPage = lazy(() => import("@/pages/CAPADetailPage"));

// Nonconformity Module
const CompanyNCPage = lazy(() => import("@/pages/CompanyNCPage"));
const ProductNCPage = lazy(() => import("@/pages/ProductNCPage"));
const NCDetailPage = lazy(() => import("@/pages/NCDetailPage"));

const CompanyChangeControlPage = lazy(() => import("@/pages/CompanyChangeControlPage"));
const ProductChangeControlPage = lazy(() => import("@/pages/ProductChangeControlPage"));
const ChangeControlDetailPage = lazy(() => import("@/pages/ChangeControlDetailPage"));

// Design Review Module
const ProductDesignReviewPage = lazy(() => import("@/pages/ProductDesignReviewPage"));
const DesignReviewDetailPage = lazy(() => import("@/pages/DesignReviewDetailPage"));
const CompanyDesignReviewPage = lazy(() => import("@/pages/CompanyDesignReviewPage"));

const PricingModule = lazy(() => import("@/new-price/PricingModule"));

const GenesisLandingPage = lazy(() => import("@/pages/GenesisLandingPage"));

// Registration flow
const RegistrationPage = lazy(() => import("@/pages/RegistrationPage"));


// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  // Make fix utility available in console for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fixBrainScanLaunchStatus = fixBrainScanLaunchStatus;
      // console.log('[App] Debug utility available: window.fixBrainScanLaunchStatus()');
    }
  }, []);

  return (
    <ErrorBoundary level="critical">
      <ErrorProvider>
        <FeedbackSystem />
        <Routes>
          {/* Public routes - accessible to all */}
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <RegistrationPage />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/pricing" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <PricingModule />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/checkout/success" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <CheckoutSuccess />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/app/company/:companyName/pricing-new" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <PricingModule />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/checkout/cancel" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <CheckoutCancel />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/reset-password" element={
            <ErrorBoundary level="component">
              <ResetPassword />
            </ErrorBoundary>
          } />
          <Route path="/auth/callback" element={
            <ErrorBoundary level="component">
              <AuthCallback />
            </ErrorBoundary>
          } />
          {/* Public Investor View Page */}
          <Route path="/investor/register" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <InvestorRegistrationPage />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/investor/:shareId" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <InvestorViewPage />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/marketplace/:slug" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <InvestorViewPage isMarketplaceMode />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/investor/monitor/:shareId" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <InvestorMonitorPage />
              </ErrorBoundary>
            </Suspense>
          } />
          {/* Investor Protected Routes - Use same AppLayout as regular users for consistent L1/L2 sidebar */}
          <Route element={<ProtectedRoute redirectPath="/investor/register" />}>
            <Route path="/investor" element={
              <ErrorBoundary level="page">
                <AppLayout />
              </ErrorBoundary>
            }>
              <Route path="dashboard" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <InvestorDashboardPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="deal-flow" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DealFlowMarketplacePage />
                  </ErrorBoundary>
                </Suspense>
              } />
            </Route>
          </Route>

          {/* Super Admin Login Route */}
          <Route path="/super-admin-login" element={
            <ErrorBoundary level="component">
              <SuperAdminLogin />
            </ErrorBoundary>
          } />

          <Route path="/accept-invitation" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <AcceptInvitation />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/invitation-accepted" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <InvitationAcceptedPage />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/company-processing" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <CompanyProcessingPage />
              </ErrorBoundary>
            </Suspense>
          } />

          {/* Super Admin Protected Routes - require super_admin role ONLY */}
          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} redirectPath="/" />}>
            <Route path="/super-admin" element={
              <ErrorBoundary level="page">
                <AppLayout />
              </ErrorBoundary>
            }>
              {/* Super Admin Dashboard */}
              <Route index element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminDashboard />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Users Management */}
              <Route path="app/users" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminUsers />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Billing Management */}
              <Route path="app/billing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminBilling />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Plans Management */}
              <Route path="app/plans" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminPlans />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Plan Menu Access */}
              <Route path="app/plans/:planName/menu-access" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminPlanMenuAccess />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Plan Pricing */}
              <Route path="app/plan-pricing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminPlanPricing />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin API Key Management */}
              <Route path="app/api-keys" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminApiKeyManagement />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Documents Management */}
              <Route path="app/documents" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminDocuments />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Templates Management */}
              <Route path="app/templates" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminTemplates />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Audit Log */}
              <Route path="app/audit-logs" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminAuditLog />
                  </ErrorBoundary>
                </Suspense>
              } />


              {/* Super Admin Feedback */}
              <Route path="app/feedback" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminFeedback />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Releases */}
              <Route path="app/releases" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminReleases />
                  </ErrorBoundary>
                </Suspense>
              } />


              {/* Super Admin WHX Event Codes */}
              <Route path="app/whx-codes" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminWHXCodes />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin WHX Event Registered Users */}
              <Route path="app/whx-users" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminWHXUsers />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Super Admin Access Management */}
              <Route path="app/access-management" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuperAdminAccessManagement />
                  </ErrorBoundary>
                </Suspense>
              } />


              {/* Add more super admin routes here as needed */}
              <Route path="app/companies" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <div>Super Admin Companies Management</div>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="app/system" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <div>Super Admin System Settings</div>
                  </ErrorBoundary>
                </Suspense>
              } />
            </Route>
          </Route>

          {/* Regular App Protected Routes - require authentication but NOT super_admin */}
          <Route element={<ProtectedRoute redirectPath="/" />}>
            <Route path="/app" element={
              <ErrorBoundary level="page">
                <AppLayout />
              </ErrorBoundary>
            }>
              {/* Default route for app */}
              <Route index element={<Index />} />

              {/* Deal Flow Marketplace - accessible from main app */}
              <Route path="deal-flow" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DealFlowMarketplacePage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Genesis Landing Page - for startups without a device */}
              <Route path="genesis" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <GenesisLandingPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Genesis Landing Page - with company context for L2 sidebar */}
              <Route path="company/:companyName/genesis" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <GenesisLandingPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Access denied route */}
              <Route path="access-denied" element={
                <ErrorBoundary level="component">
                  <AccessDenied />
                </ErrorBoundary>
              } />

              {/* Redirect /app/mission-control to company-specific route */}
              <Route path="mission-control" element={
                <ErrorBoundary level="component">
                  <MissionControlRedirect />
                </ErrorBoundary>
              } />
              {/* Advisory Board */}
              <Route path="company/:companyName/advisory-board" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <AdvisoryBoard />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* User x Product Matrix */}
              <Route path="company/:companyName/user-product-matrix" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <UserProductMatrix />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="document-studio" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DocumentStudioPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="document-studio/product-selection" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDocumentSelectionPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="document-studio/templates" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductTemplateHubPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="document-composer" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DocumentComposerPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="clients" element={
                <ErrorBoundary level="component">
                  <Clients />
                </ErrorBoundary>
              } />

              {/* Profile page - accessible without company context (for reviewers) */}
              <Route path="profile" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProfilePage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="audit-log" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <AuditLogPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              {/* <Route path="/review-assign-document" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DocumentReviewKanban />
                  </ErrorBoundary>
                </Suspense>
              } /> */}
              <Route path="communications" element={<Navigate to="/app/mission-control" replace />} />
              <Route path="communications/:threadId" element={<Navigate to="/app/mission-control" replace />} />

              <Route path="archives" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <Archives />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="permissions" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <Permissions />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="field-configuration" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <FieldConfigurationPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="/app/company/:companyName/profile" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProfilePage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="/app/company/:companyName/role-access-control" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <RoleAccessControlPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              {/* General documents route - for regular users */}
              <Route path="documents" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ViewerDocumentsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* General gap analysis route - for regular users */}
              <Route path="gap-analysis" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ViewerGapAnalysisPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="billing/:companyId" element={
                <Suspense>
                  <ErrorBoundary level="component">
                    <BillingPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DASHBOARD}>
                        <CompanyDashboardWrapper />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/documents" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyDocumentsPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/audits" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyAuditsPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/gap-analysis" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyGapAnalysisPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="company/:companyName/gap-analysis/:itemId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <ProductGapItemDetailPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/activities" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <Activities />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/compliance-instances" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.COMPLIANCE_INSTANCES}>
                        <ComplianceInstancesPage />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/commercial-landing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.COMMERCIAL}>
                        <CompanyCommercialLandingPage />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/milestones" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.MILESTONES}>
                        <CompanyMilestonesPage />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/post-market-surveillance" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.POST_MARKET_SURVEILLANCE}>
                        <CompanyPMSPage />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/compliance" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <ViewerCompliancePage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company Design Review */}
              <Route path="company/:companyName/design-review" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyDesignReviewPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company CAPA Management */}
              <Route path="company/:companyName/capa" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyCAPAPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company Nonconformity */}
              <Route path="company/:companyName/nonconformity" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyNCPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />


              <Route path="company/:companyName/change-control" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyChangeControlPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Change Control Detail Page */}
              <Route path="change-control/:ccrId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ChangeControlDetailPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/products" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyProductsPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company-specific Audit Log */}
              <Route path="company/:companyName/audit-log" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.AUDIT_LOG}>
                        <AuditLogPage />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company Communications - redirect to mission control */}
              <Route path="company/:companyName/communications" element={
                <MissionControlRedirect />
              } />
              <Route path="company/:companyName/communications/:threadId" element={
                <MissionControlRedirect />
              } />

              <Route path="company/:companyName/pricing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <Pricing />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/budget-dashboard" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyBudgetDashboard />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Marketplace Preview for Company Admins */}
              <Route path="company/:companyName/marketplace-preview" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyMarketplacePreviewPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Device Family Dashboard */}
              <Route path="company/:companyId/family/:familyKey/dashboard" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <DeviceFamilyDashboard />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/suppliers" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanySuppliersPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company Training */}
              <Route path="company/:companyName/training" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyTrainingPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company Infrastructure */}
              <Route path="company/:companyName/infrastructure" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyInfrastructurePage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Calibration Schedule */}
              <Route path="company/:companyName/calibration-schedule" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CalibrationSchedulePage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Competency Matrix — merged into Training Management */}

              {/* Management Review */}
              <Route path="company/:companyName/management-review" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <ManagementReviewPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Global Quality Manual */}
              <Route path="company/:companyName/quality-manual" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <QualityManualPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/suppliers/:supplierId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <SupplierDetailPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/suppliers/:supplierId/edit" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <EditSupplierPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Supplier routes */}
              <Route path="suppliers" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SuppliersPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="supplier/:supplierId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <SupplierDetailPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="supplier/:supplierId/edit" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <EditSupplierPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Portfolio landing - accessible to users with Portfolio Management module access */}
              <Route path="company/:companyName/portfolio-landing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DEVICE_PORTFOLIO}>
                        <PortfolioLandingPage />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Portfolio routes - accessible to users with Portfolio Management module access */}
              <Route path="company/:companyName/portfolio" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DEVICE_PORTFOLIO}>
                        <ProductPortfolio />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="company/:companyName/product-family/:familyKey" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DEVICE_PORTFOLIO}>
                        <ProductFamilyView />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="company/:companyName/basic-udi-overview" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DEVICE_PORTFOLIO}>
                        <BasicUDIOverview />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="company/:companyName/basic-udi/:basicUdiDi" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DEVICE_PORTFOLIO}>
                        <BasicUDIDetail />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="company/:companyName/platforms/:platformId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyModuleAccessGuard requiredModuleId={COMPANY_MODULES.DEVICE_PORTFOLIO}>
                        <PlatformProfile />
                      </CompanyModuleAccessGuard>
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Protected route for company settings - only accessible to admins and consultants */}
              <Route element={<ProtectedRoute allowedRoles={["admin", "company_admin", "consultant"]} />}>
                <Route path="company/:companyName/settings" element={
                  <Suspense fallback={<PageLoader />}>
                    <ErrorBoundary level="component">
                      <CompanyRouteGuard>
                        <CompanySettings />
                      </CompanyRouteGuard>
                    </ErrorBoundary>
                  </Suspense>
                } />
                <Route path="company/:companyName/commercial" element={
                  <Suspense fallback={<PageLoader />}>
                    <ErrorBoundary level="component">
                      <CompanyRouteGuard>
                        <CompanyCommercialPage />
                      </CompanyRouteGuard>
                    </ErrorBoundary>
                  </Suspense>
                } />
                <Route path="company/:companyName/ip-portfolio" element={
                  <Suspense fallback={<PageLoader />}>
                    <ErrorBoundary level="component">
                      <CompanyRouteGuard>
                        <CompanyIPPortfolioPage />
                      </CompanyRouteGuard>
                    </ErrorBoundary>
                  </Suspense>
                } />
              </Route>

              {/* Standalone Bundle Builder Route */}
              <Route path="bundle/:bundleId/build" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <StandaloneBundleBuilderPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="device-family/:masterProductId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductFamilyDashboard />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="product/:productId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDashboard />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/device-information" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDeviceInformationPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/design-risk-controls" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDesignRiskControlsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/design-risk-landing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDesignRiskLandingPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="product/:productId/user-access" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductUserAccessPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="product/:productId/gap-analysis" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductGapAnalysisPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/compliance-instances" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductComplianceInstancesPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/business-case-landing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductBusinessCaseLandingPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/product-definition" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDefinitionLandingPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/bundle-management" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductBundleManagementPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="product/:productId/gap-analysis/:itemId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductGapItemDetailPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/documents" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDocumentsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/activities" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <Activities />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/audits" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductAuditsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/audit-log" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductAuditLogPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/clinical-trials" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductClinicalTrialsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Product Design Review */}
              <Route path="product/:productId/design-review" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDesignReviewPage />
                  </ErrorBoundary>
                </Suspense>
              } />
              <Route path="product/:productId/design-review/:reviewId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DesignReviewDetailPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Product Change Control */}
              <Route path="product/:productId/change-control" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductChangeControlPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Product CAPA Management */}
              <Route path="product/:productId/capa" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductCAPAPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* CAPA Detail Page */}
              <Route path="capa/:capaId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CAPADetailPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Product Nonconformity */}
              <Route path="product/:productId/nonconformity" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductNCPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* NC Detail Page */}
              <Route path="nonconformity/:ncId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <NCDetailPage />
                  </ErrorBoundary>
                </Suspense>
              } />


              {/* Redirect old rNPV route to Business Case tab */}
              <Route
                path="product/:productId/rnpv"
                element={<Navigate to="../business-case?tab=rnpv" replace />}
              />

              <Route path="product/:productId/milestones" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductMilestonesPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/gantt-v2-3" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductGanttV23Page />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/technical-file" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductTechnicalFilePage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/post-market-surveillance" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductPMSPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/product-definition" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductDefinitionPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/business-case" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <BusinessCasePage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/reimbursement" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductReimbursementPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/operations/manufacturing" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DeviceOperationsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/bom" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <DeviceBomPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Xyreg Genesis / Share with Investors page */}
              <Route path="product/:productId/investor-share" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductInvestorSharePage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/essential-gates-timeline" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <EssentialGatesTimelinePage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/npv" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ComprehensiveDeviceInformation />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="product/:productId/phase/:phaseId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ProductPhaseDetail />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/review" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <ReviewDashboard />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="review" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ReviewRedirect />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="review-panel" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ReviewPanel />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="review-panel/products" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ReviewerProductsPage />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="review-panel/products/:productId" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ReviewerProductDetails />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="expert-matching" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <ExpertMatching />
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/permissions" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyPermissions />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="/app/company/:companyName/mdr-annex-i" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <CompanyMDRAnnexIPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Reviewer Analytics Dashboard */}
              <Route path="company/:companyName/reviewer-analytics" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <ReviewerAnalyticsPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              {/* Company-specific Mission Control - directly renders SingleCompanyDashboard */}
              <Route path="company/:companyName/mission-control" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <SingleCompanyDashboard />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/document-studio" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <DocumentStudioPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/document-studio/product-selection" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <ProductDocumentSelectionPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />

              <Route path="company/:companyName/document-composer" element={
                <Suspense fallback={<PageLoader />}>
                  <ErrorBoundary level="component">
                    <CompanyRouteGuard>
                      <DocumentComposerPage />
                    </CompanyRouteGuard>
                  </ErrorBoundary>
                </Suspense>
              } />
            </Route>

            {/* Catch-all route - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Test Sidebar Page - Outside AppLayout to avoid showing existing sidebar */}
          {/*<Route path="/test-sidebar" element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary level="component">
                <TestSidebarPage />
              </ErrorBoundary>
            </Suspense>
          } />*/}
        </Routes>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;
