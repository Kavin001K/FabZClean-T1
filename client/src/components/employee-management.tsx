import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Shield
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

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
    role: 'employee'
  });

  // Fetch employees
  const { data: employeesData, isLoading } = useQuery({
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
      toast({ title: "Error", description: "Failed to create employee", variant: "destructive" });
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
      toast({ title: "Error", description: "Failed to update employee", variant: "destructive" });
    }
  });

  const departments = ['Operations', 'Logistics', 'Customer Service', 'Quality Control', 'Management'];
  const positions = [
    'Dry Cleaning Specialist', 'Driver', 'Customer Service Representative',
    'Quality Inspector', 'Machine Operator', 'Supervisor', 'Manager'
  ];

  // Determine available roles based on current user
  const getAvailableRoles = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return ['admin', 'franchise_manager', 'factory_manager', 'employee', 'driver'];
    }
    if (['franchise_manager', 'factory_manager'].includes(currentUser.role)) {
      return ['employee', 'driver'];
    }
    return [];
  };

  const resetForm = () => {
    setEmployeeForm({
      fullName: '', email: '', phone: '', address: '', position: '', department: '',
      hireDate: '', salaryType: 'monthly', baseSalary: '', hourlyRate: '',
      workingHours: '8', emergencyContact: '', qualifications: '', notes: '',
      password: '', confirmPassword: '', role: 'employee'
    });
  };

  const handleCreateEmployee = () => {
    if (!employeeForm.fullName || !employeeForm.email || !employeeForm.phone || !employeeForm.position) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (employeeForm.password !== employeeForm.confirmPassword) {
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
      baseSalary: employeeForm.salaryType === 'monthly' ? parseFloat(employeeForm.baseSalary) : 0,
      hourlyRate: employeeForm.salaryType === 'hourly' ? parseFloat(employeeForm.hourlyRate) : undefined,
      workingHours: parseInt(employeeForm.workingHours),
      status: 'active',
      emergencyContact: employeeForm.emergencyContact,
      qualifications: employeeForm.qualifications,
      notes: employeeForm.notes,
      role: employeeForm.role,
      password: employeeForm.password
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
      baseSalary: employee.baseSalary?.toString() || '',
      hourlyRate: employee.hourlyRate?.toString() || '',
      workingHours: employee.workingHours?.toString() || '8',
      emergencyContact: employee.emergencyContact,
      qualifications: employee.qualifications,
      notes: employee.notes,
      password: '',
      confirmPassword: '',
      role: employee.role
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
        baseSalary: employeeForm.salaryType === 'monthly' ? parseFloat(employeeForm.baseSalary) : 0,
        hourlyRate: employeeForm.salaryType === 'hourly' ? parseFloat(employeeForm.hourlyRate) : undefined,
        workingHours: parseInt(employeeForm.workingHours),
        emergencyContact: employeeForm.emergencyContact,
        qualifications: employeeForm.qualifications,
        notes: employeeForm.notes,
        role: employeeForm.role
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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

              <Tabs defaultValue="personal" className="space-y-4">
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
          ) : (
            <div className="space-y-4">
              {employees.map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-primary-foreground">
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
                          {employee.status}
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
                    <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={employeeForm.fullName}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={employeeForm.role} onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleUpdateEmployee} className="w-full" disabled={updateEmployeeMutation.isPending}>
              {updateEmployeeMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
