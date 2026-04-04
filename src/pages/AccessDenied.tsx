import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home, Users, AlertTriangle, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompanyRole } from "@/context/CompanyRoleContext";
import { useIsInvestor } from "@/hooks/useIsInvestor";
import { useEffectiveUserRole } from "@/hooks/useEffectiveUserRole";
export default function AccessDenied() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  // const { companyRoles, activeCompanyRole } = useCompanyRole();
  const { isInvestor } = useIsInvestor();
  const { companyRoles, activeCompanyRole, isLoading: rolesLoading } = useCompanyRole();
  const { effectiveRole } = useEffectiveUserRole();
  
  // Determine the role to display - prioritize active company role, then effective role, then first company role, then userRole
  const displayRole = activeCompanyRole?.role || effectiveRole || (companyRoles.length > 0 ? companyRoles[0].role : userRole) || 'Unknown';
  
  console.log("activeCompanyRole",activeCompanyRole)
  console.log("companyRoles",companyRoles)
  console.log("userRole",userRole)
  console.log("effectiveRole",effectiveRole)
  console.log("displayRole",displayRole)
  
  // Auto-redirect if user has company access
  useEffect(() => {
    if (!rolesLoading && companyRoles.length > 0) {
      console.log("AccessDenied: User has company access, redirecting to company");
      if (activeCompanyRole) {
        navigate(`/app/company/${encodeURIComponent(activeCompanyRole.companyName)}`, { replace: true });
      } else {
        navigate(`/app/company/${encodeURIComponent(companyRoles[0].companyName)}`, { replace: true });
      }
    }
  }, [companyRoles, activeCompanyRole, rolesLoading, navigate]);
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (activeCompanyRole) {
      navigate(`/app/company/${encodeURIComponent(activeCompanyRole.companyName)}`);
    } else if (companyRoles.length > 0) {
      navigate(`/app/company/${encodeURIComponent(companyRoles[0].companyName)}`);
    } else if (isInvestor) {
      navigate('/investor/dashboard');
    } else {
      // If no company access, redirect to clients page instead of mission-control
      // This allows users to see available companies or request access
      navigate('/app/clients');
    }
  };

  const handleGoToInvestorDashboard = () => {
    navigate('/investor/dashboard');
  };

  const handleViewCompanies = () => {
    navigate('/app/clients');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-lg mx-4 shadow-2xl border-0 bg-white/80 backdrop-blur-sm relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600"></div>

        <CardHeader className="text-center pb-6 pt-8">
          {/* Animated icon container */}
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <ShieldX className="w-10 h-10 text-white animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            {/* Warning indicator */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Access Denied
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mt-2 leading-relaxed">
            You don't have the necessary permissions to access this resource.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          {/* User info section with dynamic data */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Role:</span>
                <span className="font-semibold text-gray-800 capitalize bg-blue-100 px-3 py-1 rounded-full text-xs">
                  {displayRole}
                </span>
              </div>
              {activeCompanyRole && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Company:</span>
                  <span className="font-semibold text-gray-800 bg-indigo-100 px-3 py-1 rounded-full text-xs">
                    {activeCompanyRole.companyName}
                  </span>
                </div>
              )}
              {companyRoles.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Companies:</span>
                  <span className="font-semibold text-gray-800 bg-green-100 px-3 py-1 rounded-full text-xs">
                    {companyRoles.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons with improved styling */}
          <div className="space-y-3">
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full h-12 text-base border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform duration-200" />
              Go Back
            </Button>

            <Button
              onClick={handleGoHome}
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <Home className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
              Go to Dashboard
            </Button>

            {isInvestor && companyRoles.length === 0 && (
              <Button
                onClick={handleGoToInvestorDashboard}
                className="w-full h-12 text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Activity className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                Go to Investor Dashboard
              </Button>
            )}

            {companyRoles.length > 1 && (
              <Button
                onClick={handleViewCompanies}
                variant="outline"
                className="w-full h-12 text-base border-2 border-indigo-200 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
              >
                <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                View All Companies
              </Button>
            )}
          </div>

          {/* Help section with better visual treatment */}
          <div className="relative mt-8 pt-6">
            <div className="absolute top-0 left-1/2 w-16 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent -translate-x-1/2"></div>
            <div className="text-center">
              <p className="text-sm text-gray-500 leading-relaxed">
                Need help? Contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}