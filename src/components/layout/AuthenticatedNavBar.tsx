
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LogIn, Menu, UserCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { UserRole } from "@/types/documentTypes";
import { DevModeBadge } from "@/components/dev/DevModeBadge";
import { DevCompanySwitcher } from "@/components/dev/DevCompanySwitcher";
import { ProductSelector } from "@/components/product/ProductSelector";
import { useParams, useLocation } from "react-router-dom";
import { useSimpleClients } from "@/hooks/useSimpleClients";

export function AuthenticatedNavBar() {
  const {
    signOut,
    user,
    userRole,
    setDevUserRole
  } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const { clients } = useSimpleClients();
  
  // Extract current product and company from URL
  const currentProductId = params.productId;
  const companyName = params.companyName;
  
  // Find company ID from company name
  const companyId = companyName ? clients.find(c => c.name === decodeURIComponent(companyName))?.id : undefined;
  
  // Show ProductSelector when we're in a product context or company context
  const showProductSelector = location.pathname.includes('/product/') || location.pathname.includes('/company/');
  
  const handleLogout = async () => {
    try {
      // First navigate to landing page, then sign out
      // This helps prevent the loading spinner loop
      navigate("/");
      await signOut();
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if logout fails
      navigate("/");
    }
  };
  
  const handleLogin = () => {
    navigate("/");
  };
  
  // Define available roles for development mode switching
  const availableRoles: {label: string, value: UserRole}[] = [
    { label: "Admin", value: "admin" },
    { label: "Editor", value: "editor" },
    { label: "Viewer", value: "viewer" }
  ];
  
  const handleRoleChange = (newRole: string) => {
    if (setDevUserRole) {
      setDevUserRole(newRole as UserRole);
    }
  };
  
  return (
    <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </div>
          <Link to="/app/clients" className="md:hidden">
            <img 
              src="/lovable-uploads/d778024d-c31d-4b31-8a3f-ac47768a13b1.png" 
              alt="Company Logo" 
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
            <span className="text-xl font-bold hidden">XYREG</span>
          </Link>
          <div className="hidden md:flex items-center">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </div>
          {user && <span className="text-sm text-muted-foreground hidden md:block ml-3">Logged in as {user.email}</span>}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dev Mode Badge */}
          {process.env.NODE_ENV === 'development' && (
            <DevModeBadge />
          )}
          
          {/* Development mode role switcher */}
          {process.env.NODE_ENV !== 'production' && user && (
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <Select value={userRole || 'viewer'} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Dev Company Switcher */}
          {process.env.NODE_ENV === 'development' && (
            <DevCompanySwitcher />
          )}
          
          {/* Product Selector */}
          {showProductSelector && user && companyId && (
            <ProductSelector 
              currentProductId={currentProductId}
              companyId={companyId}
            />
          )}
          
          <Button variant="outline" onClick={() => navigate('/app/clients')} className="hidden md:flex">
            Dashboard
          </Button>
          
          {user ? (
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button variant="default" onClick={handleLogin} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
