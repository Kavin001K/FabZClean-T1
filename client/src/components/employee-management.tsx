import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/lib/data-service';
import { useAuth } from '@/contexts/auth-context';
import {
  Plus,
  User,
  Mail,
  Phone,
  DollarSign,
  Eye,
  Edit,
  Download,
  FileText,
  Users,
  Shield,
  Trash2,
  Lock,
  Unlock,
  MoreVertical,
  Calendar,
  Building,
  Briefcase,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  hireDate: string;
  salaryType: 'hourly' | 'monthly';
  baseSalary: number;
  hourlyRate?: number;
  workingHours: number;
  status: 'active' | 'inactive' | 'terminated';
  emergencyContact: string;
  qualifications: string;
  notes: string;
  createdAt: string;
  role: string;
}

export default function EmployeeManagement() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();
  const { employee: currentUser } = useAuth();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Form state
  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    hireDate: '',
    salaryType: 'monthly' as 'hourly' | 'monthly',
    baseSalary: '',
    hourlyRate: '',
    workingHours: '8',
    emergencyContact: '',
    qualifications: '',
    notes: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    franchiseId: ''
  });

  // Fetch franchises (Admin only)
  const { data: franchises } = useQuery({
    queryKey: ['franchises'],
    queryFn: async () => {
      const res = await fetch("/api/franchises");
      if (!res.ok) throw new Error("Failed to fetch franchises");
      return res.json();
    },
    enabled: currentUser?.role === 'admin'
  });

  // Fetch employees
  const { data: employeesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.getAll(),
  });

  // Ensure employees is always an array
  const employees = React.useMemo(() => {
    if (!employeesData) return [];
    return Array.isArray(employeesData) ? employeesData : [];
  }, [employeesData]);

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => employeesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Employee created successfully" });
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to create employee", variant: "destructive" });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEditDialogOpen(false);
      toast({ title: "Success", description: "Employee updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update employee", variant: "destructive" });
    }
  });

  // Delete mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({ title: "User Deleted", description: "The user has been permanently removed from the system." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to delete employee", variant: "destructive" });
    }
  });

  // Revoke/Restore access mutation
  const toggleAccessMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      employeesApi.update(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      const action = variables.status === 'inactive' ? 'revoked' : 'restored';
      toast({
        title: `Access ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        description: `User access has been ${action} successfully.`
      });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update access", variant: "destructive" });
    }
  });

  // View user handler
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  // Delete user handler
  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteEmployeeMutation.mutate(selectedEmployee.id);
    }
  };

  // Toggle access (revoke/restore)
  const handleToggleAccess = (employee: Employee) => {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    toggleAccessMutation.mutate({ id: employee.id, status: newStatus });
  };


  const departments = ['Operations', 'Logistics', 'Customer Service', 'Quality Control', 'Management'];
  const positions = [
    'Dry Cleaning Specialist', 'Driver', 'Customer Service Representative',
    'Quality Inspector', 'Machine Operator', 'Supervisor', 'Manager'
  ];

  // Determine available roles based on current user
  // Determine available roles based on current user
  const getAvailableRoles = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return ['admin', 'franchise_manager', 'factory_manager', 'employee', 'driver'];
    }
    if (currentUser.role === 'franchise_manager') {
      return ['factory_manager', 'employee', 'driver'];
    }
    if (currentUser.role === 'factory_manager') {
      return ['employee', 'driver'];
    }
    return [];
  };

  const resetForm = () => {
    setEmployeeForm({
      fullName: '', email: '', phone: '', address: '', position: '', department: '',
      hireDate: '', salaryType: 'monthly', baseSalary: '', hourlyRate: '',
      workingHours: '8', emergencyContact: '', qualifications: '', notes: '',
      password: '', confirmPassword: '', role: 'employee', franchiseId: ''
    });
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  const handleCreateEmployee = () => {
    // Personal Info validation
    if (!employeeForm.fullName || !employeeForm.email || !employeeForm.phone) {
      setActiveTab("personal");
      toast({ title: "Validation Error", description: "Please fill in all required fields in Personal Info.", variant: "destructive" });
      return;
    }

    // Work Details validation
    if (!employeeForm.position || !employeeForm.department || !employeeForm.hireDate) {
      setActiveTab("work");
      toast({ title: "Validation Error", description: "Please fill in all required fields in Work Details.", variant: "destructive" });
      return;
    }

    // Compensation validation
    if (employeeForm.salaryType === 'monthly' && !employeeForm.baseSalary) {
      setActiveTab("compensation");
      toast({ title: "Validation Error", description: "Base Salary is required for monthly employees.", variant: "destructive" });
      return;
    }

    if (employeeForm.salaryType === 'hourly' && !employeeForm.hourlyRate) {
      setActiveTab("compensation");
      toast({ title: "Validation Error", description: "Hourly Rate is required for hourly employees.", variant: "destructive" });
      return;
    }

    // Security validation
    if (!employeeForm.password || !employeeForm.confirmPassword) {
      setActiveTab("security");
      toast({ title: "Validation Error", description: "Password is required.", variant: "destructive" });
      return;
    }

    if (employeeForm.password !== employeeForm.confirmPassword) {
      setActiveTab("security");
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    createEmployeeMutation.mutate({
      username: employeeForm.email, // Use email as username
      fullName: employeeForm.fullName,
      email: employeeForm.email,
      phone: employeeForm.phone,
      address: employeeForm.address,
      position: employeeForm.position,
      department: employeeForm.department,
      hireDate: new Date(employeeForm.hireDate),
      salaryType: employeeForm.salaryType,
      salary: employeeForm.salaryType === 'monthly' ? parseFloat(employeeForm.baseSalary) : 0, // Map to 'salary' column
      hourlyRate: employeeForm.salaryType === 'hourly' ? parseFloat(employeeForm.hourlyRate) : undefined,
      workingHours: parseInt(employeeForm.workingHours),
      status: 'active',
      emergencyContact: employeeForm.emergencyContact,
      qualifications: employeeForm.qualifications,
      notes: employeeForm.notes,
      role: employeeForm.role,
      password: employeeForm.password,
      franchiseId: employeeForm.franchiseId || null
    } as any);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      position: employee.position,
      department: employee.department,
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
      salaryType: employee.salaryType,
      baseSalary: (employee as any).salary?.toString() || employee.baseSalary?.toString() || '', // Handle both salary and baseSalary
      hourlyRate: employee.hourlyRate?.toString() || '',
      workingHours: employee.workingHours?.toString() || '8',
      emergencyContact: employee.emergencyContact,
      qualifications: employee.qualifications,
      notes: employee.notes,
      password: '',
      confirmPassword: '',
      role: employee.role,
      franchiseId: (employee as any).franchiseId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!selectedEmployee) return;

    updateEmployeeMutation.mutate({
      id: selectedEmployee.id,
      data: {
        fullName: employeeForm.fullName,
        email: employeeForm.email,
        phone: employeeForm.phone,
        address: employeeForm.address,
        position: employeeForm.position,
        department: employeeForm.department,
        hireDate: new Date(employeeForm.hireDate),
        salaryType: employeeForm.salaryType,
        salary: employeeForm.salaryType === 'monthly' ? parseFloat(employeeForm.baseSalary) : 0, // Map to 'salary' column
        hourlyRate: employeeForm.salaryType === 'hourly' ? parseFloat(employeeForm.hourlyRate) : undefined,
        workingHours: parseInt(employeeForm.workingHours),
        emergencyContact: employeeForm.emergencyContact,
        qualifications: employeeForm.qualifications,
        notes: employeeForm.notes,
        role: employeeForm.role,
        franchiseId: employeeForm.franchiseId || null
      }
    });
  };

  const exportAttendanceData = () => {
    // Generate CSV data
    const csvData = employees.map((emp: any) => ({
      'Employee ID': emp.employeeId,
      'Name': emp.fullName,
      'Role': emp.role,
      'Position': emp.position,
      'Department': emp.department,
      'Hire Date': emp.hireDate,
      'Salary Type': emp.salaryType,
      'Base Salary': emp.baseSalary,
      'Hourly Rate': emp.hourlyRate || 'N/A',
      'Working Hours': emp.workingHours,
      'Status': emp.status
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: "Export Successful", description: "Employee data has been exported successfully." });
    setIsExportDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage system users, employees, and their access roles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) setActiveTab("personal");
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Create New User
                </DialogTitle>
                <DialogDescription>
                  Enter details to create a new user account.
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="work">Work Details</TabsTrigger>
                  <TabsTrigger value="compensation">Compensation</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={employeeForm.fullName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={employeeForm.email}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={employeeForm.phone}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        placeholder="Name and phone number"
                        value={employeeForm.emergencyContact}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyContact: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter full address"
                      value={employeeForm.address}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                    />
                  </div>
                </TabsContent>

                {/* Work Details Tab */}
                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Franchise Selection (Admin Only) */}
                    {currentUser?.role === 'admin' && (
                      <div className="space-y-2">
                        <Label htmlFor="franchise">Franchise (Optional for Admin/Global)</Label>
                        <Select
                          value={employeeForm.franchiseId || "none"}
                          onValueChange={(value) => setEmployeeForm({ ...employeeForm, franchiseId: value === "none" ? "" : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Franchise" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Global/HQ)</SelectItem>
                            {franchises?.filter((f: any) => f.id).map((franchise: any) => (
                              <SelectItem key={franchise.id} value={franchise.id}>
                                {franchise.name} ({franchise.franchiseId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="role">System Role *</Label>
                      <Select value={employeeForm.role} onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map((role) => (
                            <SelectItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={employeeForm.department} onValueChange={(value) => setEmployeeForm({ ...employeeForm, department: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position *</Label>
                      <Select value={employeeForm.position} onValueChange={(value) => setEmployeeForm({ ...employeeForm, position: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((position) => (
                            <SelectItem key={position} value={position}>{position}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={employeeForm.hireDate}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Compensation Tab */}
                <TabsContent value="compensation" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryType">Salary Type *</Label>
                    <Select value={employeeForm.salaryType} onValueChange={(value: 'hourly' | 'monthly') => setEmployeeForm({ ...employeeForm, salaryType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Salary</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {employeeForm.salaryType === 'monthly' ? (
                    <div className="space-y-2">
                      <Label htmlFor="baseSalary">Monthly Salary (₹) *</Label>
                      <Input
                        id="baseSalary"
                        type="number"
                        placeholder="Enter monthly salary"
                        value={employeeForm.baseSalary}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (₹) *</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        placeholder="Enter hourly rate"
                        value={employeeForm.hourlyRate}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, hourlyRate: e.target.value })}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={employeeForm.password}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={employeeForm.confirmPassword}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateEmployee} className="flex-1" disabled={createEmployeeMutation.isPending}>
                  {createEmployeeMutation.isPending ? "Creating..." : "Create User"}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Directory ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : isError ? (
            <div className="text-center py-8 text-red-500">
              <p className="mb-2">Failed to load users.</p>
              <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message}</p>
              <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {employees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                employees.map((employee: any) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${employee.status === 'active' ? 'bg-primary' : 'bg-muted'
                        }`}>
                        <span className={`text-lg font-medium ${employee.status === 'active' ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}>
                          {employee.fullName ? employee.fullName.split(' ').map((n: string) => n[0]).join('') : 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{employee.fullName}</h3>
                          <Badge variant="outline" className="ml-2">
                            <Shield className="w-3 h-3 mr-1" />
                            {employee.role}
                          </Badge>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status === 'active' ? 'Active' : employee.status === 'inactive' ? 'Revoked' : employee.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {employee.position} • {employee.department} • {employee.employeeId}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {employee.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick action buttons */}
                      <Button variant="ghost" size="sm" onClick={() => handleViewEmployee(employee)} title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEmployee(employee)} title="Edit User">
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* Dropdown for more actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleAccess(employee)}
                            className={employee.status === 'active' ? 'text-amber-600' : 'text-green-600'}
                          >
                            {employee.status === 'active' ? (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Revoke Access
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Restore Access
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteEmployee(employee)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="work">Work Details</TabsTrigger>
              <TabsTrigger value="compensation">Compensation</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter full name"
                    value={employeeForm.fullName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="Enter email address"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input
                    id="edit-phone"
                    placeholder="Enter phone number"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                  <Input
                    id="edit-emergencyContact"
                    placeholder="Name and phone number"
                    value={employeeForm.emergencyContact}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, emergencyContact: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  placeholder="Enter full address"
                  value={employeeForm.address}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                />
              </div>
            </TabsContent>

            {/* Work Details Tab */}
            <TabsContent value="work" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">System Role *</Label>
                  <Select value={employeeForm.role} onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((role) => (
                        <SelectItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select value={employeeForm.department} onValueChange={(value) => setEmployeeForm({ ...employeeForm, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-position">Position *</Label>
                  <Select value={employeeForm.position} onValueChange={(value) => setEmployeeForm({ ...employeeForm, position: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position} value={position}>{position}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hireDate">Hire Date *</Label>
                  <Input
                    id="edit-hireDate"
                    type="date"
                    value={employeeForm.hireDate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Compensation Tab */}
            <TabsContent value="compensation" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-salaryType">Salary Type *</Label>
                <Select value={employeeForm.salaryType} onValueChange={(value: 'hourly' | 'monthly') => setEmployeeForm({ ...employeeForm, salaryType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly Salary</SelectItem>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {employeeForm.salaryType === 'monthly' ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-baseSalary">Monthly Salary (₹) *</Label>
                  <Input
                    id="edit-baseSalary"
                    type="number"
                    placeholder="Enter monthly salary"
                    value={employeeForm.baseSalary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-hourlyRate">Hourly Rate (₹) *</Label>
                  <Input
                    id="edit-hourlyRate"
                    type="number"
                    placeholder="Enter hourly rate"
                    value={employeeForm.hourlyRate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, hourlyRate: e.target.value })}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="pt-4">
            <Button onClick={handleUpdateEmployee} className="w-full" disabled={updateEmployeeMutation.isPending}>
              {updateEmployeeMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about this user account.
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedEmployee.status === 'active' ? 'bg-primary' : 'bg-muted border-2 border-muted-foreground/30'
                  }`}>
                  <span className={`text-2xl font-bold ${selectedEmployee.status === 'active' ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}>
                    {selectedEmployee.fullName ? selectedEmployee.fullName.split(' ').map((n: string) => n[0]).join('') : 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedEmployee.fullName}</h3>
                  <p className="text-muted-foreground">{selectedEmployee.position}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedEmployee.role?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(selectedEmployee.status)}>
                      {selectedEmployee.status === 'active' ? 'Active' : selectedEmployee.status === 'inactive' ? 'Access Revoked' : selectedEmployee.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{selectedEmployee.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">{selectedEmployee.address || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Emergency Contact:</span>
                    <p className="font-medium">{selectedEmployee.emergencyContact || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Work Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Employee ID:</span>
                    <p className="font-medium font-mono">{selectedEmployee.employeeId}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium">{selectedEmployee.department}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hire Date:</span>
                    <p className="font-medium">{selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Working Hours:</span>
                    <p className="font-medium">{selectedEmployee.workingHours || 8} hours/day</p>
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Compensation
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Salary Type:</span>
                    <p className="font-medium capitalize">{selectedEmployee.salaryType || 'Monthly'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {selectedEmployee.salaryType === 'hourly' ? 'Hourly Rate:' : 'Monthly Salary:'}
                    </span>
                    <p className="font-medium text-primary">
                      {selectedEmployee.salaryType === 'hourly'
                        ? `₹${selectedEmployee.hourlyRate || 0}/hr`
                        : `₹${(selectedEmployee as any).salary || selectedEmployee.baseSalary || 0}/month`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedEmployee.notes && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Notes
                  </h4>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedEmployee.notes}</p>
                </div>
              )}

              {/* Actions */}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => { setIsViewDialogOpen(false); handleEditEmployee(selectedEmployee); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User Permanently
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete <strong>{selectedEmployee?.fullName}</strong>?
                  This action cannot be undone.
                </p>
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    <strong>Warning:</strong> This will permanently remove:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside mt-2">
                    <li>User account and login credentials</li>
                    <li>All associated activity logs</li>
                    <li>Task and assignment history</li>
                  </ul>
                </div>
                <p className="text-sm">
                  Consider <strong>revoking access</strong> instead if you want to preserve historical data.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteEmployeeMutation.isPending}
            >
              {deleteEmployeeMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

