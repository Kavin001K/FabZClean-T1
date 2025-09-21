import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign,
  Clock,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  FileText,
  Users,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
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
}

interface EmployeeManagementProps {
  onEmployeeCreated?: (employee: Employee) => void;
  onEmployeeUpdated?: (employee: Employee) => void;
}

export default function EmployeeManagement({ onEmployeeCreated, onEmployeeUpdated }: EmployeeManagementProps) {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Form state
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
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
    confirmPassword: ''
  });

  // Demo employee data
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      employeeId: 'EMP-001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@fabzclean.com',
      phone: '+91 98765 43210',
      address: '123 Main St, Bangalore, KA 560001',
      position: 'Dry Cleaning Specialist',
      department: 'Operations',
      hireDate: '2024-01-15',
      salaryType: 'monthly',
      baseSalary: 45000,
      workingHours: 8,
      status: 'active',
      emergencyContact: 'John Johnson - +91 98765 43211',
      qualifications: 'Bachelor in Textile Engineering, 3 years experience',
      notes: 'Excellent performance, team player',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      employeeId: 'EMP-002',
      name: 'Mike Chen',
      email: 'mike.chen@fabzclean.com',
      phone: '+91 98765 43212',
      address: '456 Oak Ave, Bangalore, KA 560002',
      position: 'Delivery Driver',
      department: 'Logistics',
      hireDate: '2024-02-01',
      salaryType: 'hourly',
      baseSalary: 0,
      hourlyRate: 250,
      workingHours: 8,
      status: 'active',
      emergencyContact: 'Lisa Chen - +91 98765 43213',
      qualifications: 'Valid Driving License, 5 years experience',
      notes: 'Reliable driver, good customer service',
      createdAt: '2024-02-01T00:00:00Z'
    }
  ]);

  const departments = ['Operations', 'Logistics', 'Customer Service', 'Quality Control', 'Management'];
  const positions = [
    'Dry Cleaning Specialist', 'Driver', 'Customer Service Representative', 
    'Quality Inspector', 'Machine Operator', 'Supervisor', 'Manager'
  ];

  const handleCreateEmployee = () => {
    // Validation
    if (!employeeForm.name || !employeeForm.email || !employeeForm.phone || !employeeForm.position) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (employeeForm.password !== employeeForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      employeeId: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      name: employeeForm.name,
      email: employeeForm.email,
      phone: employeeForm.phone,
      address: employeeForm.address,
      position: employeeForm.position,
      department: employeeForm.department,
      hireDate: employeeForm.hireDate,
      salaryType: employeeForm.salaryType,
      baseSalary: employeeForm.salaryType === 'monthly' ? parseFloat(employeeForm.baseSalary) : 0,
      hourlyRate: employeeForm.salaryType === 'hourly' ? parseFloat(employeeForm.hourlyRate) : undefined,
      workingHours: parseInt(employeeForm.workingHours),
      status: 'active',
      emergencyContact: employeeForm.emergencyContact,
      qualifications: employeeForm.qualifications,
      notes: employeeForm.notes,
      createdAt: new Date().toISOString()
    };

    setEmployees([...employees, newEmployee]);
    onEmployeeCreated?.(newEmployee);

    addNotification({
      type: 'success',
      title: 'Employee Created Successfully!',
      message: `${newEmployee.name} has been added to the system with ID ${newEmployee.employeeId}`,
    });

    toast({
      title: "Employee Created",
      description: `${newEmployee.name} has been successfully added.`,
    });

    // Reset form
    setEmployeeForm({
      name: '', email: '', phone: '', address: '', position: '', department: '',
      hireDate: '', salaryType: 'monthly', baseSalary: '', hourlyRate: '',
      workingHours: '8', emergencyContact: '', qualifications: '', notes: '',
      password: '', confirmPassword: ''
    });
    setIsCreateDialogOpen(false);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      position: employee.position,
      department: employee.department,
      hireDate: employee.hireDate,
      salaryType: employee.salaryType,
      baseSalary: employee.baseSalary.toString(),
      hourlyRate: employee.hourlyRate?.toString() || '',
      workingHours: employee.workingHours.toString(),
      emergencyContact: employee.emergencyContact,
      qualifications: employee.qualifications,
      notes: employee.notes,
      password: '',
      confirmPassword: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!selectedEmployee) return;

    const updatedEmployee: Employee = {
      ...selectedEmployee,
      name: employeeForm.name,
      email: employeeForm.email,
      phone: employeeForm.phone,
      address: employeeForm.address,
      position: employeeForm.position,
      department: employeeForm.department,
      hireDate: employeeForm.hireDate,
      salaryType: employeeForm.salaryType,
      baseSalary: employeeForm.salaryType === 'monthly' ? parseFloat(employeeForm.baseSalary) : 0,
      hourlyRate: employeeForm.salaryType === 'hourly' ? parseFloat(employeeForm.hourlyRate) : undefined,
      workingHours: parseInt(employeeForm.workingHours),
      emergencyContact: employeeForm.emergencyContact,
      qualifications: employeeForm.qualifications,
      notes: employeeForm.notes
    };

    setEmployees(employees.map(emp => emp.id === selectedEmployee.id ? updatedEmployee : emp));
    onEmployeeUpdated?.(updatedEmployee);

    toast({
      title: "Employee Updated",
      description: `${updatedEmployee.name}'s information has been updated.`,
    });

    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const exportAttendanceData = () => {
    // Generate CSV data
    const csvData = employees.map(emp => ({
      'Employee ID': emp.employeeId,
      'Name': emp.name,
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
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Employee data has been exported successfully.",
    });

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
          <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-muted-foreground">
            Manage your team members, their information, and compensation
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
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Create New Employee
                </DialogTitle>
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
                        value={employeeForm.name}
                        onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={employeeForm.email}
                        onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
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
                        onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        placeholder="Name and phone number"
                        value={employeeForm.emergencyContact}
                        onChange={(e) => setEmployeeForm({...employeeForm, emergencyContact: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter full address"
                      value={employeeForm.address}
                      onChange={(e) => setEmployeeForm({...employeeForm, address: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications & Experience</Label>
                    <Textarea
                      id="qualifications"
                      placeholder="Educational background, certifications, work experience..."
                      value={employeeForm.qualifications}
                      onChange={(e) => setEmployeeForm({...employeeForm, qualifications: e.target.value})}
                    />
                  </div>
                </TabsContent>

                {/* Work Details Tab */}
                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Position *</Label>
                      <Select value={employeeForm.position} onValueChange={(value) => setEmployeeForm({...employeeForm, position: value})}>
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
                      <Label htmlFor="department">Department</Label>
                      <Select value={employeeForm.department} onValueChange={(value) => setEmployeeForm({...employeeForm, department: value})}>
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
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={employeeForm.hireDate}
                        onChange={(e) => setEmployeeForm({...employeeForm, hireDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workingHours">Working Hours per Day</Label>
                      <Input
                        id="workingHours"
                        type="number"
                        placeholder="8"
                        value={employeeForm.workingHours}
                        onChange={(e) => setEmployeeForm({...employeeForm, workingHours: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes about the employee..."
                      value={employeeForm.notes}
                      onChange={(e) => setEmployeeForm({...employeeForm, notes: e.target.value})}
                    />
                  </div>
                </TabsContent>

                {/* Compensation Tab */}
                <TabsContent value="compensation" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="salaryType">Salary Type *</Label>
                    <Select value={employeeForm.salaryType} onValueChange={(value: 'hourly' | 'monthly') => setEmployeeForm({...employeeForm, salaryType: value})}>
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
                        onChange={(e) => setEmployeeForm({...employeeForm, baseSalary: e.target.value})}
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
                        onChange={(e) => setEmployeeForm({...employeeForm, hourlyRate: e.target.value})}
                      />
                    </div>
                  )}
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Salary Calculation Preview</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{employeeForm.salaryType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>
                          {employeeForm.salaryType === 'monthly' 
                            ? formatCurrency(parseFloat(employeeForm.baseSalary || '0'))
                            : `₹${employeeForm.hourlyRate || '0'}/hour`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Working Hours:</span>
                        <span>{employeeForm.workingHours} hours/day</span>
                      </div>
                      {employeeForm.salaryType === 'hourly' && employeeForm.hourlyRate && (
                        <div className="flex justify-between">
                          <span>Daily Wage:</span>
                          <span>{formatCurrency(parseFloat(employeeForm.hourlyRate) * parseInt(employeeForm.workingHours))}</span>
                        </div>
                      )}
                    </div>
                  </div>
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
                        onChange={(e) => setEmployeeForm({...employeeForm, password: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={employeeForm.confirmPassword}
                        onChange={(e) => setEmployeeForm({...employeeForm, confirmPassword: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-400">Security Information</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Employee will use this password to login to their dashboard</li>
                      <li>• They can change their password after first login</li>
                      <li>• Password should be at least 8 characters long</li>
                      <li>• Employee ID will be auto-generated</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateEmployee} className="flex-1">
                  Create Employee
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
            Employee Directory ({employees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-primary-foreground">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{employee.name}</h3>
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
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {employee.salaryType === 'monthly' 
                          ? formatCurrency(employee.baseSalary) + '/month'
                          : `₹${employee.hourlyRate}/hour`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Employee: {selectedEmployee?.name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Similar form structure as create, but with update functionality */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                />
              </div>
            </div>
            
            {/* Add more form fields as needed */}
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateEmployee} className="flex-1">
                Update Employee
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Employee Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export all employee information including personal details, work information, and compensation data.
            </p>
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Export Options</h4>
              <ul className="text-sm space-y-1">
                <li>• Employee personal information</li>
                <li>• Work details and position</li>
                <li>• Salary and compensation data</li>
                <li>• Hire date and status</li>
                <li>• Contact information</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={exportAttendanceData} className="flex-1">
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
