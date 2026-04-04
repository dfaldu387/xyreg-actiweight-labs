import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Users, Search, Building2, Mail, Calendar, Activity, ChevronUp, ChevronDown, ArrowUpDown, KeyRound } from "lucide-react";
import { GlobalPasswordPolicySettings } from "@/components/settings/GlobalPasswordPolicySettings";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  created_at: string;
  status: 'active' | 'inactive' | 'never';
  last_login?: string | null;
  companies?: Array<{
    company_id: string;
    company_name: string;
    access_level: string;
    is_internal: boolean;
    is_primary: boolean;
  }>;
}

interface RawUserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  companies: Array<{
    company_id: string;
    company_name: string;
    access_level: string;
    is_internal: boolean;
    is_primary: boolean;
  }>;
}

export default function SuperAdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCompaniesModal, setShowCompaniesModal] = useState(false);
  const [showPasswordPolicy, setShowPasswordPolicy] = useState(false);

  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'company' | 'created_at' | 'status' | 'last_login'>('last_login');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const isSuperAdmin = user?.user_metadata?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Access denied. Super admin privileges required.');
      return;
    }
    fetchUsers();
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('fetch_all_users_with_companies' as any);

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }

      const rawData = data as RawUserData[];
      // Fetch archived company IDs to filter them out
      const { data: archivedCompanies } = await supabase
        .from('companies')
        .select('id')
        .eq('is_archived', true);
      const archivedIds = new Set((archivedCompanies || []).map(c => c.id));

      // Fetch last login times from audit trail
      const { data: loginLogs } = await supabase
        .from('audit_trail_logs')
        .select('user_id, created_at')
        .eq('action', 'login')
        .order('created_at', { ascending: false });

      const lastLoginMap = new Map<string, string>();
      if (loginLogs) {
        for (const log of loginLogs) {
          if (log.user_id && !lastLoginMap.has(log.user_id)) {
            lastLoginMap.set(log.user_id, log.created_at);
          }
        }
      }

      const now = Date.now();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

      const transformedUsers: User[] = rawData.map((user: RawUserData) => {
        const lastLogin = lastLoginMap.get(user.id) || null;
        let status: User['status'] = 'active';

        if (lastLogin) {
          const daysSinceLogin = now - new Date(lastLogin).getTime();
          status = daysSinceLogin > THIRTY_DAYS ? 'inactive' : 'active';
        } else {
          const accountAge = now - new Date(user.created_at).getTime();
          status = accountAge > SEVEN_DAYS ? 'never' : 'active';
        }

        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: user.role || 'user',
          created_at: user.created_at,
          status,
          last_login: lastLogin,
          companies: (user.companies || []).filter(c => !archivedIds.has(c.company_id)),
        };
      });

      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (user) {
        setUsers([{
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name,
          last_name: user.user_metadata?.last_name,
          role: user.user_metadata?.role,
          created_at: (user as any).created_at || new Date().toISOString(),
          status: 'active' as const,
          companies: []
        }]);
      }
      toast.error('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedUsers = (usersToSort: User[]) => {
    return [...usersToSort].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      switch (sortField) {
        case 'name':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'No Name';
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim() || 'No Name';
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'company':
          aValue = a.companies?.[0]?.company_name || '';
          bValue = b.companies?.[0]?.company_name || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'last_login':
          aValue = a.last_login ? new Date(a.last_login).getTime() : 0;
          bValue = b.last_login ? new Date(b.last_login).getTime() : 0;
          break;
        default:
          aValue = '';
          bValue = '';
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });
  };

  const filteredUsers = getSortedUsers(users.filter(u => {
    if (u.role === 'super_admin') return false;
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesCompany = companyFilter === 'all' ||
                          (u.companies && u.companies.some(c => c.company_name === companyFilter));
    return matchesSearch && matchesRole && matchesStatus && matchesCompany;
  }));

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, statusFilter, companyFilter]);

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDirection === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5" />;
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-50 text-red-700 border-red-200';
      case 'expert': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'editor': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'company_user': return 'bg-green-50 text-green-700 border-green-200';
      case 'super_admin': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const uniqueRoles = React.useMemo(() => {
    return users
      .map(u => u.role)
      .filter((role): role is string => !!role)
      .filter((role, i, arr) => arr.indexOf(role) === i)
      .sort();
  }, [users]);

  const uniqueCompanies = React.useMemo(() => {
    return users
      .flatMap(u => u.companies || [])
      .filter(c => c.company_name)
      .map(c => c.company_name)
      .filter((name, i, arr) => arr.indexOf(name) === i)
      .sort();
  }, [users]);

  if (!isSuperAdmin) return null;

  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="w-full px-4 py-3 space-y-3">
      {/* Page Header — compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} users — {activeCount} active
          </p>
        </div>
        <Button variant="outline" className="bg-background" size="sm" onClick={() => setShowPasswordPolicy(true)}>
          <KeyRound className="h-4 w-4 mr-2" />
          Password Policy
        </Button>
      </div>

      {/* Filters + Table wrapper */}
      <div className="rounded-lg space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9 h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {uniqueCompanies.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="never">Never</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || roleFilter !== 'all' || companyFilter !== 'all' || statusFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => { setSearchTerm(''); setRoleFilter('all'); setCompanyFilter('all'); setStatusFilter('all'); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <button onClick={() => handleSort('name')} className="flex items-center gap-1.5 font-medium">
                  User {renderSortIcon('name')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('role')} className="flex items-center gap-1.5 font-medium">
                  Role {renderSortIcon('role')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('company')} className="flex items-center gap-1.5 font-medium">
                  Company {renderSortIcon('company')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('last_login')} className="flex items-center gap-1.5 font-medium">
                  Last Login {renderSortIcon('last_login')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 font-medium">
                  Status {renderSortIcon('status')}
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleSort('created_at')} className="flex items-center gap-1.5 font-medium">
                  Created {renderSortIcon('created_at')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((u) => {
                const allCompanies = u.companies?.filter(c => c.company_name) || [];
                const displayCompany = allCompanies.find(c => c.is_primary) || allCompanies[0];
                const moreCount = allCompanies.length - 1;

                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : 'No Name'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getRoleBadgeVariant(u.role)}`}>
                        {u.role ? u.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'No Role'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {displayCompany ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">{displayCompany.company_name}</span>
                          {moreCount > 0 && (
                            <button
                              onClick={() => { setSelectedUser(u); setShowCompaniesModal(true); }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              +{moreCount} more
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {u.last_login
                          ? <>
                              {new Date(u.last_login).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              <span className="text-xs text-muted-foreground ml-1">
                                {new Date(u.last_login).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          : '—'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          u.status === 'active' ? 'bg-green-500' :
                          u.status === 'inactive' ? 'bg-orange-400' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-sm">
                          {u.status === 'active' ? 'Active' :
                           u.status === 'inactive' ? 'Inactive' :
                           'Never'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        <span className="text-xs text-muted-foreground ml-1">
                          {new Date(u.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-16 py-2.5 border-t text-sm text-slate-700">
          <span>
            Showing {filteredUsers.length} users · Page {currentPage}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-[65px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span>Page {currentPage}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronUp className="h-4 w-4 -rotate-90" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Password Policy Dialog */}
      {showPasswordPolicy && (
        <Dialog open={showPasswordPolicy} onOpenChange={setShowPasswordPolicy}>
          <DialogContent className="max-w-lg p-0 gap-0">
            <GlobalPasswordPolicySettings />
          </DialogContent>
        </Dialog>
      )}

      {/* Companies Modal — simple */}
      <Dialog open={showCompaniesModal} onOpenChange={setShowCompaniesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Company Access</DialogTitle>
            <DialogDescription>
              {selectedUser?.first_name && selectedUser?.last_name
                ? `${selectedUser.first_name} ${selectedUser.last_name}`
                : selectedUser?.email
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {selectedUser?.companies?.filter(c => c.company_name).map((company, i) => (
              <div key={company.company_id || i} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{company.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {company.access_level || 'Standard'} — {company.is_internal ? 'Internal' : 'External'}
                  </p>
                </div>
                {company.is_primary && (
                  <Badge variant="outline" className="text-xs">Primary</Badge>
                )}
              </div>
            ))}
            {(!selectedUser?.companies || selectedUser.companies.filter(c => c.company_name).length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No company access</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
