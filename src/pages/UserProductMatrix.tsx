import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useOptimizedCompanyProducts } from "@/hooks/useOptimizedCompanyProducts";
import { Switch } from "@/components/ui/switch";
import { UserProductMetrixService } from "@/services/userProductMetrixService";
import { UserProductMatrixService } from "@/services/userProductMatrixService";
import { UserProductMatrixWithDetails } from "@/types/userProductMatrix";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Function to get badge color based on department name
const getDepartmentBadgeColor = (department: string): string => {
  const deptLower = department.toLowerCase();

  // Color mapping for departments
  const colorMap: Record<string, string> = {
    'quality assurance': 'bg-blue-100 text-blue-800 border-blue-300',
    'regulatory affairs': 'bg-green-100 text-green-800 border-green-300',
    'research & development': 'bg-purple-100 text-purple-800 border-purple-300',
    'clinical affairs': 'bg-pink-100 text-pink-800 border-pink-300',
    'manufacturing': 'bg-orange-100 text-orange-800 border-orange-300',
    'engineering': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'post-market surveillance': 'bg-red-100 text-red-800 border-red-300',
    'risk management': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  // Check for exact match or partial match
  for (const [key, color] of Object.entries(colorMap)) {
    if (deptLower.includes(key) || key.includes(deptLower)) {
      return color;
    }
  }

  // Default color for unknown departments (using a hash function for consistency)
  const colors = [
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-cyan-100 text-cyan-800 border-cyan-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-amber-100 text-amber-800 border-amber-300',
  ];

  // Simple hash to consistently assign colors
  let hash = 0;
  for (let i = 0; i < department.length; i++) {
    hash = department.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function UserProductMatrix() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { users = [], isLoading: usersLoading } = useCompanyUsers(companyId);
  const { products = [], isLoading: productsLoading } = useOptimizedCompanyProducts(companyId || "");

  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(true);
  const [searchUser, setSearchUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [multiSelectUsers, setMultiSelectUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchProduct, setSearchProduct] = useState("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<UserProductMatrixWithDetails[]>([]);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState<boolean>(false);

  // Assignment states
  const [userProducts, setUserProducts] = useState<Record<string, Set<string>>>({});
  const [userDepartments, setUserDepartments] = useState<Record<string, Set<string>>>({});
  const [userRoles, setUserRoles] = useState<Record<string, Set<string>>>({}); // keys as `${deptId}::${role}
  const filteredProducts = useMemo(() => {
    if (searchProduct.trim() === "") {
      return products;
    }
    return products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()));
  }, [products, searchProduct]);
  // Fetch departments from company structure
  useEffect(() => {
    if (companyId) {
      const fetchDepartments = async () => {
        setLoadingDepartments(true);
        try {
          const departmentsData = await UserProductMetrixService.getCompnayDepartments(companyId);
          // Ensure we have a flat array (flatten in case service returns nested arrays)
          const flatDepartments = Array.isArray(departmentsData)
            ? departmentsData.flat().filter(Boolean)
            : [];
          setDepartments(flatDepartments);
        } catch (error) {
          console.error('Error fetching departments:', error);
          setDepartments([]);
        } finally {
          setLoadingDepartments(false);
        }
      };
      fetchDepartments();
    }
  }, [companyId]);

  // Load existing product-user access on mount
  useEffect(() => {
    if (companyId) {
      const loadExistingAccess = async () => {
        setIsLoadingAccess(true);
        try {
          const existingAccess = await UserProductMatrixService.getCompanyProductAccess(companyId);
          setUserProducts(existingAccess);
        } catch (error) {
          console.error('Error loading existing access:', error);
          toast.error('Failed to load existing product access');
        } finally {
          setIsLoadingAccess(false);
        }
      };
      loadExistingAccess();
    }
  }, [companyId]);

  // Load matrix data for table display
  useEffect(() => {
    if (companyId) {
      const loadMatrixData = async () => {
        setIsLoadingMatrix(true);
        try {
          const data = await UserProductMatrixService.getCompanyMatrix(companyId);
          setMatrixData(data);
        } catch (error) {
          console.error('Error loading matrix data:', error);
          toast.error('Failed to load matrix data');
        } finally {
          setIsLoadingMatrix(false);
        }
      };
      loadMatrixData();
    }
  }, [companyId]);

  // Refresh matrix data after save
  const refreshMatrixData = async () => {
    if (companyId) {
      setIsLoadingMatrix(true);
      try {
        const data = await UserProductMatrixService.getCompanyMatrix(companyId);
        setMatrixData(data);
      } catch (error) {
        console.error('Error refreshing matrix data:', error);
      } finally {
        setIsLoadingMatrix(false);
      }
    }
  };
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by department if selected (and not "all") - using actual department field
    if (selectedDepartment && selectedDepartment !== "all") {
      filtered = filtered.filter(u => {
        return u.department === selectedDepartment;
      });
    }

    // Filter by search term
    const term = searchUser.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(u =>
        (u.name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [users, searchUser, selectedDepartment]);

  const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId) || null, [users, selectedUserId]);
  const activeUserIds = useMemo(() => {
    if (multiSelectUsers) {
      return Array.from(selectedUserIds);
    }
    return selectedUserId ? [selectedUserId] : [];
  }, [multiSelectUsers, selectedUserId, selectedUserIds]);

  const toggleSetValue = (
    state: Record<string, Set<string>>,
    setState: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>,
    key: string,
    value: string
  ) => {
    setState(prev => {
      const next = { ...prev };
      const s = new Set(next[key] || []);
      if (s.has(value)) s.delete(value); else s.add(value);
      next[key] = s;
      return next;
    });
  };

  const haveAll = (state: Record<string, Set<string>>, keys: string[], value: string) => {
    if (keys.length === 0) return false;
    return keys.every(k => state[k]?.has(value));
  };

  const toggleForUsers = (
    state: Record<string, Set<string>>,
    setState: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>,
    keys: string[],
    value: string
  ) => {
    setState(prev => {
      const next = { ...prev };
      const allHave = keys.every(k => (next[k] || new Set()).has(value));
      for (const k of keys) {
        const s = new Set(next[k] || []);
        if (allHave) {
          s.delete(value);
        } else {
          s.add(value);
        }
        next[k] = s;
      }
      return next;
    });
  };

  // Handle save action
  const handleSave = async () => {
    if (!companyId || !user) {
      toast.error('Company ID or user information is missing');
      return;
    }

    // Collect all user-product matrix records
    const matrixRecords: Array<{
      user_id: string;
      company_id: string;
      product_ids: string[];
      department?: string | null;
      user_type: 'viewer' | 'editor' | 'manager' | 'admin' | 'owner' | 'reviewer' | 'guest';
      role_id: string | null;
      role_name: string | null;
      permissions: Record<string, boolean>;
      access_level: 'none' | 'read' | 'write' | 'full';
      is_active: boolean;
      assigned_by: string | null;
      expires_at: string | null;
      notes: string | null;
    }> = [];

    // Group by user_id and collect all their product_ids
    Object.entries(userProducts).forEach(([userId, productIdsSet]) => {
      const userRecord = users.find(u => u.id === userId);
      const productIds = Array.from(productIdsSet);

      if (productIds.length > 0) {
        matrixRecords.push({
          user_id: userId,
          company_id: companyId,
          product_ids: productIds,
          department: userRecord?.department || null,
          user_type: 'viewer', // Default to viewer, can be customized
          role_id: null,
          role_name: null,
          permissions: {},
          access_level: 'read', // Default to read access
          is_active: true,
          assigned_by: user.id,
          expires_at: null,
          notes: `Access assigned via User-Product Matrix by ${user.email}`,
        });
      }
    });

    if (matrixRecords.length === 0) {
      toast.info('No product-user assignments to save');
      return;
    }

    setIsSaving(true);
    try {
      // Get current matrix to check for duplicates and find users that need to be deactivated
      const currentMatrix = await UserProductMatrixService.getCompanyMatrix(companyId);
      
      // Check for duplicate assignments (user already has the same product)
      const duplicates: Array<{ userName: string; productName: string }> = [];
      
      matrixRecords.forEach(record => {
        const userRecord = users.find(u => u.id === record.user_id);
        const userName = userRecord?.name || userRecord?.email || record.user_id;
        
        // Find existing matrix record for this user
        const existingMatrix = currentMatrix.find(m => m.user_id === record.user_id && m.is_active);
        
        if (existingMatrix) {
          // Check each product in the new assignment
          record.product_ids.forEach(productId => {
            // If product already exists in user's product_ids array
            if (existingMatrix.product_ids.includes(productId)) {
              const product = products.find(p => p.id === productId);
              const productName = product?.name || productId;
              duplicates.push({ userName, productName });
            }
          });
        }
      });

      // Show warning if duplicates found, but allow to proceed (updates existing)
      if (duplicates.length > 0) {
        // Group duplicates by user for better display
        const duplicatesByUser = duplicates.reduce((acc, dup) => {
          if (!acc[dup.userName]) {
            acc[dup.userName] = [];
          }
          acc[dup.userName].push(dup.productName);
          return acc;
        }, {} as Record<string, string[]>);

        const duplicateMessages = Object.entries(duplicatesByUser)
          .map(([user, products]) => `${user} → ${products.join(', ')}`)
          .join(' | ');

        toast.warning(
          `Users already have these products assigned: ${duplicateMessages}. Updating existing assignments.`,
          { 
            duration: 8000
          }
        );
      }

      const currentUserIds = new Set(currentMatrix.map(m => m.user_id));
      const newUserIds = new Set(matrixRecords.map(r => r.user_id));

      // Find users that should be deactivated (had access before but no longer have any)
      const usersToDeactivate: string[] = [];
      currentUserIds.forEach(userId => {
        if (!newUserIds.has(userId)) {
          usersToDeactivate.push(userId);
        }
      });

      // Deactivate removed users
      if (usersToDeactivate.length > 0) {
        await UserProductMatrixService.deactivateMatrix(usersToDeactivate, companyId);
      }

      // Bulk upsert matrix records
      const result = await UserProductMatrixService.bulkUpsertMatrix(matrixRecords, user.id);

      if (result.errors.length > 0) {
        console.error('Some errors occurred:', result.errors);
        toast.warning(`Saved with some errors. Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`);
      } else {
        toast.success(`Successfully saved! Created: ${result.created}, Updated: ${result.updated}`);
      }

      // Refresh matrix data and local state after save
      await refreshMatrixData();
      const updatedAccess = await UserProductMatrixService.getCompanyProductAccess(companyId);
      setUserProducts(updatedAccess);
    } catch (error) {
      console.error('Error saving user-product matrix:', error);
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (usersLoading || productsLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Save Button - Fixed at top */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoadingAccess || Object.keys(userProducts).length === 0}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="h-auto flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Users</CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span>Multi-select</span>
                <Switch checked={multiSelectUsers} onCheckedChange={setMultiSelectUsers} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <div className="space-y-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments
                    .filter(dept => typeof dept === 'string' && dept.trim() !== '')
                    .map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input placeholder="Search users" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
            </div>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="space-y-1 pr-2">
                {filteredUsers.map(u => {
                  const isActive = multiSelectUsers ? selectedUserIds.has(u.id) : selectedUserId === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-muted cursor-pointer ${isActive ? "bg-muted" : ""}`}
                      onClick={() => {
                        if (multiSelectUsers) {
                          setSelectedUserIds(prev => {
                            const s = new Set(prev);
                            if (s.has(u.id)) s.delete(u.id); else s.add(u.id);
                            return s;
                          });
                        } else {
                          setSelectedUserId(u.id);
                        }
                      }}
                    >
                      {multiSelectUsers && (
                        <Checkbox
                          checked={selectedUserIds.has(u.id)}
                          onCheckedChange={() => {
                            setSelectedUserIds(prev => {
                              const s = new Set(prev);
                              if (s.has(u.id)) s.delete(u.id); else s.add(u.id);
                              return s;
                            });
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{u.name || u.email || u.id}</div>
                          {u.department && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getDepartmentBadgeColor(u.department)}`}
                            >
                              {u.department}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-sm text-muted-foreground px-2 py-4">No users found</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="h-auto flex flex-col">
          <CardHeader>
            <CardTitle className="">
              <div className="flex items-center justify-between">
                <span>Products</span>
                {multiSelectUsers ? (
                  <Badge variant="secondary">{activeUserIds.length} users selected</Badge>
                ) : selectedUser ? (
                  <Badge variant="secondary">{selectedUser.name || selectedUser.email}</Badge>
                ) : null}
              </div>
              <div className="flex items-center justify-between">
                <Input placeholder="Search products" value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-2">
                {filteredProducts.map(p => {
                  const allChecked = haveAll(userProducts, activeUserIds, p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-3 px-2 py-1 hover:bg-muted rounded">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={() => activeUserIds.length && toggleForUsers(userProducts, setUserProducts, activeUserIds, p.id)}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{p.name}</span>
                        {p.product_platform && <span className="text-xs text-muted-foreground">Platform: {p.product_platform}</span>}
                      </div>
                    </label>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <div className="text-sm text-muted-foreground px-2 py-4">No products</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Matrix Data Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>User-Product Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMatrix ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No assignments found. Select users and products above, then click "Save Changes".
                      </TableCell>
                    </TableRow>
                  ) : (
                    matrixData.map((matrix) => {
                      const productNames = matrix.product_ids
                        .map((productId: string) => {
                          const product = products.find(p => p.id === productId);
                          return product?.name || productId;
                        })
                        .filter(Boolean);

                      return (
                        <TableRow key={matrix.id}>
                          <TableCell className="font-medium">
                            {matrix.user?.first_name || matrix.user?.last_name
                              ? `${matrix.user.first_name || ''} ${matrix.user.last_name || ''}`.trim()
                              : matrix.user?.email || 'Unknown User'}
                          </TableCell>
                          <TableCell>{matrix.user?.email || 'N/A'}</TableCell>
                          <TableCell>
                            {matrix.department ? (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getDepartmentBadgeColor(matrix.department)}`}
                              >
                                {matrix.department}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {productNames.length > 0 ? (
                                productNames.map((name: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs">No products</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={matrix.is_active ? "default" : "secondary"}>
                              {matrix.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


