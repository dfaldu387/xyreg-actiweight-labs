import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { HierarchicalPermissionsEditor } from "@/components/permissions/HierarchicalPermissionsEditor";
import { CommentThreadSelector } from "@/components/permissions/CommentThreadSelector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddUserDialog } from "@/components/permissions/AddUserDialog";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { hasAdminPrivileges, hasEditorPrivileges } from "@/utils/roleUtils";
import { resolveCompanyIdentifier } from "@/utils/companyUtils";
import { UserWithRole } from "@/types/company";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CompanyTabsNavigation } from "@/components/company/CompanyTabsNavigation";

// Mock data for demonstration - will be replaced with real data in future updates
const mockUsers = [
  { id: "1", name: "Alice Werner", email: "alice@xyreg.com", role: "Consultant", companyAccess: "multi" },
  { id: "2", name: "Bob Chen", email: "bob@xyreg.com", role: "Company Admin", companyAccess: "single" },
  { id: "3", name: "Carol Johnson", email: "carol@externalreview.com", role: "Editor", external: true }
];

type PermissionLevel = "A" | "E" | "V";

const mockCompanies = [
  { id: "c1", name: "Medixor AB", type: "company" as const, permissions: ["A", "E", "V"] as PermissionLevel[] },
  { id: "c2", name: "BioHealth Ltd", type: "company" as const, permissions: ["E", "V"] as PermissionLevel[] },
  { id: "c3", name: "MediTech Solutions", type: "company" as const, permissions: ["V"] as PermissionLevel[] }
];

const mockProducts = [
  { id: "c1-p1", name: "CathNav 3.0", type: "product" as const, permissions: ["E", "V"] as PermissionLevel[], isOverride: true },
  { id: "c1-p2", name: "BioScan X1", type: "product" as const, permissions: ["V"] as PermissionLevel[], isOverride: false },
  { id: "c2-p1", name: "HealthMonitor Pro", type: "product" as const, permissions: ["E", "V"] as PermissionLevel[], isOverride: true },
  { id: "c3-p1", name: "DiagnosticSuite", type: "product" as const, permissions: ["V"] as PermissionLevel[], isOverride: false }
];

const mockDocuments = [
  { id: "c1-p1-d1", name: "Technical Documentation", type: "document" as const, permissions: ["E"] as PermissionLevel[], isOverride: true },
  { id: "c1-p1-d2", name: "Risk Management Plan", type: "document" as const, permissions: ["V"] as PermissionLevel[], isOverride: false },
  { id: "c1-p2-d1", name: "Clinical Evaluation", type: "document" as const, permissions: ["V"] as PermissionLevel[], isOverride: true },
  { id: "c2-p1-d1", name: "Regulatory Compliance", type: "document" as const, permissions: ["E", "V"] as PermissionLevel[], isOverride: true },
  { id: "c3-p1-d1", name: "Quality Management System", type: "document" as const, permissions: ["V"] as PermissionLevel[], isOverride: false }
];

export default function CompanyPermissions() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ companyName: string }>();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [companies, setCompanies] = useState(mockCompanies);
  const [products, setProducts] = useState(mockProducts);
  const [documents, setDocuments] = useState(mockDocuments);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>(mockUsers as UserWithRole[]);
  const [activeTab, setActiveTab] = useState("permissions");
  const { userRole } = useAuth(); 
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  
  // Resolve company name to company ID
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoading(true);
      
      if (params.companyName) {
        console.log("Resolving company name:", params.companyName);
        
        const result = await resolveCompanyIdentifier(params.companyName);
        
        if (result.companyId) {
          console.log("Resolved company ID:", result.companyId);
          setCompanyId(result.companyId);
          setCompanyName(result.companyName);
        } else {
          console.error("Failed to resolve company:", result.error);
          toast.error(result.error || "Failed to find company");
        }
      }
      
      setIsLoading(false);
    };
    
    fetchCompanyData();
  }, [params.companyName]);

  // Use the location state to set the active tab if available
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else {
      setActiveTab("permissions"); // Default tab for this page
    }
  }, [location.state]);

  // Set appropriate data based on user role
  useEffect(() => {
    if (selectedUserId) {
      const user = users.find(u => u.id === selectedUserId);
      
      // Check for "Consultant" role or "multi" company access type
      if (user?.role === "Consultant" || user?.companyAccess === "multi") {
        // Consultants see all companies with appropriate permissions
        setCompanies(mockCompanies);
      } else {
        // Company Admins and others only see their assigned company
        setCompanies([mockCompanies[0]]);
      }
      
      // Filter products and documents based on visible companies
      updateVisibleEntities(user?.role, user?.companyAccess);
    }
  }, [selectedUserId]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    if (value === activeTab) {
      // No change, do nothing
      return;
    }
    
    if (!companyName) return;
    
    const encodedCompanyName = encodeURIComponent(companyName);
    
    if (value === "permissions") {
      // Already on permissions page
      setActiveTab(value);
    } else if (value === "audits") {
      // For audits, navigate to the dedicated page
      navigate(`/app/company/${encodedCompanyName}/audits`, { replace: true });
    } else {
      // For other tabs, navigate to the settings page with the appropriate active tab
      navigate(`/app/company/${encodedCompanyName}/settings`, { state: { activeTab: value }, replace: true });
    }
  };
  
  const updateVisibleEntities = (role?: string, companyAccess?: string) => {
    // Check for "Consultant" role or "multi" company access
    if (role === "Consultant" || companyAccess === "multi") {
      // Show all products and documents for consultants
      setProducts(mockProducts);
      setDocuments(mockDocuments);
    } else {
      // For others, only show products and documents for their company (Medixor)
      const companyIds = companies.map(c => c.id);
      setProducts(mockProducts.filter(p => {
        const productCompanyId = p.id.split('-')[0];
        return companyIds.includes(productCompanyId);
      }));
      
      setDocuments(mockDocuments.filter(d => {
        const docCompanyId = d.id.split('-')[0];
        return companyIds.includes(docCompanyId);
      }));
    }
  };
  
  const handlePermissionChange = (entityId: string, entityType: string, permissions: PermissionLevel[]) => {
    console.log("Permission change:", entityId, entityType, permissions);
    
    if (entityType === 'company') {
      setCompanies(companies.map(c => c.id === entityId ? { ...c, permissions } : c));
    } else if (entityType === 'product') {
      setProducts(products.map(p => p.id === entityId ? { ...p, permissions } : p));
    } else if (entityType === 'document') {
      setDocuments(documents.map(d => d.id === entityId ? { ...d, permissions } : d));
    }
  };
  
  const handleOverrideToggle = (entityId: string, entityType: string, isOverride: boolean) => {
    if (entityType === 'product') {
      setProducts(products.map(p => p.id === entityId ? { ...p, isOverride } : p));
    } else if (entityType === 'document') {
      setDocuments(documents.map(d => d.id === entityId ? { ...d, isOverride } : d));
    }
  };

  const handleAddUser = (newUser: any) => {
    const newUserId = `${users.length + 1}`;
    const userWithId = {
      ...newUser,
      id: newUserId
    };
    setUsers([...users, userWithId]);
    setAddUserDialogOpen(false);
  };

  // Get current user's highest permission level based on their role
  const getCurrentUserPermissionLevel = (): PermissionLevel => {
    // Map user roles to permission levels
    if (hasAdminPrivileges(userRole)) {
      return "A"; // Admin permissions
    } else if (hasEditorPrivileges(userRole)) {
      return "E"; // Editor permissions
    } else {
      return "V"; // Viewer permissions by default
    }
  };

  // Changed from mockUsers to users to include newly added users
  const selectedUser = users.find(user => user.id === selectedUserId);
  
  // Development mode indicator
  const isDevMode = process.env.NODE_ENV !== 'production';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!companyName || !companyId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="text-lg font-semibold">Company not found</h2>
          <p>Unable to find company information. Please go back to the companies list.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/app/clients')}
          >
            Go to Companies
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-7xl">
      {isDevMode && userRole && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-sm font-medium text-yellow-700">Development Mode</p>
            <p className="text-xs text-yellow-600">Currently viewing as: {userRole}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/app/company/${encodeURIComponent(companyName)}/settings`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{companyName} Permissions</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <CompanyTabsNavigation 
          companyName={companyName}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <TabsContent value="permissions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {users.map(user => (
                    <div 
                      key={user.id}
                      className={`p-3 border rounded-md cursor-pointer flex items-center justify-between ${
                        selectedUserId === user.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            user.role === "Consultant" ? "bg-blue-100 text-blue-800" : 
                            user.role === "Company Admin" ? "bg-purple-100 text-purple-800" : 
                            "bg-muted"
                          }`}>{user.role}</div>
                          {user.isExternal && (
                            <div className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">External</div>
                          )}
                        </div>
                        {(user.role === "Consultant" || user.companyAccess === "multi") && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            Multi-Company Access
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full mt-4">
                        Add User
                      </Button>
                    </DialogTrigger>
                    <AddUserDialog onAddUser={handleAddUser} />
                  </Dialog>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {selectedUser ? (
                <div className="space-y-6">
                  <HierarchicalPermissionsEditor
                    userId={selectedUser.id}
                    userName={selectedUser.name}
                    companies={companies}
                    products={products}
                    documents={documents}
                    onPermissionChange={handlePermissionChange}
                    onOverrideToggle={handleOverrideToggle}
                    currentUserPermissionLevel={getCurrentUserPermissionLevel()}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Comment Thread Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Configure which comment threads this user can see and participate in.
                      </p>
                      
                      <CommentThreadSelector>
                        <div className="bg-white p-4 rounded border">
                          <p className="text-muted-foreground">
                            Sample comment thread content will appear here.
                          </p>
                        </div>
                      </CommentThreadSelector>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <div className="text-center">
                      <p>Select a user to manage permissions</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
