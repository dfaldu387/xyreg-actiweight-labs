import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useInvestorProfile } from "@/hooks/useInvestorProfile";
import {
  Activity,
  Briefcase,
  LayoutDashboard,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MobileDeviceBanner } from "@/components/ui/MobileDeviceBanner";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "My Portfolio",
    icon: LayoutDashboard,
    path: "/investor/dashboard",
  },
  {
    id: "deal-flow",
    label: "Deal Flow",
    icon: Briefcase,
    path: "/investor/deal-flow",
  },
];

export default function InvestorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, isFetching: profileFetching } = useInvestorProfile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Use isFetching to handle initial load properly - prevents "Access Required" flash
  // isLoading is only true when fetching AND no cached data exists
  // isFetching is true whenever a fetch is in progress
  const isLoading = authLoading || profileLoading || (profileFetching && !profile);

  // Redirect to home if not authenticated (but not if signing out)
  if (!isLoading && !user && !isSigningOut) {
    navigate("/");
    return null;
  }

  // Redirect to registration if authenticated but no investor profile (but not if signing out)
  if (!isLoading && user && !profile && !isSigningOut) {
    navigate("/investor/register");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate("/");
  };

  const getActiveNavItem = () => {
    return navItems.find((item) => location.pathname.startsWith(item.path))?.id;
  };

  const activeNavItem = getActiveNavItem();

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 z-50",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-lg">XYREG</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-800">
          {/* Verification Badge */}
          {!isCollapsed && profile?.verification_tier && (
            <div className="mb-3 px-2">
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
                {profile.verification_tier === "tier1"
                  ? "Tier 1 Verified"
                  : profile.verification_tier === "tier2"
                  ? "Tier 2 Verified"
                  : profile.verification_tier === "verified"
                  ? "Fully Verified"
                  : "Pending"}
              </span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={profile?.full_name || ""} />
                  <AvatarFallback className="text-primary">
                    {profile?.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || user?.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.full_name || "Investor"}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isCollapsed ? "right" : "top"}
              align={isCollapsed ? "start" : "center"}
              className="w-56"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {profile?.full_name || "Investor"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64"
        )}
      >
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Device Banner - suggests desktop for better experience */}
      <MobileDeviceBanner />
    </div>
  );
}
